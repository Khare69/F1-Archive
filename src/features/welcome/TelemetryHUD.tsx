import React, { useState, useEffect } from 'react';
import './TelemetryHUD.css';

interface TelemetryHUDProps {
  progress: number; // 0 to 100
  onSkip: () => void;
}

const ROTATING_FACTS = [
  '927 RACES INDEXED',
  '34 CONSTRUCTORS ARCHIVED',
  '112 DRIVERS\' CHAMPIONSHIPS',
  'DATABASE // ONLINE',
  'ARCHIVE SPAN: 1950 TO 2026'
];

const LOADING_STAGES = [
  'SYSTEM INITIALIZATION',
  'LOADING F1 DATABASE',
  'SEASON CAMPAIGN DATA',
  'CONSTRUCTOR MATRIX',
  'PILOT TELEMETRY ROSTER',
  'VEHICLE SPECIFICATIONS',
  'TECHNICAL ARCHIVE',
  '3D GRAPHICS SHADERS',
  'SYSTEM READY // ENTERING ARCHIVE'
];

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  progress,
  onSkip
}) => {
  const [factIndex, setFactIndex] = useState(0);

  // Cycle facts every 2s
  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % ROTATING_FACTS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Map progress (0-100) to 9 loading stages
  const currentStageIndex = Math.min(
    Math.floor((progress / 100) * LOADING_STAGES.length),
    LOADING_STAGES.length - 1
  );

  return (
    <div className="telemetry-hud-overlay">
      {/* Top Bar */}
      <div className="hud-top-bar">
        <div className="hud-brand">
          <div className="brand-logo-box">
            <span className="brand-f1">F1</span>
            <span className="brand-slash">//</span>
          </div>
          <div className="brand-text-box">
            <span className="brand-title headline">ARCHIVE</span>
            <span className="brand-subtitle telemetry">THE EVOLUTION OF SPEED</span>
          </div>
        </div>

        <div className="hud-controls">
          <button
            type="button"
            className="hud-control-btn skip-btn headline"
            onClick={onSkip}
            aria-label="Skip introduction animation"
          >
            <span>SKIP INTRO</span>
            <span className="key-hint telemetry">[ESC]</span>
          </button>
        </div>
      </div>

      {/* Center Hero Message */}
      <div className="hud-center-content">
        <div className="hud-status-badge telemetry">
          <span className="status-blip"></span>
          <span>INITIALIZING RACE CONTROL VAULT</span>
        </div>
        <h1 className="hud-main-headline headline">
          RACE CONTROL, <br />
          <span className="text-gradient-cyan">STANDING BY.</span>
        </h1>
        <p className="hud-subtext">
          75 years of data. Every regulation, every rivalry, every record.
        </p>
      </div>

      {/* Bottom Bar: Telemetry readouts + Progress bar */}
      <div className="hud-bottom-bar">
        {/* Bottom Left: Cycling Facts */}
        <div className="hud-facts-box telemetry">
          <span className="fact-indicator">// ARCHIVE METRICS:</span>
          <span className="fact-text headline">{ROTATING_FACTS[factIndex]}</span>
        </div>

        {/* Bottom Right: Loading Stage + Shimmer Progress Bar */}
        <div className="hud-progress-box">
          <div className="progress-labels telemetry">
            <span className="stage-label">{LOADING_STAGES[currentStageIndex]}</span>
            <span className="percentage-label headline">{Math.round(progress)}%</span>
          </div>

          <div 
            className="hud-progress-track"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div 
              className="hud-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
