import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryState, parseAsStringLiteral, parseAsInteger } from 'nuqs';
import { getAllCircuits, getCircuitById, getF1DBMetadata } from '../../data/dataService';
import { StatCard } from '../../components/StatCard/StatCard';
import { Track3DViewer } from './Track3DViewer';
import { CornerDnaPanel } from './CornerDnaPanel';
import { useCircuitGeometry } from './circuitGeometryClient';
import { getCuratedCorners, buildFallbackApexMarkers } from '../../data/circuitCorners';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';
import { usePageMeta } from '../../hooks/usePageMeta';
import { F1TermTooltip } from '../../components/ui/F1TermTooltip';
import { InsightBanner } from '../../components/ui/InsightBanner';
import { InspectQueryButton } from '../../components/DevTools/InspectQueryButton';
import type { RibbonColorMode } from './geometry/circuitRibbonBuilder';

const MODERN_CALENDAR_IDS = new Set([
  'bahrain', 'jeddah', 'melbourne', 'suzuka', 'shanghai', 'miami',
  'imola', 'monaco', 'montreal', 'catalunya', 'spielberg', 'silverstone',
  'hungaroring', 'spa-francorchamps', 'zandvoort', 'monza', 'baku',
  'marina-bay', 'austin', 'mexico-city', 'interlagos', 'las-vegas',
  'lusail', 'yas-marina'
]);

