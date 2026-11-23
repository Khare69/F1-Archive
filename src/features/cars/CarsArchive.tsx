import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { getAllTeams, getTeamById } from '../../data/dataService';
import { InteractiveCarModel, type PartHoverInfo } from './InteractiveCarModel';
import { CameraTrackingLight } from './CameraTrackingLight';
import { FallbackImage } from '../../components/FallbackImage/FallbackImage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePreferencesContext } from '../../contexts/UserPreferencesContext';
import { CanvasErrorBoundary } from './components/CanvasErrorBoundary';
import { TelemetryLoadingProgress } from './components/TelemetryLoadingProgress';
import { PerfDebugOverlay, PerfDebugCollector } from './components/PerfDebugOverlay';
import './CarsArchive.css';

/**
 * Inner error boundary that catches HDR environment map fetch failures.
 * Prevents CDN latency or network drops from breaking the 3D scene.
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

/**
 * Invalidation Trigger for demand-frameloop
 */
const CanvasInvalidator: React.FC<{ trigger: unknown }> = ({ trigger }) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [trigger, invalidate]);
  return null;
};

export const CarsArchive: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const teams = getAllTeams();
  const { hasReducedMotion } = usePreferencesContext();

  const selectedTeam = getTeamById(teamId) || teams[0];
  useDocumentTitle(selectedTeam ? `${selectedTeam.carName} — 3D Lab` : '3D Vehicle Lab');

  const [showAero, setShowAero] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<PartHoverInfo | null>(null);
  const [isContextLost, setIsContextLost] = useState<boolean>(false);

  // Mobile / Coarse Pointer Touch Lock
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [isTouchUnlocked, setIsTouchUnlocked] = useState<boolean>(false);

  const orbitRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
      setIsTouchDevice(isCoarse);
      if (!isCoarse) {
        setIsTouchUnlocked(true);
      }
    }
  }, []);

  const handleSelectTeam = (id: string) => {
    navigate(`/cars/${id}`);
  };

  const handleResetCamera = useCallback(() => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  }, []);

  // Compute frameloop state:
  // When aero particles are running or auto-rotating: 'always'.
  // When idle and user is stationary: 'demand' (0 FPS idle draw).
  const isAutoRotating = !hasReducedMotion && !showAero && !hoveredPart;
  const isAnimating = showAero || isAutoRotating;

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
                <span className="telemetry-frameloop-tag">
                  {isAnimating ? 'FPS: 60 (ACTIVE)' : 'FPS: 0 (DEMAND IDLE)'}
                </span>
              </div>
              <h1
                className="canvas-car-title headline"
                style={{ color: selectedTeam.color, textShadow: `0 0 20px ${selectedTeam.color}66` }}
              >
                {selectedTeam.carName}
              </h1>
              <span className="canvas-team-subtitle telemetry">
                {selectedTeam.name.toUpperCase()} // OFFICIAL LIVERY &amp; AERO MAPPING
              </span>
            </div>

            {/* Aero Wind Tunnel & Camera Reset Controls */}
            <div className="canvas-controls-box">
              {/* Touch interaction unlock/lock toggle for mobile */}
              {isTouchDevice && (
                <button
                  type="button"
                  className={`f1-btn telemetry touch-lock-btn ${isTouchUnlocked ? 'f1-btn-secondary' : 'unlocked'}`}
                  onClick={() => setIsTouchUnlocked(!isTouchUnlocked)}
                  aria-label={isTouchUnlocked ? 'Lock 3D canvas scrolling' : 'Unlock 3D canvas interaction'}
                >
                  <span>{isTouchUnlocked ? '🔒 LOCK SCROLL' : '👆 3D INTERACT'}</span>
                </button>
              )}

              <button
                type="button"
                className="f1-btn f1-btn-secondary telemetry camera-reset-btn"
                onClick={handleResetCamera}
                title="Reset Camera to Beauty 3/4 Angle"
                aria-label="Reset Camera view"
              >
                <span>RECENTER VIEW</span>
              </button>

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
            {isContextLost ? (
              <div className="canvas-context-lost-banner telemetry-panel corner-bracket" role="alert">
                <div className="context-lost-content">
                  <span className="context-icon">⚠️</span>
                  <h3 className="headline">WEBGL GPU CONTEXT SUSPENDED</h3>
                  <p className="telemetry">Mobile OS or system idle suspended the graphics pipeline.</p>
                  <button
                    type="button"
                    className="f1-btn telemetry"
                    onClick={() => setIsContextLost(false)}
                  >
                    <span>RESTORE GRAPHICS PIPELINE</span>
                  </button>
                </div>
              </div>
            ) : (
              <CanvasErrorBoundary
                fallbackTitle={`${selectedTeam.carName} Telemetry Fallback`}
                onReset={() => handleResetCamera()}
              >
                <Canvas
                  shadows={{ type: THREE.PCFSoftShadowMap }}
                  dpr={[1, 2]}
                  frameloop={isAnimating ? 'always' : 'demand'}
                  camera={{ position: [3.6, 1.3, 3.1], fov: 38 }}
                  style={{
                    background: 'radial-gradient(ellipse at 50% 40%, #0d121c 0%, #05070c 100%)',
                    pointerEvents: isTouchDevice && !isTouchUnlocked ? 'none' : 'auto'
                  }}
                  gl={{
                    antialias: true,
                    alpha: false,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2,
                    powerPreference: 'high-performance'
                  }}
                  onCreated={({ gl }) => {
                    const el = gl.domElement;
                    el.addEventListener('webglcontextlost', (e) => {
                      e.preventDefault();
                      setIsContextLost(true);
                    });
                    el.addEventListener('webglcontextrestored', () => {
                      setIsContextLost(false);
                    });
                  }}
                >
                  {/* Invalidates demand loop when team or controls change */}
                  <CanvasInvalidator trigger={`${selectedTeam.id}_${showAero}_${isTouchUnlocked}`} />

                  {/* GPU Performance Profiler Collector for ?debug=perf */}
                  <PerfDebugCollector />

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

                  <Suspense fallback={null}>
                    {/* High-Fidelity 3D Car with Component-Specific PBR Shaders */}
                    <InteractiveCarModel
                      team={selectedTeam}
                      showAero={showAero}
                      hasReducedMotion={hasReducedMotion}
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
                    ref={orbitRef}
                    target={[0, 0.25, 0]}
                    enablePan={false}
                    enabled={!isTouchDevice || isTouchUnlocked}
                    minDistance={2.5}
                    maxDistance={8.5}
                    maxPolarAngle={Math.PI / 2 + 0.02}
                    minPolarAngle={Math.PI / 12}
                    autoRotate={isAutoRotating}
                    autoRotateSpeed={0.6}
                    touches={{
                      ONE: THREE.TOUCH.ROTATE,
                      TWO: THREE.TOUCH.DOLLY_PAN
                    }}
                  />
                </Canvas>
              </CanvasErrorBoundary>
            )}

            {/* Seamless Telemetry Loader Overlay */}
            <TelemetryLoadingProgress
              label={`LOADING ${selectedTeam.carName.toUpperCase()} MESH`}
              accentColor={selectedTeam.color}
            />

            {/* GPU Performance Profiler DOM Overlay for ?debug=perf */}
            <PerfDebugOverlay />

            {/* Mobile Interaction Gate Overlay */}
            {isTouchDevice && !isTouchUnlocked && (
              <div
                className="mobile-touch-gate"
                onClick={() => setIsTouchUnlocked(true)}
                role="button"
                tabIndex={0}
                aria-label="Unlock 3D chassis orbit mode"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setIsTouchUnlocked(true);
                }}
              >
                <div className="mobile-gate-card telemetry">
                  <span className="gate-icon">👆</span>
                  <span className="gate-text">TAP TO ORBIT 3D CHASSIS</span>
                  <span className="gate-subtext">Page scrolling remains uninhibited</span>
                </div>
              </div>
            )}

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
                <span className="spec-label telemetry">MONOCOQUE &amp; CHASSIS</span>
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
                <div>RENDER ENGINE: THREE.JS R174</div>
                <div>ASSET PIPELINE: DRACO 1.19 MB</div>
                <div>FRAME LOOP: {isAnimating ? 'CONTINUOUS (60 FPS)' : 'DEMAND (0 FPS IDLE)'}</div>
                <div>AERO SIMULATION: {showAero ? '2000 PARTICLES (1 CALL)' : 'STANDBY'}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CarsArchive;
