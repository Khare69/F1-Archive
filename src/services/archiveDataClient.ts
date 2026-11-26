/**
 * F1 // ARCHIVE — Archive Data Client
 * Lazy, on-demand HTTP fetching of pre-indexed F1DB datasets from /data/
 * Eliminates static generated JSON imports in client bundles, drastically lowering memory and bundle size.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  Driver,
  Team,
  Season,
  Circuit,
  F1DBMetadata,
  SeasonClassificationFile,
  TeammateH2HRecord
} from '../types/f1';

export type SeasonClassification = SeasonClassificationFile;

function resolveDataUrl(relativePath: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${origin}${cleanPath}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load archive data from ${url} (HTTP ${res.status})`);
  }
  return res.json();
}

// ── Lazy Loaders ──

export async function fetchDriversIndex(): Promise<Driver[]> {
  return fetchJson<Driver[]>(resolveDataUrl('/data/index/drivers.json'));
}

export async function fetchConstructorsIndex(): Promise<Team[]> {
  return fetchJson<Team[]>(resolveDataUrl('/data/index/constructors.json'));
}

export async function fetchCircuitsIndex(): Promise<Circuit[]> {
  return fetchJson<Circuit[]>(resolveDataUrl('/data/index/circuits.json'));
}

export async function fetchSeasonsIndex(): Promise<Season[]> {
  return fetchJson<Season[]>(resolveDataUrl('/data/index/seasons.json'));
}

export async function fetchArchiveMeta(): Promise<F1DBMetadata> {
  return fetchJson<F1DBMetadata>(resolveDataUrl('/data/index/meta.json'));
}

export async function fetchSeasonClassification(year: number | string): Promise<SeasonClassification> {
  return fetchJson<SeasonClassification>(resolveDataUrl(`/data/seasons/${year}.json`));
}

export async function fetchTeammatesMap(): Promise<Record<string, TeammateH2HRecord>> {
  return fetchJson<Record<string, TeammateH2HRecord>>(resolveDataUrl('/data/teammates.json'));
}

export async function fetchCircuitSpline(circuitId: string): Promise<unknown> {
  return fetchJson<unknown>(resolveDataUrl(`/data/circuits/${circuitId}.json`));
}

// ── React Query Hooks ──

export function useDriversIndex(): UseQueryResult<Driver[], Error> {
  return useQuery({
    queryKey: ['archive_drivers_index'],
    queryFn: fetchDriversIndex,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useConstructorsIndex(): UseQueryResult<Team[], Error> {
  return useQuery({
    queryKey: ['archive_constructors_index'],
    queryFn: fetchConstructorsIndex,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useCircuitsIndex(): UseQueryResult<Circuit[], Error> {
  return useQuery({
    queryKey: ['archive_circuits_index'],
    queryFn: fetchCircuitsIndex,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSeasonsIndex(): UseQueryResult<Season[], Error> {
  return useQuery({
    queryKey: ['archive_seasons_index'],
    queryFn: fetchSeasonsIndex,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useArchiveMeta(): UseQueryResult<F1DBMetadata, Error> {
  return useQuery({
    queryKey: ['archive_meta'],
    queryFn: fetchArchiveMeta,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSeasonClassificationQuery(year: number | string): UseQueryResult<SeasonClassification, Error> {
  return useQuery({
    queryKey: ['archive_season_classification', String(year)],
    queryFn: () => fetchSeasonClassification(year),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: Boolean(year),
  });
}

export function useTeammatesMap(): UseQueryResult<Record<string, TeammateH2HRecord>, Error> {
  return useQuery({
    queryKey: ['archive_teammates_map'],
    queryFn: fetchTeammatesMap,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
