import React, { useEffect, useRef } from 'react';
import type { TelemetryShowdown } from '../../../types/telemetry';
import { interpolateTelemetryAtTime } from '../telemetryMath';

interface LiveTelemetryGaugesProps {
  showdown: TelemetryShowdown;
  currentTime: number;
}

export const LiveTelemetryGauges: React.FC<LiveTelemetryGaugesProps> = ({
  showdown,
  currentTime,
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
      drsRefA.current.className = `rounded px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider ${
        sA.drs ? 'bg-emerald-500 text-black shadow-[0_0_8px_#10B981]' : 'border border-white/10 bg-white/5 text-[#8494AB]'
      }`;
      drsRefA.current.textContent = sA.drs ? 'DRS OPEN' : 'DRS';
    }

    if (speedRefB.current) speedRefB.current.textContent = `${sB.speed}`;
    if (gearRefB.current) gearRefB.current.textContent = sB.gear !== null ? `${sB.gear}` : '-';
    if (throttleBarB.current) throttleBarB.current.style.width = `${sB.throttle}%`;
    if (brakeBarB.current) brakeBarB.current.style.width = `${sB.brake}%`;
    if (drsRefB.current) {
      drsRefB.current.className = `rounded px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider ${
        sB.drs ? 'bg-emerald-500 text-black shadow-[0_0_8px_#10B981]' : 'border border-white/10 bg-white/5 text-[#8494AB]'
      }`;
      drsRefB.current.textContent = sB.drs ? 'DRS OPEN' : 'DRS';
    }
  }, [currentTime, showdown]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Driver A Gauges */}
      <div
        className="rounded-lg border border-white/10 bg-[#11151E] p-4 flex flex-col gap-3 shadow-lg border-l-4"
        style={{ borderLeftColor: showdown.driverA.teamColor }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: showdown.driverA.teamColor }}
          />
          <span className="font-display text-base font-bold text-white">
            {showdown.driverA.driverName}
          </span>
          <span className="font-mono text-xs text-[#8494AB]">
            #{showdown.driverA.driverCode}
          </span>
          <span
            ref={drsRefA}
            className="ml-auto rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-[#8494AB]"
          >
            DRS
          </span>
        </div>

        <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span ref={speedRefA} className="text-3xl font-extrabold text-white">
              0
            </span>
            <span className="text-xs text-[#8494AB]">KM/H</span>
          </div>

          <div className="flex flex-col items-center font-mono">
            <span className="text-[10px] text-[#8494AB]">GEAR</span>
            <span ref={gearRefA} className="text-xl font-bold text-white">
              1
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[#8494AB]">THROTTLE</span>
            <div className="relative h-2 flex-1 rounded bg-white/5 overflow-hidden">
              <div
                ref={throttleBarA}
                className="h-full bg-[#22C55E] transition-[width] duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-[#8494AB]">BRAKE</span>
            <div className="relative h-2 flex-1 rounded bg-white/5 overflow-hidden">
              <div
                ref={brakeBarA}
                className="h-full bg-[#EF4444] transition-[width] duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Driver B Gauges */}
      <div
        className="rounded-lg border border-white/10 bg-[#11151E] p-4 flex flex-col gap-3 shadow-lg border-l-4"
        style={{ borderLeftColor: showdown.driverB.teamColor }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: showdown.driverB.teamColor }}
          />
          <span className="font-display text-base font-bold text-white">
            {showdown.driverB.driverName}
          </span>
          <span className="font-mono text-xs text-[#8494AB]">
            #{showdown.driverB.driverCode}
          </span>
          <span
            ref={drsRefB}
            className="ml-auto rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-[#8494AB]"
          >
            DRS
          </span>
        </div>

        <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span ref={speedRefB} className="text-3xl font-extrabold text-white">
              0
            </span>
            <span className="text-xs text-[#8494AB]">KM/H</span>
          </div>

          <div className="flex flex-col items-center font-mono">
            <span className="text-[10px] text-[#8494AB]">GEAR</span>
            <span ref={gearRefB} className="text-xl font-bold text-white">
              1
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[#8494AB]">THROTTLE</span>
            <div className="relative h-2 flex-1 rounded bg-white/5 overflow-hidden">
              <div
                ref={throttleBarB}
                className="h-full bg-[#22C55E] transition-[width] duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-[#8494AB]">BRAKE</span>
            <div className="relative h-2 flex-1 rounded bg-white/5 overflow-hidden">
              <div
                ref={brakeBarB}
                className="h-full bg-[#EF4444] transition-[width] duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetryGauges;
