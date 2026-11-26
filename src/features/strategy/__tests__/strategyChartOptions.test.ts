import { describe, it, expect } from 'vitest';
import {
  buildStintPaceOptions,
  buildMonteCarloDistributionOptions,
} from '../strategyChartOptions';
import { runMonteCarloStrategies } from '../strategyMath';

describe('strategyChartOptions', () => {
  const mockResult = runMonteCarloStrategies({
    totalLaps: 52,
    baseLapTimeSec: 88.5,
    seed: 2026,
    iterations: 200,
  });

  describe('buildStintPaceOptions', () => {
    it('creates line series for all strategies with non-empty pace data', () => {
      const options = buildStintPaceOptions(mockResult);

      expect(options.series).toBeDefined();
      const series = options.series as Array<{
        name: string;
        type: string;
        data: number[];
        lineStyle?: { color?: string };
      }>;

      expect(series.length).toBe(mockResult.strategies.length);
      for (const s of series) {
        expect(s.type).toBe('line');
        expect(s.data.length).toBe(52);
        for (const pt of s.data) {
          expect(Number.isFinite(pt)).toBe(true);
          expect(Number.isNaN(pt)).toBe(false);
        }
      }
    });

    it('returns empty placeholder option when strategies array is empty', () => {
      const emptyOptions = buildStintPaceOptions({
        strategies: [],
        winningStrategyId: '',
        iterations: 0,
        seed: 0,
        computeTimeMs: 0,
      });

      expect(emptyOptions.title).toBeDefined();
    });
  });

  describe('buildMonteCarloDistributionOptions', () => {
    it('creates bar series representing win percentages summing to 100%', () => {
      const options = buildMonteCarloDistributionOptions(mockResult);

      expect(options.series).toBeDefined();
      const series = (options.series as Array<{ data: Array<{ value: number }> }>)[0];
      expect(series).toBeDefined();

      const sum = series.data.reduce((acc, item) => acc + item.value, 0);
      expect(Math.round(sum)).toBe(100);
    });

    it('returns empty placeholder when result is missing strategies', () => {
      const emptyOptions = buildMonteCarloDistributionOptions({
        strategies: [],
        winningStrategyId: '',
        iterations: 0,
        seed: 0,
        computeTimeMs: 0,
      });

      expect(emptyOptions.title).toBeDefined();
    });
  });
});
