import React, { useState, useEffect, lazy, Suspense } from 'react';

const PerfDebugOverlay = lazy(() =>
  import('../../features/cars/components/PerfDebugOverlay').then((m) => ({
    default: m.PerfDebugOverlay,
  }))
);

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('.cm-content') || target.closest('.cm-editor')) return true;
  return false;
}

export const LazyPerfDebugOverlay: React.FC = () => {
  const [active, setActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === 'perf';
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'P' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isEditableElement(e.target)) {
          e.preventDefault();
          setActive((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!active) return null;

  return (
    <Suspense fallback={null}>
      <PerfDebugOverlay />
    </Suspense>
  );
};
