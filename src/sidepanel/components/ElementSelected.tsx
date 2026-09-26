// Element Inspector Selected View Component

import React from "react";
import { MousePointer2, Code, FileCode } from "lucide-react";
import { useStore } from "../store";
import { CopyButton } from "./CopyButton";
import { MessageType } from "../../shared/messages";
import { getActiveTab } from "../utils/tab";

export const ElementSelected: React.FC = () => {
  const inspectedElement = useStore((s) => s.inspectedElement);
  const setInspectedElement = useStore((s) => s.setInspectedElement);
  const setInspecting = useStore((s) => s.setInspecting);

  if (!inspectedElement) return null;

  const handleInspectAgain = () => {
    setInspectedElement(null);
    setInspecting(true);
    getActiveTab((tab) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: MessageType.INSPECT_ACTIVATE });
      }
    });
  };

  return (
    <div className="p-4 space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Element Header Badge */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-accent bg-accent/15 px-2 py-0.5 rounded border border-accent/30">
            &lt;{inspectedElement.selector}&gt;
          </span>
          <span className="text-[10px] text-muted uppercase tracking-wide">Inspected Element</span>
        </div>
        <button
          onClick={() => setInspectedElement(null)}
          className="text-xs text-secondary hover:text-primary"
        >
          Close
        </button>
      </div>

      {/* Computed CSS Block */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Code className="w-3.5 h-3.5 text-accent" />
            <span>Computed CSS</span>
          </div>
          <CopyButton textToCopy={inspectedElement.css} label="Copy All CSS" />
        </div>

        <pre className="bg-surface border border-border rounded-md p-3 font-mono text-[11px] text-secondary overflow-x-auto max-h-48 leading-relaxed">
          {inspectedElement.css || "/* No custom non-default styles found */"}
        </pre>
      </div>

      {/* HTML Snippet Block */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <FileCode className="w-3.5 h-3.5 text-success" />
            <span>HTML Snippet</span>
          </div>
          <CopyButton textToCopy={inspectedElement.html} label="Copy HTML" />
        </div>

        <pre className="bg-surface border border-border rounded-md p-3 font-mono text-[11px] text-secondary overflow-x-auto max-h-36 leading-relaxed">
          {inspectedElement.html}
        </pre>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleInspectAgain}
          className="flex-1 py-2 bg-accent/10 border border-accent text-accent hover:bg-accent hover:text-accent-contrast font-semibold text-xs rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          <span>Inspect Another Element</span>
        </button>
      </div>
    </div>
  );
};
