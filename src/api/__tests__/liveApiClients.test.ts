import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { fetchValidatedJson } from '../httpClient';
import { UpstreamApiError } from '../liveApiSchemas';

describe('fetchValidatedJson & Upstream Boundary Resiliency', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testSchema = z.object({
    id: z.string(),
    value: z.coerce.number().finite(),
  });

  it('successfully fetches, validates, and parses compliant payloads', async () => {
    const mockPayload = { id: 'test-1', value: 42 };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPayload,
      })
    );

    const result = await fetchValidatedJson('https://api.example.com/data', testSchema);
    expect(result).toEqual({ id: 'test-1', value: 42 });
  });

  it('coerces numeric values safely when stringified numbers arrive', async () => {
    const mockPayload = { id: 'test-2', value: '123' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPayload,
      })
    );

    const result = await fetchValidatedJson('https://api.example.com/data', testSchema);
    expect(result.value).toBe(123);
  });

  it('immediately throws RATE_LIMITED on HTTP 429 without retrying', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      fetchValidatedJson('https://api.example.com/rate-limited', testSchema, { maxRetries: 3 })
    ).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(UpstreamApiError);
      const apiErr = err as UpstreamApiError;
      expect(apiErr.code).toBe('RATE_LIMITED');
      expect(apiErr.status).toBe(429);
      return true;
    });

    // Confirms no retries were performed on 429
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable 503 gateway status and succeeds on subsequent attempt', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'recovered', value: 99 }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchValidatedJson('https://api.example.com/flaky', testSchema, {
      maxRetries: 2,
      retryDelayMs: 10,
    });

    expect(result).toEqual({ id: 'recovered', value: 99 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws HTTP_ERROR on unhandled 500 error after attempts', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      fetchValidatedJson('https://api.example.com/server-error', testSchema, { maxRetries: 0 })
    ).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(UpstreamApiError);
      const apiErr = err as UpstreamApiError;
      expect(apiErr.code).toBe('HTTP_ERROR');
      expect(apiErr.status).toBe(500);
      return true;
    });
  });

  it('throws SCHEMA_DRIFT when upstream payload violates Zod schema contract', async () => {
    const badPayload = { id: 'invalid', value: 'not-a-number' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => badPayload,
      })
    );

    await expect(
      fetchValidatedJson('https://api.example.com/corrupt', testSchema)
    ).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(UpstreamApiError);
      const apiErr = err as UpstreamApiError;
      expect(apiErr.code).toBe('SCHEMA_DRIFT');
      expect(apiErr.details).toBeDefined();
      return true;
    });
  });

  it('throws TIMEOUT when request exceeds configured timeout window', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, { signal }) => {
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      })
    );

    await expect(
      fetchValidatedJson('https://api.example.com/hanging', testSchema, {
        timeoutMs: 50,
        maxRetries: 0,
      })
    ).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(UpstreamApiError);
      const apiErr = err as UpstreamApiError;
      expect(apiErr.code).toBe('TIMEOUT');
      return true;
    });
  });
});
