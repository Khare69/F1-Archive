import React, { useState, useMemo } from 'react';
import {
  TYRE_COMPOUND_SPECS,
  type SimulationConfig,
  type StrategyPlan,
  type TyreCompound
} from './strategySimulationEngine';
import { useStrategySimulation } from './useStrategySimulation';
import { usePageMeta } from '../../hooks/usePageMeta';
import { exportPosterAsPng } from '../../utils/posterExport';
import { ExperimentalBadge } from '../../components/ui/ExperimentalBadge';
import './PitWallStrategy.css';

interface CircuitPreset {
  id: string;
  name: string;
  laps: number;
  basePaceMs: number;
  scProb: number;
}

const CIRCUIT_PRESETS: CircuitPreset[] = [
  { id: 'silverstone', name: 'Silverstone (British GP)', laps: 52, basePaceMs: 88500, scProb: 0.35 },
  { id: 'monaco', name: 'Monaco (Monte Carlo)', laps: 78, basePaceMs: 74200, scProb: 0.65 },
  { id: 'monza', name: 'Monza (Autodromo Nazionale)', laps: 53, basePaceMs: 81800, scProb: 0.25 },
  { id: 'spa', name: 'Spa-Francorchamps (Belgian GP)', laps: 44, basePaceMs: 104500, scProb: 0.45 },
  { id: 'bahrain', name: 'Bahrain (Sakhir International)', laps: 57, basePaceMs: 91200, scProb: 0.30 },
  { id: 'madrid2026', name: 'Madrid 2026 (Circuito Madring)', laps: 56, basePaceMs: 89400, scProb: 0.40 }
];

