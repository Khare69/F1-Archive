import { type z } from 'zod';
import { UpstreamApiError } from './liveApiSchemas';

export interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 300;

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

/**
 * Robust JSON fetcher with runtime Zod validation, AbortController timeouts,
 * 429 rate-limit defense, and automatic retry on 502/503/504 gateway failures.
 */
export async function fetchValidatedJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: FetchOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    let isTimeout = false;

    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    // Forward external signal if provided
    let unbindSignal: (() => void) | undefined;
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        controller.abort();
      } else {
        const onAbort = () => {
          clearTimeout(timeoutId);
          controller.abort();
        };
        options.signal.addEventListener('abort', onAbort, { once: true });
        unbindSignal = () => options.signal?.removeEventListener('abort', onAbort);
      }
    }

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      unbindSignal?.();

      // Immediate 429 Rate Limit exit (never retry to avoid hammering upstream)
      if (res.status === 429) {
        throw new UpstreamApiError(
          `Upstream API rate limited (HTTP 429) at ${url}`,
          'RATE_LIMITED',
          { status: 429, url }
        );
      }

      // Retry on 502/503/504 server gateway issues if attempts remain
      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < maxRetries) {
          attempt++;
          const backoff = retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        throw new UpstreamApiError(
          `Upstream HTTP error ${res.status} at ${url}`,
          'HTTP_ERROR',
          { status: res.status, url }
        );
      }

      let rawJson: unknown;
      try {
        rawJson = await res.json();
      } catch (err) {
        throw new UpstreamApiError(
          `Invalid JSON response from ${url}: ${err instanceof Error ? err.message : String(err)}`,
          'SCHEMA_DRIFT',
          { status: res.status, url }
        );
      }

      const parseResult = schema.safeParse(rawJson);
      if (!parseResult.success) {
        throw new UpstreamApiError(
          `Schema validation failed for ${url}: ${parseResult.error.message}`,
          'SCHEMA_DRIFT',
          { status: res.status, url, details: parseResult.error.issues }
        );
      }

      return parseResult.data;
    } catch (err) {
      clearTimeout(timeoutId);
      unbindSignal?.();

      if (err instanceof UpstreamApiError) {
        throw err;
      }

      if (isTimeout) {
        throw new UpstreamApiError(
          `Request timeout after ${timeoutMs}ms at ${url}`,
          'TIMEOUT',
          { url }
        );
      }

      // Check for AbortError from caller or network drop
      if (err instanceof Error && err.name === 'AbortError') {
        if (options.signal?.aborted) {
          throw new UpstreamApiError(`Request aborted by caller at ${url}`, 'NETWORK', { url });
        }
        throw new UpstreamApiError(
          `Request timeout after ${timeoutMs}ms at ${url}`,
          'TIMEOUT',
          { url }
        );
      }

      // Retry network errors if attempts remain
      if (attempt < maxRetries) {
        attempt++;
        const backoff = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw new UpstreamApiError(
        `Network error accessing ${url}: ${err instanceof Error ? err.message : String(err)}`,
        'NETWORK',
        { url }
      );
    }
  }
}
