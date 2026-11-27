import type FuseType from 'fuse.js';
import {
  fetchDriversIndex,
  fetchConstructorsIndex,
  fetchSeasonsIndex,
  fetchCircuitsIndex,
} from '../../services/archiveDataClient';

export type SearchCategory = 'action' | 'driver' | 'constructor' | 'circuit' | 'season';

export interface SearchEntity {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  keywords: string;
  path?: string;
  action?: 'open-shortcuts' | string;
}

let cachedFuse: FuseType<SearchEntity> | null = null;
let loadPromise: Promise<FuseType<SearchEntity>> | null = null;

export function isSearchIndexLoaded(): boolean {
  return cachedFuse !== null;
}

export async function loadSearchIndex(): Promise<FuseType<SearchEntity>> {
  if (cachedFuse) return cachedFuse;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [drivers, constructors, seasons, circuits, fuseMod] = await Promise.all([
      fetchDriversIndex(),
      fetchConstructorsIndex(),
      fetchSeasonsIndex(),
      fetchCircuitsIndex(),
      import('fuse.js'),
    ]);

    const Fuse = (fuseMod.default || fuseMod) as unknown as typeof FuseType;

    const quickActions: SearchEntity[] = [
      {
        id: 'action-compare-ver-ham',
        category: 'action',
        title: 'Compare Max Verstappen vs Lewis Hamilton',
        subtitle: 'Head-to-head career telemetry & era comparison',
        keywords: 'compare ver ham max verstappen lewis hamilton head to head h2h',
        path: '/drivers/compare?d1=VER&d2=HAM',
      },
      {
        id: 'action-circuit-spa',
        category: 'action',
        title: 'Open Spa-Francorchamps Circuit',
        subtitle: '3D circuit elevation & track geometry',
        keywords: 'circuit track spa francorchamps belgium elevation eau rouge',
        path: '/circuits/spa-francorchamps',
      },
      {
        id: 'action-telemetry-replay',
        category: 'action',
        title: 'Open Telemetry Ghost-Lap Replay',
        subtitle: 'Multi-channel speed, throttle, brake 3D telemetry',
        keywords: 'telemetry ghost lap replay speed trace delta comparison',
        path: '/telemetry',
      },
      {
        id: 'action-pitwall-strategy',
        category: 'action',
        title: 'Open Pit-Wall Strategy Simulator',
        subtitle: 'Monte Carlo undercut & tyre degradation model',
        keywords: 'pit wall strategy simulation undercut monte carlo tyre stint',
        path: '/pitwall',
      },
      {
        id: 'action-3d-lab',
        category: 'action',
        title: 'Open 3D Evolution Lab',
        subtitle: '3D vehicle models, CAD inspection, and 2026 active aero',
        keywords: '3d lab cars car cad aerodynamics chassis models 2026 aero',
        path: '/lab',
      },
      {
        id: 'action-sql-historian',
        category: 'action',
        title: 'Open SQL Historian',
        subtitle: 'Query F1DB with natural language text-to-SQL or CodeMirror',
        keywords: 'historian sql f1db ai query database natural language text to sql',
        path: '/historian',
      },
      {
        id: 'action-keyboard-shortcuts',
        category: 'action',
        title: 'View Keyboard Shortcuts',
        subtitle: 'Command palette, navigation hotkeys, and shortcuts',
        keywords: 'shortcuts hotkeys keyboard help info ?',
        action: 'open-shortcuts',
      },
      {
        id: 'action-mode-beginner',
        category: 'action',
        title: 'Switch to Beginner (Learn) Mode',
        subtitle: 'Plain-English insights, F1 terminology glossary tooltips, and guided context',
        keywords: 'beginner learn novice mode audience glossary insights',
        action: 'set-mode-beginner',
      },
      {
        id: 'action-mode-enthusiast',
        category: 'action',
        title: 'Switch to Enthusiast (Pro) Mode',
        subtitle: 'Data-dense telemetry, full championship analytics, and pit-wall models',
        keywords: 'enthusiast pro standard mode analytics telemetry',
        action: 'set-mode-enthusiast',
      },
      {
        id: 'action-mode-developer',
        category: 'action',
        title: 'Switch to Developer (Dev) Mode',
        subtitle: 'Direct SQL inspector, system architecture explorer, and engine internals',
        keywords: 'developer dev code sql inspect schema architecture query engine',
        action: 'set-mode-developer',
      },
      {
        id: 'action-architecture-docs',
        category: 'action',
        title: 'Open Architecture & Docs Explorer',
        subtitle: 'System architecture, SQLite schema inspector, 3D pipeline, and ADRs',
        keywords: 'architecture docs documentation sqlite schema adr pipeline internals',
        path: '/docs',
      },
    ];

    const driverEntities: SearchEntity[] = drivers.map((d) => ({
      id: `driver-${d.id}`,
      category: 'driver',
      title: d.name,
      subtitle:
        d.championships && d.championships > 0
          ? `${d.championships}x WDC • ${d.wins || 0} Wins`
          : `${d.wins || 0} Wins • ${d.starts || 0} Starts`,
      keywords: `${d.name} ${d.code || ''} ${d.country || ''} driver pilot ${d.id}`,
      path: `/drivers/${d.id}`,
    }));

    const constructorEntities: SearchEntity[] = constructors.map((c) => ({
      id: `team-${c.id}`,
      category: 'constructor',
      title: c.name,
      subtitle: `${c.base || ''} • ${c.championships || 0} Titles`,
      keywords: `${c.name} ${c.base || ''} ${c.principal || ''} team constructor ${c.id}`,
      path: `/teams/${c.id}`,
    }));

    const seasonEntities: SearchEntity[] = seasons.map((s) => ({
      id: `season-${s.year}`,
      category: 'season',
      title: `${s.year} World Championship`,
      subtitle: `Champion: ${s.championDriver || 'Unknown'} (${s.championTeam || 'Unknown'})`,
      keywords: `${s.year} season championship ${s.championDriver || ''} ${s.championTeam || ''}`,
      path: `/seasons/${s.year}`,
    }));

    const circuitEntities: SearchEntity[] = circuits.map((c) => ({
      id: `circuit-${c.id}`,
      category: 'circuit',
      title: c.name,
      subtitle: `${c.city || ''}, ${c.country || ''} • ${c.lengthKm || 0} km`,
      keywords: `${c.name} ${c.city || ''} ${c.country || ''} track circuit ${c.id}`,
      path: `/circuits/${c.id}`,
    }));

    const allEntities = [
      ...quickActions,
      ...driverEntities,
      ...constructorEntities,
      ...circuitEntities,
      ...seasonEntities,
    ];

    cachedFuse = new Fuse(allEntities, {
      threshold: 0.35,
      ignoreLocation: true,
      keys: [
        { name: 'title', weight: 2 },
        { name: 'keywords', weight: 1.5 },
        { name: 'subtitle', weight: 1 },
      ],
    });

    return cachedFuse;
  })();

  return loadPromise;
}

export function resetSearchIndexCacheForTesting(): void {
  cachedFuse = null;
  loadPromise = null;
}
