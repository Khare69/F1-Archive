/**
 * F1 Archive — Monte Carlo Pit-Wall Strategy & Undercut Simulation Engine
 * Pure, deterministic, seedable mathematical physics model for race strategy analytics.
 */

export type TyreCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';

export interface TyreCompoundSpecs {
  name: string;
  paceOffsetMs: number;       // Base pace delta relative to Medium (0 ms)
  baseDegMsPerLap: number;    // Linear tyre degradation per lap
  cliffLap: number;           // Lap at which steep non-linear degradation kicks in
  cliffExponent: number;      // Power coefficient for degradation beyond cliff
  cliffScaleMs: number;       // Multiplier for cliff degradation
  color: string;
}

export const TYRE_COMPOUND_SPECS: Record<TyreCompound, TyreCompoundSpecs> = {
  soft: {
    name: 'Soft (C4/C5)',
    paceOffsetMs: -800,       // 0.8s faster fresh pace
    baseDegMsPerLap: 95,
    cliffLap: 16,
    cliffExponent: 1.85,
    cliffScaleMs: 45,
    color: '#FF1E1E'          // Red
  },
  medium: {
    name: 'Medium (C3)',
    paceOffsetMs: 0,          // Baseline
    baseDegMsPerLap: 55,
    cliffLap: 27,
    cliffExponent: 1.75,
    cliffScaleMs: 38,
    color: '#FFD700'          // Yellow
  },
  hard: {
    name: 'Hard (C1/C2)',
    paceOffsetMs: 650,        // 0.65s slower fresh pace
    baseDegMsPerLap: 32,
    cliffLap: 40,
    cliffExponent: 1.65,
    cliffScaleMs: 30,
    color: '#FFFFFF'          // White
  },
  intermediate: {
    name: 'Intermediate',
    paceOffsetMs: 3200,
    baseDegMsPerLap: 70,
    cliffLap: 22,
    cliffExponent: 1.7,
    cliffScaleMs: 40,
    color: '#00E701'          // Green
  },
  wet: {
    name: 'Full Wet',
    paceOffsetMs: 6500,
    baseDegMsPerLap: 60,
    cliffLap: 30,
    cliffExponent: 1.6,
    cliffScaleMs: 35,
    color: '#00D2FF'          // Blue
  }
};

export interface StrategyStint {
  compound: TyreCompound;
  laps: number;
}

export interface StrategyPlan {
  id: string;
  name: string;
  color: string;
  stints: StrategyStint[];
}

export interface SimulationConfig {
  circuitName: string;
  totalLaps: number;
  baseLapTimeMs: number;      // Median qualifying-pace lap time in ms
  fuelBurnMsPerLap?: number;  // Lap time reduction as car lightens (default: -35 ms/lap)
  greenPitLossMs?: number;    // Pit lane time loss under green flag (default: 21,500 ms)
  scPitLossMs?: number;       // Pit lane time loss under Safety Car / VSC (default: 11,800 ms)
  safetyCarProbability?: number; // Probability of Safety Car during race (0.0 to 1.0)
  vscProbability?: number;    // Probability of VSC during race (0.0 to 1.0)
  driverPaceVarianceMs?: number; // Random lap-to-lap pace deviation (+/- ms, default: 120 ms)
  iterations?: number;        // Monte Carlo permutations (default: 5,000)
  seed?: number;              // Seed for deterministic testing
  strategies: StrategyPlan[];
}

export interface StrategySimulationResult {
  id: string;
  name: string;
  color: string;
  stintsSummary: string;
  totalTimeMs: number;
  totalTimeFormatted: string;
  winRatePct: number;          // Guaranteed to sum to 100% across all strategies
  fastestLapMs: number;
  fastestLapFormatted: string;
  lapByLapPaceMs: number[];    // Representative deterministic lap chart
  p50PaceMs: number;
  p90PaceMs: number;
  gapToLeaderMs: number;
}

export interface SimulationOutput {
  results: StrategySimulationResult[];
  totalIterations: number;
  executionTimeMs: number;
  winningStrategyId: string;
  safetyCarLapsEncountered: number;
}

/**
 * Deterministic seedable 32-bit PRNG (Mulberry32)
 */
export function createMulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Format milliseconds into M:SS.sss
 */
export function formatLapTimeMs(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '0:00.000';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const paddedSec = remainingSeconds < 10 ? `0${remainingSeconds.toFixed(3)}` : remainingSeconds.toFixed(3);
  return `${minutes}:${paddedSec}`;
}

/**
 * Format total race time in H:MM:SS.sss
 */
export function formatRaceTimeMs(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '0:00:00.000';
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number, width: number = 2) => String(Math.floor(n)).padStart(width, '0');
  const secStr = seconds < 10 ? `0${seconds.toFixed(3)}` : seconds.toFixed(3);
  return `${hours}:${pad(minutes)}:${secStr}`;
}

