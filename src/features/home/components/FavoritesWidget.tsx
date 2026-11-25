import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { safeStorage } from '../../../utils/safeStorage';
import { getAllDrivers, getAllTeams, getDriverById, getTeamById } from '../../../data/dataService';
import type { Driver, Team } from '../../../types/f1';
import './FavoritesWidget.css';

const STORAGE_FAV_DRIVERS = 'f1_favorite_drivers';
const STORAGE_FAV_TEAMS = 'f1_favorite_teams';

const DEFAULT_DRIVERS = ['VER', 'HAM', 'LEC'];
const DEFAULT_TEAMS = ['ferrari', 'mclaren', 'redbull'];

export const FavoritesWidget: React.FC = () => {
  const allDrivers = getAllDrivers();
  const allTeams = getAllTeams();

  const [favDriverIds, setFavDriverIds] = useState<string[]>(() => {
    const raw = safeStorage.getItem(STORAGE_FAV_DRIVERS);
    if (!raw) return DEFAULT_DRIVERS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DRIVERS;
    } catch {
      return DEFAULT_DRIVERS;
    }
  });

  const [favTeamIds, setFavTeamIds] = useState<string[]>(() => {
    const raw = safeStorage.getItem(STORAGE_FAV_TEAMS);
    if (!raw) return DEFAULT_TEAMS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEAMS;
    } catch {
      return DEFAULT_TEAMS;
    }
  });

  const [isAddingDriver, setIsAddingDriver] = useState<boolean>(false);
  const [isAddingTeam, setIsAddingTeam] = useState<boolean>(false);
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [teamSearch, setTeamSearch] = useState<string>('');

  // Persist drivers when modified
  const updateDrivers = (newDrivers: string[]) => {
    setFavDriverIds(newDrivers);
    safeStorage.setItem(STORAGE_FAV_DRIVERS, JSON.stringify(newDrivers));
  };

  // Persist teams when modified
  const updateTeams = (newTeams: string[]) => {
    setFavTeamIds(newTeams);
    safeStorage.setItem(STORAGE_FAV_TEAMS, JSON.stringify(newTeams));
  };

  const removeDriver = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateDrivers(favDriverIds.filter((d) => d !== id));
  };

  const removeTeam = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateTeams(favTeamIds.filter((t) => t !== id));
  };

  const addDriver = (id: string) => {
    if (!favDriverIds.includes(id)) {
      updateDrivers([...favDriverIds, id]);
    }
    setIsAddingDriver(false);
    setDriverSearch('');
  };

  const addTeam = (id: string) => {
    if (!favTeamIds.includes(id)) {
      updateTeams([...favTeamIds, id]);
    }
    setIsAddingTeam(false);
    setTeamSearch('');
  };

  // Resolve objects
  const favoriteDrivers = favDriverIds
    .map((id) => getDriverById(id))
    .filter((d): d is Driver => d !== undefined);

  const favoriteTeams = favTeamIds
    .map((id) => getTeamById(id))
    .filter((t): t is Team => t !== undefined);

  // Filter candidates for adding
  const driverCandidates = allDrivers
    .filter((d) => !favDriverIds.includes(d.id) && (!d.code || !favDriverIds.includes(d.code)))
    .filter(
      (d) =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(driverSearch.toLowerCase()))
    )
    .slice(0, 8);

  const teamCandidates = allTeams
    .filter((t) => !favTeamIds.includes(t.id))
    .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="favorites-widget telemetry-panel corner-bracket">
      <div className="fav-widget-header telemetry">
        <div className="fav-header-title">
          <span className="fav-star-icon">⭐</span>
          <span>MY PADDOCK FAVORITES // PERSONAL TELEMETRY DASHBOARD</span>
        </div>
        <span className="fav-storage-tag telemetry">PERSISTED VIA SAFESTORAGE</span>
      </div>

      <div className="fav-columns-grid">
        {/* Favorite Drivers Column */}
        <div className="fav-section">
          <div className="fav-subheading telemetry">
            <span>BOOKMARKED DRIVERS ({favoriteDrivers.length})</span>
            <button
              type="button"
              className="fav-add-btn telemetry"
              onClick={() => setIsAddingDriver(!isAddingDriver)}
            >
              {isAddingDriver ? '✕ CANCEL' : '+ ADD DRIVER'}
            </button>
          </div>

          {isAddingDriver && (
            <div className="fav-picker-dropdown">
              <input
                type="text"
                className="fav-picker-input telemetry"
                placeholder="Search driver by name or code..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                autoFocus
              />
              <div className="fav-candidates-list">
                {driverCandidates.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="fav-candidate-item"
                    onClick={() => addDriver(d.id)}
                  >
                    <span className="candidate-code telemetry">{d.code || d.id.slice(0, 3).toUpperCase()}</span>
                    <span className="candidate-name">{d.name}</span>
                    <span className="candidate-team telemetry">{d.teamId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fav-items-grid">
            {favoriteDrivers.map((driver) => (
              <Link
                key={driver.id}
                to={`/drivers/${driver.id}`}
                className="fav-card fav-driver-card"
              >
                <div className="fav-card-top">
                  <span className="fav-badge telemetry">{driver.code || driver.id.slice(0, 3).toUpperCase()}</span>
                  <button
                    type="button"
                    className="fav-remove-btn"
                    onClick={(e) => removeDriver(driver.id, e)}
                    title="Remove from favorites"
                    aria-label={`Remove ${driver.name} from favorites`}
                  >
                    ✕
                  </button>
                </div>
                <div className="fav-card-name headline">{driver.name}</div>
                <div className="fav-card-meta telemetry">
                  <span>{driver.country}</span>
                  <span>
                    {driver.championships > 0 ? `🏆 ${driver.championships}WDC` : `${driver.wins} WINS`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Favorite Constructors Column */}
        <div className="fav-section">
          <div className="fav-subheading telemetry">
            <span>BOOKMARKED CONSTRUCTORS ({favoriteTeams.length})</span>
            <button
              type="button"
              className="fav-add-btn telemetry"
              onClick={() => setIsAddingTeam(!isAddingTeam)}
            >
              {isAddingTeam ? '✕ CANCEL' : '+ ADD TEAM'}
            </button>
          </div>

          {isAddingTeam && (
            <div className="fav-picker-dropdown">
              <input
                type="text"
                className="fav-picker-input telemetry"
                placeholder="Search team name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                autoFocus
              />
              <div className="fav-candidates-list">
                {teamCandidates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="fav-candidate-item"
                    onClick={() => addTeam(t.id)}
                  >
                    <span
                      className="candidate-color-dot"
                      style={{ backgroundColor: t.color }}
                    ></span>
                    <span className="candidate-name">{t.name}</span>
                    <span className="candidate-team telemetry">{t.base}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fav-items-grid">
            {favoriteTeams.map((team) => (
              <Link
                key={team.id}
                to={`/cars/${team.id}`}
                className="fav-card fav-team-card"
                style={{ '--team-color': team.color } as React.CSSProperties}
              >
                <div className="fav-card-top">
                  <span
                    className="fav-team-indicator"
                    style={{ backgroundColor: team.color }}
                  ></span>
                  <span className="fav-badge telemetry">{team.carName}</span>
                  <button
                    type="button"
                    className="fav-remove-btn"
                    onClick={(e) => removeTeam(team.id, e)}
                    title="Remove from favorites"
                    aria-label={`Remove ${team.name} from favorites`}
                  >
                    ✕
                  </button>
                </div>
                <div className="fav-card-name headline">{team.name}</div>
                <div className="fav-card-meta telemetry">
                  <span>{team.base}</span>
                  <span>{team.championships} TITLES</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
