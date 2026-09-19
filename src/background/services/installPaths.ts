// AI Coding Agent Quick Install Path Helpers & Guides

export interface AIAgentTarget {
  id: "claude-code" | "codex" | "cursor" | "antigravity";
  name: string;
  badge: string;
  iconColor: string;
  installPath: string;
  guide: string;
}

export const AI_AGENTS: AIAgentTarget[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    badge: "Anthropic",
    iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    installPath: "~/.claude/skills/",
    guide: "Downloads SKILL.md and copies content. Save to ~/.claude/skills/ or project root."
  },
  {
    id: "codex",
    name: "Codex",
    badge: "OpenAI",
    iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    installPath: "~/.codex/skills/",
    guide: "Downloads SKILL.md. Save in ~/.codex/skills/<name>/SKILL.md."
  },
  {
    id: "cursor",
    name: "Cursor",
    badge: "Cursor AI",
    iconColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
    installPath: ".cursor/skills/",
    guide: "Save file as .cursor/skills/<name>/SKILL.md or paste into .cursorrules."
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    badge: "Google AGY",
    iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    installPath: ".agents/skills/",
    guide: "Save in .agents/skills/<name>/SKILL.md or ~/.gemini/config/skills/."
  }
];
