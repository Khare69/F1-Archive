import React, { useEffect, useRef } from 'react';
import type { TelemetryShowdown } from '../../../types/telemetry';
import { interpolateTelemetryAtTime } from '../telemetryMath';
import './LiveTelemetryGauges.css';

interface LiveTelemetryGaugesProps {
  showdown: TelemetryShowdown;
  currentTime: number;
}

export const LiveTelemetryGauges: React.FC<LiveTelemetryGaugesProps> = ({
  showdown,
  currentTime
}) => {
  const speedRefA = useRef<HTMLSpanElement>(null);
  const gearRefA = useRef<HTMLSpanElement>(null);
  const throttleBarA = useRef<HTMLDivElement>(null);
  const brakeBarA = useRef<HTMLDivElement>(null);
  const drsRefA = useRef<HTMLSpanElement>(null);

  const speedRefB = useRef<HTMLSpanElement>(null);
  const gearRefB = useRef<HTMLSpanElement>(null);
  const throttleBarB = useRef<HTMLDivElement>(null);
  const brakeBarB = useRef<HTMLDivElement>(null);
  const drsRefB = useRef<HTMLSpanElement>(null);

  // Directly update DOM refs without component re-render loops (Trap 4)
  useEffect(() => {
    const sA = interpolateTelemetryAtTime(showdown.driverA.samples, currentTime);
    const sB = interpolateTelemetryAtTime(showdown.driverB.samples, currentTime);

    if (speedRefA.current) speedRefA.current.textContent = `${sA.speed}`;
    if (gearRefA.current) gearRefA.current.textContent = sA.gear !== null ? `${sA.gear}` : '-';
    if (throttleBarA.current) throttleBarA.current.style.width = `${sA.throttle}%`;
    if (brakeBarA.current) brakeBarA.current.style.width = `${sA.brake}%`;
    if (drsRefA.current) {
      drsRefA.current.className = `gauge-drs-badge telemetry ${sA.drs ? 'drs-on' : 'drs-off'}`;
      drsRefA.current.textContent = sA.drs ? 'DRS OPEN' : 'DRS';
    }

    if (speedRefB.current) speedRefB.current.textContent = `${sB.speed}`;
    if (gearRefB.current) gearRefB.current.textContent = sB.gear !== null ? `${sB.gear}` : '-';
    if (throttleBarB.current) throttleBarB.current.style.width = `${sB.throttle}%`;
    if (brakeBarB.current) brakeBarB.current.style.width = `${sB.brake}%`;
    if (drsRefB.current) {
      drsRefB.current.className = `gauge-drs-badge telemetry ${sB.drs ? 'drs-on' : 'drs-off'}`;
      drsRefB.current.textContent = sB.drs ? 'DRS OPEN' : 'DRS';
    }
  }, [currentTime, showdown]);

  return (
    <div className="telemetry-gauges-grid">
      {/* Driver A Gauges */}
      <div
        className="driver-gauge-card telemetry-panel corner-bracket"
        style={{ '--accent-color': showdown.driverA.teamColor } as React.CSSProperties}
      >
        <div className="gauge-card-header telemetry">
          <span className="gauge-color-indicator" style={{ backgroundColor: showdown.driverA.teamColor }}></span>
          <span className="gauge-driver-name headline">{showdown.driverA.driverName}</span>
          <span className="gauge-driver-code telemetry">#{showdown.driverA.driverCode}</span>
          <span ref={drsRefA} className="gauge-drs-badge telemetry drs-off">DRS</span>
        </div>

        <div className="gauge-main-metrics">
          <div className="gauge-speed-box">
            <span ref={speedRefA} className="gauge-speed-val headline">0</span>
            <span className="gauge-speed-unit telemetry">KM/H</span>
          </div>

          <div className="gauge-gear-box">
            <span className="gauge-gear-label telemetry">GEAR</span>
            <span ref={gearRefA} className="gauge-gear-val headline">1</span>
          </div>
        </div>

        <div className="pedal-inputs-group telemetry">
          <div className="pedal-row">
            <span className="pedal-label">THROTTLE</span>
            <div className="pedal-track">
              <div ref={throttleBarA} className="pedal-fill throttle-fill" style={{ width: '0%' }}></div>
            </div>
          </div>
          <div className="pedal-row">
            <span className="pedal-label">BRAKE</span>
            <div className="pedal-track">
              <div ref={brakeBarA} className="pedal-fill brake-fill" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver B Gauges */}
      <div
        className="driver-gauge-card telemetry-panel corner-bracket"
        style={{ '--accent-color': showdown.driverB.teamColor } as React.CSSProperties}
      >
        <div className="gauge-card-header telemetry">
          <span className="gauge-color-indicator" style={{ backgroundColor: showdown.driverB.teamColor }}></span>
          <span className="gauge-driver-name headline">{showdown.driverB.driverName}</span>
          <span className="gauge-driver-code telemetry">#{showdown.driverB.driverCode}</span>
          <span ref={drsRefB} className="gauge-drs-badge telemetry drs-off">DRS</span>
        </div>

        <div className="gauge-main-metrics">
          <div className="gauge-speed-box">
            <span ref={speedRefB} className="gauge-speed-val headline">0</span>
            <span className="gauge-speed-unit telemetry">KM/H</span>
          </div>

          <div className="gauge-gear-box">
            <span className="gauge-gear-label telemetry">GEAR</span>
            <span ref={gearRefB} className="gauge-gear-val headline">1</span>
          </div>
        </div>

        <div className="pedal-inputs-group telemetry">
          <div className="pedal-row">
            <span className="pedal-label">THROTTLE</span>
            <div className="pedal-track">
              <div ref={throttleBarB} className="pedal-fill throttle-fill" style={{ width: '0%' }}></div>
            </div>
          </div>
          <div className="pedal-row">
            <span className="pedal-label">BRAKE</span>
            <div className="pedal-track">
              <div ref={brakeBarB} className="pedal-fill brake-fill" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
