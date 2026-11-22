import { useQuery } from '@tanstack/react-query';
import type {
  LiveDriverStanding,
  LiveConstructorStanding,
  RaceScheduleRound,
  QueryMetadata
} from '../types/f1';
import { safeStorage } from '../utils/safeStorage';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours TTL

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// In-memory runtime cache
const memoryCache: Record<string, CacheEntry<unknown>> = {};

export function clearApiCache(): void {
  for (const k of Object.keys(memoryCache)) {
    delete memoryCache[k];
  }
}

function getFromCache<T>(key: string): { data: T; timestamp: number } | null {
  // Check memory cache
  const mem = memoryCache[key] as CacheEntry<T> | undefined;
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return { data: mem.data, timestamp: mem.timestamp };
  }

  // Check safeStorage
  try {
    const raw = safeStorage.getItem(`f1_cache_${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache[key] = parsed;
        return { data: parsed.data, timestamp: parsed.timestamp };
      }
    }
  } catch {
    // safeStorage unavailable or invalid JSON
  }

  return null;
}

function saveToCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    timestamp: Date.now(),
    data
  };
  memoryCache[key] = entry;

  try {
    safeStorage.setItem(`f1_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

// Fetch helper with timeout and AbortSignal forwarding
async function fetchWithTimeout(url: string, signal?: AbortSignal, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      }, { once: true });
    }
  }

  try {
    // Note: Do NOT set custom User-Agent in browser fetch() calls to avoid CORS preflight failures
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export interface DriverStandingsPayload {
  standings: LiveDriverStanding[];
  season: string;
  round: string;
}

export interface ConstructorStandingsPayload {
  standings: LiveConstructorStanding[];
  season: string;
  round: string;
}

export interface RaceSchedulePayload {
  races: RaceScheduleRound[];
  season: string;
}

export type DriverStandingsResponse = QueryMetadata<DriverStandingsPayload>;
export type ConstructorStandingsResponse = QueryMetadata<ConstructorStandingsPayload>;
export type RaceScheduleResponse = QueryMetadata<RaceSchedulePayload>;

/**
 * Fetch Live Drivers Championship Standings
 */
export async function fetchDriverStandings(
  year = 'current',
  signal?: AbortSignal
): Promise<DriverStandingsResponse> {
  const cacheKey = `driver_standings_${year}`;
  const cached = getFromCache<DriverStandingsPayload>(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      source: 'cached',
      updatedAt: cached.timestamp
    };
  }

  try {
    const res = await fetchWithTimeout(`${JOLPICA_BASE_URL}/${year}/driverStandings.json?limit=30`, signal);
    if (!res.ok) {
      const err = new Error(`HTTP error ${res.status}`);
      (err as unknown as { status: number }).status = res.status;
      throw err;
    }

    const json = await res.json();
    const list = json.MRData?.StandingsTable?.StandingsLists?.[0];
    const total = parseInt(json.MRData?.total || '0', 10);
    const rawStandings = list?.DriverStandings || [];

    // Handle future rounds or empty data with total: "0"
    if (total === 0 || rawStandings.length === 0) {
      return {
        data: {
          standings: getFallbackDriverStandings(),
          season: list?.season || (year === 'current' ? '2026' : year),
          round: 'Pre-Season'
        },
        source: 'fallback',
        updatedAt: Date.now()
      };
    }

    const standings: LiveDriverStanding[] = rawStandings.map((s: Record<string, unknown>) => {
      const driver = s.Driver as Record<string, string> | undefined;
      const constructors = s.Constructors as Array<Record<string, string>> | undefined;
      return {
        position: parseInt(String(s.position), 10) || 0,
        points: parseFloat(String(s.points)) || 0,
        wins: parseInt(String(s.wins), 10) || 0,
        driverId: driver?.driverId || '',
        driverName: `${driver?.givenName || ''} ${driver?.familyName || ''}`.trim(),
        driverCode: driver?.code || driver?.familyName?.substring(0, 3)?.toUpperCase() || '',
        permanentNumber: driver?.permanentNumber || String(s.number || ''),
        nationality: driver?.nationality || '',
        constructorId: constructors?.[0]?.constructorId || '',
        constructorName: constructors?.[0]?.name || ''
      };
    });

    const payload: DriverStandingsPayload = {
      standings,
      season: list?.season || year,
      round: list?.round || '1'
    };

    saveToCache(cacheKey, payload);
    return {
      data: payload,
      source: 'live',
      updatedAt: Date.now()
    };
  } catch (err) {
    console.warn('Jolpica API Driver Standings fetch failed, using curated fallback:', err);
    return {
      data: {
        standings: getFallbackDriverStandings(),
        season: year === 'current' ? '2026' : year,
        round: 'Official Vault'
      },
      source: 'fallback',
      updatedAt: Date.now(),
      error: err instanceof Error ? err.message : 'Network error'
    };
  }
}

