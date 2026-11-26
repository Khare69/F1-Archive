import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryStates, parseAsString, parseAsStringLiteral } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { getAllDrivers, getDriverById, getTeamById } from '../../data/dataService';
import { usePageMeta } from '../../hooks/usePageMeta';
import { exportPosterAsPng } from '../../utils/posterExport';
import type { Driver } from '../../types/f1';
import type { RawTeammateH2HRecord } from './comparison/comparisonMetrics';
import { DriverSelectorBar } from './comparison/DriverSelectorBar';
import { ComparisonStatTable } from './comparison/ComparisonStatTable';
import { TeammateH2HPanel } from './comparison/TeammateH2HPanel';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';

export const DriverComparison: React.FC = () => {
  const drivers: Driver[] = getAllDrivers();
  const [searchParams] = useSearchParams();

  // nuqs query state for d1, d2, and mode
  const [params, setParams] = useQueryStates({
    d1: parseAsString.withDefault('VER'),
    d2: parseAsString.withDefault('HAM'),
    mode: parseAsStringLiteral(['raw', 'normalized'] as const).withDefault('raw'),
  });

  const { d1, d2, mode } = params;

  // Defensive Slug Resolution: supports both d1/d2 and legacy a/b query parameters
  const resolveDriver = (queryVal: string | null, fallbackId: string): Driver => {
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

  const driverAId = d1 || searchParams.get('a');
  const driverBId = d2 || searchParams.get('b');

  const driverA = resolveDriver(driverAId, 'VER');
  const driverB = resolveDriver(driverBId, 'HAM');

  const teamA = getTeamById(driverA.teamId);
  const teamB = getTeamById(driverB.teamId);

  const colorA = teamA?.color || '#00D2FF';
  const colorB = teamB?.color || '#FF1E1E';

  // Zero-dependency SEO & JSON-LD Injection
  usePageMeta({
    title: `${driverA.name} vs ${driverB.name} — Head-to-Head Benchmark`,
    description: `Compare career telemetry, World Championships, Grand Prix victories, era-normalized points share, and mutual teammate battles between ${driverA.name} and ${driverB.name}.`,
    canonicalPath: `/drivers/compare?d1=${driverA.id}&d2=${driverB.id}`,
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

  // Query lazy-loaded teammate records
  const { data: teammatesMap } = useQuery<Record<string, RawTeammateH2HRecord>>({
    queryKey: ['teammates_h2h'],
    queryFn: async () => {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
      const res = await fetch(`${origin}/data/teammates.json`);
      if (!res.ok) throw new Error('Failed to load teammate registry');
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000
  });

  const [copied, setCopied] = useState(false);
  const [isExportingPoster, setIsExportingPoster] = useState(false);

  const handleSelectA = (newId: string) => setParams({ d1: newId });
  const handleSelectB = (newId: string) => setParams({ d2: newId });
  const handleSwap = () => {
    const nextA = driverB.code || driverB.id;
    const nextB = driverA.code || driverA.id;
    setParams({ d1: nextA, d2: nextB });
  };
  const handleModeToggle = (newMode: 'raw' | 'normalized') => setParams({ mode: newMode });

  const handleCopyShareLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/drivers/compare?d1=${driverA.code || driverA.id}&d2=${driverB.code || driverB.id}&mode=${mode}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Fallback
    } finally {
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

  return (
    <div className="driver-comparison-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="border border-slate-800 rounded-lg p-6 bg-[#0f172a]/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
          <span className="font-telemetry text-xs text-cyan-400 tracking-wider">// TELEMETRY COMPARATOR</span>
          <div className="flex items-center gap-2">
            <span className="font-telemetry text-xs text-slate-400 border border-slate-700/80 px-2 py-0.5 rounded">
              HEAD-TO-HEAD BENCHMARK
            </span>
            <CopyShareLinkButton />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-headline">
          DRIVER <span className="text-cyan-400">HEAD-TO-HEAD</span> COMPARISON
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Compare career world championships, Grand Prix victories, era-normalized points share,
          and mutual teammate battles between any two pilots in Formula 1 history.
        </p>
      </div>

      {/* Selector & Controls Bar */}
      <DriverSelectorBar
        drivers={drivers}
        driverAId={driverA.id}
        driverBId={driverB.id}
        colorA={colorA}
        colorB={colorB}
        mode={mode}
        onSelectA={handleSelectA}
        onSelectB={handleSelectB}
        onSwap={handleSwap}
        onToggleMode={handleModeToggle}
        onExportPoster={handleExportPoster}
        onCopyShareLink={handleCopyShareLink}
        isExportingPoster={isExportingPoster}
        copied={copied}
      />

      {/* Teammate Head-to-Head Panel (When pilots shared a team) */}
      <TeammateH2HPanel
        teammatesMap={teammatesMap}
        leftSlug={driverA.slug || driverA.id}
        rightSlug={driverB.slug || driverB.id}
        colorA={colorA}
        colorB={colorB}
      />

      {/* Showdown Profile Cards and Metric Telemetry Rows */}
      <ComparisonStatTable
        driverA={driverA}
        driverB={driverB}
        teamA={teamA}
        teamB={teamB}
        colorA={colorA}
        colorB={colorB}
        mode={mode}
      />
    </div>
  );
};
