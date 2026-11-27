/**
 * F1 // ARCHIVE — Pure Driver Comparison Metrics Engine
 * Deterministic mathematical calculations, era-normalization, and teammate H2H pairing.
 */

export interface ComparableDriver {
  id: string;
  slug?: string;
  code?: string;
  name: string;
  teamId?: string;
  country: string;
  wins: number;
  podiums: number;
  championships: number;
  polePositions?: number;
  fastestLaps?: number;
  starts?: number;
  winRate?: number;
  podiumRate?: number;
  pointsSharePct?: number;
  number?: number | null;
  imageUrl?: string;
  isLegend?: boolean;
  birthDate?: string | null;
  dateOfBirth?: string | null;
}

export interface ComparisonMetricRow {
  key: string;
  label: string;
  leftValue: number | null;
  rightValue: number | null;
  leftFormatted: string;
  rightFormatted: string;
  delta: number | null;
  winner: 'left' | 'right' | 'tie' | 'none';
  higherIsBetter: boolean;
}

export interface RawTeammateH2HRecord {
  racesTogether: number;
  bothFinishedRaces?: number;
  bothFinishedWinsA?: number;
  bothFinishedWinsB?: number;
  allStartsWinsA?: number;
  allStartsWinsB?: number;
  outqualifiedA?: number;
  outqualifiedB?: number;
  pointsA?: number;
  pointsB?: number;
  // Legacy aliases
  driverAWins?: number;
  driverBWins?: number;
  driverAOutqualified?: number;
  driverBOutqualified?: number;
  driverAPoints?: number;
  driverBPoints?: number;
  years?: number[];
  constructors?: string[];
}

export interface OrientedTeammateH2H {
  racesTogether: number;
  bothFinishedRaces: number;
  leftBothFinishedWins: number;
  rightBothFinishedWins: number;
  leftAllStartsWins: number;
  rightAllStartsWins: number;
  leftQualiWins: number;
  rightQualiWins: number;
  leftPoints: number;
  rightPoints: number;
  years: number[];
  constructors: string[];
}

/**
 * Computes comparative metrics between two drivers in raw or era-normalized mode.
 * Guards against division by zero (starts === 0) returning formatted 'N/A' (never NaN / Infinity).
 */
export function computeComparisonRows(
  left: ComparableDriver,
  right: ComparableDriver,
  mode: 'raw' | 'normalized' = 'raw'
): ComparisonMetricRow[] {
  const leftStarts = left.starts ?? 0;
  const rightStarts = right.starts ?? 0;

  const leftPoles = left.polePositions ?? 0;
  const rightPoles = right.polePositions ?? 0;

  const leftFL = left.fastestLaps ?? 0;
  const rightFL = right.fastestLaps ?? 0;

  // Era-normalized career rates
  const leftWinRate = leftStarts > 0 ? (left.wins / leftStarts) * 100 : null;
  const rightWinRate = rightStarts > 0 ? (right.wins / rightStarts) * 100 : null;

  const leftPodiumRate = leftStarts > 0 ? (left.podiums / leftStarts) * 100 : null;
  const rightPodiumRate = rightStarts > 0 ? (right.podiums / rightStarts) * 100 : null;

  const leftPoleRate = leftStarts > 0 ? (leftPoles / leftStarts) * 100 : null;
  const rightPoleRate = rightStarts > 0 ? (rightPoles / rightStarts) * 100 : null;

  const leftPtsShare = typeof left.pointsSharePct === 'number' ? left.pointsSharePct : null;
  const rightPtsShare = typeof right.pointsSharePct === 'number' ? right.pointsSharePct : null;

  const buildRow = (
    key: string,
    label: string,
    lVal: number | null,
    rVal: number | null,
    formatter: (v: number | null) => string,
    higherIsBetter = true
  ): ComparisonMetricRow => {
    let winner: 'left' | 'right' | 'tie' | 'none' = 'none';

    if (lVal === null && rVal === null) {
      winner = 'tie';
    } else if (lVal === null) {
      winner = higherIsBetter ? 'right' : 'left';
    } else if (rVal === null) {
      winner = higherIsBetter ? 'left' : 'right';
    } else if (lVal === rVal) {
      winner = 'tie';
    } else if (higherIsBetter) {
      winner = lVal > rVal ? 'left' : 'right';
    } else {
      winner = lVal < rVal ? 'left' : 'right';
    }

    const delta = lVal !== null && rVal !== null ? Math.abs(lVal - rVal) : null;

    return {
      key,
      label,
      leftValue: lVal,
      rightValue: rVal,
      leftFormatted: formatter(lVal),
      rightFormatted: formatter(rVal),
      delta,
      winner,
      higherIsBetter,
    };
  };

  const formatCount = (v: number | null) => (v === null ? 'N/A' : String(v));
  const formatPct = (v: number | null) => (v === null ? 'N/A' : `${v.toFixed(1)}%`);

  if (mode === 'normalized') {
    return [
      buildRow('championships', 'WORLD CHAMPIONSHIPS', left.championships, right.championships, formatCount),
      buildRow('winRate', 'CAREER WIN RATE', leftWinRate, rightWinRate, formatPct),
      buildRow('podiumRate', 'PODIUM FINISH RATE', leftPodiumRate, rightPodiumRate, formatPct),
      buildRow('poleRate', 'POLE POSITION RATE', leftPoleRate, rightPoleRate, formatPct),
      buildRow('pointsShare', 'ERA POINTS SHARE %', leftPtsShare, rightPtsShare, formatPct),
      buildRow('starts', 'GRAND PRIX STARTS', leftStarts, rightStarts, formatCount),
    ];
  }

  return [
    buildRow('championships', 'WORLD CHAMPIONSHIPS', left.championships, right.championships, formatCount),
    buildRow('wins', 'GRAND PRIX WINS', left.wins, right.wins, formatCount),
    buildRow('podiums', 'PODIUM FINISHES', left.podiums, right.podiums, formatCount),
    buildRow('poles', 'POLE POSITIONS', leftPoles, rightPoles, formatCount),
    buildRow('fastestLaps', 'FASTEST LAPS', leftFL, rightFL, formatCount),
    buildRow('starts', 'GRAND PRIX STARTS', leftStarts, rightStarts, formatCount),
  ];
}

