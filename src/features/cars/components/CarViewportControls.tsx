import React from 'react';
import type { ActiveAeroMode } from './Regulation2026Overlay';

interface CarViewportControlsProps {
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
  showAero: boolean;
  onToggleAero: () => void;
  is2026Era: boolean;
  activeAeroMode: ActiveAeroMode;
  onToggleActiveAeroMode: () => void;
  showHotspots?: boolean;
  onToggleHotspots?: () => void;
}

export const CarViewportControls: React.FC<CarViewportControlsProps> = ({
  isAutoRotating,
  onToggleAutoRotate,
  onResetCamera,
  showAero,
  onToggleAero,
  is2026Era,
  activeAeroMode,
  onToggleActiveAeroMode,
  showHotspots = false,
  onToggleHotspots,
}) => {
  return (
    <div
      role="region"
      aria-label="3D Viewport Controls"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-[#11151E]/90 p-2 backdrop-blur-md font-mono text-xs text-white shadow-xl"
    >
      <button
        type="button"
        onClick={onResetCamera}
        className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[#8494AB] hover:text-white hover:bg-white/10 transition-colors"
        title="Recenter Camera (3/4 Studio View)"
        aria-label="Recenter Camera view"
      >
        ↺ RECENTER
      </button>

      <button
        type="button"
        onClick={onToggleAutoRotate}
        className={`rounded border px-2.5 py-1 transition-colors ${
          isAutoRotating
            ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-bold'
            : 'border-white/10 bg-white/5 text-[#8494AB] hover:text-white'
        }`}
        aria-pressed={isAutoRotating}
        title="Toggle Auto-Rotation"
      >
        {isAutoRotating ? '⏸ ROTATE: ON' : '▶ ROTATE: OFF'}
      </button>

      <button
        type="button"
        onClick={onToggleAero}
        className={`rounded border px-2.5 py-1 transition-colors ${
          showAero
            ? 'border-[#00D2FF]/50 bg-[#00D2FF]/20 text-[#00D2FF] font-bold'
            : 'border-white/10 bg-white/5 text-[#8494AB] hover:text-white'
        }`}
        aria-pressed={showAero}
        title="Toggle Aerodynamic Particle Streamline Simulation"
      >
        💨 AERO FLOW: {showAero ? 'ACTIVE' : 'OFF'}
      </button>

      {onToggleHotspots && (
        <button
          type="button"
          onClick={onToggleHotspots}
          className={`rounded border px-2.5 py-1 transition-colors ${
            showHotspots
              ? 'border-[#E10600]/50 bg-[#E10600]/20 text-white font-bold'
              : 'border-white/10 bg-white/5 text-[#8494AB] hover:text-white'
          }`}
          aria-pressed={showHotspots}
          title="Toggle Anatomy Hotspot Pins"
        >
          📍 HOTSPOTS: {showHotspots ? 'ON' : 'OFF'}
        </button>
      )}

      {is2026Era && (
        <button
          type="button"
          onClick={onToggleActiveAeroMode}
          className={`rounded border px-2.5 py-1 font-bold transition-colors ${
            activeAeroMode === 'straight'
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
              : 'border-amber-400 bg-amber-500/20 text-amber-300'
          }`}
          title="Toggle 2026 Active Aero Wing Mode"
        >
          {activeAeroMode === 'straight'
            ? 'WING: X-MODE (LOW DRAG)'
            : 'WING: Z-MODE (DOWNFORCE)'}
        </button>
      )}
    </div>
  );
};
