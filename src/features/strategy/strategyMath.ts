/**
 * F1 // ARCHIVE — Pure Deterministic Strategy Mathematics Engine
 * Uses Mulberry32 seeded PRNG for 100% reproducible Monte Carlo simulations.
 * Strictly clamps inputs to physical bounds to prevent worker lockup.
 */

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD';

export interface StrategyEngineParams {
  totalLaps: number;            // clamped [10, 85]
  baseLapTimeSec: number;       // clamped [55, 130]
  pitLossSec: number;           // clamped [14, 35]
  fuelPenaltyPerLapSec: number; // clamped [0, 0.15]
  softDegPerLapSec: number;     // clamped [0.01, 0.50]
  mediumDegPerLapSec: number;   // clamped [0.005, 0.35]
  hardDegPerLapSec: number;     // clamped [0.002, 0.25]
  safetyCarProbPct: number;     // clamped [0, 100]
  iterations: number;           // clamped [100, 5000]
  seed: number;                 // uint32 deterministic PRNG seed
}

export const DEFAULT_STRATEGY_PARAMS: StrategyEngineParams = {
  totalLaps: 52,
  baseLapTimeSec: 88.5,
  pitLossSec: 21.5,
  fuelPenaltyPerLapSec: 0.035,
  softDegPerLapSec: 0.095,
  mediumDegPerLapSec: 0.055,
  hardDegPerLapSec: 0.032,
  safetyCarProbPct: 35,
  iterations: 1000,
  seed: 42,
};

export interface StrategyArchetypeResult {
  id: string;
  name: string;
  color: string;
  stintsSummary: string;
  compoundSequence: TyreCompound[];
  stops: number;
  baseTotalTimeSec: number;
  p10Sec: number;
  p50Sec: number;
  p90Sec: number;
  winRatePct: number;
  wins: number;
  lapByLapPaceSec: number[];
}

export interface StrategySimulationResult {
  strategies: StrategyArchetypeResult[];
  winningStrategyId: string;
  iterations: number;
  seed: number;
  computeTimeMs: number;
}

/**
 * Creates a fast 32-bit state deterministic PRNG generator.
 */
export function createMulberry32(seed: number): () => number {
  let a = (seed >>> 0);
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Validates and clamps input parameters to safe, realistic Formula 1 bounds.
 * Prevents NaN, Infinity, negative values, and extreme iteration counts.
 */
export function sanitizeStrategyParams(
  raw?: Partial<StrategyEngineParams>
): StrategyEngineParams {
  const clamp = (val: unknown, min: number, max: number, fallback: number): number => {
    if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val)) return fallback;
    return Math.max(min, Math.min(max, val));
  };

  const seed =
    typeof raw?.seed === 'number' && Number.isFinite(raw.seed)
      ? raw.seed >>> 0
      : DEFAULT_STRATEGY_PARAMS.seed;

  return {
    totalLaps: Math.round(clamp(raw?.totalLaps, 10, 85, DEFAULT_STRATEGY_PARAMS.totalLaps)),
    baseLapTimeSec: Number(
      clamp(raw?.baseLapTimeSec, 55, 130, DEFAULT_STRATEGY_PARAMS.baseLapTimeSec).toFixed(3)
    ),
    pitLossSec: Number(
      clamp(raw?.pitLossSec, 14, 35, DEFAULT_STRATEGY_PARAMS.pitLossSec).toFixed(3)
    ),
    fuelPenaltyPerLapSec: Number(
      clamp(
        raw?.fuelPenaltyPerLapSec,
        0,
        0.15,
        DEFAULT_STRATEGY_PARAMS.fuelPenaltyPerLapSec
      ).toFixed(4)
    ),
    softDegPerLapSec: Number(
      clamp(raw?.softDegPerLapSec, 0.01, 0.50, DEFAULT_STRATEGY_PARAMS.softDegPerLapSec).toFixed(4)
    ),
    mediumDegPerLapSec: Number(
      clamp(
        raw?.mediumDegPerLapSec,
        0.005,
        0.35,
        DEFAULT_STRATEGY_PARAMS.mediumDegPerLapSec
      ).toFixed(4)
    ),
    hardDegPerLapSec: Number(
      clamp(raw?.hardDegPerLapSec, 0.002, 0.25, DEFAULT_STRATEGY_PARAMS.hardDegPerLapSec).toFixed(4)
    ),
    safetyCarProbPct: Math.round(
      clamp(raw?.safetyCarProbPct, 0, 100, DEFAULT_STRATEGY_PARAMS.safetyCarProbPct)
    ),
    iterations: Math.round(clamp(raw?.iterations, 100, 5000, DEFAULT_STRATEGY_PARAMS.iterations)),
    seed,
  };
}

