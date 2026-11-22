import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchSeasonSchedule,
  getTeamById,
  getDriverById
} from '../../data/dataService';
import type {
  LiveDriverStanding,
  LiveConstructorStanding,
  RaceScheduleRound
} from '../../types/f1';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './LiveStandings.css';

export const LiveStandings: React.FC = () => {
  useDocumentTitle('Live Standings & Calendar');

  const [activeTab, setActiveTab] = useState<'wdc' | 'wcc' | 'schedule'>('wdc');
  const [driverStandings, setDriverStandings] = useState<LiveDriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<LiveConstructorStanding[]>([]);
  const [schedule, setSchedule] = useState<RaceScheduleRound[]>([]);
  const [seasonLabel, setSeasonLabel] = useState<string>('2026');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      setIsLoading(true);
      try {
        const [driversRes, constructorsRes, scheduleRes] = await Promise.all([
          fetchDriverStandings('current'),
          fetchConstructorStandings('current'),
          fetchSeasonSchedule('current')
        ]);

        if (isMounted) {
          setDriverStandings(driversRes.standings);
          setConstructorStandings(constructorsRes.standings);
          setSchedule(scheduleRes.races);
          setSeasonLabel(driversRes.season || '2026');
          setIsLiveConnected(!driversRes.isFallback);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  const maxDriverPoints = useMemo(() => {
    if (driverStandings.length === 0) return 1;
    return Math.max(...driverStandings.map(d => d.points), 1);
  }, [driverStandings]);

  const maxConstructorPoints = useMemo(() => {
    if (constructorStandings.length === 0) return 1;
    return Math.max(...constructorStandings.map(c => c.points), 1);
  }, [constructorStandings]);

  // Find next upcoming race
  const nextRace = useMemo(() => {
    if (schedule.length === 0) return null;
    const now = new Date();
    const upcoming = schedule.find(r => new Date(r.date) >= now);
    return upcoming || schedule[0];
  }, [schedule]);

  return (
    <div className="live-standings-page">
      <div className="standings-container">
        {/* Top Header Panel */}
        <div className="standings-header-panel telemetry-panel corner-bracket">
          <div className="standings-meta telemetry">
            <span className="source-tag">
              {isLiveConnected ? '⚡ LIVE JOLPICA REST FEED' : '🔒 CURATED ARCHIVE VAULT'}
            </span>
            <span className="season-badge headline">{seasonLabel} FIA WORLD CHAMPIONSHIP</span>
          </div>

          <h1 className="standings-title headline">
            CHAMPIONSHIP <span className="text-gradient-cyan">STANDINGS & CALENDAR</span>
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
            {/* ── DRIVERS STANDINGS TABLE ── */}
            {activeTab === 'wdc' && (
              <div className="standings-table-card telemetry-panel">
                <div className="table-header-row telemetry">
                  <span className="col-pos">POS</span>
                  <span className="col-driver">PILOT & CONSTRUCTOR</span>
                  <span className="col-wins">WINS</span>
                  <span className="col-progress">POINTS SHARE</span>
                  <span className="col-points">PTS</span>
                </div>

                <div className="table-body">
                  {driverStandings.map((driver) => {
                    const localTeam = getTeamById(driver.constructorId);
                    const teamColor = localTeam?.color || '#00D2FF';
                    const localDriver = getDriverById(driver.driverCode);
                    const pct = (driver.points / maxDriverPoints) * 100;

                    return (
                      <div key={driver.driverId} className="standings-row">
                        <div className="col-pos">
                          <span
                            className={`pos-badge headline ${
                              driver.position === 1
                                ? 'pos-1'
                                : driver.position === 2
                                ? 'pos-2'
                                : driver.position === 3
                                ? 'pos-3'
                                : ''
                            }`}
                          >
                            P{driver.position}
                          </span>
                        </div>

                        <div className="col-driver">
                          <div className="driver-cell">
                            <span className="driver-team-stripe" style={{ backgroundColor: teamColor }}></span>
                            <div className="driver-meta-text">
                              <span className="driver-name headline">
                                {localDriver ? (
                                  <Link to={`/drivers/${localDriver.id}`} className="driver-link">
                                    {driver.driverName}
                                  </Link>
                                ) : (
                                  driver.driverName
                                )}
                              </span>
                              <span className="constructor-name telemetry" style={{ color: teamColor }}>
                                {driver.constructorName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-wins headline">
                          {driver.wins > 0 ? (
                            <span className="wins-pill">{driver.wins} W</span>
                          ) : (
                            <span className="no-wins">-</span>
                          )}
                        </div>

                        <div className="col-progress">
                          <div className="pts-bar-track">
                            <div
                              className="pts-bar-fill"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: teamColor
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-points headline">{driver.points}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CONSTRUCTORS STANDINGS TABLE ── */}
            {activeTab === 'wcc' && (
              <div className="standings-table-card telemetry-panel">
                <div className="table-header-row telemetry">
                  <span className="col-pos">POS</span>
                  <span className="col-driver">CONSTRUCTOR</span>
                  <span className="col-wins">WINS</span>
                  <span className="col-progress">CHAMPIONSHIP POINTS</span>
                  <span className="col-points">PTS</span>
                </div>

                <div className="table-body">
                  {constructorStandings.map((team) => {
                    const localTeam = getTeamById(team.constructorId);
                    const teamColor = localTeam?.color || '#00D2FF';
                    const pct = (team.points / maxConstructorPoints) * 100;

                    return (
                      <div key={team.constructorId} className="standings-row">
                        <div className="col-pos">
                          <span
                            className={`pos-badge headline ${
                              team.position === 1
                                ? 'pos-1'
                                : team.position === 2
                                ? 'pos-2'
                                : team.position === 3
                                ? 'pos-3'
                                : ''
                            }`}
                          >
                            P{team.position}
                          </span>
                        </div>

                        <div className="col-driver">
                          <div className="driver-cell">
                            <span className="driver-team-stripe" style={{ backgroundColor: teamColor }}></span>
                            <div className="driver-meta-text">
                              <span className="driver-name headline">
                                {localTeam ? (
                                  <Link to={`/teams/${localTeam.id}`} className="driver-link">
                                    {team.constructorName}
                                  </Link>
                                ) : (
                                  team.constructorName
                                )}
                              </span>
                              <span className="constructor-name telemetry">
                                {team.nationality.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-wins headline">
                          {team.wins > 0 ? (
                            <span className="wins-pill">{team.wins} W</span>
                          ) : (
                            <span className="no-wins">-</span>
                          )}
                        </div>

                        <div className="col-progress">
                          <div className="pts-bar-track">
                            <div
                              className="pts-bar-fill"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: teamColor
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-points headline">{team.points}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── OFFICIAL RACE CALENDAR ── */}
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
                    <div className="schedule-location telemetry">{race.locality}, {race.country}</div>
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
