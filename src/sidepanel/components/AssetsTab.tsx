// Assets Tab View Component — 4-column grid, Copy URL + Copy Data URI, ZIP Export

import React, { useState } from "react";
import { Archive } from "lucide-react";
import { useStore } from "../store";
import { CopyButton } from "./CopyButton";
import { MessageType } from "../../shared/messages";

export const AssetsTab: React.FC = () => {
  const extraction = useStore((s) => s.extraction || s.result);
  const showToast = useStore((s) => s.showToast);
  const [filter, setFilter] = useState<"all" | "images" | "svgs" | "icons">("all");

  if (!extraction) {
    return (
      <div className="p-4 text-center text-xs text-muted">
        No assets extracted yet.
      </div>
    );
  }

  const { assets } = extraction;

  const handleDownloadZip = () => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format: "assets-zip", extractionId: extraction.id }
    });
    showToast("Assets ZIP downloaded", "success");
  };

  const filteredImages = filter === "svgs" || filter === "icons" ? [] : assets.images;
  const filteredSvgs =
    filter === "images"
      ? []
      : filter === "icons"
      ? assets.svgs.filter((s) => s.isIcon)
      : filter === "svgs"
      ? assets.svgs.filter((s) => !s.isIcon)
      : assets.svgs;

  const getSvgDataUri = (svgContent: string) => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
  };

  return (
    <div className="p-3.5 space-y-4 pb-8 select-none">
      {/* Header Filter Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-border">
          {(["all", "images", "svgs", "icons"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded capitalize transition-colors ${
                filter === type
                  ? "bg-accent text-white font-semibold"
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
          className="h-7 px-2.5 bg-accent text-white hover:opacity-90 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
          title="Download All Assets as ZIP"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>ZIP</span>
        </button>
      </div>

      {/* Favicon Card */}
      {assets.favicon && (
        <div className="bg-surface border border-border rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
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
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-primary font-sans">Favicon</div>
              <div className="text-[10px] text-secondary font-mono truncate max-w-[150px]">
                {assets.favicon.href}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CopyButton textToCopy={assets.favicon.href} label="URL" />
            <CopyButton textToCopy={assets.favicon.dataUri} label="URI" />
          </div>
        </div>
      )}

      {/* Assets Grid (4 columns) */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted font-sans">
          Assets ({filteredImages.length + filteredSvgs.length})
        </h4>

        <div className="grid grid-cols-4 gap-2">
          {/* Images */}
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="bg-surface border border-border rounded-lg p-1.5 flex flex-col items-center justify-between group hover:border-accent/60 transition-all relative overflow-hidden"
            >
              <div className="w-full h-14 bg-elevated rounded flex items-center justify-center overflow-hidden mb-1">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>

              <span className="text-[9px] font-mono text-muted truncate w-full text-center">
                {img.naturalWidth > 0 ? `${img.naturalWidth}×${img.naturalHeight}` : "IMG"}
              </span>

              {/* Hover Actions: Copy URL + Copy Data URI */}
              <div className="absolute inset-0 bg-base/95 p-1 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <CopyButton textToCopy={img.src} label="URL" className="w-full text-[9px] py-0.5 px-1" />
                <CopyButton textToCopy={img.src} label="URI" className="w-full text-[9px] py-0.5 px-1" />
              </div>
            </div>
          ))}

          {/* SVGs */}
          {filteredSvgs.map((svg) => {
            const dataUri = getSvgDataUri(svg.svgContent);
            return (
              <div
                key={svg.id}
                className="bg-surface border border-border rounded-lg p-1.5 flex flex-col items-center justify-between group hover:border-accent/60 transition-all relative overflow-hidden"
              >
                <div
                  className="w-full h-14 bg-elevated rounded flex items-center justify-center p-2 text-primary shrink-0 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: svg.svgContent }}
                />

                <span className="text-[9px] font-mono text-muted truncate w-full text-center">
                  {svg.isIcon ? "Icon" : "SVG"}
                </span>

                {/* Hover Actions: Copy SVG + Copy Data URI */}
                <div className="absolute inset-0 bg-base/95 p-1 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <CopyButton textToCopy={svg.svgContent} label="SVG" className="w-full text-[9px] py-0.5 px-1" />
                  <CopyButton textToCopy={dataUri} label="URI" className="w-full text-[9px] py-0.5 px-1" />
                </div>
              </div>
            );
          })}
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
