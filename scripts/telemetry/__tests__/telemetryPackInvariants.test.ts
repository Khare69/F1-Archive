import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  TelemetryPackSchema,
  TelemetryCatalogSchema,
  StrategyPackSanitySchema,
} from '../../../src/features/telemetry/telemetryPackSchema';
import {
  normalizeDistanceSeries,
  resampleTelemetryChannel,
  computeDeltaTimeSeries,
  inferPackProvenance,
  type NormalizedTelemetrySample,
} from '../../../src/features/telemetry/telemetryMath';

describe('Telemetry Mathematics & Domain Invariants', () => {
  describe('normalizeDistanceSeries', () => {
    it('handles empty and single-element inputs without throwing', () => {
      expect(normalizeDistanceSeries([])).toEqual([]);
      expect(normalizeDistanceSeries([4200])).toEqual([0]);
    });

    it('normalizes monotonic distance sequences to strictly [0, 1]', () => {
      const distances = [0, 1000, 2500, 5000];
      const norm = normalizeDistanceSeries(distances);
      expect(norm[0]).toBe(0);
      expect(norm[norm.length - 1]).toBe(1);
      for (let i = 1; i < norm.length; i++) {
        expect(norm[i]).toBeGreaterThanOrEqual(norm[i - 1]);
        expect(norm[i]).toBeLessThanOrEqual(1);
      }
    });

    it('safely handles flat/zero span arrays without NaN or Infinity', () => {
      const flat = [100, 100, 100];
      const norm = normalizeDistanceSeries(flat);
      expect(norm).toEqual([0, 0, 0]);
      expect(norm.some((n) => Number.isNaN(n) || !Number.isFinite(n))).toBe(false);
    });
  });

  describe('resampleTelemetryChannel', () => {
    const mockSamples: NormalizedTelemetrySample[] = [
      {
        distNorm: 0,
        timeSec: 0,
        speedKmh: 310,
        throttlePct: 100,
        brakePct: 0,
        gear: 7,
        drs: true,
      },
      {
        distNorm: 0.5,
        timeSec: 40,
        speedKmh: 120,
        throttlePct: 0,
        brakePct: 90,
        gear: 3,
        drs: false,
      },
      {
        distNorm: 1,
        timeSec: 80,
        speedKmh: 330,
        throttlePct: 100,
        brakePct: 0,
        gear: 8,
        drs: true,
      },
    ];

    it('resamples to requested target count with strictly increasing distNorm', () => {
      const targetCount = 100;
      const resampled = resampleTelemetryChannel(mockSamples, targetCount);
      expect(resampled.length).toBe(targetCount);
      expect(resampled[0].distNorm).toBe(0);
      expect(resampled[targetCount - 1].distNorm).toBe(1);

      for (let i = 1; i < resampled.length; i++) {
        expect(resampled[i].distNorm).toBeGreaterThan(resampled[i - 1].distNorm);
        expect(resampled[i].speedKmh).toBeGreaterThanOrEqual(0);
        expect(resampled[i].speedKmh).toBeLessThanOrEqual(390);
        expect(resampled[i].throttlePct).toBeGreaterThanOrEqual(0);
        expect(resampled[i].throttlePct).toBeLessThanOrEqual(100);
        expect(resampled[i].brakePct).toBeGreaterThanOrEqual(0);
        expect(resampled[i].brakePct).toBeLessThanOrEqual(100);
        expect(resampled[i].gear).toBeGreaterThanOrEqual(0);
        expect(resampled[i].gear).toBeLessThanOrEqual(8);
      }
    });

    it('guards empty and 1-sample arrays without throwing', () => {
      expect(resampleTelemetryChannel([], 50)).toEqual([]);
      const single = resampleTelemetryChannel([mockSamples[0]], 5);
      expect(single.length).toBe(5);
      expect(single.every((s) => s.speedKmh === 310)).toBe(true);
    });
  });

  describe('computeDeltaTimeSeries', () => {
    it('computes identical laps as strictly zero deltas', () => {
      const lapA: NormalizedTelemetrySample[] = [
        { distNorm: 0, timeSec: 0, speedKmh: 300, throttlePct: 100, brakePct: 0, gear: 7 },
        { distNorm: 0.5, timeSec: 40, speedKmh: 200, throttlePct: 50, brakePct: 0, gear: 5 },
        { distNorm: 1, timeSec: 80, speedKmh: 320, throttlePct: 100, brakePct: 0, gear: 8 },
      ];
      const deltas = computeDeltaTimeSeries(lapA, lapA);
      expect(deltas).toEqual([0, 0, 0]);
    });

    it('signed convention: negative delta means Driver A is faster (ahead in time)', () => {
      const fasterDriverA: NormalizedTelemetrySample[] = [
        { distNorm: 0, timeSec: 0, speedKmh: 300, throttlePct: 100, brakePct: 0, gear: 7 },
        { distNorm: 0.5, timeSec: 39.5, speedKmh: 200, throttlePct: 50, brakePct: 0, gear: 5 },
        { distNorm: 1, timeSec: 79.2, speedKmh: 320, throttlePct: 100, brakePct: 0, gear: 8 },
      ];
      const slowerDriverB: NormalizedTelemetrySample[] = [
        { distNorm: 0, timeSec: 0, speedKmh: 300, throttlePct: 100, brakePct: 0, gear: 7 },
        { distNorm: 0.5, timeSec: 40.0, speedKmh: 200, throttlePct: 50, brakePct: 0, gear: 5 },
        { distNorm: 1, timeSec: 80.0, speedKmh: 320, throttlePct: 100, brakePct: 0, gear: 8 },
      ];

      const deltas = computeDeltaTimeSeries(fasterDriverA, slowerDriverB);
      expect(deltas[1]).toBe(-0.5);
      expect(deltas[2]).toBe(-0.8);
    });

    it('handles empty inputs safely', () => {
      expect(computeDeltaTimeSeries([], [])).toEqual([]);
    });
  });

  describe('inferPackProvenance', () => {
    it('flags simulation and 2026 packs as experimental_simulation', () => {
      expect(inferPackProvenance('madrid-2026-sim-alo-vs-sai')).toBe('experimental_simulation');
      expect(inferPackProvenance('silverstone-2026-sim')).toBe('experimental_simulation');
      expect(inferPackProvenance('monza-simulation')).toBe('experimental_simulation');
    });

    it('identifies historical verified packs', () => {
      expect(inferPackProvenance('silverstone-2024-ham-vs-ver')).toBe('historical_verified');
      expect(inferPackProvenance('monaco-2024-lec-vs-pia')).toBe('historical_verified');
      expect(inferPackProvenance('spa-2024-ver-vs-nor')).toBe('historical_verified');
    });

    it('identifies live openf1 telemetry', () => {
      expect(inferPackProvenance('live-session-bahrain-2024')).toBe('live_openf1');
      expect(inferPackProvenance('openf1-qualifying-monza')).toBe('live_openf1');
    });
  });
});

