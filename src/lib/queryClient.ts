import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { safeStorage } from '../utils/safeStorage';

export const QUERY_PERSIST_BUSTER = 'v1';

/**
 * Checks whether an error is a client error (4xx) that should NOT be retried
 */
export function isNonRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // Check status property
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      const status = (error as { status: number }).status;
      if (status >= 400 && status < 500) {
        return true;
      }
    }
    // Check message property
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      const msg = (error as { message: string }).message;
      if (msg.includes('404') || msg.includes('429') || msg.includes('400') || msg.includes('403')) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Factory for creating fresh QueryClient instances (useful in tests and app root)
 */
export function createConfiguredQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours (must be >= maxAge for persister)
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Rule 3: Skip 4xx errors (especially 404/429) and retry up to 2 times only on network/5xx
          if (isNonRetryableError(error)) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}

export const queryClient = createConfiguredQueryClient();

export const queryPersister = createSyncStoragePersister({
  storage: safeStorage,
  key: 'F1_QUERY_CACHE',
});
