// Toast Notification Component — Styled per Task 5 Specification

import React from "react";
import { Check, X } from "lucide-react";
import { useStore } from "../store";

export const Toast: React.FC = () => {
  const toast = useStore((s) => s.toast);
  const dismissToast = useStore((s) => s.dismissToast);

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div className="absolute bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 pointer-events-auto">
      <div
        onClick={dismissToast}
        className={`w-max max-w-[320px] bg-elevated rounded-lg shadow-xl px-3.5 py-2.5 text-xs text-primary flex items-center gap-2 cursor-pointer transition-opacity border-l-4 ${
          isSuccess ? "border-l-success" : "border-l-error"
        }`}
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: isSuccess ? "var(--success)" : "var(--error)"
        }}
      >
        {isSuccess ? (
          <Check className="w-3.5 h-3.5 text-success shrink-0" />
        ) : (
          <X className="w-3.5 h-3.5 text-error shrink-0" />
        )}
        <span className="font-sans text-[12px] text-primary select-none">
          {toast.message}
        </span>
      </div>
    </div>
  );
};
