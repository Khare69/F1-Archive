import React from 'react';
import { getConstructorIdentity, type ConstructorIdentity } from '../FallbackImage/constructorEmblems';

export interface ConstructorBadgeProps {
  teamIdOrName?: string;
  variant?: 'bar' | 'pill' | 'card';
  showName?: boolean;
  className?: string;
}

export const ConstructorBadge: React.FC<ConstructorBadgeProps> = ({
  teamIdOrName,
  variant = 'pill',
  showName = true,
  className = '',
}) => {
  const identity: ConstructorIdentity = getConstructorIdentity(teamIdOrName);

  if (variant === 'bar') {
    return (
      <div
        className={`inline-flex items-center gap-2 pl-2 py-0.5 pr-2.5 rounded bg-slate-900/60 border border-slate-800 ${className}`}
        style={{ borderLeft: `3px solid ${identity.primaryColor}` }}
        aria-label={`Constructor: ${identity.name}`}
      >
        <span
          className="font-telemetry font-bold text-xs tracking-wider uppercase tabular-nums"
          style={{ color: identity.primaryColor }}
        >
          {identity.monogram}
        </span>
        {showName && (
          <span className="text-xs font-semibold text-slate-200 tracking-tight">
            {identity.name}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 relative overflow-hidden flex items-center justify-between gap-3 ${className}`}
        style={{ borderLeft: `4px solid ${identity.primaryColor}` }}
        aria-label={`Constructor: ${identity.name}`}
      >
        <div className="flex flex-col">
          <span
            className="font-telemetry text-lg font-black tracking-widest uppercase"
            style={{ color: identity.primaryColor }}
          >
            {identity.monogram}
          </span>
          {showName && (
            <span className="text-sm font-bold text-slate-100 tracking-tight mt-0.5">
              {identity.name}
            </span>
          )}
        </div>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: identity.primaryColor }}
        />
      </div>
    );
  }

  // Default: 'pill'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-telemetry ${className}`}
      aria-label={`Constructor: ${identity.name}`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: identity.primaryColor }}
      />
      <span className="font-bold tracking-wider" style={{ color: identity.primaryColor }}>
        {identity.monogram}
      </span>
      {showName && <span className="text-slate-300 font-medium">{identity.name}</span>}
    </span>
  );
};
