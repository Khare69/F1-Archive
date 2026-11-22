import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/mocks/server';
import { mockFutureRoundZeroTotalResponse } from '../test/mocks/fixtures';
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchSeasonSchedule,
  useDriverStandingsQuery,
  useConstructorStandingsQuery,
  useSeasonScheduleQuery,
  clearApiCache
} from './jolpicaClient';
import { safeStorage } from '../utils/safeStorage';

describe('Jolpica F1 API Client & MSW v2 Resiliency', () => {
  beforeEach(() => {
    safeStorage.clear();
    clearApiCache();
  });

  describe('Happy Paths (2026 22-Driver & 11-Constructor Datasets)', () => {
    it('should successfully fetch 22 drivers across all 11 active constructors', async () => {
      const response = await fetchDriverStandings('2026');
      expect(response).toBeDefined();
      expect(response.source).toBe('live');
      expect(response.data.standings).toHaveLength(22);

      const leader = response.data.standings[0];
      expect(leader.position).toBe(1);
      expect(leader.driverCode).toBe('ANT');
      expect(leader.driverName).toBe('Andrea Kimi Antonelli');
      expect(leader.constructorName).toBe('Mercedes');
      expect(leader.points).toBe(25);

      // Verify presence of 11th team entries
      const cadillacDrivers = response.data.standings.filter(
        (d) => d.constructorId === 'cadillac'
      );
      expect(cadillacDrivers).toHaveLength(2);
    });

    it('should successfully fetch 11 constructor standings for the 2026 season', async () => {
      const response = await fetchConstructorStandings('2026');
      expect(response).toBeDefined();
      expect(response.source).toBe('live');
      expect(response.data.standings).toHaveLength(11);

      const leader = response.data.standings[0];
      expect(leader.position).toBe(1);
      expect(leader.constructorName).toBe('Mercedes');
      expect(leader.points).toBe(33);

      const constructors = response.data.standings.map((c) => c.constructorId);
      expect(constructors).toContain('audi');
      expect(constructors).toContain('cadillac');
    });

    it('should successfully fetch the race calendar schedule', async () => {
      const response = await fetchSeasonSchedule('2026');
      expect(response).toBeDefined();
      expect(response.source).toBe('live');
      expect(response.data.races.length).toBeGreaterThan(0);

      const roundOne = response.data.races[0];
      expect(roundOne.round).toBe(1);
      expect(roundOne.raceName).toBe('Bahrain Grand Prix');
      expect(roundOne.circuitName).toBe('Bahrain International Circuit');
    });
  });

  describe('Failure Paths & Edge Cases', () => {
    it('should gracefully fallback to curated vault data on HTTP 429 Rate Limit', async () => {
      server.use(
        http.get('https://api.jolpi.ca/ergast/f1/:year/driverStandings.json', () => {
          return new HttpResponse(null, { status: 429, statusText: 'Too Many Requests' });
        })
      );

      const response = await fetchDriverStandings('current');
      expect(response.source).toBe('fallback');
      expect(response.data.standings.length).toBeGreaterThan(0);
      expect(response.data.standings[0].driverName).toBeTruthy();
      expect(response.error).toMatch(/429/);
    });

    it('should gracefully fallback to curated vault data on HTTP 500 Internal Server Error', async () => {
      server.use(
        http.get('https://api.jolpi.ca/ergast/f1/:year/constructorStandings.json', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      const response = await fetchConstructorStandings('current');
      expect(response.source).toBe('fallback');
      expect(response.data.standings.length).toBeGreaterThan(0);
      expect(response.data.standings[0].constructorName).toBeTruthy();
      expect(response.error).toMatch(/500/);
    });

    it('should gracefully handle HTTP 200 with total: "0" (future unrun round) by falling back to curated data', async () => {
      server.use(
        http.get('https://api.jolpi.ca/ergast/f1/:year/driverStandings.json', () => {
          return HttpResponse.json(mockFutureRoundZeroTotalResponse);
        })
      );

      const response = await fetchDriverStandings('future_season');
      expect(response.source).toBe('fallback');
      expect(response.data.standings.length).toBeGreaterThan(0);
    });
  });

  describe('TanStack Query Hooks with fresh QueryClient', () => {
    function createTestQueryClient() {
      return new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0
          }
        }
      });
    }

    function createWrapper() {
      const testClient = createTestQueryClient();
      return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: testClient }, children);
    }

    it('useDriverStandingsQuery hook resolves with live data', async () => {
      const { result } = renderHook(() => useDriverStandingsQuery('2026'), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.source).toBe('live');
      expect(result.current.data?.data.standings).toHaveLength(22);
    });

    it('useConstructorStandingsQuery hook resolves with live data', async () => {
      const { result } = renderHook(() => useConstructorStandingsQuery('2026'), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.source).toBe('live');
      expect(result.current.data?.data.standings).toHaveLength(11);
    });

    it('useSeasonScheduleQuery hook resolves with live data', async () => {
      const { result } = renderHook(() => useSeasonScheduleQuery('2026'), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.source).toBe('live');
      expect(result.current.data?.data.races.length).toBeGreaterThan(0);
    });
  });
});
