import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraTrackingLightProps {
  intensity?: number;
  color?: string;
  castShadow?: boolean;
}

/**
 * CameraTrackingLight co-locates a directional key light and spotlight with the user's camera viewpoint.
 * As the user orbits, zooms, or pans around the 3D car, the light source dynamically follows their point of view,
 * ensuring specular highlights, realistic surface shadows, and carbon reflections are always perfectly illuminated
 * from the user's perspective.
 */
export const CameraTrackingLight: React.FC<CameraTrackingLightProps> = ({
  intensity = 1.4,
  color = '#FFFFFF',
  castShadow = true
}) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame(({ camera }) => {
    if (!lightRef.current) return;
    
    // Position light slightly offset from camera position towards the car center
    lightRef.current.position.set(
      camera.position.x,
      camera.position.y + 0.5,
      camera.position.z
    );

    // Light always focuses on the center of the chassis
    lightRef.current.target = targetRef.current;
  });

  return (
    <>
      <primitive object={targetRef.current} position={[0, 0.4, 0]} />
      <directionalLight
        ref={lightRef}
        intensity={intensity}
        color={color}
        castShadow={castShadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
    </>
  );
};
