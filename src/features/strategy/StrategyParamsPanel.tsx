import React, { useState } from 'react';
import type { StrategyEngineParams } from './strategyMath';

export interface CircuitPreset {
  id: string;
  name: string;
  laps: number;
  baseLapTimeSec: number;
  scProbPct: number;
}

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  { id: 'silverstone', name: 'Silverstone (British GP)', laps: 52, baseLapTimeSec: 88.5, scProbPct: 35 },
  { id: 'monaco', name: 'Monaco (Monte Carlo)', laps: 78, baseLapTimeSec: 74.2, scProbPct: 65 },
  { id: 'monza', name: 'Monza (Autodromo Nazionale)', laps: 53, baseLapTimeSec: 81.8, scProbPct: 25 },
  { id: 'spa', name: 'Spa-Francorchamps (Belgian GP)', laps: 44, baseLapTimeSec: 104.5, scProbPct: 45 },
  { id: 'bahrain', name: 'Bahrain (Sakhir International)', laps: 57, baseLapTimeSec: 91.2, scProbPct: 30 },
  { id: 'madrid2026', name: 'Madrid 2026 (Circuito Madring)', laps: 56, baseLapTimeSec: 89.4, scProbPct: 40 },
];

export interface StrategyParamsPanelProps {
  circuit: string;
  params: StrategyEngineParams;
  onCircuitChange: (circuitId: string) => void;
  onParamChange: <K extends keyof StrategyEngineParams>(key: K, value: StrategyEngineParams[K]) => void;
  onResetDefaults: () => void;
  onRerollSeed: () => void;
}

export const StrategyParamsPanel: React.FC<StrategyParamsPanelProps> = ({
  circuit,
  params,
  onCircuitChange,
  onParamChange,
  onResetDefaults,
  onRerollSeed,
}) => {
  const [showEquations, setShowEquations] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#11151E] p-4 text-white">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <label htmlFor="circuit-select" className="font-mono text-xs uppercase tracking-wider text-[#8494AB]">
            CIRCUIT:
          </label>
          <select
            id="circuit-select"
            value={circuit}
            onChange={(e) => onCircuitChange(e.target.value)}
            className="rounded border border-white/15 bg-[#181D28] px-3 py-1 font-mono text-xs text-white outline-none focus:border-[#E10600]"
          >
            {CIRCUIT_PRESETS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.laps} L)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={onResetDefaults}
            className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[#8494AB] hover:text-white transition-colors"
          >
            ↺ RESET DEFAULTS
          </button>
          <button
            type="button"
            onClick={onRerollSeed}
            className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[#8494AB] hover:text-white transition-colors"
          >
            🎲 RE-ROLL SEED ({params.seed})
          </button>
        </div>
      </div>

      {/* Editable Numeric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
        <div>
          <label htmlFor="total-laps-input" className="block text-[10px] text-[#8494AB] uppercase">TOTAL LAPS</label>
          <input
            id="total-laps-input"
            type="number"
            min={10}
            max={85}
            value={params.totalLaps}
            onChange={(e) => onParamChange('totalLaps', parseInt(e.target.value, 10) || 50)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="base-pace-input" className="block text-[10px] text-[#8494AB] uppercase">BASE PACE (S)</label>
          <input
            id="base-pace-input"
            type="number"
            step="0.1"
            min={55}
            max={130}
            value={params.baseLapTimeSec}
            onChange={(e) => onParamChange('baseLapTimeSec', parseFloat(e.target.value) || 88.5)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="pit-loss-input" className="block text-[10px] text-[#8494AB] uppercase">PIT LOSS (S)</label>
          <input
            id="pit-loss-input"
            type="number"
            step="0.5"
            min={14}
            max={35}
            value={params.pitLossSec}
            onChange={(e) => onParamChange('pitLossSec', parseFloat(e.target.value) || 21.5)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="fuel-penalty-input" className="block text-[10px] text-[#8494AB] uppercase">FUEL PENALTY (S/L)</label>
          <input
            id="fuel-penalty-input"
            type="number"
            step="0.005"
            min={0}
            max={0.15}
            value={params.fuelPenaltyPerLapSec}
            onChange={(e) => onParamChange('fuelPenaltyPerLapSec', parseFloat(e.target.value) || 0.035)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="soft-deg-input" className="block text-[10px] text-[#8494AB] uppercase">SOFT DEG (S/L)</label>
          <input
            id="soft-deg-input"
            type="number"
            step="0.005"
            min={0.01}
            max={0.5}
            value={params.softDegPerLapSec}
            onChange={(e) => onParamChange('softDegPerLapSec', parseFloat(e.target.value) || 0.095)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="med-deg-input" className="block text-[10px] text-[#8494AB] uppercase">MED DEG (S/L)</label>
          <input
            id="med-deg-input"
            type="number"
            step="0.005"
            min={0.01}
            max={0.5}
            value={params.mediumDegPerLapSec}
            onChange={(e) => onParamChange('mediumDegPerLapSec', parseFloat(e.target.value) || 0.055)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="hard-deg-input" className="block text-[10px] text-[#8494AB] uppercase">HARD DEG (S/L)</label>
          <input
            id="hard-deg-input"
            type="number"
            step="0.005"
            min={0.01}
            max={0.5}
            value={params.hardDegPerLapSec}
            onChange={(e) => onParamChange('hardDegPerLapSec', parseFloat(e.target.value) || 0.032)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>

        <div>
          <label htmlFor="sc-prob-input" className="block text-[10px] text-[#8494AB] uppercase">SC PROBABILITY (%)</label>
          <input
            id="sc-prob-input"
            type="number"
            min={0}
            max={100}
            value={params.safetyCarProbPct}
            onChange={(e) => onParamChange('safetyCarProbPct', parseInt(e.target.value, 10) || 35)}
            className="w-full rounded border border-white/10 bg-[#181D28] px-2 py-1 text-white"
          />
        </div>
      </div>

      {/* Collapsible Equations Disclosure */}
      <div className="border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={() => setShowEquations(!showEquations)}
          className="flex items-center gap-1.5 font-mono text-[11px] text-[#8494AB] hover:text-white transition-colors"
        >
          <span>{showEquations ? '▼ HIDE' : '▶ SHOW'} OPEN ENGINEERING MODEL EQUATIONS</span>
        </button>

        {showEquations && (
          <div className="mt-2 rounded border border-white/5 bg-[#181D28] p-3 font-mono text-xs text-neutral-300 space-y-1.5">
            <div className="text-[#38BDF8] font-bold">Lap-Time Formulation:</div>
            <div className="bg-black/40 p-2 rounded text-[11px] text-emerald-400">
              t_lap = t_base + offset_compound + deg * (stintLap - 1)^1.15 - fuelPen * (raceLap - 1)
            </div>
            <div className="text-[11px] text-[#8494AB] space-y-1">
              <div>• <b>Tyre Offsets:</b> Soft: -0.80s, Medium: 0.00s, Hard: +0.65s relative to base pace.</div>
              <div>• <b>Non-linear Degradation:</b> Multiplied by <code>(stintLap - 1)^1.15</code> to simulate thermal degradation cliff.</div>
              <div>• <b>Fuel Burn Benefit:</b> Car lightens by <code>fuelPen * raceLap</code>, improving late-race baseline pace.</div>
              <div>• <b>Mulberry32 PRNG:</b> Seeded 32-bit PRNG guarantees 100% bit-identical simulation reproducibility.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyParamsPanel;
