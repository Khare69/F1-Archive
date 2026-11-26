import React from 'react';
import type { CornerMarkerItem } from './Track2DMap';

export interface CornerDnaPanelProps {
  circuitName: string;
  corners: CornerMarkerItem[];
  isAutoDetected?: boolean;
  selectedCornerNumber: number | null;
  onSelectCorner: (cornerNumber: number | null) => void;
  filterMode: 'all' | 'overtaking' | 'high_downforce';
  onFilterModeChange: (mode: 'all' | 'overtaking' | 'high_downforce') => void;
}

export const CornerDnaPanel: React.FC<CornerDnaPanelProps> = ({
  corners,
  isAutoDetected = false,
  selectedCornerNumber,
  onSelectCorner,
  filterMode,
  onFilterModeChange
}) => {
  const overtakingCount = corners.filter((c) => c.isOvertakingZone).length;
  const highDownforceCount = corners.filter((c) => c.isHighDownforce).length;

  const filteredCorners = corners.filter((c) => {
    if (filterMode === 'overtaking') return Boolean(c.isOvertakingZone);
    if (filterMode === 'high_downforce') return Boolean(c.isHighDownforce);
    return true;
  });

  const activeCorner =
    corners.find((c) => c.number === selectedCornerNumber) ||
    filteredCorners[0] ||
    corners[0];

  const handleStepPrev = () => {
    if (!activeCorner || filteredCorners.length <= 1) return;
    const idx = filteredCorners.findIndex((c) => c.number === activeCorner.number);
    const prevIdx = (idx - 1 + filteredCorners.length) % filteredCorners.length;
    onSelectCorner(filteredCorners[prevIdx]!.number);
  };

  const handleStepNext = () => {
    if (!activeCorner || filteredCorners.length <= 1) return;
    const idx = filteredCorners.findIndex((c) => c.number === activeCorner.number);
    const nextIdx = (idx + 1) % filteredCorners.length;
    onSelectCorner(filteredCorners[nextIdx]!.number);
  };

  const isCornerAuto = isAutoDetected || Boolean(activeCorner?.isAutoDetected);

  return (
    <div className="flex flex-col h-full bg-[#11151E] border border-white/10 rounded-lg p-4 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 block">// CORNER DNA</span>
          <h2 className="text-sm font-bold text-white tracking-wide">APEX & TELEMETRY INSPECTOR</h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
          {corners.length} APEXES
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 border border-white/10 rounded-md mb-3 text-xs font-mono">
        <button
          type="button"
          className={`py-1 rounded transition-colors text-center ${
            filterMode === 'all'
              ? 'bg-sky-500 text-black font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => onFilterModeChange('all')}
        >
          All ({corners.length})
        </button>
        <button
          type="button"
          className={`py-1 rounded transition-colors text-center ${
            filterMode === 'overtaking'
              ? 'bg-sky-500 text-black font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => onFilterModeChange('overtaking')}
        >
          Overtake ({overtakingCount})
        </button>
        <button
          type="button"
          className={`py-1 rounded transition-colors text-center ${
            filterMode === 'high_downforce'
              ? 'bg-sky-500 text-black font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => onFilterModeChange('high_downforce')}
        >
          Downforce ({highDownforceCount})
        </button>
      </div>

      {/* Active Corner Telemetry Inset Card */}
      {activeCorner ? (
        <div className="bg-[#181D28] border border-white/10 rounded-lg p-3.5 mb-3 shadow-inner">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#E10600] text-white font-mono text-xs font-extrabold rounded">
                T{activeCorner.number}
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-[190px]">
                {activeCorner.name}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleStepPrev}
                className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 rounded text-slate-300 text-xs"
                title="Previous Corner"
                aria-label="Previous Corner"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleStepNext}
                className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 rounded text-slate-300 text-xs"
                title="Next Corner"
                aria-label="Next Corner"
              >
                ▶
              </button>
            </div>
          </div>

          {/* 4-Cell Telemetry Stats Grid */}
          {isCornerAuto ? (
            <div className="p-2.5 bg-black/40 border border-amber-500/30 rounded text-amber-300/90 font-mono text-[11px] mb-2.5">
              ⚠️ Auto-detected geometric apex — historical telemetry unavailable.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-2.5 font-mono">
              <div className="p-2 bg-black/40 border border-white/5 rounded">
                <span className="text-[9px] text-slate-400 block tracking-wider">MIN SPEED</span>
                <span className="text-sm font-bold text-sky-400 tabular-nums">
                  {activeCorner.speedKmh ? `${activeCorner.speedKmh} km/h` : 'N/A'}
                </span>
              </div>
              <div className="p-2 bg-black/40 border border-white/5 rounded">
                <span className="text-[9px] text-slate-400 block tracking-wider">GEAR</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {activeCorner.gear ? `G${activeCorner.gear}` : 'N/A'}
                </span>
              </div>
              <div className="p-2 bg-black/40 border border-white/5 rounded">
                <span className="text-[9px] text-slate-400 block tracking-wider">BRAKING G / DIST</span>
                <span className="text-sm font-bold text-amber-400 tabular-nums">
                  {activeCorner.brakingG != null ? `${activeCorner.brakingG.toFixed(1)} G` : 'Flat'}
                  {activeCorner.brakingDistanceM ? ` · ${activeCorner.brakingDistanceM}m` : ''}
                </span>
              </div>
              <div className="p-2 bg-black/40 border border-white/5 rounded">
                <span className="text-[9px] text-slate-400 block tracking-wider">LATERAL G</span>
                <span className="text-sm font-bold text-red-400 tabular-nums">
                  {activeCorner.lateralG != null ? `${activeCorner.lateralG.toFixed(1)} G` : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Technical Notes */}
          <p className="text-xs text-slate-300 leading-relaxed mb-2 line-clamp-3">
            {activeCorner.notes || 'Apex telemetry recorded under high-downforce dry circuit conditions.'}
          </p>

          {/* Famous Overtake Callout */}
          {activeCorner.famousOvertake && (
            <div className="p-2 bg-red-950/30 border border-red-500/20 rounded text-[11px] text-slate-300">
              <span className="text-[#E10600] font-bold block mb-0.5">HISTORIC DUEL:</span>
              <span>{activeCorner.famousOvertake}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-slate-400 text-xs font-mono">
          No apex markers match active filter.
        </div>
      )}

      {/* Scrollable Corner Chips Strip */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        <span className="text-[10px] font-mono text-slate-400 block mb-1">ALL CORNERS</span>
        {filteredCorners.map((c) => {
          const isSelected = activeCorner?.number === c.number;
          return (
            <button
              key={`dna-chip-${c.number}`}
              type="button"
              onClick={() => onSelectCorner(c.number)}
              className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors border ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-500/60 text-white'
                  : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded font-mono text-[10px] font-bold ${
                    isSelected ? 'bg-[#E10600] text-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  T{c.number}
                </span>
                <span className="text-xs truncate font-medium">{c.name}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {c.isOvertakingZone && (
                  <span className="px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 rounded">
                    PASS
                  </span>
                )}
                {c.isHighDownforce && (
                  <span className="px-1.5 py-0.2 bg-amber-950/60 text-amber-400 border border-amber-500/30 rounded">
                    AERO
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
