import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface PerfStats {
  fps: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

type PerfListener = (stats: PerfStats) => void;
const listeners = new Set<PerfListener>();

let currentStats: PerfStats = {
  fps: 60,
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0
};

function emitStats(stats: PerfStats) {
  currentStats = stats;
  listeners.forEach((l) => l(stats));
}

/**
 * PerfDebugCollector
 * Placed inside <Canvas> to sample gl.info without DOM interference
 */
export const PerfDebugCollector: React.FC = () => {
  const { gl } = useThree();
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useFrame(() => {
    framesRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 500) {
      const elapsed = now - lastTimeRef.current;
      const calculatedFps = Math.round((framesRef.current * 1000) / elapsed);
      emitStats({
        fps: calculatedFps,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures
      });
      framesRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
};

/**
 * PerfDebugOverlay
 * Placed directly in standard HTML DOM inside .canvas-viewport-wrapper
 */
export const PerfDebugOverlay: React.FC = () => {
  const [isDebug, setIsDebug] = useState(false);
  const [stats, setStats] = useState<PerfStats>(currentStats);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsDebug(params.get('debug') === 'perf');
    }
    const listener = (newStats: PerfStats) => setStats(newStats);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!isDebug) return null;

  return (
    <div className="perf-debug-box telemetry">
      <div className="perf-debug-header">
        <span className="perf-blip"></span>
        <span>// GPU PROFILER (?debug=perf)</span>
      </div>
      <div className="perf-debug-row">
        <span>FPS:</span>
        <span className={`perf-val ${stats.fps < 40 ? 'perf-warn' : 'perf-good'}`}>
          {stats.fps}
        </span>
      </div>
      <div className="perf-debug-row">
        <span>DRAWS:</span>
        <span className="perf-val">{stats.calls}</span>
      </div>
      <div className="perf-debug-row">
        <span>TRIANGLES:</span>
        <span className="perf-val">{stats.triangles.toLocaleString()}</span>
      </div>
      <div className="perf-debug-row">
        <span>GEOMETRIES:</span>
        <span className="perf-val">{stats.geometries}</span>
      </div>
      <div className="perf-debug-row">
        <span>TEXTURES:</span>
        <span className="perf-val">{stats.textures}</span>
      </div>
    </div>
  );
};
