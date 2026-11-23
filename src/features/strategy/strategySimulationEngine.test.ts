import { describe, it, expect, vi } from 'vitest';
import {
  runStrategySimulation,
  calculateLapPace,
  formatLapTimeMs,
  formatRaceTimeMs,
  TYRE_COMPOUND_SPECS,
  type SimulationConfig
} from './strategySimulationEngine';

describe('Monte Carlo Strategy Simulation Engine', () => {
  it('formats lap times and race times into standard telemetry strings', () => {
    expect(formatLapTimeMs(84325)).toBe('1:24.325');
    expect(formatLapTimeMs(65000)).toBe('1:05.000');
    expect(formatRaceTimeMs(5400123)).toBe('1:30:00.123');
  });

  it('demonstrates fresh tyre compound pace hierarchy: Soft < Medium < Hard', () => {
    const basePace = 90000;
    const softPace = calculateLapPace(basePace, 'soft', 0, 1, 0);
    const mediumPace = calculateLapPace(basePace, 'medium', 0, 1, 0);
    const hardPace = calculateLapPace(basePace, 'hard', 0, 1, 0);

    expect(softPace).toBeLessThan(mediumPace);
    expect(mediumPace).toBeLessThan(hardPace);
    expect(softPace).toBe(basePace + TYRE_COMPOUND_SPECS.soft.paceOffsetMs);
  });

  it('calculates non-linear tyre cliff degradation beyond cliffLap', () => {
    const basePace = 90000;
    const softCliff = TYRE_COMPOUND_SPECS.soft.cliffLap; // 16 laps

    const lapBeforeCliff = calculateLapPace(basePace, 'soft', softCliff - 1, 15, 0);
    const lapAtCliff = calculateLapPace(basePace, 'soft', softCliff, 16, 0);
    const lapPastCliff1 = calculateLapPace(basePace, 'soft', softCliff + 3, 19, 0);
    const lapPastCliff2 = calculateLapPace(basePace, 'soft', softCliff + 6, 22, 0);

    const normalDegDelta = lapAtCliff - lapBeforeCliff;
    const cliffDelta = lapPastCliff2 - lapPastCliff1;

    // Beyond the cliff, degradation rate accelerates dramatically
    expect(cliffDelta).toBeGreaterThan(normalDegDelta * 2);
  });

  it('accounts for fuel burn advantage as race progresses', () => {
    const basePace = 90000;
    const fuelBurn = -35; // -35 ms per lap

    const lap1 = calculateLapPace(basePace, 'hard', 5, 5, fuelBurn);
    const lap40 = calculateLapPace(basePace, 'hard', 5, 40, fuelBurn);

    // Same tyre age (5 laps), but on lap 40 the car is 35 laps lighter in fuel
    expect(lap40).toBeLessThan(lap1);
    expect(lap1 - lap40).toBe(35 * 35);
  });

  it('is 100% deterministic when supplied with Mulberry32 seed', () => {
    const config: SimulationConfig = {
      circuitName: 'Silverstone',
      totalLaps: 52,
      baseLapTimeMs: 88000,
      iterations: 200,
      seed: 42,
      strategies: [
        {
          id: 'one-stop',
          name: '1-Stop M->H',
          color: '#FFD700',
          stints: [
            { compound: 'medium', laps: 24 },
            { compound: 'hard', laps: 28 }
          ]
        },
        {
          id: 'two-stop',
          name: '2-Stop S->M->S',
          color: '#FF1E1E',
          stints: [
            { compound: 'soft', laps: 16 },
            { compound: 'medium', laps: 20 },
            { compound: 'soft', laps: 16 }
          ]
        }
      ]
    };

    const runA = runStrategySimulation(config);
    const runB = runStrategySimulation(config);

    expect(runA.winningStrategyId).toBe(runB.winningStrategyId);
    expect(runA.results[0].totalTimeMs).toBe(runB.results[0].totalTimeMs);
    expect(runA.results[0].winRatePct).toBe(runB.results[0].winRatePct);
  });

  it('normalizes win rates to strictly sum to 100%', () => {
    const config: SimulationConfig = {
      circuitName: 'Monza',
      totalLaps: 53,
      baseLapTimeMs: 82000,
      iterations: 300,
      seed: 12345,
      strategies: [
        {
          id: 'strat-a',
          name: 'Strat A',
          color: '#00D2FF',
          stints: [{ compound: 'soft', laps: 20 }, { compound: 'hard', laps: 33 }]
        },
        {
          id: 'strat-b',
          name: 'Strat B',
          color: '#FFD700',
          stints: [{ compound: 'medium', laps: 26 }, { compound: 'hard', laps: 27 }]
        },
        {
          id: 'strat-c',
          name: 'Strat C',
          color: '#FF1E1E',
          stints: [{ compound: 'soft', laps: 18 }, { compound: 'medium', laps: 18 }, { compound: 'soft', laps: 17 }]
        }
      ]
    };

    const out = runStrategySimulation(config);
    const winRateSum = out.results.reduce((acc, r) => acc + r.winRatePct, 0);
    expect(winRateSum).toBe(100);
  });

  it('triggers progress callbacks up to 100%', () => {
    const progressSpy = vi.fn();
    const config: SimulationConfig = {
      circuitName: 'Spa',
      totalLaps: 44,
      baseLapTimeMs: 104000,
      iterations: 100,
      seed: 99,
      strategies: [
        {
          id: 'm-h',
          name: 'M-H',
          color: '#FFD700',
          stints: [{ compound: 'medium', laps: 20 }, { compound: 'hard', laps: 24 }]
        }
      ]
    };

    runStrategySimulation(config, progressSpy);
    expect(progressSpy).toHaveBeenCalled();
    expect(progressSpy).toHaveBeenLastCalledWith(100);
  });
});
