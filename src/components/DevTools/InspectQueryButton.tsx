import React from 'react';
import { Code, Terminal } from 'lucide-react';
import { useExperienceMode } from '../../contexts/ExperienceModeContext';
import { useInspectQuery, type InspectQueryPayload } from '../../contexts/InspectQueryContext';

export interface InspectQueryButtonProps {
  query: InspectQueryPayload;
  className?: string;
  label?: string;
}

export const InspectQueryButton: React.FC<InspectQueryButtonProps> = ({
  query,
  className = '',
  label = 'Inspect Query',
}) => {
  const { mode } = useExperienceMode();
  const { openQuery } = useInspectQuery();

  // In beginner mode, do not display SQL inspection triggers
  if (mode === 'beginner') {
    return null;
  }

  // In developer mode: high-visibility technical trigger
  if (mode === 'developer') {
    return (
      <button
        type="button"
        onClick={() => openQuery(query)}
        data-testid="inspect-query-btn-dev"
        aria-label="Inspect Query"
        title="Inspect real SQLite-WASM query in slide-over drawer (Shift+D)"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#181D28] hover:bg-crimson/20 border border-crimson/40 text-[#F4F6FA] font-mono text-[11px] tracking-wider transition-colors ${className}`}
      >
        <Terminal className="w-3.5 h-3.5 text-crimson" />
        <span className="font-bold text-crimson">&lt;/&gt;</span>
        <span>{label}</span>
      </button>
    );
  }

  // In enthusiast mode: subtle ghost icon button
  return (
    <button
      type="button"
      onClick={() => openQuery(query)}
      data-testid="inspect-query-btn-subtle"
      aria-label="Inspect underlying SQLite query"
      title="Inspect underlying SQLite query"
      className={`inline-flex items-center justify-center p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors ${className}`}
    >
      <span className="font-mono text-xs">&lt;/&gt;</span>
    </button>
  );
};
