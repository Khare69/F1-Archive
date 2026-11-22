import { useMemo } from 'react';
import {
  getAllTeams,
  getAllDrivers,
  getAllCircuits,
  getAllSeasons,
  getArchiveStats,
  getTeamById,
  getDriverById,
  getCircuitById,
  getSeasonByYear
} from '../data/dataService';
import type { Team, Driver, Circuit, Season } from '../types/f1';

export interface ArchiveQueryResult<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

/**
 * useTeams
 * Wrapper hook providing future-proof asynchronous interface for team records.
 */
export function useTeams(): ArchiveQueryResult<Team[]> {
  const data = useMemo(() => getAllTeams(), []);
  return { data, isLoading: false, isError: false };
}

/**
 * useDrivers
 * Wrapper hook providing future-proof asynchronous interface for driver records.
 */
export function useDrivers(): ArchiveQueryResult<Driver[]> {
  const data = useMemo(() => getAllDrivers(), []);
  return { data, isLoading: false, isError: false };
}

/**
 * useCircuits
 * Wrapper hook providing future-proof asynchronous interface for circuit records.
 */
export function useCircuits(): ArchiveQueryResult<Circuit[]> {
  const data = useMemo(() => getAllCircuits(), []);
  return { data, isLoading: false, isError: false };
}

/**
 * useSeasons
 * Wrapper hook providing future-proof asynchronous interface for season records.
 */
export function useSeasons(): ArchiveQueryResult<Season[]> {
  const data = useMemo(() => getAllSeasons(), []);
  return { data, isLoading: false, isError: false };
}

/**
 * useArchiveStats
 * Wrapper hook providing aggregated statistics.
 */
export function useArchiveStats() {
  const data = useMemo(() => getArchiveStats(), []);
  return { data, isLoading: false, isError: false };
}

export {
  getTeamById,
  getDriverById,
  getCircuitById,
  getSeasonByYear
};
