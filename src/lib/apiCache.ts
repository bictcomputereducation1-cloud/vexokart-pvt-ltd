/**
 * In-memory API and Supabase response cache with query deduplication.
 * Prevents duplicate active requests, caches data across page navigations,
 * and handles React StrictMode duplicates.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// Global in-memory storage for cached values
const cacheStore: Record<string, CacheEntry<any>> = {};

// Global in-memory storage for active promises (Deduplication)
const activePromises: Record<string, Promise<any>> = {};

// Default cache validity duration (e.g., 5 minutes)
const DEFAULT_TTL = 5 * 60 * 1000;

export const apiCache = {
  /**
   * Fetch data once, caching the result and deduplicating in-flight parallel requests.
   * If a request with the same cacheKey is already in progress, it returns the existing promise.
   * If valid cached data exists, it returns the cached data immediately.
   */
  async fetchOnce<T>(
    cacheKey: string,
    fetchFn: (signal?: AbortSignal) => Promise<T>,
    options?: { ttl?: number; forceRefetch?: boolean; signal?: AbortSignal }
  ): Promise<T> {
    const ttl = options?.ttl ?? DEFAULT_TTL;
    const forceRefetch = options?.forceRefetch ?? false;

    // 1. If not forcing refetch, check if we have valid cached data
    if (!forceRefetch) {
      const cached = cacheStore[cacheKey];
      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log(`[apiCache] Cache HIT for key: "${cacheKey}"`);
        return cached.data as T;
      }
    }

    // 2. Check if a request is already in progress for this key (Deduplication)
    if (activePromises[cacheKey]) {
      console.log(`[apiCache] Deduplicating request. Reusing active promise for key: "${cacheKey}"`);
      return activePromises[cacheKey] as Promise<T>;
    }

    // 3. Execute the fetch, storing the promise for deduplication
    console.log(`[apiCache] Fetching fresh data for key: "${cacheKey}"`);
    const promise = fetchFn(options?.signal)
      .then((data) => {
        // Store in cache
        cacheStore[cacheKey] = {
          data,
          timestamp: Date.now(),
        };
        // Clean up active promise tracking
        delete activePromises[cacheKey];
        return data;
      })
      .catch((err) => {
        // Clean up active promise tracking on failure so subsequent attempts can retry
        delete activePromises[cacheKey];
        throw err;
      });

    activePromises[cacheKey] = promise;
    return promise;
  },

  /**
   * Set cache manually
   */
  set(key: string, data: any): void {
    cacheStore[key] = {
      data,
      timestamp: Date.now(),
    };
  },

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    console.log(`[apiCache] Invalidating cache for key: "${key}"`);
    delete cacheStore[key];
    delete activePromises[key];
  },

  /**
   * Invalidate cache keys matching a pattern (e.g., starting with 'admin_')
   */
  invalidatePattern(prefix: string): void {
    console.log(`[apiCache] Invalidating cache keys starting with: "${prefix}"`);
    Object.keys(cacheStore).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete cacheStore[key];
      }
    });
    Object.keys(activePromises).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete activePromises[key];
      }
    });
  },

  /**
   * Clear all cached data (e.g., on user logout)
   */
  clearAll(): void {
    console.log("[apiCache] Clearing all cached responses.");
    Object.keys(cacheStore).forEach((key) => delete cacheStore[key]);
    Object.keys(activePromises).forEach((key) => delete activePromises[key]);
  },
};
