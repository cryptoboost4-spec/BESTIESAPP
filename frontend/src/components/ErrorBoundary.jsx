import React from 'react';
import errorTracker from '../services/errorTracking';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to tracking service
    errorTracker.logError({
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full p-8 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-3xl font-display text-text-primary mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-text-secondary mb-6">
              We're sorry for the inconvenience. The error has been logged and we'll fix it soon.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 mb-6 text-left">
                <div className="font-semibold text-danger mb-2">Error Details:</div>
                <div className="text-sm text-text-primary mb-2">{this.state.error.toString()}</div>
                <details className="text-xs text-text-secondary">
                  <summary className="cursor-pointer mb-2">Stack Trace</summary>
                  <pre className="overflow-auto">{this.state.error.stack}</pre>
                </details>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-secondary"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
