import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAllSeasons, getSeasonByYear, getTeamById } from '../../data/dataService';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './SeasonsArchive.css';

export const SeasonsArchive: React.FC = () => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const seasons = getAllSeasons();

  // Validate year parameter or default to latest season
  const selectedSeason = getSeasonByYear(yearParam) || seasons[0];
  useDocumentTitle(selectedSeason ? `${selectedSeason.year} Season` : 'Seasons Vault');

  const chronologicalSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => a.year - b.year);
  }, [seasons]);

  const handleSelectSeason = (year: number) => {
    navigate(`/seasons/${year}`);
  };

  return (
    <div className="archive-layout seasons-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Seasons list">
        <div className="sidebar-header telemetry">
          <span>// SELECT CAMPAIGN</span>
          <span className="sidebar-count">{seasons.length} ERAS</span>
        </div>
        {seasons.map((season) => (
          <button
            key={season.year}
            type="button"
            className={`list-button ${selectedSeason.year === season.year ? 'active' : ''}`}
            onClick={() => handleSelectSeason(season.year)}
          >
            <span className="season-year-text">{season.year}</span>
            <span className="season-champ-tag telemetry">{season.championDriver.split(' ').pop()}</span>
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="archive-content">
        {/* Interactive Championship Timeline */}
        <section className="championship-timeline-panel telemetry-panel">
          <div className="timeline-header telemetry">
            <span>// CHAMPIONSHIP CHRONOLOGY TIMELINE (1950 - 2026)</span>
            <span>CLICK NODE TO INSPECT ERA</span>
          </div>

          <div className="timeline-scroll-wrapper">
            <div className="timeline-track">
              {chronologicalSeasons.map((s) => {
                const team = getTeamById(s.championTeamId);
                const nodeColor = team?.color || '#00D2FF';
                const isSelected = selectedSeason.year === s.year;

                return (
                  <button
                    key={s.year}
                    type="button"
                    className={`timeline-node ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectSeason(s.year)}
                    style={{ '--node-color': nodeColor } as React.CSSProperties}
                    title={`${s.year}: ${s.championDriver} (${s.championTeam})`}
                  >
                    {isSelected && (
                      <span className="timeline-champ-hover telemetry">
                        {s.championDriver.split(' ').pop()}
                      </span>
                    )}
                    <span
                      className="timeline-dot"
                      style={{
                        backgroundColor: nodeColor,
                        boxShadow: isSelected ? `0 0 16px ${nodeColor}` : undefined
                      }}
                    />
                    <span className="timeline-year-label telemetry">{s.year}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Season Header */}
        <div className="season-hero-panel telemetry-panel corner-bracket">
          <div className="season-header-meta telemetry">
            <span>FIA FORMULA ONE WORLD CHAMPIONSHIP</span>
            <span className="season-status-tag">OFFICIALLY INDEXED</span>
          </div>

          <div className="season-title-row">
            <h1 className="season-year-hero headline">{selectedSeason.year}</h1>
            <div className="season-quick-stats">
              <div className="quick-stat-badge">
                <span className="telemetry">CALENDAR</span>
                <span className="headline">{selectedSeason.races} GRANDS PRIX</span>
              </div>
            </div>
          </div>

          {/* Championship Podium Summary */}
          <div className="champions-grid">
            <div className="champion-card champion-driver">
              <div className="champ-label telemetry">WORLD DRIVERS' CHAMPION</div>
              <div className="champ-name headline">{selectedSeason.championDriver}</div>
              {selectedSeason.championDriverId ? (
                <Link to={`/drivers/${selectedSeason.championDriverId}`} className="champ-link telemetry">
                  VIEW DRIVER PROFILE →
                </Link>
              ) : (
                <span className="champ-link-disabled telemetry">LEGACY RECORD</span>
              )}
            </div>

            <div className="champion-card champion-team">
              <div className="champ-label telemetry">WORLD CONSTRUCTORS' CHAMPION</div>
              <div className="champ-name headline">{selectedSeason.championTeam}</div>
              {selectedSeason.championTeamId ? (
                <Link to={`/teams/${selectedSeason.championTeamId}`} className="champ-link telemetry">
                  INSPECT CONSTRUCTOR →
                </Link>
              ) : (
                <span className="champ-link-disabled telemetry">CONSTRUCTOR RECORD</span>
              )}
            </div>
          </div>
        </div>

        {/* Season Stats Summary */}
        <div className="season-stats-grid">
          <StatCard
            label="CALENDAR LENGTH"
            value={`${selectedSeason.races} Races`}
            subtext="Official Championship Rounds"
            accentColor="#00D2FF"
          />
          <StatCard
            label="CHAMPION DRIVER"
            value={selectedSeason.championDriver}
            subtext="World Title Winner"
            accentColor="#FFD700"
            isPrimary
          />
          <StatCard
            label="CHAMPION CONSTRUCTOR"
            value={selectedSeason.championTeam}
            subtext="Constructors' Cup Holder"
            accentColor="#FF1E1E"
          />
        </div>

        {/* Notable Events */}
        <section className="season-section telemetry-panel">
          <div className="section-title-bar">
            <span className="section-dot"></span>
            <h2 className="headline">DEFINING MOMENTS & NARRATIVE</h2>
          </div>
          <ul className="events-list">
            {selectedSeason.notableEvents.map((event, idx) => (
              <li key={idx} className="event-item">
                <span className="event-bullet telemetry">&gt;</span>
                <span className="event-text">{event}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Records Broken */}
        <section className="season-section telemetry-panel records-panel">
          <div className="section-title-bar">
            <span className="section-dot record-dot"></span>
            <h2 className="headline text-gradient-cyan">HISTORICAL BENCHMARKS & RECORDS BROKEN</h2>
          </div>
          <ul className="records-list">
            {selectedSeason.recordsBroken.map((record, idx) => (
              <li key={idx} className="record-item">
                <span className="record-icon">⚡</span>
                <span className="record-text">{record}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};
