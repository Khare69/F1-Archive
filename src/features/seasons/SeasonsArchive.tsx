import React, { useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAllSeasons, getSeasonByYear, getTeamById, getF1DBMetadata } from '../../data/dataService';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './SeasonsArchive.css';

const DECADES = [
  { label: '2020s', startYear: 2020, targetYear: 2026 },
  { label: '2010s', startYear: 2010, targetYear: 2019 },
  { label: '2000s', startYear: 2000, targetYear: 2009 },
  { label: '1990s', startYear: 1990, targetYear: 1999 },
  { label: '1980s', startYear: 1980, targetYear: 1989 },
  { label: '1970s', startYear: 1970, targetYear: 1979 },
  { label: '1960s', startYear: 1960, targetYear: 1969 },
  { label: '1950s', startYear: 1950, targetYear: 1959 },
];

export const SeasonsArchive: React.FC = () => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const seasons = getAllSeasons();
  const meta = getF1DBMetadata();
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  // Validate year parameter or default to latest season
  const selectedSeason = getSeasonByYear(yearParam) || seasons[0];
  useDocumentTitle(selectedSeason ? `${selectedSeason.year} Season` : 'Seasons Vault');

  const chronologicalSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => a.year - b.year);
  }, [seasons]);

  const currentDecade = useMemo(() => {
    const yr = selectedSeason.year;
    return `${Math.floor(yr / 10) * 10}s`;
  }, [selectedSeason.year]);

  // Scroll active timeline node into view
  useEffect(() => {
    if (timelineTrackRef.current) {
      const activeNode = timelineTrackRef.current.querySelector('.timeline-node.active');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedSeason.year]);

  const handleSelectSeason = (year: number) => {
    navigate(`/seasons/${year}`);
  };

  const handleJumpDecade = (targetYear: number) => {
    handleSelectSeason(targetYear);
  };

  return (
    <div className="archive-layout seasons-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Seasons list">
        <div className="sidebar-header telemetry">
          <span>// SELECT CAMPAIGN</span>
          <span className="sidebar-count">{seasons.length} SEASONS</span>
        </div>
        {seasons.map((season) => (
          <button
            key={season.year}
            type="button"
            className={`list-button ${selectedSeason.year === season.year ? 'active' : ''}`}
            onClick={() => handleSelectSeason(season.year)}
          >
            <span className="season-year-text">{season.year}</span>
            <span className="season-champ-tag telemetry">
              {season.championDriver.split(' ').pop()}
            </span>
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

          {/* Decade Jump Selector */}
          <div className="decade-jump-bar telemetry">
            <span className="decade-jump-label">// JUMP ERA:</span>
            {DECADES.map(d => (
              <button
                key={d.label}
                type="button"
                className={`decade-pill ${currentDecade === d.label ? 'active' : ''}`}
                onClick={() => handleJumpDecade(d.targetYear)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="timeline-scroll-wrapper">
            <div className="timeline-track" ref={timelineTrackRef}>
              {chronologicalSeasons.map((s) => {
                const team = getTeamById(s.championTeamId || undefined);
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
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="season-status-tag">OFFICIALLY INDEXED</span>
              <span className="f1db-sync-pill">
                <span>●</span> F1DB SYNCED (v{meta.f1dbVersion})
              </span>
            </div>
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
              <div className="champ-label telemetry">CONSTRUCTORS' CHAMPION</div>
              <div className="champ-name headline">{selectedSeason.championTeam}</div>
              {selectedSeason.championTeamId ? (
                <Link to={`/teams/${selectedSeason.championTeamId}`} className="champ-link telemetry">
                  VIEW CONSTRUCTOR PROFILE →
                </Link>
              ) : (
                <span className="champ-link-disabled telemetry">PRE-1958 INAUGURAL ERA</span>
              )}
            </div>
          </div>
        </div>

        {/* Notable Events & Milestones */}
        <div className="season-details-grid">
          <section className="season-detail-panel telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot" style={{ backgroundColor: '#00D2FF' }}></span>
              <h2 className="headline">ERA MILESTONES & DEFINING EVENTS</h2>
            </div>
            <ul className="events-list">
              {selectedSeason.notableEvents.map((event, idx) => (
                <li key={idx} className="event-item">
                  <span className="event-marker telemetry">// 0{idx + 1}</span>
                  <span className="event-text">{event}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="season-detail-panel telemetry-panel">
            <div className="section-title-bar">
              <span className="section-dot" style={{ backgroundColor: '#FF1E1E' }}></span>
              <h2 className="headline">HISTORICAL RECORDS & BENCHMARKS</h2>
            </div>
            <ul className="events-list">
              {selectedSeason.recordsBroken.map((record, idx) => (
                <li key={idx} className="event-item">
                  <span className="event-marker telemetry" style={{ color: '#FF1E1E' }}>// REC</span>
                  <span className="event-text">{record}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Summary Stats Row */}
        <div className="season-stats-row">
          <StatCard
            label="CHAMPION PILOT"
            value={selectedSeason.championDriver.split(' ').pop() || 'TBD'}
            subtext={selectedSeason.championDriver}
            accentColor="#FFD700"
            isPrimary
          />
          <StatCard
            label="CHAMPION CONSTRUCTOR"
            value={selectedSeason.championTeam.split(' ')[0] || 'TBD'}
            subtext={selectedSeason.championTeam}
            accentColor="#00D2FF"
          />
          <StatCard
            label="ROUNDS CONTESTED"
            value={selectedSeason.races}
            subtext="Championship Grands Prix"
            accentColor="#00E701"
          />
          <StatCard
            label="ERA CHRONOLOGY"
            value={`${selectedSeason.year}`}
            subtext={`Season #${selectedSeason.year - 1949} of ${seasons.length}`}
            accentColor="#FFFFFF"
          />
        </div>
      </main>
    </div>
  );
};
