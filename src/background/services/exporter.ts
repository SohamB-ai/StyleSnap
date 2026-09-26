import {
  ExtractionResult,
  AnimationReport,
  GSAPConfig,
  LenisConfig,
  ThreeConfig,
  AOSConfig,
  SplineConfig,
  FramerMotionConfig
} from "../../shared/types";

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function camelCase(str: string): string {
  return str
    .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/\s+/g, "");
}

// 1. W3C Design Tokens DTCG 2025.10 Generator
export function generateTokensJSON(result: ExtractionResult): string {
  const { tokens } = result;

  const colorGroup: Record<string, any> = {};
  for (const c of tokens.colors) {
    const key = kebabCase(c.suggestedName || c.cssVarName?.replace(/^--/, "") || `color-${c.id.slice(0, 4)}`);
    colorGroup[key] = {
      $value: c.hex,
      $type: "color",
      $description: `Frequency: ${c.frequency}. Contexts: ${c.contexts.join(", ")}.`,
      $extensions: {
        stylesnap: {
          hsl: c.hsl,
          group: c.semanticGroup,
          cssVar: c.cssVarName ?? null
        }
      }
    };
  }

  const fontFamilies: Record<string, any> = {};
  for (const f of tokens.typography.families) {
    fontFamilies[kebabCase(f.name)] = {
      $value: f.stack,
      $type: "fontFamily"
    };
  }

  const fontSizes: Record<string, any> = {};
  for (const entry of tokens.typography.scale) {
    fontSizes[entry.role] = {
      $value: entry.fontSize,
      $type: "dimension"
    };
  }

  const spacingGroup: Record<string, any> = {};
  for (const s of tokens.spacing.values) {
    spacingGroup[s.token] = {
      $value: `${s.px}px`,
      $type: "dimension"
    };
  }

  const radiiGroup: Record<string, any> = {};
  for (const r of tokens.radii) {
    radiiGroup[r.level] = {
      $value: r.value,
      $type: "dimension"
    };
  }

  const shadowGroup: Record<string, any> = {};
  for (const sh of tokens.shadows) {
    shadowGroup[sh.level] = {
      $value: sh.value,
      $type: "shadow"
    };
  }

  const zIndexGroup: Record<string, any> = {};
  for (const z of tokens.zIndex || []) {
    zIndexGroup[`z-${z.value}`] = {
      $value: z.value,
      $type: "number",
      $description: `Used on ${z.contexts.join(", ")} (frequency: ${z.frequency})`
    };
  }

  const dtcgPayload = {
    $metadata: {
      source: result.url,
      extractedBy: `StyleSnap v${result.version}`,
      extractedAt: new Date(result.timestamp).toISOString(),
      dtcgVersion: "2025.10",
      confidence: result.confidence
    },
    color: colorGroup,
    "font-family": fontFamilies,
    "font-size": fontSizes,
    spacing: spacingGroup,
    "border-radius": radiiGroup,
    "box-shadow": shadowGroup,
    "z-index": zIndexGroup,
    ...(result.animations
      ? {
          animation: {
            $type: "other",
            $description: `Detected animation libraries (Tier ${result.animations.overallTier}): ${result.animations.summary}`,
            summary: result.animations.summary,
            tier: result.animations.overallTier,
            libraries: result.animations.libraries.filter((l) => l.detected),
            hasWebGL: result.animations.hasWebGL,
            vanilla: result.animations.vanillaAnimations
          }
        }
      : {})
  };

  return JSON.stringify(dtcgPayload, null, 2);
}

