import React from 'react';
import { Link } from 'react-router-dom';
import type { LiveDriverStanding, LiveConstructorStanding } from '../../types/f1';
import { getTeamById, getDriverById } from '../../data/dataService';

interface DriversTableProps {
  type: 'wdc';
  standings: LiveDriverStanding[];
  maxPoints: number;
}

interface ConstructorsTableProps {
  type: 'wcc';
  standings: LiveConstructorStanding[];
  maxPoints: number;
}

type StandingsTableProps = DriversTableProps | ConstructorsTableProps;

export const StandingsTable: React.FC<StandingsTableProps> = (props) => {
  if (props.type === 'wdc') {
    const { standings, maxPoints } = props;
    if (standings.length === 0) {
      return (
        <div className="standings-empty-state telemetry-panel">
          <p className="telemetry">NO DRIVER STANDINGS DATA CURRENTLY AVAILABLE FOR THIS ROUND.</p>
        </div>
      );
    }

    return (
      <div className="standings-table-card telemetry-panel">
        <div className="table-header-row telemetry">
          <span className="col-pos">POS</span>
          <span className="col-driver">PILOT &amp; CONSTRUCTOR</span>
          <span className="col-wins">WINS</span>
          <span className="col-progress">POINTS SHARE</span>
          <span className="col-points">PTS</span>
        </div>

        <div className="table-body">
          {standings.map((driver) => {
            const localTeam = getTeamById(driver.constructorId);
            const teamColor = localTeam?.color || '#00D2FF';
            const localDriver = getDriverById(driver.driverCode);
            const pct = Math.min(100, Math.max(0, (driver.points / maxPoints) * 100));

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
    );
  }

  // Constructors (WCC)
  const { standings, maxPoints } = props;
  if (standings.length === 0) {
    return (
      <div className="standings-empty-state telemetry-panel">
        <p className="telemetry">NO CONSTRUCTOR STANDINGS DATA CURRENTLY AVAILABLE FOR THIS ROUND.</p>
      </div>
    );
  }

  return (
    <div className="standings-table-card telemetry-panel">
      <div className="table-header-row telemetry">
        <span className="col-pos">POS</span>
        <span className="col-driver">CONSTRUCTOR</span>
        <span className="col-wins">WINS</span>
        <span className="col-progress">CHAMPIONSHIP POINTS</span>
        <span className="col-points">PTS</span>
      </div>

      <div className="table-body">
        {standings.map((team) => {
          const localTeam = getTeamById(team.constructorId);
          const teamColor = localTeam?.color || '#00D2FF';
          const pct = Math.min(100, Math.max(0, (team.points / maxPoints) * 100));

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
  );
};
