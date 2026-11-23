import React from 'react';
import { useProgress } from '@react-three/drei';

interface TelemetryLoadingProgressProps {
  label?: string;
  accentColor?: string;
}

export const TelemetryLoadingProgress: React.FC<TelemetryLoadingProgressProps> = ({
  label = 'SYNCHRONIZING CHASSIS CAD GEOMETRY',
  accentColor = '#00D2FF'
}) => {
  const { active, progress, loaded, total } = useProgress();

  if (!active && progress === 100) return null;

  const rounded = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="telemetry-loader-overlay">
      <div className="telemetry-loader-card telemetry-panel corner-bracket">
        <div className="loader-header telemetry">
          <span className="loader-blip" style={{ backgroundColor: accentColor }}></span>
          <span className="loader-label">{label}</span>
        </div>

        <div className="loader-val-hero headline" style={{ color: accentColor }}>
          {rounded}%
        </div>

        <div className="loader-progress-track">
          <div
            className="loader-progress-bar"
            style={{ width: `${rounded}%`, backgroundColor: accentColor }}
          />
        </div>

        <div className="loader-meta telemetry">
          <span>PIPELINE: KHR_DRACO_DECODER</span>
          <span>{loaded} / {total || 1} ASSETS</span>
        </div>
      </div>
    </div>
  );
};
