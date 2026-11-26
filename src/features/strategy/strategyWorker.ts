import {
  runMonteCarloStrategies,
  sanitizeStrategyParams,
  type StrategyEngineParams,
  type StrategySimulationResult,
} from './strategyMath';
import { runStrategySimulation, type SimulationConfig } from './strategySimulationEngine';

export interface WorkerStartMessage {
  type: 'start';
  config: SimulationConfig;
  requestId?: number;
}

export interface StrategyWorkerDispatchMessage {
  requestId: number;
  params: Partial<StrategyEngineParams>;
}

export interface WorkerProgressMessage {
  type: 'progress';
  progress: number;
  requestId?: number;
}

export interface WorkerCompleteMessage {
  type: 'complete';
  output: ReturnType<typeof runStrategySimulation>;
  requestId?: number;
}

export interface StrategyWorkerSuccessMessage {
  requestId: number;
  result: StrategySimulationResult;
  computeTimeMs: number;
}

export interface StrategyWorkerErrorMessage {
  requestId: number;
  error: string;
}

export type WorkerInMessage =
  | WorkerStartMessage
  | StrategyWorkerDispatchMessage;

export type WorkerOutMessage =
  | WorkerProgressMessage
  | WorkerCompleteMessage
  | StrategyWorkerSuccessMessage
  | StrategyWorkerErrorMessage;

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;
  if (!data) return;

  // Modern requestId + StrategyEngineParams protocol (P6-FIX-02, P6-DEV-04)
  if ('requestId' in data && 'params' in data && data.params) {
    const { requestId, params } = data;
    try {
      const sanitized = sanitizeStrategyParams(params);
      const result = runMonteCarloStrategies(sanitized);
      self.postMessage({
        requestId,
        result,
        computeTimeMs: result.computeTimeMs,
      } as StrategyWorkerSuccessMessage);
    } catch (err: unknown) {
      console.error('[StrategyWorker] Simulation failed for request', requestId, err);
      self.postMessage({
        requestId,
        error: err instanceof Error ? err.message : String(err),
      } as StrategyWorkerErrorMessage);
    }
    return;
  }

  // Legacy SimulationConfig protocol
  if ('type' in data && data.type === 'start') {
    try {
      const output = runStrategySimulation(data.config, (progress) => {
        self.postMessage({
          type: 'progress',
          progress,
          requestId: data.requestId,
        } as WorkerProgressMessage);
      });
      self.postMessage({
        type: 'complete',
        output,
        requestId: data.requestId,
      } as WorkerCompleteMessage);
    } catch (err) {
      console.error('[StrategyWorker] Simulation failed:', err);
    }
  }
};
