/**
 * F1 // ARCHIVE — OpenF1 Client (Tier 2 Cached Telemetry Proxy)
 * Enforces:
 * 1. Mandatory query parameter bounds (session_key, driver_number, and lap time window)
 * 2. Rate-limiting guard (< 3 req/s throttle window)
 * 3. Bounded In-Memory LRU cache (max 8 entries) — never polluting localStorage
 * 4. Automatic sample downsampling (max 350 points) and request timeout
 * 5. Graceful offline fallback
 */

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
  dateStart: string; // Mandatory lap-start time window
  dateEnd: string;   // Mandatory lap-end time window
  timeoutMs?: number;
}

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_SAMPLES_PER_LAP = 350;
const DEFAULT_TIMEOUT_MS = 8000;

// Bounded In-Memory LRU Cache (Max 8 entries) to safeguard origin localStorage
class InMemoryLRUCache<T> {
  private capacity: number;
  private cache: Map<string, { timestamp: number; data: T }> = new Map();

  constructor(capacity = 8) {
    this.capacity = capacity;
  }

  get(key: string, ttlMs: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.cache.delete(key);
      return null;
    }
    // Re-insert to mark as recently used
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  clear(): void {
    this.cache.clear();
  }
}

const openF1MemoryCache = new InMemoryLRUCache<OpenF1CarDataPoint[]>(8);

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
 * Downsamples dense OpenF1 telemetry to a bounded number of samples while preserving endpoints.
 */
function downsampleCarData(samples: OpenF1CarDataPoint[], maxPoints: number): OpenF1CarDataPoint[] {
  if (samples.length <= maxPoints) return samples;

  const result: OpenF1CarDataPoint[] = [];
  const step = (samples.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.min(samples.length - 1, Math.round(i * step));
    result.push(samples[index]);
  }

  return result;
}

/**
 * Fetches bounded car telemetry data from OpenF1 with strict time-window, timeout, and LRU memory caching.
 */
export async function fetchOpenF1CarData(
  options: OpenF1QueryOptions
): Promise<OpenF1CarDataPoint[]> {
  const { sessionKey, driverNumber, dateStart, dateEnd, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  if (!sessionKey || !driverNumber) {
    throw new Error('[OpenF1] sessionKey and driverNumber are mandatory parameters.');
  }

  if (!dateStart || !dateEnd) {
    throw new Error('[OpenF1] dateStart and dateEnd time-window bounds are mandatory to prevent large downloads.');
  }

  const cacheKey = `openf1_car_${sessionKey}_${driverNumber}_${dateStart}_${dateEnd}`;
  const cached = openF1MemoryCache.get(cacheKey, CACHE_TTL_MS);

  if (cached) {
    return cached;
  }

  await throttleRequest();

  const params = new URLSearchParams({
    session_key: String(sessionKey),
    driver_number: String(driverNumber),
    'date>=': dateStart,
    'date<': dateEnd
  });

  const url = `${OPENF1_BASE_URL}/car_data?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        console.warn('[OpenF1] Rate limit reached (HTTP 429). Using offline fallback.');
      }
      throw new Error(`[OpenF1] HTTP Error ${res.status}`);
    }

    const rawData: OpenF1CarDataPoint[] = await res.json();
    const downsampled = downsampleCarData(rawData, MAX_SAMPLES_PER_LAP);

    openF1MemoryCache.set(cacheKey, downsampled);

    return downsampled;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn(`[OpenF1] Request timed out after ${timeoutMs}ms for session ${sessionKey}`);
    } else {
      console.warn(`[OpenF1] Failed to fetch car data for session ${sessionKey}:`, err);
    }
    return [];
  }
}
