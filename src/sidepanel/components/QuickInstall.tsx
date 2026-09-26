// Quick Install Component — Official AI Agent Logos (Claude, Codex, Cursor, Antigravity)

import React, { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";
import { generateSkillMD } from "../../background/services/exporter";
import { AI_AGENTS, AIAgentTarget } from "../../background/services/installPaths";

export const QuickInstall: React.FC = () => {
  const result = useStore((s) => s.result);
  const showToast = useStore((s) => s.showToast);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!result) return null;

  const handleQuickInstall = (agent: AIAgentTarget) => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format: "skill-md", extractionId: result.id }
    }).catch(() => {});

    const skillContent = generateSkillMD(result);
    navigator.clipboard.writeText(skillContent).then(() => {
      setCopiedId(agent.id);
      showToast(`SKILL.md copied for ${agent.name}! Save to ${agent.installPath}`, "success");
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  const renderAgentLogo = (id: string) => {
    switch (id) {
      case "claude-code":
        return (
          <svg className="w-3.5 h-3.5 fill-current text-primary shrink-0" viewBox="0 0 24 24">
            <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
          </svg>
        );
      case "codex":
        return (
          <svg className="w-3.5 h-3.5 fill-none stroke-current text-primary shrink-0" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        );
      case "cursor":
        return (
          <svg className="w-3.5 h-3.5 fill-current text-primary shrink-0" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9L2 6v11l10 5 10-5V6l-10 5z" />
          </svg>
        );
      case "antigravity":
        return (
          <svg className="w-3.5 h-3.5 fill-current text-primary shrink-0" viewBox="0 0 24 24">
            <path d="M12 2C12 2 13 8 18 12C13 16 12 22 12 22C12 22 11 16 6 12C11 8 12 2 12 2Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-1 select-none">
      <h3 className="text-[10px] uppercase font-bold tracking-wider text-secondary">
        Quick install
      </h3>

      <div className="grid grid-cols-2 gap-1.5">
        {AI_AGENTS.map((agent) => {
          const isCopied = copiedId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => handleQuickInstall(agent)}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg border border-border bg-elevated hover:bg-hover hover:border-accent/40 text-primary font-mono text-[11px] transition-all shadow-2xs"
              title={`Copy SKILL.md for ${agent.name} (${agent.installPath})`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {renderAgentLogo(agent.id)}
                <span className="truncate">{agent.name}</span>
              </div>
              {isCopied ? (
                <Check className="w-3 h-3 text-accent shrink-0" />
              ) : (
                <span className="text-[9px] text-muted font-mono shrink-0 opacity-70">
                  SKILL
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


