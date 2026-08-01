// Toast Notification Component

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useStore } from "../store";

export const Toast: React.FC = () => {
  const toast = useStore((s) => s.toast);

  if (!toast) return null;

  return (
    <div className="absolute bottom-16 right-4 z-50 animate-in slide-in-from-bottom-2 duration-200">
      <div
        className={`px-3 py-2 rounded-md shadow-lg bg-elevated border-l-4 border-y border-r border-border text-xs flex items-center gap-2 max-w-[260px] ${
          toast.type === "error" ? "border-l-error text-error" : "border-l-success text-primary"
        }`}
      >
        {toast.type === "error" ? (
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        )}
        <span className="font-medium text-xs truncate">{toast.message}</span>
      </div>
    </div>
  );
};
