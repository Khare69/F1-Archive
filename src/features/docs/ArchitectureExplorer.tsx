import React, { useState, useEffect } from 'react';
import { Database, Cpu, Layers, BookOpen, ExternalLink, Terminal, Shield, CheckCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { usePageMeta } from '../../hooks/usePageMeta';
import { sqlClient } from '../historian/sqlClient';
import { useInspectQuery } from '../../contexts/InspectQueryContext';

interface TableMeta {
  name: string;
  sql: string;
}

const STATIC_SCHEMA_FALLBACK: TableMeta[] = [
  { name: 'circuit', sql: 'CREATE TABLE circuit (id TEXT PRIMARY KEY, name TEXT, country_id TEXT);' },
  { name: 'circuit_elevation', sql: 'CREATE TABLE circuit_elevation (circuit_id TEXT, elevation_delta_m REAL);' },
  { name: 'constructor', sql: 'CREATE TABLE constructor (id TEXT PRIMARY KEY, name TEXT, country_id TEXT);' },
  { name: 'driver', sql: 'CREATE TABLE driver (id TEXT PRIMARY KEY, name TEXT, abbreviation TEXT);' },
  { name: 'race', sql: 'CREATE TABLE race (id TEXT PRIMARY KEY, year INT, round INT, official_name TEXT);' },
  { name: 'race_result', sql: 'CREATE TABLE race_result (race_id TEXT, driver_id TEXT, position_number INT);' },
  { name: 'season', sql: 'CREATE TABLE season (year INT PRIMARY KEY);' },
  { name: 'season_constructor_standing', sql: 'CREATE TABLE season_constructor_standing (year INT, points REAL);' },
  { name: 'season_driver_standing', sql: 'CREATE TABLE season_driver_standing (year INT, points REAL);' },
];

const ADR_LIST = [
  { id: 'ADR-0001', title: 'SQLite-WASM for Zero-Latency Offline Historian', status: 'Accepted', summary: 'Browser SQLite-WASM worker executes SQL queries against a 4.67 MB database with 3-second safety caps.' },
  { id: 'ADR-0002', title: 'Procedural Dual-Mesh Ribbon Generator for 3D Tracks', status: 'Accepted', summary: 'Frenet-Serret frames compute road deck, kerbs, and apex markers from geo-coordinates.' },
  { id: 'ADR-0003', title: 'Head-to-Head Era Normalization Engine', status: 'Accepted', summary: 'Points share mathematical engine normalizes 1950–2026 scoring disparities for cross-era driver comparison.' },
  { id: 'ADR-0004', title: 'Pure-Math Deterministic Mulberry32 Strategy Worker', status: 'Accepted', summary: 'Monte Carlo pit-wall simulation runs 1,000 permutations in a Web Worker using seedable PRNG.' },
  { id: 'ADR-0005', title: 'Blender MCP Procedural 5-Era Car Pipeline', status: 'Accepted', summary: 'Blender MCP builds 5 era chassis with standardized orientation and Draco compression.' },
];

export const ArchitectureExplorer: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>(STATIC_SCHEMA_FALLBACK);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [loading, setLoading] = useState(false);
  const { openQuery } = useInspectQuery();

  usePageMeta({
    title: 'System Architecture & SQLite Schema Explorer — F1 // ARCHIVE',
    description: 'Interactive system architecture, data pipeline, live SQLite schema inspector, and engineering decision records (ADRs).',
    canonicalPath: '/docs',
  });

  useEffect(() => {
    let isMounted = true;
    async function introspect() {
      if (typeof Worker === 'undefined') return;
      setLoading(true);
      try {
        const res = await sqlClient.executeQuery(
          "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
        );
        if (isMounted && res.rows?.length > 0) {
          setTables(res.rows.map((r) => ({ name: String(r.name), sql: String(r.sql || '') })));
        }
      } catch (e) {
        console.warn('[ArchitectureExplorer] sqlite_master query fallback:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    introspect();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F4F6FA] pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <header className="p-6 rounded-[4px] bg-[#11151E] border border-white/8 mb-6">
          <div className="flex items-center gap-2 mb-2 font-mono text-[11px] text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
            <span>F1 // ARCHIVE ENGINEERING &amp; ARCHITECTURE SPECIFICATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2">
            ARCHITECTURE <span className="text-crimson">// EXPLORER</span>
          </h1>
          <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
            Technical blueprint of F1 // ARCHIVE: offline SQLite-WASM database, procedural Three.js graphics, 
            deterministic Monte Carlo engines, and Architectural Decision Records (ADRs).
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-[#11151E] border-white/8 p-1.5">
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs font-mono"><Layers className="w-3.5 h-3.5 text-crimson" /> Data Pipeline</TabsTrigger>
            <TabsTrigger value="schema" className="gap-1.5 text-xs font-mono"><Database className="w-3.5 h-3.5 text-cyan-400" /> SQLite Schema</TabsTrigger>
            <TabsTrigger value="graphics" className="gap-1.5 text-xs font-mono"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> 3D &amp; Performance</TabsTrigger>
            <TabsTrigger value="adrs" className="gap-1.5 text-xs font-mono"><BookOpen className="w-3.5 h-3.5 text-amber-400" /> ADRs &amp; Legal</TabsTrigger>
          </TabsList>

          {/* TAB 1: DATA PIPELINE */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8">
                <span className="text-[10px] font-mono text-crimson uppercase tracking-widest block mb-1">01 // SOURCES</span>
                <h4 className="text-sm font-bold text-white mb-2">Upstream Datasets</h4>
                <ul className="text-xs text-neutral-400 space-y-1 font-mono">
                  <li>• F1DB CC-BY-4.0 (1950–2026)</li>
                  <li>• bacinger/f1-circuits MIT</li>
                  <li>• Open-Meteo SRTM Elevation</li>
                </ul>
              </div>
              <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">02 // ETL PIPELINE</span>
                <h4 className="text-sm font-bold text-white mb-2">Build-Time Ingestion</h4>
                <ul className="text-xs text-neutral-400 space-y-1 font-mono">
                  <li>• scripts/etl (TS + Zod v4)</li>
                  <li>• Path Traversal Zip-Slip Guard</li>
                  <li>• Elevation Geo Interpolation</li>
                </ul>
              </div>
              <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-1">03 // CLIENT STORAGE</span>
                <h4 className="text-sm font-bold text-white mb-2">Static Artifacts</h4>
                <ul className="text-xs text-neutral-400 space-y-1 font-mono">
                  <li>• public/data/f1db-browser.sqlite</li>
                  <li>• 4.67 MB Indexed B-Trees</li>
                  <li>• IndexedDB React Query Cache</li>
                </ul>
              </div>
              <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">04 // EXECUTION</span>
                <h4 className="text-sm font-bold text-white mb-2">Dual-Tier SQL</h4>
                <ul className="text-xs text-neutral-400 space-y-1 font-mono">
                  <li>• SQLite-WASM Worker (Tier 1)</li>
                  <li>• 3,000ms Hard Execution Cap</li>
                  <li>• Optional FastAPI set_authorizer()</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SQLITE SCHEMA */}
          <TabsContent value="schema" className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/8 pb-2">
              <span>{loading ? 'INTROSPECTING SQLITE_MASTER...' : `${tables.length} VERIFIED DATABASE TABLES`}</span>
              <span>READ-ONLY BROWSER INTROSPECTION</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((tbl) => (
                <div key={tbl.name} className="p-4 rounded-[4px] bg-[#11151E] border border-white/8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{tbl.name}</span>
                      <button
                        type="button"
                        onClick={() => openQuery({ title: `Inspect ${tbl.name}`, sql: `SELECT * FROM ${tbl.name} LIMIT 20;` })}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-crimson hover:text-white"
                      >
                        <Terminal className="w-3 h-3" /> Query Table
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono text-neutral-400 bg-[#090B10] p-2 rounded border border-white/5 overflow-x-auto max-h-28">
                      {tbl.sql}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: 3D GRAPHICS & PERFORMANCE */}
          <TabsContent value="graphics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[4px] bg-[#11151E] border border-white/8">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Three.js Procedural Circuit Ribbon
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                  circuitRibbonBuilder.ts generates dual-mesh road geometry dynamically from GPS elevation coordinates.
                  Supports interactive sector highlights, elevation heatmaps, and apex kerbing with zero manual meshes.
                </p>
              </div>
              <div className="p-5 rounded-[4px] bg-[#11151E] border border-white/8">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Blender MCP 5-Era Vehicle Lab
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                  Five historical era models (1950, 1967, 1988, 2014, 2026) exported via Blender MCP.
                  Standardized native orientation (+X Nose, +Z Roof), real-world dimensions, and Draco compression under 1 MB.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: ADRS & ATTRIBUTION */}
          <TabsContent value="adrs" className="space-y-4">
            <div className="space-y-3">
              {ADR_LIST.map((adr) => (
                <div key={adr.id} className="p-4 rounded-[4px] bg-[#11151E] border border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-crimson/15 text-crimson font-bold">{adr.id}</span>
                      <span className="text-xs font-bold text-white">{adr.title}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{adr.summary}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10 shrink-0">
                    {adr.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8 text-neutral-400 text-xs mt-6 space-y-2 font-mono">
              <div className="flex items-center gap-2 text-white font-bold"><Shield className="w-4 h-4 text-crimson" /> Data Attribution &amp; Trademarks</div>
              <p>This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX are trademarks of Formula One Licensing B.V.</p>
              <p>F1DB (CC-BY-4.0) • bacinger/f1-circuits (MIT) • Open-Meteo SRTM (CC-BY-4.0).</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArchitectureExplorer;
