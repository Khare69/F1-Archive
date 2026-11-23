import React, { useEffect, useCallback } from 'react';
import type { PlaybackHandle } from './GhostLapViewer3D';
import { usePreferencesContext } from '../../../contexts/UserPreferencesContext';
import './TransportControls.css';

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
  onReset
}) => {
  const { hasReducedMotion } = usePreferencesContext();

  // Keyboard accessibility listeners (Space, ArrowLeft, ArrowRight, Home)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPauseToggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, playbackRef.current.time - 0.5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(duration, playbackRef.current.time + 0.5));
      } else if (e.code === 'Home') {
        e.preventDefault();
        onReset();
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
    <div className="transport-controls-bar telemetry-panel corner-bracket" role="region" aria-label="Telemetry Playback Controls">
      {/* Primary Transport Buttons */}
      <div className="transport-btn-group">
        {/* Reset / Home */}
        <button
          type="button"
          className="transport-btn"
          onClick={onReset}
          title="Reset to Lap Start (Home key)"
          aria-label="Reset to Lap Start"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>

        {/* Step Backward -0.5s */}
        <button
          type="button"
          className="transport-btn"
          onClick={() => onSeek(Math.max(0, currentTime - 0.5))}
          title="Step Backward -0.5s (Left Arrow)"
          aria-label="Step Backward 0.5 seconds"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Play / Pause Toggle */}
        <button
          type="button"
          className={`transport-btn transport-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={onPlayPauseToggle}
          title={isPlaying ? 'Pause Playback (Space)' : 'Play Ghost Lap (Space)'}
          aria-label={isPlaying ? 'Pause Ghost Lap' : 'Play Ghost Lap'}
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        {/* Step Forward +0.5s */}
        <button
          type="button"
          className="transport-btn"
          onClick={() => onSeek(Math.min(duration, currentTime + 0.5))}
          title="Step Forward +0.5s (Right Arrow)"
          aria-label="Step Forward 0.5 seconds"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Speed Multiplier Pill */}
        <div className="speed-selector-group">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-pill telemetry ${currentSpeed === s ? 'active' : ''}`}
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
      <div className="transport-scrubber-box">
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
          className="telemetry-range-slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        />
      </div>

      {/* Timestamp Digital Readout */}
      <div className="transport-timestamp telemetry">
        <span className="time-current headline">{formatTime(currentTime)}</span>
        <span className="time-separator">/</span>
        <span className="time-total">{formatTime(duration)}</span>
        {hasReducedMotion && (
          <span className="reduced-motion-hint telemetry" title="Reduced motion active: manual scrubbing enabled">
            [REDUCED MOTION]
          </span>
        )}
      </div>
    </div>
  );
};