/**
 * Computes deterministic lap time for a single lap within a stint.
 * Formula: t_lap = t_base + offset_compound + deg * (stintLap - 1)^1.15 - fuelPen * (raceLap - 1)
 */
export function computeStintLapTime(
  lapInStint: number,
  raceLap: number,
  totalLaps: number,
  compound: TyreCompound | string,
  params: StrategyEngineParams
): number {
  const normCompound = String(compound).toUpperCase() as TyreCompound;
  let compoundOffset = 0;
  let degRate = params.mediumDegPerLapSec;

  if (normCompound === 'SOFT') {
    compoundOffset = -0.8; // 0.8s faster fresh pace
    degRate = params.softDegPerLapSec;
  } else if (normCompound === 'HARD') {
    compoundOffset = 0.65; // 0.65s slower fresh pace
    degRate = params.hardDegPerLapSec;
  } else {
    // MEDIUM is baseline 0.0
    compoundOffset = 0;
    degRate = params.mediumDegPerLapSec;
  }

  const lapsDegrading = Math.max(0, lapInStint - 1);
  const degradation = degRate * Math.pow(lapsDegrading, 1.15);
  // Fuel burn benefit: car gets lighter as race progresses
  const fuelRelief = params.fuelPenaltyPerLapSec * Math.max(0, raceLap - 1);

  return Number(
    (params.baseLapTimeSec + compoundOffset + degradation - fuelRelief).toFixed(3)
  );
}

interface StintConfig {
  compound: TyreCompound;
  laps: number;
}

interface StrategyBlueprint {
  id: string;
  name: string;
  color: string;
  stints: StintConfig[];
}

function buildArchetypes(totalLaps: number): StrategyBlueprint[] {
  const pit1 = Math.max(5, Math.round(totalLaps * 0.42));
  const pit2A = Math.max(4, Math.round(totalLaps * 0.28));
  const pit2B = Math.max(pit2A + 4, Math.round(totalLaps * 0.65));

  return [
    {
      id: 'strat-1stop-m-h',
      name: 'Strategy A: 1-Stop [M ➔ H]',
      color: '#FFD700', // Medium Yellow
      stints: [
        { compound: 'MEDIUM', laps: pit1 },
        { compound: 'HARD', laps: totalLaps - pit1 },
      ],
    },
    {
      id: 'strat-2stop-s-m-s',
      name: 'Strategy B: Aggressive 2-Stop [S ➔ M ➔ S]',
      color: '#EF4444', // Soft Red
      stints: [
        { compound: 'SOFT', laps: pit2A },
        { compound: 'MEDIUM', laps: pit2B - pit2A },
        { compound: 'SOFT', laps: totalLaps - pit2B },
      ],
    },
    {
      id: 'strat-1stop-h-m',
      name: 'Strategy C: Reverse 1-Stop [H ➔ M]',
      color: '#F0F0F0', // Hard White
      stints: [
        { compound: 'HARD', laps: Math.round(totalLaps * 0.58) },
        { compound: 'MEDIUM', laps: totalLaps - Math.round(totalLaps * 0.58) },
      ],
    },
  ];
}

/**
 * Runs deterministic Monte Carlo strategy simulations with Mulberry32 PRNG.
 */
