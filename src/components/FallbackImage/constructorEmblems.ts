/**
 * F1 Archive — Constructor Emblems & Era Metadata
 * Defines geometric motorsport crests, 2026/historic team liveries,
 * canonical alias resolution, driver era registries, and deterministic fallbacks.
 */

export type CrestPattern =
  | 'shield'
  | 'chevron'
  | 'wings'
  | 'speedmark'
  | 'tri-star'
  | 'racing-stripes'
  | 'heritage-roundel'
  | 'speed-grid'
  | 'bull-crest'
  | 'industrial-h'
  | 'rings-geometric'
  | 'cadillac-crest'
  | 'split-carbon'
  | 'apex-wing';

export interface ConstructorEmblemConfig {
  teamId: string;
  name: string;
  monogram: string;
  pattern: CrestPattern;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
}

export interface DriverMetadata {
  id: string;
  code: string;
  name: string;
  number: number;
  debutYear: number;
  lastActiveYear: number;
  championships: number;
  defaultTeamId?: string;
}

// Canonical constructor configurations: 11 active 2026 teams + historic legends
export const CONSTRUCTOR_EMBLEMS: Record<string, ConstructorEmblemConfig> = {
  // 1. Scuderia Ferrari
  ferrari: {
    teamId: 'ferrari',
    name: 'Scuderia Ferrari',
    monogram: 'SF',
    pattern: 'shield',
    primaryColor: '#E8002D',
    secondaryColor: '#FFF200',
    accentColor: '#FFFFFF',
  },
  // 2. McLaren
  mclaren: {
    teamId: 'mclaren',
    name: 'McLaren F1 Team',
    monogram: 'MCL',
    pattern: 'speedmark',
    primaryColor: '#FF8000',
    secondaryColor: '#47C7FC',
    accentColor: '#000000',
  },
  // 3. Red Bull Racing
  redbull: {
    teamId: 'redbull',
    name: 'Red Bull Racing',
    monogram: 'RBR',
    pattern: 'bull-crest',
    primaryColor: '#3671C6',
    secondaryColor: '#FF1801',
    accentColor: '#FFD700',
  },
  // 4. Mercedes-AMG
  mercedes: {
    teamId: 'mercedes',
    name: 'Mercedes-AMG Petronas',
    monogram: 'MER',
    pattern: 'tri-star',
    primaryColor: '#C0C0C0',
    secondaryColor: '#27F4D2',
    accentColor: '#000000',
  },
  // 5. Aston Martin
  astonmartin: {
    teamId: 'astonmartin',
    name: 'Aston Martin Aramco',
    monogram: 'AMR',
    pattern: 'wings',
    primaryColor: '#229971',
    secondaryColor: '#CEDC00',
    accentColor: '#FFFFFF',
  },
  // 6. Alpine
  alpine: {
    teamId: 'alpine',
    name: 'BWT Alpine F1 Team',
    monogram: 'ALP',
    pattern: 'racing-stripes',
    primaryColor: '#0090FF',
    secondaryColor: '#FF87BC',
    accentColor: '#FFFFFF',
  },
  // 7. Williams
  williams: {
    teamId: 'williams',
    name: 'Williams Racing',
    monogram: 'WIL',
    pattern: 'chevron',
    primaryColor: '#00A0DE',
    secondaryColor: '#FFFFFF',
    accentColor: '#041E42',
  },
  // 8. Racing Bulls (RB)
  rb: {
    teamId: 'rb',
    name: 'Visa Cash App RB',
    monogram: 'VCARB',
    pattern: 'chevron',
    primaryColor: '#6692FF',
    secondaryColor: '#FFFFFF',
    accentColor: '#E8002D',
  },
  // 9. Kick Sauber
  sauber: {
    teamId: 'sauber',
    name: 'Stake F1 Team Kick Sauber',
    monogram: 'SAU',
    pattern: 'speed-grid',
    primaryColor: '#52E252',
    secondaryColor: '#1A1A1A',
    accentColor: '#FFFFFF',
  },
  // 10. Haas
  haas: {
    teamId: 'haas',
    name: 'MoneyGram Haas F1 Team',
    monogram: 'HAA',
    pattern: 'industrial-h',
    primaryColor: '#B6BABD',
    secondaryColor: '#E10600',
    accentColor: '#1E1E1E',
  },
  // 11. Audi (2026 Works Constructor)
  audi: {
    teamId: 'audi',
    name: 'Audi F1 Team',
    monogram: 'AUD',
    pattern: 'rings-geometric',
    primaryColor: '#E52320',
    secondaryColor: '#A3A5A8',
    accentColor: '#111111',
  },
  // 12. Cadillac (2026 11th Constructor)
  cadillac: {
    teamId: 'cadillac',
    name: 'Cadillac Formula 1 Team',
    monogram: 'CAD',
    pattern: 'cadillac-crest',
    primaryColor: '#1F242B',
    secondaryColor: '#C5A059',
    accentColor: '#DFBA73',
  },
  // Historic: Lotus
  lotus: {
    teamId: 'lotus',
    name: 'Team Lotus',
    monogram: 'LOT',
    pattern: 'heritage-roundel',
    primaryColor: '#004225',
    secondaryColor: '#FFCC00',
    accentColor: '#FFFFFF',
  },
  // Historic: Benetton
  benetton: {
    teamId: 'benetton',
    name: 'Benetton Formula',
    monogram: 'BEN',
    pattern: 'racing-stripes',
    primaryColor: '#009944',
    secondaryColor: '#00B2E2',
    accentColor: '#FFFFFF',
  },
  // Historic: Brawn GP
  brawn: {
    teamId: 'brawn',
    name: 'Brawn GP',
    monogram: 'BGP',
    pattern: 'heritage-roundel',
    primaryColor: '#FFFFFF',
    secondaryColor: '#E8FF00',
    accentColor: '#1A1A1A',
  },
};

