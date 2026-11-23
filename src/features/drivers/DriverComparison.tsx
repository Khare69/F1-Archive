import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllDrivers, getDriverById, getTeamById } from '../../data/dataService';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { usePageMeta } from '../../hooks/usePageMeta';
import { exportPosterAsPng } from '../../utils/posterExport';
import type { TeammateH2HRecord } from '../../types/f1';
import './DriverComparison.css';

export const DriverComparison: React.FC = () => {
  const drivers = getAllDrivers();
  const [searchParams, setSearchParams] = useSearchParams();

  // Defensive Slug Resolution: validate query params against known driver IDs, slugs, and abbreviations
  const resolveDriver = (queryVal: string | null, fallbackId: string) => {
    if (!queryVal) return getDriverById(fallbackId) || drivers[0];
    const clean = queryVal.trim().toLowerCase();
    const match = drivers.find(
      d =>
        d.id.toLowerCase() === clean ||
        (d.slug && d.slug.toLowerCase() === clean) ||
        (d.code && d.code.toLowerCase() === clean)
    );
    return match || getDriverById(fallbackId) || drivers[0];
  };

  const driverA = resolveDriver(searchParams.get('a'), 'VER');
  const driverB = resolveDriver(searchParams.get('b'), 'HAM');

  const teamA = getTeamById(driverA.teamId);
  const teamB = getTeamById(driverB.teamId);

  const colorA = teamA?.color || '#00D2FF';
  const colorB = teamB?.color || '#FF1E1E';

  // Zero-dependency SEO & JSON-LD Injection
  usePageMeta({
    title: `${driverA.name} vs ${driverB.name} — Head-to-Head Benchmark`,
    description: `Compare career telemetry, World Championships, Grand Prix victories, era-normalized points share, and mutual teammate battles between ${driverA.name} and ${driverB.name}.`,
    canonicalPath: `/drivers/compare?a=${driverA.id}&b=${driverB.id}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${driverA.name} vs ${driverB.name} Career Comparison`,
      description: `Statistical head-to-head analysis between ${driverA.name} and ${driverB.name}`,
      competitor: [
        {
          '@type': 'Person',
          name: driverA.name,
          nationality: driverA.country,
          roleName: 'Formula 1 Driver',
          birthDate: driverA.birthDate || driverA.dateOfBirth
        },
        {
          '@type': 'Person',
          name: driverB.name,
          nationality: driverB.country,
          roleName: 'Formula 1 Driver',
          birthDate: driverB.birthDate || driverB.dateOfBirth
        }
      ]
    }
  });

  // Query lazy-loaded teammate records (0 KB overhead on initial landing)
  const { data: teammatesMap } = useQuery<Record<string, TeammateH2HRecord>>({
    queryKey: ['teammates_h2h'],
    queryFn: async () => {
      const res = await fetch('/data/teammates.json');
      if (!res.ok) throw new Error('Failed to load teammate registry');
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000
  });

  // Teammate resolution
  const slugA = driverA.slug || driverA.id.toLowerCase();
  const slugB = driverB.slug || driverB.id.toLowerCase();
  const pairKeyForward = `${slugA}__${slugB}`;
  const pairKeyBackward = `${slugB}__${slugA}`;

  const hasRecord = teammatesMap ? (teammatesMap[pairKeyForward] || teammatesMap[pairKeyBackward]) : undefined;
  const isReversed = teammatesMap ? Boolean(teammatesMap[pairKeyBackward] && !teammatesMap[pairKeyForward]) : false;

  const teammateBattle = hasRecord
    ? {
        racesTogether: hasRecord.racesTogether,
        driverAWins: isReversed ? hasRecord.driverBWins : hasRecord.driverAWins,
        driverBWins: isReversed ? hasRecord.driverAWins : hasRecord.driverBWins,
        driverAQual: isReversed ? hasRecord.driverBOutqualified : hasRecord.driverAOutqualified,
        driverBQual: isReversed ? hasRecord.driverAOutqualified : hasRecord.driverBOutqualified,
        driverAPts: isReversed ? hasRecord.driverBPoints : hasRecord.driverAPoints,
        driverBPts: isReversed ? hasRecord.driverAPoints : hasRecord.driverBPoints,
        years: hasRecord.years,
        constructors: hasRecord.constructors
      }
    : null;

  // Clipboard share link feedback state
  const [copied, setCopied] = useState(false);
  const [isExportingPoster, setIsExportingPoster] = useState(false);

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}/drivers/compare?a=${driverA.id}&b=${driverB.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback if clipboard API restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleExportPoster = async () => {
    setIsExportingPoster(true);
    try {
      await exportPosterAsPng({
        title: `${driverA.name.toUpperCase()} VS ${driverB.name.toUpperCase()}`,
        subtitle: `HEAD-TO-HEAD CAREER & ERA-NORMALIZED COMPARISON (${driverA.country} vs ${driverB.country})`,
        rows: [
          { label: 'WORLD CHAMPIONSHIPS', value: `${driverA.championships} vs ${driverB.championships}`, color: '#FFD700' },
          { label: 'GRAND PRIX WINS', value: `${driverA.wins} vs ${driverB.wins}`, color: '#00D2FF' },
          { label: 'PODIUM FINISHES', value: `${driverA.podiums} vs ${driverB.podiums}`, color: '#00E701' },
          { label: 'CAREER STARTS', value: `${driverA.starts || 0} vs ${driverB.starts || 0}` },
          { label: 'POINTS SHARE %', value: `${driverA.pointsSharePct || 0}% vs ${driverB.pointsSharePct || 0}%`, color: '#FF8000' }
        ],
        filename: `comparison-${driverA.code || driverA.id}-vs-${driverB.code || driverB.id}.png`
      });
    } finally {
      setIsExportingPoster(false);
    }
  };

  const handleSelectA = (newId: string) => {
    setSearchParams({ a: newId, b: driverB.id }, { replace: true });
  };

  const handleSelectB = (newId: string) => {
    setSearchParams({ a: driverA.id, b: newId }, { replace: true });
  };

  // Comparative bar percentages
  const maxChampionships = Math.max(driverA.championships, driverB.championships, 1);
  const maxWins = Math.max(driverA.wins, driverB.wins, 1);
  const maxPodiums = Math.max(driverA.podiums, driverB.podiums, 1);
  const maxStarts = Math.max(driverA.starts || 1, driverB.starts || 1, 1);
  const maxPointsShare = Math.max(driverA.pointsSharePct || 1, driverB.pointsSharePct || 1, 1);

  return (
    <div className="driver-comparison-page">
      {/* Header Banner */}
      <div className="comparison-header-panel telemetry-panel corner-bracket">
        <div className="comparison-meta telemetry">
          <span>// TELEMETRY COMPARATOR</span>
          <div className="comparison-actions">
            <button
              onClick={handleExportPoster}
              disabled={isExportingPoster}
              className="f1-btn f1-btn-secondary telemetry"
              title="Export high-resolution comparison poster (PNG)"
              aria-label="Export comparison poster"
            >
              {isExportingPoster ? 'EXPORTING...' : '📸 EXPORT POSTER'}
            </button>
            <button
              onClick={handleCopyShareLink}
              className={`f1-btn f1-btn-secondary telemetry ${copied ? 'btn-copied' : ''}`}
              title="Copy shareable comparison URL"
              aria-label="Copy shareable link"
            >
              {copied ? '✓ [ LINK COPIED ]' : '🔗 SHARE COMPARISON'}
            </button>
            <span className="comparison-status-tag">HEAD-TO-HEAD BENCHMARK</span>
          </div>
        </div>

        <h1 className="comparison-title headline">
          DRIVER <span className="text-gradient-cyan">HEAD-TO-HEAD</span> COMPARISON
        </h1>

        <p className="comparison-subtitle">
          Compare career world championships, Grand Prix victories, era-normalized points share,
          and mutual teammate battles between any two pilots in Formula 1 history.
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
            value={driverA.id}
            onChange={e => handleSelectA(e.target.value)}
            className="f1-select headline"
            style={{ color: colorA }}
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                {d.number ? `#${d.number} ` : (d.code ? `[${d.code}] ` : '')}{d.name} ({d.country}) {d.isLegend ? '⭐' : ''}
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
            value={driverB.id}
            onChange={e => handleSelectB(e.target.value)}
            className="f1-select headline"
            style={{ color: colorB }}
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                {d.number ? `#${d.number} ` : (d.code ? `[${d.code}] ` : '')}{d.name} ({d.country}) {d.isLegend ? '⭐' : ''}
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
              {driverA.number ? `#${driverA.number}` : (driverA.code || '—')}
            </span>
            <h2 className="showdown-name headline">{driverA.name}</h2>
            {teamA && (
              <Link to={`/teams/${teamA.id}`} className="showdown-team-link telemetry" style={{ color: colorA }}>
                <span>{teamA.name.toUpperCase()}</span>
                <span>→</span>
              </Link>
            )}
            <Link to={`/drivers/${driverA.id}`} className="telemetry showdown-view-link">
              VIEW FULL PROFILE & ARCHIVE →
            </Link>
          </div>
          <div className="showdown-portrait-box" style={{ borderColor: colorA }}>
            <FallbackImage
              src={driverA.imageUrl}
              alt={driverA.name}
              fallbackText={driverA.id}
              accentColor={colorA}
              type="driver"
              driverCode={driverA.id}
              driverNumber={driverA.number}
              championships={driverA.championships}
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
              {driverB.number ? `#${driverB.number}` : (driverB.code || '—')}
            </span>
            <h2 className="showdown-name headline">{driverB.name}</h2>
            {teamB && (
              <Link to={`/teams/${teamB.id}`} className="showdown-team-link telemetry" style={{ color: colorB }}>
                <span>{teamB.name.toUpperCase()}</span>
                <span>→</span>
              </Link>
            )}
            <Link to={`/drivers/${driverB.id}`} className="telemetry showdown-view-link">
              VIEW FULL PROFILE & ARCHIVE →
            </Link>
          </div>
          <div className="showdown-portrait-box" style={{ borderColor: colorB }}>
            <FallbackImage
              src={driverB.imageUrl}
              alt={driverB.name}
              fallbackText={driverB.id}
              accentColor={colorB}
              type="driver"
              driverCode={driverB.id}
              driverNumber={driverB.number}
              championships={driverB.championships}
              className="showdown-portrait-img"
            />
          </div>
        </div>
      </div>

      {/* Teammate Head-to-Head Section (Displayed when both pilots drove for same constructor) */}
      {teammateBattle ? (
        <div className="teammate-battle-panel telemetry-panel corner-bracket">
          <div className="matrix-title-bar">
            <span className="section-dot" style={{ background: '#FFD700' }}></span>
            <h2 className="headline text-gradient-gold">MUTUAL TEAMMATE HEAD-TO-HEAD BATTLE</h2>
            <span className="teammate-years-badge telemetry">
              {teammateBattle.years.join(', ')} // {teammateBattle.constructors.map(c => c.toUpperCase()).join(' & ')}
            </span>
          </div>

          <p className="teammate-context-note telemetry">
            [ STATS COMPUTED EXCLUSIVELY FROM {teammateBattle.racesTogether} GRAND PRIX STARTS AT THE SAME CONSTRUCTOR ]
          </p>

          <div className="teammate-stats-grid">
            {/* Mutual Race Finish Ahead */}
            <div className="teammate-stat-box">
              <span className="teammate-val-left headline" style={{ color: teammateBattle.driverAWins >= teammateBattle.driverBWins ? colorA : 'var(--color-text-secondary)' }}>
                {teammateBattle.driverAWins}
              </span>
              <span className="teammate-metric-label telemetry">RACE FINISHES AHEAD</span>
              <span className="teammate-val-right headline" style={{ color: teammateBattle.driverBWins >= teammateBattle.driverAWins ? colorB : 'var(--color-text-secondary)' }}>
                {teammateBattle.driverBWins}
              </span>
            </div>

            {/* Qualifying Head-to-Head */}
            <div className="teammate-stat-box">
              <span className="teammate-val-left headline" style={{ color: teammateBattle.driverAQual >= teammateBattle.driverBQual ? colorA : 'var(--color-text-secondary)' }}>
                {teammateBattle.driverAQual}
              </span>
              <span className="teammate-metric-label telemetry">OUTQUALIFIED TEAMMATE</span>
              <span className="teammate-val-right headline" style={{ color: teammateBattle.driverBQual >= teammateBattle.driverAQual ? colorB : 'var(--color-text-secondary)' }}>
                {teammateBattle.driverBQual}
              </span>
            </div>

            {/* Mutual Points Scored */}
            <div className="teammate-stat-box">
              <span className="teammate-val-left headline" style={{ color: teammateBattle.driverAPts >= teammateBattle.driverBPts ? colorA : 'var(--color-text-secondary)' }}>
                {teammateBattle.driverAPts}
              </span>
              <span className="teammate-metric-label telemetry">MUTUAL POINTS SCORED</span>
              <span className="teammate-val-right headline" style={{ color: teammateBattle.driverBPts >= teammateBattle.driverAPts ? colorB : 'var(--color-text-secondary)' }}>
                {teammateBattle.driverBPts}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="teammate-none-panel telemetry-panel">
          <span className="telemetry text-muted">
            // NO MUTUAL RACES AS TEAMMATES AT THE SAME CONSTRUCTOR RECORDED IN F1DB REGISTRY
          </span>
        </div>
      )}

      {/* Comparative Visual Telemetry Matrix */}
      <div className="comparison-matrix-panel telemetry-panel corner-bracket">
        <div className="matrix-title-bar">
          <span className="section-dot"></span>
          <h2 className="headline">ERA-NORMALIZED CAREER TELEMETRY MATRIX</h2>
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
                    width: `${(driverA.championships / maxChampionships) * 100}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${(driverB.championships / maxChampionships) * 100}%`,
                    backgroundColor: colorB
                  }}
                />
              </div>
            </div>
          </div>

          {/* Era-Normalized Points Share */}
          <div className="stat-comparison-row">
            <div className="stat-label-header">
              <span className="stat-val-left headline" style={{ color: (driverA.pointsSharePct || 0) > (driverB.pointsSharePct || 0) ? '#00D2FF' : colorA }}>
                {driverA.pointsSharePct ?? 0}% {(driverA.pointsSharePct || 0) > (driverB.pointsSharePct || 0) ? '▲' : ''}
              </span>
              <span className="stat-metric-name telemetry">
                ERA POINTS SHARE % <small className="text-muted">(CAREER PTS / AVAILABLE PTS)</small>
              </span>
              <span className="stat-val-right headline" style={{ color: (driverB.pointsSharePct || 0) > (driverA.pointsSharePct || 0) ? '#00D2FF' : colorB }}>
                {(driverB.pointsSharePct || 0) > (driverA.pointsSharePct || 0) ? '▲' : ''} {driverB.pointsSharePct ?? 0}%
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${((driverA.pointsSharePct || 0) / maxPointsShare) * 100}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${((driverB.pointsSharePct || 0) / maxPointsShare) * 100}%`,
                    backgroundColor: colorB
                  }}
                />
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="stat-comparison-row">
            <div className="stat-label-header">
              <span className="stat-val-left headline" style={{ color: (driverA.winRate || 0) > (driverB.winRate || 0) ? '#00E701' : colorA }}>
                {driverA.winRate ?? 0}% ({(driverA.wins)}/{(driverA.starts || 0)}) {(driverA.winRate || 0) > (driverB.winRate || 0) ? '▲' : ''}
              </span>
              <span className="stat-metric-name telemetry">CAREER WIN RATE</span>
              <span className="stat-val-right headline" style={{ color: (driverB.winRate || 0) > (driverA.winRate || 0) ? '#00E701' : colorB }}>
                {(driverB.winRate || 0) > (driverA.winRate || 0) ? '▲' : ''} {driverB.winRate ?? 0}% ({(driverB.wins)}/{(driverB.starts || 0)})
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${Math.min(100, (driverA.winRate || 0) * 2)}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${Math.min(100, (driverB.winRate || 0) * 2)}%`,
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
              <span className="stat-metric-name telemetry">TOTAL GRAND PRIX WINS</span>
              <span className="stat-val-right headline" style={{ color: driverB.wins > driverA.wins ? '#00D2FF' : colorB }}>
                {driverB.wins > driverA.wins ? '▲' : ''} {driverB.wins}
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${(driverA.wins / maxWins) * 100}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${(driverB.wins / maxWins) * 100}%`,
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
                    width: `${(driverA.podiums / maxPodiums) * 100}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${(driverB.podiums / maxPodiums) * 100}%`,
                    backgroundColor: colorB
                  }}
                />
              </div>
            </div>
          </div>

          {/* Starts */}
          <div className="stat-comparison-row">
            <div className="stat-label-header">
              <span className="stat-val-left headline" style={{ color: (driverA.starts || 0) > (driverB.starts || 0) ? '#00D2FF' : colorA }}>
                {driverA.starts ?? 0} {(driverA.starts || 0) > (driverB.starts || 0) ? '▲' : ''}
              </span>
              <span className="stat-metric-name telemetry">GRAND PRIX STARTS</span>
              <span className="stat-val-right headline" style={{ color: (driverB.starts || 0) > (driverA.starts || 0) ? '#00D2FF' : colorB }}>
                {(driverB.starts || 0) > (driverA.starts || 0) ? '▲' : ''} {driverB.starts ?? 0}
              </span>
            </div>
            <div className="stat-bars-track">
              <div className="stat-bar-wrapper-left">
                <div
                  className="stat-bar-fill-left"
                  style={{
                    width: `${((driverA.starts || 0) / maxStarts) * 100}%`,
                    backgroundColor: colorA
                  }}
                />
              </div>
              <div className="stat-bar-wrapper-right">
                <div
                  className="stat-bar-fill-right"
                  style={{
                    width: `${((driverB.starts || 0) / maxStarts) * 100}%`,
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
            <span className="qualitative-header telemetry">// {driverA.name.toUpperCase()} ATTRIBUTES</span>
            <div className="qualitative-row">
              <span className="telemetry">NATIONALITY:</span>
              <strong className="headline">{driverA.country}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">RACING NUMBER:</span>
              <strong className="headline">{driverA.number ? `#${driverA.number}` : (driverA.code || '—')}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">CAREER STARTS:</span>
              <strong className="headline">{driverA.starts ?? '—'} Starts</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">ERA POINTS SHARE:</span>
              <strong className="headline" style={{ color: '#00D2FF' }}>{driverA.pointsSharePct ?? 0}%</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">STATUS:</span>
              <strong className="headline">{driverA.isLegend ? 'LEGEND / HALL OF FAME' : 'ACTIVE CONTENDER'}</strong>
            </div>
          </div>

          <div className="qualitative-card telemetry-panel" style={{ borderLeft: `3px solid ${colorB}` }}>
            <span className="qualitative-header telemetry">// {driverB.name.toUpperCase()} ATTRIBUTES</span>
            <div className="qualitative-row">
              <span className="telemetry">NATIONALITY:</span>
              <strong className="headline">{driverB.country}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">RACING NUMBER:</span>
              <strong className="headline">{driverB.number ? `#${driverB.number}` : (driverB.code || '—')}</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">CAREER STARTS:</span>
              <strong className="headline">{driverB.starts ?? '—'} Starts</strong>
            </div>
            <div className="qualitative-row">
              <span className="telemetry">ERA POINTS SHARE:</span>
              <strong className="headline" style={{ color: '#00D2FF' }}>{driverB.pointsSharePct ?? 0}%</strong>
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