describe('Real Disk Telemetry Audit (Partitioned Validation)', () => {
  const telemetryDir = path.resolve(process.cwd(), 'public/data/telemetry');

  it('directory exists and contains telemetry files', () => {
    expect(fs.existsSync(telemetryDir)).toBe(true);
    const files = fs.readdirSync(telemetryDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it('validates index.json against TelemetryCatalogSchema', () => {
    const indexPath = path.join(telemetryDir, 'index.json');
    expect(fs.existsSync(indexPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const parsed = TelemetryCatalogSchema.safeParse(content);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error(`index.json validation failed: ${parsed.error.message}`);
    }

    const madridItem = parsed.data.find((item) => item.slug.includes('madrid-2026'));
    expect(madridItem).toBeDefined();
    expect(madridItem?.provenance).toBe('experimental_simulation');
  });

  it('validates every showdown pack against TelemetryPackSchema', () => {
    const files = fs
      .readdirSync(telemetryDir)
      .filter(
        (f) =>
          f.endsWith('.json') &&
          f !== 'index.json' &&
          !f.startsWith('strategy-')
      );

    expect(files.length).toBe(6);

    for (const file of files) {
      const fullPath = path.join(telemetryDir, file);
      const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const parsed = TelemetryPackSchema.safeParse(raw);

      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        throw new Error(`Validation failed for pack ${file}: ${parsed.error.message}`);
      }

      const pack = parsed.data;
      expect(pack.driverA.samples.length).toBeGreaterThanOrEqual(150);
      expect(pack.driverB.samples.length).toBeGreaterThanOrEqual(150);
      expect(pack.driverA.topSpeed).toBeLessThanOrEqual(390);
      expect(pack.driverB.topSpeed).toBeLessThanOrEqual(390);

      // Verify zero NaN / Infinity
      for (const s of pack.driverA.samples) {
        expect(Number.isFinite(s.speed)).toBe(true);
        expect(Number.isFinite(s.elapsedTime)).toBe(true);
        expect(Number.isFinite(s.distanceFraction)).toBe(true);
        expect(s.speed).toBeLessThanOrEqual(390);
      }

      if (file.includes('madrid-2026-sim')) {
        expect(pack.provenance).toBe('experimental_simulation');
      } else {
        expect(pack.provenance).toBe('historical_verified');
      }
    }
  });

  it('validates every strategy-*.json file against StrategyPackSanitySchema', () => {
    const strategyFiles = fs
      .readdirSync(telemetryDir)
      .filter((f) => f.startsWith('strategy-') && f.endsWith('.json'));

    expect(strategyFiles.length).toBe(6);

    for (const file of strategyFiles) {
      const fullPath = path.join(telemetryDir, file);
      const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const parsed = StrategyPackSanitySchema.safeParse(raw);

      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        throw new Error(`Validation failed for strategy file ${file}: ${parsed.error.message}`);
      }

      expect(parsed.data.totalLaps).toBeGreaterThan(0);
      expect(parsed.data.sessionFastestLap).toBeGreaterThan(0);
      expect(parsed.data.stints.length).toBeGreaterThanOrEqual(1);
    }
  });
});
