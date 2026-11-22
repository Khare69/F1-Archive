import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAllTeams, getTeamById, getTeamDrivers, getSeasonsWonByTeam } from '../../data/dataService';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './TeamsArchive.css';

export const TeamsArchive: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const teams = getAllTeams();

  // Validate teamId or default to the first team
  const selectedTeam = getTeamById(teamId) || teams[0];
  useDocumentTitle(selectedTeam ? selectedTeam.name : 'Constructors');
  const teamDrivers = getTeamDrivers(selectedTeam.id);
  const seasonsWon = getSeasonsWonByTeam(selectedTeam.id);

  const handleSelectTeam = (id: string) => {
    navigate(`/teams/${id}`);
  };

  return (
    <div className="archive-layout teams-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Constructors list">
        <div className="sidebar-header telemetry">
          <span>// CONSTRUCTORS</span>
          <span className="sidebar-count">{teams.length} TEAMS</span>
        </div>
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            className={`list-button ${selectedTeam.id === team.id ? 'active' : ''}`}
            onClick={() => handleSelectTeam(team.id)}
          >
            <div className="team-button-label">
              <span 
                className="team-color-indicator" 
                style={{ backgroundColor: team.color, boxShadow: `0 0 8px ${team.color}` }}
              />
              <span className="team-name-text">{team.name}</span>
            </div>
            {team.isLegendary && (
              <span className="legend-pill telemetry">LEGEND</span>
            )}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="archive-content">
        {/* Team Hero Header */}
        <div 
          className="team-hero-panel telemetry-panel corner-bracket"
          style={{ '--team-brand-color': selectedTeam.color } as React.CSSProperties}
        >
          <div className="team-hero-top">
            <div className="team-logo-container">
              <FallbackImage
                src={selectedTeam.logoUrl}
                alt={`${selectedTeam.name} Logo`}
                type="team"
                accentColor={selectedTeam.color}
                className="team-brand-logo"
              />
            </div>

            <div className="team-hero-titles">
              <div className="team-meta-row telemetry">
                <span>CONSTRUCTOR ID: #{selectedTeam.id.toUpperCase()}</span>
                <span>ENTRY YEAR: {selectedTeam.firstEntry}</span>
              </div>
              <h1 
                className="team-title headline"
                style={{ 
                  color: selectedTeam.color,
                  textShadow: `0 0 25px ${selectedTeam.color}66`
                }}
              >
                {selectedTeam.name}
              </h1>
              <div className="team-car-badge telemetry">
                CHASSIS DESIGNATION: <span className="headline">{selectedTeam.carName}</span>
              </div>
            </div>

            <div className="team-hero-actions">
              <Link
                to={`/cars/${selectedTeam.id}`}
                className="f1-btn team-3d-btn"
                style={{
                  borderColor: selectedTeam.color,
                  backgroundColor: `${selectedTeam.color}22`
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <span>VIEW 3D MODEL</span>
              </Link>
            </div>
          </div>

          <p className="team-description">{selectedTeam.description}</p>
        </div>

        {/* Team Statistics Grid */}
        <div className="team-stats-grid">
          <StatCard
            label="WORLD CHAMPIONSHIPS"
            value={selectedTeam.championships}
            subtext="Constructors' Titles"
            accentColor={selectedTeam.color}
            isPrimary
          />
          <StatCard
            label="POLE POSITIONS"
            value={selectedTeam.polePositions}
            subtext="Qualifying Benchmark"
            accentColor="#00D2FF"
          />
          <StatCard
            label="FASTEST LAPS"
            value={selectedTeam.fastestLaps}
            subtext="Race Pace Benchmark"
            accentColor="#FF1E1E"
          />
          <StatCard
            label="BASE OF OPERATIONS"
            value={selectedTeam.base}
            subtext="Technical HQ"
            accentColor="#C0C0C0"
          />
        </div>

        {/* Technical Specifications */}
        <section className="team-section telemetry-panel">
          <div className="section-title-bar">
            <span className="section-dot" style={{ backgroundColor: selectedTeam.color }}></span>
            <h2 className="headline">TECHNICAL SPECIFICATIONS // {selectedTeam.carName}</h2>
          </div>

          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label telemetry">POWER UNIT</span>
              <span className="spec-value">{selectedTeam.specs.powerUnit}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label telemetry">CHASSIS CONSTRUCTION</span>
              <span className="spec-value">{selectedTeam.specs.chassis}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label telemetry">MINIMUM WEIGHT</span>
              <span className="spec-value headline">{selectedTeam.specs.weight}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label telemetry">DOWNFORCE PROFILE</span>
              <span className="spec-value headline">{selectedTeam.specs.downforce}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label telemetry">ESTIMATED TOP SPEED</span>
              <span className="spec-value headline" style={{ color: '#00D2FF' }}>
                {selectedTeam.specs.topSpeed}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-label telemetry">TEAM PRINCIPAL</span>
              <span className="spec-value">{selectedTeam.principal}</span>
            </div>
          </div>
        </section>

        {/* Championship Winning Seasons */}
        {seasonsWon.length > 0 && (
          <section className="team-section telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot" style={{ backgroundColor: '#FFD700' }}></span>
              <h2 className="headline">CHAMPIONSHIP WINNING SEASONS // {seasonsWon.length} TITLES</h2>
            </div>

            <div className="seasons-won-grid">
              {seasonsWon.map((s) => (
                <Link key={s.year} to={`/seasons/${s.year}`} className="season-won-card">
                  <span className="season-won-year headline">{s.year}</span>
                  <span className="season-won-driver telemetry">{s.championDriver}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Current Drivers for Team */}
        {teamDrivers.length > 0 && (
          <section className="team-section telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot"></span>
              <h2 className="headline">DRIVER LINEUP // ACTIVE SQUAD</h2>
            </div>

            <div className="team-drivers-grid">
              {teamDrivers.map((driver) => (
                <Link 
                  key={driver.id} 
                  to={`/drivers/${driver.id}`} 
                  className="team-driver-card"
                  style={{ '--driver-accent': selectedTeam.color } as React.CSSProperties}
                >
                  <div className="driver-card-number headline">#{driver.number}</div>
                  <div className="driver-card-info">
                    <span className="driver-card-name headline">{driver.name}</span>
                    <span className="driver-card-meta telemetry">
                      {driver.country} // {driver.wins} WINS // {driver.podiums} PODIUMS
                    </span>
                  </div>
                  <span className="driver-card-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

