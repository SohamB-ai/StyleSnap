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

export function detectComponents(domLimit = 1500): Component[] {
  const elements = Array.from(document.querySelectorAll("*")).slice(0, domLimit);
  
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
      // Clean HTML
      const clone = cand.el.cloneNode(true) as Element;
      const imgs = clone.querySelectorAll("img, svg");
      imgs.forEach(i => {
        if (i.tagName.toLowerCase() === "img") i.setAttribute("src", "...");
        if (i.tagName.toLowerCase() === "svg") i.innerHTML = "...";
      });
      let html = clone.outerHTML;
      if (html.length > 4000) html = html.substring(0, 4000) + "...";

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
