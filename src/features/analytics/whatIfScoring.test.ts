import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateSimulatedStandings,
  fiaCountbackTieBreaker,
  HISTORICAL_BEST_N
} from './whatIfScoring';
import type { SeasonClassificationFile } from '../../types/f1';

function loadSeasonFile(year: number): SeasonClassificationFile {
  const filePath = path.resolve(process.cwd(), `public/data/seasons/${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('whatIfScoring Engine', () => {
  it('correctly executes full-spectrum FIA countback tie-breaker beyond 10th position', () => {
    const driverA = { finishPositionsCount: { 1: 2, 2: 3, 11: 4, 12: 1 } };
    const driverB = { finishPositionsCount: { 1: 2, 2: 3, 11: 3, 12: 5 } };

    // Tied on wins (2) and 2nds (3), but Driver A has four 11th places vs Driver B's three
    const tieBreak = fiaCountbackTieBreaker(driverA, driverB, 20);
    expect(tieBreak).toBeLessThan(0); // driverA ranks ahead of driverB
  });

  it('1988 Senna vs Prost: accurately reflects dropped-scores rule (Best 11)', () => {
    const s1988 = loadSeasonFile(1988);
    expect(HISTORICAL_BEST_N[1988]).toBe(11);

    // With historical dropped scores (Best 11 of 16): Senna wins with 90 pts vs Prost 87 pts
    const withDrops = calculateSimulatedStandings(1988, s1988.rounds, {
      systemId: '1961_1990',
      applyDroppedScores: true,
      bestN: 11
    });

    const champWithDrops = withDrops[0];
    const secondWithDrops = withDrops[1];

    expect(champWithDrops.driverId).toBe('ayrton-senna');
    expect(champWithDrops.simulatedPoints).toBe(90);
    expect(secondWithDrops.driverId).toBe('alain-prost');
    expect(secondWithDrops.simulatedPoints).toBe(87);

    // Under Uncapped All Races Count: Prost wins with 105 gross pts vs Senna 94 gross pts!
    const uncapped = calculateSimulatedStandings(1988, s1988.rounds, {
      systemId: '1961_1990',
      applyDroppedScores: false
    });

    const champUncapped = uncapped[0];
    const secondUncapped = uncapped[1];

    expect(champUncapped.driverId).toBe('alain-prost');
    expect(champUncapped.simulatedPoints).toBe(105);
    expect(secondUncapped.driverId).toBe('ayrton-senna');
    expect(secondUncapped.simulatedPoints).toBe(94);
  });

  it('2008 Hamilton vs Massa: evaluates championship under modern 25-18-15 system', () => {
    const s2008 = loadSeasonFile(2008);

    // Historically (10-8-6-5-4-3-2-1), Hamilton won 98 to 97 (1 pt difference)
    const originalStanding = calculateSimulatedStandings(2008, s2008.rounds, {
      systemId: '2003_2009'
    });
    expect(originalStanding[0].driverId).toBe('lewis-hamilton');
    expect(originalStanding[0].simulatedPoints).toBe(98);
    expect(originalStanding[1].driverId).toBe('felipe-massa');
    expect(originalStanding[1].simulatedPoints).toBe(97);

    // Under Modern 25-18-15: Massa had 6 wins vs Hamilton 5 wins, let us verify point totals
    const modernStanding = calculateSimulatedStandings(2008, s2008.rounds, {
      systemId: 'modern',
      applyFastestLapPoint: false
    });
    expect(modernStanding[0].simulatedPoints).toBeGreaterThan(200);
    expect(modernStanding[1].simulatedPoints).toBeGreaterThan(200);
  });

  it('2021 Verstappen vs Hamilton: handles Spa half-points & sprints', () => {
    const s2021 = loadSeasonFile(2021);

    // Check round 12 (Spa) is marked half-points
    const spaRound = s2021.rounds.find(r => r.round === 12);
    expect(spaRound?.isHalfPoints).toBe(true);

    const standings = calculateSimulatedStandings(2021, s2021.rounds, {
      systemId: 'modern',
      includeSprints: true,
      applyFastestLapPoint: true
    });

    // Max Verstappen won the 2021 World Championship on countback/points
    expect(standings[0].driverId).toBe('max-verstappen');
    expect(standings[0].isChampion).toBe(true);
    expect(standings[1].driverId).toBe('lewis-hamilton');
  });

  it('1951 French GP shared car: divides finish points equally among co-drivers', () => {
    const s1951 = loadSeasonFile(1951);
    const reimsRound = s1951.rounds.find(r => r.round === 4);
    expect(reimsRound).toBeDefined();

    // Verify Fagioli and Fangio shared the win (pos 1) in round 4
    const p1Finishes = reimsRound!.results.filter(r => r.finishPosition === 1);
    expect(p1Finishes.length).toBe(2);

    // In modern 25-pt system, 25 / 2 = 12.5 points each
    const standings = calculateSimulatedStandings(1951, [reimsRound!], {
      systemId: 'modern',
      applyFastestLapPoint: false
    });

    const fagioli = standings.find(d => d.driverId === 'luigi-fagioli');
    const fangio = standings.find(d => d.driverId === 'juan-manuel-fangio');

    expect(fagioli?.simulatedPoints).toBe(12.5);
    expect(fangio?.simulatedPoints).toBe(12.5);
  });

  it('Ecclestone Medals System: awards championship to driver with most race wins', () => {
    const s1988 = loadSeasonFile(1988);
    const medalStandings = calculateSimulatedStandings(1988, s1988.rounds, {
      systemId: 'medals'
    });

    // Senna had 8 wins vs Prost 7 wins
    expect(medalStandings[0].driverId).toBe('ayrton-senna');
    expect(medalStandings[0].wins).toBe(8);
    expect(medalStandings[1].driverId).toBe('alain-prost');
    expect(medalStandings[1].wins).toBe(7);
  });
});
