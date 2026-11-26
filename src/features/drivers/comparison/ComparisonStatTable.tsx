import React from 'react';
import { Link } from 'react-router-dom';
import { FallbackImage } from '../../../components/FallbackImage/FallbackImage';
import {
  type ComparableDriver,
  computeComparisonRows,
  type ComparisonMetricRow
} from './comparisonMetrics';

export interface ComparisonStatTableProps {
  driverA: ComparableDriver;
  driverB: ComparableDriver;
  teamA?: { id: string; name: string; color: string } | null;
  teamB?: { id: string; name: string; color: string } | null;
  colorA: string;
  colorB: string;
  mode: 'raw' | 'normalized';
}

export const ComparisonStatTable: React.FC<ComparisonStatTableProps> = ({
  driverA,
  driverB,
  teamA,
  teamB,
  colorA,
  colorB,
  mode
}) => {
  const rows: ComparisonMetricRow[] = computeComparisonRows(driverA, driverB, mode);

  return (
    <div className="space-y-6">
      {/* Showdown Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver A Card */}
        <div
          className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 relative overflow-hidden flex flex-col justify-between"
          style={{ borderLeft: `4px solid ${colorA}` }}
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="font-telemetry text-2xl font-black tracking-wider block" style={{ color: colorA }}>
                {driverA.number ? `#${driverA.number}` : driverA.code || '—'}
              </span>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight mt-1">{driverA.name}</h2>
              {teamA && (
                <Link
                  to={`/teams/${teamA.id}`}
                  className="font-telemetry text-xs tracking-wider inline-flex items-center gap-1 mt-1 hover:underline"
                  style={{ color: colorA }}
                >
                  <span>{teamA.name.toUpperCase()}</span>
                  <span>→</span>
                </Link>
              )}
              <div className="mt-3">
                <Link
                  to={`/drivers/${driverA.id}`}
                  className="font-telemetry text-[11px] text-slate-400 hover:text-cyan-400 transition-colors inline-block"
                >
                  VIEW FULL PROFILE & ARCHIVE →
                </Link>
              </div>
            </div>
            <div
              className="w-24 h-24 rounded-md overflow-hidden bg-slate-900 border flex-shrink-0"
              style={{ borderColor: `${colorA}55` }}
            >
              <FallbackImage
                src={driverA.imageUrl}
                alt={driverA.name}
                fallbackText={driverA.id}
                accentColor={colorA}
                type="driver"
                driverCode={driverA.id}
                driverNumber={driverA.number}
                championships={driverA.championships}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Driver B Card */}
        <div
          className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 relative overflow-hidden flex flex-col justify-between"
          style={{ borderLeft: `4px solid ${colorB}` }}
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="font-telemetry text-2xl font-black tracking-wider block" style={{ color: colorB }}>
                {driverB.number ? `#${driverB.number}` : driverB.code || '—'}
              </span>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight mt-1">{driverB.name}</h2>
              {teamB && (
                <Link
                  to={`/teams/${teamB.id}`}
                  className="font-telemetry text-xs tracking-wider inline-flex items-center gap-1 mt-1 hover:underline"
                  style={{ color: colorB }}
                >
                  <span>{teamB.name.toUpperCase()}</span>
                  <span>→</span>
                </Link>
              )}
              <div className="mt-3">
                <Link
                  to={`/drivers/${driverB.id}`}
                  className="font-telemetry text-[11px] text-slate-400 hover:text-cyan-400 transition-colors inline-block"
                >
                  VIEW FULL PROFILE & ARCHIVE →
                </Link>
              </div>
            </div>
            <div
              className="w-24 h-24 rounded-md overflow-hidden bg-slate-900 border flex-shrink-0"
              style={{ borderColor: `${colorB}55` }}
            >
              <FallbackImage
                src={driverB.imageUrl}
                alt={driverB.name}
                fallbackText={driverB.id}
                accentColor={colorB}
                type="driver"
                driverCode={driverB.id}
                driverNumber={driverB.number}
                championships={driverB.championships}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Visual Telemetry Matrix */}
      <div className="comparison-matrix-panel bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/80">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-telemetry">
            {mode === 'normalized' ? 'ERA-NORMALIZED CAREER TELEMETRY MATRIX' : 'RAW CAREER TELEMETRY MATRIX'}
          </h2>
        </div>

        <div className="space-y-4">
          {rows.map(row => {
            const maxVal = Math.max(row.leftValue ?? 0, row.rightValue ?? 0, 1);
            const leftPct = row.leftValue != null ? Math.min(100, Math.max(0, (row.leftValue / maxVal) * 100)) : 0;
            const rightPct = row.rightValue != null ? Math.min(100, Math.max(0, (row.rightValue / maxVal) * 100)) : 0;

            const isLeftWin = row.winner === 'left';
            const isRightWin = row.winner === 'right';

            return (
              <div key={row.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-telemetry">
                  <span
                    className={`font-bold tabular-nums text-sm ${isLeftWin ? 'text-amber-400' : 'text-slate-300'}`}
                    style={!isLeftWin ? { color: colorA } : undefined}
                  >
                    {row.leftFormatted} {isLeftWin && '▲'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase text-center px-2">
                    {row.label}
                  </span>
                  <span
                    className={`font-bold tabular-nums text-sm ${isRightWin ? 'text-amber-400' : 'text-slate-300'}`}
                    style={!isRightWin ? { color: colorB } : undefined}
                  >
                    {isRightWin && '▲'} {row.rightFormatted}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 h-2 bg-slate-950/60 rounded overflow-hidden p-0.5">
                  {/* Left Bar (Fills Right-to-Left) */}
                  <div className="flex justify-end bg-slate-900/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-300"
                      style={{ width: `${leftPct}%`, backgroundColor: colorA }}
                    />
                  </div>
                  {/* Right Bar (Fills Left-to-Right) */}
                  <div className="flex justify-start bg-slate-900/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-300"
                      style={{ width: `${rightPct}%`, backgroundColor: colorB }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Qualitative Specs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/40 p-4 rounded border border-slate-800/60" style={{ borderLeft: `3px solid ${colorA}` }}>
            <span className="text-[11px] font-telemetry text-slate-400 block mb-2">// {driverA.name.toUpperCase()} ATTRIBUTES</span>
            <div className="space-y-1.5 text-xs font-telemetry">
              <div className="flex justify-between"><span className="text-slate-500">NATIONALITY:</span><strong className="text-slate-200">{driverA.country}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">RACING NUMBER:</span><strong className="text-slate-200">{driverA.number ? `#${driverA.number}` : driverA.code || '—'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">CAREER STARTS:</span><strong className="text-slate-200">{driverA.starts ?? '—'} Starts</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">ERA POINTS SHARE:</span><strong className="text-cyan-400">{driverA.pointsSharePct ?? 0}%</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">STATUS:</span><strong className="text-slate-200">{driverA.isLegend ? 'LEGEND / HALL OF FAME' : 'ACTIVE CONTENDER'}</strong></div>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded border border-slate-800/60" style={{ borderLeft: `3px solid ${colorB}` }}>
            <span className="text-[11px] font-telemetry text-slate-400 block mb-2">// {driverB.name.toUpperCase()} ATTRIBUTES</span>
            <div className="space-y-1.5 text-xs font-telemetry">
              <div className="flex justify-between"><span className="text-slate-500">NATIONALITY:</span><strong className="text-slate-200">{driverB.country}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">RACING NUMBER:</span><strong className="text-slate-200">{driverB.number ? `#${driverB.number}` : driverB.code || '—'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">CAREER STARTS:</span><strong className="text-slate-200">{driverB.starts ?? '—'} Starts</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">ERA POINTS SHARE:</span><strong className="text-cyan-400">{driverB.pointsSharePct ?? 0}%</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">STATUS:</span><strong className="text-slate-200">{driverB.isLegend ? 'LEGEND / HALL OF FAME' : 'ACTIVE CONTENDER'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
