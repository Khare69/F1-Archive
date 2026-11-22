import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
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
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '600px',
          background: 'rgba(13, 19, 34, 0.9)',
          border: '1px solid #FF1E1E',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 0 30px rgba(255, 30, 30, 0.2)'
        }}>
          <div style={{
            color: '#FF1E1E',
            fontFamily: 'var(--font-telemetry)',
            fontSize: '0.85rem',
            letterSpacing: '0.15em',
            marginBottom: '0.5rem'
          }}>
            [ SYSTEM WARNING // FAULT DETECTED ]
          </div>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.75rem',
            color: '#F5F7FA',
            marginBottom: '1rem'
          }}>
            {this.props.fallbackTitle || 'Telemetry Feed Interrupted'}
          </h2>
          <p style={{
            color: '#8B93A7',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={this.handleReset} 
              className="f1-btn f1-btn-secondary"
            >
              Re-initialize Module
            </button>
            <button 
              onClick={this.handleReload} 
              className="f1-btn"
            >
              Reload Race Control
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
