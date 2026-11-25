/**
 * F1 // ARCHIVE — ETL Type Definitions
 */

export interface RawCircuit {
  id: string;
  name: string;
  fullName?: string;
  previousNames?: string[];
  type: 'STREET' | 'ROAD' | 'RACE' | 'SEMI_PERMANENT' | string;
  placeName?: string;
  countryId: string;
  latitude?: number;
  longitude?: number;
  length?: number;
  turns?: number;
  drsZones?: number;
  elevation?: string | number;
  lapRecord?: string;
  lapRecordHolder?: string;
  firstRaceYear?: number;
}

export interface RawCircuitLayout {
  circuitId: string;
  year: number;
  length?: number;
  turns?: number;
  effective?: boolean;
}

export interface RawConstructor {
  id: string;
  name: string;
  fullName?: string;
  countryId: string;
  totalChampionshipWins?: number;
  totalRaceWins?: number;
  totalRaceEntries?: number;
  totalPolePositions?: number;
  totalFastestLaps?: number;
  firstRaceEntryYear?: number;
}

export interface RawDriver {
  id: string;
  name: string;
  fullName?: string;
  countryId: string;
  permanentNumber?: number;
  dateOfBirth?: string;
  totalChampionshipWins?: number;
  totalRaceWins?: number;
  totalPodiums?: number;
  totalPolePositions?: number;
  totalFastestLaps?: number;
  totalRaceStarts?: number;
  totalPoints?: number;
}

export interface RawRace {
  id: number;
  year: number;
  round: number;
  date?: string;
  circuitId: string;
  circuitLayoutId?: number;
  officialName?: string;
  sprintDate?: string;
}

export interface RawCountry {
  id: string;
  name: string;
  code?: string;
}

export interface RawSeasonDriverStanding {
  year: number;
  positionDisplayOrder: number;
  positionNumber?: number;
  positionText?: string;
  driverId: string;
  points?: number;
  championshipWon?: boolean;
}

export interface RawSeasonConstructorStanding {
  year: number;
  positionDisplayOrder: number;
  positionNumber?: number;
  positionText?: string;
  constructorId: string;
  points?: number;
  championshipWon?: boolean;
}

export interface RawResult {
  raceId: number;
  year: number;
  round: number;
  driverId: string;
  constructorId: string;
  positionNumber?: number;
  positionText?: string;
  positionDisplayOrder?: number;
  gridPositionNumber?: number;
  points?: number;
  fastestLap?: boolean;
  sharedCar?: boolean;
}

export interface RawSprintResult {
  raceId: number;
  year: number;
  round: number;
  driverId: string;
  constructorId: string;
  positionNumber?: number;
  positionText?: string;
  points?: number;
}

export interface RawSeason {
  year: number;
}

export interface RawRacesDriverStanding {
  raceId: number;
  driverId: string;
  positionNumber?: number;
  points?: number;
}

export interface RawRacesConstructorStanding {
  raceId: number;
  constructorId: string;
  positionNumber?: number;
  points?: number;
}

export interface GeoFeature {
  type: string;
  properties: {
    Name?: string;
    Location?: string;
    Country?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export interface GeoJSONCollection {
  type: string;
  features: GeoFeature[];
}

export interface TeamConfig {
  name: string;
  color: string;
  carName: string;
  base: string;
  principal: string;
  powerUnit: string;
  downforce: string;
  topSpeed: string;
  weight: string;
  isLegendary: boolean;
  isActive2026: boolean;
  specs2026?: {
    powerUnit: string;
    weight: string;
    activeAero: boolean;
  };
}
