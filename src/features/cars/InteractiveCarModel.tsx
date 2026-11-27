import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Team } from '../../types/f1';
import { WindTunnel } from './WindTunnel';
import {
  getCanonicalMaterialZone,
  createEraCarMaterials,
  disposeCarMaterials,
} from './carMaterialMapper';
import { getTeamLiveryTextures } from './carLiveryGenerator';
import type { CarEraSpec } from './carEraRegistry';
import { Regulation2026Overlay, type ActiveAeroMode } from './components/Regulation2026Overlay';
import { disposeObject3D } from '../../utils/webglDisposal';

export interface PartHoverInfo {
  name: string;
  category: 'CHASSIS' | 'AERO' | 'POWER UNIT' | 'TYRES';
  detail: string;
  stat: string;
}

interface InteractiveCarModelProps {
  team: Team;
  showAero: boolean;
  hasReducedMotion?: boolean;
  onHoverPart?: (info: PartHoverInfo | null) => void;
  is2026Inspector?: boolean;
  activeAeroMode?: ActiveAeroMode;
  eraSpec?: CarEraSpec;
  modelUrl?: string;
}

const ASSETS_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ASSETS_BASE_URL) || '/';
const DEFAULT_MODEL_URL = `${ASSETS_BASE_URL.replace(/\/$/, '')}/models/2024_ground_effect.glb`;