/**
 * Resolves teammate head-to-head records defensively.
 * Coalesces ETL property names and legacy aliases, inverting fields when leftSlug > rightSlug.
 */
export function resolveTeammatePair(
  teammatesMap: Record<string, RawTeammateH2HRecord> | undefined | null,
  leftSlug: string | null | undefined,
  rightSlug: string | null | undefined
): OrientedTeammateH2H | null {
  if (!teammatesMap || !leftSlug || !rightSlug) return null;

  const s1 = leftSlug.trim().toLowerCase();
  const s2 = rightSlug.trim().toLowerCase();

  // A driver cannot be their own teammate
  if (s1 === s2) return null;

  const isLeftFirst = s1 < s2;
  const firstSlug = isLeftFirst ? s1 : s2;
  const secondSlug = isLeftFirst ? s2 : s1;
  const pairKey = `${firstSlug}__${secondSlug}`;

  const rec = teammatesMap[pairKey];
  if (!rec) return null;

  // Extract raw values with robust property fallback
  const bothFinishedWinsA = rec.bothFinishedWinsA ?? rec.driverAWins ?? 0;
  const bothFinishedWinsB = rec.bothFinishedWinsB ?? rec.driverBWins ?? 0;

  const allStartsWinsA = rec.allStartsWinsA ?? rec.driverAWins ?? 0;
  const allStartsWinsB = rec.allStartsWinsB ?? rec.driverBWins ?? 0;

  const outqualiA = rec.outqualifiedA ?? rec.driverAOutqualified ?? 0;
  const outqualiB = rec.outqualifiedB ?? rec.driverBOutqualified ?? 0;

  const ptsA = rec.pointsA ?? rec.driverAPoints ?? 0;
  const ptsB = rec.pointsB ?? rec.driverBPoints ?? 0;

  const bothFinishedRaces = rec.bothFinishedRaces ?? (bothFinishedWinsA + bothFinishedWinsB);

  // If left was first in pairKey, left corresponds to A; otherwise invert
  if (isLeftFirst) {
    return {
      racesTogether: rec.racesTogether,
      bothFinishedRaces,
      leftBothFinishedWins: bothFinishedWinsA,
      rightBothFinishedWins: bothFinishedWinsB,
      leftAllStartsWins: allStartsWinsA,
      rightAllStartsWins: allStartsWinsB,
      leftQualiWins: outqualiA,
      rightQualiWins: outqualiB,
      leftPoints: ptsA,
      rightPoints: ptsB,
      years: rec.years ?? [],
      constructors: rec.constructors ?? [],
    };
  }

  return {
    racesTogether: rec.racesTogether,
    bothFinishedRaces,
    leftBothFinishedWins: bothFinishedWinsB,
    rightBothFinishedWins: bothFinishedWinsA,
    leftAllStartsWins: allStartsWinsB,
    rightAllStartsWins: allStartsWinsA,
    leftQualiWins: outqualiB,
    rightQualiWins: outqualiA,
    leftPoints: ptsB,
    rightPoints: ptsA,
    years: rec.years ?? [],
    constructors: rec.constructors ?? [],
  };
}