// Canonical Team Aliases for strict matching
export const CANONICAL_TEAM_ALIASES: Record<string, string> = {
  // Red Bull
  'redbull': 'redbull',
  'red-bull': 'redbull',
  'red bull': 'redbull',
  'red bull racing': 'redbull',
  'red bull racing logo': 'redbull',
  'rbr': 'redbull',

  // Ferrari
  'ferrari': 'ferrari',
  'scuderia ferrari': 'ferrari',
  'scuderia ferrari logo': 'ferrari',
  'ferrari logo': 'ferrari',
  'sf': 'ferrari',

  // McLaren
  'mclaren': 'mclaren',
  'mclaren f1 team': 'mclaren',
  'mclaren logo': 'mclaren',
  'mcl': 'mclaren',

  // Mercedes
  'mercedes': 'mercedes',
  'mercedes-amg': 'mercedes',
  'mercedes amg': 'mercedes',
  'mercedes-benz': 'mercedes',
  'mercedes logo': 'mercedes',
  'mer': 'mercedes',

  // Aston Martin
  'astonmartin': 'astonmartin',
  'aston-martin': 'astonmartin',
  'aston martin': 'astonmartin',
  'aston martin logo': 'astonmartin',
  'amr': 'astonmartin',

  // Alpine
  'alpine': 'alpine',
  'bwt alpine': 'alpine',
  'alpine logo': 'alpine',
  'alp': 'alpine',

  // Williams
  'williams': 'williams',
  'williams racing': 'williams',
  'williams logo': 'williams',
  'wil': 'williams',

  // RB / Racing Bulls
  'rb': 'rb',
  'vcarb': 'rb',
  'racing bulls': 'rb',
  'racingbulls': 'rb',
  'rb logo': 'rb',
  'alphatauri': 'rb',
  'toro rosso': 'rb',

  // Sauber
  'sauber': 'sauber',
  'kick sauber': 'sauber',
  'kick-sauber': 'sauber',
  'kick sauber logo': 'sauber',
  'stake f1': 'sauber',

  // Haas
  'haas': 'haas',
  'haas f1': 'haas',
  'haas logo': 'haas',
  'haa': 'haas',

  // Audi
  'audi': 'audi',
  'audi sport': 'audi',
  'audi f1': 'audi',
  'aud': 'audi',

  // Cadillac
  'cadillac': 'cadillac',
  'cadillac f1': 'cadillac',
  'cad': 'cadillac',

  // Historic
  'lotus': 'lotus',
  'team lotus': 'lotus',
  'team lotus logo': 'lotus',
  'benetton': 'benetton',
  'benetton formula': 'benetton',
  'benetton logo': 'benetton',
  'brawn': 'brawn',
  'brawn gp': 'brawn',
  'brawn gp logo': 'brawn',
};

