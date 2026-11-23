import { describe, it, expect } from 'vitest';
import {
  getAllSeasons,
  getSeasonByYear,
  getDriverById,
  getActive2026Teams,
  getTeamById,
  getTeamDrivers,
  getAllCircuits,
  getCircuitById,
  getF1DBMetadata,
  getArchiveStats
} from './dataService';

describe('F1DB Historical Data Integrity & Invariants', () => {
  describe('1. Immutable Historical Facts (Exact Equality ===)', () => {
    it('should assert Juan Manuel Fangio won exactly 5 World Drivers Championships', () => {
      const fangio = getDriverById('FAN') || getDriverById('juan-manuel-fangio');
      expect(fangio).toBeDefined();
      expect(fangio?.championships).toBe(5);
    });

    it('should assert Michael Schumacher won exactly 7 World Drivers Championships', () => {
      const schumacher = getDriverById('MSC') || getDriverById('michael-schumacher');
      expect(schumacher).toBeDefined();
      expect(schumacher?.championships).toBe(7);
    });

    it('should assert Alain Prost won exactly 4 World Drivers Championships', () => {
      const prost = getDriverById('PRO') || getDriverById('alain-prost');
      expect(prost).toBeDefined();
      expect(prost?.championships).toBe(4);
    });

    it('should assert Ayrton Senna won exactly 3 World Drivers Championships', () => {
      const senna = getDriverById('SEN') || getDriverById('ayrton-senna');
      expect(senna).toBeDefined();
      expect(senna?.championships).toBe(3);
    });

    it('should verify the 1950 inaugural champion was Nino Farina with no constructors championship', () => {
      const s1950 = getSeasonByYear(1950);
      expect(s1950).toBeDefined();
      expect(s1950?.championDriver).toContain('Farina');
      expect(s1950?.championTeamId).toBeNull();
      expect(s1950?.championTeam).toContain('Pre-1958');
    });

    it('should verify the 1958 inaugural Constructors Champion was Vanwall', () => {
      const s1958 = getSeasonByYear(1958);
      expect(s1958).toBeDefined();
      expect(s1958?.championTeam.toLowerCase()).toContain('vanwall');
    });
  });

  describe('2. Active Drivers & Ongoing Records (Floor Assertions >=)', () => {
    it('should assert Lewis Hamilton has at least 7 World Championships and >= 100 wins', () => {
      const hamilton = getDriverById('HAM') || getDriverById('lewis-hamilton');
      expect(hamilton).toBeDefined();
      expect(hamilton?.championships).toBeGreaterThanOrEqual(7);
      expect(hamilton?.wins).toBeGreaterThanOrEqual(100);
    });

    it('should assert Max Verstappen has at least 4 World Championships and >= 60 wins', () => {
      const verstappen = getDriverById('VER') || getDriverById('max-verstappen');
      expect(verstappen).toBeDefined();
      expect(verstappen?.championships).toBeGreaterThanOrEqual(4);
      expect(verstappen?.wins).toBeGreaterThanOrEqual(60);
    });

    it('should assert Fernando Alonso has at least 2 World Championships and >= 30 wins', () => {
      const alonso = getDriverById('ALO') || getDriverById('fernando-alonso');
      expect(alonso).toBeDefined();
      expect(alonso?.championships).toBeGreaterThanOrEqual(2);
      expect(alonso?.wins).toBeGreaterThanOrEqual(30);
    });

    it('should assert unbroken seasonal chronology covering at least 77 seasons (1950 to 2026)', () => {
      const seasons = getAllSeasons();
      expect(seasons.length).toBeGreaterThanOrEqual(77);

      for (let yr = 1950; yr <= 2026; yr++) {
        const s = getSeasonByYear(yr);
        expect(s, `Missing season record for ${yr}`).toBeDefined();
        expect(s?.races).toBeGreaterThanOrEqual(6);
      }
    });
  });

  describe('3. Referential Integrity & 2026 Grid Roster', () => {
    it('should contain all 11 active 2026 constructors with Audi and Cadillac', () => {
      const activeTeams = getActive2026Teams();
      expect(activeTeams.length).toBe(11);

      const activeSlugs = activeTeams.map(t => t.id);
      expect(activeSlugs).toContain('ferrari');
      expect(activeSlugs).toContain('mclaren');
      expect(activeSlugs).toContain('redbull');
      expect(activeSlugs).toContain('mercedes');
      expect(activeSlugs).toContain('astonmartin');
      expect(activeSlugs).toContain('alpine');
      expect(activeSlugs).toContain('williams');
      expect(activeSlugs).toContain('rb');
      expect(activeSlugs).toContain('haas');
      expect(activeSlugs).toContain('audi');
      expect(activeSlugs).toContain('cadillac');

      // Assert Sauber is preserved separately as a historical constructor
      const sauber = getTeamById('sauber');
      expect(sauber).toBeDefined();
      expect(sauber?.isActive2026).toBe(false);
    });

    it('should have drivers assigned to every active 2026 team', () => {
      const activeTeams = getActive2026Teams();
      for (const team of activeTeams) {
        const drivers = getTeamDrivers(team.id);
        expect(
          drivers.length,
          `Active 2026 team ${team.name} (${team.id}) must have registered drivers`
        ).toBeGreaterThanOrEqual(2);
      }
    });

    it('should resolve every post-1958 champion constructor without orphan IDs', () => {
      const seasons = getAllSeasons();
      for (const season of seasons) {
        if (season.year >= 1958 && season.year < 2026 && season.championTeamId) {
          const team = getTeamById(season.championTeamId);
          expect(
            team,
            `Constructor ${season.championTeamId} for season ${season.year} must exist in team registry`
          ).toBeDefined();
        }
      }
    });

    it('should resolve every champion driver without orphan IDs', () => {
      const seasons = getAllSeasons();
      for (const season of seasons) {
        if (season.championDriverId) {
          const driver = getDriverById(season.championDriverId);
          expect(
            driver,
            `Driver ${season.championDriverId} for season ${season.year} must exist in driver registry`
          ).toBeDefined();
        }
      }
    });
  });

  describe('4. Circuit Geospatial & Topographic 3D Splines', () => {
    it('should include 78+ circuits including the 2026 Madrid circuit (Madring)', () => {
      const circuits = getAllCircuits();
      expect(circuits.length).toBeGreaterThanOrEqual(78);

      const madrid = getCircuitById('madrid') || getCircuitById('madring');
      expect(madrid).toBeDefined();
      expect(madrid?.country).toBe('Spain');
      expect(madrid?.firstGP).toBe(2026);
    });

    it('should ensure all circuits have non-empty 3D coordinates with no identical start/end kinks', () => {
      const circuits = getAllCircuits();
      for (const circuit of circuits) {
        const coords = circuit.trackCoordinates;
        expect(coords, `Circuit ${circuit.name} must have trackCoordinates`).toBeDefined();
        expect(coords!.length, `Circuit ${circuit.name} points count`).toBeGreaterThanOrEqual(10);

        // Verify valid numeric 3D coordinates [x, y, z]
        for (const pt of coords!) {
          expect(pt.length).toBe(3);
          expect(Number.isFinite(pt[0])).toBe(true);
          expect(Number.isFinite(pt[1])).toBe(true);
          expect(Number.isFinite(pt[2])).toBe(true);
        }

        // Verify no duplicate closing endpoint (prevents CatmullRomCurve3 kinks)
        const first = coords![0];
        const last = coords![coords!.length - 1];
        const isIdentical = first[0] === last[0] && first[1] === last[1] && first[2] === last[2];
        expect(
          isIdentical,
          `Circuit ${circuit.name} must not have duplicate closing endpoint`
        ).toBe(false);
      }
    });
  });

  describe('5. Metadata & Global Telemetry Stats', () => {
    it('should return valid F1DB metadata with record counts and CC-BY-4.0 license', () => {
      const meta = getF1DBMetadata();
      expect(meta.f1dbVersion).toBeDefined();
      expect(meta.license).toBe('CC-BY-4.0');
      expect(meta.recordCounts.seasons).toBeGreaterThanOrEqual(77);
      expect(meta.recordCounts.drivers).toBeGreaterThanOrEqual(850);
      expect(meta.recordCounts.constructors).toBeGreaterThanOrEqual(60);
      expect(meta.recordCounts.circuits).toBeGreaterThanOrEqual(78);
    });

    it('should aggregate global stats accurately across the complete history', () => {
      const stats = getArchiveStats();
      expect(stats.seasonsCount).toBeGreaterThanOrEqual(77);
      expect(stats.driversCount).toBeGreaterThanOrEqual(850);
      expect(stats.circuitsCount).toBeGreaterThanOrEqual(78);
      expect(stats.totalWins).toBeGreaterThan(1000);
      expect(stats.totalChampionships).toBeGreaterThan(60);
      expect(stats.yearSpan).toContain('1950 to 2026');
    });
  });
});
