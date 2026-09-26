// React Error Boundary for StyleSnap Sidepanel
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("StyleSnap Caught UI Error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-xs">
          <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/30 text-error flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-primary mb-1">
            {this.props.fallbackTitle || "Something went wrong in this view"}
          </h3>
          <p className="text-secondary text-[11px] leading-relaxed max-w-[260px] mb-4">
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 bg-accent text-accent-contrast rounded-md font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity active:scale-95 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Extension</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
