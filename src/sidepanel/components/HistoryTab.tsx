// History Tab View Component (Saved Extractions & Cascade Deletion)

import React, { useEffect } from "react";
import { Trash2, ExternalLink, Clock } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";

export const HistoryTab: React.FC = () => {
  const historyEntries = useStore((s) => s.historyEntries);
  const setHistory = useStore((s) => s.setHistory);
  const setResult = useStore((s) => s.setResult);
  const showToast = useStore((s) => s.showToast);

  const fetchHistory = () => {
    chrome.storage?.local.get("stylesnap_history", (res) => {
      const entries = res?.stylesnap_history?.entries || [];
      setHistory(entries);
    });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLoadEntry = (id: string) => {
    chrome.runtime.sendMessage({ type: MessageType.HISTORY_LOAD, payload: { id } }, (response) => {
      if (response?.result) {
        setResult(response.result);
        showToast("Loaded extraction from history", "success");
      }
    });
  };

  const handleDeleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: MessageType.HISTORY_DELETE, payload: { id } }, () => {
      fetchHistory();
      showToast("Entry deleted", "success");
    });
  };

  const handleClearAll = () => {
    chrome.runtime.sendMessage({ type: MessageType.HISTORY_CLEAR }, () => {
      setHistory([]);
      showToast("All history cleared", "success");
    });
  };

  const formatTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">Past Extractions</h4>
          <span className="text-[10px] bg-elevated px-1.5 py-0.5 rounded text-muted font-mono">
            {historyEntries.length}/10
          </span>
        </div>
        {historyEntries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[11px] text-error hover:text-red-400 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {historyEntries.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Clock className="w-8 h-8 text-muted mx-auto" />
          <div className="text-xs font-medium text-secondary">No extraction history yet</div>
          <div className="text-[11px] text-muted max-w-[200px] mx-auto">
            Your last 10 extractions will automatically be saved here.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {historyEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => handleLoadEntry(entry.id)}
              className="bg-surface border border-border rounded-md p-3 flex items-center justify-between group hover:border-accent/60 hover:bg-hover/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded bg-elevated border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {entry.faviconDataUri ? (
                    <img src={entry.faviconDataUri} alt="" className="w-4 h-4 object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-accent">
                      {entry.origin.replace("https://", "")[0]?.toUpperCase() || "S"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold text-xs text-primary truncate max-w-[170px]">
                    {entry.title}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-secondary font-mono">
                    <span className="truncate max-w-[110px]">{entry.origin.replace("https://", "")}</span>
                    <span>•</span>
                    <span className="text-muted">{formatTime(entry.timestamp)}</span>
                  </div>
                  <div className="text-[10px] text-muted">
                    {entry.colorCount} colours • {entry.fontCount} fonts
                  </div>
                </div>
              </div>

              {/* Delete Icon on Hover */}
              <button
                onClick={(e) => handleDeleteEntry(e, entry.id)}
                className="p-1.5 rounded text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete extraction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
