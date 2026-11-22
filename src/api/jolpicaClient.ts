import type {
  LiveDriverStanding,
  LiveConstructorStanding,
  RaceScheduleRound
} from '../types/f1';
import { TEAMS, DRIVERS } from '../data/f1_database';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours TTL

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// In-memory runtime cache
const memoryCache: Record<string, CacheEntry<any>> = {};

function getFromCache<T>(key: string): T | null {
  // Check memory cache
  const mem = memoryCache[key];
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.data;
  }

  // Check localStorage
  try {
    const raw = localStorage.getItem(`f1_cache_${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache[key] = parsed;
        return parsed.data;
      }
    }
  } catch (e) {
    // localStorage unavailable or full
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
    localStorage.setItem(`f1_cache_${key}`, JSON.stringify(entry));
  } catch (e) {
    // Ignore storage quota errors
  }
}

// Fetch helper with timeout
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch Live Drivers Championship Standings
 */
export async function fetchDriverStandings(year = 'current'): Promise<{
  standings: LiveDriverStanding[];
  season: string;
  round: string;
  isFallback: boolean;
}> {
  const cacheKey = `driver_standings_${year}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) {
    return { ...cached, isFallback: false };
  }

  try {
    const res = await fetchWithTimeout(`${JOLPICA_BASE_URL}/${year}/driverStandings.json?limit=30`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json = await res.json();
    const list = json.MRData?.StandingsTable?.StandingsLists?.[0];
    const rawStandings = list?.DriverStandings || [];

    const standings: LiveDriverStanding[] = rawStandings.map((s: any) => ({
      position: parseInt(s.position, 10) || 0,
      points: parseFloat(s.points) || 0,
      wins: parseInt(s.wins, 10) || 0,
      driverId: s.Driver?.driverId || '',
      driverName: `${s.Driver?.givenName || ''} ${s.Driver?.familyName || ''}`.trim(),
      driverCode: s.Driver?.code || s.Driver?.familyName?.substring(0, 3)?.toUpperCase() || '',
      permanentNumber: s.Driver?.permanentNumber || s.number || '',
      nationality: s.Driver?.nationality || '',
      constructorId: s.Constructors?.[0]?.constructorId || '',
      constructorName: s.Constructors?.[0]?.name || ''
    }));

    const result = {
      standings,
      season: list?.season || year,
      round: list?.round || '1'
    };

    saveToCache(cacheKey, result);
    return { ...result, isFallback: false };
  } catch (err) {
    console.warn('Jolpica API Driver Standings fetch failed, using curated fallback:', err);
    return {
      standings: getFallbackDriverStandings(),
      season: '2026',
      round: 'Live Vault',
      isFallback: true
    };
  }
}

/**
 * Fetch Live Constructors Championship Standings
 */
export async function fetchConstructorStandings(year = 'current'): Promise<{
  standings: LiveConstructorStanding[];
  season: string;
  round: string;
  isFallback: boolean;
}> {
  const cacheKey = `constructor_standings_${year}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) {
    return { ...cached, isFallback: false };
  }

  try {
    const res = await fetchWithTimeout(`${JOLPICA_BASE_URL}/${year}/constructorStandings.json?limit=20`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json = await res.json();
    const list = json.MRData?.StandingsTable?.StandingsLists?.[0];
    const rawStandings = list?.ConstructorStandings || [];

    const standings: LiveConstructorStanding[] = rawStandings.map((s: any) => ({
      position: parseInt(s.position, 10) || 0,
      points: parseFloat(s.points) || 0,
      wins: parseInt(s.wins, 10) || 0,
      constructorId: s.Constructor?.constructorId || '',
      constructorName: s.Constructor?.name || '',
      nationality: s.Constructor?.nationality || ''
    }));

    const result = {
      standings,
      season: list?.season || year,
      round: list?.round || '1'
    };

    saveToCache(cacheKey, result);
    return { ...result, isFallback: false };
  } catch (err) {
    console.warn('Jolpica API Constructor Standings fetch failed, using curated fallback:', err);
    return {
      standings: getFallbackConstructorStandings(),
      season: '2026',
      round: 'Live Vault',
      isFallback: true
    };
  }
}

/**
 * Fetch Official Race Schedule
 */
export async function fetchSeasonSchedule(year = 'current'): Promise<{
  races: RaceScheduleRound[];
  season: string;
  isFallback: boolean;
}> {
  const cacheKey = `schedule_${year}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) {
    return { ...cached, isFallback: false };
  }

  try {
    const res = await fetchWithTimeout(`${JOLPICA_BASE_URL}/${year}.json`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json = await res.json();
    const rawRaces = json.MRData?.RaceTable?.Races || [];

    const races: RaceScheduleRound[] = rawRaces.map((r: any) => ({
      round: parseInt(r.round, 10) || 0,
      raceName: r.raceName || '',
      circuitName: r.Circuit?.circuitName || '',
      locality: r.Circuit?.Location?.locality || '',
      country: r.Circuit?.Location?.country || '',
      date: r.date || '',
      time: r.time,
      url: r.url
    }));

    const result = {
      races,
      season: json.MRData?.RaceTable?.season || year
    };

    saveToCache(cacheKey, result);
    return { ...result, isFallback: false };
  } catch (err) {
    console.warn('Jolpica API Schedule fetch failed, using curated fallback:', err);
    return {
      races: getFallbackRaceSchedule(),
      season: '2026',
      isFallback: true
    };
  }
}

// ── Curated Offline Fallbacks ──

function getFallbackDriverStandings(): LiveDriverStanding[] {
  return [
    { position: 1, points: 219, wins: 6, driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', permanentNumber: '12', nationality: 'Italian', constructorId: 'mercedes', constructorName: 'Mercedes-AMG PETRONAS' },
    { position: 2, points: 198, wins: 4, driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', permanentNumber: '16', nationality: 'Monegasque', constructorId: 'ferrari', constructorName: 'Scuderia Ferrari' },
    { position: 3, points: 185, wins: 3, driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', permanentNumber: '4', nationality: 'British', constructorId: 'mclaren', constructorName: 'McLaren F1 Team' },
    { position: 4, points: 172, wins: 2, driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', permanentNumber: '44', nationality: 'British', constructorId: 'ferrari', constructorName: 'Scuderia Ferrari' },
    { position: 5, points: 164, wins: 3, driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', permanentNumber: '1', nationality: 'Dutch', constructorId: 'redbull', constructorName: 'Red Bull Racing' },
    { position: 6, points: 140, wins: 2, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', permanentNumber: '63', nationality: 'British', constructorId: 'mercedes', constructorName: 'Mercedes-AMG PETRONAS' },
    { position: 7, points: 112, wins: 1, driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', permanentNumber: '81', nationality: 'Australian', constructorId: 'mclaren', constructorName: 'McLaren F1 Team' },
    { position: 8, points: 78, wins: 0, driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', permanentNumber: '14', nationality: 'Spanish', constructorId: 'astonmartin', constructorName: 'Aston Martin F1' }
  ];
}

function getFallbackConstructorStandings(): LiveConstructorStanding[] {
  return [
    { position: 1, points: 370, wins: 6, constructorId: 'ferrari', constructorName: 'Scuderia Ferrari', nationality: 'Italian' },
    { position: 2, points: 359, wins: 8, constructorId: 'mercedes', constructorName: 'Mercedes-AMG PETRONAS', nationality: 'German' },
    { position: 3, points: 297, wins: 4, constructorId: 'mclaren', constructorName: 'McLaren F1 Team', nationality: 'British' },
    { position: 4, points: 196, wins: 3, constructorId: 'redbull', constructorName: 'Red Bull Racing', nationality: 'Austrian' },
    { position: 5, points: 94, wins: 0, constructorId: 'astonmartin', constructorName: 'Aston Martin F1', nationality: 'British' },
    { position: 6, points: 42, wins: 0, constructorId: 'alpine', constructorName: 'Alpine F1 Team', nationality: 'French' },
    { position: 7, points: 38, wins: 0, constructorId: 'williams', constructorName: 'Williams Racing', nationality: 'British' },
    { position: 8, points: 24, wins: 0, constructorId: 'haas', constructorName: 'Haas F1 Team', nationality: 'American' }
  ];
}

function getFallbackRaceSchedule(): RaceScheduleRound[] {
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
