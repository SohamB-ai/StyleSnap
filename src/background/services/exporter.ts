// Export Format Generators (DESIGN.md, tokens.json, tailwind.config.js)

import { ExtractionResult } from "../../shared/types";

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
    "z-index": zIndexGroup
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
  md += `3. **Elevation on Hover:** Elevate card surfaces with corresponding shadow levels on hover.\n`;

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

  // Guidelines for AI Agents
  skill += `## 8. Guidelines for AI Coding Agents (Claude Code, Antigravity, Cursor)
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

