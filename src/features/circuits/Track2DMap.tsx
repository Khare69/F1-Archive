import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { RibbonColorMode } from './geometry/circuitRibbonBuilder';

export interface CornerMarkerItem {
  number: number;
  name: string;
  t: number;
  speedKmh?: number;
  gear?: number;
  brakingG?: number | null;
  lateralG?: number | null;
  brakingDistanceM?: number | null;
  notes?: string;
  famousOvertake?: string;
  isOvertakingZone?: boolean;
  isHighDownforce?: boolean;
  isAutoDetected?: boolean;
}

export interface Track2DMapProps {
  circuitName: string;
  coordinates: [number, number, number][];
  elevationSource?: 'open-meteo-srtm' | 'unavailable';
  colorMode?: RibbonColorMode;
  corners?: CornerMarkerItem[];
  selectedCornerNumber?: number | null;
  onSelectCorner?: (cornerNumber: number | null) => void;
  filterMode?: 'all' | 'overtaking' | 'high_downforce';
}

export const Track2DMap: React.FC<Track2DMapProps> = ({
  circuitName,
  coordinates,
  colorMode = 'sectors',
  corners = [],
  selectedCornerNumber = null,
  onSelectCorner,
  filterMode = 'all'
}) => {
  // 1. Build smooth Catmull-Rom 2D curve and projection bounding box
  const { pathSegments, project, cornerPoints, startFinish, chevron } = useMemo(() => {
    if (!coordinates || coordinates.length < 3) {
      return {
        pathSegments: [],
        project: (x: number, z: number) => ({ x: 400, y: 280 }),
        cornerPoints: [],
        startFinish: null,
        chevron: null
      };
    }

    const xs = coordinates.map((c) => c[0]);
    const zs = coordinates.map((c) => c[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;

    const padX = 64;
    const padY = 56;
    const availW = 800 - 2 * padX;
    const availH = 560 - 2 * padY;

    const scale = Math.min(availW / rangeX, availH / rangeZ);
    const offsetX = padX + (availW - rangeX * scale) / 2;
    const offsetY = padY + (availH - rangeZ * scale) / 2;

    const proj = (x: number, z: number) => ({
      x: offsetX + (x - minX) * scale,
      y: offsetY + (maxZ - z) * scale // Flip Z so North is up
    });

    // CatmullRom curve for smooth continuous path
    const controlPoints = coordinates.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
    const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'centripetal');

    const numSamples = 180;
    const sampled = curve.getSpacedPoints(numSamples);

    // Build colored path segments along the lap
    const segments: Array<{ d: string; color: string }> = [];

    const colorSec1 = '#E10600';
    const colorSec2 = '#38BDF8';
    const colorSec3 = '#EAB308';
    const colorDrs = '#22C55E';
    const colorMedium = '#94A3B8';
    const colorBraking = '#EF4444';

    for (let i = 0; i < numSamples; i++) {
      const p1 = sampled[i]!;
      const p2 = sampled[(i + 1) % (numSamples + 1)]!;
      const pt1 = proj(p1.x, p1.z);
      const pt2 = proj(p2.x, p2.z);

      const t = i / numSamples;
      let strokeColor = colorSec1;

      if (colorMode === 'sectors') {
        if (t < 0.333) strokeColor = colorSec1;
        else if (t < 0.666) strokeColor = colorSec2;
        else strokeColor = colorSec3;
      } else if (colorMode === 'elevation') {
        // Linear gradient approximation along curve
        if (t < 0.5) strokeColor = '#38BDF8';
        else strokeColor = '#E10600';
      } else {
        // speed_drs mode
        const tan = curve.getTangent(t);
        const nextTan = curve.getTangent((i + 1) / numSamples);
        const turnAngle = tan.angleTo(nextTan);
        if (turnAngle < 0.03) strokeColor = colorDrs;
        else if (turnAngle > 0.08) strokeColor = colorBraking;
        else strokeColor = colorMedium;
      }

      segments.push({
        d: `M ${pt1.x.toFixed(1)} ${pt1.y.toFixed(1)} L ${pt2.x.toFixed(1)} ${pt2.y.toFixed(1)}`,
        color: strokeColor
      });
    }

    // Corner marker screen coordinates
    const cPoints = corners.map((c) => {
      const p = curve.getPointAt(((c.t % 1) + 1) % 1);
      const screenPos = proj(p.x, p.z);
      return {
        ...c,
        svgX: screenPos.x,
        svgY: screenPos.y
      };
    });

    // Start/Finish bar at t = 0
    const startP = curve.getPointAt(0);
    const startTangent = curve.getTangent(0).normalize();
    const sfProj = proj(startP.x, startP.z);
    const normalX = -startTangent.z;
    const normalY = startTangent.x;

    const sfBar = {
      x1: sfProj.x - normalX * 14,
      y1: sfProj.y - normalY * 14,
      x2: sfProj.x + normalX * 14,
      y2: sfProj.y + normalY * 14
    };

    // Racing direction chevron at t = 0.04
    const chevP = curve.getPointAt(0.04);
    const chevPos = proj(chevP.x, chevP.z);
    const chevTan = curve.getTangent(0.04).normalize();
    const chevAngle = Math.atan2(-chevTan.z, chevTan.x) * (180 / Math.PI);

    return {
      pathSegments: segments,
      project: proj,
      cornerPoints: cPoints,
      startFinish: sfBar,
      chevron: { x: chevPos.x, y: chevPos.y, angle: chevAngle }
    };
  }, [coordinates, colorMode, corners]);

  return (
    <div className="relative w-full h-[540px] bg-[#090B10] flex items-center justify-center overflow-hidden select-none">
      <svg
        data-testid="track-2d-svg"
        viewBox="0 0 800 560"
        className="w-full h-full max-h-[540px]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${circuitName} 2D Circuit Map`}
      >
        <defs>
          {/* Subtle architectural background grid */}
          <pattern id="grid-2d" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Technical Grid Backdrop */}
        <rect width="800" height="560" fill="#090B10" />
        <rect width="800" height="560" fill="url(#grid-2d)" />

        {/* Outer Dark Track Border / Asphalt Foundation */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {pathSegments.map((seg, i) => (
            <path
              key={`base-${i}`}
              d={seg.d}
              fill="none"
              stroke="#1E293B"
              strokeWidth="12"
            />
          ))}
        </g>

        {/* Colored Centerline Track Segments */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {pathSegments.map((seg, i) => (
            <path
              key={`color-${i}`}
              d={seg.d}
              fill="none"
              stroke={seg.color}
              strokeWidth="6"
            />
          ))}
        </g>

        {/* Start / Finish Checkered Gate Line */}
        {startFinish && (
          <g>
            <line
              x1={startFinish.x1}
              y1={startFinish.y1}
              x2={startFinish.x2}
              y2={startFinish.y2}
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeDasharray="4 3"
            />
            <text
              x={startFinish.x1 - 8}
              y={startFinish.y1 - 6}
              fill="#FFFFFF"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.1em"
            >
              START / FINISH
            </text>
          </g>
        )}

        {/* Direction of Travel Chevron */}
        {chevron && (
          <polygon
            points="-5,-4 5,0 -5,4"
            fill="#FFFFFF"
            transform={`translate(${chevron.x}, ${chevron.y}) rotate(${chevron.angle})`}
            opacity="0.85"
          />
        )}

        {/* Interactive Clickable Corner Markers */}
        <g>
          {cornerPoints.map((corner) => {
            const isSelected = selectedCornerNumber === corner.number;
            const matchesFilter =
              filterMode === 'all' ||
              (filterMode === 'overtaking' && Boolean(corner.isOvertakingZone)) ||
              (filterMode === 'high_downforce' && Boolean(corner.isHighDownforce));

            const opacity = matchesFilter ? 1.0 : 0.22;

            return (
              <g
                key={`corner-marker-${corner.number}`}
                transform={`translate(${corner.svgX}, ${corner.svgY})`}
                opacity={opacity}
                className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                onClick={() => onSelectCorner?.(corner.number)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCorner?.(corner.number);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Turn ${corner.number}: ${corner.name}`}
              >
                {/* Active Outer Glow */}
                {isSelected && (
                  <circle
                    r="16"
                    fill="none"
                    stroke="#E10600"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Base Marker Circle */}
                <circle
                  r="11"
                  fill={isSelected ? '#E10600' : '#11151E'}
                  stroke={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.25)'}
                  strokeWidth="1.5"
                />

                {/* Turn Text */}
                <text
                  textAnchor="middle"
                  dy="3.5"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.85)'}
                >
                  T{corner.number}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
