import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { TelemetryShowdown } from '../../../types/telemetry';
import { getSectorAnchoredDistanceFraction } from '../telemetryMath';
import { CanvasErrorBoundary } from '../../cars/components/CanvasErrorBoundary';
import './GhostLapViewer3D.css';

export interface PlaybackHandle {
  time: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
}

interface GhostLapViewer3DProps {
  showdown: TelemetryShowdown;
  trackCoordinates: [number, number, number][];
  playbackRef: React.MutableRefObject<PlaybackHandle>;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate?: (time: number) => void;
}

// Invalidation trigger for demand frameloop
const SceneInvalidator: React.FC<{ trigger: unknown }> = ({ trigger }) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [trigger, invalidate]);
  return null;
};

// 3D Track Ribbon with 25 Vertex-Colored Mini-Sectors (1 Single Draw Call)
const MiniSectorTrackRibbon: React.FC<{
  catmull: THREE.CatmullRomCurve3;
  showdown: TelemetryShowdown;
}> = ({ catmull, showdown }) => {
  const tubeGeometry = useMemo(() => {
    const segments = 250;
    const radialSegments = 8;
    const radius = 0.28;
    const geo = new THREE.TubeGeometry(catmull, segments, radius, radialSegments, true);

    // Color vertices by mini-sector winner (Trap 3)
    const positionAttr = geo.getAttribute('position');
    const vertexCount = positionAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    const colorA = new THREE.Color(showdown.driverA.teamColor);
    const colorB = new THREE.Color(showdown.driverB.teamColor);
    const tieColor = new THREE.Color('#FFFFFF');

    // In TubeGeometry, vertices are ordered along the length in (radialSegments + 1) rings
    const ringSize = radialSegments + 1;
    for (let i = 0; i < vertexCount; i++) {
      const ringIndex = Math.floor(i / ringSize);
      const u = ringIndex / segments;
      const sectorIndex = Math.min(24, Math.floor(u * 25));
      const sector = showdown.miniSectors25[sectorIndex];

      let chosenColor = tieColor;
      if (sector) {
        if (sector.fasterDriver === 'A') chosenColor = colorA;
        else if (sector.fasterDriver === 'B') chosenColor = colorB;
      }

      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [catmull, showdown]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.35}
        metalness={0.65}
      />
    </mesh>
  );
};

// Dual 3D Ghost Cars (Ref-driven, 0 useState re-renders in useFrame)
const GhostCars: React.FC<{
  catmull: THREE.CatmullRomCurve3;
  showdown: TelemetryShowdown;
  playbackRef: React.MutableRefObject<PlaybackHandle>;
  onTimeUpdate?: (time: number) => void;
}> = ({ catmull, showdown, playbackRef, onTimeUpdate }) => {
  const ghostARef = useRef<THREE.Group>(null);
  const ghostBRef = useRef<THREE.Group>(null);
  const deltaBadgeRef = useRef<HTMLDivElement>(null);
  const lastUiSyncMsRef = useRef<number>(0);

  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempTangent = useMemo(() => new THREE.Vector3(), []);
  const tempLookPos = useMemo(() => new THREE.Vector3(), []);

  const totalLapA = showdown.driverA.lapTimeSeconds;
  const totalLapB = showdown.driverB.lapTimeSeconds;
  const maxLapTime = Math.max(totalLapA, totalLapB);

  // 60 FPS animation loop with ZERO React useState calls & wall-clock UI sync throttling
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1); // Clamp delta so background-tab resumes don't teleport the cars
    const pb = playbackRef.current;
    const now = performance.now();

    if (pb.isPlaying) {
      pb.time += delta * pb.speed;
      let shouldFlush = false;

      if (pb.time >= maxLapTime) {
        pb.time = maxLapTime;
        pb.isPlaying = false;
        shouldFlush = true;
      }

      // Wall-clock throttling: update UI at ~12.5 Hz (every 80ms) regardless of playback speed
      if (onTimeUpdate) {
        if (shouldFlush || now - lastUiSyncMsRef.current >= 80) {
          lastUiSyncMsRef.current = now;
          onTimeUpdate(pb.time);
        }
      }
    }

    const t = pb.time;

    // Calculate sector-anchored distance fractions for both drivers (Trap 2)
    const dA = getSectorAnchoredDistanceFraction(
      t,
      showdown.driverA.sector1Time,
      showdown.driverA.sector2Time,
      totalLapA,
      showdown.sectorBoundaries
    );

    const dB = getSectorAnchoredDistanceFraction(
      t,
      showdown.driverB.sector1Time,
      showdown.driverB.sector2Time,
      totalLapB,
      showdown.sectorBoundaries
    );

    // Update Ghost Car A position & orientation (lookAt with world +Y up)
    if (ghostARef.current) {
      catmull.getPointAt(dA, tempPos);
      ghostARef.current.position.copy(tempPos);

      catmull.getTangentAt(dA, tempTangent);
      tempLookPos.copy(tempPos).add(tempTangent);
      ghostARef.current.up.set(0, 1, 0);
      ghostARef.current.lookAt(tempLookPos);
    }

    // Update Ghost Car B position & orientation (lookAt with world +Y up)
    if (ghostBRef.current) {
      catmull.getPointAt(dB, tempPos);
      ghostBRef.current.position.copy(tempPos);

      catmull.getTangentAt(dB, tempTangent);
      tempLookPos.copy(tempPos).add(tempTangent);
      ghostBRef.current.up.set(0, 1, 0);
      ghostBRef.current.lookAt(tempLookPos);
    }

    // Direct DOM badge update without React reconciliation
    if (deltaBadgeRef.current) {
      const timeDiff = dB >= 1.0 && dA < 1.0 ? totalLapB - t : (dA - dB) * (maxLapTime / 1.0);
      const absDiff = Math.abs(timeDiff).toFixed(3);
      if (Math.abs(timeDiff) < 0.02) {
        deltaBadgeRef.current.textContent = 'INTERVAL: LEVEL';
        deltaBadgeRef.current.style.color = '#FFFFFF';
      } else if (dA > dB) {
        deltaBadgeRef.current.textContent = `${showdown.driverA.driverCode} +${absDiff}s`;
        deltaBadgeRef.current.style.color = showdown.driverA.teamColor;
      } else {
        deltaBadgeRef.current.textContent = `${showdown.driverB.driverCode} +${absDiff}s`;
        deltaBadgeRef.current.style.color = showdown.driverB.teamColor;
      }
    }
  });

  return (
    <>
      {/* Ghost Car A */}
      <group ref={ghostARef}>
        {/* Sleek aerodynamic arrow/chevron body pointing forward (+Z) */}
        <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.35, 1.2, 8]} />
          <meshStandardMaterial
            color={showdown.driverA.teamColor}
            emissive={showdown.driverA.teamColor}
            emissiveIntensity={1.4}
            roughness={0.2}
          />
        </mesh>
        {/* Halo / T-Cam accent */}
        <mesh position={[0, 0.35, -0.15]}>
          <boxGeometry args={[0.15, 0.15, 0.35]} />
          <meshBasicMaterial color={showdown.driverA.secondaryColor} />
        </mesh>
        {/* Driver label billboard */}
        <Html position={[0, 0.9, 0]} center distanceFactor={18}>
          <div
            className="ghost-driver-tag telemetry"
            style={{
              borderColor: showdown.driverA.teamColor,
              boxShadow: `0 0 10px ${showdown.driverA.teamColor}88`
            }}
          >
            {showdown.driverA.driverCode}
          </div>
        </Html>
      </group>

      {/* Ghost Car B */}
      <group ref={ghostBRef}>
        <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.35, 1.2, 8]} />
          <meshStandardMaterial
            color={showdown.driverB.teamColor}
            emissive={showdown.driverB.teamColor}
            emissiveIntensity={1.4}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.35, -0.15]}>
          <boxGeometry args={[0.15, 0.15, 0.35]} />
          <meshBasicMaterial color={showdown.driverB.secondaryColor} />
        </mesh>
        <Html position={[0, 0.9, 0]} center distanceFactor={18}>
          <div
            className="ghost-driver-tag telemetry"
            style={{
              borderColor: showdown.driverB.teamColor,
              boxShadow: `0 0 10px ${showdown.driverB.teamColor}88`
            }}
          >
            {showdown.driverB.driverCode}
          </div>
        </Html>
      </group>

      {/* Floating Delta Badge in 3D scene */}
      <Html position={[0, 4.0, 0]} center distanceFactor={25}>
        <div ref={deltaBadgeRef} className="ghost-3d-delta-badge telemetry">
          SYNCING GHOST LAPS...
        </div>
      </Html>
    </>
  );
};

