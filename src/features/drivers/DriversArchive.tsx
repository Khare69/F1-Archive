import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAllDrivers,
  getDriverById,
  getTeamById,
  getSeasonsWonByDriver,
  getF1DBMetadata
} from '../../data/dataService';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { StatCard } from '../../components/StatCard/StatCard';
import { usePageMeta } from '../../hooks/usePageMeta';
import './DriversArchive.css';

type DriverCategory = 'active' | 'champions' | 'all';

export const DriversArchive: React.FC = () => {
  const { driverId } = useParams<{ driverId?: string }>();
  const navigate = useNavigate();
  const allDrivers = getAllDrivers();
  const meta = getF1DBMetadata();

  const [category, setCategory] = useState<DriverCategory>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(50);

  // Validate driverId or default to the first driver
  const selectedDriver = getDriverById(driverId) || allDrivers[0];

  usePageMeta({
    title: selectedDriver
      ? `${selectedDriver.name} (${selectedDriver.code}) — Driver Profile & Career Telemetry`
      : 'Drivers Roster — Formula 1 History',
    description: selectedDriver
      ? `${selectedDriver.name} (${selectedDriver.country}) career statistics. ${selectedDriver.championships} World Drivers' Championships, ${selectedDriver.wins} Grand Prix wins, ${selectedDriver.podiums} podiums, and ${selectedDriver.starts} starts.`
      : 'Complete Formula 1 drivers registry from 1950 to 2026. Explore World Champions, race wins, podium conversion rates, and career telemetry.',
    canonicalPath: `/drivers${selectedDriver ? `/${selectedDriver.id}` : ''}`,
    jsonLd: selectedDriver
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: selectedDriver.name,
          nationality: selectedDriver.country,
          birthDate: selectedDriver.birthDate || undefined,
          jobTitle: 'Formula 1 Racing Driver',
          description: `${selectedDriver.name} is a Formula 1 racing driver with ${selectedDriver.championships} World Championships and ${selectedDriver.wins} Grand Prix victories.`
        }
      : undefined
  });

  const driverTeam = getTeamById(selectedDriver.teamId);
  const teamColor = driverTeam?.color || '#00D2FF';
  const titlesWon = getSeasonsWonByDriver(selectedDriver.id);

  // Filter drivers based on category tab & search input
  const filteredDrivers = useMemo(() => {
    let list = allDrivers;

    if (category === 'active') {
      list = allDrivers.filter(d => d.isActive2026);
    } else if (category === 'champions') {
      list = allDrivers.filter(d => d.championships > 0).sort((a, b) => b.championships - a.championships);
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const clean = searchQuery.trim().toLowerCase();
    return list.filter(d =>
      d.name.toLowerCase().includes(clean) ||
      d.code?.toLowerCase().includes(clean) ||
      d.country.toLowerCase().includes(clean) ||
      String(d.number || '').includes(clean)
    );
  }, [allDrivers, category, searchQuery]);

  // Paginated/sliced drivers list for render performance
  const visibleDrivers = useMemo(() => {
    if (category !== 'all' && !searchQuery.trim()) {
      return filteredDrivers;
    }
    return filteredDrivers.slice(0, displayCount);
  }, [filteredDrivers, category, searchQuery, displayCount]);

  const handleSelectDriver = (id: string) => {
    navigate(`/drivers/${id}`);
  };

  const handleCategoryChange = (cat: DriverCategory) => {
    setCategory(cat);
    setDisplayCount(50);
  };

  const getPositionClass = (pos: number | string) => {
    if (pos === 1 || pos === 'P1') return 'pos-gold';
    if (pos === 2 || pos === 'P2') return 'pos-silver';
    if (pos === 3 || pos === 'P3') return 'pos-bronze';
    if (pos === 'DNF' || pos === 'DNS' || pos === 'DSQ') return 'pos-danger';
    return 'pos-standard';
  };

  const formatPositionDisplay = (pos: number | string) => {
    if (typeof pos === 'number') return `P${pos}`;
    return pos;
  };

  return (
    <div className="archive-layout drivers-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Drivers roster">
        <div className="sidebar-header telemetry">
          <span>// DRIVERS ROSTER</span>
          <span className="sidebar-count">{allDrivers.length} PILOTS</span>
        </div>

        {/* Head-to-head Quick Link */}
        <Link 
          to="/drivers/compare" 
          className="list-button" 
          style={{ 
            borderLeftColor: '#00D2FF', 
            background: 'rgba(0, 210, 255, 0.08)', 
            margin: '0.5rem 0.75rem',
            width: 'calc(100% - 1.5rem)'
          }}
        >
          <span style={{ color: '#00D2FF', fontWeight: 'bold' }}>⚔️ VS COMPARATOR</span>
          <span className="telemetry" style={{ fontSize: '0.7rem' }}>HEAD-TO-HEAD</span>
        </Link>

        {/* Category Tabs: Active 2026 / Champions / All */}
        <div className="driver-filter-tabs">
          <button
            type="button"
            className={`driver-tab-pill telemetry ${category === 'active' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('active')}
          >
            ACTIVE 2026
          </button>
          <button
            type="button"
            className={`driver-tab-pill telemetry ${category === 'champions' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('champions')}
          >
            CHAMPIONS
          </button>
          <button
            type="button"
            className={`driver-tab-pill telemetry ${category === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            ALL PILOTS
          </button>
        </div>

        {/* Quick Search */}
        <div className="driver-search-box">
          <input
            type="text"
            className="driver-search-input telemetry"
            placeholder="Search pilot, #, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="driver-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Drivers List */}
        <div className="drivers-scroll-list">
          {visibleDrivers.map((driver) => {
            const team = getTeamById(driver.teamId);
            const isSelected = selectedDriver.id === driver.id || selectedDriver.slug === driver.slug;

            return (
              <button
                key={driver.id}
                type="button"
                className={`list-button ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectDriver(driver.id)}
              >
                <div className="driver-btn-left">
                  <span 
                    className="driver-btn-num telemetry"
                    style={{ color: team?.color || '#00D2FF' }}
                  >
                    {driver.number ? `#${driver.number}` : (driver.code || '—')}
                  </span>
                  <span className="driver-btn-name">{driver.name}</span>
                </div>
                {driver.isLegend && (
                  <span className="legend-pill telemetry">
                    {driver.championships > 0 ? `${driver.championships}x WDC` : 'LEGEND'}
                  </span>
                )}
              </button>
            );
          })}

          {/* Load More Button for 'all' mode */}
          {visibleDrivers.length < filteredDrivers.length && (
            <button
              type="button"
              className="load-more-btn telemetry"
              onClick={() => setDisplayCount(prev => prev + 50)}
            >
              + LOAD MORE PILOTS ({filteredDrivers.length - visibleDrivers.length} REMAINING)
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="archive-content">
        {/* Driver Hero Panel */}
        <div 
          className="driver-hero-panel telemetry-panel corner-bracket"
          style={{ '--driver-brand-color': teamColor } as React.CSSProperties}
        >
          <div className="driver-hero-bg-glow"></div>

          <div className="driver-hero-layout">
            <div className="driver-hero-info">
              <div className="driver-meta-bar telemetry">
                <span>PILOT ID: {selectedDriver.code || selectedDriver.id}</span>
                <span>NATIONALITY: {selectedDriver.country.toUpperCase()}</span>
                {selectedDriver.isLegend && <span className="legend-tag">HALL OF FAME</span>}
                <span className="f1db-sync-pill">
                  <span>●</span> F1DB SYNCED (v{meta.f1dbVersion})
                </span>
              </div>

              <div className="driver-headline-row">
                <div className="driver-giant-number headline">
                  {selectedDriver.number ? `#${selectedDriver.number}` : (selectedDriver.code || '—')}
                </div>
                <div className="driver-names-box">
                  <h1 className="driver-full-name headline">{selectedDriver.name}</h1>
                  {driverTeam && (
                    <Link 
                      to={`/teams/${driverTeam.id}`} 
                      className="driver-team-link telemetry"
                      style={{ color: teamColor }}
                    >
                      <span className="team-indicator-dot" style={{ backgroundColor: teamColor }}></span>
                      <span>{driverTeam.name.toUpperCase()}</span>
                      <span className="link-arrow">→</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Driver Stat Cards */}
              <div className="driver-stats-row">
                <StatCard
                  label="WORLD TITLES"
                  value={selectedDriver.championships}
                  subtext="World Championships"
                  accentColor="#FFD700"
                  isPrimary={selectedDriver.championships > 0}
                />
                <StatCard
                  label="CAREER VICTORIES"
                  value={selectedDriver.wins}
                  subtext="Grand Prix Wins"
                  accentColor={teamColor}
                />
                <StatCard
                  label="PODIUM FINISHES"
                  value={selectedDriver.podiums}
                  subtext="Top 3 Results"
                  accentColor="#00D2FF"
                />
                <StatCard
                  label="RACE STARTS"
                  value={selectedDriver.starts || selectedDriver.wins || 0}
                  subtext={selectedDriver.winRate ? `${selectedDriver.winRate}% Win Rate` : 'Career Starts'}
                  accentColor="#C0C0C0"
                />
              </div>
            </div>

            {/* Driver Portrait */}
            <div className="driver-portrait-container">
              <div className="portrait-frame">
                <FallbackImage
                  src={selectedDriver.imageUrl}
                  alt={selectedDriver.name}
                  fallbackText={selectedDriver.id}
                  accentColor={teamColor}
                  type="driver"
                  driverCode={selectedDriver.id}
                  driverNumber={selectedDriver.number}
                  championships={selectedDriver.championships}
                  className="driver-portrait-img"
                />
                <div className="portrait-backdrop-gradient"></div>
              </div>
            </div>
          </div>
        </div>

        {/* World Championship Titles (if any) */}
        {titlesWon.length > 0 && (
          <section className="driver-section telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot" style={{ backgroundColor: '#FFD700' }}></span>
              <h2 className="headline">WORLD CHAMPIONSHIP TITLES // {titlesWon.length} CROWNS</h2>
            </div>

            <div className="titles-grid">
              {titlesWon.map((s) => (
                <Link key={s.year} to={`/seasons/${s.year}`} className="title-card">
                  <span className="title-year headline">{s.year}</span>
                  <span className="title-team telemetry">{s.championTeam}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Race Results & Career Telemetry */}
        <section className="driver-section telemetry-panel">
          <div className="section-title-bar">
            <span className="section-dot" style={{ backgroundColor: teamColor }}></span>
            <h2 className="headline">
              {selectedDriver.isLegend 
                ? 'CAREER ALL-TIME BENCHMARKS' 
                : 'RECENT GRAND PRIX RESULTS & CLASSIFICATIONS'}
            </h2>
          </div>

          <div className="results-container">
            {selectedDriver.raceFinishes.length > 0 ? (
              selectedDriver.raceFinishes.map((finish, idx) => (
                <div key={idx} className="result-row-card">
                  <div className="result-meta">
                    <span className="result-index telemetry">ROUND #{idx + 1}</span>
                    <span className="result-event headline">{finish.race}</span>
                  </div>
                  <div className={`result-position-badge headline ${getPositionClass(finish.position)}`}>
                    {formatPositionDisplay(finish.position)}
                  </div>
                </div>
              ))
            ) : (
              <div className="result-row-card" style={{ opacity: 0.7 }}>
                <div className="result-meta">
                  <span className="result-index telemetry">// CLASSIFICATION</span>
                  <span className="result-event headline">Career statistics indexed from F1DB historical records</span>
                </div>
                <div className="result-position-badge headline pos-standard">
                  INDEXED
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
