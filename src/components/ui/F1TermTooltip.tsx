import React from 'react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';
import { getGlossaryTerm } from '../../data/f1Glossary';
import { useExperienceMode } from '../../contexts/ExperienceModeContext';

export interface F1TermTooltipProps {
  termKey: string;
  children: React.ReactNode;
  className?: string;
}

export const F1TermTooltip: React.FC<F1TermTooltipProps> = ({ termKey, children, className = '' }) => {
  const term = getGlossaryTerm(termKey);
  const { isBeginner } = useExperienceMode();

  if (!term) {
    return <>{children}</>;
  }

  const triggerClasses = [
    'inline-flex items-center cursor-help decoration-dotted underline underline-offset-2 transition-colors',
    isBeginner
      ? 'decoration-crimson/70 text-white font-medium hover:text-crimson'
      : 'decoration-white/30 text-inherit hover:decoration-white/80',
    className,
  ].filter(Boolean).join(' ');

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          className={triggerClasses}
          data-testid="f1-term-trigger"
          tabIndex={0}
          role="button"
          aria-label={`Formula 1 term: ${term.term}. Press or hover for explanation.`}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        sideOffset={6}
        className="w-80 p-3.5 bg-[#11151E] border border-white/12 shadow-2xl text-left z-50 rounded-[4px]"
      >
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/8">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            {term.category}
          </span>
          <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-crimson/15 text-crimson border border-crimson/30 uppercase">
            F1 Glossary
          </span>
        </div>

        <h4 className="text-sm font-semibold text-white tracking-tight mb-1">
          {term.term}
        </h4>

        <p className="text-xs text-neutral-200 leading-relaxed font-normal mb-2">
          {term.shortDef}
        </p>

        <p className="text-[11px] text-neutral-400 leading-relaxed border-t border-white/5 pt-2">
          {term.detail}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
};
