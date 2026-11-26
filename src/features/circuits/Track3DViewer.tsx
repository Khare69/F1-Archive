import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, Html } from '@react-three/drei';
import type CameraControlsImpl from 'camera-controls';
import * as THREE from 'three';
import type { Circuit } from '../../types/f1';
import { CanvasErrorBoundary } from '../cars/components/CanvasErrorBoundary';
import { PerfDebugCollector } from '../cars/components/PerfDebugOverlay';
import { disposeObject3D, attachWebGLContextLossGuard } from '../../utils/webglDisposal';
import {
  buildCircuitGeometries,
  type RibbonColorMode,
  type BuiltCircuitGeometries
} from './geometry/circuitRibbonBuilder';
import { Track2DMap, type CornerMarkerItem } from './Track2DMap';

export interface Track3DViewerProps {
  circuit?: Circuit;
  circuitName?: string;
  coordinates?: [number, number, number][];
  elevationDeltaM?: number | null;
  elevationSource?: 'open-meteo-srtm' | 'unavailable';
  trackSpanMeters?: number | null;
  accentColor?: string;
  viewMode?: '3d' | '2d';
  onViewModeChange?: (mode: '3d' | '2d') => void;
  colorMode?: RibbonColorMode;
  onColorModeChange?: (mode: RibbonColorMode) => void;
  exaggeration?: number;
  onExaggerationChange?: (scale: number) => void;
  corners?: CornerMarkerItem[];
  selectedCornerNumber?: number | null;
  onSelectCorner?: (cornerNumber: number | null) => void;
  filterMode?: 'all' | 'overtaking' | 'high_downforce';
}

const TrackInvalidator: React.FC<{ trigger: unknown }> = ({ trigger }) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [trigger, invalidate]);
  return null;
};

const TrackWebGLGuard: React.FC<{ onLost: () => void; onRestored: () => void }> = ({
  onLost,
  onRestored
}) => {
  const { gl } = useThree();
  useEffect(() => {
    let isUnmounted = false;
    const cleanup = attachWebGLContextLossGuard(
      gl.domElement,
      () => {
        if (!isUnmounted) onLost();
      },
      () => {
        if (!isUnmounted) onRestored();
      }
    );
    return () => {
      isUnmounted = true;
      cleanup();
    };
  }, [gl, onLost, onRestored]);
  return null;
};

