import { useState, useEffect, useCallback } from 'react';

const STORAGE_FIRST_VISIT = 'f1_first_visit';

export function useUserPreferences() {
  // First visit state (defaults to true if never set)
  const [isFirstVisit, setIsFirstVisitState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_FIRST_VISIT);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  // Reduced motion media query detection
  const [hasReducedMotion, setHasReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Slow connection detection
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return false;
    const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (!conn) return false;
    return conn.saveData === true || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
  });

  // Listen to prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setHasReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setFirstVisit = useCallback((value: boolean) => {
    setIsFirstVisitState(value);
    try {
      localStorage.setItem(STORAGE_FIRST_VISIT, String(value));
    } catch (e) {
      console.warn('Unable to access localStorage', e);
    }
  }, []);

  return {
    isFirstVisit,
    setFirstVisit,
    hasReducedMotion,
    isSlowConnection
  };
}
