import React from "react";
import { Clock } from "lucide-react";
import { useStore } from "../store";

export const TabBar: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setTab);

  return (
    <nav className="px-3.5 pt-3 pb-1 select-none" aria-label="Main Navigation">
      <div className="bg-elevated p-[3px] rounded-lg flex w-full gap-1 border border-border/50">
        <button
          onClick={() => setTab("ai-prompt")}
          aria-label="Prompt and Tokens Tab"
          className={`shrink-0 flex-1 py-1.5 px-2 rounded-md font-mono text-[11px] font-semibold text-center transition-all ${
            activeTab === "ai-prompt"
              ? "bg-accent text-accent-contrast shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          PROMPT
        </button>
        <button
          onClick={() => setTab("animations")}
          aria-label="Motion and Animations Tab"
          className={`shrink-0 flex-1 py-1.5 px-1.5 rounded-md font-mono text-[10.5px] font-semibold text-center transition-all ${
            activeTab === "animations"
              ? "bg-accent text-accent-contrast shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          MOTION
        </button>
        <button
          onClick={() => setTab("assets")}
          aria-label="Assets Tab"
          className={`shrink-0 flex-1 py-1.5 px-1.5 rounded-md font-mono text-[10.5px] font-semibold text-center transition-all ${
            activeTab === "assets"
              ? "bg-accent text-accent-contrast shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          ASSETS
        </button>
        <button
          onClick={() => setTab("export")}
          aria-label="Export and Components Tab"
          className={`shrink-0 flex-1 py-1.5 px-1.5 rounded-md font-mono text-[10.5px] font-semibold text-center transition-all ${
            activeTab === "export"
              ? "bg-accent text-accent-contrast shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          EXPORT
        </button>
        <button
          onClick={() => setTab("history")}
          aria-label="Extraction History Tab"
          className={`shrink-0 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-md font-mono text-[11px] font-semibold text-center transition-all ${
            activeTab === "history"
              ? "bg-accent text-accent-contrast shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
          title="Past Extractions History"
        >
          <Clock className="w-3 h-3" />
          <span>HISTORY</span>
        </button>
      </div>
    </nav>
  );
};

