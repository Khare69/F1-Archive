import React, { useMemo, useRef, useState } from 'react';
import type { TelemetryShowdown, MiniSector } from '../../../types/telemetry';
import { interpolateTelemetryAtTime } from '../telemetryMath';
import './TelemetryTraceChart.css';

interface TelemetryTraceChartProps {
  showdown: TelemetryShowdown;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const TelemetryTraceChart: React.FC<TelemetryTraceChartProps> = ({
  showdown,
  currentTime,
  duration,
  onSeek
}) => {
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const [hoveredSector, setHoveredSector] = useState<MiniSector | null>(null);

  const samplesA = showdown.driverA.samples;
  const samplesB = showdown.driverB.samples;

  // ViewBox dimensions
  const width = 1000;
  const speedHeight = 160;
  const deltaHeight = 80;
  const pedalHeight = 70;
  const totalHeight = speedHeight + deltaHeight + pedalHeight + 50;

  // Speed bounds
  const maxSpeed = Math.max(showdown.driverA.topSpeed, showdown.driverB.topSpeed, 340);
  const minSpeed = Math.min(50, ...samplesA.map((s) => s.speed), ...samplesB.map((s) => s.speed));

  // Compute SVG Paths
  const { pathSpeedA, pathSpeedB, pathDelta, pathThrottleA, pathBrakeA } = useMemo(() => {
    if (!samplesA.length || !samplesB.length) {
      return { pathSpeedA: '', pathSpeedB: '', pathDelta: '', pathThrottleA: '', pathBrakeA: '' };
    }

    // Speed A Path
    const speedPtsA = samplesA.map((s) => {
      const x = s.distanceFraction * width;
      const y = speedHeight - ((s.speed - minSpeed) / (maxSpeed - minSpeed)) * (speedHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Speed B Path
    const speedPtsB = samplesB.map((s) => {
      const x = s.distanceFraction * width;
      const y = speedHeight - ((s.speed - minSpeed) / (maxSpeed - minSpeed)) * (speedHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Delta Path (Driver B time - Driver A time)
    // Positive means Driver A is ahead
    const deltaPts = samplesA.map((sA, idx) => {
      const sB = samplesB[idx] || samplesB[samplesB.length - 1];
      const deltaSec = sB.elapsedTime - sA.elapsedTime;
      const x = sA.distanceFraction * width;
      // Clamp delta scale to +/- 1.5 seconds
      const maxDelta = 1.5;
      const clamped = Math.max(-maxDelta, Math.min(maxDelta, deltaSec));
      const deltaYOffset = speedHeight + 15;
      const y = deltaYOffset + (deltaHeight / 2) - (clamped / maxDelta) * ((deltaHeight - 15) / 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Throttle / Brake A
    const throttlePtsA = samplesA.map((s) => {
      const x = s.distanceFraction * width;
      const yOffset = speedHeight + deltaHeight + 25;
      const y = yOffset + pedalHeight - (s.throttle / 100) * (pedalHeight - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const brakePtsA = samplesA.map((s) => {
      const x = s.distanceFraction * width;
      const yOffset = speedHeight + deltaHeight + 25;
      const y = yOffset + pedalHeight - (s.brake / 100) * (pedalHeight - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      pathSpeedA: `M ${speedPtsA.join(' L ')}`,
      pathSpeedB: `M ${speedPtsB.join(' L ')}`,
      pathDelta: `M ${deltaPts.join(' L ')}`,
      pathThrottleA: `M ${throttlePtsA.join(' L ')}`,
      pathBrakeA: `M ${brakePtsA.join(' L ')}`
    };
  }, [samplesA, samplesB, minSpeed, maxSpeed]);

  // Current scrubber cursor X position
  const currentSample = interpolateTelemetryAtTime(samplesA, currentTime);
  const cursorX = currentSample.distanceFraction * width;

  // Handle clicking on the SVG chart to seek
  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickFraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = clickFraction * duration;
    onSeek(targetTime);
  };

  return (
    <div className="telemetry-trace-card telemetry-panel corner-bracket">
      {/* Chart Header & Comparison Legend */}
      <div className="trace-header">
        <div className="trace-header-left">
          <span className="telemetry trace-badge">// 2D TELEMETRY TRACE OVERLAY</span>
          <h3 className="trace-title headline">{showdown.title}</h3>
        </div>

        <div className="trace-drivers-legend telemetry">
          <div className="driver-legend-box" style={{ borderColor: showdown.driverA.teamColor }}>
            <span className="legend-chip" style={{ backgroundColor: showdown.driverA.teamColor }}></span>
            <span className="driver-legend-name">{showdown.driverA.driverName}</span>
            <span className="driver-legend-time">{showdown.driverA.lapTime}</span>
            <span className="driver-legend-topspeed">{showdown.driverA.topSpeed} KM/H</span>
          </div>

          <span className="vs-tag telemetry">VS</span>

          <div className="driver-legend-box" style={{ borderColor: showdown.driverB.teamColor }}>
            <span className="legend-chip" style={{ backgroundColor: showdown.driverB.teamColor }}></span>
            <span className="driver-legend-name">{showdown.driverB.driverName}</span>
            <span className="driver-legend-time">{showdown.driverB.lapTime}</span>
            <span className="driver-legend-topspeed">{showdown.driverB.topSpeed} KM/H</span>
          </div>
        </div>
      </div>

      {/* 25 Mini-Sector Color Bar */}
      <div className="mini-sectors-strip-container" aria-label="25 Mini-Sector Performance Strip">
        <div className="mini-sectors-label telemetry">25 MINI-SECTORS:</div>
        <div className="mini-sectors-strip">
          {showdown.miniSectors25.map((ms) => {
            let color = '#FFFFFF';
            if (ms.fasterDriver === 'A') color = showdown.driverA.teamColor;
            else if (ms.fasterDriver === 'B') color = showdown.driverB.teamColor;

            return (
              <div
                key={ms.index}
                className="mini-sector-block"
                style={{ backgroundColor: color }}
                onMouseEnter={() => setHoveredSector(ms)}
                onMouseLeave={() => setHoveredSector(null)}
              ></div>
            );
          })}
        </div>

        {hoveredSector && (
          <div className="mini-sector-tooltip telemetry">
            <span>SECTOR #{hoveredSector.index}</span>
            <span>
              WINNER: {hoveredSector.fasterDriver === 'A' ? showdown.driverA.driverCode : hoveredSector.fasterDriver === 'B' ? showdown.driverB.driverCode : 'LEVEL'}
            </span>
            <span>DELTA: {hoveredSector.deltaSeconds > 0 ? `+${hoveredSector.deltaSeconds}s` : `${hoveredSector.deltaSeconds}s`}</span>
            <span>Δ SPEED: {hoveredSector.speedDeltaKmh > 0 ? `+${hoveredSector.speedDeltaKmh} km/h` : `${hoveredSector.speedDeltaKmh} km/h`}</span>
          </div>
        )}
      </div>

      {/* Synchronized Multi-Channel SVG Chart */}
      <div className="trace-svg-wrapper">
        <svg
          ref={chartSvgRef}
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="telemetry-svg"
          onClick={handleChartClick}
          preserveAspectRatio="none"
        >
          {/* Channel 1: Speed Grid & Baseline */}
          <line x1="0" y1={speedHeight} x2={width} y2={speedHeight} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1={speedHeight / 2} x2={width} y2={speedHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <text x="8" y="22" fill="#8899aa" fontSize="12" fontFamily="monospace">VELOCITY (KM/H)</text>
          <text x={width - 60} y="22" fill="#8899aa" fontSize="11" fontFamily="monospace">{maxSpeed} KM/H</text>
          <text x={width - 55} y={speedHeight - 8} fill="#8899aa" fontSize="11" fontFamily="monospace">{minSpeed} KM/H</text>

          {/* Speed Curves */}
          <path d={pathSpeedA} fill="none" stroke={showdown.driverA.teamColor} strokeWidth="2.5" />
          <path d={pathSpeedB} fill="none" stroke={showdown.driverB.teamColor} strokeWidth="2.5" strokeDasharray="6 3" />

          {/* Channel 2: Time Delta Overlay */}
          <line
            x1="0"
            y1={speedHeight + 15 + deltaHeight / 2}
            x2={width}
            y2={speedHeight + 15 + deltaHeight / 2}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x="8" y={speedHeight + 35} fill="#8899aa" fontSize="12" fontFamily="monospace">
            TIME DELTA (SEC) [TOP: {showdown.driverA.driverCode} AHEAD // BOTTOM: {showdown.driverB.driverCode} AHEAD]
          </text>
          <path d={pathDelta} fill="none" stroke="#FFD700" strokeWidth="2" />

          {/* Channel 3: Throttle & Brake Traces */}
          <line
            x1="0"
            y1={speedHeight + deltaHeight + 25 + pedalHeight}
            x2={width}
            y2={speedHeight + deltaHeight + 25 + pedalHeight}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <text x="8" y={speedHeight + deltaHeight + 42} fill="#8899aa" fontSize="12" fontFamily="monospace">
            PEDAL APPLICATION [GREEN: THROTTLE // RED: BRAKE]
          </text>
          <path d={pathThrottleA} fill="none" stroke="#00E701" strokeWidth="1.8" opacity="0.85" />
          <path d={pathBrakeA} fill="none" stroke="#FF1E1E" strokeWidth="1.8" opacity="0.85" />

          {/* Scrubber Playhead Line */}
          <line
            x1={cursorX}
            y1="0"
            x2={cursorX}
            y2={totalHeight}
            stroke="#00D2FF"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <polygon
            points={`${cursorX - 6},0 ${cursorX + 6},0 ${cursorX},8`}
            fill="#00D2FF"
          />
        </svg>
      </div>

      <div className="trace-footer-hint telemetry">
        <span>[ CLICK ANYWHERE ON TRACE TO SCRUB TELEMETRY // HOVER MINI-SECTORS FOR DELTA DETAILS ]</span>
      </div>
    </div>
  );
};
