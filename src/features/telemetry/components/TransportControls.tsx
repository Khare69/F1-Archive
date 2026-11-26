import React, { useEffect, useCallback } from 'react';
import type { PlaybackHandle } from './GhostLapViewer3D';
import { usePreferencesContext } from '../../../contexts/UserPreferencesContext';

interface TransportControlsProps {
  playbackRef: React.MutableRefObject<PlaybackHandle>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  playbackRef,
  currentTime,
  duration,
  isPlaying,
  onPlayPauseToggle,
  onSeek,
  onSpeedChange,
  onReset,
}) => {
  let hasReducedMotion = false;
  try {
    const prefs = usePreferencesContext();
    hasReducedMotion = prefs.hasReducedMotion;
  } catch {
    hasReducedMotion = false;
  }

  // Keyboard accessibility listeners (Space, ArrowLeft, ArrowRight, Home)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, playbackRef.current.time - 0.5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(duration, playbackRef.current.time + 0.5));
      }
    },
    [onPlayPauseToggle, onSeek, onReset, playbackRef, duration]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = (secs % 60).toFixed(3);
    return `${String(mins).padStart(2, '0')}:${remainingSecs.padStart(6, '0')}`;
  };

  const currentSpeed = playbackRef.current.speed;
  const speeds = [0.5, 1.0, 2.0];

  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-[#11151E] p-3 shadow-lg w-full text-white"
      role="region"
      aria-label="Telemetry Playback Controls"
    >
      {/* Primary Transport Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reset / Home */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:border-white/20 transition-colors"
          onClick={onReset}
          title="Reset to Lap Start (Home key / R)"
          aria-label="Reset to Lap Start"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>

        {/* Step Backward -0.5s */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:border-white/20 transition-colors"
          onClick={() => onSeek(Math.max(0, currentTime - 0.5))}
          title="Step Backward -0.5s (Left Arrow)"
          aria-label="Step Backward 0.5 seconds"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Play / Pause Toggle */}
        <button
          type="button"
          className={`inline-flex h-10 w-10 items-center justify-center rounded border transition-colors ${
            isPlaying
              ? 'border-[#EF4444] bg-[#EF4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'border-[#E10600] bg-[#E10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]'
          }`}
          onClick={onPlayPauseToggle}
          title={isPlaying ? 'Pause Playback (Space)' : 'Play Ghost Lap (Space)'}
          aria-label={isPlaying ? 'Pause Ghost Lap' : 'Play Ghost Lap'}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        {/* Step Forward +0.5s */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:border-white/20 transition-colors"
          onClick={() => onSeek(Math.min(duration, currentTime + 0.5))}
          title="Step Forward +0.5s (Right Arrow)"
          aria-label="Step Forward 0.5 seconds"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Speed Multiplier Pill */}
        <div className="flex items-center rounded border border-white/10 bg-black/40 p-0.5 ml-2">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                currentSpeed === s
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-[#8494AB] hover:text-white'
              }`}
              onClick={() => onSpeedChange(s)}
              title={`Set playback speed to ${s}x`}
              aria-label={`Playback speed ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Scrubbing Timeline Slider */}
      <div className="flex flex-1 items-center min-w-[200px]">
        <label htmlFor="telemetry-scrubber" className="sr-only">
          Lap Telemetry Timeline Scrubber
        </label>
        <input
          id="telemetry-scrubber"
          type="range"
          min="0"
          max={duration}
          step="0.05"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-lg bg-white/10 appearance-none cursor-pointer accent-[#E10600]"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        />
      </div>

      {/* Timestamp Digital Readout */}
      <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums shrink-0 text-white">
        <span className="font-bold text-white">{formatTime(currentTime)}</span>
        <span className="text-neutral-500">/</span>
        <span className="text-[#8494AB]">{formatTime(duration)}</span>
        {hasReducedMotion && (
          <span
            className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300 ml-1"
            title="Reduced motion active: manual scrubbing enabled"
          >
            [REDUCED MOTION]
          </span>
        )}
      </div>
    </div>
  );
};

export default TransportControls;
