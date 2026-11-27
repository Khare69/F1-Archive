import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, Activity, Zap, Flag, History } from 'lucide-react';
import { getArchiveStats } from '../../data/dataService';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useDriverStandingsQuery } from '../../api/jolpicaClient';
import { OnThisDayWidget } from './components/OnThisDayWidget';
import { FavoritesWidget } from './components/FavoritesWidget';
import { F1TermTooltip } from '../../components/ui/F1TermTooltip';
import { InsightBanner } from '../../components/ui/InsightBanner';
import { InspectQueryButton } from '../../components/DevTools/InspectQueryButton';

export const Home: React.FC = () => {
  const stats = getArchiveStats();
  const { data: standingsData } = useDriverStandingsQuery('current');
  const topDrivers = standingsData?.data.standings?.slice(0, 10) || [];

  usePageMeta({
    title: 'The Evolution of Speed — F1 Historical Telemetry Vault (1950–2026)',
    description:
      'Step into 77 unbroken Formula 1 seasons (1950–2026), 900+ drivers, 3D CAD chassis models, aerodynamic simulations, and what-if championship simulators.',
    canonicalPath: '/',
  });

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F4F6FA] pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Season Pulse Hero (I-02) */}
        <section className="p-6 rounded-[4px] bg-[#11151E] border border-white/8 relative overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                HISTORICAL TELEMETRY VAULT // 1950–2026 • F1DB SYNCED (v{stats.f1dbVersion})
              </span>
            </div>
            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/8 text-neutral-400">
              {stats.seasonsCount} SEASONS • {stats.driversCount}+ DRIVERS • {stats.circuitsCount} CIRCUITS
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase mb-3">
            THE EVOLUTION <span className="text-crimson">OF SPEED.</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed mb-6 font-normal">
            Explore 77 unbroken seasons of motorsport engineering, from classic 1950s front-engine machines to modern{' '}
            <F1TermTooltip termKey="ground-effect">ground-effect</F1TermTooltip> aerodynamics and 2026{' '}
            <F1TermTooltip termKey="active-aero">active aerodynamics</F1TermTooltip>.
          </p>

          {/* Quick Hub Launchers */}
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/seasons"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[3px] bg-crimson hover:bg-crimson/90 text-white text-xs font-mono uppercase tracking-wider font-bold transition-colors"
            >
              <span>Explore Seasons</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/lab"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[3px] bg-[#181D28] hover:bg-white/10 border border-white/10 text-white text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Vehicle Lab</span>
            </Link>
            <Link
              to="/telemetry"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[3px] bg-[#181D28] hover:bg-white/10 border border-white/10 text-white text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ghost Telemetry</span>
            </Link>
            <Link
              to="/pitwall"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[3px] bg-[#181D28] hover:bg-white/10 border border-white/10 text-white text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>Pit-Wall Strategy</span>
            </Link>
            <Link
              to="/historian"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[3px] bg-[#181D28] hover:bg-white/10 border border-white/10 text-white text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>SQL Historian</span>
            </Link>
          </div>
        </section>

        {/* Beginner Insight Banner */}
        <InsightBanner
          title="New to Formula 1?"
          insight="Formula 1 combines 1,000+ hp hybrid power units, high-downforce aerodynamics, and split-second pit strategy. Look for dotted underlines across the archive to inspect beginner-friendly glossary definitions."
          ruleTag="WHY THIS MATTERS"
          className="mb-6"
        />

        {/* 12-Column Asymmetric Bento Grid (I-02) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Left/Center Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* 3 Guided Starter Story Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                to="/seasons"
                className="p-3.5 rounded-[4px] bg-[#11151E] border border-white/8 hover:border-crimson/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-crimson font-bold mb-1">
                    HISTORIC DOMINANCE
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-crimson transition-colors mb-1">
                    1988 McLaren MP4/4
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Ayrton Senna & Alain Prost won 15 out of 16 Grands Prix in turbo supremacy.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white inline-flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
                  View 1988 Season <ChevronRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                to="/drivers/compare?d1=VER&d2=HAM"
                className="p-3.5 rounded-[4px] bg-[#11151E] border border-white/8 hover:border-cyan-400/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                    TITAN RIVALRY
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">
                    Verstappen vs. Hamilton
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Head-to-head career comparison across 2021 title fight, poles, and win conversions.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white inline-flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
                  Launch Comparison <ChevronRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                to="/lab"
                className="p-3.5 rounded-[4px] bg-[#11151E] border border-white/8 hover:border-emerald-400/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
                    REGULATION REVOLUTION
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                    2026 Active Aerodynamics
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Explore 3D models with movable wings, 50% electric power deployment, and Venturi floors.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white inline-flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
                  Open 3D Lab <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            {/* On This Day Widget */}
            <OnThisDayWidget />

            {/* Favorites Widget */}
            <FavoritesWidget />
          </div>

          {/* Right Sidebar Column (4 cols) — Timing Tower Preview */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-crimson" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                    Timing Tower // Standings
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <InspectQueryButton
                    query={{
                      title: 'All-Time Grand Prix Winners (F1DB SQLite)',
                      sql: 'SELECT d.name, d.abbreviation, COUNT(*) AS wins FROM race_result rr JOIN driver d ON rr.driver_id = d.id WHERE rr.position_number = 1 GROUP BY d.id ORDER BY wins DESC LIMIT 10;',
                    }}
                    label="SQL"
                  />
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    Top 10
                  </span>
                </div>
              </div>

              {topDrivers.length > 0 ? (
                <div className="flex flex-col gap-1 font-mono text-xs">
                  {topDrivers.map((entry, idx) => (
                    <div
                      key={entry.driverId}
                      className="flex items-center justify-between px-2 py-1.5 rounded-[3px] bg-[#181D28] border border-white/4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-[10px] text-neutral-500 font-bold">
                          {entry.position || idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-white">
                          {entry.driverCode || entry.driverName.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="text-neutral-400 text-[11px] truncate max-w-[120px]">
                          {entry.driverName}
                        </span>
                      </div>
                      <span className="text-neutral-200 font-bold tabular-nums">
                        {entry.points} <span className="text-[9px] text-neutral-500 font-normal">PTS</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs font-mono text-neutral-400 bg-[#181D28] rounded">
                  STANDINGS FEED SYNCHRONIZING...
                </div>
              )}

              <Link
                to="/standings"
                className="mt-3 inline-flex items-center justify-center w-full py-2 rounded-[3px] bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider transition-colors border border-white/8"
              >
                <span>Full Championship Standings</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
