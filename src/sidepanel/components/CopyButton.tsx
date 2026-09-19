// 3-State Micro-Interaction Copy Button Component (Default -> Copied [✓ 1.5s] -> Reset)

import React, { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { useStore } from "../store";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label,
  className = "",
  iconOnly = false
}) => {
  const [state, setState] = useState<"default" | "copied" | "error">("default");
  const showToast = useStore((s) => s.showToast);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setState("copied");
      showToast("Copied to clipboard!", "success");
      setTimeout(() => setState("default"), 1500);
    } catch {
      setState("error");
      showToast("Failed to copy", "error");
      setTimeout(() => setState("default"), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors duration-150 border ${
        state === "copied"
          ? "border-success bg-success/10 text-success"
          : state === "error"
          ? "border-error bg-error/10 text-error"
          : "border-border bg-surface text-secondary hover:text-primary hover:bg-hover"
      } ${className}`}
      title={label || "Copy to clipboard"}
      aria-label={label || "Copy to clipboard"}
    >
      {state === "copied" ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : state === "error" ? (
        <X className="w-3.5 h-3.5 text-error" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {!iconOnly && (
        <span>
          {state === "copied" ? "Copied" : state === "error" ? "Error" : label || "Copy"}
        </span>
      )}
    </button>
  );
};
