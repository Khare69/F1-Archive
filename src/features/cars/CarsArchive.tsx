import React, { useState, useRef, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, ContactShadows } from '@react-three/drei';
import type CameraControlsImpl from 'camera-controls';
import * as THREE from 'three';
import { getAllTeams, getTeamById } from '../../data/dataService';
import { InteractiveCarModel, type PartHoverInfo } from './InteractiveCarModel';
import { CameraTrackingLight } from './CameraTrackingLight';
import { usePreferencesContext } from '../../contexts/UserPreferencesContext';
import { CanvasErrorBoundary } from './components/CanvasErrorBoundary';
import { PerfDebugCollector } from './components/PerfDebugOverlay';
import { usePageMeta } from '../../hooks/usePageMeta';
import type { ActiveAeroMode } from './components/Regulation2026Overlay';
import { getCarEraSpec, type CarEraId } from './carEraRegistry';
import { CarSelectorBar } from './components/CarSelectorBar';
import { CarSpecPanel } from './components/CarSpecPanel';
import { CarViewportControls } from './components/CarViewportControls';
import { CopyShareLinkButton } from '../../components/ui/CopyShareLinkButton';

const AutoRotateHelper: React.FC<{
  controlsRef: React.RefObject<CameraControlsImpl | null>;
  enabled: boolean;
}> = ({ controlsRef, enabled }) => {
  useFrame((_, delta) => {
    if (enabled && controlsRef.current) {
      controlsRef.current.rotate(delta * 0.25, 0, false);
    }
  });
  return null;
};

