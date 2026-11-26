import uPlot from 'uplot';
import { getCuratedCorners } from '../../data/circuitCorners';
import { F1_CHART_THEME } from '../../components/charts/f1ChartTheme';
import type { TelemetryShowdown, TelemetrySample } from '../../types/telemetry';
import type { ValidatedTelemetryPack } from './telemetryPackSchema';

export type AnyTelemetryPack = TelemetryShowdown | ValidatedTelemetryPack;

export interface AlignedTelemetryData {
  distNorm: number[];
  speedA: number[];
  speedB: number[];
  deltaSec: number[];
  throttleA: number[];
  brakeA: number[];
  throttleB: number[];
  brakeB: number[];
  gearA: number[];
  gearB: number[];
}

/**
 * Extracts and aligns columnar telemetry channels from a pack.
 * Guarantees that distNorm is strictly monotonic increasing and all arrays have equal length.
 */
export function buildAlignedTelemetryData(pack: AnyTelemetryPack): AlignedTelemetryData {
  const samplesA = pack.driverA.samples;
  const samplesB = pack.driverB.samples;
  const count = Math.min(samplesA.length, samplesB.length);

  const distNorm: number[] = [];
  const speedA: number[] = [];
  const speedB: number[] = [];
  const deltaSec: number[] = [];
  const throttleA: number[] = [];
  const brakeA: number[] = [];
  const throttleB: number[] = [];
  const brakeB: number[] = [];
  const gearA: number[] = [];
  const gearB: number[] = [];

  let lastDist = -1;

  for (let i = 0; i < count; i++) {
    const sA = samplesA[i];
    const sB = samplesB[i];

    // Ensure strictly monotonic distance for uPlot
    let d = Number(sA.distanceFraction.toFixed(5));
    if (d <= lastDist) {
      d = Number((lastDist + 0.0001).toFixed(5));
    }
    lastDist = d;

    distNorm.push(d);
    speedA.push(Number(sA.speed.toFixed(1)));
    speedB.push(Number(sB.speed.toFixed(1)));

    // Delta: Driver A time - Driver B time
    // Negative = Driver A is faster / ahead
    const dt = Number((sA.elapsedTime - sB.elapsedTime).toFixed(3));
    deltaSec.push(dt);

    throttleA.push(Math.round(sA.throttle));
    brakeA.push(Math.round(sA.brake));
    throttleB.push(Math.round(sB.throttle));
    brakeB.push(Math.round(sB.brake));

    gearA.push(sA.gear ?? 0);
    gearB.push(sB.gear ?? 0);
  }

  return {
    distNorm,
    speedA,
    speedB,
    deltaSec,
    throttleA,
    brakeA,
    throttleB,
    brakeB,
    gearA,
    gearB,
  };
}

const COMMON_AXIS_OPTS: uPlot.Axis = {
  stroke: F1_CHART_THEME.axisLabel,
  grid: {
    stroke: F1_CHART_THEME.gridLine,
    width: 1,
  },
  ticks: {
    stroke: F1_CHART_THEME.border,
    width: 1,
    size: 4,
  },
  font: `10px ${F1_CHART_THEME.fontMono}`,
};

const COMMON_CURSOR_OPTS: uPlot.Cursor = {
  sync: {
    key: 'f1-telemetry',
    setSeries: true,
  },
  drag: { x: false, y: false },
  points: {
    show: true,
    size: 6,
    width: 2,
    stroke: '#FFFFFF',
    fill: F1_CHART_THEME.crimson,
  },
};

/**
 * 1. Speed Chart Options (km/h) with Curated Corner Apex Vertical Markers
 */
export function buildSpeedChartOptions(
  pack: AnyTelemetryPack,
  getActiveScrubProgress?: () => number | null
): uPlot.Options {
  const corners = getCuratedCorners(pack.circuitId);

  return {
    title: 'SPEED (KM/H)',
    width: 600,
    height: 160,
    cursor: COMMON_CURSOR_OPTS,
    scales: {
      x: { time: false },
      y: { auto: true },
    },
    axes: [
      {
        ...COMMON_AXIS_OPTS,
        values: (self, splits) => splits.map((v) => `${Math.round(v * 100)}%`),
      },
      {
        ...COMMON_AXIS_OPTS,
        size: 45,
        values: (self, splits) => splits.map((v) => `${Math.round(v)}`),
      },
    ],
    series: [
      {},
      {
        label: pack.driverA.driverCode,
        stroke: pack.driverA.teamColor,
        width: 2,
      },
      {
        label: pack.driverB.driverCode,
        stroke: pack.driverB.teamColor || '#FFFFFF',
        width: 2,
      },
    ],
    hooks: {
      draw: [
        (u) => {
          const ctx = u.ctx;
          // Draw subtle vertical corner tick lines
          if (corners.length > 0) {
            ctx.save();
            ctx.font = `9px ${F1_CHART_THEME.fontMono}`;
            for (const c of corners) {
              const xPos = Math.round(u.valToPos(c.t, 'x', true));
              if (xPos >= u.bbox.left && xPos <= u.bbox.left + u.bbox.width) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(xPos, u.bbox.top);
                ctx.lineTo(xPos, u.bbox.top + u.bbox.height);
                ctx.stroke();

                ctx.fillStyle = F1_CHART_THEME.axisLabel;
                ctx.fillText(`T${c.number}`, xPos + 2, u.bbox.top + 10);
              }
            }
            ctx.restore();
          }

          // Active playback / scrub progress marker
          if (getActiveScrubProgress) {
            const scrubP = getActiveScrubProgress();
            if (scrubP != null && scrubP >= 0 && scrubP <= 1) {
              const xPos = Math.round(u.valToPos(scrubP, 'x', true));
              ctx.save();
              ctx.strokeStyle = F1_CHART_THEME.crimson;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(xPos, u.bbox.top);
              ctx.lineTo(xPos, u.bbox.top + u.bbox.height);
              ctx.stroke();
              ctx.restore();
            }
          }
        },
      ],
    },
  };
}