/**
 * Fetch Live Constructors Championship Standings
 */
export async function fetchConstructorStandings(
  year = 'current',
  signal?: AbortSignal
): Promise<ConstructorStandingsResponse> {
  const cacheKey = `constructor_standings_${year}`;
  const cached = getFromCache<ConstructorStandingsPayload>(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      source: 'cached',
      updatedAt: cached.timestamp
    };
  }

  try {
    const res = await fetchWithTimeout(`${JOLPICA_BASE_URL}/${year}/constructorStandings.json?limit=20`, signal);
    if (!res.ok) {
      const err = new Error(`HTTP error ${res.status}`);
      (err as unknown as { status: number }).status = res.status;
      throw err;
    }

    const json = await res.json();
    const list = json.MRData?.StandingsTable?.StandingsLists?.[0];
    const total = parseInt(json.MRData?.total || '0', 10);
    const rawStandings = list?.ConstructorStandings || [];

    if (total === 0 || rawStandings.length === 0) {
      return {
        data: {
          standings: getFallbackConstructorStandings(),
          season: list?.season || (year === 'current' ? '2026' : year),
          round: 'Pre-Season'
        },
        source: 'fallback',
        updatedAt: Date.now()
      };
    }

    const standings: LiveConstructorStanding[] = rawStandings.map((s: Record<string, unknown>) => {
      const constructor = s.Constructor as Record<string, string> | undefined;
      return {
        position: parseInt(String(s.position), 10) || 0,
        points: parseFloat(String(s.points)) || 0,
        wins: parseInt(String(s.wins), 10) || 0,
        constructorId: constructor?.constructorId || '',
        constructorName: constructor?.name || '',
        nationality: constructor?.nationality || ''
      };
    });

    const payload: ConstructorStandingsPayload = {
      standings,
      season: list?.season || year,
      round: list?.round || '1'
    };

    saveToCache(cacheKey, payload);
    return {
      data: payload,
      source: 'live',
      updatedAt: Date.now()
    };
  } catch (err) {
    console.warn('Jolpica API Constructor Standings fetch failed, using curated fallback:', err);
    return {
      data: {
        standings: getFallbackConstructorStandings(),
        season: year === 'current' ? '2026' : year,
        round: 'Official Vault'
      },
      source: 'fallback',
      updatedAt: Date.now(),
      error: err instanceof Error ? err.message : 'Network error'
    };
  }
}

/**
 * Fetch Official Race Schedule
 */
