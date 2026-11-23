import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GRAND_PRIX_GRID,
  MultiCarStreamManager,
  generateSyntheticCarPacket,
  type TimingTowerEntry
} from '../liveStreamEngine';
import './TimingTower.css';

interface TimingTowerProps {
  onSelectDriver?: (driverNumber: number) => void;
  selectedDriverNumber?: number;
}

export const TimingTower: React.FC<TimingTowerProps> = ({
  onSelectDriver,
  selectedDriverNumber
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sessionTimeSec, setSessionTimeSec] = useState<number>(45.2);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const managerRef = useRef<MultiCarStreamManager>(new MultiCarStreamManager());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Ingest synthetic stream packets into multi-car manager
  useEffect(() => {
    GRAND_PRIX_GRID.forEach((driver) => {
      const pkt = generateSyntheticCarPacket(driver, sessionTimeSec);
      managerRef.current.ingest(driver.driverNumber, pkt);
    });
  }, [sessionTimeSec]);

  // Real-time animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const tick = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      setSessionTimeSec((prev) => {
        const next = prev + deltaSec * speedMultiplier;
        return next > 88.0 * 5 ? 0 : next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  // Compute timing tower entries
  const timingEntries = useMemo<TimingTowerEntry[]>(() => {
    const cars = GRAND_PRIX_GRID.map((d) => {
      const pkt = managerRef.current.getInterpolated(d.driverNumber, sessionTimeSec * 1000) ||
        generateSyntheticCarPacket(d, sessionTimeSec);

      return {
        driver: d,
        packet: pkt
      };
    });

    // Sort by distance ratio descending (leading car has highest distance ratio on current cycle)
    cars.sort((a, b) => b.packet.distanceRatio - a.packet.distanceRatio);

    const leaderPkt = cars[0]?.packet;

    return cars.map((car, idx) => {
      const d = car.driver;
      const pkt = car.packet;

      const gapSec = leaderPkt
        ? Math.max(0, (leaderPkt.distanceRatio - pkt.distanceRatio) * 88.0)
        : 0;

      const prevCar = cars[idx - 1];
      const intervalSec = prevCar
        ? Math.max(0, (prevCar.packet.distanceRatio - pkt.distanceRatio) * 88.0)
        : 0;

      return {
        position: idx + 1,
        driverNumber: d.driverNumber,
        code: d.code,
        name: d.name,
        team: d.team,
        teamColor: d.teamColor,
        gapToLeaderFormatted: idx === 0 ? 'INTERVAL' : `+${gapSec.toFixed(3)}s`,
        intervalFormatted: idx === 0 ? 'LEADER' : `+${intervalSec.toFixed(3)}s`,
        currentLapTimeFormatted: '1:28.450',
        bestLapTimeFormatted: `1:27.${(300 + idx * 80).toString().slice(0, 3)}`,
        lastSectorMs: 29400,
        sector1Status: idx === 0 ? 'fastest' : idx < 4 ? 'personal_best' : 'normal',
        sector2Status: idx === 1 ? 'fastest' : idx < 6 ? 'personal_best' : 'normal',
        sector3Status: idx === 2 ? 'fastest' : 'normal',
        activeAero: pkt.activeAero,
        overtakeActive: pkt.overtakeMode,
        drsActive: pkt.drs,
        speed: pkt.speed,
        distanceRatio: pkt.distanceRatio
      };
    });
  }, [sessionTimeSec]);

  return (
    <div className="timing-tower-card telemetry-panel corner-bracket">
      {/* Tower Controls Bar */}
      <div className="tower-controls-header">
        <div className="tower-title-box">
          <span className="dot green"></span>
          <span className="tower-title headline">LIVE TIMING TOWER // 20-CAR LADDER</span>
        </div>

        <div className="tower-action-controls telemetry">
          <button
            type="button"
            className="tower-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause timing stream' : 'Resume timing stream'}
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>

          <button
            type="button"
            className="tower-btn"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
          >
            {speedMultiplier}x SPEED
          </button>

          <span className="tower-clock">
            T+ {Math.floor(sessionTimeSec / 60)}:{(sessionTimeSec % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Timing Ladder Table */}
      <div className="tower-table-wrapper">
        <table className="timing-table">
          <thead>
            <tr>
              <th className="telemetry pos-th">POS</th>
              <th className="telemetry driver-th">PILOT</th>
              <th className="telemetry gap-th">GAP</th>
              <th className="telemetry int-th">INT</th>
              <th className="telemetry speed-th">SPD</th>
              <th className="telemetry sectors-th">SECTORS</th>
              <th className="telemetry aero-th">2026 AERO</th>
            </tr>
          </thead>
          <tbody>
            {timingEntries.map((entry) => {
              const isSelected = selectedDriverNumber === entry.driverNumber;
              return (
                <tr
                  key={entry.driverNumber}
                  className={`timing-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectDriver?.(entry.driverNumber)}
                >
                  <td className="pos-cell telemetry">
                    <span className="pos-num">{entry.position}</span>
                    <span
                      className="team-indicator-bar"
                      style={{ backgroundColor: entry.teamColor }}
                    ></span>
                  </td>

                  <td className="driver-cell">
                    <span className="driver-code headline">{entry.code}</span>
                    <span className="driver-number telemetry">#{entry.driverNumber}</span>
                  </td>

                  <td className="gap-cell telemetry">{entry.gapToLeaderFormatted}</td>
                  <td className="int-cell telemetry">{entry.intervalFormatted}</td>
                  <td className="speed-cell telemetry">{entry.speed} km/h</td>

                  <td className="sectors-cell">
                    <span className={`sector-dot ${entry.sector1Status}`} title="Sector 1"></span>
                    <span className={`sector-dot ${entry.sector2Status}`} title="Sector 2"></span>
                    <span className={`sector-dot ${entry.sector3Status}`} title="Sector 3"></span>
                  </td>

                  <td className="aero-cell telemetry">
                    <span className={`aero-tag ${entry.activeAero}`}>
                      {entry.activeAero === 'straight' ? 'STR' : 'CNR'}
                    </span>
                    {entry.overtakeActive && (
                      <span className="overtake-tag">MOM</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
