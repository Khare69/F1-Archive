import React, { useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import { getAllSeasons, getSeasonByYear, getTeamById, getF1DBMetadata } from '../../data/dataService';
import type { Season } from '../../types/f1';
import { StatCard } from '../../components/StatCard/StatCard';
import { usePageMeta } from '../../hooks/usePageMeta';
import { TelemetryDataTable } from '../../components/ui/TelemetryDataTable';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';

const SeasonProgressionChart = lazy(() =>
  import('./components/SeasonProgressionChart').then(m => ({ default: m.SeasonProgressionChart }))
);
const WhatIfSimulator = lazy(() =>
  import('../analytics/WhatIfSimulator').then(m => ({ default: m.WhatIfSimulator }))
);

const DECADES = [
  { label: '2020s', startYear: 2020, targetYear: 2026 },
  { label: '2010s', startYear: 2010, targetYear: 2019 },
  { label: '2000s', startYear: 2000, targetYear: 2009 },
  { label: '1990s', startYear: 1990, targetYear: 1999 },
  { label: '1980s', startYear: 1980, targetYear: 1989 },
  { label: '1970s', startYear: 1970, targetYear: 1979 },
  { label: '1960s', startYear: 1960, targetYear: 1969 },
  { label: '1950s', startYear: 1950, targetYear: 1959 },
];

export const SeasonsArchive: React.FC = () => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const seasons = getAllSeasons();
  const meta = getF1DBMetadata();
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  // Validate year parameter or default to latest season
  const selectedSeason = getSeasonByYear(yearParam) || seasons[0];
  const viewMode = (searchParams.get('view') as 'overview' | 'chart' | 'whatif') || 'overview';

  const [era, setEra] = useQueryState(
    'era',
    parseAsStringLiteral([
      'all',
      '1950s',
      '1960s',
      '1970s',
      '1980s',
      '1990s',
      '2000s',
      '2010s',
      '2020s',
    ] as const).withDefault('all')
  );

  usePageMeta({
    title: `${selectedSeason.year} Season — Formula 1 World Championship`,
    description: `Inspect ${selectedSeason.year} Formula 1 championship standings, race progression, defining milestones, and cross-era points simulation.`,
    canonicalPath: `/seasons/${selectedSeason.year}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${selectedSeason.year} FIA Formula One World Championship`,
      startDate: `${selectedSeason.year}-01-01`,
      endDate: `${selectedSeason.year}-12-31`,
      sport: 'Formula 1 Motor Racing'
    }
  });

  const chronologicalSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => a.year - b.year);
  }, [seasons]);

  const currentDecade = useMemo(() => {
    const yr = selectedSeason.year;
    const dec = DECADES.find(d => yr >= d.startYear && yr <= (d.targetYear || d.startYear + 9));
    return dec?.label || '2020s';
  }, [selectedSeason.year]);

  useEffect(() => {
    if (timelineTrackRef.current) {
      const activeNode = timelineTrackRef.current.querySelector('.timeline-node.active') as HTMLElement;
      if (activeNode) {
        const container = timelineTrackRef.current;
        const scrollLeft = activeNode.offsetLeft - container.offsetWidth / 2 + activeNode.offsetWidth / 2;
        if (typeof container.scrollTo === 'function') {
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        } else {
          container.scrollLeft = scrollLeft;
        }
      }
    }
  }, [selectedSeason.year]);

  const visibleSeasons = useMemo(() => {
    if (era === 'all') return seasons;
    const dec = DECADES.find((d) => d.label.toLowerCase() === era.toLowerCase());
    if (!dec) return seasons;
    return seasons.filter(
      (s) => s.year >= dec.startYear && s.year <= (dec.targetYear || dec.startYear + 9)
    );
  }, [seasons, era]);

  const handleSelectSeason = (year: number) => {
    navigate(`/seasons/${year}`);
  };

  const handleJumpDecade = (targetYear: number, label?: string) => {
    if (label) {
      setEra(label.toLowerCase() as any);
    }
    navigate(`/seasons/${targetYear}`);
  };

  const handleSetView = (newView: 'overview' | 'chart' | 'whatif') => {
    if (newView === 'overview') {
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ view: newView }, { replace: true });
    }
  };

  const seasonColumns: ColumnDef<Season, any>[] = useMemo(
    () => [
      {
        accessorKey: 'year',
        header: 'YEAR',
        size: 70,
        cell: (info) => (
          <span className="font-telemetry font-black text-sm text-slate-100">
            {Number(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'championDriver',
        header: 'CHAMPION',
        cell: (info) => {
          const s = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 text-xs">
                {s.championDriver}
              </span>
              <span className="font-telemetry text-[10px] text-slate-500">
                {s.championTeam}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'races',
        header: 'GPS',
        size: 55,
        cell: (info) => (
          <span className="font-telemetry font-bold text-xs text-slate-400">
            {Number(info.getValue())}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar / Timing Tower */}
        <aside className="lg:col-span-4 bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-4 space-y-4" aria-label="Seasons list">
          <div className="flex items-center justify-between text-xs font-telemetry border-b border-slate-800/80 pb-3">
            <span className="text-cyan-400 font-bold">// SELECT CAMPAIGN</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{visibleSeasons.length} SEASONS</span>
              <CopyShareLinkButton />
            </div>
          </div>

          <TelemetryDataTable
            data={visibleSeasons}
            columns={seasonColumns}
            getRowId={(s) => String(s.year)}
            selectedRowId={selectedSeason.year}
            getRowTeamColor={(s) => getTeamById(s.championTeamId || undefined)?.color || '#00D2FF'}
            onRowClick={(s) => handleSelectSeason(s.year)}
            maxHeightPx={560}
            rowHeightPx={38}
            emptyMessage="No seasons found"
            ariaLabel="Seasons Timing Tower"
          />
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-8 space-y-6">
          {/* Interactive Championship Timeline */}
          <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-telemetry text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="text-cyan-400 font-bold">// CHAMPIONSHIP CHRONOLOGY TIMELINE (1950 - 2026)</span>
              <span>CLICK NODE TO INSPECT ERA</span>
            </div>

            {/* Decade Jump Selector */}
            <div className="flex items-center gap-1.5 flex-wrap font-telemetry text-xs">
              <span className="text-slate-500 mr-1">// JUMP ERA:</span>
              <button
                type="button"
                className={`px-2 py-1 rounded border transition-colors ${
                  era === 'all'
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
                onClick={() => setEra('all')}
              >
                ALL
              </button>
              {DECADES.map(d => (
                <button
                  key={d.label}
                  type="button"
                  className={`px-2 py-1 rounded border transition-colors ${
                    (era !== 'all' ? era.toLowerCase() === d.label.toLowerCase() : currentDecade === d.label)
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  onClick={() => handleJumpDecade(d.targetYear, d.label)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto scrollbar-thin py-2">
              <div className="flex items-center gap-3 min-w-max px-2" ref={timelineTrackRef}>
                {chronologicalSeasons.map((s) => {
                  const team = getTeamById(s.championTeamId || undefined);
                  const nodeColor = team?.color || '#00D2FF';
                  const isSelected = selectedSeason.year === s.year;

                  return (
                    <button
                      key={s.year}
                      type="button"
                      className={`timeline-node flex flex-col items-center gap-1 p-1 rounded transition-transform ${
                        isSelected ? 'scale-110 active' : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => handleSelectSeason(s.year)}
                      title={`${s.year}: ${s.championDriver} (${s.championTeam})`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full transition-all"
                        style={{
                          backgroundColor: nodeColor,
                          boxShadow: isSelected ? `0 0 12px ${nodeColor}` : undefined
                        }}
                      />
                      <span className="font-telemetry text-[10px] text-slate-400 font-bold">{s.year}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Season Header */}
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="font-telemetry text-xs text-slate-400">FIA FORMULA ONE WORLD CHAMPIONSHIP</span>
              <div className="flex items-center gap-2 font-telemetry text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  OFFICIALLY INDEXED
                </span>
                <span className="text-cyan-400">F1DB SYNCED (v{meta.f1dbVersion})</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-black text-slate-100 tracking-tight font-headline">
                {selectedSeason.year}
              </h1>
              <div className="text-right">
                <span className="font-telemetry text-[10px] text-slate-500 block uppercase">CALENDAR</span>
                <span className="text-lg font-black text-slate-200 font-headline">{selectedSeason.races} GRANDS PRIX</span>
              </div>
            </div>

            {/* View Mode Navigation Tabs */}
            <div className="flex items-center gap-2 border-t border-slate-800/80 pt-4 flex-wrap">
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-xs font-telemetry font-bold tracking-wider transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 active'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
                }`}
                onClick={() => handleSetView('overview')}
              >
                [ OVERVIEW & RECORDS ]
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-xs font-telemetry font-bold tracking-wider transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 active'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
                }`}
                onClick={() => handleSetView('chart')}
              >
                📈 [ PROGRESSION CHART ]
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-xs font-telemetry font-bold tracking-wider transition-colors ${
                  viewMode === 'whatif'
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 active'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
                }`}
                onClick={() => handleSetView('whatif')}
              >
                ⚡ [ 'WHAT-IF' SIMULATOR ]
              </button>
            </div>
          </div>

          {/* Conditional View Rendering */}
          {viewMode === 'chart' && (
            <Suspense
              fallback={
                <div className="p-12 text-center text-slate-500 font-telemetry text-xs">
                  // LOADING 100% VECTOR SVG PROGRESSION...
                </div>
              }
            >
              <SeasonProgressionChart year={selectedSeason.year} />
            </Suspense>
          )}

          {viewMode === 'whatif' && (
            <Suspense
              fallback={
                <div className="p-12 text-center text-slate-500 font-telemetry text-xs">
                  // INITIALIZING WHAT-IF ENGINE...
                </div>
              }
            >
              <WhatIfSimulator year={selectedSeason.year} />
            </Suspense>
          )}

          {viewMode === 'overview' && (
            <>
              {/* Championship Podium Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 border-l-4 border-l-amber-400 space-y-2">
                  <div className="font-telemetry text-xs text-amber-400 font-bold tracking-wider">WORLD DRIVERS' CHAMPION</div>
                  <div className="text-2xl font-black text-slate-100 font-headline">{selectedSeason.championDriver}</div>
                  {selectedSeason.championDriverId ? (
                    <Link to={`/drivers/${selectedSeason.championDriverId}`} className="font-telemetry text-xs text-cyan-400 hover:underline block pt-1">
                      VIEW DRIVER PROFILE →
                    </Link>
                  ) : (
                    <span className="font-telemetry text-xs text-slate-500 block pt-1">LEGACY RECORD</span>
                  )}
                </div>

                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 border-l-4 border-l-cyan-400 space-y-2">
                  <div className="font-telemetry text-xs text-cyan-400 font-bold tracking-wider">CONSTRUCTORS' CHAMPION</div>
                  <div className="text-2xl font-black text-slate-100 font-headline">{selectedSeason.championTeam}</div>
                  {selectedSeason.championTeamId ? (
                    <Link to={`/teams/${selectedSeason.championTeamId}`} className="font-telemetry text-xs text-cyan-400 hover:underline block pt-1">
                      VIEW CONSTRUCTOR PROFILE →
                    </Link>
                  ) : (
                    <span className="font-telemetry text-xs text-slate-500 block pt-1">PRE-1958 INAUGURAL ERA</span>
                  )}
                </div>
              </div>

              {/* Notable Events & Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-telemetry">
                      ERA MILESTONES &amp; DEFINING EVENTS
                    </h2>
                  </div>
                  <ul className="space-y-2 text-xs font-telemetry text-slate-300">
                    {selectedSeason.notableEvents.map((event, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold flex-shrink-0">// 0{idx + 1}</span>
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-telemetry">
                      HISTORICAL RECORDS &amp; BENCHMARKS
                    </h2>
                  </div>
                  <ul className="space-y-2 text-xs font-telemetry text-slate-300">
                    {selectedSeason.recordsBroken.map((record, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold flex-shrink-0">// REC</span>
                        <span>{record}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="CHAMPION PILOT"
                  value={selectedSeason.championDriver.split(' ').pop() || 'TBD'}
                  subtext={selectedSeason.championDriver}
                  accentColor="#FFD700"
                  isPrimary
                />
                <StatCard
                  label="CHAMPION CONSTRUCTOR"
                  value={selectedSeason.championTeam.split(' ')[0] || 'TBD'}
                  subtext={selectedSeason.championTeam}
                  accentColor="#00D2FF"
                />
                <StatCard
                  label="ROUNDS CONTESTED"
                  value={selectedSeason.races}
                  subtext="Championship Grands Prix"
                  accentColor="#00E701"
                />
                <StatCard
                  label="ERA CHRONOLOGY"
                  value={`${selectedSeason.year}`}
                  subtext={`Season #${selectedSeason.year - 1949} of ${seasons.length}`}
                  accentColor="#FFFFFF"
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
