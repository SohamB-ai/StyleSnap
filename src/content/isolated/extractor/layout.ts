// Phase 2: Layout Extraction Engine

import { LayoutStructure, PageSection, SectionLabel, GridInfo } from "../../../shared/types";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getVisibleRect(el: Element): DOMRect {
  return el.getBoundingClientRect();
}

function isLargeContainer(rect: DOMRect): boolean {
  const vWidth = window.innerWidth;
  return rect.width > vWidth * 0.8 && rect.height > 200;
}

function computeLayout(el: Element): { layoutType: "flex" | "grid" | "block" | "absolute" | "mixed", flexDir?: string, flexWrap?: string, gridCols?: string, gap?: string, pad?: string, bg?: string, minH?: string } {
  const cs = getComputedStyle(el);
  const layoutType = cs.display.includes("flex") ? "flex" : cs.display.includes("grid") ? "grid" : cs.position === "absolute" ? "absolute" : "block";
  return {
    layoutType,
    flexDir: cs.flexDirection,
    flexWrap: cs.flexWrap,
    gridCols: cs.gridTemplateColumns,
    gap: cs.gap,
    pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`.trim(),
    bg: cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : "transparent",
    minH: cs.minHeight
  };
}

function assignLabel(el: Element, tag: string): SectionLabel {
  const html = el.innerHTML.toLowerCase();
  const className = el.className.toLowerCase();
  
  if (tag === "header") return "navigation";
  if (tag === "footer") return "footer";
  
  // Hero: contains h1 and a button or cta
  if (el.querySelector("h1") && (el.querySelector("button") || el.querySelector("a.button") || className.includes("hero"))) {
    return "hero";
  }
  
  // Navigation fallback
  if (tag === "nav" || el.querySelector("nav") || className.includes("nav")) {
    return "navigation";
  }
  
  // Features / Gallery: Grid with similar children
  if (className.includes("feature") || html.includes("feature")) return "features";
  if (className.includes("gallery") || html.includes("gallery")) return "gallery";
  
  // Testimonials
  if (className.includes("testimonial") || html.includes("testimonial") || el.querySelector("blockquote")) {
    return "testimonials";
  }
  
  // Pricing
  if (className.includes("pricing") || html.includes("pricing") || (html.includes("$") && html.includes("month"))) {
    return "pricing";
  }

  // CTA
  if (className.includes("cta") || (el.querySelector("button") && !el.querySelector("p"))) {
    return "cta";
  }

  // FAQ
  if (className.includes("faq") || html.includes("faq") || html.includes("frequently asked")) {
    return "faq";
  }

  // Team
  if (className.includes("team") || html.includes("our team")) {
    return "team";
  }

  // Stats
  if (className.includes("stat") || html.includes("statistics")) {
    return "stats";
  }

  return "content";
}

export function extractLayout(): LayoutStructure {
  const semanticTags = ["header", "nav", "main", "footer", "section", "aside", "article"];
  let candidates: Element[] = [];

  // 1. Semantic Scan
  for (const tag of semanticTags) {
    candidates.push(...Array.from(document.querySelectorAll(tag)));
  }

  // 2. Fallback Scan for large divs (children of body or main)
  const divs = Array.from(document.querySelectorAll("body > div, main > div"));
  for (const div of divs) {
    const rect = getVisibleRect(div);
    if (isLargeContainer(rect)) {
      candidates.push(div);
    }
  }

  // Filter out invisible elements
  candidates = candidates.filter(el => {
    const rect = getVisibleRect(el);
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== "none";
  });

  // 3. Deduplication (remove nested sections that are fully contained)
  const uniqueCandidates: Element[] = [];
  for (const el of candidates) {
    let isNested = false;
    for (const other of candidates) {
      if (el !== other && other.contains(el)) {
        if (other.tagName !== "MAIN" && other.tagName !== "BODY") {
          isNested = true;
          break;
        }
      }
    }
    if (!isNested) {
      uniqueCandidates.push(el);
    }
  }

  // Remove duplicates from array
  const finalCandidates = Array.from(new Set(uniqueCandidates));

  // Sort top to bottom
  finalCandidates.sort((a, b) => getVisibleRect(a).top - getVisibleRect(b).top);

  // Take top 20 max to avoid blowing up memory
  const limitedCandidates = finalCandidates.slice(0, 20);

  const sections: PageSection[] = limitedCandidates.map((el, idx) => {
    const layout = computeLayout(el);
    const tag = el.tagName.toLowerCase();
    const rect = getVisibleRect(el);
    
    return {
      id: generateId(),
      label: assignLabel(el, tag),
      tagName: tag,
      layoutType: layout.layoutType,
      flexDirection: layout.flexDir,
      flexWrap: layout.flexWrap,
      gridCols: layout.gridCols !== "none" ? layout.gridCols : undefined,
      gap: layout.gap !== "normal" ? layout.gap : undefined,
      padding: layout.pad || "0px",
      backgroundColor: layout.bg || "transparent",
      minHeight: layout.minH || "0px",
      order: idx
    };
  });

  // 6. Global Grid Detection
  // Find max content width container
  let maxContentWidth = "100%";
  const containers = document.querySelectorAll(".container, [class*='max-w']");
  for (const c of Array.from(containers)) {
    const w = getComputedStyle(c).maxWidth;
    if (w && w !== "none") {
      maxContentWidth = w;
      break;
    }
  }

  let baseGrid: GridInfo = {
    type: "unknown",
    columnCount: 1
  };
  
  // Heuristic for global grid
  const gridSection = sections.find(s => s.layoutType === "grid" && s.gridCols && s.gridCols.includes("repeat"));
  if (gridSection && gridSection.gridCols) {
    const match = gridSection.gridCols.match(/repeat\((\d+)/);
    if (match) {
      baseGrid = {
        type: "css-grid",
        columns: gridSection.gridCols,
        gap: gridSection.gap,
        columnCount: parseInt(match[1], 10)
      };
    }
  }

  return {
    maxContentWidth,
    baseGrid,
    sections
  };
}
