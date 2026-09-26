// src/background/handlers/animationDetector.ts
// Self-contained function injected into page's MAIN world via chrome.scripting.executeScript
// NOTE: MUST NOT reference any outer closure variables or imports directly.
// Everything must be self-contained so that Chrome can serialize it via .toString().

export function mainWorldAnimationDetector() {
  try {
    const report: any = {
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
      webglDetails: null,
      css3dTransforms: [],
      overallTier: 3,
      summary: "",
    };

    function describeEl(el: Element | null): string {
      if (!el || !(el instanceof Element)) return "unknown";
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const classes = Array.from(el.classList)
        .slice(0, 3)
        .map((c) => `.${c}`)
        .join("");
      return `${tag}${id}${classes}`.slice(0, 80);
    }

    // 1. GSAP + ScrollTrigger
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
                trigger: describeEl(st.trigger),
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
          } catch {}
        }

        let desc = `GSAP v${version}`;
        if (hasScrollTrigger) {
          desc += ` + ScrollTrigger (${triggers.length} trigger${triggers.length !== 1 ? "s" : ""})`;
          const pinned = triggers.filter((t) => t.pin);
          const scrubbed = triggers.filter((t) => t.scrub);
          if (pinned.length) desc += `, ${pinned.length} pinned`;
          if (scrubbed.length) desc += `, ${scrubbed.length} scrub`;
        }

        report.libraries.push({
          library: hasScrollTrigger ? "gsap-scrolltrigger" : "gsap",
          detected: true,
          version,
          tier: 1,
          config: {
            version,
            hasScrollTrigger,
            triggers,
            globalTimeline: {
              timeScale: gsap?.globalTimeline?.timeScale() ?? 1,
              paused: gsap?.globalTimeline?.paused() ?? false,
            },
          },
          description: desc,
          elementCount: triggers.length,
        });
      }
    } catch {}

    // 2. AOS
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
              selector: describeEl(el),
              count: 0,
            });
          }
          animMap.get(anim).count++;
        });

        report.libraries.push({
          library: "aos",
          detected: true,
          version,
          tier: 1,
          config: {
            version,
            options,
            elements: Array.from(animMap.values()),
          },
          description: `AOS ${version}: ${aosElements.length} animated elements (${Array.from(
            animMap.keys()
          ).join(", ")})`,
          elementCount: aosElements.length,
        });
      }
    } catch {}

    // 3. Lenis
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

        report.libraries.push({
          library: "lenis",
          detected: true,
          version: instance?.version || (htmlHasLenis ? "active" : "unknown"),
          tier: 1,
          config: {
            version: instance?.version || "active",
            duration,
            easing: String(instance?.options?.easing || "easeOutExpo"),
            smoothWheel: instance?.options?.smoothWheel ?? true,
            infinite: Boolean(instance?.options?.infinite),
            orientation,
          },
          description: `Lenis smooth scroll: duration ${duration}s, ${orientation} orientation`,
        });
      }
    } catch {}

    // 4. Locomotive Scroll
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
              selector: describeEl(el),
              count: 0,
            });
          }
          elemMap.get(key).count++;
        });

        report.libraries.push({
          library: "locomotive-scroll",
          detected: true,
          version: LS?.version || undefined,
          tier: 1,
          config: {
            version: LS?.version || undefined,
            smooth: true,
            elements: Array.from(elemMap.values()),
          },
          description: `Locomotive Scroll: ${scrollElements.length} scroll elements`,
          elementCount: scrollElements.length,
        });
      }
    } catch {}

    // 5. Framer Motion
    try {
      const motion = (window as any).motion;
      const framerPkgs = (window as any).__framer_importedPackages;
      const framerElements = document.querySelectorAll(
        "[data-framer-name], [data-framer-component-type], [style*='--framer-']"
      );

      if (motion || framerPkgs || framerElements.length > 0) {
        const hasLayoutAnims = !!document.querySelector(
          "[data-framer-appear-id], [data-layout-id]"
        );
        const framerVars = new Set<string>();

        framerElements.forEach((el) => {
          const style = el.getAttribute("style") || "";
          const matches = style.match(/--framer-[\w-]+/g);
          if (matches) matches.forEach((v) => framerVars.add(v));
        });

        report.libraries.push({
          library: "framer-motion",
          detected: true,
          tier: 2,
          config: {
            detected: true,
            hasLayoutAnimations: hasLayoutAnims,
            elementsWithFramerProps: framerElements.length,
            framerVariables: Array.from(framerVars),
          },
          description: `Framer Motion: ${framerElements.length} motion component${
            framerElements.length !== 1 ? "s" : ""
          }${hasLayoutAnims ? ", layout animations detected" : ""}`,
          elementCount: framerElements.length,
        });
      }
    } catch {}

    // 6. ScrollMagic
    try {
      const SM = (window as any).ScrollMagic;
      if (SM) {
        report.libraries.push({
          library: "scrollmagic",
          detected: true,
          tier: 2,
          config: { detected: true },
          description: "ScrollMagic controller detected",
        });
      }
    } catch {}

    // 7. Three.js & WebGL
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
        } catch {}
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
        report.libraries.push({
          library: "three-js",
          detected: true,
          version: `r${revision}`,
          tier: 1,
          config: {
            revision: `r${revision}`,
            canvasCount: webglCanvasCount,
            webglVersion: webglVersion || 1,
          },
          description: `Three.js r${revision}: ${webglCanvasCount} WebGL canvas${
            webglCanvasCount !== 1 ? "es" : ""
          } (WebGL ${webglVersion || 1})`,
          elementCount: webglCanvasCount,
        });
      }
    } catch {}

    // 8. Spline 3D
    try {
      const splineViewers = document.querySelectorAll("spline-viewer");
      if (splineViewers.length > 0) {
        const urls: string[] = [];
        splineViewers.forEach((el) => {
          const url = el.getAttribute("url") || el.getAttribute("scene");
          if (url) urls.push(url);
        });

        report.libraries.push({
          library: "spline",
          detected: true,
          tier: 1,
          config: { viewerCount: splineViewers.length, urls },
          description: `Spline 3D: ${splineViewers.length} viewer(s) embedded`,
          elementCount: splineViewers.length,
        });
      }
    } catch {}

    // 9. Vanilla CSS Animations & Keyframes
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
        } catch {}
      });

      const sample = document.querySelectorAll(
        "header, nav, main, section, footer, article, [class*='animate'], [class*='fade'], [class*='slide'], [class*='transition'], button, a, h1, h2"
      );
      const limit = Math.min(sample.length, 300);
      for (let i = 0; i < limit; i++) {
        const s = window.getComputedStyle(sample[i]);
        if (s.animationName && s.animationName !== "none") {
          cssAnimationCount++;
          s.animationName.split(",").forEach((n) => keyframeNames.add(n.trim()));
        }
        if (
          s.transitionProperty !== "none" &&
          s.transitionProperty !== "all" &&
          s.transitionDuration !== "0s"
        ) {
          cssTransitionCount++;
        }
      }

      report.vanillaAnimations = {
        cssAnimationCount,
        cssTransitionCount,
        keyframeNames: Array.from(keyframeNames).slice(0, 30),
        intersectionObserverDetected:
          !!(window as any).__stylesnap_observers?.length ||
          !!document.querySelector("[data-inview], [data-visible], .is-inview"),
      };
    } catch {}

    // 10. CSS 3D Transforms
    try {
      const containers = document.querySelectorAll(
        "section, div[class*='3d'], div[class*='perspective']"
      );
      const transforms: any[] = [];
      const limit = Math.min(containers.length, 100);
      for (let i = 0; i < limit; i++) {
        const s = window.getComputedStyle(containers[i]);
        if (s.perspective !== "none" || s.transformStyle === "preserve-3d") {
          transforms.push({
            selector: describeEl(containers[i]),
            perspective: s.perspective !== "none" ? s.perspective : undefined,
            transformStyle: s.transformStyle === "preserve-3d" ? "preserve-3d" : undefined,
            transform: s.transform !== "none" ? s.transform : undefined,
          });
        }
      }
      report.css3dTransforms = transforms.slice(0, 20);
    } catch {}

    // Tier determination
    const detectedLibs = report.libraries.filter((l: any) => l.detected);
    if (detectedLibs.length > 0) {
      report.overallTier = Math.min(...detectedLibs.map((l: any) => l.tier));
    } else {
      report.overallTier = 3;
    }

    const parts: string[] = [];
    detectedLibs.forEach((l: any) => parts.push(l.description));
    if (report.vanillaAnimations.cssAnimationCount > 0) {
      parts.push(`${report.vanillaAnimations.cssAnimationCount} CSS animations`);
    }
    if (report.vanillaAnimations.cssTransitionCount > 0) {
      parts.push(`${report.vanillaAnimations.cssTransitionCount} CSS transitions`);
    }
    if (report.hasWebGL && !detectedLibs.some((l: any) => l.library === "three-js")) {
      parts.push(`WebGL ${report.webglDetails?.webglVersion || 1} Canvas`);
    }
    if (report.css3dTransforms.length > 0) {
      parts.push(`${report.css3dTransforms.length} 3D transforms`);
    }

    report.summary =
      parts.length > 0
        ? parts.join(" · ")
        : "No animation libraries or dynamic motion effects detected.";

    // Post result to ISOLATED content script
    window.postMessage(
      {
        source: "stylesnap-main",
        type: "ANIMATION_RESULT",
        payload: report,
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