/**
 * 2. Time Delta Chart Options (s) with dashed 0.000s baseline
 */
export function buildDeltaChartOptions(pack: AnyTelemetryPack): uPlot.Options {
  return {
    title: `DELTA SEC (${pack.driverA.driverCode} vs ${pack.driverB.driverCode})`,
    width: 600,
    height: 100,
    cursor: COMMON_CURSOR_OPTS,
    scales: {
      x: { time: false },
      y: { auto: true },
    },
    axes: [
      {
        ...COMMON_AXIS_OPTS,
        show: false, // shared X hidden for compact stack
      },
      {
        ...COMMON_AXIS_OPTS,
        size: 45,
        values: (self, splits) =>
          splits.map((v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))),
      },
    ],
    series: [
      {},
      {
        label: 'Δ TIME',
        stroke: '#38BDF8',
        width: 1.8,
      },
    ],
    hooks: {
      draw: [
        (u) => {
          // Zero baseline hook
          const yZero = Math.round(u.valToPos(0, 'y', true));
          if (yZero >= u.bbox.top && yZero <= u.bbox.top + u.bbox.height) {
            const ctx = u.ctx;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(u.bbox.left, yZero);
            ctx.lineTo(u.bbox.left + u.bbox.width, yZero);
            ctx.stroke();
            ctx.restore();
          }
        },
      ],
    },
  };
}

/**
 * 3. Throttle & Brake Chart Options (%)
 */
export function buildPedalChartOptions(pack: AnyTelemetryPack): uPlot.Options {
  return {
    title: 'THROTTLE & BRAKE (%)',
    width: 600,
    height: 110,
    cursor: COMMON_CURSOR_OPTS,
    scales: {
      x: { time: false },
      y: { min: 0, max: 100 },
    },
    axes: [
      {
        ...COMMON_AXIS_OPTS,
        show: false,
      },
      {
        ...COMMON_AXIS_OPTS,
        size: 45,
        values: (self, splits) => splits.map((v) => `${Math.round(v)}%`),
      },
    ],
    series: [
      {},
      {
        label: `THR ${pack.driverA.driverCode}`,
        stroke: '#22C55E',
        width: 1.5,
      },
      {
        label: `BRK ${pack.driverA.driverCode}`,
        stroke: '#EF4444',
        fill: 'rgba(239, 68, 68, 0.22)',
        width: 1.5,
      },
      {
        label: `THR ${pack.driverB.driverCode}`,
        stroke: 'rgba(34, 197, 94, 0.5)',
        width: 1.2,
      },
      {
        label: `BRK ${pack.driverB.driverCode}`,
        stroke: 'rgba(239, 68, 68, 0.5)',
        width: 1.2,
      },
    ],
  };
}

/**
 * 4. Gear Chart Options (1-8) with Stepped Path
 */
export function buildGearChartOptions(pack: AnyTelemetryPack): uPlot.Options {
  const steppedPath = uPlot.paths?.stepped ? uPlot.paths.stepped({ align: 1 }) : undefined;

  return {
    title: 'GEAR',
    width: 600,
    height: 90,
    cursor: COMMON_CURSOR_OPTS,
    scales: {
      x: { time: false },
      y: { min: 1, max: 8 },
    },
    axes: [
      {
        ...COMMON_AXIS_OPTS,
        values: (self, splits) => splits.map((v) => `${Math.round(v * 100)}%`),
      },
      {
        ...COMMON_AXIS_OPTS,
        size: 45,
        values: (self, splits) => splits.map((v) => `G${Math.round(v)}`),
      },
    ],
    series: [
      {},
      {
        label: `GEAR ${pack.driverA.driverCode}`,
        stroke: pack.driverA.teamColor,
        paths: steppedPath,
        width: 1.8,
      },
      {
        label: `GEAR ${pack.driverB.driverCode}`,
        stroke: pack.driverB.teamColor || '#FFFFFF',
        paths: steppedPath,
        width: 1.8,
      },
    ],
  };
}
