// Tab Bar Component — TypeUI DESIGN.md style full-width segmented control

import React from "react";
import { useStore, TabType } from "../store";

export const TabBar: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setTab);

  return (
    <nav className="px-3.5 pt-3 pb-1 select-none">
      <div className="bg-elevated p-[3px] rounded-lg flex w-full gap-1 border border-border/50">
        <button
          onClick={() => setTab("tokens")}
          className={`flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
            activeTab === "tokens" || activeTab === "export"
              ? "bg-accent text-white shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          DESIGN.md
        </button>
        <button
          onClick={() => setTab("assets")}
          className={`flex-1 py-1.5 px-3 rounded-md font-mono text-xs font-semibold text-center transition-all ${
            activeTab === "assets"
              ? "bg-accent text-white shadow-sm"
              : "text-secondary hover:text-primary hover:bg-hover/50"
          }`}
        >
          SKILL.md
        </button>
      </div>
    </nav>
  );
};

