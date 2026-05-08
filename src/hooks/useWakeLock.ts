import { useCallback, useEffect, useRef, useState } from 'react';

export interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  request: () => Promise<void>;
  release: () => Promise<void>;
  reacquire: () => Promise<void>;
}

export const useWakeLock = (enabled: boolean, shouldBeActive: boolean): WakeLockState => {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef(shouldBeActive);
  const enabledRef = useRef(enabled);
  const [isSupported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    shouldBeActiveRef.current = shouldBeActive;
    enabledRef.current = enabled;
  }, [enabled, shouldBeActive]);

  const release = useCallback(async () => {
    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        await sentinelRef.current.release();
      }
    } catch {
      // Wake Lock can already be released by the browser; that is safe to ignore.
    } finally {
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  const request = useCallback(async () => {
    if (!enabledRef.current || !shouldBeActiveRef.current) return;
    if (!navigator.wakeLock) {
      setIsActive(false);
      setError('Wake Lock API is not supported');
      return;
    }
    if (document.visibilityState !== 'visible') return;

    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        setIsActive(true);
        setError(null);
        return;
      }

      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);
      setError(null);

      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
        }
        setIsActive(false);
      });
    } catch (err) {
      sentinelRef.current = null;
      setIsActive(false);
      setError(err instanceof Error ? err.message : 'Wake Lock request failed');
    }
  }, []);

  const reacquire = useCallback(async () => {
    await release();
    await request();
  }, [release, request]);

  useEffect(() => {
    if (enabled && shouldBeActive) {
      void request();
    } else {
      void release();
    }

    return () => {
      void release();
    };
  }, [enabled, shouldBeActive, request, release]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabledRef.current && shouldBeActiveRef.current) {
        void request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [request]);

  return {
    isSupported,
    isActive,
    error,
    request,
    release,
    reacquire
  };
};
