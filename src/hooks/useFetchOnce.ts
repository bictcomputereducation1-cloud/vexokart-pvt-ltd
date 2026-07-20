import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache } from '../lib/apiCache';

interface UseFetchOnceOptions {
  ttl?: number;
  immediate?: boolean;
}

export function useFetchOnce<T>(
  cacheKey: string,
  fetchFn: (signal?: AbortSignal) => Promise<T>,
  options?: UseFetchOnceOptions
) {
  const { ttl, immediate = true } = options || {};
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const executeFetch = useCallback(
    async (forceRefetch = false) => {
      const abortController = new AbortController();
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await apiCache.fetchOnce<T>(cacheKey, fetchFn, {
          ttl,
          forceRefetch,
          signal: abortController.signal,
        });

        if (isMounted.current) {
          setData(result);
        }
        return result;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`[useFetchOnce] Request aborted for key: "${cacheKey}"`);
          return null;
        }
        if (isMounted.current) {
          setError(err as Error);
        }
        throw err;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [cacheKey, fetchFn, ttl]
  );

  useEffect(() => {
    isMounted.current = true;
    if (immediate) {
      executeFetch(false).catch((err) => {
        console.error(`[useFetchOnce] Auto-fetch error for key "${cacheKey}":`, err);
      });
    }

    return () => {
      isMounted.current = false;
    };
  }, [cacheKey, immediate, executeFetch]);

  const refetch = useCallback(() => {
    return executeFetch(true);
  }, [executeFetch]);

  return { data, setData, loading, error, refetch };
}
