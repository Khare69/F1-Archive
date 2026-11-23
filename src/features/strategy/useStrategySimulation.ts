import { useState, useEffect, useRef, useCallback } from 'react';
import {
  runStrategySimulation,
  type SimulationConfig,
  type SimulationOutput
} from './strategySimulationEngine';
import type { WorkerOutMessage } from './strategyWorker';

export function useStrategySimulation(initialConfig?: SimulationConfig) {
  const [config, setConfig] = useState<SimulationConfig | undefined>(initialConfig);
  const [output, setOutput] = useState<SimulationOutput | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = useCallback((cfg: SimulationConfig) => {
    // Terminate any previous in-flight worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setIsRunning(true);
    setProgress(0);

    // Fallback if Web Workers are unsupported in current runtime (e.g., test environment)
    if (typeof Worker === 'undefined') {
      try {
        const res = runStrategySimulation(cfg, (p) => setProgress(p));
        setOutput(res);
      } finally {
        setIsRunning(false);
        setProgress(100);
      }
      return;
    }

    try {
      const worker = new Worker(new URL('./strategyWorker.ts', import.meta.url), {
        type: 'module'
      });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
        if (e.data.type === 'progress') {
          setProgress(e.data.progress);
        } else if (e.data.type === 'complete') {
          setOutput(e.data.output);
          setIsRunning(false);
          setProgress(100);
        }
      };

      worker.onerror = (err) => {
        console.error('[useStrategySimulation] Worker error:', err);
        setIsRunning(false);
      };

      worker.postMessage({ type: 'start', config: cfg });
    } catch {
      // Inline fallback if worker instantiation fails (e.g., CSP or restricted origin)
      const res = runStrategySimulation(cfg, (p) => setProgress(p));
      setOutput(res);
      setIsRunning(false);
      setProgress(100);
    }
  }, []);

  // Debounced trigger on config change
  const triggerDebounced = useCallback((newConfig: SimulationConfig, delayMs: number = 150) => {
    setConfig(newConfig);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      startSimulation(newConfig);
    }, delayMs);
  }, [startSimulation]);

  // Initial simulation on mount if config provided
  useEffect(() => {
    if (initialConfig && !output && !isRunning) {
      startSimulation(initialConfig);
    }
  }, [initialConfig, output, isRunning, startSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    config,
    output,
    isRunning,
    progress,
    startSimulation,
    triggerDebounced
  };
}
