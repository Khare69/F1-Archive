import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Search, HelpCircle, Menu, X, ChevronDown } from 'lucide-react';
import { useExperienceMode } from '../../contexts/ExperienceModeContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';

export interface NavigationProps {
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

const isArchiveActive = (pathname: string): boolean => {
  return (
    pathname === '/archive' ||
    pathname.startsWith('/archive/') ||
    pathname === '/standings' ||
    pathname.startsWith('/standings/') ||
    pathname === '/seasons' ||
    pathname.startsWith('/seasons/') ||
    pathname === '/drivers' ||
    pathname.startsWith('/drivers/') ||
    pathname === '/teams' ||
    pathname.startsWith('/teams/') ||
    pathname === '/circuits' ||
    pathname.startsWith('/circuits/')
  );
};

const isTelemetryActive = (pathname: string): boolean => {
  return (
    pathname === '/engineering' ||
    pathname.startsWith('/engineering/') ||
    pathname === '/telemetry' ||
    pathname.startsWith('/telemetry/') ||
    pathname === '/pitwall' ||
    pathname.startsWith('/pitwall/')
  );
};

export const Navigation: React.FC<NavigationProps> = ({ onOpenSearch, onOpenShortcuts }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { pathname } = location;
  const { mode, setMode } = useExperienceMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const archiveActive = isArchiveActive(pathname);
  const telemetryActive = isTelemetryActive(pathname);
  const labActive = pathname === '/lab' || pathname.startsWith('/lab/');
  const historianActive = pathname === '/historian' || pathname.startsWith('/historian/');
  const homeActive = pathname === '/';

  return (
    <header className="sticky top-0 z-40 h-14 bg-canvas/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex items-center text-sm font-bold tracking-tight">
            <span className="text-crimson font-black tracking-tighter text-base">F1</span>
            <span className="text-white/40 mx-1 font-mono">//</span>
            <span className="text-white tracking-widest font-mono text-xs">ARCHIVE</span>
          </div>
          <span className="hidden xl:inline text-[9px] font-mono tracking-widest text-neutral-500 uppercase">
            THE EVOLUTION OF SPEED
          </span>
        </Link>

        {/* Center Desktop Navigation: Exactly 5 Hubs */}
        <nav
          className="hidden md:flex items-center gap-1 h-full"
          aria-label="Main Hub Navigation"
        >
          {/* 1. Home */}
          <div className="relative flex items-center h-full">
            <Link
              to="/"
              data-testid="hub-nav-item"
              aria-current={homeActive ? 'page' : undefined}
              className={`relative flex items-center h-full px-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                homeActive
                  ? 'text-white font-bold active'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Home
              {homeActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'active-hub-indicator'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-crimson"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          </div>

          {/* 2. Archive */}
          <div className="relative flex items-center h-full">
            <Link
              to="/seasons"
              data-testid="hub-nav-item"
              aria-current={archiveActive ? 'page' : undefined}
              className={`relative flex items-center h-full pl-3 pr-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                archiveActive
                  ? 'text-white font-bold active'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Archive
              {archiveActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'active-hub-indicator'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-crimson"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 mr-1 text-neutral-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                  aria-label="Archive sub-menu"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 bg-surface-elevated border-white/10"
              >
                <DropdownMenuItem asChild>
                  <Link to="/standings">Standings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/seasons">Seasons</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/drivers">Drivers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/drivers/compare">Driver Comparison</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/teams">Constructors</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/circuits">Circuits</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 3. Telemetry & Strategy */}
          <div className="relative flex items-center h-full">
            <Link
              to="/telemetry"
              data-testid="hub-nav-item"
              aria-current={telemetryActive ? 'page' : undefined}
              className={`relative flex items-center h-full pl-3 pr-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                telemetryActive
                  ? 'text-white font-bold active'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Telemetry &amp; Strategy
              {telemetryActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'active-hub-indicator'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-crimson"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 mr-1 text-neutral-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                  aria-label="Telemetry & Strategy sub-menu"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-52 bg-surface-elevated border-white/10"
              >
                <DropdownMenuItem asChild>
                  <Link to="/telemetry">Telemetry Ghost Replay</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pitwall">Pit-Wall Strategy</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 4. 3D Lab */}
          <div className="relative flex items-center h-full">
            <Link
              to="/lab"
              data-testid="hub-nav-item"
              aria-current={labActive ? 'page' : undefined}
              className={`relative flex items-center h-full px-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                labActive
                  ? 'text-white font-bold active'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              3D Lab
              {labActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'active-hub-indicator'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-crimson"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          </div>

          {/* 5. SQL Historian */}
          <div className="relative flex items-center h-full">
            <Link
              to="/historian"
              data-testid="hub-nav-item"
              aria-current={historianActive ? 'page' : undefined}
              className={`relative flex items-center h-full px-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                historianActive
                  ? 'text-white font-bold active'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              SQL Historian
              {historianActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'active-hub-indicator'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-crimson"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          </div>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audience Depth Mode Switcher (Learn | Pro | Dev: C-42) */}
          <div
            role="group"
            aria-label="Audience Depth Mode"
            className="flex items-center p-0.5 rounded-[4px] bg-[#11151E] border border-white/10 text-[10px] font-mono tracking-wider"
          >
            <button
              type="button"
              onClick={() => setMode('beginner')}
              aria-pressed={mode === 'beginner'}
              data-testid="mode-btn-beginner"
              title="Learn Mode (Beginner glossary & insights)"
              className={`px-2 py-1 rounded-[3px] transition-colors ${
                mode === 'beginner'
                  ? 'bg-crimson text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Learn
            </button>
            <button
              type="button"
              onClick={() => setMode('enthusiast')}
              aria-pressed={mode === 'enthusiast'}
              data-testid="mode-btn-enthusiast"
              title="Pro Mode (Telemetry & data-rich analytics)"
              className={`px-2 py-1 rounded-[3px] transition-colors ${
                mode === 'enthusiast'
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pro
            </button>
            <button
              type="button"
              onClick={() => setMode('developer')}
              aria-pressed={mode === 'developer'}
              data-testid="mode-btn-developer"
              title="Dev Mode (Architecture & inspect query)"
              className={`px-2 py-1 rounded-[3px] transition-colors ${
                mode === 'developer'
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Dev
            </button>
          </div>

          {onOpenSearch && (
            <button
              type="button"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface/80 hover:bg-surface-elevated border border-white/10 hover:border-white/20 text-xs text-neutral-300 font-mono transition-colors"
              onClick={onOpenSearch}
              aria-label="Search database (Ctrl+K)"
              title="Search Archive (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline text-xs">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white/5 border border-white/10 rounded">
                Ctrl K
              </kbd>
            </button>
          )}

          {onOpenShortcuts && (
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
              onClick={onOpenShortcuts}
              aria-label="Keyboard Shortcuts (?)"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 font-mono text-[10px] text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>RACE CONTROL // ONLINE</span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-8 h-8 rounded text-neutral-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-surface/98 border-b border-white/10 backdrop-blur-xl p-4 flex flex-col gap-3 shadow-2xl z-50">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Depth Mode
            </span>
            <div
              role="group"
              aria-label="Mobile Audience Depth Mode"
              className="flex items-center p-0.5 rounded-[4px] bg-[#11151E] border border-white/10 text-[10px] font-mono tracking-wider"
            >
              <button
                type="button"
                onClick={() => setMode('beginner')}
                aria-pressed={mode === 'beginner'}
                className={`px-2 py-1 rounded-[3px] transition-colors ${
                  mode === 'beginner' ? 'bg-crimson text-white font-bold' : 'text-neutral-400'
                }`}
              >
                Learn
              </button>
              <button
                type="button"
                onClick={() => setMode('enthusiast')}
                aria-pressed={mode === 'enthusiast'}
                className={`px-2 py-1 rounded-[3px] transition-colors ${
                  mode === 'enthusiast' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                Pro
              </button>
              <button
                type="button"
                onClick={() => setMode('developer')}
                aria-pressed={mode === 'developer'}
                className={`px-2 py-1 rounded-[3px] transition-colors ${
                  mode === 'developer' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                Dev
              </button>
            </div>
          </div>

          <Link
            to="/"
            className={`px-3 py-2 rounded text-sm font-mono uppercase tracking-wider ${
              homeActive ? 'bg-crimson/20 text-white font-bold' : 'text-neutral-300 hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>

          <div>
            <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              ARCHIVE
            </div>
            <div className="pl-3 flex flex-col gap-1 mt-1 border-l border-white/10 ml-2">
              <Link
                to="/seasons"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Seasons
              </Link>
              <Link
                to="/standings"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Standings
              </Link>
              <Link
                to="/drivers"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Drivers
              </Link>
              <Link
                to="/drivers/compare"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Driver Comparison
              </Link>
              <Link
                to="/teams"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Constructors
              </Link>
              <Link
                to="/circuits"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Circuits
              </Link>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              TELEMETRY &amp; STRATEGY
            </div>
            <div className="pl-3 flex flex-col gap-1 mt-1 border-l border-white/10 ml-2">
              <Link
                to="/telemetry"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Telemetry Ghost Replay
              </Link>
              <Link
                to="/pitwall"
                className="px-2 py-1.5 rounded text-xs font-mono text-neutral-300 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pit-Wall Strategy
              </Link>
            </div>
          </div>

          <Link
            to="/lab"
            className={`px-3 py-2 rounded text-sm font-mono uppercase tracking-wider ${
              labActive ? 'bg-crimson/20 text-white font-bold' : 'text-neutral-300 hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            3D Lab
          </Link>

          <Link
            to="/historian"
            className={`px-3 py-2 rounded text-sm font-mono uppercase tracking-wider ${
              historianActive
                ? 'bg-crimson/20 text-white font-bold'
                : 'text-neutral-300 hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            SQL Historian
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navigation;
