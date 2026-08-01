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
    "box-shadow": shadowGroup
  };

  return JSON.stringify(dtcgPayload, null, 2);
}

// 2. DESIGN.md AI-Readable Markdown Generator
export function generateDesignMD(result: ExtractionResult): string {
  const { tokens } = result;
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
  md += `| Role | Size | Weight | Line Height |\n`;
  md += `|------|------|--------|-------------|\n`;
  for (const entry of tokens.typography.scale) {
    md += `| ${entry.role} | ${entry.fontSize} | ${entry.fontWeight} | ${entry.lineHeight} |\n`;
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

  // Breakpoints
  if (tokens.breakpoints.length > 0) {
    md += `## Breakpoints\n\n`;
    md += `| Label | px | em |\n`;
    md += `|-------|----|----|\n`;
    for (const b of tokens.breakpoints) {
      md += `| ${b.label} | ${b.px}px | ${b.em} |\n`;
    }
  }

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
