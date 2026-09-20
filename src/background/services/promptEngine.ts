import { ExtractionResult } from "../../shared/types";
import { generateDesignMD, generateTailwindConfig } from "./exporter";

// Helper to estimate tokens (rough estimate: 1 token = 4 chars)
function truncateToTokenLimit(text: string, tokenLimit: number): string {
  const charLimit = tokenLimit * 4;
  if (text.length <= charLimit) return text;
  return text.substring(0, charLimit) + "\n\n... [Content truncated due to length limits]";
}

export type AITool = "cursor" | "claude-code" | "v0" | "bolt" | "lovable";

export function generateCursorPrompt(result: ExtractionResult): string {
  // Cursor Budget: ~4000 tokens
  const baseDesign = generateDesignMD(result);
  const tailwind = generateTailwindConfig(result);
  
  let prompt = `Apply the following design system to my current project. Please ensure UI consistency.\n\n`;
  prompt += `### DESIGN SYSTEM (${result.title})\n`;
  prompt += `${baseDesign}\n\n`;
  prompt += `### TAILWIND CONFIGURATION\n`;
  prompt += `\`\`\`javascript\n${tailwind}\n\`\`\`\n`;
  
  if (result.components && result.components.length > 0) {
    prompt += `\n### DETECTED COMPONENTS\n`;
    result.components.filter(c => c.confidence >= 0.60).forEach(c => {
      prompt += `- **${c.label}** (${c.tagName})\n`;
      prompt += `\`\`\`html\n${c.html}\n\`\`\`\n\n`;
    });
  }

  return truncateToTokenLimit(prompt, 4000);
}

export function generateClaudeCodePrompt(result: ExtractionResult): string {
  // Claude Code Budget: ~6000 tokens
  // Uses a more structured SKILL.md format
  let prompt = `---\nname: apply-design-system\ndescription: Applies the extracted design system from ${result.title} to the codebase.\n---\n\n`;
  prompt += `# Design Context: ${result.title}\n\n`;
  
  prompt += `## CSS Variables\n\`\`\`css\n:root {\n`;
  Object.entries(result.tokens.cssVariables || {}).forEach(([k, v]) => {
    prompt += `  ${k}: ${v};\n`;
  });
  prompt += `}\n\`\`\`\n\n`;
  
  if (result.layout && result.layout.sections.length > 0) {
    prompt += `## Layout Structure\n`;
    result.layout.sections.forEach(s => {
      prompt += `- ${s.label}: ${s.layoutType} with ${s.padding} padding\n`;
    });
    prompt += `\n`;
  }
  
  if (result.components && result.components.length > 0) {
    prompt += `## Components\n`;
    result.components.filter(c => c.confidence >= 0.6).forEach(c => {
      prompt += `### ${c.label}\n\`\`\`css\n${c.css}\n\`\`\`\n\`\`\`html\n${c.html}\n\`\`\`\n`;
    });
  }

  prompt += `\n## Instruction\nUse the provided CSS variables, components, and layout structure to build the UI requested by the user. Ensure exact color mapping and spacing compliance.\n`;
  return truncateToTokenLimit(prompt, 6000);
}

export function generateV0Prompt(result: ExtractionResult): string {
  // v0 Budget: ~2000 tokens. Needs to be component-first.
  let prompt = `I want to build a UI that mimics the style of ${result.title}. `;
  prompt += `Please use these components and design tokens to generate the layout.\n\n`;
  
  if (result.components && result.components.length > 0) {
    prompt += `### Core Components (Map these to shadcn/ui where possible)\n`;
    result.components.filter(c => c.confidence >= 0.6).forEach(c => {
      prompt += `**${c.label}**:\n\`\`\`html\n${c.html}\n\`\`\`\n`;
    });
  }
  
  prompt += `\n### Primary Colors\n`;
  result.tokens.colors.slice(0, 5).forEach(c => {
    prompt += `- ${c.value} (${c.suggestedName})\n`;
  });
  
  return truncateToTokenLimit(prompt, 2000);
}

export function generateBoltPrompt(result: ExtractionResult): string {
  // Bolt Budget: ~3000 tokens
  let prompt = `Build a full-stack site with this structure and design system:\n\n`;
  
  if (result.layout) {
    prompt += `### Layout Sections\n`;
    result.layout.sections.forEach(s => {
      prompt += `- [${s.label}] ${s.tagName} - ${s.layoutType} layout\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `### Design Tokens\n\`\`\`css\n:root {\n`;
  Object.entries(result.tokens.cssVariables || {}).forEach(([k, v]) => {
    prompt += `  ${k}: ${v};\n`;
  });
  prompt += `}\n\`\`\`\n\n`;
  
  return truncateToTokenLimit(prompt, 3000);
}

export function generateLovablePrompt(result: ExtractionResult): string {
  // Lovable Budget: ~1500 tokens
  let prompt = `Can you build a beautiful UI inspired by ${result.title}? `;
  prompt += `Here are the design rules to follow:\n\n`;
  
  prompt += `Colors to use:\n`;
  result.tokens.colors.slice(0, 5).forEach(c => {
    prompt += `${c.suggestedName}: ${c.value}\n`;
  });
  
  prompt += `\nTypography base size: ${result.tokens.typography.scale[0]?.fontSize || "16px"}\n`;
  prompt += `Spacing scale: ${result.tokens.spacing.values.map(v => v.token).slice(0, 5).join(", ")}...\n\n`;
  
  if (result.components && result.components.length > 0) {
    prompt += `Use this button style:\n`;
    const btn = result.components.find(c => c.label === "button" || c.tagName === "button");
    if (btn) {
      prompt += `${btn.css}\n`;
    } else {
      prompt += `(Default button styles)\n`;
    }
  }

  return truncateToTokenLimit(prompt, 1500);
}

export function generateMasterPrompt(result: ExtractionResult, tool: AITool): string {
  switch (tool) {
    case "cursor": return generateCursorPrompt(result);
    case "claude-code": return generateClaudeCodePrompt(result);
    case "v0": return generateV0Prompt(result);
    case "bolt": return generateBoltPrompt(result);
    case "lovable": return generateLovablePrompt(result);
    default: return generateCursorPrompt(result);
  }
}
