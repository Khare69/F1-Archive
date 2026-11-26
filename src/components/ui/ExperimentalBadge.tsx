import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ExperimentalBadgeProps {
  label?: string; // default 'EXPERIMENTAL // SIMULATION'
  disclaimer?: string;
  compact?: boolean;
  className?: string;
}

export const ExperimentalBadge: React.FC<ExperimentalBadgeProps> = ({
  label = 'EXPERIMENTAL // SIMULATION',
  disclaimer,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <span
        role="status"
        aria-label={label}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[#EAB308]/35 bg-[#EAB308]/10 text-[#FACC15] font-telemetry text-[11px] font-semibold uppercase tracking-[0.08em] select-none ${className}`}
      >
        <AlertTriangle className="w-3 h-3 text-[#FACC15] shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={`${label}. ${disclaimer || ''}`}
      className={`flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 rounded-[4px] border border-[#EAB308]/35 bg-[#EAB308]/10 text-[#FACC15] font-telemetry text-[11px] select-none ${className}`}
    >
      <div className="flex items-center gap-1.5 shrink-0 font-bold uppercase tracking-[0.08em]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#FACC15] shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      {disclaimer && (
        <span className="text-[#FACC15]/85 tracking-normal normal-case font-normal sm:border-l sm:border-[#EAB308]/30 sm:pl-2">
          {disclaimer}
        </span>
      )}
    </div>
  );
};
