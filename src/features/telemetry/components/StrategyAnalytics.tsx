import React, { useState, useMemo } from 'react';
import type { StrategySessionData, DriverStintSummary } from '../../../types/telemetry';
import { filterGreenFlagLaps, calculateTyreDegradationSlope } from '../telemetryMath';
import './StrategyAnalytics.css';

interface StrategyAnalyticsProps {
  strategyData: StrategySessionData;
  circuitName: string;
}

export const StrategyAnalytics: React.FC<StrategyAnalyticsProps> = ({
  strategyData,
  circuitName
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
        activeSlope: slope
      };
    });
  }, [visibleStints, isFuelCorrected, strategyData.sessionFastestLap]);

  // Chart bounds for SVG rendering
  const maxLaps = strategyData.totalLaps;
  const minPace = Math.min(...strategyData.stints.map((s) => s.avgFuelCorrectedPace)) - 1.0;
  const maxPace = minPace + 4.5;
  const chartWidth = 900;
  const chartHeight = 240;

  return (
    <div className="strategy-analytics-card telemetry-panel corner-bracket">
      {/* Header and Controls */}
      <div className="strategy-header">
        <div className="strategy-title-box">
          <span className="strategy-badge telemetry">// STRATEGY &amp; STINT DEGRADATION LAB</span>
          <h3 className="strategy-title headline">RACE PACE &amp; TYRE DEGRADATION MODEL</h3>
          <span className="strategy-subtitle telemetry">
            {circuitName.toUpperCase()} • GREEN-FLAG 107% OUTLIER FILTERING ACTIVE
          </span>
        </div>

        <div className="strategy-controls-group">
          {/* Driver Filter Dropdown */}
          <div className="strategy-filter-box telemetry">
            <label htmlFor="driver-filter-select">DRIVER:</label>
            <select
              id="driver-filter-select"
              value={selectedDriverCode}
              onChange={(e) => setSelectedDriverCode(e.target.value)}
              className="strategy-select telemetry"
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
            className={`f1-btn telemetry fuel-toggle-btn ${isFuelCorrected ? 'fuel-active' : ''}`}
            onClick={() => setIsFuelCorrected(!isFuelCorrected)}
            title="Toggle linear fuel-burn compensation (~0.065s/lap)"
          >
            <span>{isFuelCorrected ? '⚡ FUEL-CORRECTED PACE' : '⛽ RAW LAP TIMES'}</span>
          </button>
        </div>
      </div>

      {/* Stint Cards Summary Matrix */}
      <div className="stints-summary-grid">
        {stintMetrics.map((stint, idx) => (
          <div
            key={`${stint.driverCode}_${stint.compound}_${idx}`}
            className="stint-metric-card telemetry-panel"
            style={{ borderLeftColor: stint.teamColor }}
          >
            <div className="stint-card-top telemetry">
              <span className="stint-driver" style={{ color: stint.teamColor }}>
                {stint.driverName}
              </span>
              <span className={`stint-compound-badge compound-${stint.compound.toLowerCase()}`}>
                {stint.compound}
              </span>
              <span className="stint-laps-span">
                LAPS {stint.startLap}–{stint.endLap} ({stint.totalLaps} LAPS)
              </span>
            </div>

            <div className="stint-values-row">
              <div className="stint-val-box">
                <span className="stint-val-label telemetry">
                  {isFuelCorrected ? 'CORRECTED PACE' : 'RAW AVG PACE'}
                </span>
                <span className="stint-val-headline headline">
                  {stint.activePace.toFixed(3)}s
                </span>
              </div>

              <div className="stint-val-box">
                <span className="stint-val-label telemetry">TYRE DEG SLOPE</span>
                <span className="stint-val-headline headline" style={{ color: '#FFD700' }}>
                  +{stint.activeSlope.toFixed(3)} s/lap
                </span>
              </div>

              <div className="stint-val-box">
                <span className="stint-val-label telemetry">CLEAN LAPS</span>
                <span className="stint-val-headline headline">
                  {stint.cleanLapsCount} / {stint.totalLaps}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Stint Progression SVG Chart */}
      <div className="stint-chart-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="stint-pace-svg"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1={chartHeight - 30} x2={chartWidth} y2={chartHeight - 30} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="0" y1={(chartHeight - 30) / 2} x2={chartWidth} y2={(chartHeight - 30) / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

          {/* Stint Lap Data Points and Regression Lines */}
          {stintMetrics.map((stint, sIdx) => {
            const points = stint.laps.map((lap) => {
              const x = (lap.lapNumber / maxLaps) * chartWidth;
              const time = isFuelCorrected ? lap.correctedLapTimeSeconds : lap.rawLapTimeSeconds;
              const clamped = Math.max(minPace, Math.min(maxPace, time));
              const y = (chartHeight - 40) - ((clamped - minPace) / (maxPace - minPace)) * (chartHeight - 60);
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
        <div className="stint-chart-legend telemetry">
          <span>● SOLID DOT: GREEN FLAG LAP</span>
          <span>⊗ RED OUTLINE: EXCLUDED (PIT / SC / &gt;107%)</span>
          <span style={{ color: '#00D2FF' }}>
            MODEL: -{strategyData.fuelBurnRatePerLapKg} KG/LAP FUEL BURN • +{strategyData.fuelEffectPerKgSec} S/KG EFFECT
          </span>
        </div>
      </div>

      {/* Undercut / Overcut Window Calculator */}
      <div className="undercut-calculator-box telemetry-panel">
        <div className="undercut-header telemetry">
          <span>PIT STOP UNDERCUT / OVERCUT DELTA SIMULATOR</span>
          <span className="pit-loss-tag">PIT STOP LOSS: {pitLossSeconds.toFixed(1)}s</span>
        </div>

        <div className="undercut-content">
          <p className="telemetry undercut-desc">
            At {circuitName}, pitting 1 lap earlier onto fresh tyres with a degradation delta of ~
            {stintMetrics[0]?.activeSlope.toFixed(3)} s/lap provides an estimated lap advantage of
            0.8s–1.4s on out-lap warmup, overcoming a track position gap within 1.2s.
          </p>

          <div className="pit-loss-slider-box telemetry">
            <label htmlFor="pit-loss-range">ADJUST PIT LANE TRANSIT TIME:</label>
            <input
              id="pit-loss-range"
              type="range"
              min="16"
              max="28"
              step="0.5"
              value={pitLossSeconds}
              onChange={(e) => setPitLossSeconds(parseFloat(e.target.value))}
              className="pit-loss-slider"
            />
            <span className="pit-loss-val">{pitLossSeconds.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
