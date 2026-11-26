import React from 'react';
import { ArrowLeftRight, Check, Copy, Camera } from 'lucide-react';
import type { Driver } from '../../../types/f1';

export interface DriverSelectorBarProps {
  drivers: Driver[];
  driverAId: string;
  driverBId: string;
  colorA: string;
  colorB: string;
  mode: 'raw' | 'normalized';
  onSelectA: (id: string) => void;
  onSelectB: (id: string) => void;
  onSwap: () => void;
  onToggleMode: (mode: 'raw' | 'normalized') => void;
  onExportPoster?: () => void;
  isExportingPoster?: boolean;
  onCopyShareLink?: () => void;
  copied?: boolean;
}

const HISTORIC_RIVALRIES = [
  { label: 'Senna vs. Prost', a: 'senna', b: 'prost' },
  { label: 'Hamilton vs. Verstappen', a: 'hamilton', b: 'max-verstappen' },
  { label: 'Schumacher vs. Häkkinen', a: 'michael-schumacher', b: 'hakkinen' },
  { label: 'Leclerc vs. Norris', a: 'leclerc', b: 'norris' },
];

export const DriverSelectorBar: React.FC<DriverSelectorBarProps> = ({
  drivers,
  driverAId,
  driverBId,
  colorA,
  colorB,
  mode,
  onSelectA,
  onSelectB,
  onSwap,
  onToggleMode,
  onExportPoster,
  isExportingPoster = false,
  onCopyShareLink,
  copied = false,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-[4px] border border-white/10 bg-surface p-4">
      {/* Top Bar: Mode Switcher & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Mode Toggle: Raw Totals vs Era-Normalized */}
        <div className="flex items-center gap-1 rounded bg-black/40 p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => onToggleMode('raw')}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              mode === 'raw'
                ? 'bg-crimson text-white font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Raw Totals
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('normalized')}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              mode === 'normalized'
                ? 'bg-crimson text-white font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Era-Normalized
          </button>
        </div>

        {/* Action Buttons: Export Poster & Share */}
        <div className="flex items-center gap-2">
          {onExportPoster && (
            <button
              type="button"
              onClick={onExportPoster}
              disabled={isExportingPoster}
              aria-label="Export comparison poster"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isExportingPoster ? 'EXPORTING...' : 'EXPORT POSTER'}</span>
            </button>
          )}

          {onCopyShareLink && (
            <button
              type="button"
              onClick={onCopyShareLink}
              aria-label="Copy shareable link"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copied ? 'LINK COPIED' : 'SHARE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Selectors Grid: Driver A vs Driver B */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Driver A Select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="driver-a-select"
            className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorA }} />
            PRIMARY PILOT:
          </label>
          <select
            id="driver-a-select"
            aria-label="PRIMARY PILOT"
            value={driverAId}
            onChange={(e) => onSelectA(e.target.value)}
            className="w-full rounded bg-[#0D1322] border border-white/15 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-crimson"
          >
            {drivers.map((d, idx) => (
              <option key={`${d.id}-${d.slug || idx}`} value={d.id} className="bg-[#0D1322] text-white">
                {d.number ? `#${d.number} ` : d.code ? `[${d.code}] ` : ''}{d.name} ({d.country})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button / VS Badge */}
        <div className="flex justify-center pt-2 md:pt-4">
          <button
            type="button"
            onClick={onSwap}
            title="Swap Driver A and B"
            aria-label="Swap Drivers"
            className="group flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-crimson/20 border border-white/15 hover:border-crimson transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-neutral-400 group-hover:text-crimson transition-colors" />
          </button>
        </div>

        {/* Driver B Select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="driver-b-select"
            className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorB }} />
            OPPONENT PILOT:
          </label>
          <select
            id="driver-b-select"
            aria-label="OPPONENT PILOT"
            value={driverBId}
            onChange={(e) => onSelectB(e.target.value)}
            className="w-full rounded bg-[#0D1322] border border-white/15 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-crimson"
          >
            {drivers.map((d, idx) => (
              <option key={`${d.id}-${d.slug || idx}`} value={d.id} className="bg-[#0D1322] text-white">
                {d.number ? `#${d.number} ` : d.code ? `[${d.code}] ` : ''}{d.name} ({d.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Rivalry Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          RIVALRIES:
        </span>
        {HISTORIC_RIVALRIES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => {
              onSelectA(r.a);
              onSelectB(r.b);
            }}
            className="px-2.5 py-1 text-[11px] font-mono rounded bg-white/[0.03] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverSelectorBar;
