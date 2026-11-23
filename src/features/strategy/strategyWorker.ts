import { runStrategySimulation, type SimulationConfig } from './strategySimulationEngine';

export interface WorkerStartMessage {
  type: 'start';
  config: SimulationConfig;
}

export interface WorkerProgressMessage {
  type: 'progress';
  progress: number;
}

export interface WorkerCompleteMessage {
  type: 'complete';
  output: ReturnType<typeof runStrategySimulation>;
}

export type WorkerInMessage = WorkerStartMessage;
export type WorkerOutMessage = WorkerProgressMessage | WorkerCompleteMessage;

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  if (event.data?.type === 'start') {
    try {
      const output = runStrategySimulation(event.data.config, (progress) => {
        self.postMessage({ type: 'progress', progress } as WorkerProgressMessage);
      });
      self.postMessage({ type: 'complete', output } as WorkerCompleteMessage);
    } catch (err) {
      console.error('[StrategyWorker] Simulation failed:', err);
    }
  }
};
