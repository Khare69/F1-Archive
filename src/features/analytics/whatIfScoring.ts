import type { SeasonRoundClassification, RaceFinisherResult } from '../../types/f1';

export type ScoringPresetId = 'modern' | '2003_2009' | '1991_2002' | '1961_1990' | '1950_1959' | 'medals';

export interface ScoringSystemDef {
  id: ScoringPresetId;
  name: string;
  era: string;
  points: number[];
  description: string;
}

export const SCORING_PRESETS: Record<ScoringPresetId, ScoringSystemDef> = {
  modern: {
    id: 'modern',
    name: 'Modern FIA Standard (25-18-15)',
    era: '2010–Present',
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    description: 'Current 10-place scoring system introduced in 2010. Emphasizes race victories with 25 points for P1.'
  },
  '2003_2009': {
    id: '2003_2009',
    name: 'V10/V8 Mid-Era (10-8-6-5-4-3-2-1)',
    era: '2003–2009',
    points: [10, 8, 6, 5, 4, 3, 2, 1],
    description: 'Narrow points gap between P1 (10 pts) and P2 (8 pts) designed to reward reliability and consistency.'
  },
  '1991_2002': {
    id: '1991_2002',
    name: 'V10 High-Win Era (10-6-4-3-2-1)',
    era: '1991–2002',
    points: [10, 6, 4, 3, 2, 1],
    description: 'Top 6 finishers scored points, with a 4-point win premium (10 for P1 vs 6 for P2).'
  },
  '1961_1990': {
    id: '1961_1990',
    name: 'Classic Golden Era (9-6-4-3-2-1)',
    era: '1961–1990',
    points: [9, 6, 4, 3, 2, 1],
    description: 'Used throughout the DFV, Ground Effect, and Turbo eras. Top 6 finishers scored.'
  },
  '1950_1959': {
    id: '1950_1959',
    name: 'Inaugural Grand Prix (8-6-4-3-2)',
    era: '1950–1959',
    points: [8, 6, 4, 3, 2],
    description: 'Only the top 5 finishers scored points. 1 bonus point was famously awarded for Fastest Lap.'
  },
  medals: {
    id: 'medals',
    name: "Ecclestone's Medals System (Most Wins)",
    era: 'Proposed',
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    description: 'Championship awarded strictly to the driver with the most victories. Points used solely as a tie-breaker.'
  }
};

export interface WhatIfScoringOptions {
  systemId: ScoringPresetId;
  applyFastestLapPoint?: boolean;
  includeSprints?: boolean;
  applyDroppedScores?: boolean;
  bestN?: number;
}

export interface DriverSimStanding {
  driverId: string;
  driverCode: string;
  driverName: string;
  constructorId: string;
  constructorName?: string;
  simulatedPoints: number;
  originalPoints: number;
  simulatedRank: number;
  originalRank: number;
  rankDiff: number;
  pointsDiff: number;
  wins: number;
  podiums: number;
  finishPositionsCount: Record<number, number>;
  isChampion: boolean;
  wasOriginalChampion: boolean;
  grossPoints?: number;
  droppedPoints?: number;
}

// Historical Best-N rules for classic dropped score eras
export const HISTORICAL_BEST_N: Record<number, number> = {
  1950: 4, 1951: 4, 1952: 4, 1953: 4,
  1954: 5, 1955: 5, 1956: 5, 1957: 5,
  1958: 6, 1959: 5, 1960: 6, 1961: 5,
  1962: 5, 1963: 6, 1964: 6, 1965: 6,
  1966: 5, 1967: 9, 1968: 10, 1969: 9,
  1970: 11, 1971: 9, 1972: 10, 1973: 13,
  1974: 13, 1975: 12, 1976: 14, 1977: 15,
  1978: 14, 1979: 8, 1980: 10, 1981: 11,
  1982: 11, 1983: 11, 1984: 11, 1985: 11,
  1986: 11, 1987: 11, 1988: 11, 1989: 11,
  1990: 11
};

