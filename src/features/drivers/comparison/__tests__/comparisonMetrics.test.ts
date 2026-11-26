import { describe, it, expect } from 'vitest';
import {
  computeComparisonRows,
  resolveTeammatePair,
  type ComparableDriver,
  type RawTeammateH2HRecord
} from '../comparisonMetrics';

describe('comparisonMetrics Engine', () => {
  const driverA: ComparableDriver = {
    id: 'SEN',
    name: 'Ayrton Senna',
    slug: 'senna',
    country: 'Brazil',
    wins: 41,
    podiums: 80,
    championships: 3,
    polePositions: 65,
    fastestLaps: 19,
    starts: 161,
    pointsSharePct: 45.2
  };

  const driverB: ComparableDriver = {
    id: 'PRO',
    name: 'Alain Prost',
    slug: 'prost',
    country: 'France',
    wins: 51,
    podiums: 106,
    championships: 4,
    polePositions: 33,
    fastestLaps: 41,
    starts: 199,
    pointsSharePct: 42.1
  };

  describe('computeComparisonRows', () => {
    it('computes raw career metrics correctly with accurate winner flags', () => {
      const rows = computeComparisonRows(driverA, driverB, 'raw');

      const championships = rows.find(r => r.key === 'championships')!;
      expect(championships.leftFormatted).toBe('3');
      expect(championships.rightFormatted).toBe('4');
      expect(championships.winner).toBe('right');

      const poles = rows.find(r => r.key === 'poles')!;
      expect(poles.leftFormatted).toBe('65');
      expect(poles.rightFormatted).toBe('33');
      expect(poles.winner).toBe('left');
    });

    it('computes era-normalized rates without NaN or Infinity for zero-start drivers', () => {
      const rookie: ComparableDriver = {
        id: 'ROO',
        name: 'Rookie Driver',
        country: 'Monaco',
        wins: 0,
        podiums: 0,
        championships: 0,
        starts: 0
      };

      const rows = computeComparisonRows(rookie, driverA, 'normalized');

      const winRate = rows.find(r => r.key === 'winRate')!;
      expect(winRate.leftFormatted).toBe('N/A');
      expect(winRate.leftValue).toBeNull();
      expect(winRate.rightFormatted).toMatch(/\d+\.\d+%/);
      expect(winRate.winner).toBe('right');
    });
  });

  describe('resolveTeammatePair', () => {
    const mockTeammatesMap: Record<string, RawTeammateH2HRecord> = {
      'prost__senna': {
        racesTogether: 32,
        bothFinishedRaces: 22,
        bothFinishedWinsA: 11, // Prost
        bothFinishedWinsB: 11, // Senna
        allStartsWinsA: 11,
        allStartsWinsB: 14,
        outqualifiedA: 4,
        outqualifiedB: 28,
        pointsA: 163,
        pointsB: 154,
        years: [1988, 1989],
        constructors: ['McLaren']
      }
    };

    it('resolves pair when queried in forward canonical order', () => {
      const result = resolveTeammatePair(mockTeammatesMap, 'prost', 'senna');
      expect(result).not.toBeNull();
      expect(result?.racesTogether).toBe(32);
      expect(result?.leftBothFinishedWins).toBe(11);
      expect(result?.rightBothFinishedWins).toBe(11);
      expect(result?.leftQualiWins).toBe(4);
      expect(result?.rightQualiWins).toBe(28);
      expect(result?.years).toEqual([1988, 1989]);
    });

    it('inverts metrics correctly when queried in reverse order', () => {
      const result = resolveTeammatePair(mockTeammatesMap, 'senna', 'prost');
      expect(result).not.toBeNull();
      expect(result?.racesTogether).toBe(32);
      // Senna is now left, so left wins should correspond to Senna's wins (B)
      expect(result?.leftQualiWins).toBe(28);
      expect(result?.rightQualiWins).toBe(4);
      expect(result?.leftPoints).toBe(154);
      expect(result?.rightPoints).toBe(163);
    });

    it('handles legacy alias fallback gracefully', () => {
      const legacyMap: Record<string, RawTeammateH2HRecord> = {
        'alonso__hamilton': {
          racesTogether: 17,
          driverAWins: 9,
          driverBWins: 8,
          driverAOutqualified: 7,
          driverBOutqualified: 10,
          driverAPoints: 109,
          driverBPoints: 109
        }
      };

      const result = resolveTeammatePair(legacyMap, 'alonso', 'hamilton');
      expect(result).not.toBeNull();
      expect(result?.leftBothFinishedWins).toBe(9);
      expect(result?.rightBothFinishedWins).toBe(8);
      expect(result?.leftQualiWins).toBe(7);
      expect(result?.rightQualiWins).toBe(10);
      expect(result?.years).toEqual([]);
      expect(result?.constructors).toEqual([]);
    });

    it('returns null if driver compares against themselves or record is missing', () => {
      expect(resolveTeammatePair(mockTeammatesMap, 'senna', 'senna')).toBeNull();
      expect(resolveTeammatePair(mockTeammatesMap, 'senna', 'verstappen')).toBeNull();
      expect(resolveTeammatePair(null, 'senna', 'prost')).toBeNull();
    });
  });
});
