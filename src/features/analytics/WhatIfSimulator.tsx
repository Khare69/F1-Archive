import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  SCORING_PRESETS,
  HISTORICAL_BEST_N,
  calculateSimulatedStandings,
  type ScoringPresetId,
  type WhatIfScoringOptions
} from './whatIfScoring';
import type { SeasonClassificationFile } from '../../types/f1';
import { ExperimentalBadge } from '../../components/ui/ExperimentalBadge';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';
import { useQueryStates, parseAsString } from 'nuqs';

interface WhatIfSimulatorProps {
  year: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ year }) => {
  const [urlParams, setUrlParams] = useQueryStates({
    scoring: parseAsString,
  });

  const [systemId, setSystemId] = useState<ScoringPresetId>(() => {
    if (urlParams.scoring && urlParams.scoring in SCORING_PRESETS) {
      return urlParams.scoring as ScoringPresetId;
    }
    // Pick an intuitive alternative scoring system
    if (year >= 2010) return '2003_2009'; // modern season tested under 2000s rules
    if (year >= 1991) return 'modern';    // 90s/00s season tested under modern 25-pt rules
    if (year === 1988) return '1961_1990'; // 1988 tested with/without drops
    return 'modern';
  });

  const handleSystemChange = (newSystem: ScoringPresetId) => {
    setSystemId(newSystem);
    setUrlParams({ scoring: newSystem });
  };

  const [applyFastestLap, setApplyFastestLap] = useState<boolean>(year >= 2019 && year <= 2024);
  const [includeSprints, setIncludeSprints] = useState<boolean>(true);
  const [applyDroppedScores, setApplyDroppedScores] = useState<boolean>(() => {
    return Boolean(HISTORICAL_BEST_N[year]);
  });

  // Fetch season classification JSON
  const { data: seasonData, isLoading, error } = useQuery<SeasonClassificationFile>({
    queryKey: ['season_classification', year],
    queryFn: async () => {
      const res = await fetch(`/data/seasons/${year}.json`);
      if (!res.ok) throw new Error(`Could not load classification for ${year}`);
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000
  });

  const hasHistoricalDrops = Boolean(HISTORICAL_BEST_N[year]);
  const hasSprintsInSeason = useMemo(() => {
    return Boolean(seasonData?.rounds.some(r => r.hasSprint));
  }, [seasonData]);

  const simulatedStandings = useMemo(() => {
    if (!seasonData || !seasonData.rounds) return [];

    const options: WhatIfScoringOptions = {
      systemId,
      applyFastestLapPoint: applyFastestLap,
      includeSprints,
      applyDroppedScores
    };

    return calculateSimulatedStandings(year, seasonData.rounds, options);
  }, [year, seasonData, systemId, applyFastestLap, includeSprints, applyDroppedScores]);

  if (isLoading) {
    return (
      <div className="whatif-panel telemetry-panel">
        <div className="loading-spinner"></div>
        <span className="telemetry">// COMPUTING {year} ALTERNATIVE SCORING MODEL...</span>
      </div>
    );
  }

  if (error || !seasonData || simulatedStandings.length === 0) {
    return (
      <div className="whatif-panel telemetry-panel">
        <span className="telemetry">// NO RACE RESULTS FOUND TO SIMULATE FOR {year}</span>
      </div>
    );
  }

  const simulatedChampion = simulatedStandings[0];
  const originalChampion = simulatedStandings.find(s => s.wasOriginalChampion) || simulatedStandings[0];
  const outcomeFlipped = simulatedChampion.driverId !== originalChampion.driverId;

  return (
    <div className="what-if-simulator whatif-simulator-panel p-6 sm:p-8 flex flex-col gap-6 bg-[#0D1322]/80 border border-white/10 rounded-lg text-white">
      {/* Title & Description */}
      <div className="whatif-header-row flex justify-between items-start flex-wrap gap-4">
        <div className="whatif-title-group flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-400 font-bold tracking-wider">// SPECULATIVE LABORATORY</span>
            <ExperimentalBadge compact />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            CROSS-ERA &quot;WHAT-IF&quot; POINTS SIMULATOR // <span className="text-cyan-400">{year} RE-CALCULATION</span>
          </h2>
          <span className="whatif-subtitle text-xs text-slate-400 font-mono tracking-wider">
            // RECALCULATING THE {year} WORLD CHAMPIONSHIP UNDER ALTERNATE SCORING RULES
          </span>
          <div className="mt-1">
            <ExperimentalBadge
              label="EXPERIMENTAL // SIMULATION"
              disclaimer="Hypothetical points recalculation — re-scoring historical championship outcomes under alternate points systems."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Outcome Verdict Badge */}
          <div className={`verdict-badge p-3 rounded-[4px] flex flex-col items-end gap-1 font-mono ${
            outcomeFlipped
              ? 'verdict-flipped bg-amber-500/10 border border-amber-400 text-amber-300'
              : 'verdict-intact bg-cyan-500/10 border border-cyan-400 text-cyan-300'
          }`}>
            <span className="verdict-label text-[11px] tracking-wider uppercase font-bold">
              {outcomeFlipped ? '⚡ TITLE OUTCOME FLIPPED' : '✓ TITLE OUTCOME INTACT'}
            </span>
            <strong className="text-base sm:text-lg font-black">
              {simulatedChampion.driverName.toUpperCase()}
            </strong>
          </div>
          <CopyShareLinkButton label="Share Scenario" />
        </div>
      </div>

      {/* Simulator Control Matrix */}
      <div className="whatif-controls-grid grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr] gap-6 bg-white/[0.02] border border-white/10 p-5 rounded-[4px] items-center">
        {/* Preset Selector */}
        <div className="control-group flex flex-col gap-1.5">
          <label className="control-label text-xs font-mono text-slate-300 tracking-wider" htmlFor="scoring-preset-select">
            SCORING SYSTEM PRESET:
          </label>
          <select
            id="scoring-preset-select"
            value={systemId}
            onChange={e => handleSystemChange(e.target.value as ScoringPresetId)}
            className="f1-select rounded border border-white/20 bg-[#090B10] px-3 py-2 font-mono text-xs text-white outline-none focus:border-cyan-400"
          >
            {Object.values(SCORING_PRESETS).map(p => (
              <option key={p.id} value={p.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                {p.name} ({p.era})
              </option>
            ))}
          </select>
          <span className="control-caption font-mono text-[11px] text-slate-400">
            {SCORING_PRESETS[systemId].description}
          </span>
        </div>

        {/* Dynamic Edge-Case Toggles */}
        <div className="control-toggles-cluster flex flex-wrap gap-3 items-center">
          {/* Fastest Lap Point Toggle */}
          <label className="toggle-pill flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-[4px] cursor-pointer text-xs font-mono text-slate-200 hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={applyFastestLap}
              onChange={e => setApplyFastestLap(e.target.checked)}
              className="accent-cyan-400 cursor-pointer"
            />
            <span>+1 FASTEST LAP POINT (TOP 10)</span>
          </label>

          {/* Sprints Toggle (if season has sprints) */}
          {hasSprintsInSeason && (
            <label className="toggle-pill flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-[4px] cursor-pointer text-xs font-mono text-slate-200 hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={includeSprints}
                onChange={e => setIncludeSprints(e.target.checked)}
                className="accent-cyan-400 cursor-pointer"
              />
              <span>INCLUDE SPRINT RACE POINTS</span>
            </label>
          )}

          {/* Pre-1991 Dropped Scores Toggle */}
          {hasHistoricalDrops && (
            <label className="toggle-pill flex items-center gap-2 px-3 py-2 bg-black/40 border border-amber-400/60 rounded-[4px] cursor-pointer text-xs font-mono text-amber-300 hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={applyDroppedScores}
                onChange={e => setApplyDroppedScores(e.target.checked)}
                className="accent-amber-400 cursor-pointer"
              />
              <span>
                APPLY ERA DROPPED SCORES (BEST {HISTORICAL_BEST_N[year]} RACES)
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Outcome Analysis Alert */}
      {outcomeFlipped ? (
        <div className="outcome-alert-box alert-flipped flex items-center gap-4 p-4 rounded-[4px] bg-amber-500/10 border border-amber-500/40 text-amber-200">
          <div className="alert-icon text-2xl">🏆</div>
          <div className="alert-text flex flex-col gap-1">
            <strong className="text-sm font-bold text-amber-300 font-mono">HISTORICAL TITLE SHIFT DETECTED!</strong>
            <p className="font-mono text-xs text-slate-300 leading-relaxed">
              Under this scoring configuration, <strong className="text-white">{simulatedChampion.driverName}</strong> would have won the {year} World Championship with {simulatedChampion.simulatedPoints} points, overcoming official champion <strong className="text-white">{originalChampion.driverName}</strong> ({originalChampion.simulatedPoints} points).
            </p>
          </div>
        </div>
      ) : (
        <div className="outcome-alert-box alert-intact flex items-center gap-4 p-4 rounded-[4px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
          <div className="alert-icon text-2xl">✓</div>
          <div className="alert-text flex flex-col gap-1">
            <strong className="text-sm font-bold text-cyan-300 font-mono">CHAMPIONSHIP RESULT UNCHANGED</strong>
            <p className="font-mono text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">{simulatedChampion.driverName}</strong> remains World Champion with {simulatedChampion.simulatedPoints} points under this system.
            </p>
          </div>
        </div>
      )}

      {/* Recalculated Standings Table */}
      <div className="table-responsive-wrapper overflow-x-auto rounded-[4px] bg-black/30 border border-white/10">
        <table className="f1-table standings-diff-table w-full min-w-[700px] border-collapse text-left font-mono text-xs" aria-label={`Simulated ${year} championship standings`}>
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400">
              <th className="p-3 col-rank">SIM RANK</th>
              <th className="p-3 col-driver">PILOT &amp; CONSTRUCTOR</th>
              <th className="p-3 text-right">SIM PTS</th>
              <th className="p-3 text-right">ORIG PTS</th>
              <th className="p-3 text-right">PTS DIFF</th>
              <th className="p-3 text-center">WINS</th>
              <th className="p-3 text-center">PODIUMS</th>
              <th className="p-3 col-verdict">TITLE STATUS</th>
            </tr>
          </thead>
          <tbody>
            {simulatedStandings.slice(0, 15).map(s => {
              const rankChanged = s.rankDiff !== 0;
              const improved = s.rankDiff > 0;
              return (
                <tr
                  key={s.driverId}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    s.isChampion ? 'bg-amber-500/[0.05]' : ''
                  }`}
                >
                  <td className="p-3 col-rank">
                    <span className="font-bold text-sm text-white mr-2">{s.simulatedRank}</span>
                    {rankChanged && (
                      <span className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                        improved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {improved ? `▲+${s.rankDiff}` : `▼${s.rankDiff}`}
                      </span>
                    )}
                  </td>
                  <td className="p-3 col-driver">
                    <div className="pilot-title-box flex flex-col">
                      <strong className="text-white text-xs font-bold">{s.driverName}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">
                        [{s.driverCode}] // {s.constructorName || s.constructorId.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-sm" style={{ color: s.isChampion ? '#FFD700' : '#00D2FF' }}>
                    {s.simulatedPoints}
                  </td>
                  <td className="p-3 text-right text-slate-400">
                    {s.originalPoints}
                  </td>
                  <td className={`p-3 text-right font-bold ${s.pointsDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.pointsDiff >= 0 ? `+${s.pointsDiff}` : `${s.pointsDiff}`}
                  </td>
                  <td className="p-3 text-center text-white">{s.wins}</td>
                  <td className="p-3 text-center text-white">{s.podiums}</td>
                  <td className="p-3 col-verdict font-mono text-[11px]">
                    {s.isChampion && s.wasOriginalChampion && (
                      <span className="text-amber-400 font-bold">CONFIRMED CHAMPION</span>
                    )}
                    {s.isChampion && !s.wasOriginalChampion && (
                      <span className="text-emerald-400 font-bold">NEW SIMULATED CHAMPION</span>
                    )}
                    {!s.isChampion && s.wasOriginalChampion && (
                      <span className="text-red-400 font-bold">LOST WORLD TITLE</span>
                    )}
                    {!s.isChampion && !s.wasOriginalChampion && (
                      <span className="text-slate-400">P{s.simulatedRank}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
