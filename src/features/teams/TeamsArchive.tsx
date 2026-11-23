import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAllTeams,
  getActive2026Teams,
  getHistoricTeams,
  getTeamById,
  getTeamDrivers,
  getSeasonsWonByTeam,
  getF1DBMetadata
} from '../../data/dataService';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './TeamsArchive.css';

type TeamFilterCategory = 'active' | 'historic' | 'all';

export const TeamsArchive: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const allTeams = getAllTeams();
  const meta = getF1DBMetadata();

  const [filterCategory, setFilterCategory] = useState<TeamFilterCategory>('active');

  // Validate teamId or default to the first team
  const selectedTeam = getTeamById(teamId) || allTeams[0];
  useDocumentTitle(selectedTeam ? selectedTeam.name : 'Constructors');
  const teamDrivers = getTeamDrivers(selectedTeam.id);
  const seasonsWon = getSeasonsWonByTeam(selectedTeam.id);

  const visibleTeams = useMemo(() => {
    if (filterCategory === 'active') return getActive2026Teams();
    if (filterCategory === 'historic') return getHistoricTeams();
    return allTeams;
  }, [filterCategory, allTeams]);

  const handleSelectTeam = (id: string) => {
    navigate(`/teams/${id}`);
  };

  return (
    <div className="archive-layout teams-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Constructors list">
        <div className="sidebar-header telemetry">
          <span>// CONSTRUCTORS</span>
          <span className="sidebar-count">{visibleTeams.length} TEAMS</span>
        </div>

        {/* Filter Tabs: Active 2026 / Historic / All */}
        <div className="team-filter-tabs">
          <button
            type="button"
            className={`team-tab-pill telemetry ${filterCategory === 'active' ? 'active' : ''}`}
            onClick={() => setFilterCategory('active')}
          >
            ACTIVE 2026 (11)
          </button>
          <button
            type="button"
            className={`team-tab-pill telemetry ${filterCategory === 'historic' ? 'active' : ''}`}
            onClick={() => setFilterCategory('historic')}
          >
            HISTORIC
          </button>
          <button
            type="button"
            className={`team-tab-pill telemetry ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            ALL
          </button>
        </div>

        {visibleTeams.map((team) => (
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
            {team.isActive2026 ? (
              <span className="active-2026-badge telemetry">2026</span>
            ) : team.isLegendary ? (
              <span className="legend-pill telemetry">LEGEND</span>
            ) : null}
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
                teamId={selectedTeam.id}
                accentColor={selectedTeam.color}
                className="team-brand-logo"
              />
            </div>

            <div className="team-hero-titles">
              <div className="team-meta-row telemetry">
                <span>CONSTRUCTOR ID: #{selectedTeam.id.toUpperCase()}</span>
                <span>ENTRY YEAR: {selectedTeam.firstEntry}</span>
                {selectedTeam.isActive2026 && <span className="active-2026-badge">ACTIVE 2026 CONSTRUCTOR</span>}
                <span className="f1db-sync-pill">
                  <span>●</span> F1DB SYNCED (v{meta.f1dbVersion})
                </span>
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
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span>INSPECT 3D CHASSIS</span>
              </Link>
            </div>
          </div>

          <p className="team-description">{selectedTeam.description}</p>
        </div>

        {/* Team Metric Cards */}
        <div className="team-stats-grid">
          <StatCard
            label="CONSTRUCTORS TITLES"
            value={selectedTeam.championships}
            subtext="World Championships"
            accentColor="#FFD700"
            isPrimary={selectedTeam.championships > 0}
          />
          <StatCard
            label="POLE POSITIONS"
            value={selectedTeam.polePositions}
            subtext="Qualifying Pole Positions"
            accentColor={selectedTeam.color}
          />
          <StatCard
            label="FASTEST LAPS"
            value={selectedTeam.fastestLaps}
            subtext="Official Race Fastest Laps"
            accentColor="#00D2FF"
          />
          <StatCard
            label="OPERATIONAL BASE"
            value={selectedTeam.base.split(',')[0]}
            subtext={selectedTeam.base}
            accentColor="#C0C0C0"
          />
        </div>

        {/* Current Active Pilots */}
        {teamDrivers.length > 0 && (
          <section className="team-section telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot" style={{ backgroundColor: selectedTeam.color }}></span>
              <h2 className="headline">// OFFICIAL PILOTS ROSTER</h2>
            </div>

            <div className="team-drivers-grid">
              {teamDrivers.map((driver) => (
                <Link
                  key={driver.id}
                  to={`/drivers/${driver.id}`}
                  className="team-driver-card"
                  style={{ borderLeftColor: selectedTeam.color }}
                >
                  <div className="team-driver-num headline" style={{ color: selectedTeam.color }}>
                    {driver.number ? `#${driver.number}` : (driver.code || '—')}
                  </div>
                  <div className="team-driver-info">
                    <div className="team-driver-name headline">{driver.name}</div>
                    <div className="team-driver-meta telemetry">
                      <span>{driver.country}</span>
                      <span>•</span>
                      <span>{driver.wins} WINS</span>
                      {driver.championships > 0 && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#FFD700' }}>{driver.championships}x WDC</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="team-driver-arrow">→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Constructors Championship Titles */}
        {seasonsWon.length > 0 && (
          <section className="team-section telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot" style={{ backgroundColor: '#FFD700' }}></span>
              <h2 className="headline">CONSTRUCTORS CHAMPIONSHIP HONOURS // {seasonsWon.length} TITLES</h2>
            </div>

            <div className="titles-grid">
              {seasonsWon.map((s) => (
                <Link key={s.year} to={`/seasons/${s.year}`} className="title-card">
                  <span className="title-year headline">{s.year}</span>
                  <span className="title-team telemetry">Champion: {s.championDriver}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Technical Specifications */}
        <section className="team-section telemetry-panel">
          <div className="section-title-bar">
            <span className="section-dot" style={{ backgroundColor: '#00D2FF' }}></span>
            <h2 className="headline">TECHNICAL SPECIFICATIONS & ARCHITECTURE</h2>
          </div>

          <div className="specs-grid">
            <div className="spec-card">
              <div className="spec-label telemetry">POWER UNIT ARCHITECTURE</div>
              <div className="spec-value headline">{selectedTeam.specs.powerUnit}</div>
            </div>
            <div className="spec-card">
              <div className="spec-label telemetry">CHASSIS CONSTRUCTION</div>
              <div className="spec-value headline">{selectedTeam.specs.chassis}</div>
            </div>
            <div className="spec-card">
              <div className="spec-label telemetry">HOMOLOGATED MINIMUM WEIGHT</div>
              <div className="spec-value headline">{selectedTeam.specs.weight}</div>
            </div>
            <div className="spec-card">
              <div className="spec-label telemetry">AERODYNAMIC PROFILE</div>
              <div className="spec-value headline">{selectedTeam.specs.downforce} Downforce</div>
            </div>
            <div className="spec-card">
              <div className="spec-label telemetry">BENCHMARK TOP SPEED</div>
              <div className="spec-value headline">{selectedTeam.specs.topSpeed}</div>
            </div>
            <div className="spec-card">
              <div className="spec-label telemetry">TEAM PRINCIPAL</div>
              <div className="spec-value headline">{selectedTeam.principal}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
