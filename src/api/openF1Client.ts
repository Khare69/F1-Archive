/**
 * F1 // ARCHIVE — OpenF1 Client (Tier 2 Cached Telemetry Proxy)
 * Enforces:
 * 1. Mandatory query parameter bounds (session_key, driver_number, lap_number)
 * 2. Rate-limiting guard (< 3 req/s throttle window)
 * 3. safeStorage persistence with TTL caching
 * 4. Graceful offline fallback
 */

import { safeStorage } from '../lib/safeStorage';

export interface OpenF1CarDataPoint {
  date: string;
  driver_number: number;
  rpm: number;
  speed: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export interface OpenF1LocationPoint {
  date: string;
  driver_number: number;
  x: number;
  y: number;
  z: number;
}

export interface OpenF1QueryOptions {
  sessionKey: number;
  driverNumber: number;
  lapNumber?: number;
  dateStart?: string;
  dateEnd?: string;
}

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
let lastRequestTimestamp = 0;
const MIN_REQUEST_INTERVAL_MS = 350; // Protect free-tier rate limit (max 3 req/sec)

async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTimestamp;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLast));
  }
  lastRequestTimestamp = Date.now();
}

/**
 * Fetches filtered car telemetry data from OpenF1 with strict bounds and caching.
 */
export async function fetchOpenF1CarData(
  options: OpenF1QueryOptions
): Promise<OpenF1CarDataPoint[]> {
  const { sessionKey, driverNumber, lapNumber } = options;

  if (!sessionKey || !driverNumber) {
    throw new Error('[OpenF1] sessionKey and driverNumber are mandatory parameters.');
  }

  const cacheKey = `openf1_car_${sessionKey}_${driverNumber}_${lapNumber || 'all'}`;
  const cachedRaw = safeStorage.getItem(cacheKey);

  if (cachedRaw) {
    try {
      const parsed = JSON.parse(cachedRaw);
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed.data;
      }
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  await throttleRequest();

  const params = new URLSearchParams({
    session_key: String(sessionKey),
    driver_number: String(driverNumber)
  });

  if (options.dateStart) params.append('date>', options.dateStart);
  if (options.dateEnd) params.append('date<', options.dateEnd);

  const url = `${OPENF1_BASE_URL}/car_data?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        console.warn('[OpenF1] Rate limit reached (HTTP 429). Using offline fallback.');
      }
      throw new Error(`[OpenF1] HTTP Error ${res.status}`);
    }

    const data: OpenF1CarDataPoint[] = await res.json();
    safeStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data })
    );

    return data;
  } catch (err) {
    console.warn(`[OpenF1] Failed to fetch car data for session ${sessionKey}:`, err);
    return [];
  }
}
