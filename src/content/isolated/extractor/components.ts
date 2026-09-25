// Phase 3: Component Detection Engine

import { Component, ComponentLabel, DetectionSignal, BoundingBox, SignalType } from "../../../shared/types";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getStructureSignature(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const childSigs = Array.from(el.children)
    .map(child => getStructureSignature(child))
    .join(",");
  return childSigs ? `${tag}(${childSigs})` : tag;
}

const SEMANTIC_TAGS = new Set(["button", "nav", "input", "form", "header", "footer", "dialog", "select", "textarea", "table"]);
const ARIA_ROLES = new Set(["button", "navigation", "dialog", "banner", "tab", "tablist", "menu", "alert"]);
const CLASS_KEYWORDS = ["btn", "card", "badge", "modal", "chip", "tag", "hero", "avatar", "dropdown", "nav", "tab", "alert"];

function getElementScore(el: Element, repeatedSignatures: Set<string>): { score: number, signals: DetectionSignal[], label: ComponentLabel } {
  let score = 0;
  const signals: DetectionSignal[] = [];
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role") || "";
  const className = el.className;
  const classStr = typeof className === "string" ? className.toLowerCase() : "";

  let matchedLabel: ComponentLabel = "unknown";

  // 1. Semantic HTML (0.35)
  if (SEMANTIC_TAGS.has(tag)) {
    score += 0.35;
    signals.push({ type: "semantic-html", score: 0.35, detail: `tagName=${tag}` });
    matchedLabel = tag as ComponentLabel;
  }

  // 2. ARIA Roles (0.25)
  if (ARIA_ROLES.has(role)) {
    score += 0.25;
    signals.push({ type: "aria-role", score: 0.25, detail: `role=${role}` });
    if (matchedLabel === "unknown") matchedLabel = role as ComponentLabel;
  }

  // 3. Repeated Structure (0.25)
  const sig = getStructureSignature(el);
  if (repeatedSignatures.has(sig)) {
    score += 0.25;
    signals.push({ type: "repeated-structure", score: 0.25, detail: `signature matches pattern` });
  }

  // 4. Class Name Heuristic (0.15)
  for (const kw of CLASS_KEYWORDS) {
    if (classStr.includes(kw)) {
      score += 0.15;
      signals.push({ type: "class-heuristic", score: 0.15, detail: `class contains '${kw}'` });
      if (matchedLabel === "unknown") matchedLabel = kw as ComponentLabel;
      break; // Only count once
    }
  }

  return { score, signals, label: matchedLabel };
}

function extractCSS(el: Element): string {
  // Simplistic extraction: get Computed Style and filter out empty/default
  const cs = getComputedStyle(el);
  let cssStr = "";
  // In a real robust implementation, we would compare to a baseline empty element.
  // For now, we extract key properties that define the component.
  const props = ["display", "flex-direction", "padding", "margin", "background-color", "color", "border-radius", "border", "box-shadow", "font-size", "font-weight", "text-align", "gap", "justify-content", "align-items"];
  
  for (const p of props) {
    const val = cs.getPropertyValue(p);
    if (val && val !== "none" && val !== "normal" && val !== "0px" && val !== "rgba(0, 0, 0, 0)") {
      cssStr += `  ${p}: ${val};\n`;
    }
  }
  return cssStr.trim();
}

function getBestSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (typeof el.className === "string" && el.className.trim()) {
    const classes = el.className.trim().split(/\s+/).filter(c => !c.includes(":") && !c.includes("[") && /^[a-zA-Z0-9_-]+$/.test(c));
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }
  return el.tagName.toLowerCase();
}

const IGNORED_TAGS = new Set([
  "path", "g", "circle", "rect", "line", "polyline", "polygon", "ellipse",
  "defs", "clippath", "mask", "pattern", "stop", "lineargradient", "radialgradient",
  "text", "tspan", "use", "symbol", "marker",
  "script", "style", "meta", "link", "noscript", "template", "head", "title",
  "br", "hr", "wbr", "source", "track"
]);

