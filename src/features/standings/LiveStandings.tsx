import React, { useState, useMemo } from 'react';
import {
  useDriverStandingsQuery,
  useConstructorStandingsQuery,
  useSeasonScheduleQuery
} from '../../api/jolpicaClient';
import { useDocumentTitle } from '../../hooks/usePageMeta';
import { LiveStatusBadge } from './LiveStatusBadge';
import { StandingsTable } from './StandingsTable';

export const LiveStandings: React.FC = () => {
  useDocumentTitle('Live Standings & Calendar');

  const [activeTab, setActiveTab] = useState<'wdc' | 'wcc' | 'schedule'>('wdc');

  const driversQuery = useDriverStandingsQuery('current');
  const constructorsQuery = useConstructorStandingsQuery('current');
  const scheduleQuery = useSeasonScheduleQuery('current');

  const isLoading = driversQuery.isLoading || constructorsQuery.isLoading || scheduleQuery.isLoading;
  const isFetching = driversQuery.isFetching || constructorsQuery.isFetching || scheduleQuery.isFetching;

  // Extract metadata and data payloads
  const driverStandings = useMemo(
    () => driversQuery.data?.data.standings || [],
    [driversQuery.data?.data.standings]
  );
  const constructorStandings = useMemo(
    () => constructorsQuery.data?.data.standings || [],
    [constructorsQuery.data?.data.standings]
  );
  const schedule = useMemo(
    () => scheduleQuery.data?.data.races || [],
    [scheduleQuery.data?.data.races]
  );

  const seasonLabel = driversQuery.data?.data.season || '2026';
  const activeSource = driversQuery.data?.source || 'fallback';
  const activeUpdatedAt = driversQuery.data?.updatedAt || Date.now();

  const maxDriverPoints = useMemo(() => {
    if (driverStandings.length === 0) return 1;
    return Math.max(...driverStandings.map((d) => d.points), 1);
  }, [driverStandings]);

  const maxConstructorPoints = useMemo(() => {
    if (constructorStandings.length === 0) return 1;
    return Math.max(...constructorStandings.map((c) => c.points), 1);
  }, [constructorStandings]);

  // Find next upcoming race
  const nextRace = useMemo(() => {
    if (schedule.length === 0) return null;
    const now = new Date();
    const upcoming = schedule.find((r) => new Date(r.date) >= now);
    return upcoming || schedule[0];
  }, [schedule]);

  return (
    <div className="live-standings-page standings-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Top Header Panel */}
        <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <LiveStatusBadge
              source={activeSource}
              updatedAt={activeUpdatedAt}
              isFetching={isFetching}
            />
            <span className="font-telemetry text-xs text-slate-400 border border-slate-700/60 px-2.5 py-0.5 rounded">
              {seasonLabel} FIA WORLD CHAMPIONSHIP
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-headline">
            CHAMPIONSHIP <span className="text-cyan-400">STANDINGS &amp; CALENDAR</span>
          </h1>

          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time classifications for the FIA Formula One World Championship. Track points,
            podiums, constructor standings, and the official Grand Prix calendar.
          </p>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-4 flex-wrap">
            <button
              type="button"
              className={`px-4 py-2 rounded text-xs font-telemetry font-bold tracking-wider uppercase transition-colors ${
                activeTab === 'wdc'
                  ? 'active bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
              onClick={() => setActiveTab('wdc')}
            >
              <span>🏆 DRIVERS (WDC)</span>
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded text-xs font-telemetry font-bold tracking-wider uppercase transition-colors ${
                activeTab === 'wcc'
                  ? 'active bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
              onClick={() => setActiveTab('wcc')}
            >
              <span>🏎️ CONSTRUCTORS (WCC)</span>
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded text-xs font-telemetry font-bold tracking-wider uppercase transition-colors ${
                activeTab === 'schedule'
                  ? 'active bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
              onClick={() => setActiveTab('schedule')}
            >
              <span>📅 RACE CALENDAR</span>
            </button>
          </div>
        </div>

        {/* Amber Fallback Banner when upstream live API is unavailable */}
        {activeSource === 'fallback' && (
          <div
            role="alert"
            className="standings-fallback-alert bg-amber-500/10 border border-amber-500/30 rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-telemetry text-xs"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span>
                [ ARCHIVE RECOVERY MODE ] Live feed temporarily unavailable. Displaying verified F1DB archive records.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                driversQuery.refetch();
                constructorsQuery.refetch();
                scheduleQuery.refetch();
              }}
              disabled={isFetching}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isFetching ? 'RECONNECTING...' : 'RETRY FEED'}
            </button>
          </div>
        )}

        {/* Next Grand Prix Countdown Banner */}
        {nextRace && (
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-telemetry text-xs mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>NEXT GRAND PRIX // ROUND #{nextRace.round}</span>
              </div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight">{nextRace.raceName}</h2>
              <span className="font-telemetry text-xs text-slate-400">
                📍 {nextRace.circuitName} ({nextRace.locality}, {nextRace.country})
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 px-4 py-2 rounded text-right">
              <span className="font-telemetry text-[10px] text-slate-500 block uppercase">OFFICIAL RACE DATE</span>
              <span className="font-telemetry font-bold text-sm text-slate-200">{nextRace.date}</span>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="font-telemetry text-xs text-slate-400 tracking-wider block">
              SYNCHRONIZING TELEMETRY STANDINGS...
            </span>
          </div>
        ) : (
          <>
            {/* Drivers Standings Table */}
            {activeTab === 'wdc' && (
              <StandingsTable
                type="wdc"
                standings={driverStandings}
                maxPoints={maxDriverPoints}
              />
            )}

            {/* Constructors Standings Table */}
            {activeTab === 'wcc' && (
              <StandingsTable
                type="wcc"
                standings={constructorStandings}
                maxPoints={maxConstructorPoints}
              />
            )}

            {/* Official Race Calendar */}
            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.map((race) => (
                  <div
                    key={race.round}
                    className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs font-telemetry text-slate-400 border-b border-slate-800/60 pb-2">
                      <span className="font-bold text-cyan-400">ROUND #{race.round}</span>
                      <span>{race.date}</span>
                    </div>

                    <h3 className="font-black text-slate-100 text-base">{race.raceName}</h3>
                    <div className="font-telemetry text-xs text-slate-400">📍 {race.circuitName}</div>
                    <div className="font-telemetry text-[11px] text-slate-500">
                      {race.locality}, {race.country}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
