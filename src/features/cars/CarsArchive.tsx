import React, { useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getAllTeams, getTeamById } from '../../data/dataService';
import { InteractiveCarModel, type PartHoverInfo } from './InteractiveCarModel';
import { CameraTrackingLight } from './CameraTrackingLight';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './CarsArchive.css';

/**
 * Inner error boundary that catches HDR environment map fetch failures.
 * drei's Environment preset="city" loads potsdamer_platz_1k.hdr from a CDN.
 * When the CDN is unreachable, this prevents the error from crashing the entire app.
 * The scene's explicit directional/point lights provide adequate illumination as fallback.
 */
class EnvironmentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[CarsArchive] HDR environment map failed to load. Falling back to scene lights only.', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const EnvironmentWithFallback: React.FC = () => (
  <EnvironmentErrorBoundary>
    <Environment preset="city" />
  </EnvironmentErrorBoundary>
);

export const CarsArchive: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const teams = getAllTeams();

  // Validate teamId or default to the first team
  const selectedTeam = getTeamById(teamId) || teams[0];
  useDocumentTitle(selectedTeam ? `${selectedTeam.carName} — 3D Lab` : '3D Vehicle Lab');
  const [showAero, setShowAero] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<PartHoverInfo | null>(null);

  const handleSelectTeam = (id: string) => {
    navigate(`/cars/${id}`);
  };

  return (
    <div className="cars-archive-container">
      {/* 3-Column Grid Layout */}
      <div className="cars-three-column-layout">
        {/* Left Column: Team Selector List */}
        <aside className="cars-sidebar-left" aria-label="Team selector">
          <div className="sidebar-header telemetry">
            <span>// CHASSIS LAB</span>
            <span className="sidebar-count">{teams.length} VEHICLES</span>
          </div>

          <div className="cars-team-list">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                className={`list-button car-team-btn ${selectedTeam.id === team.id ? 'active' : ''}`}
                onClick={() => handleSelectTeam(team.id)}
              >
                <div className="car-btn-content">
                  <span
                    className="team-color-indicator"
                    style={{ backgroundColor: team.color, boxShadow: `0 0 8px ${team.color}` }}
                  />
                  <div className="car-btn-text">
                    <span className="car-team-name">{team.name}</span>
                    <span className="car-model-name telemetry">{team.carName}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center Column: Interactive 3D Canvas */}
        <main className="cars-canvas-area">
          {/* Canvas HUD Top Overlay */}
          <div className="canvas-hud-top">
            <div className="canvas-header-box">
              <div className="canvas-tag telemetry">
                <span className="canvas-live-blip"></span>
                <span>AERODYNAMIC HIGH-FIDELITY CAD LAB</span>
              </div>
              <h1 
                className="canvas-car-title headline"
                style={{ color: selectedTeam.color, textShadow: `0 0 20px ${selectedTeam.color}66` }}
              >
                {selectedTeam.carName}
              </h1>
              <span className="canvas-team-subtitle telemetry">
                {selectedTeam.name.toUpperCase()} // OFFICIAL LIVERY & AERO MAPPING
              </span>
            </div>

            {/* Aero Wind Tunnel Mode Toggle */}
            <div className="canvas-controls-box">
              <button
                type="button"
                className={`f1-btn aero-toggle-btn ${showAero ? 'aero-active' : ''}`}
                onClick={() => setShowAero(!showAero)}
                aria-pressed={showAero}
              >
                <span className="aero-pulse-icon"></span>
                <span>AERO TEST: {showAero ? 'ACTIVE' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Three.js Canvas Container with Studio Staging & Lighting */}
          <div className="canvas-viewport-wrapper">
            <Canvas
              shadows={{ type: THREE.PCFSoftShadowMap }}
              camera={{ position: [3.6, 1.3, 3.1], fov: 38 }}
              style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d121c 0%, #05070c 100%)' }}
              gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            >
              {/* Studio Ambient & Directional Fill Lights */}
              <ambientLight intensity={0.5} />

              {/* User Co-located Key Light: Tracks camera to create sharp clearcoat highlights */}
              <CameraTrackingLight intensity={2.0} castShadow={true} />

              {/* Studio Overhead Top Light for Roof & Airbox Contour */}
              <directionalLight position={[0, 8, 0]} intensity={1.0} color="#FFFFFF" />

              {/* Studio Rim Lights for Bodywork Silhouette Separation */}
              <pointLight position={[-6, 4, -5]} intensity={1.2} color="#00D2FF" />
              <pointLight position={[6, 2, -4]} intensity={0.8} color={selectedTeam.color} />
              <pointLight position={[0, -2, 4]} intensity={0.3} color="#FFFFFF" />

              <Suspense
                fallback={
                  <Html center>
                    <div className="three-loading-text telemetry headline">
                      <span>INITIALIZING HIGH-FIDELITY 3D CHASSIS...</span>
                    </div>
                  </Html>
                }
              >
                {/* High-Fidelity 3D Car with Component-Specific PBR Shaders */}
                <InteractiveCarModel
                  team={selectedTeam}
                  showAero={showAero}
                  onHoverPart={setHoveredPart}
                />

                {/* Ground Contact Shadow under tyres and floor */}
                <ContactShadows
                  position={[0, 0, 0]}
                  opacity={0.85}
                  scale={16}
                  blur={2.0}
                  far={4}
                  color={showAero ? '#00D2FF' : '#000000'}
                />

                {/* Studio reflections for metallic lacquer and carbon */}
                <EnvironmentWithFallback />
              </Suspense>

              {/* Camera Orbit Controls (defaults to beauty 3/4 angle) */}
              <OrbitControls
                target={[0, 0.25, 0]}
                enablePan={false}
                minDistance={2.5}
                maxDistance={8.5}
                maxPolarAngle={Math.PI / 2 + 0.02}
                minPolarAngle={Math.PI / 12}
                autoRotate={!showAero && !hoveredPart}
                autoRotateSpeed={0.6}
              />
            </Canvas>

            {/* FIXED-SIZE TELEMETRY SPEC HUD OVERLAY IN CORNER */}
            <div className="canvas-hud-bottom-overlay">
              {hoveredPart ? (
                <div
                  className="hud-part-card"
                  style={{ '--hud-accent': selectedTeam.color } as React.CSSProperties}
                >
                  <div className="hud-card-header telemetry">
                    <span className="hud-badge-dot"></span>
                    <span className="hud-badge-category">{hoveredPart.category} // TELEMETRY</span>
                  </div>
                  <div className="hud-card-title headline">{hoveredPart.name}</div>
                  <div className="hud-card-detail">{hoveredPart.detail}</div>
                  <div className="hud-card-stat telemetry">{hoveredPart.stat}</div>
                </div>
              ) : (
                <div className="hud-standby-hint telemetry">
                  <span className="standby-dot"></span>
                  <span>[ HOVER OVER VEHICLE COMPONENTS FOR TELEMETRY // DRAG TO ORBIT // SCROLL TO ZOOM ]</span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Column: Engineering Specs & Telemetry Status */}
        <aside className="cars-sidebar-right" aria-label="Vehicle specifications">
          <div className="sidebar-header telemetry">
            <span>// CHASSIS TELEMETRY</span>
            <span className="sidebar-count">SPECS</span>
          </div>

          <div className="specs-column-content">
            {/* Team Logo Badge */}
            <div className="specs-team-brand telemetry-panel">
              <FallbackImage
                src={selectedTeam.logoUrl}
                alt={`${selectedTeam.name} Logo`}
                type="team"
                teamId={selectedTeam.id}
                accentColor={selectedTeam.color}
                className="specs-brand-logo"
              />
              <div className="specs-team-desc">
                <span className="headline" style={{ color: selectedTeam.color }}>
                  {selectedTeam.name}
                </span>
                <span className="telemetry">{selectedTeam.base}</span>
              </div>
            </div>

            {/* Specifications Cards */}
            <div className="spec-card-group">
              <div className="spec-stat-card telemetry-panel">
                <span className="spec-label telemetry">POWER UNIT SPECIFICATION</span>
                <span className="spec-val-primary">{selectedTeam.specs.powerUnit}</span>
              </div>

              <div className="spec-stat-card telemetry-panel">
                <span className="spec-label telemetry">MONOCOQUE & CHASSIS</span>
                <span className="spec-val">{selectedTeam.specs.chassis}</span>
              </div>

              <div className="spec-stat-subgroup">
                <div className="spec-stat-card telemetry-panel">
                  <span className="spec-label telemetry">MINIMUM WEIGHT</span>
                  <span className="spec-val-highlight headline">{selectedTeam.specs.weight}</span>
                </div>
                <div className="spec-stat-card telemetry-panel">
                  <span className="spec-label telemetry">AERO DOWNFORCE</span>
                  <span className="spec-val-highlight headline">{selectedTeam.specs.downforce}</span>
                </div>
              </div>

              <div className="spec-stat-card telemetry-panel">
                <span className="spec-label telemetry">ESTIMATED TOP SPEED</span>
                <span className="spec-val-speed headline" style={{ color: '#00D2FF' }}>
                  {selectedTeam.specs.topSpeed}
                </span>
              </div>
            </div>

            {/* Telemetry Status Box */}
            <div className="telemetry-status-box telemetry-panel">
              <div className="status-box-header telemetry">
                <span>CAD TELEMETRY SYSTEM</span>
                <span className="status-tag-green">ACTIVE</span>
              </div>
              <div className="status-readout telemetry">
                <div>SYSTEM STATUS: ONLINE</div>
                <div>RENDER ENGINE: WEBGL THREE.JS</div>
                <div>SHADOW ENGINE: PCF SOFT SHADOWS</div>
                <div>LIGHTING: STUDIO 4-POINT PBR</div>
                <div>AERO SIMULATION: {showAero ? '2000 PARTICLES' : 'STANDBY'}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CarsArchive;
