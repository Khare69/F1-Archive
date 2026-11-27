import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Zap, User, Shield, Compass, Calendar, ArrowRight, CornerDownLeft } from 'lucide-react';
import type FuseType from 'fuse.js';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { loadSearchIndex, SearchEntity } from './searchIndex';
import { useExperienceMode } from '../../contexts/ExperienceModeContext';

export interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
  isOpen,
  onClose,
  onOpenShortcuts,
}) => {
  const [query, setQuery] = useState('');
  const [fuseInstance, setFuseInstance] = useState<FuseType<SearchEntity> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setMode } = useExperienceMode();

  // Lazy load index ONLY when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      if (!fuseInstance) {
        setIsLoading(true);
        loadSearchIndex()
          .then((fuse) => {
            setFuseInstance(fuse);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [isOpen, fuseInstance]);

  // Compute search results
  const searchResults = useMemo(() => {
    if (!fuseInstance || !query.trim()) {
      return null;
    }

    const raw = fuseInstance.search(query.trim());
    const items = raw.map((r) => r.item);

    return {
      actions: items.filter((i) => i.category === 'action').slice(0, 6),
      drivers: items.filter((i) => i.category === 'driver').slice(0, 6),
      constructors: items.filter((i) => i.category === 'constructor').slice(0, 6),
      circuits: items.filter((i) => i.category === 'circuit').slice(0, 6),
      seasons: items.filter((i) => i.category === 'season').slice(0, 6),
      totalMatches: items.length,
    };
  }, [fuseInstance, query]);

  const handleSelect = (item: SearchEntity) => {
    onClose();
    if (item.action === 'open-shortcuts') {
      onOpenShortcuts?.();
      return;
    }
    if (item.action === 'set-mode-beginner') {
      setMode('beginner');
      return;
    }
    if (item.action === 'set-mode-enthusiast') {
      setMode('enthusiast');
      return;
    }
    if (item.action === 'set-mode-developer') {
      setMode('developer');
      return;
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleAskHistorian = () => {
    onClose();
    navigate('/historian');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden bg-[#11151E] border-white/10 shadow-2xl rounded-md"
        data-testid="search-palette-dialog"
      >
        <DialogTitle className="sr-only">Search F1 Archive</DialogTitle>
        <DialogDescription className="sr-only">
          Search drivers, circuits, constructors, seasons, and telemetry quick actions
        </DialogDescription>

        <Command
          shouldFilter={false}
          className="w-full flex flex-col bg-transparent font-sans"
        >
          {/* Search Input Bar */}
          <div className="flex items-center border-b border-white/10 px-3.5 py-2.5">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-neutral-400" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="SEARCH ARCHIVE... (DRIVERS, TEAMS, CIRCUITS, SEASONS)"
              className="flex h-9 w-full rounded-md bg-transparent text-sm font-mono text-white outline-none placeholder:text-neutral-500 placeholder:text-xs"
              autoFocus
            />
            {isLoading && (
              <span className="text-[10px] font-mono text-neutral-400 mr-2 animate-pulse">
                INDEXING...
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-mono text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 border border-white/10 transition-colors"
            >
              ESC
            </button>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
            {/* Zero-query: Quick Actions */}
            {!query.trim() && (
              <Command.Group
                heading="QUICK ACTIONS"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-500"
              >
                <Command.Item
                  value="action-compare-ver-ham"
                  onSelect={() =>
                    handleSelect({
                      id: 'action-compare-ver-ham',
                      category: 'action',
                      title: 'Compare Max Verstappen vs Lewis Hamilton',
                      subtitle: 'Head-to-head career telemetry & era comparison',
                      keywords: '',
                      path: '/drivers/compare?d1=VER&d2=HAM',
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <div>
                      <div className="font-semibold text-white">Compare Max Verstappen vs Lewis Hamilton</div>
                      <div className="text-[11px] text-neutral-400">Head-to-head career telemetry & era comparison</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                </Command.Item>

                <Command.Item
                  value="action-circuit-spa"
                  onSelect={() =>
                    handleSelect({
                      id: 'action-circuit-spa',
                      category: 'action',
                      title: 'Open Spa-Francorchamps Circuit',
                      subtitle: '3D circuit elevation & track geometry',
                      keywords: '',
                      path: '/circuits/spa-francorchamps',
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="h-3.5 w-3.5 text-blue-400" />
                    <div>
                      <div className="font-semibold text-white">Open Spa-Francorchamps Circuit</div>
                      <div className="text-[11px] text-neutral-400">3D circuit elevation & track geometry</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                </Command.Item>

                <Command.Item
                  value="action-telemetry-replay"
                  onSelect={() =>
                    handleSelect({
                      id: 'action-telemetry-replay',
                      category: 'action',
                      title: 'Open Telemetry Ghost-Lap Replay',
                      subtitle: 'Multi-channel speed, throttle, brake 3D telemetry',
                      keywords: '',
                      path: '/telemetry',
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-white">Open Telemetry Ghost-Lap Replay</div>
                      <div className="text-[11px] text-neutral-400">Multi-channel speed, throttle, brake 3D telemetry</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                </Command.Item>

                <Command.Item
                  value="action-pitwall-strategy"
                  onSelect={() =>
                    handleSelect({
                      id: 'action-pitwall-strategy',
                      category: 'action',
                      title: 'Open Pit-Wall Strategy Simulator',
                      subtitle: 'Monte Carlo undercut & tyre degradation model',
                      keywords: '',
                      path: '/pitwall',
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">Open Pit-Wall Strategy Simulator</div>
                      <div className="text-[11px] text-neutral-400">Monte Carlo undercut & tyre degradation model</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                </Command.Item>

                <Command.Item
                  value="action-sql-historian"
                  onSelect={() =>
                    handleSelect({
                      id: 'action-sql-historian',
                      category: 'action',
                      title: 'Open SQL Historian',
                      subtitle: 'Query F1DB with natural language text-to-SQL or CodeMirror',
                      keywords: '',
                      path: '/historian',
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-crimson" />
                    <div>
                      <div className="font-semibold text-white">Open SQL Historian</div>
                      <div className="text-[11px] text-neutral-400">Query F1DB with natural language text-to-SQL or CodeMirror</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                </Command.Item>

                <Command.Item
                  value="action-keyboard-shortcuts"
                  onSelect={() =>
                    handleSelect({
                      id: 'action-keyboard-shortcuts',
                      category: 'action',
                      title: 'View Keyboard Shortcuts',
                      subtitle: 'Command palette, navigation hotkeys, and shortcuts',
                      keywords: '',
                      action: 'open-shortcuts',
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CornerDownLeft className="h-3.5 w-3.5 text-neutral-400" />
                    <div>
                      <div className="font-semibold text-white">View Keyboard Shortcuts</div>
                      <div className="text-[11px] text-neutral-400">Command palette, navigation hotkeys, and shortcuts (?)</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                </Command.Item>
              </Command.Group>
            )}

            {/* Non-empty query results */}
            {query.trim() && searchResults && searchResults.totalMatches === 0 && (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                <div className="font-mono text-xs text-neutral-400">
                  [ NO TELEMETRY MATCHES FOUND FOR &quot;{query}&quot; ]
                </div>
                <button
                  type="button"
                  onClick={handleAskHistorian}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-crimson hover:bg-crimson/90 text-white font-mono text-xs font-semibold tracking-wider transition-colors"
                >
                  Ask SQL Historian
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {query.trim() && searchResults && (
              <>
                {searchResults.actions.length > 0 && (
                  <Command.Group
                    heading="QUICK ACTIONS"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-500"
                  >
                    {searchResults.actions.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          <div>
                            <div className="font-semibold text-white">{item.title}</div>
                            <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-neutral-500 group-hover:text-white" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {searchResults.drivers.length > 0 && (
                  <Command.Group
                    heading="DRIVERS"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-500"
                  >
                    {searchResults.drivers.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-crimson" />
                          <div>
                            <div className="font-semibold text-white">{item.title}</div>
                            <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">DRIVER</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {searchResults.constructors.length > 0 && (
                  <Command.Group
                    heading="CONSTRUCTORS"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-500"
                  >
                    {searchResults.constructors.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-blue-400" />
                          <div>
                            <div className="font-semibold text-white">{item.title}</div>
                            <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">TEAM</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {searchResults.circuits.length > 0 && (
                  <Command.Group
                    heading="CIRCUITS"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-500"
                  >
                    {searchResults.circuits.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="h-3.5 w-3.5 text-emerald-400" />
                          <div>
                            <div className="font-semibold text-white">{item.title}</div>
                            <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">CIRCUIT</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {searchResults.seasons.length > 0 && (
                  <Command.Group
                    heading="SEASONS"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-neutral-500"
                  >
                    {searchResults.seasons.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-xs text-neutral-200 outline-none hover:bg-white/10 data-[selected=true]:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-amber-400" />
                          <div>
                            <div className="font-semibold text-white">{item.title}</div>
                            <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">SEASON</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2 font-mono text-[10px] text-neutral-500 bg-black/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">↑</kbd>
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">↓</kbd>
                NAVIGATE
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">↵</kbd>
                SELECT
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">ESC</kbd>
                CLOSE
              </span>
            </div>
            <span>F1 // ARCHIVE COMMAND PALETTE</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchPalette;
