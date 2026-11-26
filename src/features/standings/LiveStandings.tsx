import React, { useState, useMemo } from 'react';
import {
  useDriverStandingsQuery,
  useConstructorStandingsQuery,
  useSeasonScheduleQuery
} from '../../api/jolpicaClient';
import { useDocumentTitle } from '../../hooks/usePageMeta';
import { LiveStatusBadge } from './LiveStatusBadge';
import { StandingsTable } from './StandingsTable';
import './LiveStandings.css';

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
    <div className="live-standings-page">
      <div className="standings-container">
        {/* Top Header Panel */}
        <div className="standings-header-panel telemetry-panel corner-bracket">
          <div className="standings-meta telemetry">
            <LiveStatusBadge
              source={activeSource}
              updatedAt={activeUpdatedAt}
              isFetching={isFetching}
            />
            <span className="season-badge headline">{seasonLabel} FIA WORLD CHAMPIONSHIP</span>
          </div>

          <h1 className="standings-title headline">
            CHAMPIONSHIP <span className="text-gradient-cyan">STANDINGS &amp; CALENDAR</span>
          </h1>

          <p className="standings-subtitle">
            Real-time classifications for the FIA Formula One World Championship. Track points,
            podiums, constructor standings, and the official Grand Prix calendar.
          </p>

          {/* Navigation Mode Tabs */}
          <div className="standings-tab-bar">
            <button
              type="button"
              className={`standings-tab headline ${activeTab === 'wdc' ? 'active' : ''}`}
              onClick={() => setActiveTab('wdc')}
            >
              <span>🏆 DRIVERS (WDC)</span>
            </button>
            <button
              type="button"
              className={`standings-tab headline ${activeTab === 'wcc' ? 'active' : ''}`}
              onClick={() => setActiveTab('wcc')}
            >
              <span>🏎️ CONSTRUCTORS (WCC)</span>
            </button>
            <button
              type="button"
              className={`standings-tab headline ${activeTab === 'schedule' ? 'active' : ''}`}
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
          <div className="next-race-banner telemetry-panel">
            <div className="next-race-badge telemetry">
              <span className="status-blip"></span>
              <span>NEXT GRAND PRIX // ROUND #{nextRace.round}</span>
            </div>
            <div className="next-race-details">
              <div className="race-name-box">
                <h2 className="next-race-title headline">{nextRace.raceName}</h2>
                <span className="next-race-circuit telemetry">
                  📍 {nextRace.circuitName} ({nextRace.locality}, {nextRace.country})
                </span>
              </div>
              <div className="next-race-date-box">
                <span className="telemetry label">OFFICIAL RACE DATE</span>
                <span className="headline date-val">{nextRace.date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="standings-loading telemetry-panel">
            <div className="loading-spinner"></div>
            <span className="headline">SYNCHRONIZING TELEMETRY STANDINGS...</span>
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
              <div className="schedule-grid">
                {schedule.map((race) => (
                  <div key={race.round} className="schedule-card telemetry-panel corner-bracket">
                    <div className="schedule-card-header telemetry">
                      <span className="round-badge">ROUND #{race.round}</span>
                      <span className="race-date">{race.date}</span>
                    </div>

                    <h3 className="schedule-race-title headline">{race.raceName}</h3>
                    <div className="schedule-circuit-name telemetry">📍 {race.circuitName}</div>
                    <div className="schedule-location telemetry">
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