export async function fetchSeasonSchedule(
  year = 'current',
  signal?: AbortSignal
): Promise<RaceScheduleResponse> {
  const cacheKey = `schedule_${year}`;
  const cached = getFromCache<RaceSchedulePayload>(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      source: 'cached',
      updatedAt: cached.timestamp
    };
  }

  try {
    const res = await fetchWithTimeout(`${JOLPICA_BASE_URL}/${year}.json`, signal);
    if (!res.ok) {
      const err = new Error(`HTTP error ${res.status}`);
      (err as unknown as { status: number }).status = res.status;
      throw err;
    }

    const json = await res.json();
    const rawRaces = json.MRData?.RaceTable?.Races || [];
    const total = parseInt(json.MRData?.total || '0', 10);

    if (total === 0 || rawRaces.length === 0) {
      return {
        data: {
          races: getFallbackRaceSchedule(),
          season: json.MRData?.RaceTable?.season || (year === 'current' ? '2026' : year)
        },
        source: 'fallback',
        updatedAt: Date.now()
      };
    }

    const races: RaceScheduleRound[] = rawRaces.map((r: Record<string, unknown>) => {
      const circuit = r.Circuit as Record<string, unknown> | undefined;
      const location = circuit?.Location as Record<string, string> | undefined;
      return {
        round: parseInt(String(r.round), 10) || 0,
        raceName: String(r.raceName || ''),
        circuitName: String(circuit?.circuitName || ''),
        locality: location?.locality || '',
        country: location?.country || '',
        date: String(r.date || ''),
        time: r.time as string | undefined,
        url: r.url as string | undefined
      };
    });

    const payload: RaceSchedulePayload = {
      races,
      season: json.MRData?.RaceTable?.season || year
    };

    saveToCache(cacheKey, payload);
    return {
      data: payload,
      source: 'live',
      updatedAt: Date.now()
    };
  } catch (err) {
    console.warn('Jolpica API Schedule fetch failed, using curated fallback:', err);
    return {
      data: {
        races: getFallbackRaceSchedule(),
        season: year === 'current' ? '2026' : year
      },
      source: 'fallback',
      updatedAt: Date.now(),
      error: err instanceof Error ? err.message : 'Network error'
    };
  }
}

// ── TanStack Query Hooks ──

export function useDriverStandingsQuery(year = 'current') {
  return useQuery({
    queryKey: ['driverStandings', year],
    queryFn: ({ signal }) => fetchDriverStandings(year, signal),
  });
}

export function useConstructorStandingsQuery(year = 'current') {
  return useQuery({
    queryKey: ['constructorStandings', year],
    queryFn: ({ signal }) => fetchConstructorStandings(year, signal),
  });
}

export function useSeasonScheduleQuery(year = 'current') {
  return useQuery({
    queryKey: ['seasonSchedule', year],
    queryFn: ({ signal }) => fetchSeasonSchedule(year, signal),
  });
}

// ── Curated Offline Fallbacks ──

