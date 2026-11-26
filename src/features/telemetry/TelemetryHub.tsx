import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCircuitById } from '../../data/dataService';
import type { TelemetryShowdown, StrategySessionData } from '../../types/telemetry';
import { GhostLapViewer3D, type PlaybackHandle } from './components/GhostLapViewer3D';
import { TelemetryTraceChart } from './components/TelemetryTraceChart';
import { TransportControls } from './components/TransportControls';
import { LiveTelemetryGauges } from './components/LiveTelemetryGauges';
import { StrategyAnalytics } from './components/StrategyAnalytics';
import { TimingTower } from './components/TimingTower';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ExperimentalBadge } from '../../components/ui/ExperimentalBadge';
import {
  fetchTelemetryCatalog,
  getVisibleTelemetryPacks,
  fetchTelemetryPack,
} from './telemetryPackClient';
import type { TelemetryCatalogItem } from './telemetryPackSchema';
import './TelemetryHub.css';

interface ShowdownIndexItem {
  slug: string;
  title: string;
  subtitle: string;
  year: number;
  session: string;
  circuitId: string;
  circuitName: string;
  driverACode: string;
  driverBCode: string;
  driverAName: string;
  driverBName: string;
  driverAColor: string;
  driverBColor: string;
  lapTimeA: string;
  lapTimeB: string;
  delta: number;
  feedAvailability: string;
}

type TelemetryViewTab = 'ghost_replay' | 'timing_tower' | 'strategy_pace';