/**
 * Calculate the pace for a single lap under given fuel, tyre age, and compound conditions
 */
export function calculateLapPace(
  baseLapTimeMs: number,
  compound: TyreCompound,
  tyreAgeLaps: number,
  currentLap: number,
  fuelBurnMsPerLap: number
): number {
  const specs = TYRE_COMPOUND_SPECS[compound] || TYRE_COMPOUND_SPECS.medium;

  // 1. Fresh tyre compound offset
  const compoundOffset = specs.paceOffsetMs;

  // 2. Fuel burn benefit (as race progresses, fuel weight reduces lap time)
  const fuelDelta = currentLap * fuelBurnMsPerLap;

  // 3. Linear tyre degradation
  const linearDeg = tyreAgeLaps * specs.baseDegMsPerLap;

  // 4. Non-linear cliff degradation
  let cliffDeg = 0;
  if (tyreAgeLaps > specs.cliffLap) {
    const lapsOverCliff = tyreAgeLaps - specs.cliffLap;
    cliffDeg = Math.pow(lapsOverCliff, specs.cliffExponent) * specs.cliffScaleMs;
  }

  return baseLapTimeMs + compoundOffset + fuelDelta + linearDeg + cliffDeg;
}

/**
 * Pure Monte Carlo simulation runner with zero external dependencies
 */
