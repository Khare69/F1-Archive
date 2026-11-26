import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryStates, parseAsString, parseAsInteger, parseAsFloat } from 'nuqs';
import {
  type StrategyEngineParams,
  type StrategySimulationResult,
  DEFAULT_STRATEGY_PARAMS,
  sanitizeStrategyParams,
  runMonteCarloStrategies,
} from './strategyMath';
import { StrategyParamsPanel, CIRCUIT_PRESETS } from './StrategyParamsPanel';
import { PitWallAnalytics } from './components/PitWallAnalytics';
import { ExperimentalBadge } from '../../components/ui/ExperimentalBadge';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';
import { usePageMeta } from '../../hooks/usePageMeta';

export const PitWallStrategy: React.FC = () => {
  const [urlParams, setUrlParams] = useQueryStates({
    circuit: parseAsString.withDefault('silverstone'),
    laps: parseAsInteger.withDefault(52),
    pitLoss: parseAsFloat.withDefault(21.5),
    fuelPen: parseAsFloat.withDefault(0.035),
    softDeg: parseAsFloat.withDefault(0.095),
    medDeg: parseAsFloat.withDefault(0.055),
    hardDeg: parseAsFloat.withDefault(0.032),
    scProb: parseAsInteger.withDefault(35),
    seed: parseAsInteger.withDefault(42),
  });

  const activePreset = useMemo(() => {
    return (
      CIRCUIT_PRESETS.find((c) => c.id === urlParams.circuit) || CIRCUIT_PRESETS[0]
    );
  }, [urlParams.circuit]);

  const currentParams: StrategyEngineParams = useMemo(() => {
    return sanitizeStrategyParams({
      totalLaps: urlParams.laps,
      baseLapTimeSec: activePreset.baseLapTimeSec,
      pitLossSec: urlParams.pitLoss,
      fuelPenaltyPerLapSec: urlParams.fuelPen,
      softDegPerLapSec: urlParams.softDeg,
      mediumDegPerLapSec: urlParams.medDeg,
      hardDegPerLapSec: urlParams.hardDeg,
      safetyCarProbPct: urlParams.scProb,
      seed: urlParams.seed,
      iterations: 1000,
    });
  }, [urlParams, activePreset]);

  const [result, setResult] = useState<StrategySimulationResult>(() =>
    runMonteCarloStrategies(currentParams)
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const latestRequestIdRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dispatch simulation to web worker with requestId correlation and debouncing
  const dispatchSimulation = useCallback((params: StrategyEngineParams) => {
    const reqId = ++latestRequestIdRef.current;
    setIsSimulating(true);

    if (typeof Worker === 'undefined') {
      // JSDOM / Synchronous fallback
      const syncRes = runMonteCarloStrategies(params);
      setResult(syncRes);
      setIsSimulating(false);
      return;
    }

    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('./strategyWorker.ts', import.meta.url), {
          type: 'module',
        });

        workerRef.current.onmessage = (event) => {
          const data = event.data;
          if (data && 'requestId' in data && data.requestId === latestRequestIdRef.current) {
            if ('result' in data && data.result) {
              setResult(data.result);
            }
            setIsSimulating(false);
          }
        };

        workerRef.current.onerror = () => {
          setIsSimulating(false);
        };
      }

      workerRef.current.postMessage({ requestId: reqId, params });
    } catch {
      const syncRes = runMonteCarloStrategies(params);
      setResult(syncRes);
      setIsSimulating(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      dispatchSimulation(currentParams);
    }, 120);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [currentParams, dispatchSimulation]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleCircuitChange = (circuitId: string) => {
    const c = CIRCUIT_PRESETS.find((cp) => cp.id === circuitId) || CIRCUIT_PRESETS[0];
    setUrlParams({
      circuit: c.id,
      laps: c.laps,
      scProb: c.scProbPct,
    });
  };

  const handleParamChange = <K extends keyof StrategyEngineParams>(
    key: K,
    val: StrategyEngineParams[K]
  ) => {
    if (key === 'totalLaps') setUrlParams({ laps: val as number });
    else if (key === 'pitLossSec') setUrlParams({ pitLoss: val as number });
    else if (key === 'fuelPenaltyPerLapSec') setUrlParams({ fuelPen: val as number });
    else if (key === 'softDegPerLapSec') setUrlParams({ softDeg: val as number });
    else if (key === 'mediumDegPerLapSec') setUrlParams({ medDeg: val as number });
    else if (key === 'hardDegPerLapSec') setUrlParams({ hardDeg: val as number });
    else if (key === 'safetyCarProbPct') setUrlParams({ scProb: val as number });
    else if (key === 'seed') setUrlParams({ seed: val as number });
  };

  const handleResetDefaults = () => {
    setUrlParams({
      circuit: 'silverstone',
      laps: DEFAULT_STRATEGY_PARAMS.totalLaps,
      pitLoss: DEFAULT_STRATEGY_PARAMS.pitLossSec,
      fuelPen: DEFAULT_STRATEGY_PARAMS.fuelPenaltyPerLapSec,
      softDeg: DEFAULT_STRATEGY_PARAMS.softDegPerLapSec,
      medDeg: DEFAULT_STRATEGY_PARAMS.mediumDegPerLapSec,
      hardDeg: DEFAULT_STRATEGY_PARAMS.hardDegPerLapSec,
      scProb: DEFAULT_STRATEGY_PARAMS.safetyCarProbPct,
      seed: DEFAULT_STRATEGY_PARAMS.seed,
    });
  };

  const handleRerollSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    setUrlParams({ seed: newSeed });
  };

  usePageMeta({
    title: `Pit-Wall Strategy Simulator (${activePreset.name}) — F1 // ARCHIVE`,
    description: `Deterministic Monte Carlo pit-wall strategy optimizer for ${activePreset.name}.`,
    canonicalPath: '/pitwall',
  });

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full bg-[#090B10] px-4 py-6 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        {/* Header Bar */}
        <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#11151E] p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#8494AB]">
              <span className="h-2 w-2 rounded-full bg-[#E10600] animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider">
                MONTE CARLO PIT-WALL STRATEGY ENGINE
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-emerald-400">
                {isSimulating ? 'SIMULATING...' : `SOLVED IN ${result.computeTimeMs}ms`}
              </span>
            </div>

            <CopyShareLinkButton label="Share Strategy Scenario" />
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
              Race Strategy &amp; Undercut Optimizer
            </h1>
            <p className="font-mono text-xs text-[#8494AB] mt-0.5">
              1,000 PERMUTATIONS PER DISPATCH • SEEDED DETERMINISTIC MULBERRY32 PRNG
            </p>
          </div>
        </section>

        {/* Quarantine Disclaimer */}
        <ExperimentalBadge disclaimer="Monte Carlo race strategy model — deterministic seeded projection for pit-wall analysis, not official FIA/team telemetry." />

        {/* Editable Parameters Panel */}
        <StrategyParamsPanel
          circuit={urlParams.circuit}
          params={currentParams}
          onCircuitChange={handleCircuitChange}
          onParamChange={handleParamChange}
          onResetDefaults={handleResetDefaults}
          onRerollSeed={handleRerollSeed}
        />

        {/* Analytics Display */}
        <PitWallAnalytics result={result} circuitName={activePreset.name} />
      </div>
    </div>
  );
};

export default PitWallStrategy;
