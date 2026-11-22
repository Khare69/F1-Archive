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
  specs: TeamSpecs;
}

export interface RaceFinish {
  race: string;
  position: number | string;
}

export interface Driver {
  id: string;
  name: string;
  number: number;
  teamId: string;
  wins: number;
  podiums: number;
  championships: number;
  country: string;
  imageUrl?: string;
  isLegend?: boolean;
  raceFinishes: RaceFinish[];
}

export interface Season {
  year: number;
  races: number;
  championDriver: string;
  championTeam: string;
  championDriverId?: string;
  championTeamId?: string;
  notableEvents: string[];
  recordsBroken: string[];
}

export interface Circuit {
  id: string;
  name: string;
  country: string;
  city: string;
  lengthKm: string;
  turns: number;
  lapRecord: string;
  lapRecordHolder: string;
  firstGP: number;
  drsZones: number;
  elevation: string;
  type: 'Street' | 'Permanent' | 'Semi-Permanent';
  description: string;
  trackCoordinates?: [number, number, number][];
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

