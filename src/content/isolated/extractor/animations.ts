// src/content/isolated/extractor/animations.ts
// DOM-only fallback animation detection for ISOLATED world (no window globals)

import type {
  AnimationReport,
  LibraryDetection,
  VanillaAnimationInfo,
  CSS3DTransformInfo,
  AccuracyTier,
} from "../../../shared/types";

export function scanAnimationsDOM(): AnimationReport {
  const libraries: LibraryDetection[] = [];

  function describeElement(el: Element | null): string {
    if (!el || !(el instanceof Element)) return "unknown";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const classes = Array.from(el.classList)
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join("");
    return `${tag}${id}${classes}`.slice(0, 80);
  }

  // 1. AOS (DOM attributes only)
  try {
    const aosElements = document.querySelectorAll("[data-aos]");
    if (aosElements.length > 0) {
      const animMap = new Map<string, number>();
      aosElements.forEach((el) => {
        const anim = el.getAttribute("data-aos") || "fade";
        animMap.set(anim, (animMap.get(anim) || 0) + 1);
      });

      libraries.push({
        library: "aos",
        detected: true,
        tier: 3, // Downgraded because window.AOS not accessible
        description: `AOS (DOM-only): ${aosElements.length} element${
          aosElements.length !== 1 ? "s" : ""
        } (${Array.from(animMap.keys()).join(", ")})`,
        elementCount: aosElements.length,
      });
    }
  } catch {
    // continue
  }

  // 2. Locomotive Scroll (DOM attributes only)
  try {
    const scrollElements = document.querySelectorAll("[data-scroll]");
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (scrollElements.length > 0 || scrollContainer) {
      libraries.push({
        library: "locomotive-scroll",
        detected: true,
        tier: 3,
        description: `Locomotive Scroll (DOM-only): ${scrollElements.length} scroll elements`,
        elementCount: scrollElements.length,
      });
    }
  } catch {
    // continue
  }

  // 3. Lenis (DOM class only)
  try {
    const htmlHasLenis =
      document.documentElement.classList.contains("lenis") ||
      document.body?.classList.contains("lenis");
    const lenisElements = document.querySelectorAll("[data-lenis-prevent]");

    if (htmlHasLenis || lenisElements.length > 0) {
      libraries.push({
        library: "lenis",
        detected: true,
        tier: 3,
        description: "Lenis smooth scroll (DOM indicators detected)",
      });
    }
  } catch {
    // continue
  }

  // 4. Framer Motion (DOM data attributes & css variables)
  try {
    const framerElements = document.querySelectorAll(
      "[data-framer-name], [data-framer-component-type], [style*='--framer-']"
    );
    if (framerElements.length > 0) {
      libraries.push({
        library: "framer-motion",
        detected: true,
        tier: 3,
        description: `Framer Motion (DOM-only): ${framerElements.length} motion component${
          framerElements.length !== 1 ? "s" : ""
        }`,
        elementCount: framerElements.length,
      });
    }
  } catch {
    // continue
  }

  // 5. Spline (custom element)
  try {
    const splineViewers = document.querySelectorAll("spline-viewer");
    if (splineViewers.length > 0) {
      const urls: string[] = [];
      splineViewers.forEach((el) => {
        const url = el.getAttribute("url") || el.getAttribute("scene");
        if (url) urls.push(url);
      });

      libraries.push({
        library: "spline",
        detected: true,
        tier: 1, // spline-viewer tag is conclusive
        config: {
          viewerCount: splineViewers.length,
          urls,
        },
        description: `Spline 3D: ${splineViewers.length} viewer(s) embedded`,
        elementCount: splineViewers.length,
      });
    }
  } catch {
    // continue
  }

  // 6. Vanilla CSS Animations & Keyframes
  let cssAnimationCount = 0;
  let cssTransitionCount = 0;
  const keyframeNames = new Set<string>();

  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules).forEach((rule) => {
          if (rule instanceof CSSKeyframesRule) {
            keyframeNames.add(rule.name);
          }
        });
      } catch {
        // CORS
      }
    });
  } catch {
    // continue
  }

  try {
    const sample = document.querySelectorAll(
      "header, nav, main, section, footer, article, [class*='animate'], [class*='fade'], [class*='slide'], [class*='transition'], button, a, h1, h2"
    );
    const limit = Math.min(sample.length, 250);
    for (let i = 0; i < limit; i++) {
      const s = window.getComputedStyle(sample[i]);
      if (s.animationName && s.animationName !== "none") cssAnimationCount++;
      if (
        s.transitionProperty !== "none" &&
        s.transitionProperty !== "all" &&
        s.transitionDuration !== "0s"
      ) {
        cssTransitionCount++;
      }
    }
  } catch {
    // continue
  }

  const vanillaAnimations: VanillaAnimationInfo = {
    cssAnimationCount,
    cssTransitionCount,
    keyframeNames: Array.from(keyframeNames).slice(0, 30),
    intersectionObserverDetected: !!document.querySelector(
      "[data-inview], [data-visible], .is-inview"
    ),
  };

  // 7. WebGL Canvas
  let webglCanvasCount = 0;
  try {
    const canvases = document.querySelectorAll("canvas");
    webglCanvasCount = canvases.length;
  } catch {
    // continue
  }

  // 8. CSS 3D Transforms
  const transforms: CSS3DTransformInfo[] = [];
  try {
    const containers = document.querySelectorAll("section, div[class*='3d'], div[class*='perspective']");
    const limit = Math.min(containers.length, 100);
    for (let i = 0; i < limit; i++) {
      const s = window.getComputedStyle(containers[i]);
      if (s.perspective !== "none" || s.transformStyle === "preserve-3d") {
        transforms.push({
          selector: describeElement(containers[i]),
          perspective: s.perspective !== "none" ? s.perspective : undefined,
          transformStyle: s.transformStyle === "preserve-3d" ? "preserve-3d" : undefined,
          transform: s.transform !== "none" ? s.transform : undefined,
        });
      }
    }
  } catch {
    // continue
  }

  const detectedLibs = libraries.filter((l) => l.detected);
  const parts: string[] = [];
  detectedLibs.forEach((l) => parts.push(l.description));
  if (cssAnimationCount > 0) parts.push(`${cssAnimationCount} CSS animations`);
  if (cssTransitionCount > 0) parts.push(`${cssTransitionCount} CSS transitions`);
  if (webglCanvasCount > 0) parts.push(`${webglCanvasCount} Canvas elements`);
  if (transforms.length > 0) parts.push(`${transforms.length} 3D transforms`);

  return {
    detectedAt: Date.now(),
    injectionMethod: "dom-only",
    libraries,
    vanillaAnimations,
    hasWebGL: webglCanvasCount > 0,
    webglDetails: webglCanvasCount > 0 ? { canvasCount: webglCanvasCount, webglVersion: 1 } : undefined,
    css3dTransforms: transforms,
    overallTier: 3 as AccuracyTier,
    summary:
      parts.length > 0
        ? `[Tier 3 · DOM scan] ${parts.join(" · ")}`
        : "No animation libraries or CSS motion effects detected.",
  };
}