export const CircuitsArchive: React.FC = () => {
  const { circuitId } = useParams<{ circuitId?: string }>();
  const navigate = useNavigate();
  const allCircuits = getAllCircuits();
  const meta = getF1DBMetadata();

  // nuqs shareable URL state
  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsStringLiteral(['3d', '2d'] as const).withDefault('3d')
  );
  const [colorMode, setColorMode] = useQueryState(
    'color',
    parseAsStringLiteral(['sectors', 'elevation', 'speed_drs'] as const).withDefault('sectors')
  );
  const [cornerParam, setCornerParam] = useQueryState('corner', parseAsInteger);

  const [filterMode, setFilterMode] = useState<'all' | 'overtaking' | 'high_downforce'>('all');
  const [activeBottomTab, setActiveBottomTab] = useState<'winners' | 'eras'>('winners');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCircuit = getCircuitById(circuitId) || allCircuits[0]!;

  // Lazy circuit geometry fetch
  const { data: geometryData } = useCircuitGeometry(selectedCircuit?.id);

  // Grouped circuits list
  const { modernCircuits, historicCircuits } = useMemo(() => {
    const clean = searchQuery.trim().toLowerCase();
    const filtered = clean
      ? allCircuits.filter(
          (c) =>
            c.name.toLowerCase().includes(clean) ||
            c.country.toLowerCase().includes(clean) ||
            c.city.toLowerCase().includes(clean)
        )
      : allCircuits;

    return {
      modernCircuits: filtered.filter((c) => MODERN_CALENDAR_IDS.has(c.id)),
      historicCircuits: filtered.filter((c) => !MODERN_CALENDAR_IDS.has(c.id))
    };
  }, [allCircuits, searchQuery]);

  // Curated corners vs. fallback apexes
  const curatedCorners = useMemo(() => getCuratedCorners(selectedCircuit.id), [selectedCircuit.id]);
  const isAutoDetected = curatedCorners.length === 0;

  const corners = useMemo(() => {
    if (curatedCorners.length > 0) return curatedCorners;
    const coords = geometryData?.coordinates || selectedCircuit.trackCoordinates || [];
    return buildFallbackApexMarkers(coords);
  }, [curatedCorners, geometryData?.coordinates, selectedCircuit.trackCoordinates]);

  // Safe selected corner handling
  const selectedCornerNumber = useMemo(() => {
    if (cornerParam != null && corners.some((c) => c.number === cornerParam)) {
      return cornerParam;
    }
    return corners[0]?.number ?? null;
  }, [cornerParam, corners]);

  const handleSelectCorner = (num: number | null) => {
    setCornerParam(num);
  };

  const poleRateLabel =
    selectedCircuit.poleToWinRate != null ? `${selectedCircuit.poleToWinRate}%` : 'N/A';
  const poleRateSubtext =
    selectedCircuit.racesWithRecordedPole && selectedCircuit.racesWithRecordedPole > 0
      ? `${selectedCircuit.poleToWinCount}/${selectedCircuit.racesWithRecordedPole} recorded GPs`
      : 'Sample size pending';

  usePageMeta({
    title: `${selectedCircuit.name} (${selectedCircuit.country}) — Grand Prix Circuit Archive`,
    description: `Explore ${selectedCircuit.name} 3D topography, elevation ribbon, official lap record, and corner DNA telemetry.`,
    canonicalPath: `/circuits/${selectedCircuit.id}`
  });

  return (
    <div className="circuits-archive-page w-full min-h-screen bg-[#07090E] text-slate-200 p-4 lg:p-6 space-y-5 flex flex-col">
      {/* ── Top Header Strip ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#0B0E14] border border-white/10 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Circuit Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedCircuit.id}
              onChange={(e) => navigate(`/circuits/${e.target.value}`)}
              className="bg-[#121620] text-white font-mono text-sm border border-white/20 rounded px-3 py-2 pr-8 focus:outline-none focus:border-sky-500 cursor-pointer"
              aria-label="Select Grand Prix Circuit"
            >
              <optgroup label="2026 Active Modern Calendar">
                {modernCircuits.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏁 {c.name} ({c.country})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Classic & Historic Venues">
                {historicCircuits.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏛️ {c.name} ({c.country})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950/70 text-sky-400 border border-sky-500/30">
              {selectedCircuit.type ? `${selectedCircuit.type.toUpperCase()} TRACK` : 'PERMANENT TRACK'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              📍 {selectedCircuit.city}, {selectedCircuit.country}
            </span>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              ● F1DB v{meta.f1dbVersion}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InspectQueryButton
            query={{
              title: `${selectedCircuit.name} Historical Grand Prix Winners (SQLite)`,
              sql: `SELECT r.year, r.round, r.official_name, d.name AS winner FROM race r JOIN race_result rr ON r.id = rr.race_id JOIN driver d ON rr.driver_id = d.id WHERE r.circuit_id = '${selectedCircuit.id}' AND rr.position_number = 1 ORDER BY r.year DESC LIMIT 20;`,
            }}
            label="Circuit SQL"
          />
          <CopyShareLinkButton label="Share Circuit View" />
        </div>
      </header>

      {/* Beginner Insight Banner */}
      <InsightBanner
        title="Circuit Characteristics & Downforce"
        insight="Tracks with heavy elevation shifts and sweeping chicanes (like Spa and Suzuka) demand high aerodynamic downforce, while long-straight circuits (like Monza) prioritize low drag and slipstreaming."
        ruleTag="CIRCUIT TELEMETRY"
      />

      {/* ── Circuit KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="CIRCUIT LENGTH"
          value={selectedCircuit.lengthKm || 'N/A'}
          subtext="Official Distance"
          accentColor="#00D2FF"
        />
        <StatCard
          label="TOTAL TURNS"
          value={selectedCircuit.turns != null ? selectedCircuit.turns : 'N/A'}
          subtext="Numbered Corners"
          accentColor="#38BDF8"
        />
        <StatCard
          label="ELEVATION CHANGE"
          value={geometryData?.elevationDeltaM ? `${geometryData.elevationDeltaM}m` : selectedCircuit.elevation || 'N/A'}
          subtext={geometryData?.elevationSource === 'open-meteo-srtm' ? 'Open-Meteo SRTM' : 'Altitude Delta'}
          accentColor="#FFD700"
        />
        <StatCard
          label={
            <F1TermTooltip termKey="pole-to-win">
              <span>POLE-TO-WIN RATE</span>
            </F1TermTooltip>
          }
          value={poleRateLabel}
          subtext={poleRateSubtext}
          accentColor="#E10600"
        />
        <StatCard
          label="TOTAL RACES"
          value={selectedCircuit.totalRaces != null ? selectedCircuit.totalRaces : 'N/A'}
          subtext={`First GP: ${selectedCircuit.firstGP ?? 'N/A'}`}
          accentColor="#22C55E"
        />
      </div>

      {/* ── 65% / 35% Desktop Split Viewport (I-03) ── */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 65%: 3D Elevation / 2D SVG Viewport */}
        <div className="lg:col-span-8 flex flex-col">
          <Track3DViewer
            circuitName={selectedCircuit.name}
            coordinates={geometryData?.coordinates || selectedCircuit.trackCoordinates || []}
            elevationDeltaM={geometryData?.elevationDeltaM ?? null}
            elevationSource={geometryData?.elevationSource}
            trackSpanMeters={geometryData?.trackSpanMeters}
            viewMode={viewMode}
            onViewModeChange={(m) => setViewMode(m)}
            colorMode={colorMode}
            onColorModeChange={(c) => setColorMode(c)}
            corners={corners}
            selectedCornerNumber={selectedCornerNumber}
            onSelectCorner={handleSelectCorner}
            filterMode={filterMode}
          />
        </div>

        {/* Right 35%: Corner DNA Inspector */}
        <div className="lg:col-span-4 flex flex-col h-[540px]">
          <CornerDnaPanel
            circuitName={selectedCircuit.name}
            corners={corners}
            isAutoDetected={isAutoDetected}
            selectedCornerNumber={selectedCornerNumber}
            onSelectCorner={handleSelectCorner}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
          />
        </div>
      </main>

      {/* ── Bottom Section: Past Winners & Eras ── */}
      <section className="bg-[#0B0E14] border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                activeBottomTab === 'winners'
                  ? 'bg-sky-500 text-black font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveBottomTab('winners')}
            >
              PAST WINNERS
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                activeBottomTab === 'eras'
                  ? 'bg-sky-500 text-black font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveBottomTab('eras')}
            >
              LAYOUT ERAS
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Last 10 Editions — Full history available in{' '}
            <Link to="/historian" className="text-sky-400 hover:underline">
              SQL Historian ↗
            </Link>
          </span>
        </div>

        {activeBottomTab === 'winners' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs" aria-label={`Recent winners at ${selectedCircuit.name}`}>
              <thead className="bg-black/40 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-2.5">YEAR</th>
                  <th className="p-2.5">WINNER</th>
                  <th className="p-2.5">CONSTRUCTOR</th>
                  <th className="p-2.5 text-center">GRID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedCircuit.pastWinners && selectedCircuit.pastWinners.length > 0 ? (
                  selectedCircuit.pastWinners.slice(0, 10).map((w) => (
                    <tr key={w.year} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 text-sky-400 font-bold">{w.year}</td>
                      <td className="p-2.5 text-white font-semibold">{w.driverName}</td>
                      <td className="p-2.5 text-slate-300">{w.constructorName}</td>
                      <td className="p-2.5 text-center text-slate-400">P{w.gridPosition ?? 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No historical winners recorded in this layout era.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedCircuit.layoutEras && selectedCircuit.layoutEras.length > 0 ? (
              selectedCircuit.layoutEras.map((layout) => (
                <div
                  key={layout.layoutId}
                  className={`p-3 rounded border font-mono text-xs ${
                    layout.effective ? 'bg-sky-950/20 border-sky-500/50' : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-white">{layout.layoutId}</strong>
                    {layout.effective && (
                      <span className="px-1.5 py-0.5 bg-sky-500 text-black text-[9px] font-bold rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div>Length: <strong className="text-slate-200">{layout.lengthKm} km</strong></div>
                    <div>Turns: <strong className="text-slate-200">{layout.turns}</strong></div>
                    <div>Active: <strong className="text-slate-200">{layout.years}</strong></div>
                    <div>GPs Held: <strong className="text-slate-200">{layout.racesCount}</strong></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-slate-500 font-mono text-xs">
                Single historical layout configuration.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
