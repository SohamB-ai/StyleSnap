// V2 Layout Structure Tab

import React from "react";
import { LayoutDashboard, Maximize, Columns, Box } from "lucide-react";
import { useStore } from "../store";

export const LayoutView: React.FC = () => {
  const result = useStore((s) => s.result);

  if (!result || !result.layout) return null;

  const { maxContentWidth, baseGrid, sections } = result.layout;

  return (
    <div className="p-3 space-y-4 pb-8">
      {/* Global Settings */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-surface border border-border rounded-md">
          <div className="flex items-center gap-1.5 text-secondary mb-1">
            <Maximize className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Max Width</span>
          </div>
          <div className="font-mono text-xs text-primary">{maxContentWidth}</div>
        </div>
        <div className="p-3 bg-surface border border-border rounded-md">
          <div className="flex items-center gap-1.5 text-secondary mb-1">
            <Columns className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Base Grid</span>
          </div>
          <div className="font-mono text-xs text-primary">
            {baseGrid.type === "css-grid" ? `${baseGrid.columnCount} columns` : "Custom Layout"}
          </div>
        </div>
      </div>

      {/* Sections Breakdown */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Page Sections ({sections.length})
        </h3>
        
        <div className="space-y-1.5 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-border/50">
          {sections.map((section, i) => (
            <div key={section.id} className="relative flex gap-3">
              <div className="w-7 flex shrink-0 items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[9px] font-mono text-secondary z-10">
                  {i + 1}
                </div>
              </div>
              
              <div className="flex-1 bg-surface border border-border rounded-md p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-primary capitalize">{section.label}</span>
                    <span className="text-[9px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-mono">
                      &lt;{section.tagName}&gt;
                    </span>
                  </div>
                  <span className="text-[9px] text-accent font-medium uppercase">{section.layoutType}</span>
                </div>
                
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-secondary">
                  {section.gridCols && (
                    <div className="flex items-center gap-1">
                      <Columns className="w-3 h-3" /> <span className="font-mono truncate max-w-[100px]" title={section.gridCols}>{section.gridCols}</span>
                    </div>
                  )}
                  {section.gap && (
                    <div className="flex items-center gap-1">
                      <span className="font-bold">gap:</span> <span className="font-mono">{section.gap}</span>
                    </div>
                  )}
                  {section.padding && section.padding !== "0px" && (
                    <div className="flex items-center gap-1">
                      <Box className="w-3 h-3" /> <span className="font-mono">{section.padding}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
