import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { Circuit } from '../../types/f1';
import { CanvasErrorBoundary } from '../cars/components/CanvasErrorBoundary';
import { PerfDebugCollector } from '../cars/components/PerfDebugOverlay';
import './Track3DViewer.css';

interface Track3DViewerProps {
  circuit: Circuit;
  accentColor?: string;
}

const TrackInvalidator: React.FC<{ trigger: unknown }> = ({ trigger }) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [trigger, invalidate]);
  return null;
};

// Internal 3D Track Mesh component
const TrackMesh: React.FC<{
  points: [number, number, number][];
  accentColor: string;
  is3DMode: boolean;
  selectedTurn: number | null;
  onSelectTurn: (turnIndex: number | null) => void;
}> = ({ points, accentColor, is3DMode, selectedTurn, onSelectTurn }) => {
  const meshRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  // Build 3D CatmullRom Curve
  const { geometry, turnMarkers, drsGeometry } = useMemo(() => {
    const vectors = points.map(
      (p) => new THREE.Vector3(p[0], is3DMode ? p[1] : 0, p[2])
    );
    const catmull = new THREE.CatmullRomCurve3(vectors, true, 'centripetal');

    // Main track tube geometry
    const trackGeo = new THREE.TubeGeometry(catmull, 200, 0.22, 8, true);

    // DRS Speed Zones Highlight Geometry
    const drsGeo = new THREE.TubeGeometry(catmull, 60, 0.26, 8, false);

    // Turn marker spheres at key sample points along spline
    const markers: { position: THREE.Vector3; index: number; elevationDelta: number }[] = [];
    const numTurns = 12;
    for (let i = 1; i <= numTurns; i++) {
      const u = i / numTurns;
      const pos = catmull.getPoint(u);
      markers.push({
        position: pos,
        index: i,
        elevationDelta: Math.round(pos.y * 10)
      });
    }

    return {
      geometry: trackGeo,
      turnMarkers: markers,
      drsGeometry: drsGeo
    };
  }, [points, is3DMode]);

  // Subtle breathing animation for emissive DRS zone
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 3) * 0.3;
    const mat = (meshRef.current.children[1] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Primary Track Ribbon (Asphalt Surface) */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#151A24"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* DRS Overtake Zone (Neon Green Emissive Glow) */}
      <mesh geometry={drsGeometry}>
        <meshStandardMaterial
          color="#00E701"
          emissive="#00E701"
          emissiveIntensity={1.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Interactive Turn Markers with Elevation Telemetry tooltips */}
      {turnMarkers.map((marker) => {
        const isHovered = selectedTurn === marker.index;
        return (
          <group
            key={marker.index}
            position={marker.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              onSelectTurn(marker.index);
              invalidate();
            }}
            onPointerOut={() => {
              onSelectTurn(null);
              invalidate();
            }}
          >
            <mesh>
              <sphereGeometry args={[isHovered ? 0.35 : 0.2, 16, 16]} />
              <meshStandardMaterial
                color={isHovered ? '#FFD700' : accentColor}
                emissive={isHovered ? '#FFD700' : accentColor}
                emissiveIntensity={isHovered ? 1.5 : 0.6}
              />
            </mesh>

            {isHovered && (
              <Html position={[0, 0.8, 0]} center distanceFactor={20}>
                <div className="turn-telemetry-tooltip corner-bracket">
                  <div className="turn-header headline">TURN #{marker.index}</div>
                  <div className="turn-elevation telemetry">
                    ELEVATION: {marker.elevationDelta >= 0 ? `+${marker.elevationDelta}m` : `${marker.elevationDelta}m`}
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

export const Track3DViewer: React.FC<Track3DViewerProps> = ({
  circuit,
  accentColor = '#00D2FF'
}) => {
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
  const [isContextLost, setIsContextLost] = useState<boolean>(false);

  const orbitRef = useRef<OrbitControlsImpl>(null);

  // Fallback points if circuit coordinates are absent
  const trackPoints: [number, number, number][] = useMemo(() => {
    if (circuit.trackCoordinates && circuit.trackCoordinates.length > 3) {
      return circuit.trackCoordinates;
    }
    // Default standard oval curve
    return [
      [0, 0, 0], [4, 0.5, 0], [7, 1.2, 3], [5, 1.5, 6], [1, 0.8, 7],
      [-4, 0.2, 5], [-8, 0, 2], [-6, 0.2, -3], [0, 0, 0]
    ];
  }, [circuit]);

  const handleResetCamera = useCallback(() => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  }, []);

  return (
    <div className="track-3d-viewer-card telemetry-panel corner-bracket">
      <div className="track-viewer-header">
        <div className="viewer-brand telemetry">
          <span className="live-dot" style={{ backgroundColor: accentColor }}></span>
          <span>3D TOPOGRAPHIC TRACK VISUALIZER // {circuit.name.toUpperCase()}</span>
          <span className="track-fps-badge telemetry">DEMAND (0 FPS IDLE)</span>
        </div>

        <div className="track-controls-row">
          <button
            type="button"
            className="track-mode-btn telemetry"
            onClick={handleResetCamera}
            title="Reset Track Camera Angle"
            aria-label="Reset Track Camera Angle"
          >
            <span>RECENTER VIEW</span>
          </button>

          <button
            type="button"
            className={`track-mode-btn ${is3DMode ? 'active' : ''}`}
            onClick={() => setIs3DMode(!is3DMode)}
          >
            <span className="telemetry">{is3DMode ? '📐 3D TOPOGRAPHY (ON)' : '🗺️ 2D FLAT MAP (ON)'}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas */}
      <div className="track-canvas-container">
        {isContextLost ? (
          <div className="canvas-context-lost-banner telemetry-panel corner-bracket" role="alert">
            <span className="context-icon">⚠️</span>
            <h3 className="headline">TRACK GPU PIPELINE SUSPENDED</h3>
            <button type="button" className="f1-btn telemetry" onClick={() => setIsContextLost(false)}>
              <span>RESTORE CANVAS</span>
            </button>
          </div>
        ) : (
          <CanvasErrorBoundary fallbackTitle={`${circuit.name} 3D Track Map`} onReset={handleResetCamera}>
            <Canvas
              dpr={[1, 2]}
              frameloop="demand"
              camera={{ position: [0, 18, 20], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              onCreated={({ gl }) => {
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                  e.preventDefault();
                  setIsContextLost(true);
                });
                gl.domElement.addEventListener('webglcontextrestored', () => {
                  setIsContextLost(false);
                });
              }}
            >
              <TrackInvalidator trigger={`${circuit.id}_${is3DMode}_${selectedTurn}`} />
              <PerfDebugCollector />

              <ambientLight intensity={0.9} />
              <directionalLight position={[10, 20, 15]} intensity={1.5} color="#FFFFFF" />
              <pointLight position={[-10, 10, -10]} intensity={0.8} color={accentColor} />

              <TrackMesh
                points={trackPoints}
                accentColor={accentColor}
                is3DMode={is3DMode}
                selectedTurn={selectedTurn}
                onSelectTurn={setSelectedTurn}
              />

              <OrbitControls
                ref={orbitRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={8}
                maxDistance={40}
              />
            </Canvas>
          </CanvasErrorBoundary>
        )}

        {/* HUD Overlay Details */}
        <div className="track-hud-overlay">
          <div className="hud-metric-box">
            <span className="telemetry label">CIRCUIT LENGTH</span>
            <span className="headline value">{circuit.lengthKm}</span>
          </div>
          <div className="hud-metric-box">
            <span className="telemetry label">ELEVATION PROFILE</span>
            <span className="headline value" style={{ color: '#FFD700' }}>{circuit.elevation}</span>
          </div>
          <div className="hud-metric-box">
            <span className="telemetry label">DRS OVERTAKE ZONES</span>
            <span className="headline value" style={{ color: '#00E701' }}>{circuit.drsZones} ZONES (GREEN)</span>
          </div>
        </div>

        {/* Orbit Helper Hint */}
        <div className="orbit-helper-hint telemetry">
          <span>🖱️ CLICK &amp; DRAG TO ROTATE 3D TRACK | SCROLL TO ZOOM</span>
        </div>
      </div>
    </div>
  );
};