export const GhostLapViewer3D: React.FC<GhostLapViewer3DProps> = ({
  showdown,
  trackCoordinates,
  playbackRef,
  currentTime,
  isPlaying,
  onTimeUpdate
}) => {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Build CatmullRom track spline
  const catmull = useMemo(() => {
    const vectors = trackCoordinates.map(
      (p) => new THREE.Vector3(p[0], is3DMode ? p[1] : 0, p[2])
    );
    return new THREE.CatmullRomCurve3(vectors, true, 'centripetal');
  }, [trackCoordinates, is3DMode]);

  const handleResetCamera = useCallback(() => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  }, []);

  return (
    <div className="ghost-viewer-3d-card telemetry-panel corner-bracket">
      {/* 3D Viewport Controls Bar */}
      <div className="ghost-viewer-header">
        <div className="ghost-viewer-title telemetry">
          <span className="ghost-live-blip"></span>
          <span>3D TELEMETRY GHOST-LAP VISUALIZER // {showdown.circuitName.toUpperCase()}</span>
          <span className="ghost-drawcall-badge telemetry">1 DRAW CALL (25 MINI-SECTORS)</span>
        </div>

        <div className="ghost-header-actions">
          <button
            type="button"
            className="f1-btn f1-btn-secondary telemetry ghost-cam-btn"
            onClick={handleResetCamera}
            title="Recenter track orbit camera"
            aria-label="Recenter camera"
          >
            <span>RECENTER TRACK</span>
          </button>

          <button
            type="button"
            className={`f1-btn f1-btn-secondary telemetry ghost-cam-btn ${is3DMode ? 'active' : ''}`}
            onClick={() => setIs3DMode(!is3DMode)}
            title="Toggle 3D Elevation Topography vs 2D Flat Map"
          >
            <span>{is3DMode ? '📐 3D ELEVATION' : '🗺️ 2D FLAT'}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas with Demand Frameloop */}
      <div className="ghost-canvas-container">
        <CanvasErrorBoundary fallbackTitle="Ghost Lap 3D Viewport Fault" onReset={handleResetCamera}>
          <Canvas
            dpr={[1, 2]}
            frameloop={isPlaying ? 'always' : 'demand'}
            camera={{ position: [0, 22, 26], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
          >
            <SceneInvalidator
              trigger={`${showdown.slug}_${is3DMode}_${isPlaying}_${currentTime}`}
            />

            <ambientLight intensity={0.9} />
            <directionalLight position={[10, 25, 15]} intensity={1.5} color="#FFFFFF" />
            <pointLight position={[-15, 10, -10]} intensity={0.9} color={showdown.driverA.teamColor} />
            <pointLight position={[15, 10, -10]} intensity={0.9} color={showdown.driverB.teamColor} />

            {/* 1 Draw Call Mini-Sector Track Ribbon */}
            <MiniSectorTrackRibbon catmull={catmull} showdown={showdown} />

            {/* Dual Ghost Cars */}
            <GhostCars
              catmull={catmull}
              showdown={showdown}
              playbackRef={playbackRef}
              onTimeUpdate={onTimeUpdate}
            />

            <OrbitControls
              ref={orbitRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2.05}
              minDistance={8}
              maxDistance={50}
            />
          </Canvas>
        </CanvasErrorBoundary>

        {/* 25 Mini-Sector Legend Overlay */}
        <div className="ghost-legend-overlay telemetry">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: showdown.driverA.teamColor }}></span>
            <span>{showdown.driverA.driverCode} ADVANTAGE</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: showdown.driverB.teamColor }}></span>
            <span>{showdown.driverB.driverCode} ADVANTAGE</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#FFFFFF' }}></span>
            <span>LEVEL (&lt; 15ms)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