export const CarsArchive: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const navigate = useNavigate();
  const teams = getAllTeams();
  const { hasReducedMotion } = usePreferencesContext();

  const [eraId, setEraId] = useQueryState(
    'era',
    parseAsStringLiteral([
      '1950s_front_engine',
      '1988_turbo',
      '2004_v10',
      '2024_ground_effect',
      '2026_active_aero',
    ] as const).withDefault('2024_ground_effect')
  );

  const eraSpec = getCarEraSpec(eraId);
  const selectedTeam = getTeamById(teamId) || teams[0];

  const [showAero, setShowAero] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<PartHoverInfo | null>(null);
  const [activeAeroMode, setActiveAeroMode] = useState<ActiveAeroMode>('corner');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  const controlsRef = useRef<CameraControlsImpl | null>(null);

  const handleSelectTeam = (id: string) => {
    navigate(`/lab/${id}${eraId !== '2024_ground_effect' ? `?era=${eraId}` : ''}`);
  };

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.setLookAt(3.6, 1.3, 3.1, 0, 0.25, 0, !hasReducedMotion);
    }
  }, [hasReducedMotion]);

  const handleToggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
  };

  const isAutoRotateActive =
    isAutoRotating && !isInteracting && !showAero && !hoveredPart && !hasReducedMotion;

  usePageMeta({
    title: `${selectedTeam.name} (${eraSpec.yearLabel} ${eraSpec.title}) — 3D CAD Lab`,
    description: `Inspect ${selectedTeam.name} across 75+ years of F1 technical eras: ${eraSpec.title}. Interactive 3D PBR vehicle model, aerodynamics and regulations.`,
    canonicalPath: `/lab/${selectedTeam.id}`,
  });

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full bg-[#090B10] px-4 py-6 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        {/* Top Header Row */}
        <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#11151E] p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#8494AB]">
              <span className="h-2 w-2 rounded-full bg-[#E10600] animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider">
                3D VEHICLE EVOLUTION LAB
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-cyan-400">
                PBR SHADER PIPELINE // {eraSpec.yearLabel}
              </span>
            </div>
            <CopyShareLinkButton label="Share 3D Vehicle View" />
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
              {selectedTeam.name} // {eraSpec.title}
            </h1>
            <p className="font-mono text-xs text-[#8494AB] mt-0.5">
              {selectedTeam.carName} • {eraSpec.subtitle}
            </p>
          </div>
        </section>

        {/* 2-Bar Selectors: Era Timeline + Constructor Livery */}
        <CarSelectorBar
          currentEra={eraSpec.id}
          selectedTeam={selectedTeam}
          teams={teams}
          onSelectEra={(newEra) => setEraId(newEra)}
          onSelectTeam={handleSelectTeam}
        />

        {/* Main 3D Viewport & Technical Readout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 3D Viewport (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="relative h-[480px] sm:h-[560px] w-full rounded-lg border border-white/10 bg-gradient-to-b from-[#0c121e] to-[#05070c] overflow-hidden shadow-2xl">
              {/* Floating Top Controls Dock */}
              <div className="absolute top-3 left-3 z-10">
                <CarViewportControls
                  isAutoRotating={isAutoRotating}
                  onToggleAutoRotate={handleToggleAutoRotate}
                  onResetCamera={handleResetCamera}
                  showAero={showAero}
                  onToggleAero={() => setShowAero(!showAero)}
                  is2026Era={eraSpec.id === '2026_active_aero'}
                  activeAeroMode={activeAeroMode}
                  onToggleActiveAeroMode={() =>
                    setActiveAeroMode(activeAeroMode === 'corner' ? 'straight' : 'corner')
                  }
                  showHotspots={showHotspots}
                  onToggleHotspots={() => setShowHotspots(!showHotspots)}
                />
              </div>

              {/* WebGL Canvas (stable DOM element instance) */}
              <CanvasErrorBoundary
                fallbackTitle={`${selectedTeam.name} 3D Viewport Fault`}
                onReset={handleResetCamera}
              >
                <Canvas
                  shadows={{ type: THREE.PCFSoftShadowMap }}
                  dpr={[1, 2]}
                  frameloop="always"
                  camera={{ position: [3.6, 1.3, 3.1], fov: 38 }}
                  gl={{
                    antialias: true,
                    alpha: false,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2,
                    powerPreference: 'high-performance',
                  }}
                >
                  <PerfDebugCollector />
                  <ambientLight intensity={0.6} />
                  <CameraTrackingLight intensity={2.0} castShadow />
                  <directionalLight position={[0, 8, 0]} intensity={1.0} color="#FFFFFF" />
                  <pointLight position={[-6, 4, -5]} intensity={1.2} color="#00D2FF" />
                  <pointLight position={[6, 2, -4]} intensity={0.8} color={selectedTeam.color} />

                  <CameraControls
                    ref={controlsRef}
                    minDistance={2.2}
                    maxDistance={9.0}
                    maxPolarAngle={Math.PI / 2 + 0.02}
                    minPolarAngle={Math.PI / 12}
                    onStart={() => setIsInteracting(true)}
                    onEnd={() => setIsInteracting(false)}
                  />

                  <AutoRotateHelper controlsRef={controlsRef} enabled={isAutoRotateActive} />

                  {/* Inner Suspense keeps Canvas DOM element mounted */}
                  <Suspense fallback={null}>
                    <InteractiveCarModel
                      team={selectedTeam}
                      showAero={showAero}
                      hasReducedMotion={hasReducedMotion}
                      onHoverPart={setHoveredPart}
                      is2026Inspector={eraSpec.id === '2026_active_aero'}
                      activeAeroMode={activeAeroMode}
                    />

                    <ContactShadows
                      position={[0, 0, 0]}
                      opacity={0.85}
                      scale={16}
                      blur={2.0}
                      far={4}
                      color={showAero ? '#00D2FF' : '#000000'}
                    />
                  </Suspense>
                </Canvas>
              </CanvasErrorBoundary>

              {/* Hovered Component Telemetry HUD Overlay */}
              {hoveredPart && (
                <div className="absolute bottom-3 left-3 z-10 max-w-sm rounded border border-white/10 bg-[#05070c]/90 p-3 font-mono text-xs backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8494AB] uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E10600]" />
                    <span>{hoveredPart.category} // TELEMETRY</span>
                  </div>
                  <div className="font-bold text-white text-sm mt-0.5">{hoveredPart.name}</div>
                  <div className="text-[#8494AB] text-[11px] mt-1">{hoveredPart.detail}</div>
                  <div className="text-emerald-400 font-bold mt-1">{hoveredPart.stat}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Technical Specification Panel (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <CarSpecPanel eraSpec={eraSpec} selectedTeam={selectedTeam} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarsArchive;
