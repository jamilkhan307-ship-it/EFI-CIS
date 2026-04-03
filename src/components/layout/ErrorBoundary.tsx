import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught error strictly caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-red-50 p-6 border-b border-red-100 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h1 className="text-xl font-bold text-red-900 text-center">Something went wrong</h1>
              <p className="text-sm text-red-600 mt-2 text-center">
                The application encountered an unexpected runtime error.
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-100 rounded p-4 mb-6 overflow-auto max-h-32">
                <p className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                  {this.state.error?.message || "Unknown error occurred"}
                </p>
              </div>
              
              <button
                onClick={() => window.location.replace("/")}
                className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