export const InteractiveCarModel: React.FC<InteractiveCarModelProps> = ({
  team,
  showAero,
  hasReducedMotion = false,
  onHoverPart,
  is2026Inspector = false,
  activeAeroMode = 'corner',
  eraSpec,
  modelUrl = eraSpec?.modelPath ?? DEFAULT_MODEL_URL,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const frontFlapRef = useRef<THREE.Object3D | null>(null);
  const rearFlapRef = useRef<THREE.Object3D | null>(null);

  // Load the authentic CAD F1 Chassis GLB model with self-hosted Draco decoder
  const { scene } = useGLTF(modelUrl, '/draco/');

  // Clone the scene and apply component-specific clearcoat PBR materials & procedural liveries
  const { clone: clonedScene, materials, liveryTextures } = useMemo(() => {
    const clone = scene.clone(true);
    const liveryTextures = getTeamLiveryTextures(team);
    const materials = createEraCarMaterials({ team, eraSpec, liveryTextures });

    frontFlapRef.current = null;
    rearFlapRef.current = null;

    // Map each child mesh according to its authentic CAD sub-assembly / Blender zone
    clone.traverse((child) => {
      if (child.name === 'front_wing_active_flap') {
        frontFlapRef.current = child;
      } else if (child.name === 'rear_wing_active_flap') {
        rearFlapRef.current = child;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const matName = Array.isArray(mesh.material)
          ? mesh.material[0]?.name
          : mesh.material?.name;

        const zone = getCanonicalMaterialZone(matName);
        mesh.material = materials[zone];
      }
    });

    // EXACT VERIFIED HORIZONTAL TRACK ALIGNMENT:
    // Euler(180°, -90°, 180°) places Length along X (5.09 units), Height along Y (1.00 unit), Width along Z (1.82 units).
    // The bottom of the tyres touches ground plane Y = 0.00.
    clone.rotation.set(Math.PI, -Math.PI / 2, Math.PI);
    clone.scale.set(0.11, 0.11, 0.11);
    clone.position.set(-0.0057, -0.0007, -0.0005);

    return { clone, materials, liveryTextures };
  }, [scene, team, eraSpec]);

  // Deterministically dispose locally created cloned materials & procedural textures on team change/unmount
  // (skipGeometries: true protects useGLTF's cached shared BufferGeometry primitives!)
  useEffect(() => {
    return () => {
      disposeObject3D(clonedScene, { skipGeometries: true });
      disposeCarMaterials(materials);
      liveryTextures.dispose();
    };
  }, [clonedScene, materials, liveryTextures]);

  // Subtle chassis idle vibration & 2026 active aerodynamics flap articulation
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    if (!showAero && !hasReducedMotion) {
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.015;
    } else {
      groupRef.current.position.y = 0;
    }

    // Articulate 2026 active aero flaps between Z-Mode (Corner) and X-Mode (Straight)
    if (eraSpec?.id === '2026_active_aero') {
      const isStraight = activeAeroMode === 'straight';
      const targetPitch = isStraight ? -0.32 : 0.0;
      if (frontFlapRef.current) {
        frontFlapRef.current.rotation.y = THREE.MathUtils.lerp(
          frontFlapRef.current.rotation.y,
          targetPitch,
          Math.min(1, delta * 8)
        );
      }
      if (rearFlapRef.current) {
        rearFlapRef.current.rotation.y = THREE.MathUtils.lerp(
          rearFlapRef.current.rotation.y,
          targetPitch,
          Math.min(1, delta * 8)
        );
      }
    }
  });

  const teamColor = team.color;

  const handlePointerOver = (
    e: ThreeEvent<PointerEvent>,
    name: string,
    category: 'CHASSIS' | 'AERO' | 'POWER UNIT' | 'TYRES',
    detail: string,
    stat: string
  ) => {
    e.stopPropagation();
    if (onHoverPart) {
      onHoverPart({
        name,
        category,
        detail,
        stat
      });
    }
  };

  const handlePointerOut = () => {
    if (onHoverPart) {
      onHoverPart(null);
    }
  };

  return (
    <group ref={groupRef} dispose={null}>
      {/* Wind Tunnel Aerodynamic Particles when activated */}
      {showAero && <WindTunnel color={teamColor} speed={4.2} />}

      {/* ── AUTHENTIC CAD F1 VEHICLE MODEL ── */}
      <primitive
        object={clonedScene}
        onPointerOver={(e: ThreeEvent<PointerEvent>) =>
          handlePointerOver(e, `${team.name} ${team.carName}`, 'CHASSIS', team.specs.chassis, `Power Unit: ${team.specs.powerUnit}`)
        }
        onPointerOut={handlePointerOut}
      />

      {/* 2026 FIA Regulation 3D Inspector Overlay */}
      {is2026Inspector && (
        <Regulation2026Overlay
          activeAeroMode={activeAeroMode}
          onHoverPart={onHoverPart}
          accentColor={teamColor}
        />
      )}

      {/* Interactive Raycast Telemetry Target Hotspots (Active in standard view) */}
      {!is2026Inspector && (
        <>
          {/* Front Wing Hotspot */}
          <mesh
            position={[2.0, 0.25, 0]}
            visible={false}
            onPointerOver={(e) =>
              handlePointerOver(e, `${team.carName} Multi-Element Front Wing`, 'AERO', '4-Tier ground-effect outwash wing cascade', `Downforce: ${team.specs.downforce}`)
            }
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[1.2, 0.4, 2.0]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Halo & Cockpit Hotspot */}
          <mesh
            position={[0.45, 0.65, 0]}
            visible={false}
            onPointerOver={(e) =>
              handlePointerOver(e, 'Titanium Halo & Cockpit Surround', 'CHASSIS', 'Grade 5 Titanium Safety Cell (125 kN Load)', `Team: ${team.name}`)
            }
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[1.0, 0.5, 0.8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Sidepods Hotspot */}
          <mesh
            position={[0.2, 0.4, 0.7]}
            visible={false}
            onPointerOver={(e) =>
              handlePointerOver(e, 'Undercut Venturi Sidepod Channel', 'AERO', 'Downwash sidepod profile directing cooling airflow to floor', `Weight: ${team.specs.weight}`)
            }
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[1.8, 0.45, 0.6]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Engine & Power Unit Hotspot */}
          <mesh
            position={[-0.4, 0.7, 0]}
            visible={false}
            onPointerOver={(e) =>
              handlePointerOver(e, 'Turbo-Hybrid Power Unit & Airbox', 'POWER UNIT', team.specs.powerUnit, `Top Speed: ${team.specs.topSpeed}`)
            }
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[1.6, 0.6, 0.7]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Rear Wing Hotspot */}
          <mesh
            position={[-1.9, 0.8, 0]}
            visible={false}
            onPointerOver={(e) =>
              handlePointerOver(e, 'Rear Wing & DRS Actuator', 'AERO', 'Drag Reduction System (DRS) Slot Actuator & Endplate Vanes', `Top Speed: ${team.specs.topSpeed}`)
            }
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.8, 0.6, 1.8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Preload the default GLB model with self-hosted Draco decoder for instantaneous rendering
useGLTF.preload(DEFAULT_MODEL_URL, '/draco/');
