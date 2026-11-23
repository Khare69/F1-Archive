import React from 'react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CanvasErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CanvasErrorBoundary] 3D Canvas error caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="canvas-error-fallback telemetry-panel corner-bracket" role="alert">
          <div className="error-fallback-content">
            <span className="error-icon">⚠️</span>
            <h3 className="headline error-fallback-title">
              {this.props.fallbackTitle || '3D WEBGL ACCELERATION UNAVAILABLE'}
            </h3>
            <p className="telemetry error-fallback-detail">
              {this.state.error?.message || 'GPU shader pipeline initialization was interrupted.'}
            </p>
            <div className="error-fallback-actions">
              <button
                type="button"
                className="f1-btn telemetry"
                onClick={this.handleRetry}
              >
                <span>RETRY 3D INITIALIZATION</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
