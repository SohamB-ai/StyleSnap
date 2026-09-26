// V2 Multi-Agent Prompt Engine
// Tailored prompt generators for Cursor, Claude Code, v0 by Vercel, Bolt.new, and Lovable

import { ExtractionResult, Component, PageSection, ColorToken } from "../../shared/types";
import { generateDesignMD, generateTailwindConfig, generateTailwindV4CSS } from "./exporter";

// Helper to estimate tokens (rough estimate: 1 token ≈ 4 characters)
function truncateToTokenLimit(text: string, tokenLimit: number): string {
  const charLimit = tokenLimit * 4;
  if (text.length <= charLimit) return text;
  return text.substring(0, charLimit) + "\n\n... [Content truncated to match target token limit]";
}

export type AITool = "cursor" | "claude-code" | "v0" | "bolt" | "lovable";

// ── Shared Helpers ─────────────────────────────────────────────────────────────

function formatColorsList(colors: ColorToken[]): string {
  return colors
    .slice(0, 15)
    .map((c) => `- **${c.suggestedName}**: \`${c.hex}\` (${c.hsl}) — Semantic role: *${c.semanticGroup}*, contexts: [${c.contexts.join(", ")}]`)
    .join("\n");
}

function formatTypographyScale(result: ExtractionResult): string {
  const scale = result.tokens.typography.scale;
  if (!scale || scale.length === 0) return "- Base Font: 16px, System Sans-Serif";
  return scale
    .slice(0, 10)
    .map((s) => `- \`${s.role}\`: size: ${s.fontSize}, weight: ${s.fontWeight}, line-height: ${s.lineHeight}${s.letterSpacing !== "normal" ? `, tracking: ${s.letterSpacing}` : ""}`)
    .join("\n");
}

function formatLayoutSections(sections?: PageSection[]): string {
  if (!sections || sections.length === 0) return "- Standard vertical single-page flow";
  return sections
    .map((s, idx) => {
      const details = [
        `type: ${s.layoutType}`,
        s.gridCols ? `cols: ${s.gridCols}` : null,
        s.gap ? `gap: ${s.gap}` : null,
        s.padding && s.padding !== "0px" ? `padding: ${s.padding}` : null
      ]
        .filter(Boolean)
        .join(", ");
      return `${idx + 1}. **<${s.tagName}> [${s.label}]**: ${details}`;
    })
    .join("\n");
}

function formatComponents(components?: Component[], maxCount = 8): string {
  if (!components || components.length === 0) return "*No specific repeated component patterns detected.*";
  return components
    .filter((c) => c.confidence >= 0.50)
    .slice(0, maxCount)
    .map((c) => {
      let snippet = `#### ${c.label.toUpperCase()} (${c.selector}, x${c.instanceCount} instances)\n`;
      snippet += `Confidence: ${(c.confidence * 100).toFixed(0)}%\n`;
      if (c.css) {
        snippet += `\`\`\`css\n${c.selector} {\n${c.css}\n}\n\`\`\`\n`;
      }
      if (c.html) {
        snippet += `\`\`\`html\n${c.html}\n\`\`\`\n`;
      }
      return snippet;
    })
    .join("\n");
}

