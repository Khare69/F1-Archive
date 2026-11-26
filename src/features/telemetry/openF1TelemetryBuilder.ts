import { z } from 'zod';
import { fetchValidatedJson } from '../../api/httpClient';
import { OpenF1CarDataPointSchema, UpstreamApiError } from '../../api/liveApiSchemas';
import {
  resampleTelemetryChannel,
  type NormalizedTelemetrySample,
} from './telemetryMath';
import type { ValidatedTelemetryPack } from './telemetryPackSchema';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export const OpenF1SessionSchema = z.object({
  session_key: z.coerce.number().finite(),
  session_name: z.string(),
  date_start: z.string(),
  date_end: z.string(),
  circuit_short_name: z.string().optional(),
  country_name: z.string().optional(),
  year: z.coerce.number().finite(),
});

export const OpenF1LapSchema = z.object({
  session_key: z.coerce.number().finite(),
  driver_number: z.coerce.number().finite(),
  lap_number: z.coerce.number().finite(),
  lap_duration: z.coerce.number().finite().nullable().optional(),
  date_start: z.string().nullable().optional(),
  duration_sector_1: z.coerce.number().finite().nullable().optional(),
  duration_sector_2: z.coerce.number().finite().nullable().optional(),
  duration_sector_3: z.coerce.number().finite().nullable().optional(),
  is_pit_out_lap: z.boolean().nullable().optional(),
});

export type OpenF1Session = z.infer<typeof OpenF1SessionSchema>;
export type OpenF1Lap = z.infer<typeof OpenF1LapSchema>;

/**
 * Bounded In-Memory LRU Cache strictly capped at 10 entries (never stored in localStorage/IDB)
 */
export class OpenF1TelemetryLRUCache {
  private capacity: number;
  private cache: Map<string, ValidatedTelemetryPack> = new Map();

  constructor(capacity = 10) {
    this.capacity = capacity;
  }

  get(key: string): ValidatedTelemetryPack | null {
    if (!this.cache.has(key)) return null;
    const item = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key: string, val: ValidatedTelemetryPack): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, val);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const globalOpenF1LRUCache = new OpenF1TelemetryLRUCache(10);

/**
 * Formats seconds into M:SS.sss
 */
function formatSeconds(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = (sec % 60).toFixed(3);
  return `${mins}:${rem.padStart(6, '0')}`;
}

export interface BuildComparisonOptions {
  signal?: AbortSignal;
  bypassCache?: boolean;
}

/**
 * Fetches sessions for a given year.
 */
export async function fetchOpenF1Sessions(
  year: number,
  signal?: AbortSignal
): Promise<OpenF1Session[]> {
  const url = `${OPENF1_BASE_URL}/sessions?year=${year}`;
  return fetchValidatedJson(url, z.array(OpenF1SessionSchema), {
    signal,
    timeoutMs: 8000,
  });
}

/**
 * Builds a validated TelemetryPack from raw OpenF1 data with 200 uniform resampled points
 * and bounded in-memory LRU caching.
 */
