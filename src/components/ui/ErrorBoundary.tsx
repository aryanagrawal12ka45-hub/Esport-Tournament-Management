import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
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
    console.error(`[ArenaDB ErrorBoundary caught in ${this.props.sectionName || 'Section'}]:`, error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-8 rounded-xl bg-surface border-2 border-danger shadow-2xl text-center space-y-4 my-6 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-danger-soft border border-danger-token flex items-center justify-center mx-auto text-danger-token">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-token">
            {this.props.sectionName || 'Section'} Encountered an Error
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto font-mono">
            {this.state.error?.message || 'An unexpected runtime error occurred while rendering this component.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-danger-soft hover:bg-danger text-xs font-mono font-bold text-danger-token hover:text-white border border-danger-token inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload section</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
