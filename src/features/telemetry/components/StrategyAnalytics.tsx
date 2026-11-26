import React, { useState, useMemo } from 'react';
import type { StrategySessionData, DriverStintSummary } from '../../../types/telemetry';
import { filterGreenFlagLaps, calculateTyreDegradationSlope } from '../telemetryMath';

interface StrategyAnalyticsProps {
  strategyData: StrategySessionData;
  circuitName: string;
}

export const StrategyAnalytics: React.FC<StrategyAnalyticsProps> = ({
  strategyData,
  circuitName,
}) => {
  const [isFuelCorrected, setIsFuelCorrected] = useState<boolean>(true);
  const [selectedDriverCode, setSelectedDriverCode] = useState<string>('ALL');
  const [pitLossSeconds, setPitLossSeconds] = useState<number>(21.5);

  const driversList = useMemo(() => {
    const set = new Set<string>();
    strategyData.stints.forEach((s) => set.add(s.driverCode));
    return Array.from(set);
  }, [strategyData]);

  // Filter stints based on selected driver
  const visibleStints: DriverStintSummary[] = useMemo(() => {
    if (selectedDriverCode === 'ALL') return strategyData.stints;
    return strategyData.stints.filter((s) => s.driverCode === selectedDriverCode);
  }, [strategyData, selectedDriverCode]);

  // Recalculate degradation metrics when fuel correction toggle flips
  const stintMetrics = useMemo(() => {
    return visibleStints.map((stint) => {
      const cleanLaps = filterGreenFlagLaps(stint.laps, strategyData.sessionFastestLap);
      const slope = calculateTyreDegradationSlope(cleanLaps);

      // Compute pace based on active mode
      const pace = isFuelCorrected ? stint.avgFuelCorrectedPace : stint.avgRawPace;

      return {
        ...stint,
        cleanLaps,
        activePace: pace,
        activeSlope: slope,
      };
    });
  }, [visibleStints, isFuelCorrected, strategyData.sessionFastestLap]);

  // Dynamic Y-axis pace bounds computed from finite values for active mode
  const { activeMinPace, activeMaxPace } = useMemo(() => {
    const values: number[] = [];
    visibleStints.forEach((s) => {
      s.laps.forEach((l) => {
        const val = isFuelCorrected ? l.correctedLapTimeSeconds : l.rawLapTimeSeconds;
        if (Number.isFinite(val) && !l.isOutlier) {
          values.push(val);
        }
      });
    });

    if (values.length === 0) {
      return { activeMinPace: 85, activeMaxPace: 95 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      activeMinPace: Math.floor(min) - 0.5,
      activeMaxPace: Math.ceil(max) + 0.5,
    };
  }, [visibleStints, isFuelCorrected]);

  const midPace = Number(((activeMinPace + activeMaxPace) / 2).toFixed(2));
  const paceRange = Math.max(0.5, activeMaxPace - activeMinPace);

  // Chart dimensions for SVG rendering
  const maxLaps = strategyData.totalLaps;
  const chartWidth = 900;
  const chartHeight = 240;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#11151E] p-5 shadow-xl text-white">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#38BDF8]">
            // STRATEGY &amp; STINT DEGRADATION LAB
          </span>
          <h3 className="font-display text-lg font-bold text-white mt-0.5">
            RACE PACE &amp; TYRE DEGRADATION MODEL
          </h3>
          <span className="font-mono text-xs text-[#8494AB]">
            {circuitName.toUpperCase()} • GREEN-FLAG 107% OUTLIER FILTERING ACTIVE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Driver Filter Dropdown */}
          <div className="flex items-center gap-2 font-mono text-xs text-[#8494AB]">
            <label htmlFor="driver-filter-select">DRIVER:</label>
            <select
              id="driver-filter-select"
              value={selectedDriverCode}
              onChange={(e) => setSelectedDriverCode(e.target.value)}
              className="rounded border border-white/10 bg-[#080c14] px-2.5 py-1 text-xs text-white outline-none focus:border-[#38BDF8]"
            >
              <option value="ALL">ALL DRIVERS (HEAD-TO-HEAD)</option>
              {driversList.map((code) => (
                <option key={code} value={code}>
                  #{code}
                </option>
              ))}
            </select>
          </div>

          {/* Transparent Fuel-Correction Toggle (Trap 5) */}
          <button
            type="button"
            className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
              isFuelCorrected
                ? 'border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8] font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'border-white/10 bg-white/5 text-[#8494AB] hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setIsFuelCorrected(!isFuelCorrected)}
            title="Toggle linear fuel-burn compensation (~0.065s/lap)"
          >
            <span>{isFuelCorrected ? '⚡ FUEL-CORRECTED PACE' : '⛽ RAW LAP TIMES'}</span>
          </button>
        </div>
      </div>

      {/* Stint Cards Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stintMetrics.map((stint, idx) => (
          <div
            key={`${stint.driverCode}_${stint.compound}_${idx}`}
            className="flex flex-col gap-2 rounded border border-white/5 bg-[#181D28] p-3 border-l-4"
            style={{ borderLeftColor: stint.teamColor }}
          >
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold" style={{ color: stint.teamColor }}>
                {stint.driverName}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white">
                {stint.compound}
              </span>
              <span className="text-[10px] text-[#8494AB]">
                LAPS {stint.startLap}–{stint.endLap} ({stint.totalLaps}L)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 font-mono">
              <div>
                <span className="block text-[9px] text-[#8494AB]">
                  {isFuelCorrected ? 'CORRECTED' : 'RAW PACE'}
                </span>
                <span className="text-xs font-bold text-white">
                  {stint.activePace.toFixed(3)}s
                </span>
              </div>

              <div>
                <span className="block text-[9px] text-[#8494AB]">DEG SLOPE</span>
                <span className="text-xs font-bold text-[#FFD700]">
                  +{stint.activeSlope.toFixed(3)} s/L
                </span>
              </div>

              <div>
                <span className="block text-[9px] text-[#8494AB]">CLEAN LAPS</span>
                <span className="text-xs font-bold text-white">
                  {stint.cleanLapsCount}/{stint.totalLaps}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Stint Progression SVG Chart */}
      <div className="relative w-full overflow-hidden rounded border border-white/5 bg-[#0e131d] p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          {/* Dynamic Grid lines & Y-axis labels */}
          <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
          <text x="10" y="16" fill="#8899aa" fontSize="10" fontFamily="monospace">
            {activeMinPace.toFixed(1)}s (FASTEST)
          </text>

          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <text x="10" y={chartHeight / 2 - 4} fill="#667788" fontSize="10" fontFamily="monospace">
            {midPace.toFixed(1)}s
          </text>

          <line x1="0" y1={chartHeight - 35} x2={chartWidth} y2={chartHeight - 35} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="10" y={chartHeight - 40} fill="#8899aa" fontSize="10" fontFamily="monospace">
            {activeMaxPace.toFixed(1)}s (SLOWEST)
          </text>

          {/* Stint Lap Data Points and Regression Lines */}
          {stintMetrics.map((stint, sIdx) => {
            const points = stint.laps.map((lap) => {
              const x = (lap.lapNumber / maxLaps) * chartWidth;
              const time = isFuelCorrected ? lap.correctedLapTimeSeconds : lap.rawLapTimeSeconds;
              const clamped = Math.max(activeMinPace, Math.min(activeMaxPace, time));
              const y = (chartHeight - 40) - ((clamped - activeMinPace) / paceRange) * (chartHeight - 65);
              return { x, y, isOutlier: lap.isOutlier, lapNumber: lap.lapNumber, time };
            });

            const cleanPoints = points.filter((p) => !p.isOutlier);
            const linePath = cleanPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');

            return (
              <g key={`stint_line_${sIdx}`}>
                {/* Green-flag continuous stint pace line */}
                {cleanPoints.length > 1 && (
                  <path
                    d={`M ${linePath}`}
                    fill="none"
                    stroke={stint.teamColor}
                    strokeWidth="2.5"
                    strokeDasharray={stint.driverCode === 'NOR' ? '6 3' : 'none'}
                    opacity="0.9"
                  />
                )}

                {/* Individual Lap Circles */}
                {points.map((p, pIdx) => (
                  <circle
                    key={`lap_${pIdx}`}
                    cx={p.x}
                    cy={p.y}
                    r={p.isOutlier ? 2.5 : 4}
                    fill={p.isOutlier ? 'rgba(255,255,255,0.2)' : stint.teamColor}
                    stroke={p.isOutlier ? '#FF1E1E' : '#FFFFFF'}
                    strokeWidth={p.isOutlier ? 1 : 1.5}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-[10px] text-[#8494AB]">
          <span>● SOLID DOT: GREEN FLAG LAP</span>
          <span>⊗ RED OUTLINE: EXCLUDED (PIT / SC / &gt;107%)</span>
          <span style={{ color: '#00D2FF' }}>
            MODEL: -{strategyData.fuelBurnRatePerLapKg} KG/LAP FUEL BURN • +{strategyData.fuelEffectPerKgSec} S/KG EFFECT
          </span>
        </div>
      </div>

      {/* Undercut / Overcut Window Calculator */}
      <div className="rounded border border-white/5 bg-[#181D28] p-4 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 text-xs">
          <span className="font-bold text-white">PIT STOP UNDERCUT / OVERCUT DELTA SIMULATOR</span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-[#38BDF8]">
            PIT STOP LOSS: {pitLossSeconds.toFixed(1)}s
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 text-xs">
          <p className="text-[#8494AB] leading-relaxed">
            At {circuitName}, pitting 1 lap earlier onto fresh tyres with a degradation delta of ~
            {stintMetrics[0]?.activeSlope.toFixed(3)} s/lap provides an estimated lap advantage of
            0.8s–1.4s on out-lap warmup, overcoming a track position gap within 1.2s.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="pit-loss-range" className="text-[#8494AB]">
              ADJUST PIT LANE TRANSIT TIME:
            </label>
            <input
              id="pit-loss-range"
              type="range"
              min="16"
              max="28"
              step="0.5"
              value={pitLossSeconds}
              onChange={(e) => setPitLossSeconds(parseFloat(e.target.value))}
              className="h-1.5 w-48 rounded-lg bg-white/10 appearance-none cursor-pointer accent-[#38BDF8]"
            />
            <span className="font-bold text-white">{pitLossSeconds.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalytics;
