export interface TeamSpecs {
  powerUnit: string;
  chassis: string;
  weight: string;
  downforce: string;
  topSpeed: string;
}

export interface Team {
  id: string;
  name: string;
  carName: string;
  color: string;
  base: string;
  principal: string;
  championships: number;
  logoUrl?: string;
  description: string;
  firstEntry: number;
  polePositions: number;
  fastestLaps: number;
  isLegendary?: boolean;
  isActive2026?: boolean;
  specs: TeamSpecs;
}

export interface RaceFinish {
  race: string;
  position: number | string;
}

export interface Driver {
  id: string;
  slug?: string;
  code?: string;
  name: string;
  fullName?: string;
  number: number | null;
  teamId: string;
  wins: number;
  podiums: number;
  championships: number;
  polePositions?: number;
  fastestLaps?: number;
  starts?: number;
  winRate?: number;
  podiumRate?: number;
  country: string;
  dateOfBirth?: string | null;
  imageUrl?: string;
  isLegend?: boolean;
  isActive2026?: boolean;
  raceFinishes: RaceFinish[];
}

export interface Season {
  year: number;
  races: number;
  championDriver: string;
  championTeam: string;
  championDriverId?: string | null;
  championTeamId?: string | null;
  notableEvents: string[];
  recordsBroken: string[];
  isCancelled?: boolean;
}

export interface Circuit {
  id: string;
  name: string;
  country: string;
  city: string;
  lengthKm: string;
  turns: number;
  lapRecord: string | null;
  lapRecordHolder: string | null;
  firstGP: number;
  drsZones: number | null;
  elevation: string;
  type: 'Street' | 'Permanent' | 'Semi-Permanent';
  description: string;
  poleToWinRate?: number | null;
  trackCoordinates?: [number, number, number][];
}

export interface F1DBMetadata {
  f1dbVersion: string;
  syncedAt: string;
  license: string;
  attribution: string;
  recordCounts: {
    seasons: number;
    constructors: number;
    drivers: number;
    circuits: number;
  };
}

export interface LiveDriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  permanentNumber: string;
  nationality: string;
  constructorId: string;
  constructorName: string;
}

export interface LiveConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  constructorName: string;
  nationality: string;
}

export interface RaceScheduleRound {
  round: number;
  raceName: string;
  circuitName: string;
  locality: string;
  country: string;
  date: string;
  time?: string;
  url?: string;
}

export interface CarSetupConfig {
  teamId: string;
  driverId: string;
  circuitId: string;
  downforce: 'LOW' | 'MEDIUM' | 'HIGH';
  tyreCompound: 'SOFT' | 'MEDIUM' | 'HARD' | 'WET';
  engineMode: 'BALANCED' | 'OVERTAKE' | 'QUALIFYING';
}

export interface SimulatedLapResult {
  topSpeedKmH: number;
  lateralGForce: number;
  lapTimeSeconds: number;
  lapTimeFormatted: string;
  deltaToRecordSeconds: number;
  deltaFormatted: string;
  isFasterThanRecord: boolean;
  tyreGripPercent: number;
  aeroDragRating: string;
}

export interface UserPreferences {
  isFirstVisit: boolean;
  hasReducedMotion: boolean;
  isSlowConnection: boolean;
}

export interface QueryMetadata<T> {
  data: T;
  source: 'live' | 'cached' | 'fallback';
  updatedAt: number;
  error?: string;
}

