import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllDrivers, getDriverById, getTeamById } from '../../data/dataService';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './DriverComparison.css';

export const DriverComparison: React.FC = () => {
  useDocumentTitle('Head-to-Head Driver Comparison');
  const drivers = getAllDrivers();

  const [driverAId, setDriverAId] = useState<string>(() => {
    return drivers[0]?.id || 'VER';
  });

  const [driverBId, setDriverBId] = useState<string>(() => {
    return drivers[2]?.id || 'HAM';
  });

  const driverA = getDriverById(driverAId) || drivers[0];
  const driverB = getDriverById(driverBId) || drivers[1] || drivers[0];

  const teamA = getTeamById(driverA.teamId);
  const teamB = getTeamById(driverB.teamId);

  const colorA = teamA?.color || '#00D2FF';
  const colorB = teamB?.color || '#FF1E1E';

  // Calculate comparative bar percentages
  const maxChampionships = Math.max(driverA.championships, driverB.championships, 1);
  const maxWins = Math.max(driverA.wins, driverB.wins, 1);
  const maxPodiums = Math.max(driverA.podiums, driverB.podiums, 1);

  const pctChampsA = (driverA.championships / maxChampionships) * 100;
  const pctChampsB = (driverB.championships / maxChampionships) * 100;

  const pctWinsA = (driverA.wins / maxWins) * 100;
  const pctWinsB = (driverB.wins / maxWins) * 100;

  const pctPodiumsA = (driverA.podiums / maxPodiums) * 100;
  const pctPodiumsB = (driverB.podiums / maxPodiums) * 100;

  return (
    <div className="driver-comparison-page">
      {/* Header Banner */}
      <div className="comparison-header-panel telemetry-panel corner-bracket">
        <div className="comparison-meta telemetry">
          <span>// TELEMETRY COMPARATOR</span>
          <span className="comparison-status-tag">HEAD-TO-HEAD BENCHMARK</span>
        </div>

        <h1 className="comparison-title headline">
          DRIVER <span className="text-gradient-cyan">HEAD-TO-HEAD</span> COMPARISON
        </h1>

        <p className="comparison-subtitle">
          Select any two drivers from Formula 1 history to compare career world championships,
          Grand Prix victories, podium finishes, and technical classifications side by side.
        </p>
      </div>

      {/* Selectors Row */}
      <div className="comparison-selectors-grid">
        <div className="selector-panel telemetry-panel">
          <label className="selector-label telemetry" htmlFor="driver-a-select">
            PRIMARY PILOT:
          </label>
          <select
            id="driver-a-select"
            value={driverAId}
            onChange={e => setDriverAId(e.target.value)}
            className="f1-select headline"
            style={{ color: colorA }}
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                #{d.number} {d.name} ({d.country}) {d.isLegend ? '⭐' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-badge-container">
          <div className="vs-badge headline">VS</div>
        </div>

        <div className="selector-panel telemetry-panel">
          <label className="selector-label telemetry" htmlFor="driver-b-select">
            OPPONENT PILOT:
          </label>
          <select
            id="driver-b-select"
            value={driverBId}
            onChange={e => setDriverBId(e.target.value)}
            className="f1-select headline"
            style={{ color: colorB }}
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                #{d.number} {d.name} ({d.country}) {d.isLegend ? '⭐' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drivers Showdown Profiles */}
      <div className="drivers-showdown-header">
        {/* Driver A Card */}
        <div
          className="driver-showdown-card telemetry-panel"
          style={{ '--driver-color': colorA } as React.CSSProperties}
        >
          <div className="showdown-info-left">
            <span className="showdown-num headline" style={{ color: colorA }}>
              #{driverA.number}
            </span>
            <h2 className="showdown-name headline">{driverA.name}</h2>
            {teamA && (
              <Link to={`/teams/${teamA.id}`} className="showdown-team-link telemetry" style={{ color: colorA }}>
                <span>{teamA.name.toUpperCase()}</span>
                <span>→</span>
              </Link>
            )}
            <Link to={`/drivers/${driverA.id}`} className="telemetry" style={{ color: 'var(--color-accent-primary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
              VIEW PROFILE & RESULTS →
            </Link>
          </div>
          <div className="showdown-portrait-box" style={{ borderColor: colorA }}>
            <FallbackImage
              src={driverA.imageUrl}
              alt={driverA.name}
              fallbackText={driverA.id}
              accentColor={colorA}
              type="driver"
              className="showdown-portrait-img"
            />
          </div>
        </div>

        {/* Driver B Card */}
        <div
          className="driver-showdown-card telemetry-panel"
          style={{ '--driver-color': colorB } as React.CSSProperties}
        >
          <div className="showdown-info-left">
            <span className="showdown-num headline" style={{ color: colorB }}>
              #{driverB.number}
            </span>
            <h2 className="showdown-name headline">{driverB.name}</h2>
            {teamB && (
              <Link to={`/teams/${teamB.id}`} className="showdown-team-link telemetry" style={{ color: colorB }}>
                <span>{teamB.name.toUpperCase()}</span>
                <span>→</span>
              </Link>
            )}
            <Link to={`/drivers/${driverB.id}`} className="telemetry" style={{ color: 'var(--color-accent-primary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
              VIEW PROFILE & RESULTS →
            </Link>
          </div>
          <div className="showdown-portrait-box" style={{ borderColor: colorB }}>
            <FallbackImage
              src={driverB.imageUrl}
              alt={driverB.name}
              fallbackText={driverB.id}
              accentColor={colorB}
              type="driver"
              className="showdown-portrait-img"
            />
          </div>
        </div>
      </div>

      {/* Comparative Visual Telemetry Matrix */}
      <div className="comparison-matrix-panel telemetry-panel corner-bracket">
        <div className="matrix-title-bar">
          <span className="section-dot"></span>
          <h2 className="headline">STATISTICAL COMPARISON MATRIX</h2>
        </div>

        <div className="matrix-rows">
          {/* World Titles */}
          <div className="stat-comparison-row">
            <div className="stat-label-header">
              <span className="stat-val-left headline" style={{ color: driverA.championships > driverB.championships ? '#FFD700' : colorA }}>
                {driverA.championships} {driverA.championships > driverB.championships ? '▲' : ''}
              </span>
              <span className="stat-metric-name telemetry">WORLD CHAMPIONSHIPS</span>
              <span className="stat-val-right headline" style={{ color: driverB.championships > driverA.championships ? '#FFD700' : colorB }}>
                {driverB.championships > driverA.championships ? '▲' : ''} {driverB.championships}
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${pctChampsA}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${pctChampsB}%`,
                    backgroundColor: colorB
                  }}
                />
              </div>
            </div>
          </div>

          {/* Race Wins */}
          <div className="stat-comparison-row">
            <div className="stat-label-header">
              <span className="stat-val-left headline" style={{ color: driverA.wins > driverB.wins ? '#00D2FF' : colorA }}>
                {driverA.wins} {driverA.wins > driverB.wins ? '▲' : ''}
              </span>
              <span className="stat-metric-name telemetry">CAREER RACE WINS</span>
              <span className="stat-val-right headline" style={{ color: driverB.wins > driverA.wins ? '#00D2FF' : colorB }}>
                {driverB.wins > driverA.wins ? '▲' : ''} {driverB.wins}
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${pctWinsA}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${pctWinsB}%`,
                    backgroundColor: colorB
                  }}
                />
              </div>
            </div>
          </div>

          {/* Podiums */}
          <div className="stat-comparison-row">
            <div className="stat-label-header">
              <span className="stat-val-left headline" style={{ color: driverA.podiums > driverB.podiums ? '#00E701' : colorA }}>
                {driverA.podiums} {driverA.podiums > driverB.podiums ? '▲' : ''}
              </span>
              <span className="stat-metric-name telemetry">PODIUM FINISHES</span>
              <span className="stat-val-right headline" style={{ color: driverB.podiums > driverA.podiums ? '#00E701' : colorB }}>
                {driverB.podiums > driverA.podiums ? '▲' : ''} {driverB.podiums}
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${pctPodiumsA}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${pctPodiumsB}%`,
                    backgroundColor: colorB
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Qualitative Specs Row */}
        <div className="qualitative-comparison-grid">
          <div className="qualitative-card telemetry-panel" style={{ borderLeft: `3px solid ${colorA}` }}>
            <span className="qualitative-header telemetry">// {driverA.name.toUpperCase()} METRICS</span>
            <div className="qualitative-row">
              <span className="telemetry">NATIONALITY:</span>
              <strong className="headline">{driverA.country}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">RACING NUMBER:</span>
              <strong className="headline">#{driverA.number}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">STATUS:</span>
              <strong className="headline">{driverA.isLegend ? 'LEGEND / HALL OF FAME' : 'ACTIVE CONTENDER'}</strong>
            </div>
          </div>

          <div className="qualitative-card telemetry-panel" style={{ borderLeft: `3px solid ${colorB}` }}>
            <span className="qualitative-header telemetry">// {driverB.name.toUpperCase()} METRICS</span>
            <div className="qualitative-row">
              <span className="telemetry">NATIONALITY:</span>
              <strong className="headline">{driverB.country}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">RACING NUMBER:</span>
              <strong className="headline">#{driverB.number}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">STATUS:</span>
              <strong className="headline">{driverB.isLegend ? 'LEGEND / HALL OF FAME' : 'ACTIVE CONTENDER'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
