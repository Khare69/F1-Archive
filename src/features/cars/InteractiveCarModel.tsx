import React, { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Team } from '../../types/f1';
import { WindTunnel } from './WindTunnel';

export interface PartHoverInfo {
  name: string;
  category: 'CHASSIS' | 'AERO' | 'POWER UNIT' | 'TYRES';
  detail: string;
  stat: string;
}

interface InteractiveCarModelProps {
  team: Team;
  showAero: boolean;
  onHoverPart?: (info: PartHoverInfo | null) => void;
}

// Authentic team-specific dual-tone color schemes
const TEAM_COLOR_SCHEMES: Record<string, { primary: string; secondary: string; accent: string; carbon: string }> = {
  redbull: { primary: '#0808EF', secondary: '#FCD116', accent: '#E8002D', carbon: '#0A0E18' },
  ferrari: { primary: '#E8002D', secondary: '#FFE500', accent: '#FFFFFF', carbon: '#0C0E14' },
  mercedes: { primary: '#C8D0DC', secondary: '#00A19B', accent: '#111726', carbon: '#0D111A' },
  mclaren: { primary: '#FF8000', secondary: '#1A1E29', accent: '#00D2FF', carbon: '#0F131D' },
  aston: { primary: '#00594F', secondary: '#CEDC00', accent: '#003B34', carbon: '#0A1014' },
  alpine: { primary: '#0078D0', secondary: '#FF87BC', accent: '#0E1422', carbon: '#0B0F18' },
  williams: { primary: '#005AFF', secondary: '#041E42', accent: '#E4002B', carbon: '#0A0E1A' },
  rb: { primary: '#1534CC', secondary: '#FFFFFF', accent: '#D90026', carbon: '#0B101E' },
  sauber: { primary: '#00E701', secondary: '#090D14', accent: '#00B301', carbon: '#080B10' },
  haas: { primary: '#11151F', secondary: '#FFFFFF', accent: '#E6002B', carbon: '#0A0D14' },
  lotus: { primary: '#0A0A0A', secondary: '#FFB800', accent: '#FFD700', carbon: '#060606' },
  benetton: { primary: '#0088CE', secondary: '#009E49', accent: '#FFFFFF', carbon: '#0A0F1A' },
  brawn: { primary: '#FFFFFF', secondary: '#BDFE00', accent: '#11151F', carbon: '#0E121B' }
};

export const InteractiveCarModel: React.FC<InteractiveCarModelProps> = ({
  team,
  showAero,
  onHoverPart
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Load the authentic CAD F1 Chassis GLB model
  const { scene } = useGLTF('/models/f1_chassis.glb');

  // Clone the scene and apply component-specific high-gloss PBR materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const colors = TEAM_COLOR_SCHEMES[team.id] || {
      primary: team.color,
      secondary: '#FFFFFF',
      accent: '#00D2FF',
      carbon: '#0D111A'
    };

    // 1. High-Gloss Metallic Team Lacquer (Monocoque, Sidepods, Engine Cowling)
    const bodyPaint = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colors.primary),
      metalness: 0.88,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
      envMapIntensity: 1.8
    });

    // 2. Secondary Dual-Tone Accent Paint (Rear Wing Endplates & Cowl Stripes)
    const accentPaint = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colors.secondary),
      metalness: 0.78,
      roughness: 0.18,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      envMapIntensity: 1.4
    });

    // 3. Raw Pre-Preg Carbon Fiber Composite (Front Wing Cascade, Floor, Diffuser)
    const carbonComposite = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.carbon),
      metalness: 0.35,
      roughness: 0.52,
      envMapIntensity: 0.9
    });

    // 4. Pirelli P-Zero Soft Compound Tyres (Matte Rubber)
    const tyreRubber = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#14161F'),
      metalness: 0.06,
      roughness: 0.92,
      envMapIntensity: 0.4
    });

    // 5. Grade 5 Titanium Halo & Wheel Hubs
    const titaniumMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C8CED8'),
      metalness: 0.92,
      roughness: 0.16,
      envMapIntensity: 1.5
    });

    // 6. Internal Radiator Ducts & Brake Assemblies
    const darkMechanicals = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#080A10'),
      metalness: 0.2,
      roughness: 0.85
    });

    // Map each child mesh according to its authentic CAD sub-assembly
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const matName = Array.isArray(mesh.material)
          ? mesh.material[0]?.name
          : mesh.material?.name;

        switch (matName) {
          case 'Default_OBJ.003': // Main Monocoque Body & Engine Cover
          case 'Default_OBJ.007': // Nosecone & Front Crash Structure
          case 'Default_OBJ.008': // Cockpit Flanks & Upper Body
            mesh.material = bodyPaint;
            break;

          case 'Default_OBJ.006': // Rear Wing & Endplates
            mesh.material = accentPaint;
            break;

          case 'Default_OBJ.005': // Front Wing Multi-Tier Airfoils & Floor Diffuser
          case 'Default_OBJ.009': // Suspension Carbon Wishbones
            mesh.material = carbonComposite;
            break;

          case 'Default_OBJ.011': // Front-Left Wheel & Tyre
          case 'Default_OBJ.013': // Front-Right Wheel & Tyre
          case 'Default_OBJ.004': // Rear Driven Axle Wheels & Tyres
            mesh.material = tyreRubber;
            break;

          case 'Default_OBJ.002': // Titanium Halo Safety Cell & Mirror Stems
            mesh.material = titaniumMetal;
            break;

          case 'Default_OBJ.001': // Brake Discs, Internal Radiators & Gearbox
          default:
            mesh.material = darkMechanicals;
            break;
        }
      }
    });

    // EXACT VERIFIED HORIZONTAL TRACK ALIGNMENT:
    // Euler(180°, -90°, 180°) places Length along X (5.09 units), Height along Y (1.00 unit), Width along Z (1.82 units).
    // The bottom of the tyres touches ground plane Y = 0.00.
    clone.rotation.set(Math.PI, -Math.PI / 2, Math.PI);
    clone.scale.set(0.11, 0.11, 0.11);
    clone.position.set(-0.0057, -0.0007, -0.0005);

    return clone;
  }, [scene, team]);

  // Subtle chassis idle vibration
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (!showAero) {
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.015;
    } else {
      groupRef.current.position.y = 0;
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

      {/* Interactive Raycast Telemetry Target Hotspots */}
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
    </group>
  );
};

// Preload the GLB model for instantaneous rendering
useGLTF.preload('/models/f1_chassis.glb');
