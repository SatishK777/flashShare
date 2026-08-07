import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
          <div className="glass-strong p-10 rounded-lg max-w-lg text-center shadow-xl border border-error-500/20 premium-ring">
            <div className="w-20 h-20 bg-error-500/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-error-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-text-primary mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-8">
              We encountered an unexpected error. Our team has been notified. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              size="lg" 
              className="w-full h-12 text-base font-semibold"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