// ── 1. v0 by Vercel Generator (~4,000 tokens) ──────────────────────────────────
// v0 is component-first and natively integrates shadcn/ui + Tailwind CSS.
export function generateV0Prompt(result: ExtractionResult): string {
  const { tokens, layout, components } = result;

  let prompt = `You are an expert React + Tailwind CSS + shadcn/ui frontend engineer.\n`;
  prompt += `Build a pixel-accurate, modern web page replicating the visual design system of "${result.title}" (${result.url}).\n\n`;

  prompt += `## 1. Visual Theme & Style\n`;
  prompt += `${tokens.themeSummary || "Clean modern web design system"}\n\n`;

  prompt += `## 2. Color Palette (Map to Tailwind classes & CSS variables)\n`;
  prompt += `${formatColorsList(tokens.colors)}\n\n`;

  prompt += `## 3. Typography Hierarchy\n`;
  if (tokens.typography.families.length > 0) {
    prompt += `**Font Family:** ${tokens.typography.families[0].stack}\n\n`;
  }
  prompt += `**Type Scale:**\n${formatTypographyScale(result)}\n\n`;

  prompt += `## 4. Spacing, Radii & Elevation\n`;
  prompt += `- **Base Spacing Grid:** ${tokens.spacing.baseUnit}px\n`;
  prompt += `- **Spacing Scale:** ${tokens.spacing.values.slice(0, 8).map((v) => `${v.px}px`).join(", ")}\n`;
  prompt += `- **Border Radii:** ${tokens.radii.map((r) => `${r.level}: ${r.value}`).join(", ") || "Default radii"}\n`;
  prompt += `- **Shadows:** ${tokens.shadows.map((s) => `${s.level}: ${s.value}`).join(" | ") || "Default elevation"}\n\n`;

  if (layout && layout.sections.length > 0) {
    prompt += `## 5. Page Layout Architecture\n`;
    prompt += `- **Max Content Width:** ${layout.maxContentWidth}\n`;
    prompt += `- **Base Grid:** ${layout.baseGrid.type === "css-grid" ? `${layout.baseGrid.columnCount} columns` : "Flexbox / mixed"}\n\n`;
    prompt += `**Ordered Sections:**\n${formatLayoutSections(layout.sections)}\n\n`;
  }

  prompt += `## 6. Component Specs (Map to shadcn/ui equivalents)\n`;
  prompt += `Where applicable, use standard shadcn/ui components (Button, Card, Input, Badge, Dialog, Table, Tabs) styled with the exact CSS and HTML structures below:\n\n`;
  prompt += `${formatComponents(components, 6)}\n\n`;

  prompt += `## 7. Implementation Guidelines for v0\n`;
  prompt += `1. **Use Lucide React icons** for any iconography.\n`;
  prompt += `2. **Strict color fidelity:** Never use default blue or arbitrary hex codes; strictly use the extracted palette.\n`;
  prompt += `3. **Responsive design:** Mobile-first layout scaling up across standard breakpoints (${tokens.breakpoints.map((b) => `${b.label}: ${b.px}px`).join(", ")}).\n`;
  prompt += `4. **Interactive polish:** Add hover states with \`transition-all duration-150\` to all buttons, links, and cards.\n`;

  return truncateToTokenLimit(prompt, 4000);
}

// ── 2. Lovable Generator (~3,000 tokens) ────────────────────────────────────────
// Lovable uses the Minimum Lovable Prompt (MLP) framework: Context, Visual Style, Layout, Components, Guardrails.
export function generateLovablePrompt(result: ExtractionResult): string {
  const { tokens, layout, components } = result;

  let prompt = `Create a beautiful, fully functional web application inspired by the design system of "${result.title}".\n\n`;

  prompt += `### 1. Vision & Context\n`;
  prompt += `- **Target Inspiration:** ${result.title} (${result.url})\n`;
  prompt += `- **Design Vibe:** ${tokens.themeSummary || "Modern SaaS, polished typography, and crisp visual hierarchy."}\n`;
  prompt += `- **Framework:** React + Tailwind CSS + Lucide Icons\n\n`;

  prompt += `### 2. Strict Visual Style Rules\n`;
  prompt += `**Colors to Use (Do NOT use default browser colors):**\n`;
  prompt += `${formatColorsList(tokens.colors.slice(0, 10))}\n\n`;

  prompt += `**Typography:**\n`;
  prompt += `- Primary Font: ${tokens.typography.families[0]?.stack || "Inter, system-ui, sans-serif"}\n`;
  prompt += `${formatTypographyScale(result)}\n\n`;

  prompt += `**Surfaces & Borders:**\n`;
  prompt += `- Border Radius scale: ${tokens.radii.map((r) => `${r.level}: ${r.value}`).join(", ") || "4px, 8px, 12px"}\n`;
  prompt += `- Shadows: ${tokens.shadows.map((s) => `${s.level}: ${s.value}`).join(" | ") || "sm, md, lg"}\n`;
  prompt += `- Spacing scale: ${tokens.spacing.values.slice(0, 8).map((v) => `${v.px}px`).join(", ")}\n\n`;

  if (layout && layout.sections.length > 0) {
    prompt += `### 3. Page Structure & Layout (Build in this exact order)\n`;
    prompt += `${formatLayoutSections(layout.sections)}\n\n`;
  }

  if (components && components.length > 0) {
    prompt += `### 4. Core Component Blueprints\n`;
    prompt += `${formatComponents(components, 5)}\n\n`;
  }

  prompt += `### 5. Guardrails & Polish\n`;
  prompt += `- Ensure high contrast text readability on all surface backgrounds.\n`;
  prompt += `- Add smooth 150ms transitions on all hover, active, and focus states.\n`;
  prompt += `- Make every section fully responsive for mobile, tablet, and desktop.\n`;
  prompt += `- Keep component state interactive (toggles, modals, tabs work with React state).\n`;

  return truncateToTokenLimit(prompt, 3000);
}

