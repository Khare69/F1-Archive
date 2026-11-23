import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOpenF1CarData, type OpenF1CarDataPoint } from './openF1Client';

describe('OpenF1 Client (Tier 2 LRU & Parameter Bounds)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects queries missing sessionKey or driverNumber', async () => {
    await expect(
      fetchOpenF1CarData({
        sessionKey: 0,
        driverNumber: 44,
        dateStart: '2024-07-07T14:00:00Z',
        dateEnd: '2024-07-07T14:02:00Z'
      })
    ).rejects.toThrow('sessionKey and driverNumber are mandatory parameters');
  });

  it('rejects queries missing dateStart or dateEnd bounds to prevent massive downloads', async () => {
    await expect(
      fetchOpenF1CarData({
        sessionKey: 9550,
        driverNumber: 44,
        dateStart: '',
        dateEnd: ''
      })
    ).rejects.toThrow('dateStart and dateEnd time-window bounds are mandatory');
  });

  it('fetches, downsamples dense payloads, and caches in in-memory LRU', async () => {
    // Generate 600 mock samples
    const mockDenseSamples: OpenF1CarDataPoint[] = Array.from({ length: 600 }, (_, i) => ({
      date: `2024-07-07T14:00:${String(Math.floor(i / 10)).padStart(2, '0')}Z`,
      driver_number: 44,
      rpm: 11000 + i,
      speed: 200 + (i % 100),
      n_gear: 7,
      throttle: 100,
      brake: 0,
      drs: 1
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDenseSamples
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchOpenF1CarData({
      sessionKey: 9550,
      driverNumber: 44,
      dateStart: '2024-07-07T14:00:00Z',
      dateEnd: '2024-07-07T14:01:30Z'
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Downsampled from 600 to 350
    expect(result.length).toBe(350);
    expect(result[0].speed).toBe(mockDenseSamples[0].speed);
    expect(result[result.length - 1].speed).toBe(mockDenseSamples[599].speed);

    // Second call should hit the LRU in-memory cache without hitting fetch
    const cachedResult = await fetchOpenF1CarData({
      sessionKey: 9550,
      driverNumber: 44,
      dateStart: '2024-07-07T14:00:00Z',
      dateEnd: '2024-07-07T14:01:30Z'
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(cachedResult.length).toBe(350);
  });

  it('gracefully falls back to empty array on HTTP error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429
    }));

    const result = await fetchOpenF1CarData({
      sessionKey: 9999,
      driverNumber: 1,
      dateStart: '2024-07-07T14:00:00Z',
      dateEnd: '2024-07-07T14:01:30Z'
    });

    expect(result).toEqual([]);
  });
});
