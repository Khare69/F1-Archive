/**
 * F1 // ARCHIVE — ETL Transformation Engine
 * High-performance, O(N) map-indexed data transformations.
 */

import path from 'node:path';
import fs from 'node:fs';
import type {
  RawCircuit,
  RawCircuitLayout,
  RawConstructor,
  RawDriver,
  RawRace,
  RawResult,
  RawSprintResult,
  RawSeason,
  RawRacesDriverStanding,
  RawRacesConstructorStanding,
  RawCountry,
  RawSeasonDriverStanding,
  RawSeasonConstructorStanding,
  GeoJSONCollection,
  TeamConfig
} from './types';
import { ElevationService } from './elevation';

export const HALF_POINT_RACES = new Set([
  '1975_4',  // 1975 Spanish GP
  '1975_12', // 1975 Austrian GP
  '1984_6',  // 1984 Monaco GP
  '1991_16', // 1991 Australian GP
  '2009_2',  // 2009 Malaysian GP
  '2021_12'  // 2021 Belgian GP
]);

export const DRIVER_SLUG_TO_CODE: Record<string, string> = {
  'max-verstappen': 'VER',
  'lewis-hamilton': 'HAM',
  'charles-leclerc': 'LEC',
  'lando-norris': 'NOR',
  'fernando-alonso': 'ALO',
  'carlos-sainz-jr': 'SAI',
  'george-russell': 'RUS',
  'oscar-piastri': 'PIA',
  'sergio-perez': 'PER',
  'valtteri-bottas': 'BOT',
  'alexander-albon': 'ALB',
  'yuki-tsunoda': 'TSU',
  'esteban-ocon': 'OCO',
  'pierre-gasly': 'GAS',
  'nico-hulkenberg': 'HUL',
  'kevin-magnussen': 'MAG',
  'daniel-ricciardo': 'RIC',
  'lance-stroll': 'STR',
  'zhou-guanyu': 'ZHO',
  'logan-sargeant': 'SAR',
  'liam-lawson': 'LAW',
  'oliver-bearman': 'BEA',
  'franco-colapinto': 'COL',
  'jack-doohan': 'DOO',
  'gabriel-bortoleto': 'BOR',
  'isack-hadjar': 'HAD',
  'andrea-kimi-antonelli': 'ANT',
  'ayumu-iwasa': 'IWA',
  'felipe-drugovich': 'DRU',
  'mick-schumacher': 'MSC',
  'sebastian-vettel': 'VET',
  'michael-schumacher': 'MSC',
  'ayrton-senna': 'SEN',
  'alain-prost': 'PRO',
  'niki-lauda': 'LAU',
  'juan-manuel-fangio': 'FAN',
  'jim-clark': 'CLA',
  'jackie-stewart': 'STE',
  'nigel-mansell': 'MAN',
  'mika-hakkinen': 'HAK',
  'kimi-raikkonen': 'RAI',
  'jenson-button': 'BUT',
  'nelson-piquet': 'PIQ',
  'emerson-fittipaldi': 'FIT',
  'graham-hill': 'HIL',
  'damon-hill': 'DHI',
  'jacques-villeneuve': 'VIL',
  'gilles-villeneuve': 'GVI',
  'mario-andretti': 'AND',
  'stirling-moss': 'MOS',
  'alberto-ascari': 'ASC',
  'jack-brabham': 'BRA',
  'jochen-rindt': 'RIN',
  'james-hunt': 'HNT',
  'alan-jones': 'JON',
  'keke-rosberg': 'ROS',
  'nico-rosberg': 'NRO'
};

/**
 * Normalized Team Configurations (Deduplicated canonical keys)
 */
