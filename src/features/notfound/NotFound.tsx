import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/usePageMeta';

export const NotFound: React.FC = () => {
  useDocumentTitle('404 // Sector Fault');

  return (
    <div className="notfound-page min-h-[calc(100vh-80px)] flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,rgba(255,30,30,0.08)_0%,rgba(5,7,12,0.95)_70%)]">
      <div className="notfound-card max-w-[800px] w-full p-8 sm:p-12 bg-[#0D1322]/90 border border-red-500/30 rounded-lg flex flex-col items-center text-center gap-6 shadow-[0_0_40px_rgba(255,30,30,0.15)]">
        <div className="notfound-meta flex items-center gap-2 font-mono text-xs text-red-500">
          <span className="fault-dot w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#FF1E1E] animate-pulse" />
          <span>FIA RACE CONTROL // TELEMETRY LINK SEVERED</span>
        </div>

        <div className="notfound-code-row flex items-baseline gap-4">
          <span className="notfound-code text-7xl sm:text-8xl font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">404</span>
          <span className="notfound-tag font-mono text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">SIGNAL_NOT_FOUND</span>
        </div>

        <h1 className="notfound-title text-2xl sm:text-3xl font-extrabold text-white">
          SECTOR OUT OF BOUNDS // <span className="text-red-500">OFF-TRACK EXCURSION</span>
        </h1>

        <p className="notfound-description text-base text-[#94A3B8] max-w-[600px] leading-relaxed">
          The requested aerodynamic telemetry coordinate does not exist in the official F1 archive database.
          Please re-engage race navigation or return to Race Control.
        </p>

        <div className="notfound-quick-links flex gap-3 flex-wrap justify-center mt-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#E10600] text-white font-mono text-xs font-bold tracking-wider hover:bg-white hover:text-black transition-colors"
          >
            <span>RETURN TO RACE CONTROL</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/standings"
            className="px-4 py-2.5 rounded-[4px] border border-white/10 bg-white/5 text-slate-300 font-mono text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>LIVE STANDINGS</span>
          </Link>

          <Link
            to="/circuits"
            className="px-4 py-2.5 rounded-[4px] border border-white/10 bg-white/5 text-slate-300 font-mono text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>3D CIRCUITS</span>
          </Link>

          <Link
            to="/lab"
            className="px-4 py-2.5 rounded-[4px] border border-white/10 bg-white/5 text-slate-300 font-mono text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>3D CAR LAB</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
