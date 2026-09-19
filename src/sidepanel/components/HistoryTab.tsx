// History Tab View Component (Saved Extractions & Cascade Deletion)

import React, { useEffect } from "react";
import { Trash2, Clock } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";

export const HistoryTab: React.FC = () => {
  const history = useStore((s) => s.history || s.historyEntries);
  const setHistory = useStore((s) => s.setHistory);
  const setExtraction = useStore((s) => s.setExtraction);
  const setActiveTab = useStore((s) => s.setActiveTab);
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
        setExtraction(response.result);
        setActiveTab("tokens");
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
    const confirmed = window.confirm("Clear all past extractions?");
    if (confirmed) {
      chrome.runtime.sendMessage({ type: MessageType.HISTORY_CLEAR }, () => {
        setHistory([]);
        showToast("All history cleared", "success");
      });
    }
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
    <div className="p-3.5 space-y-4 pb-8 select-none">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted font-sans">Past Extractions</h4>
          <span className="text-[10px] bg-elevated px-1.5 py-0.5 rounded text-muted font-mono">
            {history.length}/10
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[11px] text-error hover:opacity-80 font-medium transition-colors font-sans"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Clock className="w-8 h-8 text-muted mx-auto" />
          <div className="text-xs font-semibold text-primary font-sans">No extraction history yet</div>
          <div className="text-[11px] text-muted max-w-[200px] mx-auto font-sans">
            Your last 10 extractions will automatically be saved here.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              onClick={() => handleLoadEntry(entry.id)}
              className="bg-surface border border-border rounded-lg p-3 flex items-center justify-between group hover:border-accent/60 hover:bg-hover cursor-pointer transition-all"
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
                  <div className="font-semibold text-xs text-primary truncate max-w-[170px] font-sans">
                    {entry.title}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-secondary font-mono">
                    <span className="truncate max-w-[110px]">{entry.origin.replace("https://", "")}</span>
                    <span>•</span>
                    <span className="text-muted">{formatTime(entry.timestamp)}</span>
                  </div>
                  <div className="text-[10px] text-muted font-sans">
                    {entry.colorCount} colours • {entry.fontCount} fonts
                  </div>
                </div>
              </div>

              {/* Delete Icon on Hover */}
              <button
                onClick={(e) => handleDeleteEntry(e, entry.id)}
                className="p-1.5 rounded text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete extraction"
                aria-label="Delete extraction"
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
