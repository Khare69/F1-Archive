import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WindTunnelProps {
  particleCount?: number;
  color?: string;
  speed?: number;
}

export const WindTunnel: React.FC<WindTunnelProps> = ({
  particleCount = 2000,
  color = '#00D2FF',
  speed = 4
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate initial particle stream points distributed around the car tunnel
  const { positions, velocities, initialX } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount);
    const initX = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // X spans from +6 (front) to -6 (back)
      const x = (Math.random() - 0.5) * 12;
      // Y spans above ground to cockpit height
      const y = Math.random() * 2.0 + 0.05;
      // Z spans lateral width of car
      const z = (Math.random() - 0.5) * 3.5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initX[i] = 6 + Math.random() * 2;
      vel[i] = 2.5 + Math.random() * 3.5;
    }

    return {
      positions: pos,
      velocities: vel,
      initialX: initX
    };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      // Move from front to back (+X to -X)
      posArray[idx] -= (velocities[i] * speed * delta);

      // Aerodynamic curve deflection simulation:
      // When air reaches front wing (X ~ 2.0 to 1.0), deflect upwards and sideways
      const x = posArray[idx];
      const z = posArray[idx + 2];

      if (x > -1.5 && x < 2.5) {
        // Airflow lifts slightly over nose cone and cockpit
        const distFromCenter = Math.abs(z);
        if (distFromCenter < 0.8) {
          posArray[idx + 1] += Math.sin((x + 1.5) * 0.8) * 0.015;
        }
      }

      // Reset particles when they exit the rear diffuser/wing
      if (posArray[idx] < -6) {
        posArray[idx] = initialX[i];
        posArray[idx + 1] = Math.random() * 2.0 + 0.05;
        posArray[idx + 2] = (Math.random() - 0.5) * 3.5;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
