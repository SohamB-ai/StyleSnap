// src/sidepanel/components/AnimationsTab.tsx
// Full Motion & 3D / WebGL Detection View in StyleSnap Side Panel

import React from "react";
import { useStore } from "../store";
import { TierBadge } from "./TierBadge";
import { LibraryCard } from "./LibraryCard";
import { CopyButton } from "./CopyButton";
import { Clapperboard, Box, Sparkles, Layers, Info } from "lucide-react";

export const AnimationsTab: React.FC = () => {
  const result = useStore((state) => state.result);
  const showToast = useStore((state) => state.showToast);

  if (!result) return null;

  const animations = result.animations;

  if (!animations) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary mb-3">
          <Clapperboard className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No Animation Data</h3>
        <p className="text-xs text-secondary max-w-[260px]">
          Re-extract the page with motion detection enabled to scan for GSAP, Framer Motion, AOS, and WebGL.
        </p>
      </div>
    );
  }

  const detectedLibs = animations.libraries.filter((l) => l.detected);
  const vanilla = animations.vanillaAnimations;
  const webgl = animations.webglDetails;
  const transforms = animations.css3dTransforms;

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      {/* Header & Tier Status */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/10 text-accent">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
              Motion & 3D Detection
            </h3>
            <p className="text-[10px] text-secondary">
              Method: <span className="font-mono">{animations.injectionMethod}</span>
            </p>
          </div>
        </div>
        <TierBadge tier={animations.overallTier} />
      </div>

      {/* Summary Banner */}
      <div className="p-3 rounded-lg bg-surface border border-border flex items-start gap-2.5">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-primary leading-relaxed">{animations.summary}</p>
      </div>

      {/* Detected Libraries */}
      {detectedLibs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Detected Libraries ({detectedLibs.length})
            </h4>
          </div>
          <div className="space-y-2">
            {detectedLibs.map((lib) => (
              <LibraryCard key={lib.library} library={lib} />
            ))}
          </div>
        </div>
      )}

      {/* 3D & WebGL Section */}
      {(animations.hasWebGL || (transforms && transforms.length > 0)) && (
        <div className="space-y-2 pt-1 border-t border-border">
          <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-cyan-500" />
            3D & WebGL Capabilities
          </h4>
          <div className="p-3 rounded-lg border border-border bg-base space-y-2 text-xs">
            {webgl && (
              <div className="grid grid-cols-2 gap-2 text-secondary">
                <div>
                  Version:{" "}
                  <span className="font-mono font-medium text-primary">
                    WebGL {webgl.webglVersion}
                  </span>
                </div>
                <div>
                  Canvases:{" "}
                  <span className="font-mono font-medium text-primary">
                    {webgl.canvasCount}
                  </span>
                </div>
                {webgl.renderer && (
                  <div className="col-span-2 text-[11px] truncate">
                    GPU: <span className="text-primary font-mono">{webgl.renderer}</span>
                  </div>
                )}
              </div>
            )}

            {transforms && transforms.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-[11px] text-secondary">
                  CSS 3D Transforms ({transforms.length} elements):
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                  {transforms.map((t, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-surface border border-border flex justify-between gap-2"
                    >
                      <span className="text-primary truncate">{t.selector}</span>
                      <span className="text-secondary shrink-0">
                        {t.perspective || t.transformStyle || "3d"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vanilla CSS Animations Section */}
      <div className="space-y-2 pt-1 border-t border-border">
        <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          Native CSS & Keyframes
        </h4>
        <div className="p-3 rounded-lg border border-border bg-base space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-secondary">
            <div>
              Active CSS Animations:{" "}
              <span className="font-mono font-medium text-primary">
                {vanilla.cssAnimationCount}
              </span>
            </div>
            <div>
              Active CSS Transitions:{" "}
              <span className="font-mono font-medium text-primary">
                {vanilla.cssTransitionCount}
              </span>
            </div>
            <div>
              IntersectionObserver:{" "}
              <span className="font-mono font-medium text-primary">
                {vanilla.intersectionObserverDetected ? "Detected" : "None"}
              </span>
            </div>
          </div>

          {vanilla.keyframeNames && vanilla.keyframeNames.length > 0 && (
            <div className="pt-2 border-t border-border space-y-1.5">
              <span className="text-[11px] text-secondary">
                Detected @keyframes ({vanilla.keyframeNames.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {vanilla.keyframeNames.slice(0, 15).map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-primary"
                  >
                    @{name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-2">
        <CopyButton
          textToCopy={animations.summary}
          label="Copy Summary"
        />
        <CopyButton
          textToCopy={JSON.stringify(animations, null, 2)}
          label="Copy JSON"
        />
      </div>
    </div>
  );
};
