import { del, get, set } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

export const IDB_CACHE_KEY = 'f1-archive-rq-idb-v1';
export const LEGACY_LS_KEYS = ['F1_QUERY_CACHE', 'REACT_QUERY_OFFLINE_CACHE'] as const;

export const PERSISTABLE_QUERY_ROOTS = new Set<string>([
  'f1-meta',
  'seasons-index',
  'standings-summary',
  'standings',
]);

export const BLOCKED_QUERY_SUBSTRINGS = [
  'telemetry',
  'strategy',
  'openf1',
  'teammates',
  'season-detail',
  'season-classification',
  'sqlite',
  'historian',
  'circuit-geometry',
] as const;

export function clearLegacyLocalStorageCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const key of LEGACY_LS_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore errors in sandboxed environments or private browsing
  }
}

export function shouldPersistQueryKey(queryKey: readonly unknown[]): boolean {
  if (!queryKey || queryKey.length === 0) return false;
  const root = String(queryKey[0] ?? '');
  if (!PERSISTABLE_QUERY_ROOTS.has(root)) {
    return false;
  }
  for (const part of queryKey) {
    const partStr = String(part ?? '').toLowerCase();
    for (const blocked of BLOCKED_QUERY_SUBSTRINGS) {
      if (partStr.includes(blocked)) {
        return false;
      }
    }
  }
  return true;
}

export function createIDBPersister(idbValidKey: IDBValidKey = IDB_CACHE_KEY): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(idbValidKey, client);
      } catch {
        // Silently degrade in restricted contexts (e.g. private browsing or no IndexedDB)
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(idbValidKey);
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(idbValidKey);
      } catch {
        // Ignore errors
      }
    },
  };
}