export const TEAM_CONFIGS: Record<string, TeamConfig> = {
  ferrari: {
    name: 'Scuderia Ferrari',
    color: '#E8002D',
    carName: 'SF-24',
    base: 'Maranello, Italy',
    principal: 'Frédéric Vasseur',
    powerUnit: 'Ferrari 066/12 V6 Turbo Hybrid',
    downforce: 'High',
    topSpeed: '350 km/h',
    weight: '798 kg',
    isLegendary: true,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Ferrari 2026 V6 Turbo (350kW MGU-K)',
      weight: '768 kg',
      activeAero: true
    }
  },
  mclaren: {
    name: 'McLaren F1 Team',
    color: '#FF8000',
    carName: 'MCL38',
    base: 'Woking, United Kingdom',
    principal: 'Andrea Stella',
    powerUnit: 'Mercedes-AMG F1 M15 V6 Turbo Hybrid',
    downforce: 'High',
    topSpeed: '351 km/h',
    weight: '798 kg',
    isLegendary: true,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Mercedes-AMG 2026 V6 Turbo',
      weight: '768 kg',
      activeAero: true
    }
  },
  redbull: {
    name: 'Red Bull Racing',
    color: '#3671C6',
    carName: 'RB20',
    base: 'Milton Keynes, United Kingdom',
    principal: 'Christian Horner',
    powerUnit: 'Honda RBPT V6 Turbo Hybrid',
    downforce: 'High',
    topSpeed: '352 km/h',
    weight: '798 kg',
    isLegendary: true,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Red Bull Ford Powertrains 2026',
      weight: '768 kg',
      activeAero: true
    }
  },
  mercedes: {
    name: 'Mercedes-AMG PETRONAS',
    color: '#C0C0C0',
    carName: 'W15',
    base: 'Brackley, United Kingdom',
    principal: 'Toto Wolff',
    powerUnit: 'Mercedes-AMG F1 M15 V6 Turbo Hybrid',
    downforce: 'Medium-High',
    topSpeed: '348 km/h',
    weight: '798 kg',
    isLegendary: true,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Mercedes-AMG 2026 V6 Turbo',
      weight: '768 kg',
      activeAero: true
    }
  },
  astonmartin: {
    name: 'Aston Martin Aramco',
    color: '#229971',
    carName: 'AMR24',
    base: 'Silverstone, United Kingdom',
    principal: 'Mike Krack',
    powerUnit: 'Mercedes-AMG F1 M15 V6 Turbo Hybrid',
    downforce: 'Medium',
    topSpeed: '347 km/h',
    weight: '798 kg',
    isLegendary: false,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Honda Works 2026 Power Unit',
      weight: '768 kg',
      activeAero: true
    }
  },
  alpine: {
    name: 'BWT Alpine F1 Team',
    color: '#0093CC',
    carName: 'A524',
    base: 'Enstone, United Kingdom',
    principal: 'Oliver Oakes',
    powerUnit: 'Renault E-Tech RE24 V6 Turbo Hybrid',
    downforce: 'Medium',
    topSpeed: '346 km/h',
    weight: '798 kg',
    isLegendary: false,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Mercedes-AMG Customer 2026 Power Unit',
      weight: '768 kg',
      activeAero: true
    }
  },
  williams: {
    name: 'Williams Racing',
    color: '#041E42',
    carName: 'FW46',
    base: 'Grove, United Kingdom',
    principal: 'James Vowles',
    powerUnit: 'Mercedes-AMG F1 M15 V6 Turbo Hybrid',
    downforce: 'Medium-Low',
    topSpeed: '351 km/h',
    weight: '798 kg',
    isLegendary: true,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Mercedes-AMG 2026 V6 Turbo',
      weight: '768 kg',
      activeAero: true
    }
  },
  rb: {
    name: 'Racing Bulls',
    color: '#6692FF',
    carName: 'VCARB 01',
    base: 'Faenza, Italy',
    principal: 'Laurent Mekies',
    powerUnit: 'Honda RBPT V6 Turbo Hybrid',
    downforce: 'Medium',
    topSpeed: '349 km/h',
    weight: '798 kg',
    isLegendary: false,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Red Bull Ford Powertrains 2026',
      weight: '768 kg',
      activeAero: true
    }
  },
  sauber: {
    name: 'Stake F1 Team Kick Sauber',
    color: '#52E252',
    carName: 'C44',
    base: 'Hinwil, Switzerland',
    principal: 'Mattia Binotto',
    powerUnit: 'Ferrari 066/12 V6 Turbo Hybrid',
    downforce: 'Medium-Low',
    topSpeed: '346 km/h',
    weight: '798 kg',
    isLegendary: false,
    isActive2026: false,
    specs2026: null
  },
  haas: {
    name: 'MoneyGram Haas F1 Team',
    color: '#B6BABD',
    carName: 'VF-24',
    base: 'Kannapolis, United States',
    principal: 'Ayao Komatsu',
    powerUnit: 'Ferrari 066/12 V6 Turbo Hybrid',
    downforce: 'Medium',
    topSpeed: '348 km/h',
    weight: '798 kg',
    isLegendary: false,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Ferrari 2026 Customer Power Unit / Toyota Gazoo Technical',
      weight: '768 kg',
      activeAero: true
    }
  },
  audi: {
    name: 'Audi F1 Team',
    color: '#E00000',
    carName: 'Audi Works 2026',
    base: 'Neuburg an der Donau, Germany',
    principal: 'Mattia Binotto',
    powerUnit: 'Audi F1 Hybrid V6',
    downforce: 'Medium-High',
    topSpeed: '350 km/h',
    weight: '768 kg',
    isLegendary: false,
    isActive2026: true,
    specs2026: {
      powerUnit: 'Audi 2026 F1 Power Unit',
      weight: '768 kg',
      activeAero: true
    }
  },
  cadillac: {
    name: 'Cadillac Formula 1 Team',
    color: '#FFD700',
    carName: 'Cadillac 2026',
    base: 'Fishers, Indiana, United States',
    principal: 'Team Principal',
    powerUnit: 'Ferrari / GM Powertrain',
    downforce: 'Medium',
    topSpeed: '348 km/h',
    weight: '768 kg',
    isLegendary: false,
    isActive2026: true,
    specs2026: {
      powerUnit: 'GM / Cadillac 2026 Hybrid',
      weight: '768 kg',
      activeAero: true
    }
  }
};

export function normalizeTeamId(id: string): string {
  const clean = id.trim().toLowerCase().replace(/[^\w-]/g, '');
  if (clean === 'red-bull' || clean === 'redbull' || clean === 'red_bull') return 'redbull';
  if (clean === 'aston-martin' || clean === 'astonmartin') return 'astonmartin';
  if (clean === 'racing-bulls' || clean === 'racingbulls' || clean === 'rb' || clean === 'alphatauri' || clean === 'toro-rosso') return 'rb';
  if (clean === 'stake-f1' || clean === 'kick-sauber' || clean === 'sauber') return 'sauber';
  return clean;
}

/**
 * Projects WGS84 GeoJSON [lng, lat] coordinates into 3D Three.js coordinates [x, y, z]
 * enriched with real meters elevation from Open-Meteo.
 */