// Scene Content Component
const ProceduralTrackScene: React.FC<{
  geometries: BuiltCircuitGeometries;
  corners: CornerMarkerItem[];
  selectedCornerNumber: number | null;
  onSelectCorner?: (cornerNumber: number | null) => void;
  filterMode?: 'all' | 'overtaking' | 'high_downforce';
  controlsRef: React.RefObject<CameraControlsImpl>;
}> = ({
  geometries,
  corners,
  selectedCornerNumber,
  onSelectCorner,
  filterMode = 'all',
  controlsRef
}) => {
  const { invalidate } = useThree();
  const rootRef = useRef<THREE.Group>(null);

  // Focus camera on corner apex when selectedCornerNumber changes
  useEffect(() => {
    if (selectedCornerNumber != null && controlsRef.current && geometries) {
      const targetCorner = corners.find((c) => c.number === selectedCornerNumber);
      if (targetCorner) {
        const target = geometries.pointAtT(targetCorner.t);
        const tangent = geometries.tangentAtT(targetCorner.t).normalize();
        const UP = new THREE.Vector3(0, 1, 0);
        const outward = new THREE.Vector3().crossVectors(tangent, UP).normalize();
        const camPos = new THREE.Vector3()
          .copy(target)
          .addScaledVector(outward, 4.2)
          .addScaledVector(UP, 2.5);

        controlsRef.current.setLookAt(
          camPos.x,
          camPos.y,
          camPos.z,
          target.x,
          target.y,
          target.z,
          true
        );
      }
    }
  }, [selectedCornerNumber, corners, geometries, controlsRef]);

  // Start / finish marker point at t = 0
  const sfPoint = useMemo(() => geometries.pointAtT(0), [geometries]);

  return (
    <group ref={rootRef}>
      {/* 1. Architectural Ground Grid */}
      <gridHelper args={[24, 24, '#1E293B', '#141B29']} position={[0, 0, 0]} />

      {/* 2. Flat y = 0.01 Ground Shadow Projection */}
      <mesh geometry={geometries.groundShadowGeometry}>
        <meshBasicMaterial color="#1E293B" transparent opacity={0.55} />
      </mesh>

      {/* 3. Translucent Elevation Curtain & Vertical Guide Drop Lines */}
      <mesh geometry={geometries.curtainGeometry}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={geometries.dropLinesGeometry}>
        <lineBasicMaterial color="#475569" transparent opacity={0.35} />
      </lineSegments>

      {/* 4. Extruded Asphalt Ribbon */}
      <mesh geometry={geometries.ribbonGeometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.65}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. White Outer Track Limit Borders */}
      <lineLoop geometry={geometries.leftBorderGeometry}>
        <lineBasicMaterial color="#E2E8F0" linewidth={1.5} />
      </lineLoop>
      <lineLoop geometry={geometries.rightBorderGeometry}>
        <lineBasicMaterial color="#E2E8F0" linewidth={1.5} />
      </lineLoop>

      {/* 6. Curvature Apex Kerbs (Alternating Red & White) */}
      {geometries.kerbRedGeometry.getAttribute('position') && (
        <mesh geometry={geometries.kerbRedGeometry}>
          <meshBasicMaterial color="#E10600" side={THREE.DoubleSide} />
        </mesh>
      )}
      {geometries.kerbWhiteGeometry.getAttribute('position') && (
        <mesh geometry={geometries.kerbWhiteGeometry}>
          <meshBasicMaterial color="#F8FAFC" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 7. Start / Finish Checkered Indicator Pill */}
      <Html position={[sfPoint.x, sfPoint.y + 0.5, sfPoint.z]} center distanceFactor={24}>
        <div className="px-2 py-0.5 bg-red-600/90 text-white font-mono text-[9px] font-bold tracking-wider rounded border border-white/40 shadow-lg whitespace-nowrap pointer-events-none">
          🏁 START / FINISH
        </div>
      </Html>

      {/* 8. Interactive Clickable Corner Markers */}
      {corners.map((corner) => {
        const apexPos = geometries.pointAtT(corner.t);
        const isSelected = selectedCornerNumber === corner.number;
        const matchesFilter =
          filterMode === 'all' ||
          (filterMode === 'overtaking' && Boolean(corner.isOvertakingZone)) ||
          (filterMode === 'high_downforce' && Boolean(corner.isHighDownforce));

        return (
          <Html
            key={`marker-${corner.number}`}
            position={[apexPos.x, apexPos.y + 0.45, apexPos.z]}
            center
            distanceFactor={22}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCorner?.(corner.number);
                invalidate();
              }}
              className={`flex items-center justify-center w-6 h-6 rounded-full font-mono text-[10px] font-bold border transition-transform ${
                isSelected
                  ? 'bg-[#E10600] text-white border-white scale-125 shadow-[0_0_12px_rgba(225,6,0,0.8)]'
                  : matchesFilter
                  ? 'bg-[#0F141F]/90 text-slate-200 border-white/30 hover:scale-110 hover:border-white'
                  : 'bg-[#0F141F]/40 text-slate-500 border-white/10 opacity-30 pointer-events-none'
              }`}
              title={`Turn ${corner.number}: ${corner.name}`}
              aria-label={`Turn ${corner.number}: ${corner.name}`}
            >
              T{corner.number}
            </button>
          </Html>
        );
      })}

      {/* Camera Controls */}
      <CameraControls
        ref={controlsRef as React.Ref<CameraControlsImpl>}
        makeDefault
        minDistance={5}
        maxDistance={70}
        maxPolarAngle={Math.PI / 2.05}
      />
    </group>
  );
};

