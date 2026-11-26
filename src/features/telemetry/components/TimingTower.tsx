import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GRAND_PRIX_GRID,
  MultiCarStreamManager,
  generateSyntheticCarPacket,
  type TimingTowerEntry,
} from '../liveStreamEngine';

interface TimingTowerProps {
  onSelectDriver?: (driverNumber: number) => void;
  selectedDriverNumber?: number;
}

export const TimingTower: React.FC<TimingTowerProps> = ({
  onSelectDriver,
  selectedDriverNumber,
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
      const pkt =
        managerRef.current.getInterpolated(d.driverNumber, sessionTimeSec * 1000) ||
        generateSyntheticCarPacket(d, sessionTimeSec);

      return {
        driver: d,
        packet: pkt,
      };
    });

    // Sort by distance ratio descending
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
        distanceRatio: pkt.distanceRatio,
      };
    });
  }, [sessionTimeSec]);

  return (
    <div className="flex flex-col w-full rounded-lg border border-white/10 bg-[#11151E] overflow-hidden shadow-xl text-white">
      {/* Tower Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#181D28] border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-white tracking-wider">
            LIVE TIMING TOWER // 20-CAR LADDER
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[#8494AB] hover:text-white transition-colors"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause timing stream' : 'Resume timing stream'}
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>

          <button
            type="button"
            className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[#8494AB] hover:text-white transition-colors"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
          >
            {speedMultiplier}x SPEED
          </button>

          <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-emerald-400">
            T+ {Math.floor(sessionTimeSec / 60)}:{(sessionTimeSec % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Timing Ladder Table */}
      <div className="max-h-[500px] overflow-y-auto no-scrollbar">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="sticky top-0 bg-[#181D28] text-[#8494AB] text-[10px] uppercase tracking-wider border-b border-white/10 z-10">
              <th className="px-3 py-2 w-16">POS</th>
              <th className="px-3 py-2">PILOT</th>
              <th className="px-3 py-2">GAP</th>
              <th className="px-3 py-2">INT</th>
              <th className="px-3 py-2">SPD</th>
              <th className="px-3 py-2">SECTORS</th>
              <th className="px-3 py-2">2026 AERO</th>
            </tr>
          </thead>
          <tbody>
            {timingEntries.map((entry) => {
              const isSelected = selectedDriverNumber === entry.driverNumber;
              return (
                <tr
                  key={entry.driverNumber}
                  className={`border-b border-white/[0.03] transition-colors cursor-pointer hover:bg-white/[0.04] ${
                    isSelected ? 'bg-white/[0.08]' : ''
                  }`}
                  onClick={() => onSelectDriver?.(entry.driverNumber)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{entry.position}</span>
                      <span
                        className="h-3 w-1 rounded-full"
                        style={{ backgroundColor: entry.teamColor }}
                      />
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-bold text-white mr-1.5">{entry.code}</span>
                    <span className="text-[10px] text-[#8494AB]">#{entry.driverNumber}</span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-neutral-300">
                    {entry.gapToLeaderFormatted}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-neutral-400">
                    {entry.intervalFormatted}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-neutral-300">
                    {entry.speed} km/h
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.sector1Status === 'fastest'
                            ? 'bg-[#A855F7] shadow-[0_0_6px_#A855F7]'
                            : entry.sector1Status === 'personal_best'
                            ? 'bg-[#22C55E]'
                            : 'bg-amber-400'
                        }`}
                        title="Sector 1"
                      />
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.sector2Status === 'fastest'
                            ? 'bg-[#A855F7] shadow-[0_0_6px_#A855F7]'
                            : entry.sector2Status === 'personal_best'
                            ? 'bg-[#22C55E]'
                            : 'bg-amber-400'
                        }`}
                        title="Sector 2"
                      />
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.sector3Status === 'fastest'
                            ? 'bg-[#A855F7] shadow-[0_0_6px_#A855F7]'
                            : entry.sector3Status === 'personal_best'
                            ? 'bg-[#22C55E]'
                            : 'bg-amber-400'
                        }`}
                        title="Sector 3"
                      />
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          entry.activeAero === 'straight'
                            ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30'
                            : 'bg-white/5 text-[#8494AB] border border-white/10'
                        }`}
                      >
                        {entry.activeAero === 'straight' ? 'STR' : 'CNR'}
                      </span>
                      {entry.overtakeActive && (
                        <span className="rounded bg-[#E10600]/20 text-[#E10600] border border-[#E10600]/30 px-1 py-0.5 text-[9px] font-bold">
                          MOM
                        </span>
                      )}
                    </div>
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

export default TimingTower;
