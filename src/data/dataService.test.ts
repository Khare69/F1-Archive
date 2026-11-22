import { describe, it, expect } from 'vitest';
import {
  getAllTeams,
  getTeamById,
  getTeamDrivers,
  getAllDrivers,
  getDriverById,
  getSeasonsWonByDriver,
  getAllSeasons,
  getSeasonByYear,
  getAllCircuits,
  getCircuitById,
  getArchiveStats
} from './dataService';

describe('DataService Queries & Integrity', () => {
  it('should retrieve all teams correctly', () => {
    const teams = getAllTeams();
    expect(teams.length).toBeGreaterThanOrEqual(10);
    expect(teams.some(t => t.id === 'ferrari')).toBe(true);
    expect(teams.some(t => t.id === 'redbull')).toBe(true);
  });

  it('should find team by ID case-insensitively', () => {
    const ferrari = getTeamById('FERRARI');
    expect(ferrari).toBeDefined();
    expect(ferrari?.name).toBe('Scuderia Ferrari');
  });

  it('should retrieve drivers for a specific team', () => {
    const redbullDrivers = getTeamDrivers('redbull');
    expect(redbullDrivers.length).toBeGreaterThan(0);
    expect(redbullDrivers.some(d => d.id === 'VER')).toBe(true);
  });

  it('should retrieve all drivers including legends', () => {
    const drivers = getAllDrivers();
    expect(drivers.length).toBeGreaterThan(20);
    expect(drivers.some(d => d.id === 'SEN')).toBe(true);
    expect(drivers.some(d => d.id === 'MSC')).toBe(true);
  });

  it('should find driver by ID', () => {
    const hamilton = getDriverById('ham');
    expect(hamilton).toBeDefined();
    expect(hamilton?.name).toBe('Lewis Hamilton');
  });

  it('should verify 2000-2026 unbroken seasonal continuity (27 consecutive seasons)', () => {
    const seasons = getAllSeasons();
    for (let year = 2000; year <= 2026; year++) {
      const season = getSeasonByYear(year);
      expect(season, `Missing season for year ${year}`).toBeDefined();
      expect(season?.championDriver).toBeTruthy();
      expect(season?.championTeam).toBeTruthy();
      expect(season?.races).toBeGreaterThan(10);
    }
  });

  it('should find seasons won by a specific driver', () => {
    const schumacherTitles = getSeasonsWonByDriver('MSC');
    expect(schumacherTitles.length).toBeGreaterThanOrEqual(5);
    expect(schumacherTitles.some(s => s.year === 2004)).toBe(true);
  });

  it('should include the Buddh International Circuit (India)', () => {
    const buddh = getCircuitById('buddh');
    expect(buddh).toBeDefined();
    expect(buddh?.country).toBe('India');
    expect(buddh?.turns).toBe(16);
    expect(buddh?.trackCoordinates?.length).toBeGreaterThan(10);
  });

  it('should calculate global archive stats correctly', () => {
    const stats = getArchiveStats();
    expect(stats.seasonsCount).toBeGreaterThanOrEqual(27);
    expect(stats.circuitsCount).toBeGreaterThanOrEqual(13);
    expect(stats.totalWins).toBeGreaterThan(0);
    expect(stats.yearSpan).toContain('2026');
  });
});
