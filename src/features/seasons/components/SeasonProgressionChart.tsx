import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeamById } from '../../../data/dataService';
import type { SeasonClassificationFile } from '../../../types/f1';
import './SeasonProgressionChart.css';

interface SeasonProgressionChartProps {
  year: number;
}

const FALLBACK_PALETTE = [
  '#00D2FF', '#FF1E1E', '#FF8000', '#229971', '#0093CC',
  '#FFD700', '#B6BABD', '#6692FF', '#900000', '#E8002D'
];

export const SeasonProgressionChart: React.FC<SeasonProgressionChartProps> = ({ year }) => {
  const [hiddenDrivers, setHiddenDrivers] = useState<Set<string>>(new Set());
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);

  const { data: seasonData, isLoading, error } = useQuery<SeasonClassificationFile>({
    queryKey: ['season_classification', year],
    queryFn: async () => {
      const res = await fetch(`/data/seasons/${year}.json`);
      if (!res.ok) throw new Error(`Could not load classification for ${year}`);
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const chartData = useMemo(() => {
    if (!seasonData || !seasonData.standingsProgression || seasonData.standingsProgression.length === 0) {
      return null;
    }

    const rounds = seasonData.rounds.filter(r => !r.isCancelled);
    const progression = seasonData.standingsProgression;

    // Identify top contenders across the season (ever in top 6 or top 8 at any point)
    const driverSet = new Map<string, { code: string; name: string; teamId: string }>();
    for (const prog of progression) {
      for (const d of prog.standings.slice(0, 8)) {
        if (!driverSet.has(d.driverId)) {
          driverSet.set(d.driverId, { code: d.driverCode, name: d.driverName, teamId: d.constructorId });
        }
      }
    }

    // Limit to top 10 unique drivers for clarity
    const selectedDriverIds = Array.from(driverSet.keys()).slice(0, 8);

    // Group teammates to apply dashed stroke differentiation for second teammate
    const teamDriverCount = new Map<string, number>();
    const driverDashArray = new Map<string, string | undefined>();

    for (const dId of selectedDriverIds) {
      const meta = driverSet.get(dId)!;
      const count = teamDriverCount.get(meta.teamId) || 0;
      if (count > 0) {
        driverDashArray.set(dId, '5 4'); // Second teammate gets dashed stroke
      }
      teamDriverCount.set(meta.teamId, count + 1);
    }

    // Compute cumulative trajectory for each selected driver across rounds
    let maxPts = 10;
    const series = selectedDriverIds.map((dId, idx) => {
      const meta = driverSet.get(dId)!;
      const team = getTeamById(meta.teamId);
      const color = team?.color || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
      const strokeDasharray = driverDashArray.get(dId);

      const points: { round: number; points: number; position: number }[] = [];

      for (let rIdx = 0; rIdx < progression.length; rIdx++) {
        const prog = progression[rIdx];
        const match = prog.standings.find(s => s.driverId === dId);
        const prevPts = points.length > 0 ? points[points.length - 1].points : 0;
        const curPts = match ? match.points : prevPts;
        const pos = match ? match.position : 20;

        points.push({ round: prog.round, points: curPts, position: pos });
        if (curPts > maxPts) maxPts = curPts;
      }

      return {
        driverId: dId,
        code: meta.code,
        name: meta.name,
        teamId: meta.teamId,
        color,
        strokeDasharray,
        points
      };
    });

    return {
      rounds,
      series,
      maxPts: Math.ceil(maxPts * 1.08),
      totalRounds: rounds.length
    };
  }, [seasonData]);

  if (isLoading) {
    return (
      <div className="chart-loading-panel telemetry-panel">
        <div className="loading-spinner"></div>
        <span className="telemetry">// COMPILING {year} PROGRESSION TELEMETRY...</span>
      </div>
    );
  }

  if (error || !chartData || chartData.series.length === 0) {
    return (
      <div className="chart-empty-panel telemetry-panel">
        <span className="telemetry">// NO PROGRESSION CLASSIFICATION DATA AVAILABLE FOR {year}</span>
      </div>
    );
  }

  const { rounds, series, maxPts, totalRounds } = chartData;

  // SVG Geometry Dimensions
  const W = 920;
  const H = 420;
  const padL = 60;
  const padR = 30;
  const padT = 30;
  const padB = 50;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const getX = (roundIndex: number) => {
    if (totalRounds <= 1) return padL + innerW / 2;
    return padL + (roundIndex / (totalRounds - 1)) * innerW;
  };

  const getY = (pts: number) => {
    return padT + innerH - (pts / maxPts) * innerH;
  };

  const toggleDriver = (dId: string) => {
    setHiddenDrivers(prev => {
      const next = new Set(prev);
      if (next.has(dId)) next.delete(dId);
      else next.add(dId);
      return next;
    });
  };

  // Hovered round summary
  const activeRoundIndex = hoveredRound !== null ? hoveredRound : totalRounds - 1;
  const activeRoundObj = rounds[activeRoundIndex] || rounds[0];

  return (
    <div className="season-progression-chart-panel telemetry-panel corner-bracket">
      <div className="chart-title-bar">
        <div className="chart-title-left">
          <span className="section-dot" style={{ background: '#00D2FF' }}></span>
          <h2 className="headline">{year} WORLD CHAMPIONSHIP PROGRESSION</h2>
          <span className="chart-subtitle telemetry">// CUMULATIVE POINTS RACE-BY-RACE TRAJECTORY</span>
        </div>

        <div className="chart-legend-row" role="toolbar" aria-label="Toggle driver lines">
          {series.map(s => {
            const isHidden = hiddenDrivers.has(s.driverId);
            return (
              <button
                key={s.driverId}
                type="button"
                className={`chart-legend-pill telemetry ${isHidden ? 'legend-hidden' : ''}`}
                onClick={() => toggleDriver(s.driverId)}
                style={{
                  '--pill-color': s.color,
                  borderColor: isHidden ? 'rgba(255,255,255,0.1)' : s.color
                } as React.CSSProperties}
                title={`Toggle ${s.name} on chart`}
              >
                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor: s.color,
                    borderStyle: s.strokeDasharray ? 'dashed' : 'solid'
                  }}
                />
                <span className="legend-code">{s.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="svg-container">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="progression-svg"
          role="img"
          aria-label={`Cumulative championship progression chart for the ${year} season`}
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padT + innerH - pct * innerH;
            const ptsVal = Math.round(pct * maxPts);
            return (
              <g key={i} className="chart-grid-group">
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
                <text x={padL - 10} y={y + 4} textAnchor="end" fill="rgba(255, 255, 255, 0.4)" fontSize="11" fontFamily="monospace">
                  {ptsVal}
                </text>
              </g>
            );
          })}

          {/* Round X-Axis Grid & Labels */}
          {rounds.map((r, i) => {
            const x = getX(i);
            const isHovered = hoveredRound === i;
            return (
              <g key={r.round} className="chart-round-col">
                <line
                  x1={x}
                  y1={padT}
                  x2={x}
                  y2={padT + innerH}
                  stroke={isHovered ? 'rgba(0, 210, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)'}
                  strokeWidth={isHovered ? '1.5' : '1'}
                />
                <text
                  x={x}
                  y={padT + innerH + 20}
                  textAnchor="middle"
                  fill={isHovered ? '#00D2FF' : 'rgba(255, 255, 255, 0.5)'}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  R{r.round}
                </text>
              </g>
            );
          })}

          {/* Trajectory Polylines */}
          {series.map(s => {
            if (hiddenDrivers.has(s.driverId)) return null;

            const pathD = s.points
              .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(pt.points).toFixed(1)}`)
              .join(' ');

            return (
              <g key={s.driverId} className="driver-series-group">
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.strokeDasharray ? '2.0' : '2.5'}
                  strokeDasharray={s.strokeDasharray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
                {/* Data Points */}
                {s.points.map((pt, pIdx) => {
                  const cx = getX(pIdx);
                  const cy = getY(pt.points);
                  const isHovered = hoveredRound === pIdx;
                  return (
                    <circle
                      key={pIdx}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.5 : 3}
                      fill={s.color}
                      stroke="#0D1322"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Interactive Mouse Capture Columns */}
          {rounds.map((_, i) => {
            const colW = innerW / Math.max(1, totalRounds - 1);
            const x = getX(i) - colW / 2;
            return (
              <rect
                key={i}
                x={x}
                y={padT}
                width={colW}
                height={innerH}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredRound(i)}
                onMouseLeave={() => setHoveredRound(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Interactive Round Inspection Card */}
      <div className="chart-tooltip-panel">
        <div className="tooltip-header telemetry">
          <span className="tooltip-round-badge">
            ROUND {activeRoundObj.round} // {activeRoundObj.name.toUpperCase()}
          </span>
          <span className="text-muted">{activeRoundObj.date}</span>
        </div>

        <div className="tooltip-standings-grid">
          {series
            .filter(s => !hiddenDrivers.has(s.driverId))
            .map(s => {
              const pt = s.points[activeRoundIndex] || s.points[s.points.length - 1];
              return (
                <div key={s.driverId} className="tooltip-driver-item" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="tooltip-driver-name">
                    <strong className="headline">{s.name}</strong>
                    <span className="telemetry text-muted">[{s.code}]</span>
                  </div>
                  <div className="tooltip-pts-val headline" style={{ color: s.color }}>
                    {pt.points} PTS
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
