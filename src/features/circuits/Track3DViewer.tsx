import React, { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Circuit } from '../../types/f1';
import './Track3DViewer.css';

interface Track3DViewerProps {
  circuit: Circuit;
  accentColor?: string;
}

// Internal 3D Track Mesh component
const TrackMesh: React.FC<{
  points: [number, number, number][];
  accentColor: string;
  is3DMode: boolean;
  selectedTurn: number | null;
  onSelectTurn: (turnIndex: number | null) => void;
}> = ({ points, accentColor, is3DMode, selectedTurn, onSelectTurn }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Build 3D CatmullRom Curve
  const { curve, geometry, turnMarkers, drsGeometry } = useMemo(() => {
    const vectors = points.map(
      p => new THREE.Vector3(p[0], is3DMode ? p[1] : 0, p[2])
    );
    const catmull = new THREE.CatmullRomCurve3(vectors, true, 'centripetal');
    
    // Main track tube geometry
    const trackTube = new THREE.TubeGeometry(catmull, 160, 0.45, 12, true);

    // DRS wireframe tube (approx 20% to 40% of track length)
    const drsPoints = vectors.slice(0, Math.max(3, Math.floor(vectors.length * 0.35)));
    const drsCurve = new THREE.CatmullRomCurve3(drsPoints, false);
    const drsTube = new THREE.TubeGeometry(drsCurve, 40, 0.55, 8, false);

    // Generate turn markers along the track points
    const markers = points.map((p, idx) => ({
      index: idx + 1,
      position: [p[0], (is3DMode ? p[1] : 0) + 0.6, p[2]] as [number, number, number],
      elevationDelta: p[1]
    }));

    return {
      curve: catmull,
      geometry: trackTube,
      turnMarkers: markers,
      drsGeometry: drsTube
    };
  }, [points, is3DMode]);

  // Subtle floating motion in 3D mode
  useFrame(({ clock }) => {
    if (meshRef.current && is3DMode) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.12;
    } else if (meshRef.current) {
      meshRef.current.position.y = 0;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Primary Track Tube */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.4}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Glowing Outer Track Outline */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.6}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Neon DRS Activation Zone Overlay */}
      <mesh geometry={drsGeometry}>
        <meshStandardMaterial
          color="#00E701"
          emissive="#00E701"
          emissiveIntensity={0.9}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Start / Finish Gantry Marker */}
      {points[0] && (
        <group position={[points[0][0], (is3DMode ? points[0][1] : 0) + 0.8, points[0][2]]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 1.6, 8]} />
            <meshStandardMaterial color="#FF1E1E" emissive="#FF1E1E" emissiveIntensity={0.8} />
          </mesh>
          <Html position={[0, 1.2, 0]} center distanceFactor={25}>
            <div className="track-start-finish-badge telemetry">
              🏁 START / FINISH
            </div>
          </Html>
        </group>
      )}

      {/* Turn Apex Markers */}
      {turnMarkers.map((marker) => {
        const isHovered = selectedTurn === marker.index;
        return (
          <group
            key={marker.index}
            position={marker.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              onSelectTurn(marker.index);
            }}
            onPointerOut={() => onSelectTurn(null)}
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

  return (
    <div className="track-3d-viewer-card telemetry-panel corner-bracket">
      <div className="track-viewer-header">
        <div className="viewer-brand telemetry">
          <span className="live-dot" style={{ backgroundColor: accentColor }}></span>
          <span>3D TOPOGRAPHIC TRACK VISUALIZER // {circuit.name.toUpperCase()}</span>
        </div>

        <div className="track-controls-row">
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
        <Canvas
          camera={{ position: [0, 18, 20], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
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
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={8}
            maxDistance={40}
          />
        </Canvas>

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
          <span>🖱️ CLICK & DRAG TO ROTATE 3D TRACK | SCROLL TO ZOOM</span>
        </div>
      </div>
    </div>
  );
};