// 2. DESIGN.md AI-Readable Markdown Generator
export function generateDesignMD(result: ExtractionResult): string {
  const { tokens, layout, components } = result;
  const dateStr = new Date(result.timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  let md = `# DESIGN SYSTEM — ${result.title}\n`;
  md += `> Source: ${result.url} | Extracted by StyleSnap v${result.version} | ${dateStr}\n`;
  md += `> Framework: ${result.detectedFramework} | Confidence: ${(result.confidence * 100).toFixed(0)}%\n\n`;

  if (result.warnings.length > 0) {
    md += `## Warnings\n`;
    for (const w of result.warnings) {
      md += `- ${w}\n`;
    }
    md += `\n`;
  }

  // Theme Overview
  if (tokens.themeSummary) {
    md += `## Design Philosophy & Theme\n`;
    md += `${tokens.themeSummary}\n\n`;
  }

  // CSS Variables
  md += `## CSS Variables (paste into :root)\n\`\`\`css\n:root {\n`;
  if (Object.keys(tokens.cssVariables).length > 0) {
    for (const [varName, varVal] of Object.entries(tokens.cssVariables)) {
      md += `  ${varName}: ${varVal};\n`;
    }
  } else {
    for (const c of tokens.colors) {
      const varName = c.cssVarName || `--color-${kebabCase(c.suggestedName)}`;
      md += `  ${varName}: ${c.hex};\n`;
    }
  }
  md += `}\n\`\`\`\n\n`;

  // Colors Table
  md += `## Colour Palette\n\n`;
  md += `| Token | Hex | HSL | Frequency | Group |\n`;
  md += `|-------|-----|-----|-----------|-------|\n`;
  for (const c of tokens.colors) {
    const tokenLabel = c.cssVarName || c.suggestedName;
    md += `| ${tokenLabel} | \`${c.hex}\` | \`${c.hsl}\` | ${c.frequency} | ${c.semanticGroup} |\n`;
  }
  md += `\n`;

  // Typography
  md += `## Typography\n\n`;
  if (tokens.typography.families.length > 0) {
    const primary = tokens.typography.families[0];
    md += `**Primary font:** ${primary.name} (\`${primary.stack}\`)\n\n`;
  }
  md += `| Role | Size | Weight | Line Height | Tracking |\n`;
  md += `|------|------|--------|-------------|----------|\n`;
  for (const entry of tokens.typography.scale) {
    md += `| ${entry.role} | ${entry.fontSize} | ${entry.fontWeight} | ${entry.lineHeight} | ${entry.letterSpacing} |\n`;
  }
  md += `\n`;

  // Spacing Scale
  md += `## Spacing Scale\n\n`;
  md += `Base unit: **${tokens.spacing.baseUnit}px** | Grid: **${tokens.spacing.isGrid ? "Yes" : "Custom"}**\n\n`;
  md += `Scale: ` + tokens.spacing.values.map((v) => `\`${v.px}px\``).join(" · ") + `\n\n`;

  // Shadows
  md += `## Shadows\n\n`;
  md += `| Level | Value |\n`;
  md += `|-------|-------|\n`;
  for (const sh of tokens.shadows) {
    md += `| ${sh.level} | \`${sh.value}\` |\n`;
  }
  md += `\n`;

  // Border Radius
  md += `## Border Radius\n\n`;
  md += `| Level | Value |\n`;
  md += `|-------|-------|\n`;
  for (const r of tokens.radii) {
    md += `| ${r.level} | \`${r.value}\` |\n`;
  }
  md += `\n`;

  // Z-Index
  if (tokens.zIndex && tokens.zIndex.length > 0) {
    md += `## Z-Index Elevation\n\n`;
    md += `| Value | Frequency | Element Contexts |\n`;
    md += `|-------|-----------|------------------|\n`;
    for (const z of tokens.zIndex) {
      md += `| \`${z.value}\` | ${z.frequency} | ${z.contexts.join(", ")} |\n`;
    }
    md += `\n`;
  }

  // Breakpoints
  if (tokens.breakpoints.length > 0) {
    md += `## Breakpoints\n\n`;
    md += `| Label | px | em |\n`;
    md += `|-------|----|----|\n`;
    for (const b of tokens.breakpoints) {
      md += `| ${b.label} | ${b.px}px | ${b.em} |\n`;
    }
    md += `\n`;
  }

  // Layout Structure
  if (layout && layout.sections.length > 0) {
    md += `## Page Layout & Section Structure\n\n`;
    md += `- **Max Content Width:** \`${layout.maxContentWidth}\`\n`;
    md += `- **Base Grid:** ${layout.baseGrid.type === "css-grid" ? `${layout.baseGrid.columnCount} columns` : "Flexbox"}\n\n`;
    md += `| # | Section | Tag | Layout | Grid Columns | Gap | Padding |\n`;
    md += `|---|---------|-----|--------|--------------|-----|---------|\n`;
    for (let i = 0; i < layout.sections.length; i++) {
      const s = layout.sections[i];
      md += `| ${i + 1} | **${s.label}** | \`<${s.tagName}>\` | ${s.layoutType} | ${s.gridCols || "—"} | ${s.gap || "—"} | ${s.padding || "—"} |\n`;
    }
    md += `\n`;
  }

  // Detected Components
  if (components && components.length > 0) {
    const highConf = components.filter((c) => c.confidence >= 0.55);
    if (highConf.length > 0) {
      md += `## Component Library\n\n`;
      for (const c of highConf.slice(0, 10)) {
        md += `### ${c.label.toUpperCase()} (\`${c.selector}\` — x${c.instanceCount} instances)\n`;
        md += `Confidence: ${(c.confidence * 100).toFixed(0)}%\n\n`;
        if (c.css) {
          md += `\`\`\`css\n${c.selector} {\n${c.css}\n}\n\`\`\`\n\n`;
        }
        if (c.html) {
          md += `\`\`\`html\n${c.html}\n\`\`\`\n\n`;
        }
      }
    }
  }

  // Interactive Guidelines
  md += `## Interactive States & Animation Guidelines\n\n`;
  md += `1. **Transitions:** Use \`transition-all 150ms cubic-bezier(0.4, 0, 0.2, 1)\` on buttons, anchors, and cards.\n`;
  md += `2. **Focus States:** Add visible \`focus-visible:ring-2 focus-visible:ring-offset-2\` using the accent token.\n`;
  md += `3. **Elevation on Hover:** Elevate card surfaces with corresponding shadow levels on hover.\n\n`;

  // Animations & Motion [V3]
  if (result.animations) {
    md += formatFullAnimationDocumentation(result.animations);
  }

  return md;
}

export function formatFullAnimationDocumentation(report: AnimationReport): string {
  let doc = `## 🎬 Animations, Motion & 3D Architecture\n\n`;
  doc += `**Overall Accuracy:** Tier ${report.overallTier} (${
    report.overallTier === 1
      ? "High Accuracy — Runtime library globals & exact configurations detected"
      : report.overallTier === 2
      ? "Heuristic — Motion components, custom properties & variables identified"
      : "Presence Only — CSS computed styles & DOM attribute scanning"
  })\n\n`;
  doc += `> **Detected Summary:** ${report.summary}\n\n`;

  const detected = report.libraries.filter((l) => l.detected);

  // Recommended npm packages
  const npmPkgs: string[] = [];
  if (detected.some((l) => l.library === "lenis")) npmPkgs.push("lenis");
  if (detected.some((l) => l.library === "gsap" || l.library === "gsap-scrolltrigger")) npmPkgs.push("gsap");
  if (detected.some((l) => l.library === "three-js")) npmPkgs.push("three", "@types/three");
  if (detected.some((l) => l.library === "aos")) npmPkgs.push("aos", "@types/aos");
  if (detected.some((l) => l.library === "framer-motion")) npmPkgs.push("framer-motion");
  if (detected.some((l) => l.library === "locomotive-scroll")) npmPkgs.push("locomotive-scroll");

  if (npmPkgs.length > 0) {
    doc += `### Recommended Package Installation\n\`\`\`bash\nnpm install ${npmPkgs.join(" ")}\n# or\npnpm add ${npmPkgs.join(" ")}\n\`\`\`\n\n`;
  }

  // 1. Lenis Smooth Scroll
  const lenisLib = detected.find((l) => l.library === "lenis");
  if (lenisLib) {
    const cfg = lenisLib.config as LenisConfig | undefined;
    doc += `### 🌊 Lenis Smooth Scroll (${lenisLib.version || "Active"})\n`;
    doc += `- **Status**: Active (Tier ${lenisLib.tier})\n`;
    if (cfg) {
      doc += `- **Duration**: ${cfg.duration}s\n`;
      doc += `- **Orientation**: ${cfg.orientation}\n`;
      doc += `- **Smooth Wheel**: ${cfg.smoothWheel ? "Enabled" : "Disabled"}\n`;
      doc += `- **Infinite Scroll**: ${cfg.infinite ? "Enabled" : "Disabled"}\n`;
      doc += `- **Easing Curve**: \`${cfg.easing}\`\n\n`;
      doc += `**Drop-in Lenis Implementation Recipe:**\n`;
      doc += `\`\`\`typescript\nimport Lenis from "lenis";\n\nconst lenis = new Lenis({\n  duration: ${cfg.duration},\n  orientation: "${cfg.orientation}",\n  smoothWheel: ${cfg.smoothWheel},\n  infinite: ${cfg.infinite},\n});\n\nfunction raf(time: number) {\n  lenis.raf(time);\n  requestAnimationFrame(raf);\n}\nrequestAnimationFrame(raf);\n\`\`\`\n\n`;
    } else {
      doc += `- ${lenisLib.description}\n\n`;
    }
  }

  // 2. Three.js & WebGL
  const threeLib = detected.find((l) => l.library === "three-js");
  if (threeLib || report.hasWebGL) {
    const cfg = threeLib?.config as ThreeConfig | undefined;
    const webgl = report.webglDetails;
    doc += `### 🧊 Three.js & WebGL 3D Canvas\n`;
    if (threeLib) doc += `- **Three.js Revision**: \`${threeLib.version || cfg?.revision || "Detected"}\` (Tier ${threeLib.tier})\n`;
    if (webgl) {
      doc += `- **WebGL Version**: WebGL ${webgl.webglVersion}\n`;
      doc += `- **Canvas Count**: ${webgl.canvasCount}\n`;
      if (webgl.renderer) doc += `- **GPU Renderer**: \`${webgl.renderer}\`\n`;
      if (webgl.vendor) doc += `- **GPU Vendor**: \`${webgl.vendor}\`\n`;
    }
    doc += `\n**Three.js Canvas Initialization Recipe:**\n`;
    doc += `\`\`\`typescript\nimport * as THREE from "three";\n\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);\nconst renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });\nrenderer.setSize(window.innerWidth, window.innerHeight);\ndocument.getElementById("canvas-container")?.appendChild(renderer.domElement);\n\nfunction animate() {\n  requestAnimationFrame(animate);\n  renderer.render(scene, camera);\n}\nanimate();\n\`\`\`\n\n`;
  }

  // 3. Spline 3D
  const splineLib = detected.find((l) => l.library === "spline");
  if (splineLib) {
    const cfg = splineLib.config as SplineConfig | undefined;
    doc += `### 🪐 Spline 3D Viewport\n`;
    doc += `- **Status**: Active (${cfg?.viewerCount || 1} viewer embedded)\n`;
    if (cfg?.urls && cfg.urls.length > 0) {
      doc += `- **Scene URLs**:\n${cfg.urls.map((u) => `  - [${u}](${u})`).join("\n")}\n\n`;
      doc += `**Spline Embed Snippet:**\n`;
      doc += `\`\`\`html\n<script type="module" src="https://unpkg.com/@splinetool/viewer@latest/build/spline-viewer.js"></script>\n<spline-viewer url="${cfg.urls[0]}"></spline-viewer>\n\`\`\`\n\n`;
    }
  }

  // 4. GSAP & ScrollTrigger
  const gsapLib = detected.find((l) => l.library === "gsap" || l.library === "gsap-scrolltrigger");
  if (gsapLib) {
    const cfg = gsapLib.config as GSAPConfig | undefined;
    doc += `### ⚡ GSAP & ScrollTrigger (${gsapLib.version || "Active"})\n`;
    doc += `- **Status**: Active (Tier ${gsapLib.tier})\n`;
    doc += `- **Details**: ${gsapLib.description}\n`;
    if (cfg?.triggers && cfg.triggers.length > 0) {
      doc += `\n**Extracted ScrollTrigger Instances (${cfg.triggers.length}):**\n\n`;
      doc += `| # | Trigger Selector | Start | End | Scrub | Pin |\n`;
      doc += `|---|---|---|---|---|---|\n`;
      cfg.triggers.slice(0, 15).forEach((t, i) => {
        doc += `| ${i + 1} | \`${t.trigger}\` | \`${t.start}\` | \`${t.end}\` | ${t.scrub ? `✅ \`${t.scrub}\`` : "❌"} | ${t.pin ? "✅ Yes" : "❌"} |\n`;
      });
      doc += `\n**GSAP ScrollTrigger Implementation Recipe:**\n`;
      doc += `\`\`\`typescript\nimport gsap from "gsap";\nimport { ScrollTrigger } from "gsap/ScrollTrigger";\ngsap.registerPlugin(ScrollTrigger);\n\n// Replicated ScrollTrigger instances:\n`;
      cfg.triggers.slice(0, 5).forEach((t) => {
        doc += `gsap.to("${t.trigger}", {\n  scrollTrigger: {\n    trigger: "${t.trigger}",\n    start: "${t.start}",\n    end: "${t.end}",\n    scrub: ${t.scrub},\n    pin: ${t.pin},\n  },\n});\n`;
      });
      doc += `\`\`\`\n\n`;
    }
  }

  // 5. AOS (Animate on Scroll)
  const aosLib = detected.find((l) => l.library === "aos");
  if (aosLib) {
    const cfg = aosLib.config as AOSConfig | undefined;
    doc += `### 🎭 AOS (Animate on Scroll)\n`;
    doc += `- **Status**: Active (${aosLib.elementCount || 0} elements)\n`;
    if (cfg) {
      doc += `- **Default Duration**: ${cfg.options?.duration}ms\n`;
      doc += `- **Easing**: \`${cfg.options?.easing}\`\n`;
      doc += `- **Offset**: ${cfg.options?.offset}px\n`;
      doc += `- **Trigger Once**: ${cfg.options?.once ? "Yes" : "No"}\n\n`;
      if (cfg.elements && cfg.elements.length > 0) {
        doc += `**Animated Elements:**\n`;
        doc += `| Animation Type | Element Count | Target Selector |\n`;
        doc += `|---|---|---|\n`;
        cfg.elements.forEach((el) => {
          doc += `| \`data-aos="${el.animation}"\` | ${el.count} | \`${el.selector}\` |\n`;
        });
        doc += `\n`;
      }
      doc += `**AOS Initialization Recipe:**\n`;
      doc += `\`\`\`typescript\nimport AOS from "aos";\nimport "aos/dist/aos.css";\n\nAOS.init({\n  duration: ${cfg.options?.duration || 400},\n  easing: "${cfg.options?.easing || "ease"}",\n  offset: ${cfg.options?.offset || 120},\n  once: ${Boolean(cfg.options?.once)},\n});\n\`\`\`\n\n`;
    }
  }

  // 6. Framer Motion
  const framerLib = detected.find((l) => l.library === "framer-motion");
  if (framerLib) {
    const cfg = framerLib.config as FramerMotionConfig | undefined;
    doc += `### 🪄 Framer Motion\n`;
    doc += `- **Status**: Active (${framerLib.elementCount || 0} motion elements)\n`;
    if (cfg) {
      doc += `- **Layout Animations**: ${cfg.hasLayoutAnimations ? "Detected" : "None"}\n`;
      if (cfg.framerVariables && cfg.framerVariables.length > 0) {
        doc += `- **CSS Motion Variables**: \`${cfg.framerVariables.slice(0, 8).join("`, `")}\`\n`;
      }
      doc += `\n**Framer Motion Component Pattern:**\n`;
      doc += `\`\`\`tsx\nimport { motion } from "framer-motion";\n\nexport const MotionCard = ({ children }: { children: React.ReactNode }) => (\n  <motion.div\n    initial={{ opacity: 0, y: 24 }}\n    whileInView={{ opacity: 1, y: 0 }}\n    viewport={{ once: true }}\n    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}\n  >\n    {children}\n  </motion.div>\n);\n\`\`\`\n\n`;
    }
  }

  // 7. CSS 3D Transforms
  if (report.css3dTransforms && report.css3dTransforms.length > 0) {
    doc += `### 📐 CSS 3D Transforms (${report.css3dTransforms.length} elements)\n`;
    doc += `| Element Selector | Perspective | Transform Style | Transform |\n`;
    doc += `|---|---|---|---|\n`;
    report.css3dTransforms.slice(0, 10).forEach((t) => {
      doc += `| \`${t.selector}\` | ${t.perspective || "—"} | ${t.transformStyle || "—"} | \`${t.transform || "—"}\` |\n`;
    });
    doc += `\n`;
  }

  // 8. Vanilla CSS Animations & Keyframes
  if (report.vanillaAnimations) {
    const v = report.vanillaAnimations;
    doc += `### ⚙️ Native CSS Animations & Keyframes\n`;
    doc += `- **Active CSS Animations**: ${v.cssAnimationCount}\n`;
    doc += `- **Active CSS Transitions**: ${v.cssTransitionCount}\n`;
    doc += `- **IntersectionObserver Triggers**: ${v.intersectionObserverDetected ? "Detected" : "None"}\n`;
    if (v.keyframeNames && v.keyframeNames.length > 0) {
      doc += `- **Declared @keyframes**: \`@${v.keyframeNames.join("`, `@")}\`\n`;
    }
    doc += `\n`;
  }

  return doc;
}

export function generateMotionMD(result: ExtractionResult): string {
  let md = `# MOTION & ANIMATION SPECIFICATION — ${result.title}\n`;
  md += `> Source: ${result.url} | Extracted by StyleSnap v${result.version}\n`;
  md += `> Timestamp: ${new Date(result.timestamp).toISOString()}\n\n`;

  if (!result.animations) {
    return md + `*No dynamic motion libraries or custom scroll effects detected on this page.*\n`;
  }

  md += formatFullAnimationDocumentation(result.animations);
  return md;
}

// 3. Drop-in tailwind.config.js Generator
export function generateTailwindConfig(result: ExtractionResult): string {
  const { tokens } = result;

  const colorObj: Record<string, string> = {};
  for (const c of tokens.colors) {
    const key = camelCase(c.suggestedName || `color-${c.id.slice(0, 4)}`);
    colorObj[key] = c.hex;
  }

  const fontObj: Record<string, string[]> = {};
  for (const f of tokens.typography.families) {
    const key = camelCase(f.name);
    const fallbacks = f.stack.split(",").map((s) => s.trim().replace(/['"]/g, ""));
    fontObj[key] = fallbacks;
  }

  const fontSizeObj: Record<string, [string, { lineHeight: string }]> = {};
  for (const entry of tokens.typography.scale) {
    fontSizeObj[entry.role] = [entry.fontSize, { lineHeight: entry.lineHeight }];
  }

  const spacingObj: Record<string, string> = {};
  for (const s of tokens.spacing.values) {
    spacingObj[s.token] = `${s.px}px`;
  }

  const radiusObj: Record<string, string> = {};
  for (const r of tokens.radii) {
    radiusObj[r.level] = r.value;
  }

  const shadowObj: Record<string, string> = {};
  for (const sh of tokens.shadows) {
    shadowObj[sh.level] = sh.value;
  }

  const screensObj: Record<string, string> = {};
  for (const b of tokens.breakpoints) {
    screensObj[b.label] = `${b.px}px`;
  }

  return `/** @type {import('tailwindcss').Config} */
/** Generated by StyleSnap v${result.version} from ${result.url} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorObj, null, 8)},
      fontFamily: ${JSON.stringify(fontObj, null, 8)},
      fontSize: ${JSON.stringify(fontSizeObj, null, 8)},
      spacing: ${JSON.stringify(spacingObj, null, 8)},
      borderRadius: ${JSON.stringify(radiusObj, null, 8)},
      boxShadow: ${JSON.stringify(shadowObj, null, 8)},
      screens: ${JSON.stringify(screensObj, null, 8)},
    },
  },
  plugins: [],
};
`;
}

// 4. Agent-Ready SKILL.md Generator (For Claude Code, Antigravity, Cursor)
export function generateSkillMD(result: ExtractionResult): string {
  const { tokens, layout, components } = result;
  const domain = new URL(result.url).hostname.replace(/^www\./, "");
  const title = result.title.replace(/[\n\r]+/g, " ").trim();

  let skill = `---
name: ${kebabCase(domain)}-design-system
description: Apply the design system, colors, typography, layout, and UI components of ${domain} (${title}). Use this skill whenever building or styling UI elements that should match this website.
---

# ${title} — Design System Skill

> Extracted from [${result.url}](${result.url}) using StyleSnap v${result.version}.
> ${tokens.themeSummary || "Complete design tokens, layout hierarchy, and component conventions for AI coding agents."}

## Overview & Activation Rules
When creating or modifying components for this project:
- **STRICTLY USE** the extracted color palette and spacing scale below.
- **NEVER** use default browser colors (pure red hex #ff0000, plain blue hex #0000ff) or unconfigured Tailwind classes.
- **ENFORCE ACCESSIBILITY**: Maintain strong color contrast ratio against background elements.

---

## 1. CSS Custom Properties (:root)
Paste these CSS variables into your global stylesheet (e.g. \`globals.css\` or \`index.css\`):

\`\`\`css
:root {
`;

  for (const c of tokens.colors) {
    const varName = c.cssVarName || `--color-${kebabCase(c.suggestedName)}`;
    skill += `  ${varName}: ${c.hex};\n`;
  }

  skill += `}\n\`\`\`\n\n`;

  // Colors section
  skill += `## 2. Color Palette Rules\n\n`;
  skill += `| Semantic Role | Suggested Name | Hex | HSL | Context |\n`;
  skill += `|---------------|----------------|-----|-----|---------|\n`;
  for (const c of tokens.colors) {
    skill += `| \`${c.semanticGroup}\` | ${c.suggestedName} | \`${c.hex}\` | \`${c.hsl}\` | ${c.contexts.join(", ")} |\n`;
  }
  skill += `\n`;

  // Do's and Don'ts for Colors
  skill += `### Color Do's & Don'ts\n`;
  skill += `- ✅ **DO** use primary background colors for container surfaces.\n`;
  skill += `- ✅ **DO** use the designated accent colors for interactive CTAs, active tab highlights, and hover states.\n`;
  skill += `- ❌ **DON'T** introduce arbitrary hex values outside of this curated palette.\n\n`;

  // Typography section
  skill += `## 3. Typography & Font Stacks\n\n`;
  if (tokens.typography.families.length > 0) {
    for (const f of tokens.typography.families) {
      skill += `- **${f.name}** (\`${f.category}\`): \`${f.stack}\` (Weights: ${f.weights.join(", ")})\n`;
    }
    skill += `\n`;
  }

  skill += `### Type Scale\n\n`;
  skill += `| Role | Size | Weight | Line Height | Tracking |\n`;
  skill += `|------|------|--------|-------------|----------|\n`;
  for (const entry of tokens.typography.scale) {
    skill += `| \`${entry.role}\` | ${entry.fontSize} | ${entry.fontWeight} | ${entry.lineHeight} | ${entry.letterSpacing} |\n`;
  }
  skill += `\n`;

  // Spacing section
  skill += `## 4. Spacing & Layout Grid\n\n`;
  skill += `- **Base Grid Unit:** ${tokens.spacing.baseUnit}px\n`;
  skill += `- **Extracted Scale Values:** ${tokens.spacing.values.map(v => `\`${v.px}px\``).join(", ")}\n\n`;

  // Shadows & Radii
  skill += `## 5. Visual Hierarchy & Borders\n\n`;
  if (tokens.radii.length > 0) {
    skill += `### Border Radius\n`;
    for (const r of tokens.radii) {
      skill += `- \`${r.level}\`: \`${r.value}\` (${r.valuePx}px)\n`;
    }
    skill += `\n`;
  }

  if (tokens.shadows.length > 0) {
    skill += `### Elevation & Shadows\n`;
    for (const sh of tokens.shadows) {
      skill += `- \`${sh.level}\`: \`${sh.value}\`\n`;
    }
    skill += `\n`;
  }

  if (tokens.zIndex && tokens.zIndex.length > 0) {
    skill += `### Z-Index Layers\n`;
    for (const z of tokens.zIndex) {
      skill += `- \`z-${z.value}\`: ${z.value} (${z.contexts.join(", ")})\n`;
    }
    skill += `\n`;
  }

  // Layout Structure
  if (layout && layout.sections.length > 0) {
    skill += `## 6. Page Architecture & Layout Sections\n\n`;
    skill += `- **Max Content Width:** \`${layout.maxContentWidth}\`\n`;
    skill += `- **Base Grid:** ${layout.baseGrid.type === "css-grid" ? `${layout.baseGrid.columnCount} columns` : "Flexbox"}\n\n`;
    skill += `| # | Section | Tag | Layout Type | Gap | Padding |\n`;
    skill += `|---|---------|-----|-------------|-----|---------|\n`;
    layout.sections.forEach((s, i) => {
      skill += `| ${i + 1} | **${s.label}** | \`<${s.tagName}>\` | ${s.layoutType} | ${s.gap || "—"} | ${s.padding || "—"} |\n`;
    });
    skill += `\n`;
  }

  // Component Patterns
  if (components && components.length > 0) {
    const highConf = components.filter(c => c.confidence >= 0.55);
    if (highConf.length > 0) {
      skill += `## 7. Reusable Component Patterns\n\n`;
      highConf.slice(0, 8).forEach(c => {
        skill += `### ${c.label.toUpperCase()} (\`${c.selector}\`)\n`;
        if (c.css) {
          skill += `\`\`\`css\n${c.selector} {\n${c.css}\n}\n\`\`\`\n`;
        }
        if (c.html) {
          skill += `\`\`\`html\n${c.html}\n\`\`\`\n\n`;
        }
      });
    }
  }

  // Animation Architecture [V3]
  if (result.animations) {
    skill += formatFullAnimationDocumentation(result.animations);
  }

  // Guidelines for AI Agents
  skill += `## 9. Guidelines for AI Coding Agents (Claude Code, Antigravity, Cursor)
1. **Component Scoping**: Wrap all custom styles inside clean utility classes or CSS module tokens.
2. **Animation & Interactions**: Ensure smooth 150ms-200ms ease-in-out transitions on hover/focus state changes.
3. **Responsive Design**: Respect the extracted breakpoints (${tokens.breakpoints.map(b => `${b.label}: ${b.px}px`).join(", ")}).
4. **Fidelity over Defaults**: Always reference the CSS custom properties instead of guessing colors or padding.
`;

  return skill;
}

// 5. Components.md Generator (V2)
export function generateComponentsMD(result: ExtractionResult): string {
  let md = `# Component Library — ${result.title}\n`;
  md += `> Extracted by StyleSnap v${result.version}\n\n`;

  if (!result.components || result.components.length === 0) {
    return md + `*No specific component patterns detected with high confidence on this page.*\n`;
  }

  const highConfidence = result.components.filter(c => c.confidence >= 0.60);
  const uncertain = result.components.filter(c => c.confidence >= 0.45 && c.confidence < 0.60);

  if (highConfidence.length > 0) {
    md += `## Detected Components\n\n`;
    for (const c of highConfidence) {
      md += `### ${c.label} (x${c.instanceCount})\n`;
      md += `**Confidence:** ${(c.confidence * 100).toFixed(1)}%\n`;
      md += `**Signals:** ${c.signals.map(s => s.type).join(", ")}\n\n`;
      
      md += `#### CSS\n\`\`\`css\n${c.selector} {\n${c.css}\n}\n\`\`\`\n\n`;
      md += `#### HTML\n\`\`\`html\n${c.html}\n\`\`\`\n\n`;
      md += `---\n\n`;
    }
  }

  if (uncertain.length > 0) {
    md += `## Uncertain Detections (Low Confidence)\n\n`;
    for (const c of uncertain) {
      md += `### ${c.label} (x${c.instanceCount})\n`;
      md += `**Confidence:** ${(c.confidence * 100).toFixed(1)}%\n\n`;
      md += `#### HTML\n\`\`\`html\n${c.html}\n\`\`\`\n\n`;
      md += `---\n\n`;
    }
  }

  return md;
}

// 6. Tailwind v4 CSS-First @theme Generator (V2)
export function generateTailwindV4CSS(result: ExtractionResult): string {
  const { tokens } = result;

  let css = `/* Generated by StyleSnap v${result.version} from ${result.url} */\n`;
  css += `@import "tailwindcss";\n\n`;
  css += `@theme {\n`;

  // Colors
  if (tokens.colors.length > 0) {
    css += `  /* Colors */\n`;
    const seenColors = new Set<string>();
    for (const c of tokens.colors) {
      const rawName = c.suggestedName || c.cssVarName?.replace(/^--color-|^--/, "") || c.semanticGroup;
      const cleanName = kebabCase(rawName);
      if (!seenColors.has(cleanName)) {
        seenColors.add(cleanName);
        css += `  --color-${cleanName}: ${c.hex};\n`;
      }
    }
    css += `\n`;
  }

  // Typography Families
  if (tokens.typography.families.length > 0) {
    css += `  /* Typography */\n`;
    for (const f of tokens.typography.families) {
      css += `  --font-${kebabCase(f.name)}: ${f.stack};\n`;
    }
    css += `\n`;
  }

  // Type Scale
  if (tokens.typography.scale.length > 0) {
    css += `  /* Type Scale */\n`;
    for (const entry of tokens.typography.scale) {
      css += `  --text-${kebabCase(entry.role)}: ${entry.fontSize};\n`;
    }
    css += `\n`;
  }

  // Spacing
  if (tokens.spacing.values.length > 0) {
    css += `  /* Spacing */\n`;
    for (const s of tokens.spacing.values) {
      const tokenName = s.token.replace(/^space-/, "");
      css += `  --spacing-${tokenName}: ${s.px}px;\n`;
    }
    css += `\n`;
  }

  // Border Radius
  if (tokens.radii.length > 0) {
    css += `  /* Border Radius */\n`;
    for (const r of tokens.radii) {
      css += `  --radius-${r.level}: ${r.value};\n`;
    }
    css += `\n`;
  }

  // Elevation / Shadows
  if (tokens.shadows.length > 0) {
    css += `  /* Box Shadows */\n`;
    for (const sh of tokens.shadows) {
      css += `  --shadow-${sh.level}: ${sh.value};\n`;
    }
    css += `\n`;
  }

  // Breakpoints
  if (tokens.breakpoints.length > 0) {
    css += `  /* Breakpoints */\n`;
    for (const b of tokens.breakpoints) {
      css += `  --breakpoint-${b.label}: ${b.px}px;\n`;
    }
  }

  css += `}\n`;
  return css;
}

