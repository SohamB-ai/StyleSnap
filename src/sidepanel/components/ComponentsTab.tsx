// V2 Component Library Tab

import React, { useState } from "react";
import { Copy, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useStore } from "../store";
import { Component } from "../../shared/types";

export const ComponentsTab: React.FC = () => {
  const result = useStore((s) => s.result);
  const showToast = useStore((s) => s.showToast);

  if (!result || !result.components) return null;

  const highConfidence = result.components.filter(c => c.confidence >= 0.60);
  const uncertain = result.components.filter(c => c.confidence >= 0.45 && c.confidence < 0.60);

  return (
    <div className="p-3 space-y-4 pb-8">
      {highConfidence.length === 0 && uncertain.length === 0 ? (
        <div className="text-center p-6 text-secondary text-xs">
          No distinctive UI components detected on this page.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              High Confidence ({highConfidence.length})
            </h3>
            {highConfidence.map(c => <ComponentCard key={c.id} component={c} showToast={showToast} />)}
          </div>
          
          {uncertain.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-warning flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Uncertain / Low Confidence ({uncertain.length})
              </h3>
              {uncertain.map(c => <ComponentCard key={c.id} component={c} showToast={showToast} isUncertain />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ComponentCard: React.FC<{ component: Component, showToast: any, isUncertain?: boolean }> = ({ component, showToast, isUncertain }) => {
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${type} copied to clipboard!`, "success");
    });
  };

  return (
    <div className={`border rounded-md bg-surface overflow-hidden ${isUncertain ? 'border-warning/30' : 'border-border'}`}>
      <div 
        className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-primary">{component.label}</span>
          <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">x{component.instanceCount}</span>
        </div>
        <div className="flex items-center gap-2 text-secondary">
          <span className="text-[10px]">{(component.confidence * 100).toFixed(0)}%</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {expanded && (
        <div className="p-2.5 pt-0 space-y-2 border-t border-border/50 mt-1">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-secondary uppercase">HTML Structure</span>
              <button onClick={() => copyToClipboard(component.html, "HTML")} className="text-secondary hover:text-primary"><Copy className="w-3 h-3" /></button>
            </div>
            <pre className="text-[10px] p-2 bg-zinc-950 text-zinc-300 rounded overflow-x-auto border border-zinc-800 font-mono">
              {component.html}
            </pre>
          </div>
          
          {component.css && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-secondary uppercase">Non-Default CSS</span>
                <button onClick={() => copyToClipboard(component.css, "CSS")} className="text-secondary hover:text-primary"><Copy className="w-3 h-3" /></button>
              </div>
              <pre className="text-[10px] p-2 bg-zinc-950 text-zinc-300 rounded overflow-x-auto border border-zinc-800 font-mono">
                {component.selector} {'{\n'}{component.css}{'\n}'}
              </pre>
            </div>
          )}
          
          <div className="flex gap-1 flex-wrap pt-1">
            {component.signals.map((sig, i) => (
              <span key={i} className="text-[9px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded border border-border/50">
                {sig.type}: {sig.detail}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
