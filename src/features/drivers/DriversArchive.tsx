import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAllDrivers, getDriverById, getTeamById, getSeasonsWonByDriver } from '../../data/dataService';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './DriversArchive.css';

export const DriversArchive: React.FC = () => {
  const { driverId } = useParams<{ driverId?: string }>();
  const navigate = useNavigate();
  const drivers = getAllDrivers();

  // Validate driverId or default to the first driver
  const selectedDriver = getDriverById(driverId) || drivers[0];
  useDocumentTitle(selectedDriver ? selectedDriver.name : 'Drivers Roster');

  const driverTeam = getTeamById(selectedDriver.teamId);
  const teamColor = driverTeam?.color || '#00D2FF';
  const titlesWon = getSeasonsWonByDriver(selectedDriver.id);

  const handleSelectDriver = (id: string) => {
    navigate(`/drivers/${id}`);
  };

  const getPositionClass = (pos: number | string) => {
    if (pos === 1 || pos === 'P1') return 'pos-gold';
    if (pos === 2 || pos === 'P2') return 'pos-silver';
    if (pos === 3 || pos === 'P3') return 'pos-bronze';
    if (pos === 'DNF' || pos === 'DNS') return 'pos-danger';
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
          <span className="sidebar-count">{drivers.length} PILOTS</span>
        </div>

        {/* Head-to-head Quick Link */}
        <Link to="/drivers/compare" className="list-button" style={{ borderLeftColor: '#00D2FF', background: 'rgba(0, 210, 255, 0.08)', marginBottom: '0.5rem' }}>
          <span style={{ color: '#00D2FF', fontWeight: 'bold' }}>⚔️ VS COMPARATOR</span>
          <span className="telemetry" style={{ fontSize: '0.7rem' }}>HEAD-TO-HEAD</span>
        </Link>

        {drivers.map((driver) => {
          const team = getTeamById(driver.teamId);
          return (
            <button
              key={driver.id}
              type="button"
              className={`list-button ${selectedDriver.id === driver.id ? 'active' : ''}`}
              onClick={() => handleSelectDriver(driver.id)}
            >
              <div className="driver-btn-left">
                <span 
                  className="driver-btn-num telemetry"
                  style={{ color: team?.color || '#00D2FF' }}
                >
                  #{driver.number}
                </span>
                <span className="driver-btn-name">{driver.name}</span>
              </div>
              {driver.isLegend && (
                <span className="legend-pill telemetry">LEGEND</span>
              )}
            </button>
          );
        })}
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
                <span>PILOT ID: {selectedDriver.id}</span>
                <span>NATIONALITY: {selectedDriver.country.toUpperCase()}</span>
                {selectedDriver.isLegend && <span className="legend-tag">HALL OF FAME</span>}
              </div>

              <div className="driver-headline-row">
                <div className="driver-giant-number headline">
                  #{selectedDriver.number}
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
                  label="COUNTRY"
                  value={selectedDriver.country}
                  subtext="Licensing Nation"
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
            {selectedDriver.raceFinishes.map((finish, idx) => (
              <div key={idx} className="result-row-card">
                <div className="result-meta">
                  <span className="result-index telemetry">ROUND #{idx + 1}</span>
                  <span className="result-event headline">{finish.race}</span>
                </div>
                <div className={`result-position-badge headline ${getPositionClass(finish.position)}`}>
                  {formatPositionDisplay(finish.position)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

