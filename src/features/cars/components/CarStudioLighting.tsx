import React from 'react';
import { Environment, Lightformer } from '@react-three/drei';

interface CarStudioLightingProps {
  selectedTeamColor?: string;
}

/**
 * High-fidelity Studio Lighting Pipeline with procedural Lightformers
 * and offline Environment reflections.
 * Strict constraint: ZERO external CDN HDRI network requests (no preset="..." props).
 */
export const CarStudioLighting: React.FC<CarStudioLightingProps> = ({ selectedTeamColor }) => {
  return (
    <>
      {/* Subtle base ambient fill */}
      <ambientLight intensity={0.4} />

      {/* Primary directional sun for crisp shadow casting */}
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Secondary fill light */}
      <directionalLight position={[-4, 4, -4]} intensity={0.6} color="#94A3B8" />

      {/* Offline Synthetic Studio Softbox Environment */}
      <Environment resolution={256} frames={1}>
        {/* Overhead Key Softbox */}
        <Lightformer
          form="rect"
          intensity={2.8}
          position={[0, 6, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 5, 1]}
          color="#FFFFFF"
        />

        {/* Left Rim / Kicker */}
        <Lightformer
          form="rect"
          intensity={1.8}
          position={[-5, 2, -2]}
          scale={[8, 2, 1]}
          color="#E2E8F0"
        />

        {/* Right Rim / Warm Kicker */}
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[5, 2, 2]}
          scale={[8, 2, 1]}
          color="#CBD5E1"
        />

        {/* Dynamic Team Colored Kicker */}
        {selectedTeamColor && (
          <Lightformer
            form="rect"
            intensity={1.4}
            position={[3, 1, -4]}
            scale={[6, 1.5, 1]}
            color={selectedTeamColor}
          />
        )}

        {/* Ground Bounce Ring */}
        <Lightformer
          form="ring"
          intensity={0.8}
          position={[0, -1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={10}
          color="#94A3B8"
        />
      </Environment>
    </>
  );
};
