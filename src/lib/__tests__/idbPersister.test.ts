import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldPersistQueryKey,
  clearLegacyLocalStorageCache,
  createIDBPersister,
  IDB_CACHE_KEY
} from '../idbPersister';
import { set, get, del } from 'idb-keyval';
import type { PersistedClient } from '@tanstack/react-query-persist-client';

vi.mock('idb-keyval', () => ({
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn()
}));

describe('IndexedDB React Query Persister (F-35, C-15)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('shouldPersistQueryKey allowlist', () => {
    it('returns true for allowlisted root keys with no blocked substrings', () => {
      expect(shouldPersistQueryKey(['f1-meta'])).toBe(true);
      expect(shouldPersistQueryKey(['seasons-index'])).toBe(true);
      expect(shouldPersistQueryKey(['standings-summary'])).toBe(true);
      expect(shouldPersistQueryKey(['standings'])).toBe(true);
      expect(shouldPersistQueryKey(['standings', '2024'])).toBe(true);
    });

    it('returns false for heavy or blocked query keys', () => {
      expect(shouldPersistQueryKey(['season-detail', 2024])).toBe(false);
      expect(shouldPersistQueryKey(['teammates'])).toBe(false);
      expect(shouldPersistQueryKey(['telemetry', 'monza'])).toBe(false);
      expect(shouldPersistQueryKey(['strategy', 'pitwall'])).toBe(false);
      expect(shouldPersistQueryKey(['openf1', 'session-1234'])).toBe(false);
      expect(shouldPersistQueryKey(['sqlite', 'q1'])).toBe(false);
      expect(shouldPersistQueryKey(['historian'])).toBe(false);
      expect(shouldPersistQueryKey(['circuit-geometry', 'spa'])).toBe(false);
      expect(shouldPersistQueryKey(['standings', 'telemetry-mix'])).toBe(false);
    });

    it('returns false for arbitrary unallowlisted keys or empty keys', () => {
      expect(shouldPersistQueryKey([])).toBe(false);
      expect(shouldPersistQueryKey(['season', 2024])).toBe(false);
      expect(shouldPersistQueryKey(['driver-profile', 'VER'])).toBe(false);
      expect(shouldPersistQueryKey(['circuit-info', 'monza'])).toBe(false);
    });
  });

  describe('clearLegacyLocalStorageCache', () => {
    it('purges F1_QUERY_CACHE and REACT_QUERY_OFFLINE_CACHE from localStorage', () => {
      window.localStorage.setItem('F1_QUERY_CACHE', '{"queries":[]}');
      window.localStorage.setItem('REACT_QUERY_OFFLINE_CACHE', '{"queries":[]}');
      window.localStorage.setItem('keep_me', 'preserved_value');

      clearLegacyLocalStorageCache();

      expect(window.localStorage.getItem('F1_QUERY_CACHE')).toBeNull();
      expect(window.localStorage.getItem('REACT_QUERY_OFFLINE_CACHE')).toBeNull();
      expect(window.localStorage.getItem('keep_me')).toBe('preserved_value');
    });
  });

  describe('createIDBPersister implementation', () => {
    it('persists, restores, and removes clients via idb-keyval', async () => {
      const dummyClient: PersistedClient = {
        timestamp: 1700000000000,
        buster: 'f1-archive-idb-v3',
        clientState: { queries: [], mutations: [] }
      };

      vi.mocked(set).mockResolvedValueOnce(undefined);
      vi.mocked(get).mockResolvedValueOnce(dummyClient);
      vi.mocked(del).mockResolvedValueOnce(undefined);

      const persister = createIDBPersister(IDB_CACHE_KEY);

      await persister.persistClient(dummyClient);
      expect(set).toHaveBeenCalledWith(IDB_CACHE_KEY, dummyClient);

      const restored = await persister.restoreClient();
      expect(get).toHaveBeenCalledWith(IDB_CACHE_KEY);
      expect(restored).toEqual(dummyClient);

      await persister.removeClient();
      expect(del).toHaveBeenCalledWith(IDB_CACHE_KEY);
    });

    it('gracefully catches errors when IndexedDB operations fail', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('QuotaExceeded'));
      vi.mocked(get).mockRejectedValueOnce(new Error('DatabaseCorrupt'));
      vi.mocked(del).mockRejectedValueOnce(new Error('PermissionDenied'));

      const persister = createIDBPersister(IDB_CACHE_KEY);

      const dummyClient: PersistedClient = {
        timestamp: 1700000000000,
        buster: 'f1-archive-idb-v3',
        clientState: { queries: [], mutations: [] }
      };

      await expect(persister.persistClient(dummyClient)).resolves.not.toThrow();
      const restored = await persister.restoreClient();
      expect(restored).toBeUndefined();
      await expect(persister.removeClient()).resolves.not.toThrow();
    });
  });
});