/**
 * Resolves a team identifier strictly via canonical aliases
 */
export function resolveCanonicalTeamId(input?: string): string | null {
  if (!input) return null;
  const normalized = input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim();

  // 1. Direct key match
  if (CANONICAL_TEAM_ALIASES[normalized]) {
    return CANONICAL_TEAM_ALIASES[normalized];
  }

  // 2. Strip trailing "logo", "f1", "team", "racing"
  const cleaned = normalized
    .replace(/\s+(logo|f1 team|f1|team|racing)$/g, '')
    .trim();
  if (CANONICAL_TEAM_ALIASES[cleaned]) {
    return CANONICAL_TEAM_ALIASES[cleaned];
  }

  return null;
}

/**
 * Deterministic hash-based crest generator for any of the 200+ F1DB historic/future teams
 */
const DETERMINISTIC_PATTERNS: CrestPattern[] = [
  'shield',
  'chevron',
  'wings',
  'speedmark',
  'split-carbon',
  'racing-stripes',
  'heritage-roundel',
  'speed-grid',
];

const HERITAGE_PALETTES: Array<{ primary: string; secondary: string }> = [
  { primary: '#002B49', secondary: '#E8A727' }, // Deep Blue / Gold
  { primary: '#800020', secondary: '#F5F5F5' }, // Burgundy / Silver
  { primary: '#004225', secondary: '#FFCC00' }, // British Green / Yellow
  { primary: '#0055A5', secondary: '#FFFFFF' }, // French Blue / White
  { primary: '#2D3436', secondary: '#E17055' }, // Charcoal / Flame Orange
  { primary: '#192A56', secondary: '#00A8FF' }, // Midnight / Cyan
  { primary: '#2C3A47', secondary: '#25CCF7' }, // Dark Slate / Electric Blue
  { primary: '#574B90', secondary: '#F78FB3' }, // Royal Violet / Rose
];

export function getConstructorEmblem(teamIdOrName?: string): ConstructorEmblemConfig {
  const canonicalId = resolveCanonicalTeamId(teamIdOrName);
  if (canonicalId && CONSTRUCTOR_EMBLEMS[canonicalId]) {
    return CONSTRUCTOR_EMBLEMS[canonicalId];
  }

  const rawKey = (teamIdOrName || 'F1').trim();
  // Hash the identifier to derive consistent pattern and colors
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const pattern = DETERMINISTIC_PATTERNS[absHash % DETERMINISTIC_PATTERNS.length];
  const palette = HERITAGE_PALETTES[absHash % HERITAGE_PALETTES.length];

  // Monogram: first 2-3 uppercase letters
  const monogram = rawKey
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'F1';

  return {
    teamId: rawKey.toLowerCase(),
    name: rawKey,
    monogram,
    pattern,
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    accentColor: '#FFFFFF',
  };
}

/**
 * Historical driver registry for exact era & career resolution
 */
