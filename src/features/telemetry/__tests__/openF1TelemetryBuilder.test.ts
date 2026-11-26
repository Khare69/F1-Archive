import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import {
  buildOpenF1TelemetryComparison,
  globalOpenF1LRUCache,
} from '../openF1TelemetryBuilder';
import { UpstreamApiError } from '../../../api/liveApiSchemas';

describe('openF1TelemetryBuilder', () => {
  const mockSessionKey = 9999;
  const driverA = 1;
  const driverB = 4;

  const mockLapsA = [
    {
      session_key: mockSessionKey,
      driver_number: driverA,
      lap_number: 12,
      lap_duration: 88.5,
      date_start: '2024-07-07T14:15:00.000Z',
      duration_sector_1: 28.5,
      duration_sector_2: 36.2,
      duration_sector_3: 23.8,
      is_pit_out_lap: false,
    },
  ];

  const mockLapsB = [
    {
      session_key: mockSessionKey,
      driver_number: driverB,
      lap_number: 14,
      lap_duration: 89.1,
      date_start: '2024-07-07T14:18:00.000Z',
      duration_sector_1: 28.7,
      duration_sector_2: 36.4,
      duration_sector_3: 24.0,
      is_pit_out_lap: false,
    },
  ];

  const generateCarPoints = (driverNumber: number) =>
    Array.from({ length: 25 }, (_, i) => ({
      date: new Date(Date.now() + i * 200).toISOString(),
      driver_number: driverNumber,
      rpm: 11000 + i * 50,
      speed: 250 + (i % 5) * 15,
      n_gear: 7,
      throttle: 95,
      brake: 0,
      drs: i > 15 ? 1 : 0,
    }));

  beforeEach(() => {
    globalOpenF1LRUCache.clear();
  });

  it('assembles a validated 200-sample live_openf1 telemetry showdown pack', async () => {
    server.use(
      http.get('https://api.openf1.org/v1/laps', ({ request }) => {
        const url = new URL(request.url);
        const drv = url.searchParams.get('driver_number');
        if (drv === '1') return HttpResponse.json(mockLapsA);
        return HttpResponse.json(mockLapsB);
      }),
      http.get('https://api.openf1.org/v1/car_data', ({ request }) => {
        const url = new URL(request.url);
        const drv = url.searchParams.get('driver_number');
        return HttpResponse.json(generateCarPoints(Number(drv)));
      })
    );

    const pack = await buildOpenF1TelemetryComparison(mockSessionKey, driverA, driverB);

    expect(pack.provenance).toBe('live_openf1');
    expect(pack.driverA.samples.length).toBe(200);
    expect(pack.driverB.samples.length).toBe(200);
    expect(pack.driverA.topSpeed).toBeGreaterThan(0);
    expect(pack.driverB.topSpeed).toBeGreaterThan(0);
    expect(globalOpenF1LRUCache.size()).toBe(1);
  });

  it('serves from in-memory LRU cache on repeat requests without re-fetching', async () => {
    let fetchCount = 0;
    server.use(
      http.get('https://api.openf1.org/v1/laps', () => {
        fetchCount++;
        return HttpResponse.json(mockLapsA);
      }),
      http.get('https://api.openf1.org/v1/car_data', () => {
        return HttpResponse.json(generateCarPoints(1));
      })
    );

    // First fetch populates cache
    await buildOpenF1TelemetryComparison(1001, 1, 4);
    const initialFetches = fetchCount;
    expect(initialFetches).toBeGreaterThan(0);

    // Second fetch should hit LRU cache directly
    const cachedPack = await buildOpenF1TelemetryComparison(1001, 1, 4);
    expect(fetchCount).toBe(initialFetches);
    expect(cachedPack.slug).toBe('openf1-1001-1-vs-4');
  });

  it('strictly caps LRU cache at 10 entries, evicting the oldest entry on the 11th insert', async () => {
    server.use(
      http.get('https://api.openf1.org/v1/laps', () => HttpResponse.json(mockLapsA)),
      http.get('https://api.openf1.org/v1/car_data', () => HttpResponse.json(generateCarPoints(1)))
    );

    for (let i = 1; i <= 11; i++) {
      await buildOpenF1TelemetryComparison(2000 + i, 1, 4);
    }

    expect(globalOpenF1LRUCache.size()).toBe(10);
    // Oldest entry (2001) should have been evicted
    expect(globalOpenF1LRUCache.get('2001_1_4')).toBeNull();
    // Latest entry (2011) should still be in cache
    expect(globalOpenF1LRUCache.get('2011_1_4')).not.toBeNull();
  });

  it('handles empty lap data cleanly by throwing UpstreamApiError (404)', async () => {
    server.use(
      http.get('https://api.openf1.org/v1/laps', () => {
        return HttpResponse.json([]);
      })
    );

    await expect(
      buildOpenF1TelemetryComparison(8888, 1, 4, { bypassCache: true })
    ).rejects.toThrow(UpstreamApiError);
  });

  it('handles HTTP 429 rate limiting gracefully by throwing UpstreamApiError', async () => {
    server.use(
      http.get('https://api.openf1.org/v1/laps', () => {
        return new HttpResponse('Rate limited', { status: 429 });
      })
    );

    await expect(
      buildOpenF1TelemetryComparison(7777, 1, 4, { bypassCache: true })
    ).rejects.toThrow(UpstreamApiError);
  });
});
