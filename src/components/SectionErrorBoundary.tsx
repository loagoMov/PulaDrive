"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  retryKey: number;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryKey: 0,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, retryKey: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in section: ${this.props.sectionName || "unknown"}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      retryKey: prevState.retryKey + 1,
    }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 my-4 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-4 transition-all">
          <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">
              Failed to load {this.props.sectionName || "this section"}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs">
              There was a problem loading the data. Please try again.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-slate-50 cursor-pointer active:scale-95"
          >
            <RotateCw size={13} className="text-slate-500" />
            Tap to Retry
          </button>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.retryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