export const DRIVER_METADATA_REGISTRY: Record<string, DriverMetadata> = {
  VER: { id: 'VER', code: 'VER', name: 'Max Verstappen', number: 1, debutYear: 2015, lastActiveYear: 2026, championships: 4 },
  PER: { id: 'PER', code: 'PER', name: 'Sergio Perez', number: 11, debutYear: 2011, lastActiveYear: 2026, championships: 0 },
  HAM: { id: 'HAM', code: 'HAM', name: 'Lewis Hamilton', number: 44, debutYear: 2007, lastActiveYear: 2026, championships: 7 },
  RUS: { id: 'RUS', code: 'RUS', name: 'George Russell', number: 63, debutYear: 2019, lastActiveYear: 2026, championships: 0 },
  LEC: { id: 'LEC', code: 'LEC', name: 'Charles Leclerc', number: 16, debutYear: 2018, lastActiveYear: 2026, championships: 0 },
  SAI: { id: 'SAI', code: 'SAI', name: 'Carlos Sainz', number: 55, debutYear: 2015, lastActiveYear: 2026, championships: 0 },
  NOR: { id: 'NOR', code: 'NOR', name: 'Lando Norris', number: 4, debutYear: 2019, lastActiveYear: 2026, championships: 0 },
  PIA: { id: 'PIA', code: 'PIA', name: 'Oscar Piastri', number: 81, debutYear: 2023, lastActiveYear: 2026, championships: 0 },
  ALO: { id: 'ALO', code: 'ALO', name: 'Fernando Alonso', number: 14, debutYear: 2001, lastActiveYear: 2026, championships: 2 },
  STR: { id: 'STR', code: 'STR', name: 'Lance Stroll', number: 18, debutYear: 2017, lastActiveYear: 2026, championships: 0 },
  ALB: { id: 'ALB', code: 'ALB', name: 'Alexander Albon', number: 23, debutYear: 2019, lastActiveYear: 2026, championships: 0 },
  
  // Historical Legends
  MSC: { id: 'MSC', code: 'MSC', name: 'Michael Schumacher', number: 7, debutYear: 1991, lastActiveYear: 2012, championships: 7 },
  SEN: { id: 'SEN', code: 'SEN', name: 'Ayrton Senna', number: 12, debutYear: 1984, lastActiveYear: 1994, championships: 3 },
  PRO: { id: 'PRO', code: 'PRO', name: 'Alain Prost', number: 2, debutYear: 1980, lastActiveYear: 1993, championships: 4 },
  LAU: { id: 'LAU', code: 'LAU', name: 'Niki Lauda', number: 8, debutYear: 1971, lastActiveYear: 1985, championships: 3 },
  VET: { id: 'VET', code: 'VET', name: 'Sebastian Vettel', number: 5, debutYear: 2007, lastActiveYear: 2022, championships: 4 },
  BUT: { id: 'BUT', code: 'BUT', name: 'Jenson Button', number: 22, debutYear: 2000, lastActiveYear: 2017, championships: 1 },
  FIT: { id: 'FIT', code: 'FIT', name: 'Emerson Fittipaldi', number: 1, debutYear: 1970, lastActiveYear: 1980, championships: 2 },
  FAN: { id: 'FAN', code: 'FAN', name: 'Juan Manuel Fangio', number: 1, debutYear: 1950, lastActiveYear: 1958, championships: 5 },
  CLA: { id: 'CLA', code: 'CLA', name: 'Jim Clark', number: 1, debutYear: 1960, lastActiveYear: 1968, championships: 2 },
  HAK: { id: 'HAK', code: 'HAK', name: 'Mika Hakkinen', number: 1, debutYear: 1991, lastActiveYear: 2001, championships: 2 },
  RAI: { id: 'RAI', code: 'RAI', name: 'Kimi Raikkonen', number: 7, debutYear: 2001, lastActiveYear: 2021, championships: 1 },
  MAN: { id: 'MAN', code: 'MAN', name: 'Nigel Mansell', number: 5, debutYear: 1980, lastActiveYear: 1995, championships: 1 },
  PIQ: { id: 'PIQ', code: 'PIQ', name: 'Nelson Piquet', number: 5, debutYear: 1978, lastActiveYear: 1991, championships: 3 },
};

/**
 * Resolves driver era using user rule:
 * - < 1970: 'vintage'
 * - < 2003: 'classic'
 * - >= 2003: 'modern'
 * Evaluates lastActiveYear first, falling back to debutYear.
 */
export function getDriverEra(
  explicitEra?: 'vintage' | 'classic' | 'modern',
  lastActiveYear?: number,
  debutYear?: number,
  driverIdentifier?: string
): 'vintage' | 'classic' | 'modern' {
  if (explicitEra) return explicitEra;

  let activeYear = lastActiveYear;
  let startYear = debutYear;

  if (activeYear === undefined && driverIdentifier) {
    const reg = DRIVER_METADATA_REGISTRY[driverIdentifier.toUpperCase()];
    if (reg) {
      activeYear = reg.lastActiveYear;
      startYear = reg.debutYear;
    }
  }

  const effectiveYear = activeYear ?? startYear ?? 2024;

  if (effectiveYear < 1970) return 'vintage';
  if (effectiveYear < 2003) return 'classic';
  return 'modern';
}