export function sanitizeComponentHTML(el: Element, maxBytes = 4000): string {
  try {
    const clone = el.cloneNode(true) as Element;

    // 1. Strip inner contents of all SVG elements so heavy paths never bloat or break HTML
    if (clone.tagName.toLowerCase() === "svg") {
      clone.innerHTML = "";
      clone.removeAttribute("d");
    }
    const svgs = clone.querySelectorAll("svg");
    svgs.forEach((s) => {
      s.innerHTML = "";
      s.removeAttribute("d");
    });

    // 2. Normalize <img> elements
    if (clone.tagName.toLowerCase() === "img") {
      clone.setAttribute("src", "...");
      clone.removeAttribute("srcset");
    }
    const imgs = clone.querySelectorAll("img");
    imgs.forEach((i) => {
      i.setAttribute("src", "...");
      i.removeAttribute("srcset");
    });

    // 3. Remove script, style, iframe nodes
    clone.querySelectorAll("script, style, iframe, noscript").forEach((n) => n.remove());

    // 4. Limit overly deep or wide child lists
    if (clone.children.length > 8) {
      const childrenArray = Array.from(clone.children);
      const toRemove = childrenArray.slice(8);
      toRemove.forEach((c) => c.remove());
      const placeholder = document.createElement("div");
      placeholder.textContent = `... (${toRemove.length} more elements)`;
      clone.appendChild(placeholder);
    }

    // 5. Shorten lengthy text nodes
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      if (textNode.nodeValue && textNode.nodeValue.length > 150) {
        textNode.nodeValue = textNode.nodeValue.substring(0, 150) + "...";
      }
      textNode = walker.nextNode();
    }

    let html = clone.outerHTML;

    // 6. If still long, remove bulky data attributes rather than mid-string slicing
    if (html.length > maxBytes) {
      const allDescendants = [clone, ...Array.from(clone.querySelectorAll("*"))];
      for (const d of allDescendants) {
        const attrs = Array.from(d.attributes);
        for (const attr of attrs) {
          if (attr.name.startsWith("data-") || attr.value.length > 80) {
            d.removeAttribute(attr.name);
          }
        }
      }
      html = clone.outerHTML;
    }

    // 7. If still exceeding maxBytes, collapse to safe closed tag
    if (html.length > maxBytes) {
      const tag = clone.tagName.toLowerCase();
      const cls = typeof clone.className === "string" && clone.className.trim() ? ` class="${clone.className.trim()}"` : "";
      html = `<${tag}${cls}>... (${clone.children.length} elements)</${tag}>`;
    }

    return html;
  } catch {
    const tag = el.tagName.toLowerCase();
    return `<${tag}>...</${tag}>`;
  }
}

export function detectComponents(domLimit = 1500): Component[] {
  const elements = Array.from(document.querySelectorAll("*"))
    .filter((el) => !IGNORED_TAGS.has(el.tagName.toLowerCase()))
    .slice(0, domLimit);
  
  // A. Find repeated structures
  const sigMap = new Map<string, Element[]>();
  for (const el of elements) {
    if (el.children.length < 2) continue; // ignore leaf nodes for structure patterns
    const sig = getStructureSignature(el);
    const existing = sigMap.get(sig) || [];
    existing.push(el);
    sigMap.set(sig, existing);
  }

  const repeatedSignatures = new Set<string>();
  const patternCounts = new Map<string, number>();
  for (const [sig, els] of sigMap.entries()) {
    if (els.length >= 3) {
      repeatedSignatures.add(sig);
      patternCounts.set(sig, els.length);
    }
  }

  // B. Score elements
  const candidates: { el: Element, score: number, signals: DetectionSignal[], label: ComponentLabel, sig: string }[] = [];
  
  for (const el of elements) {
    // Only consider visible elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || getComputedStyle(el).display === "none") continue;

    const sig = getStructureSignature(el);
    const { score, signals, label } = getElementScore(el, repeatedSignatures);

    if (score >= 0.45) {
      candidates.push({ el, score, signals, label, sig });
    }
  }

  // C. Deduplicate (overlap)
  // If an element is a child of another candidate and has lower/equal score, drop it, UNLESS it's a very distinct component like a button inside a card
  const filteredCandidates = candidates.filter((cand, idx) => {
    // Check if cand is contained by any other candidate
    for (let i = 0; i < candidates.length; i++) {
      if (i === idx) continue;
      const other = candidates[i];
      if (other.el.contains(cand.el)) {
        // Drop inner if it's the exact same label or lower score, except if inner is strongly semantic (button) and outer is generic (card)
        if (cand.label === other.label || cand.score < other.score) {
          return false;
        }
      }
    }
    return true;
  });

  // D. Group by Signature/Label to find instances
  const finalComponentsMap = new Map<string, Component>();

  for (const cand of filteredCandidates) {
    const key = `${cand.label}-${cand.sig}`;
    if (!finalComponentsMap.has(key)) {
      const rect = cand.el.getBoundingClientRect();
      const html = sanitizeComponentHTML(cand.el, 4000);

      finalComponentsMap.set(key, {
        id: generateId(),
        label: cand.label,
        confidence: cand.score,
        instanceCount: patternCounts.get(cand.sig) || 1,
        signals: cand.signals,
        html: html,
        css: extractCSS(cand.el),
        selector: getBestSelector(cand.el),
        boundingBox: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        hasChildren: cand.el.children.length > 0,
        childCount: cand.el.children.length,
        isUncertain: cand.score >= 0.45 && cand.score < 0.60,
        ariaRole: cand.el.getAttribute("role") || undefined,
        tagName: cand.el.tagName.toLowerCase()
      });
    } else {
      // Increment instance count if we see another variation that didn't group by exact sig
      const existing = finalComponentsMap.get(key)!;
      existing.instanceCount++;
    }
  }

  return Array.from(finalComponentsMap.values());
}

