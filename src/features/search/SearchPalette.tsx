import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDrivers, getAllTeams, getAllSeasons, getAllCircuits } from '../../data/dataService';
import './SearchPalette.css';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  name: string;
  category: 'driver' | 'team' | 'season' | 'circuit' | 'telemetry' | 'tool';
  stat: string;
  path: string;
  code?: string;
  extra?: string;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input whenever palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const allItems = useMemo<SearchItem[]>(() => {
    const drivers = getAllDrivers().map(d => ({
      id: d.id,
      name: d.name,
      category: 'driver' as const,
      stat: d.championships > 0 
        ? `${d.championships}x WDC • ${d.wins} Wins` 
        : `${d.wins} Wins • ${d.starts || 0} Starts`,
      path: `/drivers/${d.id}`,
      code: d.code,
      extra: `${d.country} ${d.code || ''} ${d.slug || ''}`
    }));

    const teams = getAllTeams().map(t => ({
      id: t.id,
      name: t.name,
      category: 'team' as const,
      stat: `${t.carName} • ${t.championships} Titles`,
      path: `/teams/${t.id}`,
      extra: `${t.principal} ${t.base} ${t.id}`
    }));

    const seasons = getAllSeasons().map(s => ({
      id: String(s.year),
      name: `${s.year} World Championship`,
      category: 'season' as const,
      stat: `Champ: ${s.championDriver} (${s.championTeam})`,
      path: `/seasons/${s.year}`,
      extra: `${s.championDriver} ${s.championTeam}`
    }));

    const circuits = getAllCircuits().map(c => ({
      id: c.id,
      name: c.name,
      category: 'circuit' as const,
      stat: `${c.country} • ${c.lengthKm}`,
      path: `/circuits/${c.id}`,
      extra: `${c.city} ${c.country} ${c.type}`
    }));

    const telemetries: SearchItem[] = [
      {
        id: 'telemetry-hub',
        name: '3D Telemetry Ghost-Lap & Strategy Lab',
        category: 'telemetry' as const,
        stat: 'Multi-Channel Ghost Replay • 25 Mini-Sectors',
        path: '/telemetry',
        extra: 'ghost lap replay telemetry trace speed throttle brake delta strategy'
      },
      {
        id: 'silverstone-2024-ham-vs-ver',
        name: 'Silverstone 2024: Hamilton vs. Verstappen',
        category: 'telemetry' as const,
        stat: '3D Ghost Lap • British GP Victory Duel',
        path: '/telemetry/silverstone-2024-ham-vs-ver',
        extra: 'hamilton verstappen silverstone 2024 ghost replay'
      },
      {
        id: 'monaco-2024-lec-vs-pia',
        name: 'Monaco 2024: Leclerc vs. Piastri',
        category: 'telemetry' as const,
        stat: '3D Ghost Lap • Q3 Pole Position Shootout',
        path: '/telemetry/monaco-2024-lec-vs-pia',
        extra: 'leclerc piastri monaco 2024 pole ghost replay'
      },
      {
        id: 'spa-2024-ver-vs-nor',
        name: 'Spa 2024: Verstappen vs. Norris',
        category: 'telemetry' as const,
        stat: '3D Ghost Lap • Eau Rouge & Kemmel Shootout',
        path: '/telemetry/spa-2024-ver-vs-nor',
        extra: 'verstappen norris spa 2024 ghost replay'
      },
      {
        id: 'madrid-2026-sim-alo-vs-sai',
        name: 'Madrid 2026: Alonso vs. Sainz',
        category: 'telemetry' as const,
        stat: '3D Ghost Lap • 2026 Active Aero & MOM Duel',
        path: '/telemetry/madrid-2026-sim-alo-vs-sai',
        extra: 'alonso sainz madrid 2026 active aero ghost replay'
      }
    ];

    const tools: SearchItem[] = [
      {
        id: 'historian-lab',
        name: 'Explainable AI Race Historian & SQL Lab',
        category: 'tool' as const,
        stat: 'Natural Language F1DB Text-to-SQL • 16 Presets',
        path: '/historian',
        extra: 'historian sql ai f1db natural language query presets text-to-sql copilot'
      },
      {
        id: 'cars-cad-lab',
        name: '3D Vehicle CAD Lab & 2026 Aero Inspector',
        category: 'tool' as const,
        stat: 'Active Aero Straight/Corner Mode • Draco GLB',
        path: '/cars',
        extra: 'cars 3d vehicle cad model aero drs wing chassis wireframe'
      },
      {
        id: 'driver-comparison',
        name: 'Driver Head-to-Head & Era Normalizer',
        category: 'tool' as const,
        stat: 'Teammate H2H Gap • Career Points Share %',
        path: '/drivers/compare',
        extra: 'compare drivers head to head h2h teammate gap era normalized stats'
      },
      {
        id: 'paddock-garage',
        name: 'Paddock Garage & Audio Experience',
        category: 'tool' as const,
        stat: 'Engine Audio Simulator • Radio Comms',
        path: '/garage',
        extra: 'garage paddock audio radio engine team sound'
      },
      {
        id: 'live-standings',
        name: 'Championship Standings & Race Calendar',
        category: 'tool' as const,
        stat: 'WDC & WCC Live Points • Race Schedule',
        path: '/standings',
        extra: 'standings championship points calendar schedule race'
      }
    ];

    return [...tools, ...telemetries, ...drivers, ...teams, ...seasons, ...circuits];
  }, []);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return {
        tools: allItems.filter(i => i.category === 'tool').slice(0, 3),
        telemetries: allItems.filter(i => i.category === 'telemetry').slice(0, 3),
        drivers: allItems.filter(i => i.category === 'driver').slice(0, 4),
        teams: allItems.filter(i => i.category === 'team').slice(0, 4),
        seasons: allItems.filter(i => i.category === 'season').slice(0, 4),
        circuits: allItems.filter(i => i.category === 'circuit').slice(0, 4)
      };
    }

    const clean = query.trim().toLowerCase();
    const matches = allItems.filter(item =>
      item.name.toLowerCase().includes(clean) ||
      item.id.toLowerCase().includes(clean) ||
      (item.code && item.code.toLowerCase().includes(clean)) ||
      (item.extra && item.extra.toLowerCase().includes(clean)) ||
      item.stat.toLowerCase().includes(clean)
    );

    return {
      tools: matches.filter(i => i.category === 'tool').slice(0, 4),
      telemetries: matches.filter(i => i.category === 'telemetry').slice(0, 4),
      drivers: matches.filter(i => i.category === 'driver').slice(0, 5),
      teams: matches.filter(i => i.category === 'team').slice(0, 5),
      seasons: matches.filter(i => i.category === 'season').slice(0, 5),
      circuits: matches.filter(i => i.category === 'circuit').slice(0, 5)
    };
  }, [allItems, query]);

  const flatResults = useMemo(() => {
    return [
      ...filteredResults.tools,
      ...filteredResults.telemetries,
      ...filteredResults.drivers,
      ...filteredResults.teams,
      ...filteredResults.seasons,
      ...filteredResults.circuits
    ];
  }, [filteredResults]);

  // Handle keyboard events (ESC, Arrow keys, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (flatResults.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % (flatResults.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          navigate(flatResults[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  let globalIndexCounter = 0;

  return (
    <div
      className="search-palette-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search F1 Archive"
    >
      <div className="search-palette-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <svg className="search-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-palette-input"
            placeholder="SEARCH ARCHIVE... (DRIVERS, TEAMS, SEASONS, CIRCUITS)"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button type="button" className="search-esc-hint telemetry" onClick={onClose}>
            ESC
          </button>
        </div>

        <div className="search-results-container">
          {flatResults.length === 0 ? (
            <div className="search-empty-state">
              [ NO TELEMETRY MATCHES FOUND FOR &quot;{query}&quot; ]
            </div>
          ) : (
            <>
              {filteredResults.tools.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header telemetry">// ANALYTICS &amp; 3D LABS</div>
                  {filteredResults.tools.map(item => {
                    const currentIndex = globalIndexCounter++;
                    return (
                      <div
                        key={item.id}
                        className={`search-result-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(item.path)}
                      >
                        <div className="search-item-left">
                          <span
                            className="search-type-badge"
                            style={{
                              background: 'rgba(255, 215, 0, 0.15)',
                              color: '#FFD700',
                              border: '1px solid rgba(255, 215, 0, 0.4)'
                            }}
                          >
                            MODULE
                          </span>
                          <span className="search-item-name">{item.name}</span>
                        </div>
                        <div className="search-item-right">
                          <span className="search-item-stat telemetry">{item.stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredResults.telemetries.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header telemetry">// 3D GHOST TELEMETRY</div>
                  {filteredResults.telemetries.map(item => {
                    const currentIndex = globalIndexCounter++;
                    return (
                      <div
                        key={item.id}
                        className={`search-result-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(item.path)}
                      >
                        <div className="search-item-left">
                          <span className="search-type-badge" style={{ background: 'rgba(0, 210, 255, 0.2)', color: '#00D2FF', border: '1px solid #00D2FF' }}>
                            GHOST
                          </span>
                          <span className="search-item-name">{item.name}</span>
                        </div>
                        <div className="search-item-right">
                          <span className="search-item-stat telemetry">{item.stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredResults.drivers.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header telemetry">// DRIVERS ROSTER</div>
                  {filteredResults.drivers.map(item => {
                    const currentIndex = globalIndexCounter++;
                    return (
                      <div
                        key={item.id}
                        className={`search-result-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(item.path)}
                      >
                        <div className="search-item-left">
                          <span className="search-type-badge badge-driver">PILOT</span>
                          <span className="search-item-name">{item.name}</span>
                        </div>
                        <div className="search-item-right">
                          <span className="search-item-stat telemetry">{item.stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredResults.teams.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header telemetry">// CONSTRUCTORS</div>
                  {filteredResults.teams.map(item => {
                    const currentIndex = globalIndexCounter++;
                    return (
                      <div
                        key={item.id}
                        className={`search-result-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(item.path)}
                      >
                        <div className="search-item-left">
                          <span className="search-type-badge badge-team">TEAM</span>
                          <span className="search-item-name">{item.name}</span>
                        </div>
                        <div className="search-item-right">
                          <span className="search-item-stat telemetry">{item.stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredResults.seasons.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header telemetry">// SEASONS VAULT</div>
                  {filteredResults.seasons.map(item => {
                    const currentIndex = globalIndexCounter++;
                    return (
                      <div
                        key={item.id}
                        className={`search-result-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(item.path)}
                      >
                        <div className="search-item-left">
                          <span className="search-type-badge badge-season">SEASON</span>
                          <span className="search-item-name">{item.name}</span>
                        </div>
                        <div className="search-item-right">
                          <span className="search-item-stat telemetry">{item.stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredResults.circuits.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header telemetry">// RACE CIRCUITS</div>
                  {filteredResults.circuits.map(item => {
                    const currentIndex = globalIndexCounter++;
                    return (
                      <div
                        key={item.id}
                        className={`search-result-item ${selectedIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleSelect(item.path)}
                      >
                        <div className="search-item-left">
                          <span className="search-type-badge badge-circuit">TRACK</span>
                          <span className="search-item-name">{item.name}</span>
                        </div>
                        <div className="search-item-right">
                          <span className="search-item-stat telemetry">{item.stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="search-palette-footer telemetry">
          <div className="search-footer-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> NAVIGATE</span>
            <span><kbd>↵</kbd> SELECT</span>
            <span><kbd>ESC</kbd> CLOSE</span>
          </div>
          <span>F1 // ARCHIVE COMMAND PALETTE</span>
        </div>
      </div>
    </div>
  );
};
