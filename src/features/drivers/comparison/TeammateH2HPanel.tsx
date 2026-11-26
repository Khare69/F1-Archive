import React from 'react';
import {
  type RawTeammateH2HRecord,
  resolveTeammatePair
} from './comparisonMetrics';

export interface TeammateH2HPanelProps {
  teammatesMap: Record<string, RawTeammateH2HRecord> | undefined | null;
  leftSlug?: string | null;
  rightSlug?: string | null;
  colorA: string;
  colorB: string;
}

export const TeammateH2HPanel: React.FC<TeammateH2HPanelProps> = ({
  teammatesMap,
  leftSlug,
  rightSlug,
  colorA,
  colorB
}) => {
  const battle = resolveTeammatePair(teammatesMap, leftSlug, rightSlug);

  if (!battle) {
    return (
      <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-800/80 rounded-lg p-4 text-center">
        <span className="font-telemetry text-xs text-slate-500 tracking-wider">
          // NO MUTUAL RACES AS TEAMMATES AT THE SAME CONSTRUCTOR RECORDED IN F1DB REGISTRY
        </span>
      </div>
    );
  }

  const hasYears = battle.years && battle.years.length > 0;
  const hasConstructors = battle.constructors && battle.constructors.length > 0;

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md border border-amber-500/30 rounded-lg p-5 relative overflow-hidden">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <h2 className="text-sm font-bold tracking-wider text-amber-400 uppercase font-telemetry">
            MUTUAL TEAMMATE HEAD-TO-HEAD BATTLE
          </h2>
        </div>

        {(hasYears || hasConstructors) && (
          <div className="flex items-center gap-2 flex-wrap font-telemetry text-xs">
            {hasYears && (
              <span className="bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded text-amber-300">
                {battle.years.join(', ')}
              </span>
            )}
            {hasConstructors && (
              <span className="bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded text-slate-300">
                {battle.constructors.map(c => c.toUpperCase()).join(' & ')}
              </span>
            )}
          </div>
        )}
      </div>

      <p className="font-telemetry text-xs text-slate-400 mb-5">
        [ STATS COMPUTED EXCLUSIVELY FROM {battle.racesTogether} GRAND PRIX STARTS AT THE SAME CONSTRUCTOR ]
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Both Finished Ahead */}
        <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-3 w-full font-telemetry font-bold text-lg mb-1">
            <span
              style={{
                color: battle.leftBothFinishedWins >= battle.rightBothFinishedWins ? colorA : '#64748b'
              }}
            >
              {battle.leftBothFinishedWins}
            </span>
            <span className="text-slate-600 text-xs font-normal">vs</span>
            <span
              style={{
                color: battle.rightBothFinishedWins >= battle.leftBothFinishedWins ? colorB : '#64748b'
              }}
            >
              {battle.rightBothFinishedWins}
            </span>
          </div>
          <span className="font-telemetry text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
            BOTH FINISHED AHEAD
          </span>
        </div>

        {/* All Starts Ahead */}
        <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-3 w-full font-telemetry font-bold text-lg mb-1">
            <span
              style={{
                color: battle.leftAllStartsWins >= battle.rightAllStartsWins ? colorA : '#64748b'
              }}
            >
              {battle.leftAllStartsWins}
            </span>
            <span className="text-slate-600 text-xs font-normal">vs</span>
            <span
              style={{
                color: battle.rightAllStartsWins >= battle.leftAllStartsWins ? colorB : '#64748b'
              }}
            >
              {battle.rightAllStartsWins}
            </span>
          </div>
          <span className="font-telemetry text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
            ALL STARTS AHEAD
          </span>
        </div>

        {/* Qualifying Head-to-Head */}
        <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-3 w-full font-telemetry font-bold text-lg mb-1">
            <span
              style={{
                color: battle.leftQualiWins >= battle.rightQualiWins ? colorA : '#64748b'
              }}
            >
              {battle.leftQualiWins}
            </span>
            <span className="text-slate-600 text-xs font-normal">vs</span>
            <span
              style={{
                color: battle.rightQualiWins >= battle.leftQualiWins ? colorB : '#64748b'
              }}
            >
              {battle.rightQualiWins}
            </span>
          </div>
          <span className="font-telemetry text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
            OUTQUALIFIED TEAMMATE
          </span>
        </div>

        {/* Mutual Points Scored */}
        <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-3 w-full font-telemetry font-bold text-lg mb-1">
            <span
              style={{
                color: battle.leftPoints >= battle.rightPoints ? colorA : '#64748b'
              }}
            >
              {battle.leftPoints}
            </span>
            <span className="text-slate-600 text-xs font-normal">vs</span>
            <span
              style={{
                color: battle.rightPoints >= battle.leftPoints ? colorB : '#64748b'
              }}
            >
              {battle.rightPoints}
            </span>
          </div>
          <span className="font-telemetry text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
            MUTUAL POINTS SCORED
          </span>
        </div>
      </div>
    </div>
  );
};