// ── 3. Cursor AI Generator (~5,000 tokens) ──────────────────────────────────────
// Layered prompt with .cursorrules instructions, design tokens, and components.
export function generateCursorPrompt(result: ExtractionResult): string {
  const { tokens, layout, components } = result;
  const baseDesign = generateDesignMD(result);
  const tailwind = generateTailwindConfig(result);

  let prompt = `You are Cursor AI acting as a senior UI engineer. Apply the following extracted design system from "${result.title}" to the project.\n\n`;

  prompt += `### .cursorrules & Design Guidelines\n`;
  prompt += `\`\`\`markdown\n`;
  prompt += `# Project UI Rules — ${result.title}\n`;
  prompt += `- Strictly use the extracted Tailwind configuration and CSS custom properties below.\n`;
  prompt += `- When styling elements, never hardcode arbitrary hex colors; use the semantic color tokens.\n`;
  prompt += `- Follow atomic design principles: atoms (buttons, badges) -> molecules (cards, forms) -> organisms (sections).\n`;
  prompt += `- Respect the responsive breakpoint system: ${tokens.breakpoints.map((b) => `${b.label} (${b.px}px)`).join(", ")}.\n`;
  prompt += `\`\`\`\n\n`;

  prompt += `### TAILWIND CONFIGURATION (tailwind.config.js)\n`;
  prompt += `\`\`\`javascript\n${tailwind}\n\`\`\`\n\n`;

  if (layout && layout.sections.length > 0) {
    prompt += `### PAGE ARCHITECTURE & LAYOUT\n`;
    prompt += `- Max content width: ${layout.maxContentWidth}\n`;
    prompt += `- Grid system: ${layout.baseGrid.type} (${layout.baseGrid.columnCount} cols)\n\n`;
    prompt += `${formatLayoutSections(layout.sections)}\n\n`;
  }

  prompt += `### DETECTED COMPONENT LIBRARY\n`;
  prompt += `${formatComponents(components, 8)}\n\n`;

  prompt += `### FULL DESIGN SPECIFICATION (DESIGN.md)\n`;
  prompt += `${baseDesign}\n`;

  return truncateToTokenLimit(prompt, 5000);
}

// ── 4. Claude Code Generator (~7,000 tokens) ────────────────────────────────────
// Structured SKILL.md format with progressive disclosure and full token/component tables.
export function generateClaudeCodePrompt(result: ExtractionResult): string {
  const { tokens, layout, components } = result;
  const domain = new URL(result.url).hostname.replace(/^www\./, "");

  let prompt = `---\n`;
  prompt += `name: ${domain.replace(/\W/g, "-")}-design-system\n`;
  prompt += `description: Complete design system skill and token specification for ${result.title} (${domain}). Use when implementing, styling, or refactoring UI components.\n`;
  prompt += `---\n\n`;

  prompt += `# Design System Skill: ${result.title}\n`;
  prompt += `> Source: ${result.url} | Extracted by StyleSnap v${result.version}\n`;
  prompt += `> ${tokens.themeSummary || "Complete design tokens, layout hierarchy, and reusable components."}\n\n`;

  prompt += `## CSS Custom Properties (:root)\n`;
  prompt += `\`\`\`css\n:root {\n`;
  if (Object.keys(tokens.cssVariables || {}).length > 0) {
    for (const [k, v] of Object.entries(tokens.cssVariables)) {
      prompt += `  ${k}: ${v};\n`;
    }
  } else {
    for (const c of tokens.colors) {
      prompt += `  ${c.cssVarName || `--color-${c.suggestedName.toLowerCase().replace(/\s+/g, "-")}`}: ${c.hex};\n`;
    }
  }
  prompt += `}\n\`\`\`\n\n`;

  prompt += `## Color Palette & Semantic Roles\n`;
  prompt += `| Token Name | Hex | HSL | Semantic Group | Contexts |\n`;
  prompt += `|------------|-----|-----|----------------|----------|\n`;
  for (const c of tokens.colors) {
    prompt += `| ${c.suggestedName} | \`${c.hex}\` | \`${c.hsl}\` | ${c.semanticGroup} | ${c.contexts.join(", ")} |\n`;
  }
  prompt += `\n`;

  prompt += `## Typography System\n`;
  if (tokens.typography.families.length > 0) {
    for (const f of tokens.typography.families) {
      prompt += `- **${f.name}** (${f.category}): \`${f.stack}\` (weights: ${f.weights.join(", ")})\n`;
    }
    prompt += `\n`;
  }
  prompt += `| Role | Size | Weight | Line Height | Tracking |\n`;
  prompt += `|------|------|--------|-------------|----------|\n`;
  for (const s of tokens.typography.scale) {
    prompt += `| \`${s.role}\` | ${s.fontSize} | ${s.fontWeight} | ${s.lineHeight} | ${s.letterSpacing} |\n`;
  }
  prompt += `\n`;

  prompt += `## Spacing, Borders & Shadows\n`;
  prompt += `- **Grid base unit:** ${tokens.spacing.baseUnit}px\n`;
  prompt += `- **Spacing values:** ${tokens.spacing.values.map((v) => `\`${v.px}px\``).join(", ")}\n`;
  prompt += `- **Border Radii:** ${tokens.radii.map((r) => `\`${r.level}\`: ${r.value}`).join(", ") || "Default"}\n`;
  prompt += `- **Shadows:** ${tokens.shadows.map((s) => `\`${s.level}\`: ${s.value}`).join(" | ") || "Default"}\n\n`;

  if (layout && layout.sections.length > 0) {
    prompt += `## Layout Architecture & Sections\n`;
    prompt += `- Max width: ${layout.maxContentWidth}\n`;
    prompt += `- Base grid: ${layout.baseGrid.type} (${layout.baseGrid.columnCount} columns)\n\n`;
    prompt += `${formatLayoutSections(layout.sections)}\n\n`;
  }

  if (components && components.length > 0) {
    prompt += `## Extracted Components & Code Snippets\n`;
    prompt += `${formatComponents(components, 10)}\n\n`;
  }

  prompt += `## Instructions for Claude Code\n`;
  prompt += `1. **Consult this skill** before generating any HTML or CSS to ensure 100% token fidelity.\n`;
  prompt += `2. **Use Tailwind CSS v4 or v3 utility classes** that correspond directly to the extracted tokens.\n`;
  prompt += `3. **Maintain accessibility:** Ensure text meets WCAG AA contrast standards against container backgrounds.\n`;
  prompt += `4. **Apply smooth transitions:** All interactive elements must have \`transition-colors duration-150\`.\n`;

  return truncateToTokenLimit(prompt, 7000);
}

