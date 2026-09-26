// src/sidepanel/components/LibraryCard.tsx
// Displays a detected animation or 3D library with configuration details

import React, { useState } from "react";
import { LibraryDetection, GSAPConfig, AOSConfig, LenisConfig, ThreeConfig } from "../../shared/types";
import { ChevronDown, ChevronRight, Play, Box, Sparkles, Move } from "lucide-react";

interface LibraryCardProps {
  library: LibraryDetection;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ library }) => {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (library.library) {
      case "three-js":
      case "spline":
        return <Box className="w-4 h-4 text-cyan-500" />;
      case "gsap":
      case "gsap-scrolltrigger":
        return <Play className="w-4 h-4 text-emerald-500" />;
      case "framer-motion":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Move className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getDisplayName = () => {
    switch (library.library) {
      case "gsap":
        return "GSAP";
      case "gsap-scrolltrigger":
        return "GSAP + ScrollTrigger";
      case "framer-motion":
        return "Framer Motion";
      case "aos":
        return "AOS (Animate on Scroll)";
      case "lenis":
        return "Lenis Smooth Scroll";
      case "locomotive-scroll":
        return "Locomotive Scroll";
      case "scrollmagic":
        return "ScrollMagic";
      case "three-js":
        return "Three.js (WebGL)";
      case "spline":
        return "Spline 3D";
      default:
        return String(library.library).toUpperCase();
    }
  };

  const renderConfigDetails = () => {
    if (!library.config) return null;

    if (library.library === "gsap-scrolltrigger") {
      const cfg = library.config as GSAPConfig;
      return (
        <div className="mt-2.5 pt-2.5 border-t border-border space-y-2 text-xs">
          <div className="flex items-center justify-between text-secondary">
            <span>ScrollTrigger Instances:</span>
            <span className="font-mono font-medium text-primary">{cfg.triggers?.length || 0}</span>
          </div>
          {cfg.triggers && cfg.triggers.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {cfg.triggers.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded bg-surface border border-border text-[11px] font-mono space-y-0.5"
                >
                  <div className="text-primary font-semibold truncate">{t.trigger}</div>
                  <div className="text-secondary flex gap-3 text-[10px]">
                    <span>start: {t.start}</span>
                    <span>end: {t.end}</span>
                    {t.pin && <span className="text-amber-500 font-bold">pinned</span>}
                    {t.scrub && <span className="text-emerald-500">scrub</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (library.library === "aos") {
      const cfg = library.config as AOSConfig;
      return (
        <div className="mt-2.5 pt-2.5 border-t border-border space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-secondary">
            <div>Default duration: <span className="text-primary font-mono">{cfg.options?.duration}ms</span></div>
            <div>Easing: <span className="text-primary font-mono">{cfg.options?.easing}</span></div>
          </div>
          {cfg.elements && cfg.elements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cfg.elements.map((el, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-primary"
                >
                  {el.animation} ({el.count})
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (library.library === "lenis") {
      const cfg = library.config as LenisConfig;
      return (
        <div className="mt-2.5 pt-2.5 border-t border-border grid grid-cols-2 gap-2 text-xs text-secondary">
          <div>Duration: <span className="text-primary font-mono">{cfg.duration}s</span></div>
          <div>Orientation: <span className="text-primary font-mono">{cfg.orientation}</span></div>
          <div>Smooth Wheel: <span className="text-primary font-mono">{cfg.smoothWheel ? "Yes" : "No"}</span></div>
          <div>Infinite: <span className="text-primary font-mono">{cfg.infinite ? "Yes" : "No"}</span></div>
        </div>
      );
    }

    if (library.library === "three-js") {
      const cfg = library.config as ThreeConfig;
      return (
        <div className="mt-2.5 pt-2.5 border-t border-border grid grid-cols-2 gap-2 text-xs text-secondary">
          <div>Revision: <span className="text-primary font-mono">{cfg.revision}</span></div>
          <div>Canvases: <span className="text-primary font-mono">{cfg.canvasCount}</span></div>
          <div>Context: <span className="text-primary font-mono">WebGL {cfg.webglVersion}</span></div>
        </div>
      );
    }

    return null;
  };

  const hasExpandableConfig = Boolean(
    library.config &&
      (library.library === "gsap-scrolltrigger" ||
        library.library === "aos" ||
        library.library === "lenis" ||
        library.library === "three-js")
  );

  return (
    <div className="p-3 rounded-lg border border-border bg-base hover:border-zinc-500/30 transition-colors">
      <div
        className={`flex items-start justify-between ${
          hasExpandableConfig ? "cursor-pointer" : ""
        }`}
        onClick={() => hasExpandableConfig && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-surface border border-border mt-0.5">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-primary">{getDisplayName()}</h4>
              {library.version && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-border text-secondary">
                  {library.version}
                </span>
              )}
            </div>
            <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
              {library.description}
            </p>
          </div>
        </div>

        {hasExpandableConfig && (
          <button
            type="button"
            className="p-1 text-secondary hover:text-primary transition-colors ml-2"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && renderConfigDetails()}
    </div>
  );
};
