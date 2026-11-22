import React from 'react';

interface LiveStatusBadgeProps {
  source: 'live' | 'cached' | 'fallback';
  updatedAt: number;
  isFetching?: boolean;
}

export const LiveStatusBadge: React.FC<LiveStatusBadgeProps> = ({
  source,
  updatedAt,
  isFetching = false
}) => {
  const formattedTime = React.useMemo(() => {
    if (!updatedAt) return 'Just now';
    try {
      const d = new Date(updatedAt);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  }, [updatedAt]);

  const sourceMeta = React.useMemo(() => {
    switch (source) {
      case 'live':
        return {
          label: 'LIVE JOLPICA REST FEED',
          color: '#00E701',
          bg: 'rgba(0, 231, 1, 0.12)',
          border: 'rgba(0, 231, 1, 0.35)',
          icon: '⚡'
        };
      case 'cached':
        return {
          label: 'OFFLINE CACHE (PERSISTED)',
          color: '#FFB300',
          bg: 'rgba(255, 179, 0, 0.12)',
          border: 'rgba(255, 179, 0, 0.35)',
          icon: '📦'
        };
      case 'fallback':
      default:
        return {
          label: 'OFFICIAL VAULT FALLBACK',
          color: '#00D2FF',
          bg: 'rgba(0, 210, 255, 0.12)',
          border: 'rgba(0, 210, 255, 0.35)',
          icon: '🔒'
        };
    }
  }, [source]);

  return (
    <div className="live-status-container">
      <div
        className="live-status-pill telemetry"
        style={{
          backgroundColor: sourceMeta.bg,
          borderColor: sourceMeta.border,
          color: sourceMeta.color
        }}
      >
        <span className="source-icon">{sourceMeta.icon}</span>
        <span className="source-label">{sourceMeta.label}</span>
        <span className="timestamp-separator">•</span>
        <span className="source-timestamp">Data as of {formattedTime}</span>
        {isFetching && <span className="fetching-indicator">⟳ Syncing...</span>}
      </div>

      {source === 'fallback' && (
        <div className="fallback-banner telemetry" role="status">
          <span>⚠️ Live Jolpica API currently unreachable — displaying curated 2026 baseline dataset.</span>
        </div>
      )}
    </div>
  );
};
