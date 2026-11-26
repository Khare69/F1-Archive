import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { TelemetryShowdown, MiniSector } from '../../../types/telemetry';
import { UPlotWrapper } from '../../../components/charts/UPlotWrapper';
import {
  buildAlignedTelemetryData,
  buildSpeedChartOptions,
  buildDeltaChartOptions,
  buildPedalChartOptions,
  buildGearChartOptions,
} from '../uplotTelemetryConfig';

export interface TelemetryTraceChartProps {
  showdown: TelemetryShowdown;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onScrubProgress?: (distNorm: number | null) => void;
}

export const TelemetryTraceChart: React.FC<TelemetryTraceChartProps> = ({
  showdown,
  currentTime,
  duration,
  onSeek,
  onScrubProgress,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSector, setHoveredSector] = useState<MiniSector | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const aligned = useMemo(() => {
    return buildAlignedTelemetryData(showdown);
  }, [showdown]);

  // Current progress fraction from playback currentTime
  const currentFraction = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  // Chart options memoized per showdown
  const speedOpts = useMemo(
    () => buildSpeedChartOptions(showdown, () => currentFraction),
    [showdown, currentFraction]
  );
  const deltaOpts = useMemo(() => buildDeltaChartOptions(showdown), [showdown]);
  const pedalOpts = useMemo(() => buildPedalChartOptions(showdown), [showdown]);
  const gearOpts = useMemo(() => buildGearChartOptions(showdown), [showdown]);

  // Columnar data slices for the 4 charts
  const speedData = useMemo<uPlot.AlignedData>(
    () => [aligned.distNorm, aligned.speedA, aligned.speedB],
    [aligned]
  );
  const deltaData = useMemo<uPlot.AlignedData>(
    () => [aligned.distNorm, aligned.deltaSec],
    [aligned]
  );
  const pedalData = useMemo<uPlot.AlignedData>(
    () => [
      aligned.distNorm,
      aligned.throttleA,
      aligned.brakeA,
      aligned.throttleB,
      aligned.brakeB,
    ],
    [aligned]
  );
  const gearData = useMemo<uPlot.AlignedData>(
    () => [aligned.distNorm, aligned.gearA, aligned.gearB],
    [aligned]
  );

  // Throttled cursor index handler to sync scrubbing with 3D ghost view
  const handleCursorIndexChange = useCallback(
    (idx: number | null) => {
      setHoveredIndex(idx);
      if (onScrubProgress) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          if (idx != null && idx >= 0 && idx < aligned.distNorm.length) {
            onScrubProgress(aligned.distNorm[idx]);
          } else {
            onScrubProgress(null);
          }
        });
      }
    },
    [aligned.distNorm, onScrubProgress]
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Determine active sample for the top telemetry readout strip
  const activeIdx = useMemo(() => {
    if (hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < aligned.distNorm.length) {
      return hoveredIndex;
    }
    // Fallback: binary search or closest sample to currentTime fraction
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < aligned.distNorm.length; i++) {
      const diff = Math.abs(aligned.distNorm[i] - currentFraction);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return closestIdx;
  }, [hoveredIndex, aligned.distNorm, currentFraction]);

  const activeSample = {
    distPct: ((aligned.distNorm[activeIdx] ?? 0) * 100).toFixed(1),
    speedA: aligned.speedA[activeIdx] ?? 0,
    speedB: aligned.speedB[activeIdx] ?? 0,
    delta: aligned.deltaSec[activeIdx] ?? 0,
    throttleA: aligned.throttleA[activeIdx] ?? 0,
    brakeA: aligned.brakeA[activeIdx] ?? 0,
    gearA: aligned.gearA[activeIdx] ?? 0,
    gearB: aligned.gearB[activeIdx] ?? 0,
  };

  return (
    <div className="flex flex-col w-full rounded border border-white/10 bg-[#11151E] p-4 text-white">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#E10600]">
            // 4-CHANNEL SYNCHRONIZED TELEMETRY TRACE
          </span>
          <h3 className="font-display text-base font-bold tracking-wide text-white">
            {showdown.title}
          </h3>
        </div>

        {/* Driver Comparison Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div
            className="flex items-center gap-2 rounded border px-2.5 py-1 bg-white/[0.02]"
            style={{ borderColor: showdown.driverA.teamColor }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: showdown.driverA.teamColor }}
            />
            <span className="font-bold text-white">{showdown.driverA.driverName}</span>
            <span className="text-neutral-400">{showdown.driverA.lapTime}</span>
            <span className="text-[10px] text-neutral-500">
              {showdown.driverA.topSpeed} KM/H
            </span>
          </div>

          <span className="text-[10px] uppercase text-neutral-500 font-bold">VS</span>

          <div
            className="flex items-center gap-2 rounded border px-2.5 py-1 bg-white/[0.02]"
            style={{ borderColor: showdown.driverB.teamColor }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: showdown.driverB.teamColor }}
            />
            <span className="font-bold text-white">{showdown.driverB.driverName}</span>
            <span className="text-neutral-400">{showdown.driverB.lapTime}</span>
            <span className="text-[10px] text-neutral-500">
              {showdown.driverB.topSpeed} KM/H
            </span>
          </div>
        </div>
      </div>

      {/* Top Telemetry Live Readout Strip */}
      <div className="my-2.5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 rounded border border-white/5 bg-[#181D28] px-3 py-2 font-mono text-xs tabular-nums">
        <div>
          <span className="block text-[10px] text-[#8494AB]">DISTANCE</span>
          <span className="font-bold text-white">{activeSample.distPct}%</span>
        </div>
        <div>
          <span className="block text-[10px] text-[#8494AB]">
            SPD ({showdown.driverA.driverCode})
          </span>
          <span
            className="font-bold"
            style={{ color: showdown.driverA.teamColor }}
          >
            {activeSample.speedA} KM/H
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-[#8494AB]">
            SPD ({showdown.driverB.driverCode})
          </span>
          <span
            className="font-bold"
            style={{ color: showdown.driverB.teamColor }}
          >
            {activeSample.speedB} KM/H
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-[#8494AB]">DELTA (A - B)</span>
          <span
            className={`font-bold ${
              activeSample.delta < 0 ? 'text-[#22C55E]' : activeSample.delta > 0 ? 'text-[#EF4444]' : 'text-neutral-400'
            }`}
          >
            {activeSample.delta >= 0 ? `+${activeSample.delta.toFixed(3)}s` : `${activeSample.delta.toFixed(3)}s`}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-[#8494AB]">THROTTLE</span>
          <span className="font-bold text-[#22C55E]">{activeSample.throttleA}%</span>
        </div>
        <div>
          <span className="block text-[10px] text-[#8494AB]">BRAKE</span>
          <span className="font-bold text-[#EF4444]">{activeSample.brakeA}%</span>
        </div>
        <div>
          <span className="block text-[10px] text-[#8494AB]">GEAR (A / B)</span>
          <span className="font-bold text-white">
            G{activeSample.gearA} / G{activeSample.gearB}
          </span>
        </div>
      </div>

      {/* 25 Mini-Sector Strip (if available) */}
      {showdown.miniSectors25 && showdown.miniSectors25.length > 0 && (
        <div className="mb-3 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8494AB]">
            <span>25 MINI-SECTORS (DELTA DOMINANCE)</span>
            {hoveredSector && (
              <span className="text-white">
                Sector {hoveredSector.index + 1}: Faster Driver {hoveredSector.fasterDriver} (
                {hoveredSector.deltaSeconds != null ? `${hoveredSector.deltaSeconds.toFixed(3)}s` : ''})
              </span>
            )}
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded bg-white/5">
            {showdown.miniSectors25.map((ms) => {
              const bg =
                ms.fasterDriver === 'A'
                  ? showdown.driverA.teamColor
                  : ms.fasterDriver === 'B'
                  ? showdown.driverB.teamColor
                  : '#8494AB';
              return (
                <div
                  key={ms.index}
                  className="h-full flex-1 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: bg }}
                  onMouseEnter={() => setHoveredSector(ms)}
                  onMouseLeave={() => setHoveredSector(null)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Stacked Synchronized uPlot Channels */}
      <div className="flex flex-col gap-2 w-full">
        {/* Channel 1: Speed */}
        <UPlotWrapper
          options={speedOpts}
          data={speedData}
          heightPx={150}
          ariaLabel={`${showdown.title} Speed Telemetry Trace`}
          onCursorIndexChange={handleCursorIndexChange}
        />

        {/* Channel 2: Time Delta */}
        <UPlotWrapper
          options={deltaOpts}
          data={deltaData}
          heightPx={85}
          ariaLabel="Lap Time Delta Telemetry"
          onCursorIndexChange={handleCursorIndexChange}
        />

        {/* Channel 3: Throttle & Brake */}
        <UPlotWrapper
          options={pedalOpts}
          data={pedalData}
          heightPx={95}
          ariaLabel="Throttle and Brake Input Telemetry"
          onCursorIndexChange={handleCursorIndexChange}
        />

        {/* Channel 4: Gear */}
        <UPlotWrapper
          options={gearOpts}
          data={gearData}
          heightPx={80}
          ariaLabel="Gear Shift Telemetry"
          onCursorIndexChange={handleCursorIndexChange}
        />
      </div>
    </div>
  );
};

export default TelemetryTraceChart;
