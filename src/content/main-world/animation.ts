// src/content/main-world/animation.ts
// Runs in MAIN world — has access to window globals (window.gsap, window.THREE, etc.)
// CANNOT use chrome.* APIs
// Communicates back to ISOLATED content script via window.postMessage

import type {
  AnimationReport,
  LibraryDetection,
  GSAPConfig,
  AOSConfig,
  LenisConfig,
  LocomotiveConfig,
  FramerMotionConfig,
  ScrollMagicConfig,
  ThreeConfig,
  SplineConfig,
  VanillaAnimationInfo,
  CSS3DTransformInfo,
  AccuracyTier,
} from "../../shared/types";

export function detectAnimationsInMainWorld(): AnimationReport {
  const report: AnimationReport = {
    detectedAt: Date.now(),
    injectionMethod: "main-world",
    libraries: [],
    vanillaAnimations: {
      cssAnimationCount: 0,
      cssTransitionCount: 0,
      keyframeNames: [],
      intersectionObserverDetected: false,
    },
    hasWebGL: false,
    webglDetails: undefined,
    css3dTransforms: [],
    overallTier: 3,
    summary: "",
  };

  // Helper: describe an element for human-readable output
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

  // ── 1. GSAP + ScrollTrigger (Tier 1) ──
  try {
    const gsap = (window as any).gsap;
    const TweenMax = (window as any).TweenMax;
    const ScrollTrigger = (window as any).ScrollTrigger;

    if (gsap || TweenMax) {
      const version = gsap?.version || TweenMax?.version || "unknown";
      const hasScrollTrigger = !!ScrollTrigger;
      const triggers: any[] = [];

      if (hasScrollTrigger && typeof ScrollTrigger.getAll === "function") {
        try {
          const allTriggers = ScrollTrigger.getAll();
          allTriggers.forEach((st: any, i: number) => {
            triggers.push({
              id: i,
              trigger: describeElement(st.trigger),
              start: String(st.vars?.start || "top bottom"),
              end: String(st.vars?.end || "bottom top"),
              scrub: st.vars?.scrub ?? false,
              pin: st.vars?.pin ?? false,
              toggleClass: st.vars?.toggleClass || undefined,
              markers: Boolean(st.vars?.markers),
              once: Boolean(st.vars?.once),
              ease: st.vars?.ease || undefined,
            });
          });
        } catch {
          // ignore trigger extraction errors
        }
      }

      let desc = `GSAP v${version}`;
      if (hasScrollTrigger) {
        desc += ` + ScrollTrigger (${triggers.length} trigger${triggers.length !== 1 ? "s" : ""})`;
        const pinned = triggers.filter((t) => t.pin);
        const scrubbed = triggers.filter((t) => t.scrub);
        if (pinned.length) desc += `, ${pinned.length} pinned`;
        if (scrubbed.length) desc += `, ${scrubbed.length} scrub`;
      }

      const gsapConfig: GSAPConfig = {
        version,
        hasScrollTrigger,
        triggers,
        globalTimeline: {
          timeScale: gsap?.globalTimeline?.timeScale() ?? 1,
          paused: gsap?.globalTimeline?.paused() ?? false,
        },
      };

      report.libraries.push({
        library: hasScrollTrigger ? "gsap-scrolltrigger" : "gsap",
        detected: true,
        version,
        tier: 1,
        config: gsapConfig,
        description: desc,
        elementCount: triggers.length,
      });
    }
  } catch {
    // continue
  }

  // ── 2. AOS (Animate on Scroll) (Tier 1) ──
  try {
    const AOS = (window as any).AOS;
    const aosElements = document.querySelectorAll("[data-aos]");
    if (AOS || aosElements.length > 0) {
      const version = AOS?.options?.startEvent ? "3.x" : AOS?.version || "2.x";
      const options = {
        duration: AOS?.options?.duration ?? 400,
        easing: AOS?.options?.easing ?? "ease",
        offset: AOS?.options?.offset ?? 120,
        once: Boolean(AOS?.options?.once),
      };

      const animMap = new Map<string, any>();
      aosElements.forEach((el) => {
        const anim = el.getAttribute("data-aos") || "fade";
        if (!animMap.has(anim)) {
          animMap.set(anim, {
            animation: anim,
            duration: parseInt(el.getAttribute("data-aos-duration") || "") || undefined,
            offset: parseInt(el.getAttribute("data-aos-offset") || "") || undefined,
            delay: parseInt(el.getAttribute("data-aos-delay") || "") || undefined,
            easing: el.getAttribute("data-aos-easing") || undefined,
            selector: describeElement(el),
            count: 0,
          });
        }
        animMap.get(anim).count++;
      });

      const aosConfig: AOSConfig = {
        version,
        options,
        elements: Array.from(animMap.values()),
      };

      report.libraries.push({
        library: "aos",
        detected: true,
        version,
        tier: 1,
        config: aosConfig,
        description: `AOS ${version}: ${aosElements.length} animated element${
          aosElements.length !== 1 ? "s" : ""
        } (${Array.from(animMap.keys()).join(", ")})`,
        elementCount: aosElements.length,
      });
    }
  } catch {
    // continue
  }

  // ── 3. Lenis (Smooth Scrolling) (Tier 1) ──
  try {
    const lenis = (window as any).lenis || (window as any).Lenis;
    const htmlHasLenis =
      document.documentElement.classList.contains("lenis") ||
      document.body?.classList.contains("lenis");
    const lenisElements = document.querySelectorAll("[data-lenis-prevent]");

    if (lenis || htmlHasLenis || lenisElements.length > 0) {
      const instance = typeof lenis === "object" ? lenis : null;
      const duration = instance?.options?.duration ?? instance?.duration ?? 1.2;
      const orientation = instance?.options?.orientation ?? "vertical";

      const lenisConfig: LenisConfig = {
        version: instance?.version || (htmlHasLenis ? "active" : "unknown"),
        duration,
        easing: String(instance?.options?.easing || "easeOutExpo"),
        smoothWheel: instance?.options?.smoothWheel ?? true,
        infinite: Boolean(instance?.options?.infinite),
        orientation,
      };

      report.libraries.push({
        library: "lenis",
        detected: true,
        version: lenisConfig.version,
        tier: 1,
        config: lenisConfig,
        description: `Lenis smooth scroll: duration ${duration}s, ${orientation} orientation`,
      });
    }
  } catch {
    // continue
  }

  // ── 4. Locomotive Scroll (Tier 1) ──
  try {
    const LS = (window as any).LocomotiveScroll;
    const scrollElements = document.querySelectorAll("[data-scroll]");
    const scrollContainer = document.querySelector("[data-scroll-container]");

    if (LS || scrollElements.length > 0 || scrollContainer) {
      const elemMap = new Map<string, any>();
      scrollElements.forEach((el) => {
        const speed = el.getAttribute("data-scroll-speed") || undefined;
        const direction = el.getAttribute("data-scroll-direction") || undefined;
        const delay = el.getAttribute("data-scroll-delay") || undefined;
        const key = `${speed || "1"}_${direction || "v"}`;
        if (!elemMap.has(key)) {
          elemMap.set(key, {
            speed,
            direction,
            delay,
            selector: describeElement(el),
            count: 0,
          });
        }
        elemMap.get(key).count++;
      });

      const locoConfig: LocomotiveConfig = {
        version: LS?.version || undefined,
        smooth: true,
        elements: Array.from(elemMap.values()),
      };

      report.libraries.push({
        library: "locomotive-scroll",
        detected: true,
        version: locoConfig.version,
        tier: 1,
        config: locoConfig,
        description: `Locomotive Scroll: ${scrollElements.length} scroll-animated element${
          scrollElements.length !== 1 ? "s" : ""
        }`,
        elementCount: scrollElements.length,
      });
    }
  } catch {
    // continue
  }

  // ── 5. Framer Motion (Tier 2) ──
  try {
    const motion = (window as any).motion;
    const framerPkgs = (window as any).__framer_importedPackages;
    const framerElements = document.querySelectorAll(
      "[data-framer-name], [data-framer-component-type], [style*='--framer-']"
    );

    if (motion || framerPkgs || framerElements.length > 0) {
      const hasLayoutAnimations = !!document.querySelector(
        "[data-framer-appear-id], [data-layout-id]"
      );
      const framerVars = new Set<string>();

      framerElements.forEach((el) => {
        const style = el.getAttribute("style") || "";
        const matches = style.match(/--framer-[\w-]+/g);
        if (matches) matches.forEach((v) => framerVars.add(v));
      });

      const framerConfig: FramerMotionConfig = {
        detected: true,
        hasLayoutAnimations,
        elementsWithFramerProps: framerElements.length,
        framerVariables: Array.from(framerVars),
      };

      report.libraries.push({
        library: "framer-motion",
        detected: true,
        tier: 2,
        config: framerConfig,
        description: `Framer Motion: ${framerElements.length} motion component${
          framerElements.length !== 1 ? "s" : ""
        }${hasLayoutAnimations ? ", layout animations detected" : ""}`,
        elementCount: framerElements.length,
      });
    }
  } catch {
    // continue
  }

  // ── 6. ScrollMagic (Tier 2) ──
  try {
    const SM = (window as any).ScrollMagic;
    if (SM) {
      const smConfig: ScrollMagicConfig = {
        detected: true,
        sceneCount: undefined,
      };

      report.libraries.push({
        library: "scrollmagic",
        detected: true,
        tier: 2,
        config: smConfig,
        description: "ScrollMagic controller detected",
      });
    }
  } catch {
    // continue
  }

  // ── 7. Three.js & WebGL Detection (Tier 1) ──
  try {
    const THREE = (window as any).THREE;
    const threeRevision = (window as any).__THREE__;
    const canvases = document.querySelectorAll("canvas");
    let webglCanvasCount = 0;
    let webglVersion = 0;
    let renderer = "";
    let vendor = "";

    canvases.forEach((canvas) => {
      try {
        const gl: any =
          canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl");
        if (gl) {
          webglCanvasCount++;
          const currentVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;
          if (currentVersion > webglVersion) webglVersion = currentVersion;

          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
            vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
          }
        }
      } catch {
        // canvas context may already be in use
      }
    });

    if (webglCanvasCount > 0) {
      report.hasWebGL = true;
      report.webglDetails = {
        canvasCount: webglCanvasCount,
        webglVersion: webglVersion || 1,
        renderer: renderer || undefined,
        vendor: vendor || undefined,
      };
    }

    if (THREE || threeRevision) {
      const revision = THREE?.REVISION || threeRevision || "unknown";
      const threeConfig: ThreeConfig = {
        revision: `r${revision}`,
        canvasCount: webglCanvasCount,
        webglVersion: webglVersion || 1,
      };

      report.libraries.push({
        library: "three-js",
        detected: true,
        version: `r${revision}`,
        tier: 1,
        config: threeConfig,
        description: `Three.js r${revision}: ${webglCanvasCount} WebGL canvas${
          webglCanvasCount !== 1 ? "es" : ""
        } (WebGL ${webglVersion || 1})`,
        elementCount: webglCanvasCount,
      });
    }
  } catch {
    // continue
  }

  // ── 8. Spline 3D Detection (Tier 1) ──
  try {
    const splineViewers = document.querySelectorAll("spline-viewer");
    if (splineViewers.length > 0) {
      const urls: string[] = [];
      splineViewers.forEach((el) => {
        const url = el.getAttribute("url") || el.getAttribute("scene");
        if (url) urls.push(url);
      });

      const splineConfig: SplineConfig = {
        viewerCount: splineViewers.length,
        urls,
      };

      report.libraries.push({
        library: "spline",
        detected: true,
        tier: 1,
        config: splineConfig,
        description: `Spline 3D: ${splineViewers.length} viewer${
          splineViewers.length !== 1 ? "s" : ""
        } embedded`,
        elementCount: splineViewers.length,
      });
    }
  } catch {
    // continue
  }

  // ── 9. Vanilla CSS Animations & Keyframes (Tier 3) ──
  try {
    let cssAnimationCount = 0;
    let cssTransitionCount = 0;
    const keyframeNames = new Set<string>();

    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules).forEach((rule) => {
          if (rule instanceof CSSKeyframesRule) {
            keyframeNames.add(rule.name);
          }
        });
      } catch {
        // CORS blocked stylesheet
      }
    });

    const sampleElements = document.querySelectorAll(
      "header, nav, main, section, footer, article, aside, " +
        "[class*='hero'], [class*='animate'], [class*='fade'], [class*='slide'], " +
        "[class*='transition'], [class*='motion'], h1, h2, h3, .btn, button, a"
    );

    const limit = Math.min(sampleElements.length, 300);
    for (let i = 0; i < limit; i++) {
      const styles = window.getComputedStyle(sampleElements[i]);
      if (styles.animationName && styles.animationName !== "none") {
        cssAnimationCount++;
        styles.animationName.split(",").forEach((n) => keyframeNames.add(n.trim()));
      }
      if (
        styles.transitionProperty &&
        styles.transitionProperty !== "none" &&
        styles.transitionProperty !== "all" &&
        styles.transitionDuration !== "0s"
      ) {
        cssTransitionCount++;
      }
    }

    const intersectionObserverDetected =
      !!(window as any).__stylesnap_observers?.length ||
      !!document.querySelector("[data-inview], [data-visible], .is-inview, .in-view");

    report.vanillaAnimations = {
      cssAnimationCount,
      cssTransitionCount,
      keyframeNames: Array.from(keyframeNames).slice(0, 30),
      intersectionObserverDetected,
    };
  } catch {
    // continue
  }

  // ── 10. CSS 3D Transforms (Tier 3) ──
  try {
    const candidates = document.querySelectorAll(
      "[style*='perspective'], [style*='preserve-3d'], [style*='rotate3d'], " +
        "[style*='rotateX'], [style*='rotateY'], [style*='translateZ']"
    );

    const containers = document.querySelectorAll(
      "section, div[class*='3d'], div[class*='perspective'], div[class*='card']"
    );

    const transforms: CSS3DTransformInfo[] = [];
    const limit = Math.min(containers.length, 150);
    for (let i = 0; i < limit; i++) {
      const styles = window.getComputedStyle(containers[i]);
      if (
        styles.perspective !== "none" ||
        styles.transformStyle === "preserve-3d" ||
        (styles.transform && styles.transform.includes("matrix3d"))
      ) {
        transforms.push({
          selector: describeElement(containers[i]),
          perspective: styles.perspective !== "none" ? styles.perspective : undefined,
          transformStyle: styles.transformStyle === "preserve-3d" ? "preserve-3d" : undefined,
          transform: styles.transform !== "none" ? styles.transform : undefined,
        });
      }
    }

    candidates.forEach((el) => {
      transforms.push({
        selector: describeElement(el),
        perspective: undefined,
        transformStyle: undefined,
        transform: el.getAttribute("style") || undefined,
      });
    });

    const seen = new Set<string>();
    report.css3dTransforms = transforms.filter((item) => {
      if (seen.has(item.selector)) return false;
      seen.add(item.selector);
      return true;
    }).slice(0, 20);
  } catch {
    // continue
  }

  // ── Determine Overall Tier & Summary ──
  const detectedLibs = report.libraries.filter((l) => l.detected);
  if (detectedLibs.length > 0) {
    const bestTier = Math.min(...detectedLibs.map((l) => l.tier));
    report.overallTier = bestTier as AccuracyTier;
  } else {
    report.overallTier = 3;
  }

  const parts: string[] = [];
  detectedLibs.forEach((l) => parts.push(l.description));

  if (report.vanillaAnimations.cssAnimationCount > 0) {
    parts.push(`${report.vanillaAnimations.cssAnimationCount} CSS animations`);
  }
  if (report.vanillaAnimations.cssTransitionCount > 0) {
    parts.push(`${report.vanillaAnimations.cssTransitionCount} CSS transitions`);
  }
  if (report.hasWebGL && !detectedLibs.some((l) => l.library === "three-js")) {
    parts.push(`WebGL ${report.webglDetails?.webglVersion || 1} Canvas`);
  }
  if (report.css3dTransforms.length > 0) {
    parts.push(`${report.css3dTransforms.length} 3D transforms`);
  }

  report.summary =
    parts.length > 0
      ? parts.join(" · ")
      : "No animation libraries or dynamic motion effects detected.";

  return report;
}

// When executed directly in MAIN world as an IIFE
if (typeof window !== "undefined") {
  try {
    const res = detectAnimationsInMainWorld();
    window.postMessage(
      {
        source: "stylesnap-main",
        type: "ANIMATION_RESULT",
        payload: res,
      },
      "*"
    );
  } catch (err) {
    window.postMessage(
      {
        source: "stylesnap-main",
        type: "ANIMATION_ERROR",
        error: String(err),
      },
      "*"
    );
  }
}
