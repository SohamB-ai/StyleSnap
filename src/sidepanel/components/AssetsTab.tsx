// Assets Tab View Component (Images, Inline SVGs, Icons, Favicons, ZIP Export)

import React, { useState } from "react";
import { Image as ImageIcon, Archive } from "lucide-react";
import { useStore } from "../store";
import { CopyButton } from "./CopyButton";
import { MessageType } from "../../shared/messages";

export const AssetsTab: React.FC = () => {
  const result = useStore((s) => s.result);
  const [filter, setFilter] = useState<"all" | "images" | "svgs" | "icons">("all");

  if (!result) return null;

  const { assets } = result;

  const handleDownloadZip = () => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format: "assets-zip", extractionId: result.id }
    });
  };

  const filteredImages = filter === "svgs" || filter === "icons" ? [] : assets.images;
  const filteredSvgs = filter === "images"
    ? []
    : filter === "icons"
    ? assets.svgs.filter((s) => s.isIcon)
    : filter === "svgs"
    ? assets.svgs.filter((s) => !s.isIcon)
    : assets.svgs;

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header Filter Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-border">
          {(["all", "images", "svgs", "icons"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-[11px] font-medium rounded capitalize transition-colors ${
                filter === type
                  ? "bg-accent text-accent-contrast font-semibold shadow-xs"
                  : "text-secondary hover:text-primary hover:bg-hover"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Download All ZIP */}
        <button
          onClick={handleDownloadZip}
          className="h-8 px-2.5 bg-accent/10 border border-accent text-accent hover:bg-accent hover:text-accent-contrast text-xs font-semibold rounded flex items-center gap-1.5 transition-all active:scale-95"
          title="Download All Assets as ZIP"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>ZIP</span>
        </button>
      </div>

      {/* Favicon Card */}
      {assets.favicon && (
        <div className="bg-surface border border-border rounded-md p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-elevated border border-border flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={assets.favicon.dataUri}
                alt="Favicon"
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-primary">Favicon</div>
              <div className="text-[10px] text-secondary font-mono truncate max-w-[140px]">
                {assets.favicon.href}
              </div>
            </div>
          </div>
          <CopyButton textToCopy={assets.favicon.href} label="Copy URL" />
        </div>
      )}

      {/* Assets Grid (4 columns) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
          Assets ({filteredImages.length + filteredSvgs.length})
        </h4>

        <div className="grid grid-cols-3 gap-2">
          {/* Images */}
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="bg-surface border border-border rounded-md p-1.5 flex flex-col items-center justify-between group hover:border-accent/60 transition-all relative overflow-hidden"
            >
              <div className="w-full h-16 bg-elevated rounded flex items-center justify-center overflow-hidden mb-1.5">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>

              <span className="text-[9px] font-mono text-muted truncate w-full text-center">
                {img.naturalWidth > 0 ? `${img.naturalWidth}x${img.naturalHeight}` : "Image"}
              </span>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-base/90 p-2 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <CopyButton textToCopy={img.src} label="URL" className="w-full text-[10px] py-0.5" />
              </div>
            </div>
          ))}

          {/* SVGs */}
          {filteredSvgs.map((svg) => (
            <div
              key={svg.id}
              className="bg-surface border border-border rounded-md p-1.5 flex flex-col items-center justify-between group hover:border-accent/60 transition-all relative overflow-hidden"
            >
              <div
                className="w-full h-16 bg-elevated rounded flex items-center justify-center p-2 text-primary shrink-0"
                dangerouslySetInnerHTML={{ __html: svg.svgContent }}
              />

              <span className="text-[9px] font-mono text-muted truncate w-full text-center">
                {svg.isIcon ? "Icon" : "SVG"}
              </span>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-base/90 p-2 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <CopyButton textToCopy={svg.svgContent} label="SVG" className="w-full text-[10px] py-0.5" />
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && filteredSvgs.length === 0 && (
          <div className="text-center py-8 text-xs text-muted">
            No assets found for selected filter
          </div>
        )}
      </div>
    </div>
  );
};
