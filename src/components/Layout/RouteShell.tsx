import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { PageTransition } from '../PageTransition/PageTransition';

export interface RouteShellProps {
  fallbackTitle: string;
  loadingLabel?: string;
  disableTransition?: boolean;
  children: React.ReactNode;
}

export const RouteSkeleton: React.FC<{ label?: string }> = ({ label = 'LOADING TELEMETRY...' }) => (
  <div
    role="status"
    aria-live="polite"
    className="route-loading-skeleton"
    style={{
      margin: '4rem auto',
      maxWidth: '600px',
      padding: '2.5rem',
      backgroundColor: '#11151E',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      color: '#F4F6FA',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: '#E10600',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <div style={{ fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
      {label}
    </div>
  </div>
);

export const RouteShell: React.FC<RouteShellProps> = ({
  fallbackTitle,
  loadingLabel,
  disableTransition = false,
  children,
}) => {
  const content = disableTransition ? children : <PageTransition>{children}</PageTransition>;

  return (
    <ErrorBoundary fallbackTitle={fallbackTitle}>
      <Suspense fallback={<RouteSkeleton label={loadingLabel} />}>
        {content}
      </Suspense>
    </ErrorBoundary>
  );
};
