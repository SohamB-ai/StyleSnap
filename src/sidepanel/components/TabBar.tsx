// Tab Bar Component — 3-tab navigation [Tokens] [Assets] [History] per V1 spec

import React from "react";
import { Palette, Image, History } from "lucide-react";
import { useStore, Tab } from "../store";

interface TabItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: "tokens", label: "Tokens", icon: Palette },
  { id: "assets", label: "Assets", icon: Image },
  { id: "history", label: "History", icon: History }
];

export const TabBar: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <nav className="w-full border-b border-border bg-surface px-3 flex items-center select-none shrink-0">
      <div className="flex w-full items-center gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`h-[40px] px-3 flex items-center gap-1.5 text-xs transition-colors relative ${
                isActive
                  ? "text-accent font-semibold"
                  : "text-secondary font-normal hover:text-primary hover:bg-hover"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
