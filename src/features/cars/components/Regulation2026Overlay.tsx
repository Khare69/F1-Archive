import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { PartHoverInfo } from '../InteractiveCarModel';

export type ActiveAeroMode = 'corner' | 'straight';

interface Regulation2026OverlayProps {
  activeAeroMode: ActiveAeroMode;
  onHoverPart?: (info: PartHoverInfo | null) => void;
  accentColor?: string;
}

/**
 * 2026 FIA Technical Regulations 3D Comparison & Hotspot Overlay
 * Renders:
 * 1. Parametric wireframe bounding boxes comparing 2022-2025 vs 2026 dimensions
 * 2. 3D interactive beacon markers for 2026 Active Aero, 50-50 PU, and Manual Override Mode
 * 3. Active Aero aerodynamic indicators (Straight vs Corner mode)
 */
export const Regulation2026Overlay: React.FC<Regulation2026OverlayProps> = ({
  activeAeroMode,
  onHoverPart,
  accentColor = '#00ffcc'
}) => {
  // 1. Box geometries for era dimension comparison
  // 2022-2025 Car: 3.6m wheelbase, 2.0m width, 800kg weight
  const box2022 = useMemo(() => new THREE.BoxGeometry(5.25, 0.96, 1.96), []);
  // 2026 Car: 3.4m wheelbase (-200mm), 1.9m width (-100mm), 768kg weight (-32kg)
  const box2026 = useMemo(() => new THREE.BoxGeometry(4.88, 0.94, 1.82), []);

  const handlePointerOver = (
    e: { stopPropagation: () => void },
    name: string,
    category: 'CHASSIS' | 'AERO' | 'POWER UNIT' | 'TYRES',
    detail: string,
    stat: string
  ) => {
    e.stopPropagation();
    if (onHoverPart) {
      onHoverPart({ name, category, detail, stat });
    }
  };

  const handlePointerOut = () => {
    if (onHoverPart) {
      onHoverPart(null);
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* ── 2022-2025 Era Baseline Wireframe (Amber Dim) ── */}
      <mesh position={[0.05, 0.48, 0]} geometry={box2022}>
        <meshBasicMaterial
          color="#f59e0b"
          wireframe
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2026 "Nimble Car" Regulations Wireframe (Neon Cyan) ── */}
      <mesh position={[0.05, 0.47, 0]} geometry={box2026}>
        <meshBasicMaterial
          color={accentColor}
          wireframe
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* ── Interactive 3D Beacon Hotspots for 2026 Innovations ── */}

      {/* 1. Rear Wing Active Aero Hotspot (replacing DRS) */}
      <group position={[-1.9, 0.85, 0]}>
        <mesh
          onPointerOver={(e) =>
            handlePointerOver(
              e,
              `2026 Active Rear Wing [${activeAeroMode === 'straight' ? 'STRAIGHT (LOW DRAG)' : 'CORNER (HIGH DOWNFORCE)'}]`,
              'AERO',
              `Replaces DRS entirely. Driver activates Straight Mode on straights to reduce drag by ~30%. Corner Mode engages automatically upon braking or high lateral-g to provide maximum stability. Current mode: ${activeAeroMode.toUpperCase()}.`,
              'Active Aero: Dual-Mode Wing (-30% Drag)'
            )
          }
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial
            color={activeAeroMode === 'straight' ? '#00ffcc' : '#ff4444'}
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* 2. Front Wing Synchronized Active Flaps */}
      <group position={[2.0, 0.3, 0]}>
        <mesh
          onPointerOver={(e) =>
            handlePointerOver(
              e,
              '2026 Synchronized Active Front Wing',
              'AERO',
              'Active multi-element front flaps work in lockstep with the rear wing to preserve aerodynamic balance and balance shifts at 300+ km/h.',
              'Aero Balance: Coordinated Active Flaps'
            )
          }
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.7} />
        </mesh>
      </group>

      {/* 3. 50-50 Power Unit & 100% Sustainable Fuel */}
      <group position={[-0.4, 0.7, 0]}>
        <mesh
          onPointerOver={(e) =>
            handlePointerOver(
              e,
              '2026 50-50 Turbo-Hybrid Power Unit',
              'POWER UNIT',
              'MGU-H heat recovery eliminated to reduce costs and complexity. 1.6L V6 turbocharged ICE produces 400 kW (535 hp) fueled by 100% advanced sustainable e-fuel. Electric MGU-K output nearly tripled to 350 kW (~470 hp).',
              'PU Split: 535 hp ICE + 470 hp Electric (~1,000 hp)'
            )
          }
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.75} />
        </mesh>
      </group>

      {/* 4. Manual Override Mode (Overtake Assist) */}
      <group position={[0.45, 0.65, 0]}>
        <mesh
          onPointerOver={(e) =>
            handlePointerOver(
              e,
              'Manual Override Mode (MOM / Overtake Assist)',
              'POWER UNIT',
              'Replaces DRS aerodynamic overtakes: within 1.0 second of a car ahead at over 290 km/h, the trailing driver receives +0.5 MJ of surplus electrical energy, tapering off at 355 km/h.',
              'MOM Boost: +0.5 MJ within 1.0s gap'
            )
          }
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#eab308" wireframe transparent opacity={0.8} />
        </mesh>
      </group>

      {/* 5. Nimble Car Weight & Dimension Reduction */}
      <group position={[0.0, 0.15, 0.9]}>
        <mesh
          onPointerOver={(e) =>
            handlePointerOver(
              e,
              '2026 Nimble Car Architecture',
              'CHASSIS',
              'Overall minimum mass trimmed from 800 kg to 768 kg (-32 kg). Wheelbase shortened from 3,600 mm to 3,400 mm (-200 mm), and width narrowed from 2,000 mm to 1,900 mm (-100 mm) to dramatically enhance wheel-to-wheel overtaking.',
              'Dim: 3.4m Wheelbase | 1.9m Width | 768 kg'
            )
          }
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.75} />
        </mesh>
      </group>
    </group>
  );
};
