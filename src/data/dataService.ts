import SEASONS_DATA from './generated/seasons.json';
import CONSTRUCTORS_DATA from './generated/constructors.json';
import DRIVERS_DATA from './generated/drivers.json';
import CIRCUITS_DATA from './generated/circuits.json';
import META_DATA from './generated/meta.json';
import type { Team, Driver, Season, Circuit, F1DBMetadata } from '../types/f1';

/**
 * F1 // ARCHIVE — Data Service Layer
 * Synchronous, high-performance abstraction layer serving historical F1DB datasets.
 * Guaranteed zero client network latency and 100% offline determinism.
 */

export const TEAMS: Team[] = CONSTRUCTORS_DATA as Team[];
export const DRIVERS: Driver[] = DRIVERS_DATA as Driver[];
export const SEASONS: Season[] = SEASONS_DATA as Season[];
export const CIRCUITS: Circuit[] = CIRCUITS_DATA as Circuit[];
export const F1DB_META: F1DBMetadata = META_DATA as F1DBMetadata;

// Canonical Team Slug Normalizer
function normalizeTeamLookup(id: string): string {
  const clean = id.trim().toLowerCase().replace(/[^\w-]/g, '');
  if (clean === 'red-bull' || clean === 'redbull' || clean === 'red_bull') return 'redbull';
  if (clean === 'aston-martin' || clean === 'astonmartin' || clean === 'aston') return 'astonmartin';
  if (clean === 'racing-bulls' || clean === 'racingbulls' || clean === 'rb' || clean === 'alphatauri' || clean === 'toro-rosso') return 'rb';
  if (clean === 'stake-f1' || clean === 'kick-sauber' || clean === 'sauber') return 'sauber';
  return clean;
}

// ── Team Queries ──

export function getAllTeams(): Team[] {
  return TEAMS;
}

export function getActive2026Teams(): Team[] {
  return TEAMS.filter(t => t.isActive2026);
}

export function getHistoricTeams(): Team[] {
  return TEAMS.filter(t => !t.isActive2026);
}

export function getTeamById(id?: string): Team | undefined {
  if (!id) return undefined;
  const rawClean = id.trim().toLowerCase();
  const normalized = normalizeTeamLookup(id);

  return TEAMS.find(t => 
    t.id.toLowerCase() === rawClean || 
    t.id.toLowerCase() === normalized ||
    normalizeTeamLookup(t.id) === normalized ||
    t.name.toLowerCase() === rawClean
  );
}

export function getTeamDrivers(teamId?: string): Driver[] {
  if (!teamId) return [];
  const normalized = normalizeTeamLookup(teamId);
  return DRIVERS.filter(d => normalizeTeamLookup(d.teamId) === normalized);
}

/** Get all seasons where a specific team won the Constructors' Championship */
export function getSeasonsWonByTeam(teamId: string): Season[] {
  const normalized = normalizeTeamLookup(teamId);
  return getAllSeasons().filter(s => {
    if (!s.championTeamId) return false;
    return normalizeTeamLookup(s.championTeamId) === normalized;
  });
}

// ── Driver Queries ──

export function getAllDrivers(): Driver[] {
  return DRIVERS;
}

export function getActive2026Drivers(): Driver[] {
  return DRIVERS.filter(d => d.isActive2026);
}

export function getWorldChampions(): Driver[] {
  return DRIVERS.filter(d => d.championships > 0).sort((a, b) => b.championships - a.championships);
}

export function getDriverById(id?: string): Driver | undefined {
  if (!id) return undefined;
  const cleanId = id.trim().toLowerCase();

  return DRIVERS.find(d => 
    d.id.toLowerCase() === cleanId ||
    d.slug?.toLowerCase() === cleanId ||
    d.code?.toLowerCase() === cleanId ||
    d.name.toLowerCase() === cleanId
  );
}

/** Get all seasons where a specific driver won the Drivers' Championship */
export function getSeasonsWonByDriver(driverId: string): Season[] {
  const driver = getDriverById(driverId);
  if (!driver) return [];

  const targetId = driver.id.toLowerCase();
  const targetSlug = driver.slug?.toLowerCase() || targetId;
  const targetName = driver.name.toLowerCase();

  return getAllSeasons().filter(s => {
    if (s.championDriverId) {
      const champId = s.championDriverId.toLowerCase();
      if (champId === targetId || champId === targetSlug) return true;
    }
    return s.championDriver.toLowerCase() === targetName;
  });
}

/** Get the team object for a given driver */
export function getTeamForDriver(driverId: string): Team | undefined {
  const driver = getDriverById(driverId);
  if (!driver) return undefined;
  return getTeamById(driver.teamId);
}

// ── Season Queries ──

let _cachedSortedSeasons: Season[] | null = null;
export function getAllSeasons(): Season[] {
  if (!_cachedSortedSeasons) {
    _cachedSortedSeasons = [...SEASONS].sort((a, b) => b.year - a.year);
  }
  return _cachedSortedSeasons;
}

export function getSeasonByYear(yearInput?: string | number): Season | undefined {
  if (!yearInput) return undefined;
  const numericYear = typeof yearInput === 'number' ? yearInput : parseInt(yearInput, 10);
  if (isNaN(numericYear)) return undefined;
  return SEASONS.find(s => s.year === numericYear);
}

// ── Circuit Queries ──

export function getAllCircuits(): Circuit[] {
  return CIRCUITS;
}

export function getCircuitById(id?: string): Circuit | undefined {
  if (!id) return undefined;
  const cleanId = id.trim().toLowerCase();

  // Handle aliases like 'madrid' -> 'madring'
  if (cleanId === 'madrid') {
    const mad = CIRCUITS.find(c => c.id === 'madring' || c.id === 'madrid');
    if (mad) return mad;
  }

  return (
    CIRCUITS.find(c => c.id.toLowerCase() === cleanId) ||
    CIRCUITS.find(c => c.name.toLowerCase() === cleanId) ||
    CIRCUITS.find(c => c.name.toLowerCase().includes(cleanId))
  );
}

// ── Metadata & Aggregated Stats ──

export function getF1DBMetadata(): F1DBMetadata {
  return F1DB_META;
}

export function getArchiveStats() {
  const sorted = getAllSeasons();
  const totalChampionships = TEAMS.reduce((acc, t) => acc + (t.championships || 0), 0);
  const totalWins = DRIVERS.reduce((acc, d) => acc + (d.wins || 0), 0);
  const totalPoles = TEAMS.reduce((acc, t) => acc + (t.polePositions || 0), 0);

  return {
    seasonsCount: sorted.length,
    teamsCount: TEAMS.length,
    driversCount: DRIVERS.length,
    circuitsCount: CIRCUITS.length,
    totalChampionships,
    totalWins,
    totalPoles,
    yearSpan: `${sorted[sorted.length - 1]?.year || 1950} to ${sorted[0]?.year || 2026}`,
    f1dbVersion: F1DB_META.f1dbVersion,
    syncedAt: F1DB_META.syncedAt
  };
}

// ── Live F1 REST API Connectors ──
export {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchSeasonSchedule
} from '../api/jolpicaClient';
