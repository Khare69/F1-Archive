import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQueryStates, parseAsString, parseAsBoolean, parseAsStringLiteral } from 'nuqs';
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
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';
import {
  fetchTelemetryCatalog,
  getVisibleTelemetryPacks,
  fetchTelemetryPack,
} from './telemetryPackClient';
import type { TelemetryCatalogItem } from './telemetryPackSchema';

type TelemetryViewTab = 'ghost_replay' | 'timing_tower' | 'strategy_pace';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable ||
    Boolean(target.closest('.cm-editor'))
  );
}

export const TelemetryHub: React.FC = () => {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  // URL state with nuqs
  const [urlParams, setUrlParams] = useQueryStates({
    pack: parseAsString,
    labs: parseAsBoolean.withDefault(false),
    speed: parseAsStringLiteral(['0.5', '1', '2'] as const).withDefault('1'),
  });

  const activeSlug = routeSlug || urlParams.pack || 'silverstone-2024-ham-vs-ver';
  const isDirectlyLinkedToSim = Boolean(
    activeSlug && (activeSlug.includes('sim') || activeSlug.includes('2026'))
  );

  const includeExperimental = urlParams.labs || isDirectlyLinkedToSim;

  const [activeTab, setActiveTab] = useState<TelemetryViewTab>('ghost_replay');
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);

  // Load telemetry catalog
  const { data: indexList } = useQuery<TelemetryCatalogItem[]>({
    queryKey: ['telemetry-pack-catalog'],
    queryFn: fetchTelemetryCatalog,
  });

  const visiblePacks = useMemo(() => {
    return getVisibleTelemetryPacks(indexList || [], includeExperimental);
  }, [indexList, includeExperimental]);

  // Load active showdown telemetry pack (Tier 1 Precomputed Offline Data)
  const { data: showdown, isLoading } = useQuery<TelemetryShowdown>({
    queryKey: ['telemetry-pack', activeSlug],
    queryFn: async () => {
      const pack = await fetchTelemetryPack(activeSlug);
      return pack as unknown as TelemetryShowdown;
    },
    enabled: Boolean(activeSlug),
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
    enabled: Boolean(activeSlug),
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
          [0, 0, 0],
        ];

  const maxDuration = showdown
    ? Math.max(showdown.driverA.lapTimeSeconds, showdown.driverB.lapTimeSeconds)
    : 90.0;

  // Mutable Playback Ref for 60 FPS useFrame updates with 0 useState calls
  const playbackRef = useRef<PlaybackHandle>({
    time: 0,
    duration: maxDuration,
    isPlaying: false,
    speed: Number(urlParams.speed) || 1.0,
  });

  // Sync ref duration when showdown changes
  useEffect(() => {
    playbackRef.current.time = 0;
    playbackRef.current.duration = maxDuration;
    playbackRef.current.isPlaying = false;
    playbackRef.current.speed = Number(urlParams.speed) || 1.0;
    setPlaybackTime(0);
    setIsPlaying(false);
    setScrubProgress(null);
  }, [activeSlug, maxDuration, urlParams.speed]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    const nextState = !playbackRef.current.isPlaying;
    playbackRef.current.isPlaying = nextState;
    if (nextState && playbackRef.current.time >= maxDuration) {
      playbackRef.current.time = 0;
      setPlaybackTime(0);
    } else if (!nextState) {
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
  const handleSpeedChange = useCallback(
    (speed: number) => {
      playbackRef.current.speed = speed;
      const speedStr = String(speed) as '0.5' | '1' | '2';
      setUrlParams({ speed: speedStr });
    },
    [setUrlParams]
  );

  // Handle Reset
  const handleReset = useCallback(() => {
    playbackRef.current.time = 0;
    playbackRef.current.isPlaying = false;
    setPlaybackTime(0);
    setIsPlaying(false);
    setScrubProgress(null);
  }, []);

  // Keyboard controls guarded by isEditableTarget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleReset]);

  // Throttled time sync from 3D canvas loop
  const handleTimeUpdateFromCanvas = useCallback((time: number) => {
    setPlaybackTime(time);
    if (!playbackRef.current.isPlaying) {
      setIsPlaying(false);
    }
  }, []);

  // Change active showdown
  const handleSelectShowdown = (newSlug: string) => {
    if (routeSlug) {
      navigate(`/telemetry/${newSlug}`);
    } else {
      setUrlParams({ pack: newSlug });
    }
  };

  // Toggle Experimental Labs
  const handleToggleLabs = () => {
    setUrlParams({ labs: !includeExperimental });
  };

  // Bidirectional scrub sync from TelemetryTraceChart
  const handleScrubProgress = useCallback((progress: number | null) => {
    setScrubProgress(progress);
  }, []);

  // Route SEO & JSON-LD
  usePageMeta({
    title: showdown
      ? `${showdown.title} — 3D Telemetry Ghost-Lap & Strategy Analytics`
      : '3D Telemetry Ghost-Lap Replay & Strategy Analytics',
    description: showdown
      ? `Compare ${showdown.driverA.driverName} vs. ${showdown.driverB.driverName} at ${showdown.circuitName}. Interactive 3D ghost lap replay, 25 mini-sectors, and fuel-corrected tyre degradation analysis.`
      : '3D Telemetry Ghost-Lap Replay, 25-segment mini-sectors, and race pace tyre degradation modeling for Formula 1.',
    canonicalPath: `/telemetry${showdown ? `/${showdown.slug}` : ''}`,
  });

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full bg-[#090B10] px-4 py-6 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        {/* Top Header & Feed Status */}
        <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#11151E]/95 p-5 backdrop-blur-md shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8494AB]">
              <span className="h-2 w-2 rounded-full bg-[#E10600] animate-pulse" />
              <span className="font-semibold text-white tracking-widest uppercase">
                TELEMETRY VAULT // TIER 1 PRECOMPUTED GHOST-LAP ENGINE
              </span>
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                {showdown?.feedAvailability === 'full' ? '● FULL FEED (200 HZ)' : '◐ PARTIAL FEED'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CopyShareLinkButton label="Share Telemetry View" />
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 rounded bg-black/40 p-1 border border-white/5">
                <button
                  type="button"
                  className={`rounded px-3 py-1 font-mono text-xs tracking-wider transition-colors ${
                    activeTab === 'ghost_replay'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-[#8494AB] hover:text-white'
                  }`}
                  onClick={() => setActiveTab('ghost_replay')}
                >
                  3D GHOST REPLAY
                </button>
                <button
                  type="button"
                  className={`rounded px-3 py-1 font-mono text-xs tracking-wider transition-colors ${
                    activeTab === 'timing_tower'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-[#8494AB] hover:text-white'
                  }`}
                  onClick={() => setActiveTab('timing_tower')}
                >
                  TIMING TOWER
                </button>
                <button
                  type="button"
                  className={`rounded px-3 py-1 font-mono text-xs tracking-wider transition-colors ${
                    activeTab === 'strategy_pace'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-[#8494AB] hover:text-white'
                  }`}
                  onClick={() => setActiveTab('strategy_pace')}
                >
                  STRATEGY &amp; STINTS
                </button>
              </div>
            </div>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
              {showdown?.title || '3D TELEMETRY GHOST-LAP REPLAY'}
            </h1>
            <p className="font-mono text-xs tracking-wider text-[#8494AB] mt-0.5">
              {showdown?.subtitle || 'SECTOR-ANCHORED MULTI-CHANNEL TELEMETRY BENCHMARK'}
            </p>
          </div>

          {/* Showdown Selector Pills & Labs Toggle */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#8494AB]">
                SELECT TELEMETRY SHOWDOWN ({visiblePacks.length} AVAILABLE):
              </span>
              <button
                type="button"
                onClick={handleToggleLabs}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono font-bold tracking-wider uppercase transition-colors ${
                  includeExperimental
                    ? 'border-[#EAB308]/60 bg-[#EAB308]/20 text-[#FACC15]'
                    : 'border-white/10 bg-white/5 text-[#8494AB] hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={includeExperimental}
              >
                <span>{includeExperimental ? '✓ EXPERIMENTAL LABS INCLUDED' : '+ INCLUDE EXPERIMENTAL LABS'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {visiblePacks.map((item) => {
                const isSelected = item.slug === activeSlug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    className={`flex items-center gap-2 whitespace-nowrap rounded px-3 py-1.5 font-mono text-xs transition-all ${
                      isSelected
                        ? 'bg-white/15 text-white font-bold ring-1 ring-white/30'
                        : 'bg-white/[0.03] text-[#8494AB] hover:bg-white/[0.08] hover:text-white border border-white/5'
                    }`}
                    onClick={() => handleSelectShowdown(item.slug)}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.driverAColor }}
                    />
                    <span>{item.driverACode} vs {item.driverBCode}</span>
                    <span className="text-[10px] text-neutral-500">
                      {item.circuitName.split(' ')[0]}
                    </span>
                    {item.provenance === 'experimental_simulation' && (
                      <ExperimentalBadge compact />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Amber Quarantine Disclaimer Banner when active showdown is experimental */}
        {isExperimentalActive && (
          <div>
            <ExperimentalBadge
              label="EXPERIMENTAL // SIMULATION"
              disclaimer="Theoretical 2026 active aero & manual override simulation for the Circuito de Madrid. Not official FIA or verified historical telemetry."
            />
          </div>
        )}

        {isLoading || !showdown ? (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-white/10 bg-[#11151E] p-6 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E10600] border-t-transparent mb-3" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#8494AB]">
              STREAMING PRECOMPUTED TELEMETRY CHANNELS...
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'ghost_replay' ? (
              <div className="flex flex-col gap-5 w-full">
                {/* 3D Track Ghost Replay Canvas */}
                <GhostLapViewer3D
                  showdown={showdown}
                  trackCoordinates={trackCoords}
                  playbackRef={playbackRef}
                  currentTime={playbackTime}
                  isPlaying={isPlaying}
                  scrubProgress={scrubProgress}
                  onTimeUpdate={handleTimeUpdateFromCanvas}
                />

                {/* Transport Controls Bar */}
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

                {/* Live Digital Telemetry Gauges */}
                <LiveTelemetryGauges showdown={showdown} currentTime={playbackTime} />

                {/* 4-Channel Synchronized Telemetry Traces with Bidirectional Scrub */}
                <TelemetryTraceChart
                  showdown={showdown}
                  currentTime={playbackTime}
                  duration={maxDuration}
                  onSeek={handleSeek}
                  onScrubProgress={handleScrubProgress}
                />
              </div>
            ) : activeTab === 'timing_tower' ? (
              <div className="w-full">
                <TimingTower />
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded border border-[#E10600]/40 bg-[#E10600]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E10600]/20 transition-colors"
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
                  <div className="flex h-48 w-full items-center justify-center rounded border border-white/5 bg-[#11151E] text-xs font-mono text-[#8494AB]">
                    NO STINT PACE DATA FOR THIS SHOWDOWN
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

export default TelemetryHub;
