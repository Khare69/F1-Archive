import {
  TelemetryPackSchema,
  TelemetryCatalogSchema,
  type ValidatedTelemetryPack,
  type TelemetryCatalogItem,
} from './telemetryPackSchema';

function getOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost';
}

/**
 * Static baseline catalog for fallback or synchronous hydration.
 */
export const TELEMETRY_PACK_CATALOG: TelemetryCatalogItem[] = [
  {
    slug: 'silverstone-2024-ham-vs-ver',
    title: '2024 British Grand Prix — Hamilton vs. Verstappen',
    subtitle: 'Silverstone Grand Prix • Historic 9th Home Victory Lap Battle',
    year: 2024,
    session: 'Race',
    circuitId: 'silverstone',
    circuitName: 'Silverstone Circuit',
    driverACode: 'HAM',
    driverBCode: 'VER',
    driverAName: 'Lewis Hamilton',
    driverBName: 'Max Verstappen',
    driverAColor: '#00D2BE',
    driverBColor: '#0808EF',
    lapTimeA: '1:28.489',
    lapTimeB: '1:28.742',
    delta: 0.253,
    feedAvailability: 'full',
    provenance: 'historical_verified',
  },
  {
    slug: 'monaco-2024-lec-vs-pia',
    title: '2024 Monaco Grand Prix — Leclerc vs. Piastri',
    subtitle: 'Circuit de Monaco • Q3 Pole Position Precision Duel',
    year: 2024,
    session: 'Q3',
    circuitId: 'monaco',
    circuitName: 'Circuit de Monaco',
    driverACode: 'LEC',
    driverBCode: 'PIA',
    driverAName: 'Charles Leclerc',
    driverBName: 'Oscar Piastri',
    driverAColor: '#E8002D',
    driverBColor: '#FF8000',
    lapTimeA: '1:10.270',
    lapTimeB: '1:10.424',
    delta: 0.154,
    feedAvailability: 'full',
    provenance: 'historical_verified',
  },
  {
    slug: 'spa-2024-ver-vs-nor',
    title: '2024 Belgian Grand Prix — Verstappen vs. Norris',
    subtitle: 'Circuit de Spa-Francorchamps • Eau Rouge & Kemmel Straight Shootout',
    year: 2024,
    session: 'Q3',
    circuitId: 'spa-francorchamps',
    circuitName: 'Circuit de Spa-Francorchamps',
    driverACode: 'VER',
    driverBCode: 'NOR',
    driverAName: 'Max Verstappen',
    driverBName: 'Lando Norris',
    driverAColor: '#0808EF',
    driverBColor: '#FF8000',
    lapTimeA: '1:44.825',
    lapTimeB: '1:45.050',
    delta: 0.225,
    feedAvailability: 'full',
    provenance: 'historical_verified',
  },
  {
    slug: 'monza-2024-lec-vs-pia',
    title: '2024 Italian Grand Prix — Leclerc vs. Piastri',
    subtitle: 'Autodromo Nazionale Monza • Temple of Speed Slipstream Duel',
    year: 2024,
    session: 'Race',
    circuitId: 'monza',
    circuitName: 'Autodromo Nazionale Monza',
    driverACode: 'LEC',
    driverBCode: 'PIA',
    driverAName: 'Charles Leclerc',
    driverBName: 'Oscar Piastri',
    driverAColor: '#E8002D',
    driverBColor: '#FF8000',
    lapTimeA: '1:21.432',
    lapTimeB: '1:21.614',
    delta: 0.182,
    feedAvailability: 'full',
    provenance: 'historical_verified',
  },
  {
    slug: 'interlagos-2024-ver-vs-nor',
    title: '2024 São Paulo Grand Prix — Verstappen vs. Norris',
    subtitle: 'Autódromo José Carlos Pace • Wet Weather Masterclass',
    year: 2024,
    session: 'Race',
    circuitId: 'interlagos',
    circuitName: 'Autódromo de Interlagos',
    driverACode: 'VER',
    driverBCode: 'NOR',
    driverAName: 'Max Verstappen',
    driverBName: 'Lando Norris',
    driverAColor: '#0808EF',
    driverBColor: '#FF8000',
    lapTimeA: '1:20.472',
    lapTimeB: '1:21.285',
    delta: 0.813,
    feedAvailability: 'full',
    provenance: 'historical_verified',
  },
  {
    slug: 'madrid-2026-sim-alo-vs-sai',
    title: '2026 Spanish Grand Prix (Madrid) — Alonso vs. Sainz',
    subtitle: 'Circuito de Madrid • 2026 Active Aero & Manual Override Battle',
    year: 2026,
    session: 'Q3',
    circuitId: 'madring',
    circuitName: 'Circuito de Madrid (Madring)',
    driverACode: 'ALO',
    driverBCode: 'SAI',
    driverAName: 'Fernando Alonso',
    driverBName: 'Carlos Sainz',
    driverAColor: '#00594F',
    driverBColor: '#005AFF',
    lapTimeA: '1:17.310',
    lapTimeB: '1:17.585',
    delta: 0.275,
    feedAvailability: 'simulation',
    provenance: 'experimental_simulation',
  },
];

/**
 * Filters the catalog based on the Experimental Labs opt-in toggle.
 */
export function getVisibleTelemetryPacks(
  packs: TelemetryCatalogItem[],
  includeExperimental: boolean
): TelemetryCatalogItem[] {
  if (includeExperimental) return packs;
  return packs.filter((p) => p.provenance !== 'experimental_simulation');
}

/**
 * Fetches and validates the telemetry pack catalog index.
 */
export async function fetchTelemetryCatalog(): Promise<TelemetryCatalogItem[]> {
  const url = `${getOrigin()}/data/telemetry/index.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load telemetry catalog (HTTP ${res.status})`);
  }
  const raw = await res.json();
  const parsed = TelemetryCatalogSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[TelemetryPackClient] Catalog schema mismatch, falling back to static:', parsed.error);
    return TELEMETRY_PACK_CATALOG;
  }
  return parsed.data;
}

/**
 * Fetches and validates a specific telemetry showdown pack.
 */
export async function fetchTelemetryPack(slug: string): Promise<ValidatedTelemetryPack> {
  const url = `${getOrigin()}/data/telemetry/${slug}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load telemetry pack '${slug}' (HTTP ${res.status})`);
  }
  const raw = await res.json();
  const parsed = TelemetryPackSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Telemetry pack '${slug}' failed schema validation: ${parsed.error.issues.map((i) => i.message).join(', ')}`
    );
  }
  return parsed.data;
}