export async function projectTrackCoordinatesWithElevation(
  coords: [number, number][],
  elevationService: ElevationService
): Promise<{
  spline: [number, number, number][];
  elevationMinM: number;
  elevationMaxM: number;
  elevationDeltaM: number;
}> {
  if (!coords || coords.length < 3) {
    throw new Error('Track coordinates must contain at least 3 points');
  }

  // Clone and strip closing duplicate endpoint
  const pts = coords.slice();
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (Math.abs(first[0] - last[0]) < 1e-6 && Math.abs(first[1] - last[1]) < 1e-6) {
    pts.pop();
  }

  // Centroid
  let sumLon = 0, sumLat = 0;
  for (const [lon, lat] of pts) {
    sumLon += lon;
    sumLat += lat;
  }
  const lon0 = sumLon / pts.length;
  const lat0 = sumLat / pts.length;
  const cosLat0 = Math.cos((lat0 * Math.PI) / 180);

  // Aspect-corrected projection (x = lon, z = -lat)
  const projected = pts.map(([lon, lat]) => [
    (lon - lon0) * cosLat0,
    -(lat - lat0)
  ]);

  // Normalization scale factor (fit within 8.0 unit radius)
  let maxDist = 0;
  for (const [x, z] of projected) {
    const d = Math.sqrt(x * x + z * z);
    if (d > maxDist) maxDist = d;
  }
  const scale = maxDist > 0 ? 8.0 / maxDist : 1.0;

  // Downsample vertices if dense to avoid excessive points (~120-180 points)
  let targetPts = projected;
  let targetCoords = pts;
  if (projected.length > 180) {
    const step = Math.ceil(projected.length / 150);
    targetPts = projected.filter((_, idx) => idx % step === 0);
    targetCoords = pts.filter((_, idx) => idx % step === 0);
  }

  // Fetch real elevations in meters
  const realElevations = await elevationService.getElevationsForPoints(targetCoords);
  const elevMin = Math.min(...realElevations);
  const elevMax = Math.max(...realElevations);
  const elevDelta = Number((elevMax - elevMin).toFixed(1));

  // Compute 3D vertical relief scale:
  // Exaggerate vertical delta slightly (2x-4x) so climbs like Eau Rouge or COTA Turn 1 are dramatic
  const verticalScale = elevDelta > 0 ? 1.8 / elevDelta : 0;

  const spline = targetPts.map(([x, z], i) => {
    const elevM = realElevations[i] ?? elevMin;
    const y = Number(((elevM - elevMin) * verticalScale).toFixed(3));
    return [
      Number((x * scale).toFixed(3)),
      y,
      Number((z * scale).toFixed(3))
    ] as [number, number, number];
  });

  return {
    spline,
    elevationMinM: elevMin,
    elevationMaxM: elevMax,
    elevationDeltaM: elevDelta
  };
}

/**
 * Procedural track fallback for circuits lacking GeoJSON coordinates.
 */
export function generateProceduralTrack(id: string, turns = 14): [number, number, number][] {
  const seed = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = Math.max(12, Math.min(turns * 6, 96));
  const pts: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 6.0 + 1.8 * Math.sin(angle * 2 + seed) + 0.9 * Math.cos(angle * 3);
    const x = Number((r * Math.cos(angle)).toFixed(3));
    const z = Number((r * Math.sin(angle)).toFixed(3));
    const y = Number((Math.sin(angle * 3) * 0.35).toFixed(3));
    pts.push([x, y, z]);
  }
  return pts;
}

export interface TransformOutputs {
  seasons: any[];
  constructors: any[];
  drivers: any[];
  circuits: any[];
  meta: any;
  circuitSplines: Map<string, { circuitId: string; coordinates: [number, number, number][]; elevationMinM?: number; elevationMaxM?: number; elevationDeltaM?: number }>;
  seasonClassifications: Map<number, any>;
  teammates: Record<string, any>;
}

/**
 * Executes the full data transformation pipeline with O(N) pre-indexing.
 */