export function runMonteCarloStrategies(
  rawParams: Partial<StrategyEngineParams>
): StrategySimulationResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const params = sanitizeStrategyParams(rawParams);
  const prng = createMulberry32(params.seed);
  const archetypes = buildArchetypes(params.totalLaps);

  // Pre-calculate deterministic baseline lap times for each strategy
  const deterministicPace = archetypes.map((strat) => {
    const laps: number[] = [];
    let raceLap = 1;
    for (const stint of strat.stints) {
      for (let sLap = 1; sLap <= stint.laps; sLap++) {
        const lapTime = computeStintLapTime(
          sLap,
          raceLap,
          params.totalLaps,
          stint.compound,
          params
        );
        laps.push(lapTime);
        raceLap++;
      }
    }
    const stops = strat.stints.length - 1;
    const baseTime = laps.reduce((a, b) => a + b, 0) + stops * params.pitLossSec;
    return {
      strat,
      laps,
      stops,
      baseTime: Number(baseTime.toFixed(3)),
    };
  });

  const winCounts = new Array(archetypes.length).fill(0);
  const finishTimes: number[][] = archetypes.map(() => []);

  // Per-lap probability of Safety Car / VSC deployment
  const scChancePerLap = (params.safetyCarProbPct / 100) / params.totalLaps;

  for (let iter = 0; iter < params.iterations; iter++) {
    // Determine if safety car deployed during this iteration and on which lap
    let scLap = -1;
    for (let l = 1; l <= params.totalLaps; l++) {
      if (prng() < scChancePerLap) {
        scLap = l;
        break;
      }
    }

    let minTime = Infinity;
    let winningIndex = 0;

    for (let sIdx = 0; sIdx < deterministicPace.length; sIdx++) {
      const { laps, strat } = deterministicPace[sIdx];
      let totalTime = 0;
      let currentLap = 1;

      for (let stintIdx = 0; stintIdx < strat.stints.length; stintIdx++) {
        const stint = strat.stints[stintIdx];
        for (let l = 0; l < stint.laps; l++) {
          let lapTime = laps[currentLap - 1];
          // Driver pace variance +/- 0.12s
          const variance = (prng() - 0.5) * 0.24;
          lapTime += variance;

          // If Safety Car is out on this lap, pack bunches and delta is capped
          if (currentLap === scLap) {
            lapTime += 8.5; // SC slow lap
          }
          totalTime += lapTime;
          currentLap++;
        }

        // Add pit stop loss for transitions between stints
        if (stintIdx < strat.stints.length - 1) {
          // If pitting under SC, pit loss is roughly halved (cheap stop)
          const pitLap = currentLap;
          const isScPit = scLap > 0 && Math.abs(pitLap - scLap) <= 2;
          const stopLoss = isScPit ? params.pitLossSec * 0.55 : params.pitLossSec;
          totalTime += stopLoss;
        }
      }

      finishTimes[sIdx].push(totalTime);
      if (totalTime < minTime) {
        minTime = totalTime;
        winningIndex = sIdx;
      }
    }

    winCounts[winningIndex]++;
  }

  // Compute percentiles (P10, P50, P90) and win percentages
  const results: StrategyArchetypeResult[] = deterministicPace.map((dp, sIdx) => {
    const times = finishTimes[sIdx].slice().sort((a, b) => a - b);
    const p10Idx = Math.floor(times.length * 0.1);
    const p50Idx = Math.floor(times.length * 0.5);
    const p90Idx = Math.floor(times.length * 0.9);

    const winRate = Number(((winCounts[sIdx] / params.iterations) * 100).toFixed(1));

    const compounds = dp.strat.stints.map((s) => s.compound);
    const stintsSummary = dp.strat.stints
      .map((s) => `${s.compound.charAt(0)} (${s.laps}L)`)
      .join(' ➔ ');

    return {
      id: dp.strat.id,
      name: dp.strat.name,
      color: dp.strat.color,
      stintsSummary,
      compoundSequence: compounds,
      stops: dp.stops,
      baseTotalTimeSec: dp.baseTime,
      p10Sec: Number(times[p10Idx].toFixed(2)),
      p50Sec: Number(times[p50Idx].toFixed(2)),
      p90Sec: Number(times[p90Idx].toFixed(2)),
      winRatePct: winRate,
      wins: winCounts[sIdx],
      lapByLapPaceSec: dp.laps,
    };
  });

  // Guarantee winRatePct sums strictly to 100% across all strategies
  const sumRates = results.reduce((a, b) => a + b.winRatePct, 0);
  if (results.length > 0 && Math.abs(sumRates - 100) > 0.01) {
    const diff = Number((100 - sumRates).toFixed(1));
    results[0].winRatePct = Number((results[0].winRatePct + diff).toFixed(1));
  }

  // Determine outright winner
  let highestWins = -1;
  let winnerId = results[0]?.id || '';
  for (const r of results) {
    if (r.wins > highestWins) {
      highestWins = r.wins;
      winnerId = r.id;
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    strategies: results,
    winningStrategyId: winnerId,
    iterations: params.iterations,
    seed: params.seed,
    computeTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}
