import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import {
  getAllDrivers,
  getDriverById,
  getTeamById,
  getSeasonsWonByDriver,
  getF1DBMetadata
} from '../../data/dataService';
import type { Driver } from '../../types/f1';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { StatCard } from '../../components/StatCard/StatCard';
import { usePageMeta } from '../../hooks/usePageMeta';
import { TelemetryDataTable } from '../../components/ui/TelemetryDataTable';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';

export const DriversArchive: React.FC = () => {
  const { driverId } = useParams<{ driverId?: string }>();
  const navigate = useNavigate();
  const allDrivers = getAllDrivers();
  const meta = getF1DBMetadata();

  const [filter, setFilter] = useQueryState(
    'filter',
    parseAsStringLiteral(['all', '2026', 'champions', 'winners', 'legends', 'active'] as const).withDefault('all')
  );
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('wins:desc'));

  // Validate driverId or default to the first driver
  const selectedDriver = getDriverById(driverId) || allDrivers[0];

  usePageMeta({
    title: selectedDriver
      ? `${selectedDriver.name} (${selectedDriver.code}) — Driver Profile & Career Telemetry`
      : 'Drivers Roster — Formula 1 History',
    description: selectedDriver
      ? `${selectedDriver.name} (${selectedDriver.country}) career statistics. ${selectedDriver.championships} World Drivers' Championships, ${selectedDriver.wins} Grand Prix wins, ${selectedDriver.podiums} podiums, and ${selectedDriver.starts} starts.`
      : 'Complete Formula 1 drivers registry from 1950 to 2026. Explore World Champions, race wins, podium conversion rates, and career telemetry.',
    canonicalPath: `/drivers${selectedDriver ? `/${selectedDriver.id}` : ''}`,
    jsonLd: selectedDriver
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: selectedDriver.name,
          nationality: selectedDriver.country,
          birthDate: selectedDriver.birthDate || undefined,
          jobTitle: 'Formula 1 Racing Driver',
          description: `${selectedDriver.name} is a Formula 1 racing driver with ${selectedDriver.championships} World Championships and ${selectedDriver.wins} Grand Prix victories.`
        }
      : undefined
  });

  const driverTeam = getTeamById(selectedDriver.teamId);
  const teamColor = driverTeam?.color || '#00D2FF';
  const titlesWon = getSeasonsWonByDriver(selectedDriver.id);

  // Filter drivers based on category tab & search input
  const filteredDrivers = useMemo(() => {
    let list = [...allDrivers];

    if (filter === '2026' || filter === 'active') {
      list = list.filter((d) => d.isActive2026);
    } else if (filter === 'champions') {
      list = list.filter((d) => d.championships > 0);
    } else if (filter === 'winners') {
      list = list.filter((d) => d.wins > 0);
    } else if (filter === 'legends') {
      list = list.filter((d) => d.isLegend || d.championships >= 2);
    }

    if (searchQuery.trim()) {
      const clean = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(clean) ||
          d.code?.toLowerCase().includes(clean) ||
          d.country.toLowerCase().includes(clean) ||
          String(d.number || '').includes(clean)
      );
    }

    // Apply sorting
    if (sort === 'wins:desc') {
      list.sort((a, b) => b.wins - a.wins);
    } else if (sort === 'wins:asc') {
      list.sort((a, b) => a.wins - b.wins);
    } else if (sort === 'championships:desc' || sort === 'titles:desc') {
      list.sort((a, b) => b.championships - a.championships);
    } else if (sort === 'name:asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [allDrivers, filter, searchQuery, sort]);

  const handleSelectDriver = (id: string) => {
    navigate(`/drivers/${id}`);
  };

  const getPositionClass = (pos: number | string) => {
    if (pos === 1 || pos === 'P1') return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    if (pos === 2 || pos === 'P2') return 'text-slate-200 bg-slate-300/10 border-slate-300/30';
    if (pos === 3 || pos === 'P3') return 'text-amber-600 bg-amber-600/10 border-amber-600/30';
    if (pos === 'DNF' || pos === 'DNS' || pos === 'DSQ') return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-slate-300 bg-slate-900 border-white/5';
  };

  const formatPositionDisplay = (pos: number | string) => {
    if (typeof pos === 'number') return `P${pos}`;
    return pos;
  };

  const driverTableColumns: ColumnDef<Driver, any>[] = useMemo(
    () => [
      {
        accessorKey: 'number',
        header: '#',
        size: 50,
        cell: (info) => {
          const d = info.row.original;
          const t = getTeamById(d.teamId);
          return (
            <span
              className="font-telemetry font-bold text-xs"
              style={{ color: t?.color || '#00D2FF' }}
            >
              {d.number ? `#${d.number}` : d.code || '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'PILOT',
        cell: (info) => {
          const d = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 text-xs tracking-tight">
                {d.name}
              </span>
              <span className="font-telemetry text-[10px] text-slate-500">
                {d.country}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'championships',
        header: 'TITLES',
        size: 65,
        cell: (info) => {
          const d = info.row.original;
          if (d.championships > 0) {
            return (
              <span className="font-telemetry text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30">
                {d.championships}x WDC
              </span>
            );
          }
          if (d.isLegend) {
            return (
              <span className="font-telemetry text-[10px] text-amber-500/80">
                LEGEND
              </span>
            );
          }
          return <span className="text-slate-600 font-telemetry">—</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar / Timing Tower Roster */}
        <aside className="lg:col-span-4 bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-4 space-y-4" aria-label="Drivers roster">
          <div className="flex items-center justify-between text-xs font-telemetry border-b border-slate-800/80 pb-3">
            <span className="text-cyan-400 font-bold">// DRIVERS ROSTER</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{allDrivers.length} PILOTS</span>
              <CopyShareLinkButton />
            </div>
          </div>

          {/* Head-to-head Quick Link */}
          <Link
            to="/drivers/compare"
            className="flex items-center justify-between p-2.5 rounded bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
          >
            <span className="text-cyan-400 font-bold text-xs">⚔️ VS COMPARATOR</span>
            <span className="font-telemetry text-[11px] text-cyan-300">HEAD-TO-HEAD →</span>
          </Link>

          {/* Category Tabs: Active 2026 / Champions / All */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded border border-slate-800">
            <button
              type="button"
              className={`py-1.5 text-[11px] font-telemetry font-bold rounded transition-colors ${
                filter === '2026' || filter === 'active'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setFilter('2026')}
            >
              ACTIVE 2026
            </button>
            <button
              type="button"
              className={`py-1.5 text-[11px] font-telemetry font-bold rounded transition-colors ${
                filter === 'champions'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 active'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setFilter('champions')}
            >
              CHAMPIONS
            </button>
            <button
              type="button"
              className={`py-1.5 text-[11px] font-telemetry font-bold rounded transition-colors ${
                filter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setFilter('all')}
            >
              ALL PILOTS
            </button>
          </div>

          {/* Quick Search */}
          <div>
            <input
              type="text"
              className="w-full bg-slate-950/80 border border-slate-800 rounded px-3 py-2 text-xs font-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              placeholder="Search pilot, #, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Timing Tower Table */}
          <TelemetryDataTable
            data={filteredDrivers}
            columns={driverTableColumns}
            getRowId={(d) => d.id}
            selectedRowId={selectedDriver.id}
            getRowTeamColor={(d) => getTeamById(d.teamId)?.color || '#00D2FF'}
            onRowClick={(d) => handleSelectDriver(d.id)}
            maxHeightPx={520}
            rowHeightPx={38}
            emptyMessage="No matching drivers found"
            ariaLabel="Drivers Timing Tower"
          />
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-8 space-y-6">
          {/* Driver Hero Panel */}
          <div
            className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-6 relative overflow-hidden"
            style={{ borderLeft: `4px solid ${teamColor}` }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 font-telemetry text-xs text-slate-400 flex-wrap">
                  <span>PILOT ID: {selectedDriver.code || selectedDriver.id}</span>
                  <span>•</span>
                  <span>{selectedDriver.country.toUpperCase()}</span>
                  {selectedDriver.isLegend && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">HALL OF FAME</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-cyan-400">F1DB SYNCED (v{meta.f1dbVersion})</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black font-telemetry" style={{ color: teamColor }}>
                    {selectedDriver.number ? `#${selectedDriver.number}` : selectedDriver.code || '—'}
                  </span>
                  <div>
                    <h1 className="text-3xl font-black text-slate-100 tracking-tight font-headline">
                      {selectedDriver.name}
                    </h1>
                    {driverTeam && (
                      <Link
                        to={`/teams/${driverTeam.id}`}
                        className="inline-flex items-center gap-1.5 font-telemetry text-xs font-bold tracking-wider mt-1 hover:underline"
                        style={{ color: teamColor }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                        <span>{driverTeam.name.toUpperCase()}</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Driver Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <StatCard
                    label="WORLD TITLES"
                    value={selectedDriver.championships}
                    subtext="Championships"
                    accentColor="#FFD700"
                    isPrimary={selectedDriver.championships > 0}
                  />
                  <StatCard
                    label="VICTORIES"
                    value={selectedDriver.wins}
                    subtext="Grand Prix Wins"
                    accentColor={teamColor}
                  />
                  <StatCard
                    label="PODIUMS"
                    value={selectedDriver.podiums}
                    subtext="Top 3 Results"
                    accentColor="#00D2FF"
                  />
                  <StatCard
                    label="STARTS"
                    value={selectedDriver.starts || selectedDriver.wins || 0}
                    subtext={selectedDriver.winRate ? `${selectedDriver.winRate}% Win Rate` : 'Career Starts'}
                    accentColor="#C0C0C0"
                  />
                </div>
              </div>

              {/* Driver Portrait */}
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden bg-slate-900 border flex-shrink-0"
                style={{ borderColor: `${teamColor}55` }}
              >
                <FallbackImage
                  src={selectedDriver.imageUrl}
                  alt={selectedDriver.name}
                  fallbackText={selectedDriver.id}
                  accentColor={teamColor}
                  type="driver"
                  driverCode={selectedDriver.id}
                  driverNumber={selectedDriver.number}
                  championships={selectedDriver.championships}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* World Championship Titles (if any) */}
          {titlesWon.length > 0 && (
            <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold tracking-wider text-amber-400 uppercase font-telemetry">
                  WORLD CHAMPIONSHIP TITLES // {titlesWon.length} CROWNS
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {titlesWon.map((s) => (
                  <Link
                    key={s.year}
                    to={`/seasons/${s.year}`}
                    className="p-3 rounded bg-slate-950/60 border border-slate-800 hover:border-amber-400/50 transition-colors"
                  >
                    <span className="text-xl font-black text-slate-100 font-headline block">{s.year}</span>
                    <span className="font-telemetry text-xs text-slate-400 mt-1 block truncate">
                      {s.championTeam}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Race Results & Career Telemetry */}
          <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-telemetry">
                {selectedDriver.isLegend
                  ? 'CAREER ALL-TIME BENCHMARKS'
                  : 'RECENT GRAND PRIX RESULTS & CLASSIFICATIONS'}
              </h2>
            </div>

            <div className="space-y-2">
              {selectedDriver.raceFinishes.length > 0 ? (
                selectedDriver.raceFinishes.map((finish, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded bg-slate-950/50 border border-slate-800/60 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-telemetry text-xs text-slate-500">ROUND #{idx + 1}</span>
                      <span className="font-bold text-slate-200 text-sm">{finish.race}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded text-xs font-telemetry font-bold border ${getPositionClass(finish.position)}`}>
                      {formatPositionDisplay(finish.position)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded bg-slate-950/40 border border-slate-800/60 text-center">
                  <span className="font-telemetry text-xs text-slate-500">
                    // Career statistics indexed from F1DB historical records
                  </span>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
