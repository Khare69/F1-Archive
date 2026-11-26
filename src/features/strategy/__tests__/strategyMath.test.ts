import { describe, it, expect } from 'vitest';
import {
  createMulberry32,
  sanitizeStrategyParams,
  computeStintLapTime,
  runMonteCarloStrategies,
  DEFAULT_STRATEGY_PARAMS,
} from '../strategyMath';

describe('strategyMath pure deterministic engine', () => {
  describe('createMulberry32 PRNG', () => {
    it('produces identical pseudo-random sequence for identical seeds', () => {
      const rng1 = createMulberry32(2026);
      const rng2 = createMulberry32(2026);

      const seq1 = Array.from({ length: 50 }, () => rng1());
      const seq2 = Array.from({ length: 50 }, () => rng2());

      expect(seq1).toEqual(seq2);
    });

    it('produces different pseudo-random sequences for distinct seeds', () => {
      const rngA = createMulberry32(101);
      const rngB = createMulberry32(202);

      const seqA = Array.from({ length: 20 }, () => rngA());
      const seqB = Array.from({ length: 20 }, () => rngB());

      expect(seqA).not.toEqual(seqB);
    });

    it('generates values strictly in [0, 1)', () => {
      const rng = createMulberry32(42);
      for (let i = 0; i < 500; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('sanitizeStrategyParams', () => {
    it('returns default params when passed undefined or empty object', () => {
      const params = sanitizeStrategyParams({});
      expect(params).toEqual(DEFAULT_STRATEGY_PARAMS);
    });

    it('clamps negative or NaN values safely into physical bounds', () => {
      const sanitized = sanitizeStrategyParams({
        totalLaps: NaN,
        baseLapTimeSec: -99,
        pitLossSec: 999,
        fuelPenaltyPerLapSec: -0.5,
        softDegPerLapSec: 5.0,
        mediumDegPerLapSec: NaN,
        hardDegPerLapSec: -1,
        safetyCarProbPct: 250,
        iterations: 999999,
        seed: NaN,
      });

      expect(sanitized.totalLaps).toBe(DEFAULT_STRATEGY_PARAMS.totalLaps);
      expect(sanitized.baseLapTimeSec).toBe(55); // clamped min
      expect(sanitized.pitLossSec).toBe(35); // clamped max
      expect(sanitized.fuelPenaltyPerLapSec).toBe(0); // clamped min
      expect(sanitized.softDegPerLapSec).toBe(0.5); // clamped max
      expect(sanitized.mediumDegPerLapSec).toBe(DEFAULT_STRATEGY_PARAMS.mediumDegPerLapSec);
      expect(sanitized.hardDegPerLapSec).toBe(0.002); // clamped min
      expect(sanitized.safetyCarProbPct).toBe(100); // clamped max
      expect(sanitized.iterations).toBe(5000); // clamped max
      expect(sanitized.seed).toBe(DEFAULT_STRATEGY_PARAMS.seed);
    });
  });

  describe('computeStintLapTime', () => {
    it('applies compound offsets correctly on fresh tyres (lap 1)', () => {
      const baseParams = { ...DEFAULT_STRATEGY_PARAMS, baseLapTimeSec: 90 };
      const softTime = computeStintLapTime(1, 1, 50, 'SOFT', baseParams);
      const medTime = computeStintLapTime(1, 1, 50, 'MEDIUM', baseParams);
      const hardTime = computeStintLapTime(1, 1, 50, 'HARD', baseParams);

      expect(softTime).toBe(89.2); // 90 - 0.8
      expect(medTime).toBe(90.0); // 90 + 0.0
      expect(hardTime).toBe(90.65); // 90 + 0.65
      expect(softTime).toBeLessThan(medTime);
      expect(medTime).toBeLessThan(hardTime);
    });

    it('demonstrates degradation with lap count in stint', () => {
      const params = { ...DEFAULT_STRATEGY_PARAMS, baseLapTimeSec: 90 };
      const lap1 = computeStintLapTime(1, 1, 50, 'MEDIUM', params);
      const lap10 = computeStintLapTime(10, 10, 50, 'MEDIUM', params);
      const lap20 = computeStintLapTime(20, 20, 50, 'MEDIUM', params);

      // Even with fuel burn, medium tyre degradation over 20 laps should make lap 20 slower
      expect(lap20).toBeGreaterThan(lap1);
    });

    it('demonstrates fuel burn benefit as race progress increases with zero degradation', () => {
      const params = {
        ...DEFAULT_STRATEGY_PARAMS,
        baseLapTimeSec: 90,
        fuelPenaltyPerLapSec: 0.05,
        mediumDegPerLapSec: 0,
      };
      const lap1 = computeStintLapTime(1, 1, 50, 'MEDIUM', params);
      const lap20 = computeStintLapTime(1, 20, 50, 'MEDIUM', params);

      // With 0 tyre degradation, fresh tyre at race lap 20 is lighter and faster than at race lap 1
      expect(lap20).toBeLessThan(lap1);
    });
  });

  describe('runMonteCarloStrategies', () => {
    it('is 100% deterministic with identical seed', () => {
      const run1 = runMonteCarloStrategies({ seed: 2026, iterations: 300 });
      const run2 = runMonteCarloStrategies({ seed: 2026, iterations: 300 });

      expect(run1.winningStrategyId).toBe(run2.winningStrategyId);
      expect(run1.strategies).toEqual(run2.strategies);
      expect(run1.seed).toBe(run2.seed);
    });

    it('shows physics monotonicity: increasing pit loss penalizes 2-stop vs 1-stop', () => {
      const lowPitLoss = runMonteCarloStrategies({
        seed: 42,
        iterations: 500,
        pitLossSec: 16.0,
      });

      const highPitLoss = runMonteCarloStrategies({
        seed: 42,
        iterations: 500,
        pitLossSec: 32.0,
      });

      const twoStopLow = lowPitLoss.strategies.find((s) => s.stops === 2)!;
      const oneStopLow = lowPitLoss.strategies.find((s) => s.stops === 1)!;
      const twoStopHigh = highPitLoss.strategies.find((s) => s.stops === 2)!;
      const oneStopHigh = highPitLoss.strategies.find((s) => s.stops === 1)!;

      const lowDelta = twoStopLow.baseTotalTimeSec - oneStopLow.baseTotalTimeSec;
      const highDelta = twoStopHigh.baseTotalTimeSec - oneStopHigh.baseTotalTimeSec;

      // Higher pit loss adds 1 additional pit loss to 2-stop, so highDelta must be significantly larger
      expect(highDelta).toBeGreaterThan(lowDelta);
    });

    it('shows physics monotonicity: higher soft degradation penalizes soft-heavy strategy', () => {
      const lowDeg = runMonteCarloStrategies({
        seed: 42,
        iterations: 400,
        softDegPerLapSec: 0.03,
      });

      const highDeg = runMonteCarloStrategies({
        seed: 42,
        iterations: 400,
        softDegPerLapSec: 0.40,
      });

      const softHeavyLow = lowDeg.strategies.find((s) => s.id === 'strat-2stop-s-m-s')!;
      const softHeavyHigh = highDeg.strategies.find((s) => s.id === 'strat-2stop-s-m-s')!;

      expect(softHeavyHigh.baseTotalTimeSec).toBeGreaterThan(softHeavyLow.baseTotalTimeSec);
    });

    it('guarantees strategy win rates sum strictly to 100%', () => {
      const sim = runMonteCarloStrategies({ seed: 777, iterations: 600 });
      const sum = sim.strategies.reduce((acc, s) => acc + s.winRatePct, 0);
      expect(Math.round(sum)).toBe(100);
    });

    it('safely handles extreme inputs without throwing or producing NaN', () => {
      const sim = runMonteCarloStrategies({
        totalLaps: NaN,
        baseLapTimeSec: -50,
        iterations: 999999,
        pitLossSec: Infinity,
      });

      expect(sim.strategies.length).toBeGreaterThan(0);
      for (const strat of sim.strategies) {
        expect(Number.isFinite(strat.baseTotalTimeSec)).toBe(true);
        expect(Number.isFinite(strat.p10Sec)).toBe(true);
        expect(Number.isFinite(strat.p50Sec)).toBe(true);
        expect(Number.isFinite(strat.p90Sec)).toBe(true);
        expect(Number.isNaN(strat.winRatePct)).toBe(false);
      }
    });
  });
});