/**
 * Full FIA Countback Tie-Breaker
 * Compares finish frequencies from P1 descending through all classified positions.
 * Returns negative if A is ahead of B, positive if B is ahead of A, 0 if identical.
 */
export function fiaCountbackTieBreaker(
  a: { finishPositionsCount: Record<number, number> },
  b: { finishPositionsCount: Record<number, number> },
  maxPos: number = 30
): number {
  for (let pos = 1; pos <= maxPos; pos++) {
    const countA = a.finishPositionsCount[pos] || 0;
    const countB = b.finishPositionsCount[pos] || 0;
    if (countA !== countB) {
      return countB - countA; // Higher count of this position ranks higher
    }
  }
  return 0;
}

/**
 * Pure calculation engine for the Cross-Era "What-If" Championship Simulator.
 * Deterministic, unit-tested, and handles all 5 historical edge cases:
 * 1. FIA full-spectrum countback tie-breaker
 * 2. Pre-1991 dropped-score rules (Best-N vs Uncapped toggle)
 * 3. 1950s shared-drive cars (points split equally among co-drivers)
 * 4. Shortened half-points races (scaled by 0.5)
 * 5. Independent Sprint Points & Fastest Lap Point toggles
 */
export function calculateSimulatedStandings(
  year: number,
  rounds: SeasonRoundClassification[],
  options: WhatIfScoringOptions
): DriverSimStanding[] {
  const preset = SCORING_PRESETS[options.systemId] || SCORING_PRESETS.modern;
  const systemPoints = preset.points;
  const isMedals = options.systemId === 'medals';
  const includeSprints = options.includeSprints !== false;
  const applyFL = Boolean(options.applyFastestLapPoint);

  // Driver accumulator
  interface DriverAcc {
    driverId: string;
    driverCode: string;
    driverName: string;
    constructorId: string;
    constructorName?: string;
    originalPoints: number;
    roundScores: number[];
    sprintPoints: number;
    wins: number;
    podiums: number;
    finishPositionsCount: Record<number, number>;
  }

  const driversMap = new Map<string, DriverAcc>();

  const getOrCreateDriver = (res: RaceFinisherResult): DriverAcc => {
    let d = driversMap.get(res.driverId);
    if (!d) {
      d = {
        driverId: res.driverId,
        driverCode: res.driverCode || res.driverId.slice(0, 3).toUpperCase(),
        driverName: res.driverName,
        constructorId: res.constructorId,
        constructorName: res.constructorName,
        originalPoints: 0,
        roundScores: [],
        sprintPoints: 0,
        wins: 0,
        podiums: 0,
        finishPositionsCount: {}
      };
      driversMap.set(res.driverId, d);
    }
    return d;
  };

  // Process all rounds
  for (const round of rounds) {
    if (round.isCancelled) continue;

    // Count shared drivers per finish position in this round
    const posCounts: Record<number, number> = {};
    for (const res of round.results) {
      if (res.finishPosition) {
        posCounts[res.finishPosition] = (posCounts[res.finishPosition] || 0) + 1;
      }
    }

    // Award main race points
    for (const res of round.results) {
      const driver = getOrCreateDriver(res);
      driver.originalPoints += res.points;

      let roundPts = 0;
      if (res.finishPosition && res.finishPosition > 0) {
        const pos = res.finishPosition;
        driver.finishPositionsCount[pos] = (driver.finishPositionsCount[pos] || 0) + 1;

        if (pos === 1) driver.wins++;
        if (pos <= 3) driver.podiums++;

        // Base points for finish position
        let basePts = systemPoints[pos - 1] || 0;

        // Shared car split: in F1 history, co-drivers sharing a car share the finish position
        const sharedDivisor = (posCounts[pos] && posCounts[pos] > 1) ? posCounts[pos] : 1;
        basePts /= sharedDivisor;

        // Half points rule
        if (round.isHalfPoints) {
          basePts *= 0.5;
        }

        roundPts += basePts;

        // Fastest lap bonus point
        if (applyFL && res.fastestLap) {
          const eligibleForFL = (options.systemId === '1950_1959') ? true : pos <= 10;
          if (eligibleForFL) {
            roundPts += round.isHalfPoints ? 0.5 : 1;
          }
        }
      }

      driver.roundScores.push(roundPts);
    }

    // Process Sprint points if present and enabled
    if (includeSprints && round.hasSprint && round.sprintResults) {
      for (const sres of round.sprintResults) {
        const driver = getOrCreateDriver(sres);
        driver.originalPoints += sres.points;

        if (sres.finishPosition && sres.finishPosition > 0) {
          // Standard modern sprint points: 8, 7, 6, 5, 4, 3, 2, 1
          const sprintScale = year === 2021 ? [3, 2, 1] : [8, 7, 6, 5, 4, 3, 2, 1];
          const spts = sprintScale[sres.finishPosition - 1] || 0;
          driver.sprintPoints += spts;
        }
      }
    }
  }

  // Calculate simulated totals (handling dropped scores if requested)
  const bestN = options.bestN || HISTORICAL_BEST_N[year];
  const shouldDrop = Boolean(options.applyDroppedScores && bestN && bestN > 0);

  const standingsList: DriverSimStanding[] = [];

  for (const driver of driversMap.values()) {
    const grossPoints = driver.roundScores.reduce((sum, s) => sum + s, 0);
    let netRacePoints = grossPoints;
    let droppedPoints = 0;

    if (shouldDrop && bestN && driver.roundScores.length > bestN) {
      const sortedScores = [...driver.roundScores].sort((a, b) => b - a);
      const counting = sortedScores.slice(0, bestN);
      netRacePoints = counting.reduce((sum, s) => sum + s, 0);
      droppedPoints = grossPoints - netRacePoints;
    }

    const totalSimPoints = netRacePoints + driver.sprintPoints;

    standingsList.push({
      driverId: driver.driverId,
      driverCode: driver.driverCode,
      driverName: driver.driverName,
      constructorId: driver.constructorId,
      constructorName: driver.constructorName,
      simulatedPoints: Math.round(totalSimPoints * 10) / 10,
      originalPoints: Math.round(driver.originalPoints * 10) / 10,
      simulatedRank: 0,
      originalRank: 0,
      rankDiff: 0,
      pointsDiff: Math.round((totalSimPoints - driver.originalPoints) * 10) / 10,
      wins: driver.wins,
      podiums: driver.podiums,
      finishPositionsCount: driver.finishPositionsCount,
      isChampion: false,
      wasOriginalChampion: false,
      grossPoints: shouldDrop ? Math.round(grossPoints * 10) / 10 : undefined,
      droppedPoints: shouldDrop ? Math.round(droppedPoints * 10) / 10 : undefined
    });
  }

  // Determine Original Rankings (using originalPoints + countback)
  standingsList.sort((a, b) => {
    if (b.originalPoints !== a.originalPoints) {
      return b.originalPoints - a.originalPoints;
    }
    return fiaCountbackTieBreaker(a, b);
  });
  standingsList.forEach((d, idx) => {
    d.originalRank = idx + 1;
    if (idx === 0) d.wasOriginalChampion = true;
  });

  // Determine Simulated Rankings
  standingsList.sort((a, b) => {
    if (isMedals) {
      // Medals system: most wins ranks highest; points break ties
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.simulatedPoints !== a.simulatedPoints) return b.simulatedPoints - a.simulatedPoints;
      return fiaCountbackTieBreaker(a, b);
    }

    if (b.simulatedPoints !== a.simulatedPoints) {
      return b.simulatedPoints - a.simulatedPoints;
    }
    return fiaCountbackTieBreaker(a, b);
  });

  standingsList.forEach((d, idx) => {
    d.simulatedRank = idx + 1;
    d.rankDiff = d.originalRank - d.simulatedRank;
    if (idx === 0) d.isChampion = true;
  });

  return standingsList;
}