export const Track3DViewer: React.FC<Track3DViewerProps> = ({
  circuit,
  circuitName,
  coordinates: rawCoordsProp,
  elevationDeltaM: elevDeltaProp,
  elevationSource: elevSourceProp,
  trackSpanMeters,
  accentColor = '#00D2FF',
  viewMode: controlledViewMode,
  onViewModeChange,
  colorMode: controlledColorMode,
  onColorModeChange,
  exaggeration: controlledExaggeration,
  onExaggerationChange,
  corners = [],
  selectedCornerNumber = null,
  onSelectCorner,
  filterMode = 'all'
}) => {
  // Uncontrolled state fallbacks if not controlled by parent
  const [internalViewMode, setInternalViewMode] = useState<'3d' | '2d'>('3d');
  const [internalColorMode, setInternalColorMode] = useState<RibbonColorMode>('sectors');
  const [internalExaggeration, setInternalExaggeration] = useState<number>(4);
  const [isContextLost, setIsContextLost] = useState<boolean>(false);
  const [loadedCoords, setLoadedCoords] = useState<[number, number, number][] | null>(null);

  const controlsRef = useRef<CameraControlsImpl>(null);

  const activeViewMode = controlledViewMode ?? internalViewMode;
  const activeColorMode = controlledColorMode ?? internalColorMode;
  const activeExaggeration = controlledExaggeration ?? internalExaggeration;

  const rawSetViewMode = onViewModeChange ?? setInternalViewMode;
  const setViewMode = useCallback(
    (mode: '2d' | '3d') => {
      if (mode === '3d') {
        setIsContextLost(false);
      }
      rawSetViewMode(mode);
    },
    [rawSetViewMode]
  );
  const setColorMode = onColorModeChange ?? setInternalColorMode;
  const setExaggeration = onExaggerationChange ?? setInternalExaggeration;

  const resolvedCircuitName = circuitName || circuit?.name || 'Grand Prix Circuit';
  const resolvedElevSource =
    elevSourceProp || (circuit?.elevation ? 'open-meteo-srtm' : 'unavailable');
  const resolvedElevDelta =
    elevDeltaProp !== undefined
      ? elevDeltaProp
      : circuit?.elevation
      ? parseFloat(circuit.elevation.replace(/[^0-9.]/g, '')) || null
      : null;

  // Fetch coordinates if not provided directly
  useEffect(() => {
    if (rawCoordsProp && rawCoordsProp.length >= 4) {
      setLoadedCoords(rawCoordsProp);
      return;
    }
    if (circuit?.trackCoordinates && circuit.trackCoordinates.length >= 4) {
      setLoadedCoords(circuit.trackCoordinates);
      return;
    }

    const cId = circuit?.id;
    if (!cId) return;

    let isCancelled = false;
    fetch(`/data/circuits/${encodeURIComponent(cId)}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data?.coordinates && data.coordinates.length >= 4) {
          setLoadedCoords(data.coordinates);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [rawCoordsProp, circuit?.trackCoordinates, circuit?.id]);

  // Fallback track coordinates
  const trackCoordinates: [number, number, number][] = useMemo(() => {
    if (loadedCoords && loadedCoords.length >= 4) {
      return loadedCoords;
    }
    return [
      [-4, 0.0, -4],
      [0, 0.5, -4],
      [4, 1.2, -4],
      [4, 1.8, 0],
      [4, 1.0, 4],
      [1, 0.6, 4],
      [0, 0.2, 4],
      [-2, 0.1, 2],
      [-4, 0.0, 0],
      [-4, 0.0, -4]
    ];
  }, [loadedCoords]);

  // Build 3D geometries and deterministically dispose on rebuild / unmount
  const geometries = useMemo(() => {
    return buildCircuitGeometries({
      coordinates: trackCoordinates,
      elevationDeltaM: resolvedElevDelta,
      elevationSource: resolvedElevSource,
      trackSpanMeters,
      exaggeration: activeExaggeration,
      colorMode: activeColorMode,
      trackWidth: 0.52,
      sampleCount: 360
    });
  }, [
    trackCoordinates,
    resolvedElevDelta,
    resolvedElevSource,
    trackSpanMeters,
    activeExaggeration,
    activeColorMode
  ]);

  useEffect(() => {
    return () => {
      geometries.ribbonGeometry.dispose();
      geometries.leftBorderGeometry.dispose();
      geometries.rightBorderGeometry.dispose();
      geometries.curtainGeometry.dispose();
      geometries.dropLinesGeometry.dispose();
      geometries.groundShadowGeometry.dispose();
      geometries.kerbRedGeometry.dispose();
      geometries.kerbWhiteGeometry.dispose();
    };
  }, [geometries]);

  // Keyboard shortcuts 2 and 3 outside editable inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        setViewMode('2d');
      } else if (e.key === '3') {
        e.preventDefault();
        setViewMode('3d');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewMode]);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current && geometries) {
      controlsRef.current.setLookAt(
        12,
        11,
        14,
        0,
        geometries.maxScaledHeight * 0.35,
        0,
        true
      );
    }
  }, [geometries]);

  return (
    <div className="relative flex flex-col w-full bg-[#0B0E14] border border-white/10 rounded-lg overflow-hidden select-none">
      {/* 2D SVG Mode Viewport (zero WebGL canvas mounted) */}
      {activeViewMode === '2d' ? (
        <Track2DMap
          circuitName={resolvedCircuitName}
          coordinates={trackCoordinates}
          elevationSource={resolvedElevSource}
          colorMode={activeColorMode}
          corners={corners}
          selectedCornerNumber={selectedCornerNumber}
          onSelectCorner={onSelectCorner}
          filterMode={filterMode}
        />
      ) : (
        /* 3D Elevation Mode Viewport */
        <div className="relative w-full h-[540px] bg-[#090B10]">
          {isContextLost ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090B10] p-6 text-center z-30" role="alert">
              <span className="text-3xl mb-2">⚠️</span>
              <h3 className="text-lg font-bold text-white mb-2 font-mono">TRACK GPU PIPELINE SUSPENDED</h3>
              <p className="text-sm text-slate-400 mb-4 max-w-sm">
                WebGL context was suspended by the operating system. You can switch to the crisp 2D SVG map or restore canvas.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-mono font-bold text-xs rounded transition-colors"
                  onClick={() => setIsContextLost(false)}
                >
                  RESTORE CANVAS
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs rounded transition-colors"
                  onClick={() => setViewMode('2d')}
                >
                  SWITCH TO 2D SVG
                </button>
              </div>
            </div>
          ) : (
            <CanvasErrorBoundary fallbackTitle={`${resolvedCircuitName} 3D Track Map`} onReset={handleResetCamera}>
              <Canvas
                shadows={false}
                dpr={[1, 2]}
                camera={{ position: [12, 11, 14], fov: 40, near: 0.1, far: 200 }}
                gl={{ antialias: true, alpha: true }}
              >
                <TrackWebGLGuard
                  onLost={() => setIsContextLost(true)}
                  onRestored={() => setIsContextLost(false)}
                />
                <TrackInvalidator
                  trigger={`${resolvedCircuitName}_${activeColorMode}_${activeExaggeration}_${selectedCornerNumber}`}
                />
                <PerfDebugCollector />

                <ambientLight intensity={0.9} />
                <directionalLight position={[10, 20, 15]} intensity={1.5} color="#FFFFFF" />
                <pointLight position={[-10, 10, -10]} intensity={0.8} color={accentColor} />

                <ProceduralTrackScene
                  geometries={geometries}
                  corners={corners}
                  selectedCornerNumber={selectedCornerNumber}
                  onSelectCorner={onSelectCorner}
                  filterMode={filterMode}
                  controlsRef={controlsRef}
                />
              </Canvas>
            </CanvasErrorBoundary>
          )}
        </div>
      )}

      {/* Floating Translucent HUD Dock (Matching I-03) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-[#090B10]/90 backdrop-blur-md border border-white/15 rounded-md shadow-2xl max-w-[95%]">
        {/* 1. Segmented 2D SVG | 3D Elevation Toggle */}
        <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10 text-xs font-mono">
          <button
            type="button"
            className={`px-2.5 py-1 rounded transition-colors ${
              activeViewMode === '2d'
                ? 'bg-sky-500 text-black font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
            onClick={() => setViewMode('2d')}
            title="Press '2' for 2D SVG map"
          >
            2D SVG
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded transition-colors ${
              activeViewMode === '3d'
                ? 'bg-sky-500 text-black font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
            onClick={() => setViewMode('3d')}
            title="Press '3' for 3D elevation view"
          >
            3D Elevation
          </button>
        </div>

        {/* 2. Elevation Scale Selector (3D Mode only) */}
        {activeViewMode === '3d' && (
          <div className="flex items-center gap-1 text-xs font-mono">
            {resolvedElevSource === 'open-meteo-srtm' ? (
              <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10">
                <span className="text-[10px] text-slate-400 px-1.5 hidden sm:inline">ELEVATION SCALE:</span>
                {[1, 2, 4, 5].map((scale) => (
                  <button
                    key={`elev-scale-${scale}`}
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      activeExaggeration === scale
                        ? 'bg-[#E10600] text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    onClick={() => setExaggeration(scale)}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            ) : (
              <span className="px-2 py-1 bg-black/40 border border-white/10 rounded text-[10px] text-slate-400">
                Flat Track (No SRTM)
              </span>
            )}
          </div>
        )}

        {/* 3. Ribbon Color Mode Switcher */}
        <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10 text-xs font-mono">
          {(['sectors', 'elevation', 'speed_drs'] as const).map((mode) => {
            const labels = {
              sectors: 'Sectors',
              elevation: 'Elevation',
              speed_drs: 'Speed & DRS'
            };
            return (
              <button
                key={`color-mode-${mode}`}
                type="button"
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  activeColorMode === mode
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setColorMode(mode)}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {/* 4. Reset Camera View Button (3D Mode only) */}
        {activeViewMode === '3d' && (
          <button
            type="button"
            className="px-2.5 py-1 bg-black/40 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded text-xs font-mono transition-colors"
            onClick={handleResetCamera}
            title="Reset to 45° overview camera angle"
          >
            Reset View
          </button>
        )}
      </div>
    </div>
  );
};
