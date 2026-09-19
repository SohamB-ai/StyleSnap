// Reusable Collapsible Section Accordion Component with "Read More" toggle

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  count?: number | string;
  defaultOpen?: boolean;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  previewSummary?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  defaultOpen = false,
  headerExtra,
  children,
  className = "",
  previewSummary
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`border-b border-border/50 pb-3 last:border-b-0 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between py-1.5 px-0.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left group flex-1 mr-2"
        >
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondary group-hover:text-primary transition-colors">
              {title}
            </h4>
            {count !== undefined && (
              <span className="text-[10px] bg-elevated px-1.5 py-0.2 rounded font-mono text-muted">
                {count}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted group-hover:text-secondary transition-colors" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted group-hover:text-secondary transition-colors" />
          )}
        </button>

        {headerExtra && <div className="shrink-0">{headerExtra}</div>}
      </div>

      {/* Collapsed Preview (if closed) */}
      {!isOpen && previewSummary && (
        <div className="mt-1 cursor-pointer" onClick={() => setIsOpen(true)}>
          {previewSummary}
        </div>
      )}

      {/* Expanded Content Body */}
      {isOpen && (
        <div className="mt-2 space-y-3 animate-in fade-in duration-150">
          {children}
        </div>
      )}

      {/* Read More / Show Less Footer Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full mt-2.5 py-1 px-2 text-[11px] font-medium text-accent hover:text-accent-hover bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-md flex items-center justify-center gap-1 transition-all"
      >
        <span>{isOpen ? "Show Less" : `Read More (${title})`}</span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </section>
  );
};
