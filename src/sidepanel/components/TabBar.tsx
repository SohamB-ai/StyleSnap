// Side Panel Tab Navigation Bar Component

import React from "react";
import { Palette, Image as ImageIcon, History as HistoryIcon } from "lucide-react";
import { useStore, TabType } from "../store";

export const TabBar: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setTab);
  const result = useStore((s) => s.result);

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "tokens", label: "Tokens", icon: Palette, count: result?.tokens.colors.length },
    { id: "assets", label: "Assets", icon: ImageIcon, count: result?.assets.totalCount },
    { id: "history", label: "History", icon: HistoryIcon }
  ];

  return (
    <nav className="h-[40px] bg-base border-b border-border flex items-center px-2 shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-medium border-b-2 transition-all ${
              isActive
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-secondary hover:text-primary hover:bg-hover/50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-elevated text-muted">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