export function getFallbackDriverStandings(): LiveDriverStanding[] {
  return [
    { position: 1, points: 219, wins: 6, driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', permanentNumber: '12', nationality: 'Italian', constructorId: 'mercedes', constructorName: 'Mercedes-AMG PETRONAS' },
    { position: 2, points: 198, wins: 4, driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', permanentNumber: '16', nationality: 'Monegasque', constructorId: 'ferrari', constructorName: 'Scuderia Ferrari' },
    { position: 3, points: 185, wins: 3, driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', permanentNumber: '4', nationality: 'British', constructorId: 'mclaren', constructorName: 'McLaren F1 Team' },
    { position: 4, points: 172, wins: 2, driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', permanentNumber: '44', nationality: 'British', constructorId: 'ferrari', constructorName: 'Scuderia Ferrari' },
    { position: 5, points: 164, wins: 3, driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', permanentNumber: '1', nationality: 'Dutch', constructorId: 'redbull', constructorName: 'Red Bull Racing' },
    { position: 6, points: 140, wins: 2, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', permanentNumber: '63', nationality: 'British', constructorId: 'mercedes', constructorName: 'Mercedes-AMG PETRONAS' },
    { position: 7, points: 112, wins: 1, driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', permanentNumber: '81', nationality: 'Australian', constructorId: 'mclaren', constructorName: 'McLaren F1 Team' },
    { position: 8, points: 78, wins: 0, driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', permanentNumber: '14', nationality: 'Spanish', constructorId: 'astonmartin', constructorName: 'Aston Martin F1' },
    { position: 9, points: 52, wins: 0, driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', permanentNumber: '10', nationality: 'French', constructorId: 'alpine', constructorName: 'BWT Alpine F1 Team' },
    { position: 10, points: 41, wins: 0, driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', permanentNumber: '23', nationality: 'Thai', constructorId: 'williams', constructorName: 'Williams Racing' },
    { position: 11, points: 28, wins: 0, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', driverCode: 'TSU', permanentNumber: '22', nationality: 'Japanese', constructorId: 'rb', constructorName: 'Visa Cash App RB' },
    { position: 12, points: 16, wins: 0, driverId: 'hulkenberg', driverName: 'Nico Hulkenberg', driverCode: 'HUL', permanentNumber: '27', nationality: 'German', constructorId: 'sauber', constructorName: 'Stake F1 Team Kick Sauber' }
  ];
}

export function getFallbackConstructorStandings(): LiveConstructorStanding[] {
  return [
    { position: 1, points: 370, wins: 6, constructorId: 'ferrari', constructorName: 'Scuderia Ferrari', nationality: 'Italian' },
    { position: 2, points: 359, wins: 8, constructorId: 'mercedes', constructorName: 'Mercedes-AMG PETRONAS', nationality: 'German' },
    { position: 3, points: 297, wins: 4, constructorId: 'mclaren', constructorName: 'McLaren F1 Team', nationality: 'British' },
    { position: 4, points: 196, wins: 3, constructorId: 'redbull', constructorName: 'Red Bull Racing', nationality: 'Austrian' },
    { position: 5, points: 94, wins: 0, constructorId: 'astonmartin', constructorName: 'Aston Martin F1', nationality: 'British' },
    { position: 6, points: 52, wins: 0, constructorId: 'alpine', constructorName: 'Alpine F1 Team', nationality: 'French' },
    { position: 7, points: 41, wins: 0, constructorId: 'williams', constructorName: 'Williams Racing', nationality: 'British' },
    { position: 8, points: 28, wins: 0, constructorId: 'rb', constructorName: 'Visa Cash App RB', nationality: 'Italian' },
    { position: 9, points: 16, wins: 0, constructorId: 'sauber', constructorName: 'Stake F1 Team Kick Sauber', nationality: 'Swiss' },
    { position: 10, points: 12, wins: 0, constructorId: 'haas', constructorName: 'Haas F1 Team', nationality: 'American' }
  ];
}

export function getFallbackRaceSchedule(): RaceScheduleRound[] {
  return [
    { round: 1, raceName: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', locality: 'Sakhir', country: 'Bahrain', date: '2026-03-01' },
    { round: 2, raceName: 'Saudi Arabian Grand Prix', circuitName: 'Jeddah Corniche Circuit', locality: 'Jeddah', country: 'Saudi Arabia', date: '2026-03-15' },
    { round: 3, raceName: 'Australian Grand Prix', circuitName: 'Albert Park Circuit', locality: 'Melbourne', country: 'Australia', date: '2026-03-29' },
    { round: 4, raceName: 'Japanese Grand Prix', circuitName: 'Suzuka International Racing Course', locality: 'Suzuka', country: 'Japan', date: '2026-04-12' },
    { round: 5, raceName: 'Miami Grand Prix', circuitName: 'Miami International Autodrome', locality: 'Miami', country: 'United States', date: '2026-05-03' },
    { round: 6, raceName: 'Monaco Grand Prix', circuitName: 'Circuit de Monaco', locality: 'Monte Carlo', country: 'Monaco', date: '2026-05-24' },
    { round: 7, raceName: 'Spanish Grand Prix', circuitName: 'Circuit de Barcelona-Catalunya', locality: 'Montmeló', country: 'Spain', date: '2026-06-07' },
    { round: 8, raceName: 'Canadian Grand Prix', circuitName: 'Circuit Gilles Villeneuve', locality: 'Montreal', country: 'Canada', date: '2026-06-21' },
    { round: 9, raceName: 'British Grand Prix', circuitName: 'Silverstone Circuit', locality: 'Silverstone', country: 'United Kingdom', date: '2026-07-05' },
    { round: 10, raceName: 'Belgian Grand Prix', circuitName: 'Circuit de Spa-Francorchamps', locality: 'Stavelot', country: 'Belgium', date: '2026-07-26' },
    { round: 11, raceName: 'Italian Grand Prix', circuitName: 'Autodromo Nazionale Monza', locality: 'Monza', country: 'Italy', date: '2026-09-06' },
    { round: 12, raceName: 'Abu Dhabi Grand Prix', circuitName: 'Yas Marina Circuit', locality: 'Abu Dhabi', country: 'United Arab Emirates', date: '2026-11-29' }
  ];
}
