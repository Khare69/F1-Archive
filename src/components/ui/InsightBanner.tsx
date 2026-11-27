import React, { useState } from 'react';
import { Info, X, ChevronRight } from 'lucide-react';
import { useExperienceMode } from '../../contexts/ExperienceModeContext';

export interface InsightBannerProps {
  title: string;
  insight: string;
  ruleTag?: string;
  className?: string;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({
  title,
  insight,
  ruleTag = 'WHY THIS MATTERS',
  className = '',
}) => {
  const { isBeginner, isEnthusiast } = useExperienceMode();
  const [dismissed, setDismissed] = useState(false);

  // In developer mode or if dismissed in enthusiast mode, don't render
  if (dismissed || (!isBeginner && !isEnthusiast)) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={title}
      className={`relative p-3.5 rounded-[4px] bg-[#11151E] border border-white/10 text-neutral-300 transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded bg-crimson/10 text-crimson border border-crimson/20 shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-crimson font-bold">
                {ruleTag}
              </span>
              <span className="text-white/20 text-xs font-mono">•</span>
              <h4 className="text-xs font-semibold text-white tracking-tight">{title}</h4>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{insight}</p>
          </div>
        </div>

        {isEnthusiast && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss insight banner"
            className="text-neutral-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
