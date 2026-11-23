import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface PerfStats {
  fps: number;
  frameTimeMs: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  heapMb: number | null;
}

type PerfListener = (stats: PerfStats) => void;
const listeners = new Set<PerfListener>();

/**
 * Safe detection of Chromium-only window.performance.memory without throwing on Firefox/Safari
 */
export function getSafeHeapSizeMb(): number | null {
  if (
    typeof window !== 'undefined' &&
    'performance' in window &&
    'memory' in (performance as unknown as { memory?: { usedJSHeapSize?: number } })
  ) {
    const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
    if (typeof mem?.usedJSHeapSize === 'number') {
      return Math.round(mem.usedJSHeapSize / (1024 * 1024));
    }
  }
  return null;
}

let currentStats: PerfStats = {
  fps: 60,
  frameTimeMs: 16.6,
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  heapMb: null
};

function emitStats(stats: PerfStats) {
  currentStats = stats;
  listeners.forEach((l) => l(stats));
}

/**
 * PerfDebugCollector
 * Placed inside any <Canvas> (CarsArchive, Track3DViewer, GhostLapViewer3D)
 * Samples gl.info at 2 Hz without DOM interference or React re-renders
 */
export const PerfDebugCollector: React.FC = () => {
  const { gl } = useThree();
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useFrame(() => {
    framesRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    // Sample every 500ms (2 Hz)
    if (elapsed >= 500) {
      const calculatedFps = Math.round((framesRef.current * 1000) / elapsed);
      const frameTime = Number((elapsed / Math.max(1, framesRef.current)).toFixed(1));
      const heap = getSafeHeapSizeMb();

      emitStats({
        fps: calculatedFps,
        frameTimeMs: frameTime,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        heapMb: heap
      });

      framesRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
};

/**
 * PerfDebugOverlay
 * Placed in standard HTML DOM. Updates via direct DOM refs for 0 React re-renders
 * Activated via URL (?debug=perf) or Keyboard shortcut (Shift + P)
 */
export const PerfDebugOverlay: React.FC = () => {
  const [isDebug, setIsDebug] = useState(false);

  const fpsRef = useRef<HTMLSpanElement>(null);
  const frameTimeRef = useRef<HTMLSpanElement>(null);
  const drawsRef = useRef<HTMLSpanElement>(null);
  const trianglesRef = useRef<HTMLSpanElement>(null);
  const geometriesRef = useRef<HTMLSpanElement>(null);
  const texturesRef = useRef<HTMLSpanElement>(null);
  const heapRef = useRef<HTMLSpanElement>(null);

  // Check URL query param and keyboard shortcut Shift + P
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'perf') {
        setIsDebug(true);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        // Ignore if typing in text inputs
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          return;
        }
        setIsDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subscribe to 2 Hz emitter and update DOM elements directly
  useEffect(() => {
    if (!isDebug) return;

    const listener = (stats: PerfStats) => {
      if (fpsRef.current) {
        fpsRef.current.textContent = `${stats.fps}`;
        fpsRef.current.className = `perf-val ${stats.fps < 40 ? 'perf-warn' : 'perf-good'}`;
      }
      if (frameTimeRef.current) {
        frameTimeRef.current.textContent = `${stats.frameTimeMs} ms`;
      }
      if (drawsRef.current) {
        drawsRef.current.textContent = `${stats.calls}`;
      }
      if (trianglesRef.current) {
        trianglesRef.current.textContent = stats.triangles.toLocaleString();
      }
      if (geometriesRef.current) {
        geometriesRef.current.textContent = `${stats.geometries}`;
      }
      if (texturesRef.current) {
        texturesRef.current.textContent = `${stats.textures}`;
      }
      if (heapRef.current) {
        heapRef.current.textContent = stats.heapMb !== null ? `${stats.heapMb} MB` : 'N/A';
      }
    };

    // Initial populate
    listener(currentStats);

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [isDebug]);

  if (!isDebug) return null;

  return (
    <div className="perf-debug-box telemetry" role="region" aria-label="GPU Performance Profiler">
      <div className="perf-debug-header">
        <span className="perf-blip"></span>
        <span>// GPU PROFILER (?debug=perf)</span>
        <button
          type="button"
          className="perf-debug-close"
          onClick={() => setIsDebug(false)}
          title="Close profiler (Shift+P)"
          aria-label="Close profiler"
        >
          ×
        </button>
      </div>
      <div className="perf-debug-row">
        <span>FPS / TIME:</span>
        <span className="perf-val">
          <span ref={fpsRef} className="perf-good">{currentStats.fps}</span>
          {' / '}
          <span ref={frameTimeRef} className="perf-muted">{currentStats.frameTimeMs} ms</span>
        </span>
      </div>
      <div className="perf-debug-row">
        <span>DRAWS:</span>
        <span ref={drawsRef} className="perf-val">{currentStats.calls}</span>
      </div>
      <div className="perf-debug-row">
        <span>TRIANGLES:</span>
        <span ref={trianglesRef} className="perf-val">{currentStats.triangles.toLocaleString()}</span>
      </div>
      <div className="perf-debug-row">
        <span>GEOMETRIES:</span>
        <span ref={geometriesRef} className="perf-val">{currentStats.geometries}</span>
      </div>
      <div className="perf-debug-row">
        <span>TEXTURES:</span>
        <span ref={texturesRef} className="perf-val">{currentStats.textures}</span>
      </div>
      <div className="perf-debug-row">
        <span>JS HEAP:</span>
        <span ref={heapRef} className="perf-val">
          {currentStats.heapMb !== null ? `${currentStats.heapMb} MB` : 'N/A'}
        </span>
      </div>
      <div className="perf-debug-footer">
        <span>Press <kbd>Shift + P</kbd> to toggle</span>
      </div>
    </div>
  );
};
