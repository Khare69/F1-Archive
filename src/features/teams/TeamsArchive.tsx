import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import {
  getAllTeams,
  getActive2026Teams,
  getHistoricTeams,
  getTeamById,
  getTeamDrivers,
  getSeasonsWonByTeam,
  getF1DBMetadata
} from '../../data/dataService';
import type { Team } from '../../types/f1';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { StatCard } from '../../components/StatCard/StatCard';
import { usePageMeta } from '../../hooks/usePageMeta';
import { TelemetryDataTable } from '../../components/ui/TelemetryDataTable';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';

export const TeamsArchive: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const allTeams = getAllTeams();
  const meta = getF1DBMetadata();

  const [grid, setGrid] = useQueryState(
    'grid',
    parseAsStringLiteral(['2026', 'historic', 'all', 'active'] as const).withDefault('2026')
  );

  // Validate teamId or default to the first team
  const selectedTeam = getTeamById(teamId) || allTeams[0];

  usePageMeta({
    title: selectedTeam ? `${selectedTeam.name} — Formula 1 Constructor Profile` : 'Constructors Archive — Formula 1',
    description: selectedTeam
      ? `${selectedTeam.name} Formula 1 constructor profile. ${selectedTeam.championships} World Constructors' Championships, ${selectedTeam.base} headquarters, power unit specs, and driver line-up.`
      : 'Explore Formula 1 constructors from the 1950 inaugural season to the 2026 11-team grid, technical specifications, and championships.',
    canonicalPath: `/teams${selectedTeam ? `/${selectedTeam.id}` : ''}`,
    jsonLd: selectedTeam ? {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: selectedTeam.name,
      sport: 'Formula One',
      location: selectedTeam.base,
      description: selectedTeam.description
    } : undefined
  });

  const teamDrivers = getTeamDrivers(selectedTeam.id);
  const seasonsWon = getSeasonsWonByTeam(selectedTeam.id);

  const visibleTeams = useMemo(() => {
    if (grid === '2026' || grid === 'active') return getActive2026Teams();
    if (grid === 'historic') return getHistoricTeams();
    return allTeams;
  }, [grid, allTeams]);

  const handleSelectTeam = (id: string) => {
    navigate(`/teams/${id}`);
  };

  const teamColumns: ColumnDef<Team, any>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'CONSTRUCTOR',
        cell: (info) => {
          const t = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs tracking-tight">
                {t.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'championships',
        header: 'WCC',
        size: 60,
        cell: (info) => {
          const count = Number(info.getValue());
          return count > 0 ? (
            <span className="font-telemetry font-bold text-xs text-amber-400">
              {count}
            </span>
          ) : (
            <span className="text-slate-600 font-telemetry">—</span>
          );
        },
      },
      {
        accessorKey: 'isActive2026',
        header: 'ERA',
        size: 70,
        cell: (info) => {
          const t = info.row.original;
          return t.isActive2026 ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-telemetry font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              2026
            </span>
          ) : (
            <span className="text-slate-500 text-[10px] font-telemetry">
              HISTORIC
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="teams-archive-page archive-layout max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar / Timing Tower */}
        <aside className="lg:col-span-4 bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-4 space-y-4" aria-label="Constructors list">
          <div className="flex items-center justify-between text-xs font-telemetry border-b border-slate-800/80 pb-3">
            <span className="text-cyan-400 font-bold">// CONSTRUCTORS</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{visibleTeams.length} TEAMS</span>
              <CopyShareLinkButton />
            </div>
          </div>

          {/* Filter Tabs: Active 2026 / Historic / All */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded border border-slate-800">
            <button
              type="button"
              className={`py-1.5 text-[11px] font-telemetry font-bold rounded transition-colors ${
                grid === '2026' || grid === 'active'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setGrid('2026')}
            >
              ACTIVE 2026
            </button>
            <button
              type="button"
              className={`py-1.5 text-[11px] font-telemetry font-bold rounded transition-colors ${
                grid === 'historic'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setGrid('historic')}
            >
              HISTORIC
            </button>
            <button
              type="button"
              className={`py-1.5 text-[11px] font-telemetry font-bold rounded transition-colors ${
                grid === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setGrid('all')}
            >
              ALL
            </button>
          </div>

          {/* Timing Tower Table */}
          <TelemetryDataTable
            data={visibleTeams}
            columns={teamColumns}
            getRowId={(t) => t.id}
            selectedRowId={selectedTeam.id}
            getRowTeamColor={(t) => t.color}
            onRowClick={(t) => handleSelectTeam(t.id)}
            maxHeightPx={560}
            rowHeightPx={38}
            emptyMessage="No constructors found"
            ariaLabel="Constructors Timing Tower"
          />
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-8 space-y-6">
          {/* Team Hero Header */}
          <div
            className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-6 relative overflow-hidden"
            style={{ borderLeft: `4px solid ${selectedTeam.color}` }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded bg-slate-900 border border-slate-700/60 p-2 flex items-center justify-center">
                  <FallbackImage
                    src={selectedTeam.logoUrl}
                    alt={`${selectedTeam.name} Logo`}
                    type="team"
                    teamId={selectedTeam.id}
                    accentColor={selectedTeam.color}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-telemetry text-xs text-slate-400 flex-wrap mb-1">
                    <span>CONSTRUCTOR ID: #{selectedTeam.id.toUpperCase()}</span>
                    <span>•</span>
                    <span>ENTRY YEAR: {selectedTeam.firstEntry}</span>
                    <span>•</span>
                    <span className="text-cyan-400">F1DB SYNCED (v{meta.f1dbVersion})</span>
                  </div>
                  <h1 className="text-3xl font-black text-slate-100 tracking-tight font-headline" style={{ color: selectedTeam.color }}>
                    {selectedTeam.name}
                  </h1>
                  <span className="font-telemetry text-xs text-slate-400 block mt-1">
                    CHASSIS: <strong className="text-slate-200">{selectedTeam.carName}</strong>
                  </span>
                </div>
              </div>

              <div>
                <Link
                  to={`/cars/${selectedTeam.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-telemetry font-bold tracking-wider uppercase border transition-colors hover:brightness-125"
                  style={{
                    borderColor: selectedTeam.color,
                    backgroundColor: `${selectedTeam.color}22`,
                    color: selectedTeam.color,
                  }}
                >
                  <span>INSPECT 3D CHASSIS →</span>
                </Link>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-5 leading-relaxed">{selectedTeam.description}</p>
          </div>

          {/* Team Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="WORLD CHAMPIONSHIPS"
              value={selectedTeam.championships}
              subtext="Constructors Titles"
              accentColor="#FFD700"
              isPrimary={selectedTeam.championships > 0}
            />
            <StatCard
              label="POLE POSITIONS"
              value={selectedTeam.polePositions}
              subtext="Pole Positions"
              accentColor={selectedTeam.color}
            />
            <StatCard
              label="FASTEST LAPS"
              value={selectedTeam.fastestLaps}
              subtext="Fastest Laps"
              accentColor="#00D2FF"
            />
            <StatCard
              label="OPERATIONAL BASE"
              value={selectedTeam.base.split(',')[0]}
              subtext={selectedTeam.base}
              accentColor="#C0C0C0"
            />
          </div>

          {/* Current Active Pilots */}
          {teamDrivers.length > 0 && (
            <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTeam.color }} />
                <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-telemetry">
                  // OFFICIAL PILOTS ROSTER
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamDrivers.map((driver) => (
                  <Link
                    key={driver.id}
                    to={`/drivers/${driver.id}`}
                    className="flex items-center justify-between p-3.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                    style={{ borderLeft: `3px solid ${selectedTeam.color}` }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-telemetry font-bold text-sm" style={{ color: selectedTeam.color }}>
                          {driver.number ? `#${driver.number}` : driver.code || '—'}
                        </span>
                        <span className="font-bold text-slate-100 text-sm">{driver.name}</span>
                      </div>
                      <div className="font-telemetry text-xs text-slate-400 mt-1">
                        <span>{driver.country}</span> • <span>{driver.wins} WINS</span>
                        {driver.championships > 0 && <span className="text-amber-400 ml-1">• {driver.championships}x WDC</span>}
                      </div>
                    </div>
                    <span className="text-slate-500 font-telemetry">→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Technical Specifications */}
          <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-telemetry">
                TECHNICAL SPECIFICATIONS & ARCHITECTURE
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/60">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">POWER UNIT</span>
                <strong className="text-slate-200 text-sm font-headline block mt-1">{selectedTeam.specs.powerUnit}</strong>
              </div>
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/60">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">CHASSIS</span>
                <strong className="text-slate-200 text-sm font-headline block mt-1">{selectedTeam.specs.chassis}</strong>
              </div>
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/60">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">MINIMUM WEIGHT</span>
                <strong className="text-slate-200 text-sm font-headline block mt-1">{selectedTeam.specs.weight}</strong>
              </div>
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/60">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">AERODYNAMICS</span>
                <strong className="text-slate-200 text-sm font-headline block mt-1">{selectedTeam.specs.downforce} Downforce</strong>
              </div>
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/60">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">TOP SPEED</span>
                <strong className="text-slate-200 text-sm font-headline block mt-1">{selectedTeam.specs.topSpeed}</strong>
              </div>
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/60">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">TEAM PRINCIPAL</span>
                <strong className="text-slate-200 text-sm font-headline block mt-1">{selectedTeam.principal}</strong>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
