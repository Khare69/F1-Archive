import React, { useMemo } from 'react';
import type { StrategySimulationResult } from '../strategyMath';
import { EChartsWrapper } from '../../../components/charts/EChartsWrapper';
import {
  buildStintPaceOptions,
  buildMonteCarloDistributionOptions,
} from '../strategyChartOptions';

export interface PitWallAnalyticsProps {
  result: StrategySimulationResult;
  circuitName?: string;
}

export const PitWallAnalytics: React.FC<PitWallAnalyticsProps> = ({
  result,
  circuitName = 'Circuit',
}) => {
  const paceOptions = useMemo(() => buildStintPaceOptions(result), [result]);
  const distributionOptions = useMemo(
    () => buildMonteCarloDistributionOptions(result),
    [result]
  );

  return (
    <div className="flex flex-col gap-6 w-full text-white">
      {/* Strategy Archetype Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.strategies.map((strat) => {
          const isWinner = strat.id === result.winningStrategyId;
          return (
            <div
              key={strat.id}
              className={`relative flex flex-col justify-between rounded-lg border p-4 shadow-lg transition-all ${
                isWinner
                  ? 'border-[#E10600]/60 bg-[#181D28] ring-1 ring-[#E10600]/40'
                  : 'border-white/10 bg-[#11151E]'
              }`}
            >
              {isWinner && (
                <div className="absolute top-2 right-2 rounded bg-[#E10600] px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider text-white">
                  OPTIMAL STRATEGY
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: strat.color }}
                  />
                  <h4 className="font-display text-sm font-bold text-white truncate">
                    {strat.name}
                  </h4>
                </div>

                <div className="font-mono text-xs text-[#8494AB] mb-3">
                  Sequence: <span className="text-white font-semibold">{strat.stintsSummary}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-[#8494AB]">WIN PROBABILITY</span>
                  <span
                    className="text-base font-extrabold"
                    style={{ color: strat.winRatePct > 40 ? '#22C55E' : '#F4F6FA' }}
                  >
                    {strat.winRatePct}%
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] text-[#8494AB]">MEDIAN TIME (P50)</span>
                  <span className="text-base font-extrabold text-white">
                    {strat.p50Sec}s
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-between text-[11px] text-[#8494AB] pt-1">
                  <span>P10: <b className="text-neutral-300">{strat.p10Sec}s</b></span>
                  <span>P90: <b className="text-neutral-300">{strat.p90Sec}s</b></span>
                  <span>Stops: <b className="text-neutral-300">{strat.stops}</b></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two ECharts Graphs: Lap Pace & Monte Carlo Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lap-by-Lap Stint Pace Chart */}
        <div className="rounded-lg border border-white/10 bg-[#11151E] p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#8494AB]">
              LAP-BY-LAP STINT PACE PROJECTION // {circuitName.toUpperCase()}
            </span>
          </div>
          <div className="w-full h-[280px]">
            <EChartsWrapper
              option={paceOptions}
              height={280}
              ariaLabel="Lap-by-lap stint pace comparison"
            />
          </div>
        </div>

        {/* Monte Carlo Win Probability Distribution */}
        <div className="rounded-lg border border-white/10 bg-[#11151E] p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#8494AB]">
              MONTE CARLO WIN OUTCOMES ({result.iterations} SIMULATIONS)
            </span>
            <span className="font-mono text-[10px] text-neutral-500">
              PRNG SEED: {result.seed}
            </span>
          </div>
          <div className="w-full h-[280px]">
            <EChartsWrapper
              option={distributionOptions}
              height={280}
              ariaLabel="Monte Carlo strategy win distribution"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitWallAnalytics;
