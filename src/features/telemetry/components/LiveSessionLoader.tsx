import React, { useState } from 'react';
import {
  buildOpenF1TelemetryComparison,
  type OpenF1Session,
} from '../openF1TelemetryBuilder';
import type { ValidatedTelemetryPack } from '../telemetryPackSchema';

export interface LiveSessionLoaderProps {
  onPackLoaded: (pack: ValidatedTelemetryPack) => void;
  className?: string;
}

export const LiveSessionLoader: React.FC<LiveSessionLoaderProps> = ({
  onPackLoaded,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState<number>(9158); // Silverstone 2023 Qualifying sample
  const [driverA, setDriverA] = useState<number>(1); // Verstappen
  const [driverB, setDriverB] = useState<number>(4); // Norris
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFetchComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const pack = await buildOpenF1TelemetryComparison(sessionKey, driverA, driverB);
      onPackLoaded(pack);
      setIsOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('429')) {
          setErrorMsg('OpenF1 API rate limit reached (HTTP 429). Please wait a few seconds before retrying.');
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg('Failed to fetch OpenF1 telemetry data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-lg border border-white/10 bg-[#11151E] p-4 text-white shadow-xl ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between font-mono text-xs font-bold tracking-wider uppercase text-[#38BDF8] hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>⚡ ON-DEMAND OPENF1 SESSION TELEMETRY LOADER</span>
          <span className="rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-1.5 py-0.5 text-[9px]">
            BOUNDED IN-MEMORY LRU
          </span>
        </div>
        <span>{isOpen ? '▲ HIDE' : '▼ CONFIGURE SESSION'}</span>
      </button>

      {isOpen && (
        <form onSubmit={handleFetchComparison} className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-3">
          <p className="font-mono text-xs text-[#8494AB]">
            Load live telemetry directly from the OpenF1 API for modern grand prix sessions (2023–2026).
            Fastest valid laps are automatically extracted and resampled onto a uniform 200-sample grid.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label htmlFor="session-key-input" className="block text-[10px] text-[#8494AB] uppercase mb-1">
                SESSION KEY
              </label>
              <input
                id="session-key-input"
                type="number"
                value={sessionKey}
                onChange={(e) => setSessionKey(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded border border-white/10 bg-[#181D28] px-2.5 py-1.5 text-white outline-none focus:border-[#38BDF8]"
                placeholder="e.g. 9158"
                required
              />
            </div>

            <div>
              <label htmlFor="driver-a-input" className="block text-[10px] text-[#8494AB] uppercase mb-1">
                DRIVER A # (PRIMARY)
              </label>
              <input
                id="driver-a-input"
                type="number"
                value={driverA}
                onChange={(e) => setDriverA(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded border border-white/10 bg-[#181D28] px-2.5 py-1.5 text-white outline-none focus:border-[#38BDF8]"
                placeholder="e.g. 1"
                required
              />
            </div>

            <div>
              <label htmlFor="driver-b-input" className="block text-[10px] text-[#8494AB] uppercase mb-1">
                DRIVER B # (COMPARISON)
              </label>
              <input
                id="driver-b-input"
                type="number"
                value={driverB}
                onChange={(e) => setDriverB(parseInt(e.target.value, 10) || 4)}
                className="w-full rounded border border-white/10 bg-[#181D28] px-2.5 py-1.5 text-white outline-none focus:border-[#38BDF8]"
                placeholder="e.g. 4"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 font-mono text-xs text-amber-300">
              <span className="font-bold">TELEMETRY FETCH NOTICE:</span> {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded border border-[#38BDF8]/50 bg-[#38BDF8]/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#38BDF8]/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'FETCHING & RESAMPLING...' : 'ASSEMBLE OPENF1 SHOWDOWN ➔'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LiveSessionLoader;