export const PitWallStrategy: React.FC = () => {
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitPreset>(CIRCUIT_PRESETS[0]);
  const [scProb, setScProb] = useState<number>(CIRCUIT_PRESETS[0].scProb);
  const [iterations, setIterations] = useState<number>(5000);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Default strategies for the selected circuit
  const defaultStrategies = useMemo<StrategyPlan[]>(() => {
    const laps = selectedCircuit.laps;
    const pit1 = Math.round(laps * 0.42);
    const pit2A = Math.round(laps * 0.28);
    const pit2B = Math.round(laps * 0.65);

    return [
      {
        id: 'strat-1stop-m-h',
        name: 'Strategy A: 1-Stop [M ➔ H]',
        color: '#FFD700',
        stints: [
          { compound: 'medium' as TyreCompound, laps: pit1 },
          { compound: 'hard' as TyreCompound, laps: laps - pit1 }
        ]
      },
      {
        id: 'strat-2stop-s-m-s',
        name: 'Strategy B: Aggressive 2-Stop [S ➔ M ➔ S]',
        color: '#FF1E1E',
        stints: [
          { compound: 'soft' as TyreCompound, laps: pit2A },
          { compound: 'medium' as TyreCompound, laps: pit2B - pit2A },
          { compound: 'soft' as TyreCompound, laps: laps - pit2B }
        ]
      },
      {
        id: 'strat-1stop-h-m',
        name: 'Strategy C: Reverse 1-Stop [H ➔ M]',
        color: '#FFFFFF',
        stints: [
          { compound: 'hard' as TyreCompound, laps: Math.round(laps * 0.58) },
          { compound: 'medium' as TyreCompound, laps: laps - Math.round(laps * 0.58) }
        ]
      }
    ];
  }, [selectedCircuit]);

  const initialSimConfig = useMemo<SimulationConfig>(() => ({
    circuitName: selectedCircuit.name,
    totalLaps: selectedCircuit.laps,
    baseLapTimeMs: selectedCircuit.basePaceMs,
    safetyCarProbability: scProb,
    iterations,
    seed: 42,
    strategies: defaultStrategies
  }), [selectedCircuit, scProb, iterations, defaultStrategies]);

  const { output, isRunning, progress, triggerDebounced } = useStrategySimulation(initialSimConfig);

  const handleCircuitChange = (circuitId: string) => {
    const c = CIRCUIT_PRESETS.find((cp) => cp.id === circuitId) || CIRCUIT_PRESETS[0];
    setSelectedCircuit(c);
    setScProb(c.scProb);

    const laps = c.laps;
    const pit1 = Math.round(laps * 0.42);
    const pit2A = Math.round(laps * 0.28);
    const pit2B = Math.round(laps * 0.65);

    const strats: StrategyPlan[] = [
      {
        id: 'strat-1stop-m-h',
        name: 'Strategy A: 1-Stop [M ➔ H]',
        color: '#FFD700',
        stints: [
          { compound: 'medium', laps: pit1 },
          { compound: 'hard', laps: laps - pit1 }
        ]
      },
      {
        id: 'strat-2stop-s-m-s',
        name: 'Strategy B: Aggressive 2-Stop [S ➔ M ➔ S]',
        color: '#FF1E1E',
        stints: [
          { compound: 'soft', laps: pit2A },
          { compound: 'medium', laps: pit2B - pit2A },
          { compound: 'soft', laps: laps - pit2B }
        ]
      },
      {
        id: 'strat-1stop-h-m',
        name: 'Strategy C: Reverse 1-Stop [H ➔ M]',
        color: '#FFFFFF',
        stints: [
          { compound: 'hard', laps: Math.round(laps * 0.58) },
          { compound: 'medium', laps: laps - Math.round(laps * 0.58) }
        ]
      }
    ];

    triggerDebounced({
      circuitName: c.name,
      totalLaps: c.laps,
      baseLapTimeMs: c.basePaceMs,
      safetyCarProbability: c.scProb,
      iterations,
      seed: 42,
      strategies: strats
    });
  };

  const handleScProbChange = (val: number) => {
    setScProb(val);
    triggerDebounced({
      ...initialSimConfig,
      safetyCarProbability: val,
      iterations
    });
  };

  const handleIterationsChange = (val: number) => {
    setIterations(val);
    triggerDebounced({
      ...initialSimConfig,
      safetyCarProbability: scProb,
      iterations: val
    });
  };

  const handleExportPoster = async () => {
    if (!output) return;
    setIsExporting(true);
    try {
      await exportPosterAsPng({
        title: `PIT WALL STRATEGY // ${selectedCircuit.name.toUpperCase()}`,
        subtitle: `MONTE CARLO RACE SIMULATION — ${iterations.toLocaleString()} PERMUTATIONS`,
        rows: output.results.map((r, i) => ({
          label: `#${i + 1} ${r.name}`,
          value: `${r.winRatePct}% WIN RATE • ${r.totalTimeFormatted} (${r.gapToLeaderMs > 0 ? `+${(r.gapToLeaderMs / 1000).toFixed(1)}s` : 'LEADER'})`,
          color: r.color
        })),
        footerNote: 'Generated by F1 Archive Pit-Wall Engine • Strictly for non-commercial educational analytics'
      });
    } finally {
      setIsExporting(false);
    }
  };

  usePageMeta({
    title: 'Monte Carlo Pit-Wall Strategy & Undercut Simulator — F1 Archive',
    description: 'Simulate 10,000 race permutations with realistic tyre degradation cliffs, fuel burn deltas, and safety car undercut probability curves.',
    canonicalPath: '/pitwall'
  });

  return (
    <div className="pitwall-page-root">
      {/* Header Panel */}
      <header className="pitwall-header telemetry-panel corner-bracket">
        <div className="pitwall-title-box">
          <span className="pitwall-badge telemetry">// TACTICAL RACE ENGINEERING</span>
          <h1 className="pitwall-title headline">PIT WALL STRATEGY &amp; UNDERCUT SIMULATOR</h1>
          <p className="pitwall-subtitle telemetry">
            OFF-THREAD MONTE CARLO STOCHASTIC SIMULATION (TYRE CLIFFS, FUEL BURN &amp; SAFETY CARS)
          </p>
          <div className="mt-2.5">
            <ExperimentalBadge
              label="EXPERIMENTAL // SIMULATION"
              disclaimer="Monte Carlo race strategy model — deterministic seeded projection for pit-wall analysis, not official FIA/team telemetry."
            />
          </div>
        </div>

        <div className="pitwall-status-pill telemetry">
          <span className={`status-dot ${isRunning ? 'pulse gold' : 'green'}`}></span>
          <span>{isRunning ? `COMPUTING PERMUTATIONS (${progress}%)...` : 'WORKER IDLE // READY'}</span>
        </div>
      </header>

      {/* Control Bar */}
      <section className="pitwall-controls-bar telemetry-panel corner-bracket" aria-label="Simulation Controls">
        <div className="control-group">
          <label htmlFor="circuit-select" className="control-label telemetry">GRAND PRIX CIRCUIT:</label>
          <select
            id="circuit-select"
            className="pitwall-select telemetry"
            value={selectedCircuit.id}
            onChange={(e) => handleCircuitChange(e.target.value)}
          >
            {CIRCUIT_PRESETS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.laps} Laps)
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sc-prob-slider" className="control-label telemetry">
            SAFETY CAR / VSC INDEX: <strong>{Math.round(scProb * 100)}%</strong>
          </label>
          <input
            id="sc-prob-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="pitwall-slider"
            value={scProb}
            onChange={(e) => handleScProbChange(parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="iter-select" className="control-label telemetry">PERMUTATIONS:</label>
          <select
            id="iter-select"
            className="pitwall-select telemetry"
            value={iterations}
            onChange={(e) => handleIterationsChange(parseInt(e.target.value, 10))}
          >
            <option value="1000">1,000 Runs (Ultra Fast)</option>
            <option value="5000">5,000 Runs (Standard)</option>
            <option value="10000">10,000 Runs (High Precision)</option>
          </select>
        </div>

        <button
          type="button"
          className="export-poster-btn telemetry f1-btn"
          onClick={handleExportPoster}
          disabled={!output || isExporting}
        >
          <span>{isExporting ? 'EXPORTING...' : '📸 EXPORT POSTER (PNG)'}</span>
        </button>
      </section>

      {/* Progress Bar */}
      {isRunning && (
        <div className="sim-progress-bar-container">
          <div className="sim-progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* Strategy Comparison Cards */}
      <main className="pitwall-results-grid">
        {output?.results.map((res, index) => {
          const isWinner = index === 0;
          return (
            <article
              key={res.id}
              className={`strategy-result-card telemetry-panel corner-bracket ${isWinner ? 'optimal' : ''}`}
            >
              <div className="card-top-bar">
                <span className="rank-badge telemetry">
                  {isWinner ? '★ OPTIMAL STRATEGY' : `RANK #${index + 1}`}
                </span>
                <span className="win-rate-pill telemetry" style={{ borderColor: res.color, color: res.color }}>
                  {res.winRatePct}% WIN PROBABILITY
                </span>
              </div>

              <h2 className="strategy-name headline">{res.name}</h2>
              <div className="stints-flow telemetry">{res.stintsSummary}</div>

              <div className="metrics-summary-grid telemetry">
                <div className="metric-box">
                  <span className="metric-label">EST. RACE DURATION</span>
                  <span className="metric-val">{res.totalTimeFormatted}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">DELTA TO WINNER</span>
                  <span className="metric-val">
                    {res.gapToLeaderMs === 0 ? 'LEADER' : `+${(res.gapToLeaderMs / 1000).toFixed(2)}s`}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">FASTEST LAP</span>
                  <span className="metric-val">{res.fastestLapFormatted}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">MEDIAN PACE (P50)</span>
                  <span className="metric-val">{(res.p50PaceMs / 1000).toFixed(2)}s</span>
                </div>
              </div>

              {/* Mini Win Rate Bar */}
              <div className="win-rate-track">
                <div
                  className="win-rate-fill"
                  style={{ width: `${res.winRatePct}%`, backgroundColor: res.color }}
                ></div>
              </div>
            </article>
          );
        })}
      </main>

      {/* Tyre Physics Explainer Footer */}
      <footer className="pitwall-physics-footer telemetry-panel corner-bracket">
        <div className="footer-title telemetry">// STOCHASTIC PHYSICS MODEL SPECIFICATIONS</div>
        <div className="compound-specs-row">
          {(['soft', 'medium', 'hard'] as TyreCompound[]).map((c) => {
            const spec = TYRE_COMPOUND_SPECS[c];
            return (
              <div key={c} className="spec-item telemetry">
                <span className="compound-dot" style={{ backgroundColor: spec.color }}></span>
                <strong>{spec.name}:</strong> Pace Delta: {spec.paceOffsetMs > 0 ? `+${spec.paceOffsetMs}` : spec.paceOffsetMs}ms • Base Deg: +{spec.baseDegMsPerLap}ms/L • Cliff at Lap {spec.cliffLap}
              </div>
            );
          })}
        </div>
        <p className="physics-disclaimer telemetry">
          Fuel burn weight benefit calculated at -35 ms/lap. Safety Car stops benefit from ~45% reduced pit-lane transit time loss. 100% client-side Web Worker execution.
        </p>
      </footer>
    </div>
  );
};