export async function buildOpenF1TelemetryComparison(
  sessionKey: number,
  driverANumber: number,
  driverBNumber: number,
  options?: BuildComparisonOptions
): Promise<ValidatedTelemetryPack> {
  const cacheKey = `${sessionKey}_${driverANumber}_${driverBNumber}`;

  if (!options?.bypassCache) {
    const cached = globalOpenF1LRUCache.get(cacheKey);
    if (cached) return cached;
  }

  // 1. Fetch laps for both drivers in the session
  const lapsUrlA = `${OPENF1_BASE_URL}/laps?session_key=${sessionKey}&driver_number=${driverANumber}`;
  const lapsUrlB = `${OPENF1_BASE_URL}/laps?session_key=${sessionKey}&driver_number=${driverBNumber}`;

  const [lapsA, lapsB] = await Promise.all([
    fetchValidatedJson(lapsUrlA, z.array(OpenF1LapSchema), { signal: options?.signal, timeoutMs: 8000 }),
    fetchValidatedJson(lapsUrlB, z.array(OpenF1LapSchema), { signal: options?.signal, timeoutMs: 8000 }),
  ]);

  // Find fastest valid flying lap for driver A
  const validLapsA = lapsA.filter(
    (l) => l.lap_duration && l.lap_duration > 50 && l.lap_duration < 150 && !l.is_pit_out_lap && l.date_start
  );
  const validLapsB = lapsB.filter(
    (l) => l.lap_duration && l.lap_duration > 50 && l.lap_duration < 150 && !l.is_pit_out_lap && l.date_start
  );

  if (validLapsA.length === 0 || validLapsB.length === 0) {
    throw new UpstreamApiError(
      `No valid flying laps found for driver #${driverANumber} or #${driverBNumber} in session ${sessionKey}`,
      'HTTP_ERROR',
      { status: 404 }
    );
  }

  validLapsA.sort((a, b) => (a.lap_duration ?? 999) - (b.lap_duration ?? 999));
  validLapsB.sort((a, b) => (a.lap_duration ?? 999) - (b.lap_duration ?? 999));

  const bestLapA = validLapsA[0]!;
  const bestLapB = validLapsB[0]!;

  const startA = new Date(bestLapA.date_start!).toISOString();
  const endA = new Date(new Date(bestLapA.date_start!).getTime() + (bestLapA.lap_duration! + 1) * 1000).toISOString();

  const startB = new Date(bestLapB.date_start!).toISOString();
  const endB = new Date(new Date(bestLapB.date_start!).getTime() + (bestLapB.lap_duration! + 1) * 1000).toISOString();

  // 2. Fetch car telemetry data for the best laps
  const carDataUrlA = `${OPENF1_BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverANumber}&date>=${startA}&date<=${endA}`;
  const carDataUrlB = `${OPENF1_BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverBNumber}&date>=${startB}&date<=${endB}`;

  const [carPointsA, carPointsB] = await Promise.all([
    fetchValidatedJson(carDataUrlA, z.array(OpenF1CarDataPointSchema), { signal: options?.signal, timeoutMs: 8000 }),
    fetchValidatedJson(carDataUrlB, z.array(OpenF1CarDataPointSchema), { signal: options?.signal, timeoutMs: 8000 }),
  ]);

  if (carPointsA.length < 10 || carPointsB.length < 10) {
    throw new UpstreamApiError(
      'Insufficient car telemetry data points returned from OpenF1 for the selected laps',
      'HTTP_ERROR',
      { status: 404 }
    );
  }

  // Convert raw points into NormalizedTelemetrySample arrays
  const durationA = bestLapA.lap_duration!;
  const durationB = bestLapB.lap_duration!;

  const rawSamplesA: NormalizedTelemetrySample[] = carPointsA.map((p, idx) => {
    const fraction = idx / (carPointsA.length - 1 || 1);
    return {
      distNorm: fraction,
      timeSec: fraction * durationA,
      speedKmh: Math.min(390, Math.max(0, p.speed)),
      throttlePct: Math.min(100, Math.max(0, p.throttle)),
      brakePct: Math.min(100, Math.max(0, p.brake)),
      gear: Math.min(8, Math.max(0, p.n_gear)),
      drs: p.drs > 0,
    };
  });

  const rawSamplesB: NormalizedTelemetrySample[] = carPointsB.map((p, idx) => {
    const fraction = idx / (carPointsB.length - 1 || 1);
    return {
      distNorm: fraction,
      timeSec: fraction * durationB,
      speedKmh: Math.min(390, Math.max(0, p.speed)),
      throttlePct: Math.min(100, Math.max(0, p.throttle)),
      brakePct: Math.min(100, Math.max(0, p.brake)),
      gear: Math.min(8, Math.max(0, p.n_gear)),
      drs: p.drs > 0,
    };
  });

  // Resample onto uniform 200-sample grid
  const GRID_SIZE = 200;
  const resampledA = resampleTelemetryChannel(rawSamplesA, GRID_SIZE);
  const resampledB = resampleTelemetryChannel(rawSamplesB, GRID_SIZE);

  const topSpeedA = Math.max(...resampledA.map((s) => s.speedKmh));
  const topSpeedB = Math.max(...resampledB.map((s) => s.speedKmh));

  const pack: ValidatedTelemetryPack = {
    slug: `openf1-${sessionKey}-${driverANumber}-vs-${driverBNumber}`,
    title: `OpenF1 Session ${sessionKey}: #${driverANumber} vs #${driverBNumber}`,
    subtitle: `Live OpenF1 Telemetry Comparison (Lap ${bestLapA.lap_number} vs Lap ${bestLapB.lap_number})`,
    year: 2024,
    session: 'Live',
    circuitId: 'openf1-circuit',
    circuitName: 'OpenF1 Live Circuit',
    lapDistanceMeters: 5500,
    sectorBoundaries: [0.33, 0.66, 1.0],
    provenance: 'live_openf1',
    driverA: {
      driverId: `driver_${driverANumber}`,
      driverCode: `D${driverANumber}`,
      driverName: `Driver #${driverANumber}`,
      teamId: 'team_a',
      teamName: 'OpenF1 Entrant A',
      teamColor: '#38BDF8',
      secondaryColor: '#FFFFFF',
      lapTime: formatSeconds(durationA),
      lapTimeSeconds: durationA,
      sector1Time: bestLapA.duration_sector_1 || durationA * 0.33,
      sector2Time: bestLapA.duration_sector_2 || durationA * 0.33,
      sector3Time: bestLapA.duration_sector_3 || durationA * 0.34,
      topSpeed: Math.round(topSpeedA),
      avgSpeed: Math.round((5500 / durationA) * 3.6),
      samples: resampledA.map((s) => ({
        distanceFraction: s.distNorm,
        distanceMeters: s.distNorm * 5500,
        elapsedTime: s.timeSec,
        speed: s.speedKmh,
        throttle: s.throttlePct,
        brake: s.brakePct,
        gear: s.gear,
        drs: s.drs,
      })),
    },
    driverB: {
      driverId: `driver_${driverBNumber}`,
      driverCode: `D${driverBNumber}`,
      driverName: `Driver #${driverBNumber}`,
      teamId: 'team_b',
      teamName: 'OpenF1 Entrant B',
      teamColor: '#FF8000',
      secondaryColor: '#FFFFFF',
      lapTime: formatSeconds(durationB),
      lapTimeSeconds: durationB,
      sector1Time: bestLapB.duration_sector_1 || durationB * 0.33,
      sector2Time: bestLapB.duration_sector_2 || durationB * 0.33,
      sector3Time: bestLapB.duration_sector_3 || durationB * 0.34,
      topSpeed: Math.round(topSpeedB),
      avgSpeed: Math.round((5500 / durationB) * 3.6),
      samples: resampledB.map((s) => ({
        distanceFraction: s.distNorm,
        distanceMeters: s.distNorm * 5500,
        elapsedTime: s.timeSec,
        speed: s.speedKmh,
        throttle: s.throttlePct,
        brake: s.brakePct,
        gear: s.gear,
        drs: s.drs,
      })),
    },
  };

  globalOpenF1LRUCache.set(cacheKey, pack);
  return pack;
}
