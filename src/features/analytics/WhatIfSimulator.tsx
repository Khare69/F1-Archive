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
import './WhatIfSimulator.css';

interface WhatIfSimulatorProps {
  year: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ year }) => {
  const [systemId, setSystemId] = useState<ScoringPresetId>(() => {
    // Pick an intuitive alternative scoring system
    if (year >= 2010) return '2003_2009'; // modern season tested under 2000s rules
    if (year >= 1991) return 'modern';    // 90s/00s season tested under modern 25-pt rules
    if (year === 1988) return '1961_1990'; // 1988 tested with/without drops
    return 'modern';
  });

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
    <div className="what-if-simulator what-if-controls whatif-simulator-panel telemetry-panel corner-bracket">
      {/* Title & Description */}
      <div className="whatif-header-row">
        <div className="whatif-title-group">
          <span className="section-dot" style={{ background: outcomeFlipped ? '#FFD700' : '#00D2FF' }}></span>
          <h2 className="headline">CROSS-ERA "WHAT-IF" POINTS SIMULATOR</h2>
          <span className="whatif-subtitle telemetry">
            // RECALCULATING THE {year} WORLD CHAMPIONSHIP UNDER ALTERNATE SCORING RULES
          </span>
          <div className="mt-2">
            <ExperimentalBadge
              label="EXPERIMENTAL // SIMULATION"
              disclaimer="Hypothetical points recalculation — re-scoring historical championship outcomes under alternate points systems."
            />
          </div>
        </div>

        {/* Outcome Verdict Badge */}
        <div className={`verdict-badge ${outcomeFlipped ? 'verdict-flipped' : 'verdict-intact'}`}>
          <span className="verdict-label telemetry">
            {outcomeFlipped ? '⚡ TITLE OUTCOME FLIPPED' : '✓ TITLE OUTCOME INTACT'}
          </span>
          <strong className="headline verdict-champ">
            {simulatedChampion.driverName.toUpperCase()}
          </strong>
        </div>
      </div>

      {/* Simulator Control Matrix */}
      <div className="whatif-controls-grid">
        {/* Preset Selector */}
        <div className="control-group">
          <label className="control-label telemetry" htmlFor="scoring-preset-select">
            SCORING SYSTEM PRESET:
          </label>
          <select
            id="scoring-preset-select"
            value={systemId}
            onChange={e => setSystemId(e.target.value as ScoringPresetId)}
            className="f1-select headline"
          >
            {Object.values(SCORING_PRESETS).map(p => (
              <option key={p.id} value={p.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                {p.name} ({p.era})
              </option>
            ))}
          </select>
          <span className="control-caption telemetry">
            {SCORING_PRESETS[systemId].description}
          </span>
        </div>

        {/* Dynamic Edge-Case Toggles */}
        <div className="control-toggles-cluster">
          {/* Fastest Lap Point Toggle */}
          <label className="toggle-pill telemetry">
            <input
              type="checkbox"
              checked={applyFastestLap}
              onChange={e => setApplyFastestLap(e.target.checked)}
            />
            <span>+1 FASTEST LAP POINT (TOP 10)</span>
          </label>

          {/* Sprints Toggle (if season has sprints) */}
          {hasSprintsInSeason && (
            <label className="toggle-pill telemetry">
              <input
                type="checkbox"
                checked={includeSprints}
                onChange={e => setIncludeSprints(e.target.checked)}
              />
              <span>INCLUDE SPRINT RACE POINTS</span>
            </label>
          )}

          {/* Pre-1991 Dropped Scores Toggle */}
          {hasHistoricalDrops && (
            <label className="toggle-pill telemetry" style={{ borderColor: '#FFD700' }}>
              <input
                type="checkbox"
                checked={applyDroppedScores}
                onChange={e => setApplyDroppedScores(e.target.checked)}
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
        <div className="outcome-alert-box alert-flipped">
          <div className="alert-icon">🏆</div>
          <div className="alert-text">
            <strong className="headline">HISTORICAL TITLE SHIFT DETECTED!</strong>
            <p className="telemetry">
              Under this scoring configuration, <strong>{simulatedChampion.driverName}</strong> would have won the {year} World Championship with {simulatedChampion.simulatedPoints} points, overcoming official champion <strong>{originalChampion.driverName}</strong> ({originalChampion.simulatedPoints} points).
            </p>
          </div>
        </div>
      ) : (
        <div className="outcome-alert-box alert-intact">
          <div className="alert-icon">✓</div>
          <div className="alert-text">
            <strong className="headline">CHAMPIONSHIP RESULT UNCHANGED</strong>
            <p className="telemetry">
              <strong>{simulatedChampion.driverName}</strong> remains World Champion with {simulatedChampion.simulatedPoints} points under this system.
            </p>
          </div>
        </div>
      )}

      {/* Recalculated Standings Table */}
      <div className="table-responsive-wrapper">
        <table className="f1-table standings-diff-table" aria-label={`Simulated ${year} championship standings`}>
          <thead>
            <tr>
              <th className="telemetry col-rank">SIM RANK</th>
              <th className="telemetry col-driver">PILOT & CONSTRUCTOR</th>
              <th className="telemetry text-right">SIM PTS</th>
              <th className="telemetry text-right">ORIG PTS</th>
              <th className="telemetry text-right">PTS DIFF</th>
              <th className="telemetry text-center">WINS</th>
              <th className="telemetry text-center">PODIUMS</th>
              <th className="telemetry col-verdict">TITLE STATUS</th>
            </tr>
          </thead>
          <tbody>
            {simulatedStandings.slice(0, 15).map(s => {
              const rankChanged = s.rankDiff !== 0;
              const improved = s.rankDiff > 0;
              return (
                <tr
                  key={s.driverId}
                  className={s.isChampion ? 'row-champion' : ''}
                >
                  <td className="col-rank">
                    <span className="headline rank-number">{s.simulatedRank}</span>
                    {rankChanged && (
                      <span className={`rank-diff-tag telemetry ${improved ? 'diff-up' : 'diff-down'}`}>
                        {improved ? `▲+${s.rankDiff}` : `▼${s.rankDiff}`}
                      </span>
                    )}
                  </td>
                  <td className="col-driver">
                    <div className="pilot-title-box">
                      <strong className="headline pilot-name">{s.driverName}</strong>
                      <span className="telemetry text-muted">
                        [{s.driverCode}] // {s.constructorName || s.constructorId.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="text-right headline sim-pts-val" style={{ color: s.isChampion ? '#FFD700' : 'var(--color-accent-primary)' }}>
                    {s.simulatedPoints}
                  </td>
                  <td className="text-right telemetry text-muted">
                    {s.originalPoints}
                  </td>
                  <td className={`text-right telemetry ${s.pointsDiff >= 0 ? 'diff-positive' : 'diff-negative'}`}>
                    {s.pointsDiff >= 0 ? `+${s.pointsDiff}` : `${s.pointsDiff}`}
                  </td>
                  <td className="text-center headline">{s.wins}</td>
                  <td className="text-center headline">{s.podiums}</td>
                  <td className="col-verdict telemetry">
                    {s.isChampion && s.wasOriginalChampion && (
                      <span className="badge-champ-retained">CONFIRMED CHAMPION</span>
                    )}
                    {s.isChampion && !s.wasOriginalChampion && (
                      <span className="badge-champ-flipped">NEW SIMULATED CHAMPION</span>
                    )}
                    {!s.isChampion && s.wasOriginalChampion && (
                      <span className="badge-champ-lost">LOST WORLD TITLE</span>
                    )}
                    {!s.isChampion && !s.wasOriginalChampion && (
                      <span className="text-muted">P{s.simulatedRank}</span>
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