export function runStrategySimulation(
  config: SimulationConfig,
  onProgress?: (progress: number) => void
): SimulationOutput {
  const startTime = Date.now();
  const iterations = Math.max(10, config.iterations || 5000);
  const totalLaps = config.totalLaps;
  const baseLapTimeMs = config.baseLapTimeMs;
  const fuelBurnMsPerLap = config.fuelBurnMsPerLap ?? -35;
  const greenPitLossMs = config.greenPitLossMs ?? 21500;
  const scPitLossMs = config.scPitLossMs ?? 11800;
  const scProb = config.safetyCarProbability ?? 0.35;
  const vscProb = config.vscProbability ?? 0.25;
  const varianceSpan = config.driverPaceVarianceMs ?? 120;

  // PRNG initialization
  const prng = config.seed !== undefined ? createMulberry32(config.seed) : Math.random;

  // Validate strategies
  const strategies = config.strategies.length > 0
    ? config.strategies
    : [
        {
          id: 'one-stop-m-h',
          name: '1-Stop Medium -> Hard',
          color: '#FFD700',
          stints: [
            { compound: 'medium' as TyreCompound, laps: Math.round(totalLaps * 0.45) },
            { compound: 'hard' as TyreCompound, laps: totalLaps - Math.round(totalLaps * 0.45) }
          ]
        },
        {
          id: 'two-stop-s-m-s',
          name: '2-Stop Soft -> Medium -> Soft',
          color: '#FF1E1E',
          stints: [
            { compound: 'soft' as TyreCompound, laps: Math.round(totalLaps * 0.3) },
            { compound: 'medium' as TyreCompound, laps: Math.round(totalLaps * 0.4) },
            { compound: 'soft' as TyreCompound, laps: totalLaps - Math.round(totalLaps * 0.7) }
          ]
        }
      ];

  // Tracking accumulators
  const stratStats: Record<string, {
    totalRaceTimes: number[];
    winCount: number;
    fastestLap: number;
    deterministicLaps: number[];
  }> = {};

  strategies.forEach((strat) => {
    stratStats[strat.id] = {
      totalRaceTimes: [],
      winCount: 0,
      fastestLap: Infinity,
      deterministicLaps: []
    };
  });

  // 1. Compute deterministic representative lap profile for each strategy
  strategies.forEach((strat) => {
    let lapCounter = 1;
    strat.stints.forEach((stint, stintIdx) => {
      for (let age = 0; age < stint.laps && lapCounter <= totalLaps; age++) {
        let pace = calculateLapPace(baseLapTimeMs, stint.compound, age, lapCounter, fuelBurnMsPerLap);
        // Add pit in-lap / out-lap delta if pit stop occurs
        if (stintIdx > 0 && age === 0) {
          pace += greenPitLossMs;
        }
        stratStats[strat.id].deterministicLaps.push(pace);
        lapCounter++;
      }
    });
  });

  // 2. Monte Carlo Iterations
  let totalScEvents = 0;
  const progressInterval = Math.max(1, Math.floor(iterations / 20));

  for (let iter = 0; iter < iterations; iter++) {
    // Determine if safety car / VSC occurs this race and on which lap
    const hasSC = prng() < scProb;
    const scLap = hasSC ? Math.floor(prng() * (totalLaps - 10)) + 5 : -1;
    if (hasSC) totalScEvents++;

    const hasVSC = !hasSC && prng() < vscProb;
    const vscLap = hasVSC ? Math.floor(prng() * (totalLaps - 10)) + 5 : -1;

    let bestIterTime = Infinity;
    let winningStratId = strategies[0].id;

    strategies.forEach((strat) => {
      let currentRaceTime = 0;
      let lapNum = 1;

      strat.stints.forEach((stint, stintIdx) => {
        for (let age = 0; age < stint.laps && lapNum <= totalLaps; age++) {
          let lapPace = calculateLapPace(baseLapTimeMs, stint.compound, age, lapNum, fuelBurnMsPerLap);

          // Stochastic variance: Gaussian-approximate sum of uniforms
          const randVariance = ((prng() + prng() + prng() - 1.5) / 1.5) * varianceSpan;
          lapPace += randVariance;

          // Pit Stop handling
          if (stintIdx > 0 && age === 0) {
            // Check if pit stop coincides with SC or VSC (undercut / cheap pitstop)
            const isScActive = hasSC && Math.abs(lapNum - scLap) <= 2;
            const isVscActive = hasVSC && Math.abs(lapNum - vscLap) <= 1;
            const effectiveLoss = (isScActive || isVscActive) ? scPitLossMs : greenPitLossMs;
            lapPace += effectiveLoss;
          }

          if (lapPace < stratStats[strat.id].fastestLap) {
            stratStats[strat.id].fastestLap = Math.round(lapPace);
          }

          currentRaceTime += lapPace;
          lapNum++;
        }
      });

      stratStats[strat.id].totalRaceTimes.push(currentRaceTime);

      if (currentRaceTime < bestIterTime) {
        bestIterTime = currentRaceTime;
        winningStratId = strat.id;
      }
    });

    stratStats[winningStratId].winCount++;

    if (onProgress && (iter + 1) % progressInterval === 0) {
      onProgress(Math.min(99, Math.round(((iter + 1) / iterations) * 100)));
    }
  }

  // Final 100% progress notification
  if (onProgress) onProgress(100);

  // 3. Compile, sort, and normalize results
  // Compute normalized win rates summing cleanly to 100%
  const rawWinPercentages = strategies.map((s) => (stratStats[s.id].winCount / iterations) * 100);
  const roundedWinRates = rawWinPercentages.map((p) => Math.round(p));
  const roundedSum = roundedWinRates.reduce((a, b) => a + b, 0);

  // Adjust largest value to resolve rounding error so sum === 100
  if (roundedSum !== 100 && roundedWinRates.length > 0) {
    const diff = 100 - roundedSum;
    let maxIdx = 0;
    for (let i = 1; i < roundedWinRates.length; i++) {
      if (rawWinPercentages[i] > rawWinPercentages[maxIdx]) maxIdx = i;
    }
    roundedWinRates[maxIdx] += diff;
  }

  const results: StrategySimulationResult[] = strategies.map((strat, idx) => {
    const stats = stratStats[strat.id];
    stats.totalRaceTimes.sort((a, b) => a - b);

    const count = stats.totalRaceTimes.length;
    const avgTime = Math.round(stats.totalRaceTimes.reduce((acc, v) => acc + v, 0) / count);
    const p50 = Math.round(stats.totalRaceTimes[Math.floor(count * 0.5)] / totalLaps);
    const p90 = Math.round(stats.totalRaceTimes[Math.floor(count * 0.9)] / totalLaps);

    const stintsSummary = strat.stints
      .map((st) => `${st.compound.toUpperCase()} (${st.laps}L)`)
      .join(' ➔ ');

    return {
      id: strat.id,
      name: strat.name,
      color: strat.color,
      stintsSummary,
      totalTimeMs: avgTime,
      totalTimeFormatted: formatRaceTimeMs(avgTime),
      winRatePct: roundedWinRates[idx],
      fastestLapMs: stats.fastestLap,
      fastestLapFormatted: formatLapTimeMs(stats.fastestLap),
      lapByLapPaceMs: stats.deterministicLaps,
      p50PaceMs: p50,
      p90PaceMs: p90,
      gapToLeaderMs: 0 // Will be set after sorting
    };
  });

  // Sort by average race time ascending
  results.sort((a, b) => a.totalTimeMs - b.totalTimeMs);

  const leaderTime = results[0]?.totalTimeMs || 0;
  results.forEach((r) => {
    r.gapToLeaderMs = Math.round(r.totalTimeMs - leaderTime);
  });

  return {
    results,
    totalIterations: iterations,
    executionTimeMs: Date.now() - startTime,
    winningStrategyId: results[0]?.id || strategies[0].id,
    safetyCarLapsEncountered: totalScEvents
  };
}