export const TelemetryHub: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TelemetryViewTab>('ghost_replay');
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const isDirectlyLinkedToSim = Boolean(slug && (slug.includes('sim') || slug.includes('2026')));
  const [includeExperimental, setIncludeExperimental] = useState<boolean>(isDirectlyLinkedToSim);

  // Auto-opt in if navigated directly to an experimental slug
  useEffect(() => {
    if (slug && (slug.includes('sim') || slug.includes('2026'))) {
      setIncludeExperimental(true);
    }
  }, [slug]);

  // Load telemetry catalog
  const { data: indexList } = useQuery<TelemetryCatalogItem[]>({
    queryKey: ['telemetry-pack-catalog'],
    queryFn: fetchTelemetryCatalog
  });

  const visiblePacks = useMemo(() => {
    return getVisibleTelemetryPacks(indexList || [], includeExperimental);
  }, [indexList, includeExperimental]);

  const activeSlug = slug || visiblePacks?.[0]?.slug || 'silverstone-2024-ham-vs-ver';

  // Load active showdown telemetry pack (Tier 1 Precomputed Offline Data)
  const { data: showdown, isLoading } = useQuery<TelemetryShowdown>({
    queryKey: ['telemetry-pack', activeSlug],
    queryFn: async () => {
      const pack = await fetchTelemetryPack(activeSlug);
      return pack as unknown as TelemetryShowdown;
    },
    enabled: Boolean(activeSlug)
  });

  const isExperimentalActive = Boolean(
    activeSlug.includes('sim') ||
    activeSlug.includes('2026') ||
    showdown?.provenance === 'experimental_simulation'
  );

  // Load strategy dataset
  const { data: strategyData } = useQuery<StrategySessionData>({
    queryKey: ['strategy_data', activeSlug],
    queryFn: async () => {
      const res = await fetch(`/data/telemetry/strategy-${activeSlug}.json`);
      if (!res.ok) throw new Error(`Failed to load strategy data: ${activeSlug}`);
      return res.json();
    },
    enabled: Boolean(activeSlug)
  });

  const circuit = showdown ? getCircuitById(showdown.circuitId) : undefined;
  const trackCoords: [number, number, number][] =
    circuit?.trackCoordinates && circuit.trackCoordinates.length > 3
      ? circuit.trackCoordinates
      : [
          [0, 0, 0],
          [4, 0.5, 0],
          [7, 1.2, 3],
          [5, 1.5, 6],
          [1, 0.8, 7],
          [-4, 0.2, 5],
          [-8, 0, 2],
          [-6, 0.2, -3],
          [0, 0, 0]
        ];

  const maxDuration = showdown
    ? Math.max(showdown.driverA.lapTimeSeconds, showdown.driverB.lapTimeSeconds)
    : 90.0;

  // Mutable Playback Ref for 60 FPS useFrame updates with 0 useState calls (Trap 4)
  const playbackRef = useRef<PlaybackHandle>({
    time: 0,
    duration: maxDuration,
    isPlaying: false,
    speed: 1.0
  });

  // Sync ref duration when showdown changes
  useEffect(() => {
    playbackRef.current.time = 0;
    playbackRef.current.duration = maxDuration;
    playbackRef.current.isPlaying = false;
    setPlaybackTime(0);
    setIsPlaying(false);
  }, [activeSlug, maxDuration]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    const nextState = !playbackRef.current.isPlaying;
    playbackRef.current.isPlaying = nextState;
    if (nextState && playbackRef.current.time >= maxDuration) {
      playbackRef.current.time = 0;
      setPlaybackTime(0);
    } else if (!nextState) {
      // Flush UI sync immediately on pause
      setPlaybackTime(playbackRef.current.time);
    }
    setIsPlaying(nextState);
  }, [maxDuration]);

  // Handle Seek
  const handleSeek = useCallback((time: number) => {
    playbackRef.current.time = time;
    setPlaybackTime(time);
  }, []);

  // Handle Speed Change
  const handleSpeedChange = useCallback((speed: number) => {
    playbackRef.current.speed = speed;
  }, []);

  // Handle Reset
  const handleReset = useCallback(() => {
    playbackRef.current.time = 0;
    playbackRef.current.isPlaying = false;
    setPlaybackTime(0);
    setIsPlaying(false);
  }, []);

  // Throttled time sync from 3D canvas loop
  const handleTimeUpdateFromCanvas = useCallback((time: number) => {
    setPlaybackTime(time);
    if (!playbackRef.current.isPlaying) {
      setIsPlaying(false);
    }
  }, []);

  // Change active showdown
  const handleSelectShowdown = (newSlug: string) => {
    navigate(`/telemetry/${newSlug}`);
  };

  // Route SEO & JSON-LD
  usePageMeta({
    title: showdown
      ? `${showdown.title} — 3D Telemetry Ghost-Lap & Strategy Analytics`
      : '3D Telemetry Ghost-Lap Replay & Strategy Analytics',
    description: showdown
      ? `Compare ${showdown.driverA.driverName} vs. ${showdown.driverB.driverName} at ${showdown.circuitName}. Interactive 3D ghost lap replay, 25 mini-sectors, and fuel-corrected tyre degradation analysis.`
      : '3D Telemetry Ghost-Lap Replay, 25-segment mini-sectors, and race pace tyre degradation modeling for Formula 1.',
    canonicalPath: `/telemetry${showdown ? `/${showdown.slug}` : ''}`,
    jsonLd: showdown
      ? {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: showdown.title,
          description: showdown.subtitle,
          location: {
            '@type': 'Place',
            name: showdown.circuitName
          },
          competitor: [
            {
              '@type': 'Person',
              name: showdown.driverA.driverName
            },
            {
              '@type': 'Person',
              name: showdown.driverB.driverName
            }
          ]
        }
      : undefined
  });

  return (
    <div className="telemetry-hub-page fade-in">
      <div className="telemetry-hub-container">
        {/* Top Header & Feed Status */}
        <section className="hub-header-section telemetry-panel corner-bracket">
          <div className="hub-header-top">
            <div className="hub-badge telemetry">
              <span className="badge-pulse"></span>
              <span>TELEMETRY VAULT // TIER 1 PRECOMPUTED GHOST-LAP ENGINE</span>
              <span className="feed-status-badge telemetry">
                {showdown?.feedAvailability === 'full' ? '● FULL TELEMETRY FEED (200 HZ)' : '◐ PARTIAL FEED'}
              </span>
            </div>

            <div className="hub-tab-switcher">
              <button
                type="button"
                className={`tab-btn telemetry ${activeTab === 'ghost_replay' ? 'active' : ''}`}
                onClick={() => setActiveTab('ghost_replay')}
              >
                <span>🎮 3D GHOST REPLAY</span>
              </button>
              <button
                type="button"
                className={`tab-btn telemetry ${activeTab === 'timing_tower' ? 'active' : ''}`}
                onClick={() => setActiveTab('timing_tower')}
              >
                <span>⏱ 20-CAR TIMING TOWER</span>
              </button>
              <button
                type="button"
                className={`tab-btn telemetry ${activeTab === 'strategy_pace' ? 'active' : ''}`}
                onClick={() => setActiveTab('strategy_pace')}
              >
                <span>📊 STRATEGY &amp; STINTS</span>
              </button>
            </div>
          </div>

          <h1 className="hub-main-title headline">
            {showdown?.title || '3D TELEMETRY GHOST-LAP REPLAY'}
          </h1>
          <p className="hub-main-subtitle telemetry">
            {showdown?.subtitle || 'SECTOR-ANCHORED MULTI-CHANNEL TELEMETRY BENCHMARK'}
          </p>

          {/* Showdown Selector Pills Carousel & Labs Toggle */}
          <div className="flex flex-col gap-2.5 mt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-telemetry text-[11px] uppercase tracking-wider text-neutral-400">
                SELECT TELEMETRY SHOWDOWN ({visiblePacks.length} AVAILABLE):
              </span>
              <button
                type="button"
                onClick={() => setIncludeExperimental((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11px] font-telemetry font-bold tracking-wider uppercase transition-colors ${
                  includeExperimental
                    ? 'border-[#EAB308]/60 bg-[#EAB308]/20 text-[#FACC15]'
                    : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={includeExperimental}
              >
                <span>{includeExperimental ? '✓ EXPERIMENTAL LABS INCLUDED' : '+ INCLUDE EXPERIMENTAL LABS'}</span>
              </button>
            </div>

            <div className="showdowns-pills-row">
              {visiblePacks.map((item) => {
                const isSelected = item.slug === activeSlug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    className={`showdown-pill telemetry ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectShowdown(item.slug)}
                  >
                    <span className="pill-dot" style={{ backgroundColor: item.driverAColor }}></span>
                    <span className="pill-title">{item.driverACode} vs {item.driverBCode}</span>
                    <span className="pill-circuit">{item.circuitName.split(' ')[0]}</span>
                    {item.provenance === 'experimental_simulation' && (
                      <span className="ml-1.5 shrink-0">
                        <ExperimentalBadge compact />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Amber Quarantine Disclaimer Banner when active showdown is experimental */}
        {isExperimentalActive && (
          <div className="my-3">
            <ExperimentalBadge
              label="EXPERIMENTAL // SIMULATION"
              disclaimer="Theoretical 2026 active aero & manual override simulation for the Circuito de Madrid. Not official FIA or verified historical telemetry."
            />
          </div>
        )}

        {isLoading || !showdown ? (
          <div className="telemetry-loading-banner telemetry-panel corner-bracket">
            <span className="badge-pulse"></span>
            <span className="telemetry">STREAMING PRECOMPUTED TELEMETRY CHANNELS...</span>
          </div>
        ) : (
          <>
            {activeTab === 'ghost_replay' ? (
              <div className="ghost-replay-layout">
                {/* 3D Track Ghost Replay Canvas (1 Draw Call Mini-Sectors) */}
                <GhostLapViewer3D
                  showdown={showdown}
                  trackCoordinates={trackCoords}
                  playbackRef={playbackRef}
                  currentTime={playbackTime}
                  isPlaying={isPlaying}
                  onTimeUpdate={handleTimeUpdateFromCanvas}
                />

                {/* Transport Controls Bar (Play/Pause, Scrubber, Shortcuts) */}
                <TransportControls
                  playbackRef={playbackRef}
                  currentTime={playbackTime}
                  duration={maxDuration}
                  isPlaying={isPlaying}
                  onPlayPauseToggle={handlePlayPause}
                  onSeek={handleSeek}
                  onSpeedChange={handleSpeedChange}
                  onReset={handleReset}
                />

                {/* Live Digital Telemetry Gauges (Speed, Gear, Throttle, Brake) */}
                <LiveTelemetryGauges showdown={showdown} currentTime={playbackTime} />

                {/* 2D Synchronized Telemetry Traces with 25 Mini-Sectors */}
                <TelemetryTraceChart
                  showdown={showdown}
                  currentTime={playbackTime}
                  duration={maxDuration}
                  onSeek={handleSeek}
                />
              </div>
            ) : activeTab === 'timing_tower' ? (
              <div className="timing-tower-layout">
                <TimingTower />
              </div>
            ) : (
              <div className="strategy-layout">
                <div className="strategy-top-action-bar">
                  <button
                    type="button"
                    className="pitwall-jump-btn telemetry"
                    onClick={() => navigate('/pitwall')}
                  >
                    ⚡ LAUNCH MONTE CARLO PIT WALL &amp; UNDERCUT SIMULATOR ➔
                  </button>
                </div>
                {strategyData ? (
                  <StrategyAnalytics
                    strategyData={strategyData}
                    circuitName={showdown.circuitName}
                  />
                ) : (
                  <div className="strategy-empty telemetry-panel">
                    <span className="telemetry">NO STINT PACE DATA FOR THIS SHOWDOWN</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
