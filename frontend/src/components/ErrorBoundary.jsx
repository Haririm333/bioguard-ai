import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-slate-900 border border-red-500/30 text-white shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
          <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-red-300">Component Display Issue</h3>
          <p className="text-xs text-slate-400 max-w-md">
            {this.state.error?.message || "An unexpected error occurred rendering this module."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
