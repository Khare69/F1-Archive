import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SeasonClassificationFile } from '../../../types/f1';
import { EChartsWrapper } from '../../../components/charts/EChartsWrapper';
import {
  buildFocusPlusContextSeasonOptions,
  extractSeasonDrivers,
} from '../seasonChartOptions';

interface SeasonProgressionChartProps {
  year: number;
}

export const SeasonProgressionChart: React.FC<SeasonProgressionChartProps> = ({ year }) => {
  const { data: seasonData, isLoading, error } = useQuery<SeasonClassificationFile>({
    queryKey: ['season_classification', year],
    queryFn: async () => {
      const res = await fetch(`/data/seasons/${year}.json`);
      if (!res.ok) throw new Error(`Could not load classification for ${year}`);
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const allDrivers = useMemo(() => {
    if (!seasonData?.standingsProgression) return [];
    return extractSeasonDrivers(seasonData.standingsProgression);
  }, [seasonData]);

  // Default focus to top 3 championship finishers
  const [focusedDriverIds, setFocusedDriverIds] = useState<string[]>([]);

  useEffect(() => {
    if (allDrivers.length > 0) {
      setFocusedDriverIds(allDrivers.slice(0, 3).map((d) => d.driverId));
    }
  }, [allDrivers]);

  const toggleDriverFocus = (driverId: string) => {
    setFocusedDriverIds((prev) => {
      if (prev.includes(driverId)) {
        // Keep at least 1 driver focused
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== driverId);
      }
      // Cap at 4 simultaneously focused drivers
      if (prev.length >= 4) {
        return [...prev.slice(1), driverId];
      }
      return [...prev, driverId];
    });
  };

  const chartOption = useMemo(() => {
    if (!seasonData?.standingsProgression || seasonData.standingsProgression.length === 0) {
      return null;
    }
    return buildFocusPlusContextSeasonOptions(
      seasonData.standingsProgression,
      focusedDriverIds,
      seasonData.rounds
    );
  }, [seasonData, focusedDriverIds]);

  if (isLoading) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center rounded border border-white/5 bg-[#11151E] p-6 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E10600] border-t-transparent mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#8494AB]">
          // COMPILING {year} PROGRESSION TELEMETRY...
        </span>
      </div>
    );
  }

  if (error || !chartOption || allDrivers.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded border border-white/5 bg-[#11151E] p-6 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-[#8494AB]">
          // NO PROGRESSION CLASSIFICATION DATA AVAILABLE FOR {year}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full rounded border border-white/10 bg-[#11151E] p-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#E10600]">
            // CHAMPIONSHIP TRAJECTORY
          </span>
          <h3 className="font-display text-lg font-bold tracking-wide text-white">
            {year} Driver Standings Progression
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#8494AB]">
            Click driver pill to focus (max 4):
          </span>
        </div>
      </div>

      {/* Driver Focus Selector Pills (I-04 Focus-Plus-Context) */}
      <div className="flex flex-wrap gap-1.5 py-3 border-b border-white/5">
        {allDrivers.slice(0, 10).map((d) => {
          const isFocused = focusedDriverIds.includes(d.driverId);
          return (
            <button
              key={d.driverId}
              type="button"
              onClick={() => toggleDriverFocus(d.driverId)}
              className={`group flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-all ${
                isFocused
                  ? 'bg-white/10 text-white font-semibold ring-1 ring-white/20'
                  : 'bg-white/[0.02] text-[#8494AB] hover:bg-white/[0.05] hover:text-white'
              }`}
              title={`${d.driverName} (P${d.finalPosition}, ${d.finalPoints} pts)`}
            >
              {/* 3px team color accent bar */}
              <span
                className="h-3 w-[3px] rounded-full transition-transform group-hover:scale-y-125"
                style={{ backgroundColor: d.teamColor }}
              />
              <span>{d.driverCode}</span>
              <span className="text-[10px] text-neutral-500">
                {isFocused ? '●' : '○'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart Canvas */}
      <div className="mt-2 w-full">
        <EChartsWrapper
          option={chartOption}
          height={400}
          ariaLabel={`${year} Drivers Championship Progression`}
        />
      </div>
    </div>
  );
};

export default SeasonProgressionChart;
