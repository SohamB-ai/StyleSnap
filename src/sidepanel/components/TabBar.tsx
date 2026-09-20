// Tab Bar Component — TypeUI DESIGN.md style full-width segmented control

import React from "react";
import { useStore, TabType } from "../store";

export const TabBar: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setTab);

  const result = useStore((s) => s.result);
  
  const hasV2Data = result && result.version.startsWith("2.");

  return (
    <nav className="px-3.5 pt-3 pb-1 select-none">
      <div className="bg-elevated p-[3px] rounded-lg flex w-full gap-1 border border-border/50 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab("tokens")}
          className={`shrink-0 flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
            activeTab === "tokens" || activeTab === "export"
              ? "bg-accent text-white shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          TOKENS
        </button>
        {hasV2Data && (
          <>
            <button
              onClick={() => setTab("layout")}
              className={`shrink-0 flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
                activeTab === "layout"
                  ? "bg-accent text-white shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-hover/50"
              }`}
            >
              LAYOUT
            </button>
            <button
              onClick={() => setTab("components")}
              className={`shrink-0 flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
                activeTab === "components"
                  ? "bg-accent text-white shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-hover/50"
              }`}
            >
              COMPONENTS
            </button>
            <button
              onClick={() => setTab("ai-prompt")}
              className={`shrink-0 flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
                activeTab === "ai-prompt"
                  ? "bg-accent text-white shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-hover/50"
              }`}
            >
              PROMPT
            </button>
          </>
        )}
        <button
          onClick={() => setTab("assets")}
          className={`shrink-0 flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
            activeTab === "assets"
              ? "bg-accent text-white shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          ASSETS
        </button>
      </div>
    </nav>
  );
};