export async function transformF1Data(
  f1dbDir: string,
  geoJsonPath: string,
  elevationService: ElevationService,
  releaseTag: string
): Promise<TransformOutputs> {
  console.log('🔄 Loading raw F1DB datasets...');
  const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(f1dbDir, file), 'utf-8'));

  const rawRaces: RawRace[] = readJson('f1db-races.json');
  const rawResults: RawResult[] = readJson('f1db-races-race-results.json');
  const rawSprintResults: RawSprintResult[] = fs.existsSync(path.join(f1dbDir, 'f1db-races-sprint-race-results.json'))
    ? readJson('f1db-races-sprint-race-results.json')
    : fs.existsSync(path.join(f1dbDir, 'f1db-races-sprint-results.json'))
    ? readJson('f1db-races-sprint-results.json')
    : [];
  const rawDriverStandings: RawRacesDriverStanding[] = fs.existsSync(path.join(f1dbDir, 'f1db-races-driver-standings.json'))
    ? readJson('f1db-races-driver-standings.json')
    : [];
  const rawConstructorStandings: RawRacesConstructorStanding[] = fs.existsSync(path.join(f1dbDir, 'f1db-races-constructor-standings.json'))
    ? readJson('f1db-races-constructor-standings.json')
    : [];
  const rawCircuits: RawCircuit[] = readJson('f1db-circuits.json');
  const rawCircuitsLayouts: RawCircuitLayout[] = readJson('f1db-circuits-layouts.json');
  const rawConstructors: RawConstructor[] = readJson('f1db-constructors.json');
  const rawDrivers: RawDriver[] = readJson('f1db-drivers.json');
  const rawSeasons: RawSeason[] = readJson('f1db-seasons.json');
  const rawCountries: RawCountry[] = fs.existsSync(path.join(f1dbDir, 'f1db-countries.json'))
    ? readJson('f1db-countries.json')
    : [];
  const rawSeasonDriverStandings: RawSeasonDriverStanding[] = fs.existsSync(path.join(f1dbDir, 'f1db-seasons-driver-standings.json'))
    ? readJson('f1db-seasons-driver-standings.json')
    : [];
  const rawSeasonConstructorStandings: RawSeasonConstructorStanding[] = fs.existsSync(path.join(f1dbDir, 'f1db-seasons-constructor-standings.json'))
    ? readJson('f1db-seasons-constructor-standings.json')
    : [];

  const countryNameMap = new Map<string, string>();
  for (const c of rawCountries) {
    countryNameMap.set(c.id.toLowerCase(), c.name);
  }

  const geoJson: GeoJSONCollection = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8'));

  // ── O(N) Map Pre-Indexing ──
  console.log('⚡ Indexing relational datasets in O(N)...');
  const racesById = new Map<number, RawRace>();
  const racesByYear = new Map<number, RawRace[]>();
  const racesByCircuit = new Map<string, RawRace[]>();

  for (const r of rawRaces) {
    racesById.set(r.id, r);
    if (!racesByYear.has(r.year)) racesByYear.set(r.year, []);
    racesByYear.get(r.year)!.push(r);

    if (!racesByCircuit.has(r.circuitId)) racesByCircuit.set(r.circuitId, []);
    racesByCircuit.get(r.circuitId)!.push(r);
  }

  const resultsByRaceId = new Map<number, RawResult[]>();
  const resultsByDriverId = new Map<string, RawResult[]>();
  const constructorFirstYear = new Map<string, number>();

  for (const res of rawResults) {
    if (!resultsByRaceId.has(res.raceId)) resultsByRaceId.set(res.raceId, []);
    resultsByRaceId.get(res.raceId)!.push(res);

    if (res.driverId) {
      if (!resultsByDriverId.has(res.driverId)) resultsByDriverId.set(res.driverId, []);
      resultsByDriverId.get(res.driverId)!.push(res);
    }

    if (res.constructorId && res.year) {
      const cId = normalizeTeamId(res.constructorId);
      const curr = constructorFirstYear.get(cId);
      if (!curr || res.year < curr) {
        constructorFirstYear.set(cId, res.year);
      }
      const rawCurr = constructorFirstYear.get(res.constructorId);
      if (!rawCurr || res.year < rawCurr) {
        constructorFirstYear.set(res.constructorId, res.year);
      }
    }
  }

  // ── Process Circuits ──
  console.log('🏎️ Processing circuits & real geospatial elevation...');
  const geoMap = new Map<string, any>();
  for (const f of geoJson.features) {
    const nameKey = (f.properties.Name || '').toLowerCase().replace(/[^\w]/g, '');
    const locKey = (f.properties.Location || '').toLowerCase().replace(/[^\w]/g, '');
    geoMap.set(nameKey, f);
    geoMap.set(locKey, f);
  }
  // Explicit canonical aliases for classic venues
  geoMap.set('monza', geoMap.get('autodromonazionalemonza') || geoMap.get('monza'));
  geoMap.set('monaco', geoMap.get('circuitdemonaco') || geoMap.get('monaco'));
  geoMap.set('silverstone', geoMap.get('silverstonecircuit') || geoMap.get('silverstone'));
  geoMap.set('spa', geoMap.get('circuitdespafrancorchamps') || geoMap.get('spafrancorchamps'));
  geoMap.set('spa-francorchamps', geoMap.get('circuitdespafrancorchamps') || geoMap.get('spafrancorchamps'));
  geoMap.set('suzuka', geoMap.get('suzukacircuit') || geoMap.get('suzukainternationalracingcourse'));
  geoMap.set('interlagos', geoMap.get('autodromojosecarlospace') || geoMap.get('interlagos'));
  geoMap.set('buddh', geoMap.get('buddhinternationalcircuit') || geoMap.get('buddh'));

  const circuitSplines = new Map<string, any>();
  const circuits: any[] = [];

  for (const rc of rawCircuits) {
    const cId = rc.id.toLowerCase();
    const cleanName = (rc.name || '').toLowerCase().replace(/[^\w]/g, '');
    const cleanPlace = (rc.placeName || '').toLowerCase().replace(/[^\w]/g, '');

    const geoMatch = geoMap.get(cId) || geoMap.get(cleanName) || geoMap.get(cleanPlace);
    let splineMeta: any;

    if (geoMatch && geoMatch.geometry && geoMatch.geometry.coordinates) {
      splineMeta = await projectTrackCoordinatesWithElevation(geoMatch.geometry.coordinates, elevationService);
    } else {
      const fallbackSpline = generateProceduralTrack(cId, rc.turns || 14);
      splineMeta = {
        spline: fallbackSpline,
        elevationMinM: 0,
        elevationMaxM: 25,
        elevationDeltaM: 25
      };
    }

    // Save spline for public/data/circuits/<cId>.json
    circuitSplines.set(cId, {
      circuitId: cId,
      coordinates: splineMeta.spline,
      elevationMinM: splineMeta.elevationMinM,
      elevationMaxM: splineMeta.elevationMaxM,
      elevationDeltaM: splineMeta.elevationDeltaM
    });

    // Circuit stats
    const cRaces = racesByCircuit.get(cId) || [];
    let poleWins = 0;
    let recordedPoles = 0;
    const pastWinners: any[] = [];

    for (const r of cRaces) {
      const rResults = resultsByRaceId.get(r.id) || [];
      const winner = rResults.find(res => res.positionNumber === 1);
      const pole = rResults.find(res => res.gridPositionNumber === 1);

      if (pole) {
        recordedPoles++;
        if (winner && winner.driverId === pole.driverId) {
          poleWins++;
        }
      }
      if (winner) {
        const rawDriver = rawDrivers.find(d => d.id === winner.driverId);
        const rawConstr = rawConstructors.find(c => c.id === winner.constructorId);
        pastWinners.push({
          year: r.year,
          driverId: winner.driverId,
          driverName: rawDriver?.name || winner.driverId,
          constructorId: winner.constructorId,
          constructorName: rawConstr?.name || winner.constructorId,
          gridPosition: winner.gridPositionNumber ?? null
        });
      }
    }

    const poleToWinRate = recordedPoles > 0 ? Number(((poleWins / recordedPoles) * 100).toFixed(1)) : null;

    // F-12: trackCoordinates is NOT included in summary circuits.json!
    const countryName = countryNameMap.get(rc.countryId.toLowerCase()) || rc.countryId;
    circuits.push({
      id: cId,
      name: rc.fullName || rc.name,
      country: countryName,
      city: rc.placeName || null,
      lengthKm: rc.length ? `${rc.length} km` : null,
      turns: rc.turns || null,
      lapRecord: rc.lapRecord || null,
      lapRecordHolder: rc.lapRecordHolder || null,
      firstGP: rc.firstRaceYear ?? (cId === 'madring' || cId === 'madrid' ? 2026 : null),
      drsZones: rc.drsZones ?? null,
      elevation: splineMeta.elevationDeltaM ? `+${splineMeta.elevationDeltaM}m` : null,
      type: rc.type === 'STREET' ? 'Street' : rc.type === 'SEMI_PERMANENT' ? 'Semi-Permanent' : 'Permanent',
      description: `${rc.fullName || rc.name} is an officially indexed Formula 1 venue located in ${rc.placeName || countryName}, ${countryName}.`,
      totalRaces: cRaces.length,
      poleToWinRate,
      poleToWinCount: poleWins,
      racesWithRecordedPole: recordedPoles,
      pastWinners: pastWinners.slice(-10).reverse()
    });
  }

  // ── Process Constructors ──
  console.log('🛠️ Processing constructors with verified historical entries...');
  const constructors: any[] = [];
  const rawConstructorMap = new Map(rawConstructors.map(c => [normalizeTeamId(c.id), c]));

  for (const [canonicalId, cfg] of Object.entries(TEAM_CONFIGS)) {
    const rawMatch = rawConstructorMap.get(canonicalId);
    const computedFirst = constructorFirstYear.get(canonicalId) ?? (rawMatch ? constructorFirstYear.get(rawMatch.id) : undefined);
    const firstEntry = rawMatch?.firstRaceEntryYear ?? computedFirst ?? (canonicalId === 'cadillac' || canonicalId === 'audi' ? 2026 : null);

    constructors.push({
      id: canonicalId,
      name: cfg.name,
      carName: cfg.carName,
      color: cfg.color,
      base: cfg.base,
      principal: cfg.principal,
      championships: rawMatch?.totalChampionshipWins ?? 0,
      firstEntry, // F-14: No 1950 fallback!
      polePositions: rawMatch?.totalPolePositions ?? 0,
      fastestLaps: rawMatch?.totalFastestLaps ?? 0,
      isLegendary: cfg.isLegendary,
      isActive2026: cfg.isActive2026,
      description: `${cfg.name} is an officially indexed Formula 1 constructor.`,
      specs: {
        powerUnit: cfg.powerUnit,
        chassis: 'Carbon-fibre composite monocoque',
        weight: cfg.weight,
        downforce: cfg.downforce,
        topSpeed: cfg.topSpeed
      },
      specs2026: cfg.specs2026 ?? null
    });
  }

  // Add notable historic constructors
  for (const rc of rawConstructors) {
    const cId = normalizeTeamId(rc.id);
    if (constructors.some(c => c.id === cId)) continue;

    if ((rc.totalChampionshipWins ?? 0) > 0 || (rc.totalRaceWins ?? 0) > 0 || (rc.totalRaceEntries ?? 0) > 30) {
      const computedFirst = constructorFirstYear.get(rc.id) ?? constructorFirstYear.get(cId) ?? null;
      constructors.push({
        id: cId,
        name: rc.name,
        carName: `${rc.name} Historic Chassis`,
        color: '#8A94A6',
        base: rc.countryId || 'Historic',
        principal: 'Team Principal',
        championships: rc.totalChampionshipWins || 0,
        firstEntry: rc.firstRaceEntryYear ?? computedFirst, // F-14: computed from race entries, never 1950!
        polePositions: rc.totalPolePositions || 0,
        fastestLaps: rc.totalFastestLaps || 0,
        isLegendary: (rc.totalChampionshipWins ?? 0) > 0,
        isActive2026: false,
        description: `${rc.name} is an officially indexed Formula 1 constructor.`,
        specs: {
          powerUnit: 'Historic F1 Powertrain',
          chassis: 'Tubular / Carbon monocoque',
          weight: '600 kg',
          downforce: 'Medium',
          topSpeed: '330 km/h'
        },
        specs2026: null
      });
    }
  }

  // ── Process Drivers ──
  console.log('🏎️ Processing drivers with accurate scoring & chronological finishes...');
  const drivers: any[] = [];

  for (const d of rawDrivers) {
    const dResults = resultsByDriverId.get(d.id) || [];
    const wins = d.totalRaceWins ?? 0;
    const poles = d.totalPolePositions ?? 0;
    const podiums = d.totalPodiums ?? 0;
    const starts = d.totalRaceStarts ?? dResults.length;

    // F-17: Compute pointsSharePct from entered rounds max points
    let earnedPoints = 0;
    let maxPossibleInEnteredRaces = 0;

    for (const res of dResults) {
      earnedPoints += res.points ?? 0;
      // Max points in that race (approx 25 for modern, 9 or 8 historic)
      const race = racesById.get(res.raceId);
      const isHalfPoint = race ? HALF_POINT_RACES.has(`${race.year}_${race.round}`) : false;
      let roundMax = 25;
      if (race && race.year < 1960) roundMax = 8;
      else if (race && race.year < 1991) roundMax = 9;
      else if (race && race.year < 2003) roundMax = 10;
      else if (race && race.year < 2010) roundMax = 10;

      if (isHalfPoint) roundMax /= 2;
      maxPossibleInEnteredRaces += roundMax;
    }

    const pointsSharePct = maxPossibleInEnteredRaces > 0
      ? Number(((earnedPoints / maxPossibleInEnteredRaces) * 100).toFixed(1))
      : 0;

    // F-16: Sort race finishes strictly descending chronologically before taking 8
    const sortedFinishes = dResults
      .slice()
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.round - a.round;
      })
      .slice(0, 8)
      .map(r => {
        let pos = r.positionNumber;
        if (r.positionText === 'D' || r.positionText === 'R' || r.positionText === 'DNF') pos = 'DNF' as any;
        else if (r.positionText === 'W' || r.positionText === 'DNS') pos = 'DNS' as any;
        else if (r.positionText === 'DSQ') pos = 'DSQ' as any;
        return {
          year: r.year,
          round: r.round,
          race: `Round ${r.round}`,
          position: pos ?? 'FIN'
        };
      });

    const primaryId = DRIVER_SLUG_TO_CODE[d.id] || d.id;
    const isLegend = (d.totalChampionshipWins ?? 0) > 0 || wins >= 10;

    // Find latest teamId for driver
    const latestResult = dResults[dResults.length - 1];
    const teamId = latestResult ? normalizeTeamId(latestResult.constructorId) : 'historic';
    const winRate = starts > 0 ? Number(((wins / starts) * 100).toFixed(1)) : 0;
    const podiumRate = starts > 0 ? Number(((podiums / starts) * 100).toFixed(1)) : 0;

    drivers.push({
      id: primaryId,
      slug: d.id,
      code: primaryId.length === 3 ? primaryId : null,
      name: d.name,
      fullName: d.fullName || d.name,
      number: d.permanentNumber != null ? Number(d.permanentNumber) : null,
      country: d.countryId ? (countryNameMap.get(d.countryId.toLowerCase()) || d.countryId) : 'International',
      teamId,
      wins,
      podiums,
      championships: d.totalChampionshipWins ?? 0,
      polePositions: poles,
      fastestLaps: d.totalFastestLaps ?? 0,
      starts,
      winRate,
      podiumRate,
      pointsSharePct,
      dateOfBirth: d.dateOfBirth ?? null,
      birthDate: d.dateOfBirth ?? null,
      isLegend,
      isActive2026: false,
      raceFinishes: sortedFinishes
    });
  }

  // ── Process Teammate H2H (Excluding shared cars & splitting DNFs) ──
  console.log('🤝 Computing teammate head-to-head records (F-18)...');
  const teammateMap: Record<string, any> = {};
  const racesByConstructorAndRace = new Map<string, RawResult[]>();

  for (const r of rawResults) {
    if (r.positionText === 'DNS' || r.sharedCar) continue; // F-18: exclude sharedCar!
    const key = `${r.raceId}_${normalizeTeamId(r.constructorId)}`;
    if (!racesByConstructorAndRace.has(key)) racesByConstructorAndRace.set(key, []);
    racesByConstructorAndRace.get(key)!.push(r);
  }

  for (const entries of racesByConstructorAndRace.values()) {
    if (entries.length < 2) continue;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const eA = entries[i];
        const eB = entries[j];
        if (!eA.driverId || !eB.driverId || eA.driverId === eB.driverId) continue;

        const aFirst = eA.driverId < eB.driverId;
        const d1 = aFirst ? eA : eB;
        const d2 = aFirst ? eB : eA;
        const pairKey = `${d1.driverId}__${d2.driverId}`;

        if (!teammateMap[pairKey]) {
          teammateMap[pairKey] = {
            racesTogether: 0,
            bothFinishedWinsA: 0,
            bothFinishedWinsB: 0,
            allStartsWinsA: 0,
            allStartsWinsB: 0,
            outqualifiedA: 0,
            outqualifiedB: 0,
            pointsA: 0,
            pointsB: 0
          };
        }

        const rec = teammateMap[pairKey];
        rec.racesTogether++;

        // F-18: Split both finished vs all starts
        if (d1.positionNumber && d2.positionNumber) {
          if (d1.positionNumber < d2.positionNumber) {
            rec.bothFinishedWinsA++;
            rec.allStartsWinsA++;
          } else if (d2.positionNumber < d1.positionNumber) {
            rec.bothFinishedWinsB++;
            rec.allStartsWinsB++;
          }
        } else if (d1.positionNumber && !d2.positionNumber) {
          rec.allStartsWinsA++;
        } else if (!d1.positionNumber && d2.positionNumber) {
          rec.allStartsWinsB++;
        }

        if (d1.gridPositionNumber && d2.gridPositionNumber) {
          if (d1.gridPositionNumber < d2.gridPositionNumber) rec.outqualifiedA++;
          else if (d2.gridPositionNumber < d1.gridPositionNumber) rec.outqualifiedB++;
        }

        rec.pointsA += d1.points || 0;
        rec.pointsB += d2.points || 0;
      }
    }
  }

  // ── Process Seasons ──
  console.log('📅 Processing season progression & classifications...');
  const seasons: any[] = [];
  const seasonClassifications = new Map<number, any>();

  const driverStandingsByYear = new Map<number, RawSeasonDriverStanding>();
  for (const s of rawSeasonDriverStandings) {
    if (s.positionNumber === 1 || s.championshipWon) {
      driverStandingsByYear.set(s.year, s);
    }
  }

  const constructorStandingsByYear = new Map<number, RawSeasonConstructorStanding>();
  for (const s of rawSeasonConstructorStandings) {
    if (s.positionNumber === 1 || s.championshipWon) {
      constructorStandingsByYear.set(s.year, s);
    }
  }

  for (const s of rawSeasons) {
    const sRaces = (racesByYear.get(s.year) || []).sort((a, b) => a.round - b.round);
    const dChamp = driverStandingsByYear.get(s.year);
    const cChamp = constructorStandingsByYear.get(s.year);

    let champDriverId: string | null = dChamp ? dChamp.driverId : null;
    let champDriverName = 'TBD';
    if (champDriverId) {
      const dObj = rawDrivers.find(d => d.id === champDriverId);
      if (dObj) champDriverName = dObj.name;
    } else if (s.year === 2026) {
      champDriverName = 'Season In Progress';
    }

    let champTeamId: string | null = null;
    let champTeamName = 'Not Awarded (Pre-1958)';

    if (s.year >= 1958) {
      if (cChamp) {
        champTeamId = normalizeTeamId(cChamp.constructorId);
        const cObj = rawConstructors.find(c => c.id === cChamp.constructorId);
        champTeamName = cObj ? cObj.name : cChamp.constructorId;
      } else if (s.year === 2026) {
        champTeamName = 'Season In Progress';
        champTeamId = null;
      }
    }

    const notableEvents: string[] = [];
    const recordsBroken: string[] = [];

    if (s.year === 1950) {
      notableEvents.push('Inaugural FIA Formula One World Championship season at Silverstone.');
      recordsBroken.push('Nino Farina crowned first official World Champion in Alfa Romeo 158.');
    } else if (s.year === 1958) {
      notableEvents.push('Inaugural International Cup for F1 Manufacturers (Constructors Championship).');
      recordsBroken.push('Vanwall wins inaugural Constructors World Championship.');
    } else if (s.year === 1976) {
      notableEvents.push('Historic Hunt vs. Lauda title duel culminating at Fuji in torrential rain.');
    } else if (s.year === 1988) {
      notableEvents.push('McLaren-Honda MP4/4 dominates winning 15 of 16 Grand Prix.');
      recordsBroken.push('Ayrton Senna wins first World Championship.');
    } else if (s.year === 1994) {
      notableEvents.push('Tragic Imola weekend; introduction of massive modern cockpit safety reforms.');
      recordsBroken.push('Michael Schumacher clinches first title with Benetton-Ford.');
    } else if (s.year === 2004) {
      notableEvents.push('Scuderia Ferrari F2004 peak V10 supremacy.');
      recordsBroken.push('Michael Schumacher secures historic 7th World Championship.');
    } else if (s.year === 2020) {
      notableEvents.push('COVID-19 rescheduled European calendar with historic double-headers.');
      recordsBroken.push('Lewis Hamilton equals Schumacher with 7 World Championships.');
    } else if (s.year === 2023) {
      notableEvents.push('Red Bull Racing RB19 wins 21 of 22 Grands Prix.');
      recordsBroken.push('Max Verstappen sets all-time record 10 consecutive Grand Prix victories.');
    } else if (s.year === 2026) {
      notableEvents.push('New 2026 Engine & Aerodynamic Regulations: 50/50 Electric/ICE, 100% Sustainable Fuels, Active Aero.');
      notableEvents.push('Cadillac Formula 1 Team enters as 11th constructor; Audi takes over works team.');
      recordsBroken.push('Formula 1 expands to 11 constructors and 22 cars on the starting grid.');
    } else {
      notableEvents.push(`Formula 1 World Championship season ${s.year} decided over ${sRaces.length} Grand Prix.`);
      if (champDriverName && champDriverName !== 'TBD') {
        recordsBroken.push(`${champDriverName} wins World Drivers' Championship with ${dChamp?.points ?? 0} points.`);
      }
    }

    seasons.push({
      year: s.year,
      races: sRaces.length,
      championDriverId: champDriverId,
      championDriver: champDriverName,
      championTeamId: champTeamId,
      championTeam: champTeamName,
      notableEvents,
      recordsBroken
    });

    const rounds = sRaces.map(r => {
      const isCancelled = Boolean((r as any).scheduledLaps && (r as any).laps === 0);
      const isHalfPoints = HALF_POINT_RACES.has(`${s.year}_${r.round}`);
      const hasSprint = Boolean((r as any).sprintRaceDate || r.sprintDate);

      const roundResults = (resultsByRaceId.get(r.id) || []).map(res => {
        const d = rawDrivers.find(drv => drv.id === res.driverId);
        let status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ' | 'NC' = 'FINISHED';
        if (res.positionText === 'D' || res.positionText === 'R' || res.positionText === 'DNF') status = 'DNF';
        else if (res.positionText === 'W' || res.positionText === 'DNS') status = 'DNS';
        else if (res.positionText === 'DSQ') status = 'DSQ';
        else if (res.positionText === 'NC') status = 'NC';
        else if (!res.positionNumber) status = 'DNF';

        return {
          driverId: res.driverId,
          driverCode: DRIVER_SLUG_TO_CODE[res.driverId] || (res.driverId ? res.driverId.slice(0, 3).toUpperCase() : 'UNK'),
          driverName: d ? d.name : (res.driverId || 'Unknown'),
          constructorId: normalizeTeamId(res.constructorId),
          constructorName: rawConstructors.find(c => c.id === res.constructorId)?.name || res.constructorId,
          gridPosition: res.gridPositionNumber ?? null,
          finishPosition: res.positionNumber ?? null,
          positionText: res.positionText || (res.positionNumber ? String(res.positionNumber) : 'DNF'),
          points: res.points ?? 0,
          status,
          fastestLap: Boolean(res.fastestLap),
          sharedCar: Boolean(res.sharedCar)
        };
      });

      let sprintResults = undefined;
      if (hasSprint) {
        const roundSprints = (rawSprintResults || []).filter(sr => sr.raceId === r.id);
        if (roundSprints.length > 0) {
          sprintResults = roundSprints.map(sres => {
            const d = rawDrivers.find(drv => drv.id === sres.driverId);
            let status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ' | 'NC' = 'FINISHED';
            if (sres.positionText === 'DNF' || sres.positionText === 'R') status = 'DNF';
            else if (sres.positionText === 'DNS' || sres.positionText === 'W') status = 'DNS';
            else if (sres.positionText === 'DSQ') status = 'DSQ';
            else if (!sres.positionNumber) status = 'DNF';

            return {
              driverId: sres.driverId,
              driverCode: DRIVER_SLUG_TO_CODE[sres.driverId] || sres.driverId.slice(0, 3).toUpperCase(),
              driverName: d ? d.name : sres.driverId,
              constructorId: normalizeTeamId(sres.constructorId),
              constructorName: rawConstructors.find(c => c.id === sres.constructorId)?.name || sres.constructorId,
              gridPosition: (sres as any).gridPositionNumber ?? null,
              finishPosition: sres.positionNumber ?? null,
              positionText: sres.positionText || (sres.positionNumber ? String(sres.positionNumber) : 'DNF'),
              points: sres.points ?? 0,
              status,
              fastestLap: false,
              sharedCar: false
            };
          });
        }
      }

      return {
        round: r.round,
        date: r.date || '',
        name: r.officialName || `${s.year} Round ${r.round}`,
        circuitId: r.circuitId,
        circuitLayoutId: r.circuitLayoutId ? String(r.circuitLayoutId) : null,
        laps: (r as any).laps || 0,
        distanceKm: (r as any).distance || 0,
        isCancelled,
        isHalfPoints,
        hasSprint,
        results: roundResults,
        sprintResults
      };
    });

    const standingsProgression = sRaces.map(r => {
      const roundStandings = rawDriverStandings
        .filter(st => st.raceId === r.id)
        .sort((a, b) => (a.positionNumber || 99) - (b.positionNumber || 99))
        .slice(0, 10)
        .map(st => {
          const d = rawDrivers.find(drv => drv.id === st.driverId);
          return {
            driverId: st.driverId,
            driverCode: DRIVER_SLUG_TO_CODE[st.driverId] || st.driverId.slice(0, 3).toUpperCase(),
            driverName: d ? d.name : st.driverId,
            constructorId: 'historic',
            points: st.points || 0,
            position: st.positionNumber || 1
          };
        });
      return {
        round: r.round,
        standings: roundStandings
      };
    });

    seasonClassifications.set(s.year, {
      year: s.year,
      racesCount: sRaces.length,
      championDriver: champDriverName,
      championTeam: champTeamName,
      rounds,
      standingsProgression
    });
  }

  const meta = {
    f1dbVersion: releaseTag,
    syncedAt: new Date().toISOString(),
    license: 'CC-BY-4.0',
    attribution: 'Historical racing data curated from F1DB (https://github.com/f1db/f1db) under CC-BY-4.0 and bacinger/f1-circuits under MIT.',
    recordCounts: {
      seasons: seasons.length,
      constructors: constructors.length,
      drivers: drivers.length,
      circuits: circuits.length
    }
  };

  return {
    seasons,
    constructors,
    drivers,
    circuits,
    meta,
    circuitSplines,
    seasonClassifications,
    teammates: teammateMap
  };
}
