/**
 * F1 // ARCHIVE — Telemetry Pack Generator (Tier 1 Precomputed Offline Data)
 * Generates compact, downsampled (180–220 points) sector-anchored telemetry packs
 * and stint pace strategy datasets for 6 iconic showdowns.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TELEMETRY_DIR = path.join(ROOT_DIR, 'public', 'data', 'telemetry');

if (!fs.existsSync(TELEMETRY_DIR)) {
  fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
}

// Corner definitions for realistic speed profiling
function generateLapSamples(lapDistance, lapTimeSeconds, s1DistFrac, s2DistFrac, s1Time, s2Time, maxSpeed, minSpeed, cornerCount, driverFactor = 1.0) {
  const numSamples = 200;
  const samples = [];
  const s3Time = lapTimeSeconds - s1Time - s2Time;

  for (let i = 0; i < numSamples; i++) {
    const dFrac = i / (numSamples - 1);
    const dMeters = Math.round(dFrac * lapDistance);

    // Sector-anchored elapsed time calculation
    let elapsed = 0;
    if (dFrac <= s1DistFrac) {
      const alpha = dFrac / s1DistFrac;
      elapsed = alpha * s1Time;
    } else if (dFrac <= s2DistFrac) {
      const alpha = (dFrac - s1DistFrac) / (s2DistFrac - s1DistFrac);
      elapsed = s1Time + alpha * s2Time;
    } else {
      const alpha = (dFrac - s2DistFrac) / (1.0 - s2DistFrac);
      elapsed = s1Time + s2Time + alpha * s3Time;
    }

    // Realistic corner & straight oscillating velocity profile
    const cornerFreq = cornerCount * Math.PI * 2;
    const wave = (Math.cos(dFrac * cornerFreq) + 1) / 2; // 0 (slow corner) to 1 (high speed straight)
    
    // Speed in km/h
    const baseSpeed = minSpeed + wave * (maxSpeed - minSpeed);
    const speed = Math.round(Math.min(maxSpeed, Math.max(minSpeed, baseSpeed * driverFactor)));

    // Throttle & Brake
    const throttle = wave > 0.4 ? Math.min(100, Math.round(wave * 105)) : 0;
    const brake = wave <= 0.35 ? Math.min(100, Math.round((0.35 - wave) * 280)) : 0;

    // Transmission Gear (1 to 8 based on speed)
    let gear = 8;
    if (speed < 90) gear = 2;
    else if (speed < 140) gear = 3;
    else if (speed < 190) gear = 4;
    else if (speed < 240) gear = 5;
    else if (speed < 280) gear = 6;
    else if (speed < 315) gear = 7;

    const rpm = Math.round(10200 + (speed / maxSpeed) * 2800);
    const drs = wave > 0.75 && (dFrac > 0.25 && dFrac < 0.45 || dFrac > 0.78);

    samples.push({
      distanceFraction: Number(dFrac.toFixed(4)),
      distanceMeters: dMeters,
      elapsedTime: Number(elapsed.toFixed(3)),
      speed,
      throttle,
      brake,
      gear,
      rpm,
      drs
    });
  }

  return samples;
}

// Compute 25 mini-sectors
function compute25MiniSectors(samplesA, samplesB) {
  const miniSectors = [];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const startFrac = i / count;
    const endFrac = (i + 1) / count;

    // Find sample closest to end of mini-sector
    const sA = samplesA.find(s => s.distanceFraction >= endFrac) || samplesA[samplesA.length - 1];
    const sB = samplesB.find(s => s.distanceFraction >= endFrac) || samplesB[samplesB.length - 1];

    const delta = sB.elapsedTime - sA.elapsedTime;
    let fasterDriver = 'TIE';
    if (delta > 0.015) fasterDriver = 'A';
    else if (delta < -0.015) fasterDriver = 'B';

    miniSectors.push({
      index: i + 1,
      startDistanceFraction: Number(startFrac.toFixed(3)),
      endDistanceFraction: Number(endFrac.toFixed(3)),
      fasterDriver,
      deltaSeconds: Number(delta.toFixed(3)),
      speedDeltaKmh: Math.round(sA.speed - sB.speed)
    });
  }

  return miniSectors;
}

// Generate realistic Stint Pace datasets for Strategy Analytics
function generateStints(sessionFastest, totalLaps) {
  const fuelBurnPerLap = 1.65; // kg/lap
  const fuelEffectPerKg = 0.038; // sec/kg
  const startFuel = totalLaps * fuelBurnPerLap;

  // Driver A: Medium -> Hard strategy
  const driverAStints = [
    {
      driverCode: 'VER',
      driverName: 'Max Verstappen',
      teamColor: '#0808EF',
      compound: 'MEDIUM',
      startLap: 1,
      endLap: 22,
      basePaceDelta: 1.4,
      degSlope: 0.082
    },
    {
      driverCode: 'VER',
      driverName: 'Max Verstappen',
      teamColor: '#0808EF',
      compound: 'HARD',
      startLap: 23,
      endLap: totalLaps,
      basePaceDelta: 1.8,
      degSlope: 0.058
    }
  ];

  // Driver B: Soft -> Medium -> Soft strategy
  const driverBStints = [
    {
      driverCode: 'NOR',
      driverName: 'Lando Norris',
      teamColor: '#FF8000',
      compound: 'SOFT',
      startLap: 1,
      endLap: 16,
      basePaceDelta: 0.9,
      degSlope: 0.115
    },
    {
      driverCode: 'NOR',
      driverName: 'Lando Norris',
      teamColor: '#FF8000',
      compound: 'MEDIUM',
      startLap: 17,
      endLap: 38,
      basePaceDelta: 1.5,
      degSlope: 0.078
    },
    {
      driverCode: 'NOR',
      driverName: 'Lando Norris',
      teamColor: '#FF8000',
      compound: 'MEDIUM',
      startLap: 39,
      endLap: totalLaps,
      basePaceDelta: 1.4,
      degSlope: 0.072
    }
  ];

  const allStintConfigs = [...driverAStints, ...driverBStints];

  const processedStints = allStintConfigs.map(stintCfg => {
    const laps = [];
    const stintLength = stintCfg.endLap - stintCfg.startLap + 1;

    for (let l = stintCfg.startLap; l <= stintCfg.endLap; l++) {
      const tyreAge = l - stintCfg.startLap + 1;
      const fuelRemainingKg = Math.max(5, startFuel - (l * fuelBurnPerLap));
      const fuelCorrection = (startFuel - fuelRemainingKg) * fuelEffectPerKg;

      const isPitLap = l === stintCfg.startLap || l === stintCfg.endLap;
      const isSafetyCar = (l >= 12 && l <= 14); // Simulated VSC period
      
      // Degradation added
      const tyreDegEffect = (tyreAge - 1) * stintCfg.degSlope;
      const noise = ((l * 17) % 7 - 3) * 0.04; // Deterministic subtle lap noise

      let rawLapTime = sessionFastest + stintCfg.basePaceDelta + tyreDegEffect - fuelCorrection + noise;
      if (isPitLap) rawLapTime += 21.5;
      if (isSafetyCar) rawLapTime += 34.0;

      const isOutlier = isPitLap || isSafetyCar || (rawLapTime > sessionFastest * 1.07);
      const correctedLapTime = rawLapTime + fuelCorrection;

      laps.push({
        lapNumber: l,
        driverCode: stintCfg.driverCode,
        compound: stintCfg.compound,
        tyreAgeLaps: tyreAge,
        rawLapTimeSeconds: Number(rawLapTime.toFixed(3)),
        fuelLoadKg: Number(fuelRemainingKg.toFixed(1)),
        fuelCorrectionSeconds: Number(fuelCorrection.toFixed(3)),
        correctedLapTimeSeconds: Number(correctedLapTime.toFixed(3)),
        isPitLap,
        isSafetyCar,
        isOutlier
      });
    }

    const cleanLaps = laps.filter(lap => !lap.isOutlier);
    const avgRaw = cleanLaps.reduce((acc, lap) => acc + lap.rawLapTimeSeconds, 0) / (cleanLaps.length || 1);
    const avgCorrected = cleanLaps.reduce((acc, lap) => acc + lap.correctedLapTimeSeconds, 0) / (cleanLaps.length || 1);

    return {
      driverCode: stintCfg.driverCode,
      driverName: stintCfg.driverName,
      teamColor: stintCfg.teamColor,
      compound: stintCfg.compound,
      startLap: stintCfg.startLap,
      endLap: stintCfg.endLap,
      totalLaps: stintLength,
      cleanLapsCount: cleanLaps.length,
      avgRawPace: Number(avgRaw.toFixed(3)),
      avgFuelCorrectedPace: Number(avgCorrected.toFixed(3)),
      degradationSlopeSecPerLap: stintCfg.degSlope,
      laps
    };
  });

  return {
    sessionFastestLap: sessionFastest,
    totalLaps,
    fuelBurnRatePerLapKg: fuelBurnPerLap,
    fuelEffectPerKgSec: fuelEffectPerKg,
    stints: processedStints
  };
}

// ── Define 6 Canonical Showdowns ──
const SHOWDOWNS = [
  {
    slug: 'silverstone-2024-ham-vs-ver',
    title: '2024 British Grand Prix — Hamilton vs. Verstappen',
    subtitle: 'Silverstone Grand Prix • Historic 9th Home Victory Lap Battle',
    year: 2024,
    session: 'Race',
    circuitId: 'silverstone',
    circuitName: 'Silverstone Circuit',
    lapDistanceMeters: 5891,
    sectorBoundaries: [0.31, 0.68, 1.0],
    driverA: {
      driverId: 'HAM',
      driverCode: 'HAM',
      driverName: 'Lewis Hamilton',
      teamId: 'mercedes',
      teamName: 'Mercedes-AMG PETRONAS',
      teamColor: '#00D2BE',
      secondaryColor: '#FFFFFF',
      lapTime: '1:28.489',
      lapTimeSeconds: 88.489,
      sector1Time: 27.810,
      sector2Time: 34.920,
      sector3Time: 25.759,
      topSpeed: 334,
      avgSpeed: 239.7,
      maxSpeed: 336,
      minSpeed: 104,
      cornerCount: 18,
      driverFactor: 1.0
    },
    driverB: {
      driverId: 'VER',
      driverCode: 'VER',
      driverName: 'Max Verstappen',
      teamId: 'redbull',
      teamName: 'Red Bull Racing',
      teamColor: '#0808EF',
      secondaryColor: '#FCD116',
      lapTime: '1:28.742',
      lapTimeSeconds: 88.742,
      sector1Time: 27.915,
      sector2Time: 34.880,
      sector3Time: 25.947,
      topSpeed: 338,
      avgSpeed: 239.0,
      maxSpeed: 338,
      minSpeed: 101,
      cornerCount: 18,
      driverFactor: 0.997
    },
    totalRaceLaps: 52
  },
  {
    slug: 'monaco-2024-lec-vs-pia',
    title: '2024 Monaco Grand Prix — Leclerc vs. Piastri',
    subtitle: 'Circuit de Monaco • Q3 Pole Position Precision Duel',
    year: 2024,
    session: 'Q3',
    circuitId: 'monaco',
    circuitName: 'Circuit de Monaco',
    lapDistanceMeters: 3337,
    sectorBoundaries: [0.32, 0.69, 1.0],
    driverA: {
      driverId: 'LEC',
      driverCode: 'LEC',
      driverName: 'Charles Leclerc',
      teamId: 'ferrari',
      teamName: 'Scuderia Ferrari',
      teamColor: '#E8002D',
      secondaryColor: '#FFE500',
      lapTime: '1:10.270',
      lapTimeSeconds: 70.270,
      sector1Time: 18.910,
      sector2Time: 33.720,
      sector3Time: 17.640,
      topSpeed: 295,
      avgSpeed: 170.9,
      maxSpeed: 295,
      minSpeed: 52,
      cornerCount: 19,
      driverFactor: 1.0
    },
    driverB: {
      driverId: 'PIA',
      driverCode: 'PIA',
      driverName: 'Oscar Piastri',
      teamId: 'mclaren',
      teamName: 'McLaren Formula 1 Team',
      teamColor: '#FF8000',
      secondaryColor: '#FFFFFF',
      lapTime: '1:10.424',
      lapTimeSeconds: 70.424,
      sector1Time: 19.020,
      sector2Time: 33.680,
      sector3Time: 17.724,
      topSpeed: 293,
      avgSpeed: 170.5,
      maxSpeed: 294,
      minSpeed: 51,
      cornerCount: 19,
      driverFactor: 0.998
    },
    totalRaceLaps: 78
  },
  {
    slug: 'spa-2024-ver-vs-nor',
    title: '2024 Belgian Grand Prix — Verstappen vs. Norris',
    subtitle: 'Circuit de Spa-Francorchamps • Eau Rouge & Kemmel Straight Shootout',
    year: 2024,
    session: 'Q3',
    circuitId: 'spa-francorchamps',
    circuitName: 'Circuit de Spa-Francorchamps',
    lapDistanceMeters: 7004,
    sectorBoundaries: [0.30, 0.72, 1.0],
    driverA: {
      driverId: 'VER',
      driverCode: 'VER',
      driverName: 'Max Verstappen',
      teamId: 'redbull',
      teamName: 'Red Bull Racing',
      teamColor: '#0808EF',
      secondaryColor: '#FCD116',
      lapTime: '1:44.825',
      lapTimeSeconds: 104.825,
      sector1Time: 30.720,
      sector2Time: 44.810,
      sector3Time: 29.295,
      topSpeed: 348,
      avgSpeed: 240.5,
      maxSpeed: 350,
      minSpeed: 75,
      cornerCount: 19,
      driverFactor: 1.0
    },
    driverB: {
      driverId: 'NOR',
      driverCode: 'NOR',
      driverName: 'Lando Norris',
      teamId: 'mclaren',
      teamName: 'McLaren Formula 1 Team',
      teamColor: '#FF8000',
      secondaryColor: '#FFFFFF',
      lapTime: '1:45.050',
      lapTimeSeconds: 105.050,
      sector1Time: 30.650,
      sector2Time: 45.010,
      sector3Time: 29.390,
      topSpeed: 344,
      avgSpeed: 240.0,
      maxSpeed: 346,
      minSpeed: 78,
      cornerCount: 19,
      driverFactor: 0.998
    },
    totalRaceLaps: 44
  },
  {
    slug: 'monza-2024-lec-vs-pia',
    title: '2024 Italian Grand Prix — Leclerc vs. Piastri',
    subtitle: 'Autodromo Nazionale Monza • Temple of Speed Slipstream Duel',
    year: 2024,
    session: 'Race',
    circuitId: 'monza',
    circuitName: 'Autodromo Nazionale Monza',
    lapDistanceMeters: 5793,
    sectorBoundaries: [0.36, 0.70, 1.0],
    driverA: {
      driverId: 'LEC',
      driverCode: 'LEC',
      driverName: 'Charles Leclerc',
      teamId: 'ferrari',
      teamName: 'Scuderia Ferrari',
      teamColor: '#E8002D',
      secondaryColor: '#FFE500',
      lapTime: '1:21.432',
      lapTimeSeconds: 81.432,
      sector1Time: 27.240,
      sector2Time: 27.410,
      sector3Time: 26.782,
      topSpeed: 356,
      avgSpeed: 256.2,
      maxSpeed: 356,
      minSpeed: 78,
      cornerCount: 11,
      driverFactor: 1.0
    },
    driverB: {
      driverId: 'PIA',
      driverCode: 'PIA',
      driverName: 'Oscar Piastri',
      teamId: 'mclaren',
      teamName: 'McLaren Formula 1 Team',
      teamColor: '#FF8000',
      secondaryColor: '#FFFFFF',
      lapTime: '1:21.614',
      lapTimeSeconds: 81.614,
      sector1Time: 27.180,
      sector2Time: 27.560,
      sector3Time: 26.874,
      topSpeed: 353,
      avgSpeed: 255.6,
      maxSpeed: 354,
      minSpeed: 79,
      cornerCount: 11,
      driverFactor: 0.998
    },
    totalRaceLaps: 53
  },
  {
    slug: 'interlagos-2024-ver-vs-nor',
    title: '2024 São Paulo Grand Prix — Verstappen vs. Norris',
    subtitle: 'Autódromo José Carlos Pace • Wet Weather Masterclass',
    year: 2024,
    session: 'Race',
    circuitId: 'interlagos',
    circuitName: 'Autódromo de Interlagos',
    lapDistanceMeters: 4309,
    sectorBoundaries: [0.33, 0.67, 1.0],
    driverA: {
      driverId: 'VER',
      driverCode: 'VER',
      driverName: 'Max Verstappen',
      teamId: 'redbull',
      teamName: 'Red Bull Racing',
      teamColor: '#0808EF',
      secondaryColor: '#FCD116',
      lapTime: '1:20.472',
      lapTimeSeconds: 80.472,
      sector1Time: 19.820,
      sector2Time: 36.410,
      sector3Time: 24.242,
      topSpeed: 326,
      avgSpeed: 192.7,
      maxSpeed: 328,
      minSpeed: 95,
      cornerCount: 15,
      driverFactor: 1.0
    },
    driverB: {
      driverId: 'NOR',
      driverCode: 'NOR',
      driverName: 'Lando Norris',
      teamId: 'mclaren',
      teamName: 'McLaren Formula 1 Team',
      teamColor: '#FF8000',
      secondaryColor: '#FFFFFF',
      lapTime: '1:21.285',
      lapTimeSeconds: 81.285,
      sector1Time: 20.080,
      sector2Time: 36.850,
      sector3Time: 24.355,
      topSpeed: 322,
      avgSpeed: 190.8,
      maxSpeed: 324,
      minSpeed: 92,
      cornerCount: 15,
      driverFactor: 0.990
    },
    totalRaceLaps: 69
  },
  {
    slug: 'madrid-2026-sim-alo-vs-sai',
    title: '2026 Spanish Grand Prix (Madrid) — Alonso vs. Sainz',
    subtitle: 'Circuito de Madrid • 2026 Active Aero & Manual Override Battle',
    year: 2026,
    session: 'Q3',
    circuitId: 'madring',
    circuitName: 'Circuito de Madrid (Madring)',
    lapDistanceMeters: 5474,
    sectorBoundaries: [0.34, 0.66, 1.0],
    driverA: {
      driverId: 'ALO',
      driverCode: 'ALO',
      driverName: 'Fernando Alonso',
      teamId: 'astonmartin',
      teamName: 'Aston Martin Aramco',
      teamColor: '#00594F',
      secondaryColor: '#CEDC00',
      lapTime: '1:17.310',
      lapTimeSeconds: 77.310,
      sector1Time: 25.820,
      sector2Time: 26.150,
      sector3Time: 25.340,
      topSpeed: 342,
      avgSpeed: 255.0,
      maxSpeed: 344,
      minSpeed: 88,
      cornerCount: 20,
      driverFactor: 1.0
    },
    driverB: {
      driverId: 'SAI',
      driverCode: 'SAI',
      driverName: 'Carlos Sainz',
      teamId: 'williams',
      teamName: 'Williams Racing',
      teamColor: '#005AFF',
      secondaryColor: '#FFFFFF',
      lapTime: '1:17.585',
      lapTimeSeconds: 77.585,
      sector1Time: 25.940,
      sector2Time: 26.210,
      sector3Time: 25.435,
      topSpeed: 340,
      avgSpeed: 254.1,
      maxSpeed: 342,
      minSpeed: 86,
      cornerCount: 20,
      driverFactor: 0.996
    },
    totalRaceLaps: 55
  }
];

console.log('⚡ Generating Tier 1 Precomputed Offline Telemetry Packs...');
const indexList = [];

for (const cfg of SHOWDOWNS) {
  const samplesA = generateLapSamples(
    cfg.lapDistanceMeters,
    cfg.driverA.lapTimeSeconds,
    cfg.sectorBoundaries[0],
    cfg.sectorBoundaries[1],
    cfg.driverA.sector1Time,
    cfg.driverA.sector2Time,
    cfg.driverA.maxSpeed,
    cfg.driverA.minSpeed,
    cfg.driverA.cornerCount,
    cfg.driverA.driverFactor
  );

  const samplesB = generateLapSamples(
    cfg.lapDistanceMeters,
    cfg.driverB.lapTimeSeconds,
    cfg.sectorBoundaries[0],
    cfg.sectorBoundaries[1],
    cfg.driverB.sector1Time,
    cfg.driverB.sector2Time,
    cfg.driverB.maxSpeed,
    cfg.driverB.minSpeed,
    cfg.driverB.cornerCount,
    cfg.driverB.driverFactor
  );

  const miniSectors25 = compute25MiniSectors(samplesA, samplesB);

  const showdown = {
    slug: cfg.slug,
    title: cfg.title,
    subtitle: cfg.subtitle,
    year: cfg.year,
    session: cfg.session,
    circuitId: cfg.circuitId,
    circuitName: cfg.circuitName,
    lapDistanceMeters: cfg.lapDistanceMeters,
    sectorBoundaries: cfg.sectorBoundaries,
    driverA: {
      driverId: cfg.driverA.driverId,
      driverCode: cfg.driverA.driverCode,
      driverName: cfg.driverA.driverName,
      teamId: cfg.driverA.teamId,
      teamName: cfg.driverA.teamName,
      teamColor: cfg.driverA.teamColor,
      secondaryColor: cfg.driverA.secondaryColor,
      lapTime: cfg.driverA.lapTime,
      lapTimeSeconds: cfg.driverA.lapTimeSeconds,
      sector1Time: cfg.driverA.sector1Time,
      sector2Time: cfg.driverA.sector2Time,
      sector3Time: cfg.driverA.sector3Time,
      topSpeed: cfg.driverA.topSpeed,
      avgSpeed: cfg.driverA.avgSpeed,
      samples: samplesA
    },
    driverB: {
      driverId: cfg.driverB.driverId,
      driverCode: cfg.driverB.driverCode,
      driverName: cfg.driverB.driverName,
      teamId: cfg.driverB.teamId,
      teamName: cfg.driverB.teamName,
      teamColor: cfg.driverB.teamColor,
      secondaryColor: cfg.driverB.secondaryColor,
      lapTime: cfg.driverB.lapTime,
      lapTimeSeconds: cfg.driverB.lapTimeSeconds,
      sector1Time: cfg.driverB.sector1Time,
      sector2Time: cfg.driverB.sector2Time,
      sector3Time: cfg.driverB.sector3Time,
      topSpeed: cfg.driverB.topSpeed,
      avgSpeed: cfg.driverB.avgSpeed,
      samples: samplesB
    },
    miniSectors25,
    feedAvailability: 'full'
  };

  const filePath = path.join(TELEMETRY_DIR, `${cfg.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(showdown));
  const fileSizeKb = Math.round(fs.statSync(filePath).size / 1024);
  console.log(`  ✓ Generated ${cfg.slug}.json (${fileSizeKb} KB)`);

  // Generate strategy dataset
  const strategyData = generateStints(cfg.driverA.lapTimeSeconds, cfg.totalRaceLaps);
  const strategyFile = path.join(TELEMETRY_DIR, `strategy-${cfg.slug}.json`);
  fs.writeFileSync(strategyFile, JSON.stringify(strategyData));

  indexList.push({
    slug: cfg.slug,
    title: cfg.title,
    subtitle: cfg.subtitle,
    year: cfg.year,
    session: cfg.session,
    circuitId: cfg.circuitId,
    circuitName: cfg.circuitName,
    driverACode: cfg.driverA.driverCode,
    driverBCode: cfg.driverB.driverCode,
    driverAName: cfg.driverA.driverName,
    driverBName: cfg.driverB.driverName,
    driverAColor: cfg.driverA.teamColor,
    driverBColor: cfg.driverB.teamColor,
    lapTimeA: cfg.driverA.lapTime,
    lapTimeB: cfg.driverB.lapTime,
    delta: Number((cfg.driverB.lapTimeSeconds - cfg.driverA.lapTimeSeconds).toFixed(3)),
    feedAvailability: 'full'
  });
}

// Write telemetry index
fs.writeFileSync(path.join(TELEMETRY_DIR, 'index.json'), JSON.stringify(indexList, null, 2));
console.log(`✅ Precomputed ${indexList.length} telemetry packs in public/data/telemetry/`);
