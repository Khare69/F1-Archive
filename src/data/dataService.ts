import { TEAMS, DRIVERS, SEASONS, CIRCUITS } from './f1_database';
import type { Team, Driver, Season, Circuit } from '../types/f1';

/**
 * Data Service abstraction layer.
 * All component data reads MUST go through these functions.
 * This guarantees easy migration to JSON or Jolpica F1 API in the future.
 */

// ── Team Queries ──

export function getAllTeams(): Team[] {
  return TEAMS;
}

export function getTeamById(id?: string): Team | undefined {
  if (!id) return undefined;
  const cleanId = id.trim().toLowerCase();
  return TEAMS.find(t => t.id.toLowerCase() === cleanId);
}

export function getTeamDrivers(teamId?: string): Driver[] {
  if (!teamId) return [];
  const cleanId = teamId.trim().toLowerCase();
  return DRIVERS.filter(d => d.teamId.toLowerCase() === cleanId);
}

/** Get all seasons where a specific team won the Constructors' Championship */
export function getSeasonsWonByTeam(teamId: string): Season[] {
  const cleanId = teamId.trim().toLowerCase();
  return getAllSeasons().filter(s =>
    s.championTeamId?.toLowerCase() === cleanId
  );
}

// ── Driver Queries ──

export function getAllDrivers(): Driver[] {
  return DRIVERS;
}

export function getDriverById(id?: string): Driver | undefined {
  if (!id) return undefined;
  const cleanId = id.trim().toUpperCase();
  return DRIVERS.find(d => d.id.toUpperCase() === cleanId);
}

/** Get all seasons where a specific driver won the Drivers' Championship */
export function getSeasonsWonByDriver(driverId: string): Season[] {
  const cleanId = driverId.trim().toUpperCase();
  return getAllSeasons().filter(s =>
    s.championDriverId?.toUpperCase() === cleanId
  );
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
  return CIRCUITS.find(c => c.id.toLowerCase() === cleanId);
}

// ── Aggregated Stats & Telemetry Queries ──

export function getArchiveStats() {
  const sorted = getAllSeasons();
  const totalChampionships = TEAMS.reduce((acc, t) => acc + t.championships, 0);
  const totalWins = DRIVERS.reduce((acc, d) => acc + d.wins, 0);
  const totalPoles = TEAMS.reduce((acc, t) => acc + t.polePositions, 0);
  
  return {
    seasonsCount: sorted.length,
    teamsCount: TEAMS.length,
    driversCount: DRIVERS.length,
    circuitsCount: CIRCUITS.length,
    totalChampionships,
    totalWins,
    totalPoles,
    yearSpan: `${sorted[sorted.length - 1]?.year || 1950} to ${sorted[0]?.year || 2026}`
  };
}

// ── Live F1 REST API Connectors ──
export {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchSeasonSchedule
} from '../api/jolpicaClient';

