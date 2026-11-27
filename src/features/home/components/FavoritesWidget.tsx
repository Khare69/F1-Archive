import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, X, User, Shield } from 'lucide-react';
import { safeStorage } from '../../../utils/safeStorage';
import { getAllDrivers, getAllTeams, getDriverById, getTeamById } from '../../../data/dataService';
import type { Driver, Team } from '../../../types/f1';

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

  const updateDrivers = (newDrivers: string[]) => {
    setFavDriverIds(newDrivers);
    safeStorage.setItem(STORAGE_FAV_DRIVERS, JSON.stringify(newDrivers));
  };

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

  const favoriteDrivers = favDriverIds
    .map((id) => getDriverById(id))
    .filter((d): d is Driver => d !== undefined);

  const favoriteTeams = favTeamIds
    .map((id) => getTeamById(id))
    .filter((t): t is Team => t !== undefined);

  const driverCandidates = allDrivers
    .filter((d) => !favDriverIds.includes(d.id) && (!d.code || !favDriverIds.includes(d.code)))
    .filter(
      (d) =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(driverSearch.toLowerCase()))
    )
    .slice(0, 6);

  const teamCandidates = allTeams
    .filter((t) => !favTeamIds.includes(t.id))
    .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    .slice(0, 6);

  return (
    <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8 text-neutral-300 favorites-widget">
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
            Paddock Favorites
          </h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          Personal Telemetry Watchlist
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drivers */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-crimson" />
              <span>Drivers ({favoriteDrivers.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingDriver(!isAddingDriver)}
              className="text-[10px] font-mono uppercase tracking-wider text-crimson hover:text-white transition-colors"
            >
              {isAddingDriver ? 'Cancel' : '+ Add Driver'}
            </button>
          </div>

          {isAddingDriver && (
            <div className="mb-2 p-2 rounded-[3px] bg-[#181D28] border border-white/10">
              <input
                type="text"
                placeholder="Search name or code..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="w-full px-2 py-1 bg-[#11151E] border border-white/10 text-xs text-white rounded font-mono outline-none mb-1.5"
                autoFocus
              />
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {driverCandidates.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => addDriver(d.id)}
                    className="flex items-center justify-between p-1 text-xs text-left text-neutral-300 hover:text-white hover:bg-white/5 rounded"
                  >
                    <span>{d.name}</span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {d.code || d.id.slice(0, 3).toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {favoriteDrivers.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2 rounded-[3px] bg-[#181D28] border border-white/6 hover:border-white/12 transition-colors"
              >
                <Link to={`/drivers/${d.id}`} className="flex items-center gap-2 group flex-1">
                  <span className="text-[10px] font-mono font-bold text-crimson bg-crimson/10 px-1.5 py-0.5 rounded border border-crimson/20">
                    {d.code || d.id.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="text-xs text-white group-hover:text-crimson transition-colors font-medium">
                    {d.name}
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {d.championships > 0 ? `${d.championships}x WDC` : `${d.wins}W`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => removeDriver(d.id, e)}
                    aria-label={`Remove ${d.name}`}
                    className="text-neutral-500 hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constructors */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>Constructors ({favoriteTeams.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingTeam(!isAddingTeam)}
              className="text-[10px] font-mono uppercase tracking-wider text-crimson hover:text-white transition-colors"
            >
              {isAddingTeam ? 'Cancel' : '+ Add Team'}
            </button>
          </div>

          {isAddingTeam && (
            <div className="mb-2 p-2 rounded-[3px] bg-[#181D28] border border-white/10">
              <input
                type="text"
                placeholder="Search team..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full px-2 py-1 bg-[#11151E] border border-white/10 text-xs text-white rounded font-mono outline-none mb-1.5"
                autoFocus
              />
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {teamCandidates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addTeam(t.id)}
                    className="flex items-center justify-between p-1 text-xs text-left text-neutral-300 hover:text-white hover:bg-white/5 rounded"
                  >
                    <span>{t.name}</span>
                    <span className="font-mono text-[10px] text-neutral-500">{t.base}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {favoriteTeams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-[3px] bg-[#181D28] border border-white/6 hover:border-white/12 transition-colors"
              >
                <Link to="/teams" className="flex items-center gap-2 group flex-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.color || '#E10600' }}
                  />
                  <span className="text-xs text-white group-hover:text-crimson transition-colors font-medium">
                    {t.name}
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {t.championships > 0 ? `${t.championships} Titles` : t.base}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => removeTeam(t.id, e)}
                    aria-label={`Remove ${t.name}`}
                    className="text-neutral-500 hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