// ── 5. Bolt.new Generator (~4,500 tokens) ───────────────────────────────────────
// 5-Step Framework: Vibe, Tone, Tokens, Architecture, Experience.
export function generateBoltPrompt(result: ExtractionResult): string {
  const { tokens, layout, components } = result;

  let prompt = `Build a complete, responsive modern web application based on this design system specification.\n\n`;

  prompt += `### STEP 1: Vibe & Purpose\n`;
  prompt += `Build a pixel-crafted website inspired by "${result.title}" (${result.url}).\n`;
  prompt += `Theme: ${tokens.themeSummary || "Clean, high-performance web experience."}\n\n`;

  prompt += `### STEP 2: Aesthetic Tone & Visual Keywords\n`;
  prompt += `- Style: Modern digital product, crisp typography, clean surface hierarchy.\n`;
  prompt += `- Framework: React + Vite + Tailwind CSS + Lucide Icons\n\n`;

  prompt += `### STEP 3: Design Tokens & CSS Variables\n`;
  prompt += `\`\`\`css\n:root {\n`;
  for (const c of tokens.colors) {
    prompt += `  ${c.cssVarName || `--color-${c.suggestedName.toLowerCase().replace(/\s+/g, "-")}`}: ${c.hex};\n`;
  }
  prompt += `}\n\`\`\`\n\n`;

  prompt += `**Color Palette:**\n${formatColorsList(tokens.colors.slice(0, 12))}\n\n`;
  prompt += `**Typography Scale:**\n${formatTypographyScale(result)}\n\n`;

  if (layout && layout.sections.length > 0) {
    prompt += `### STEP 4: Site Architecture & Page Sections\n`;
    prompt += `- Container Max Width: ${layout.maxContentWidth}\n`;
    prompt += `${formatLayoutSections(layout.sections)}\n\n`;
  }

  if (components && components.length > 0) {
    prompt += `### STEP 5: Interactive Components & Experience\n`;
    prompt += `${formatComponents(components, 6)}\n\n`;
  }

  prompt += `### Execution Instructions\n`;
  prompt += `- Scaffold the component tree with modular files.\n`;
  prompt += `- Use semantic HTML elements (<header>, <nav>, <main>, <section>, <footer>).\n`;
  prompt += `- Implement responsive navigation with mobile drawer/menu.\n`;
  prompt += `- Add hover, active, and focus-visible states across all interactable elements.\n`;

  return truncateToTokenLimit(prompt, 4500);
}

// ── Main Dispatcher ────────────────────────────────────────────────────────────
export function generateMasterPrompt(result: ExtractionResult, tool: AITool): string {
  switch (tool) {
    case "cursor":
      return generateCursorPrompt(result);
    case "claude-code":
      return generateClaudeCodePrompt(result);
    case "v0":
      return generateV0Prompt(result);
    case "bolt":
      return generateBoltPrompt(result);
    case "lovable":
      return generateLovablePrompt(result);
    default:
      return generateCursorPrompt(result);
  }
}
