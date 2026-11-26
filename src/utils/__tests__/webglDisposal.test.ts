import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  disposeMaterial,
  disposeObject3D,
  attachWebGLContextLossGuard
} from '../webglDisposal';

describe('webglDisposal', () => {
  describe('disposeMaterial', () => {
    it('returns 0 for null or undefined material', () => {
      expect(disposeMaterial(null)).toEqual({ materials: 0, textures: 0 });
      expect(disposeMaterial(undefined)).toEqual({ materials: 0, textures: 0 });
    });

    it('disposes a single material and attached textures', () => {
      const material = new THREE.MeshStandardMaterial();
      const texture1 = new THREE.Texture();
      const texture2 = new THREE.Texture();
      material.map = texture1;
      material.normalMap = texture2;

      const matDisposeSpy = vi.spyOn(material, 'dispose');
      const tex1DisposeSpy = vi.spyOn(texture1, 'dispose');
      const tex2DisposeSpy = vi.spyOn(texture2, 'dispose');

      const stats = disposeMaterial(material);

      expect(matDisposeSpy).toHaveBeenCalledTimes(1);
      expect(tex1DisposeSpy).toHaveBeenCalledTimes(1);
      expect(tex2DisposeSpy).toHaveBeenCalledTimes(1);
      expect(stats).toEqual({ materials: 1, textures: 2 });
    });

    it('disposes an array of materials deduplicating shared textures', () => {
      const mat1 = new THREE.MeshBasicMaterial();
      const mat2 = new THREE.MeshBasicMaterial();
      const sharedTex = new THREE.Texture();
      mat1.map = sharedTex;
      mat2.map = sharedTex;

      const texSpy = vi.spyOn(sharedTex, 'dispose');
      const mat1Spy = vi.spyOn(mat1, 'dispose');
      const mat2Spy = vi.spyOn(mat2, 'dispose');

      const stats = disposeMaterial([mat1, mat2]);

      expect(mat1Spy).toHaveBeenCalledTimes(1);
      expect(mat2Spy).toHaveBeenCalledTimes(1);
      expect(texSpy).toHaveBeenCalledTimes(1); // Disposed exactly once!
      expect(stats).toEqual({ materials: 2, textures: 1 });
    });

    it('respects skipTextures option', () => {
      const material = new THREE.MeshStandardMaterial();
      const texture = new THREE.Texture();
      material.map = texture;

      const texSpy = vi.spyOn(texture, 'dispose');
      const stats = disposeMaterial(material, { skipTextures: true });

      expect(texSpy).not.toHaveBeenCalled();
      expect(stats).toEqual({ materials: 1, textures: 0 });
    });
  });

  describe('disposeObject3D', () => {
    it('returns 0 stats for null or undefined root', () => {
      expect(disposeObject3D(null)).toEqual({ geometries: 0, materials: 0, textures: 0 });
      expect(disposeObject3D(undefined)).toEqual({ geometries: 0, materials: 0, textures: 0 });
    });

    it('disposes nested hierarchies and deduplicates shared geometries and materials', () => {
      const root = new THREE.Group();

      const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
      const sharedMaterial = new THREE.MeshBasicMaterial();
      const texture = new THREE.Texture();
      sharedMaterial.map = texture;

      const mesh1 = new THREE.Mesh(sharedGeometry, sharedMaterial);
      const mesh2 = new THREE.Mesh(sharedGeometry, sharedMaterial);

      const uniqueGeometry = new THREE.BufferGeometry();
      const matA = new THREE.MeshBasicMaterial();
      const matB = new THREE.MeshBasicMaterial();
      const instancedMesh = new THREE.InstancedMesh(uniqueGeometry, [matA, matB], 5);

      const lineGeo = new THREE.BufferGeometry();
      const lineMat = new THREE.LineBasicMaterial();
      const line = new THREE.Line(lineGeo, lineMat);

      root.add(mesh1);
      root.add(mesh2);
      root.add(instancedMesh);
      root.add(line);

      const sharedGeoSpy = vi.spyOn(sharedGeometry, 'dispose');
      const uniqueGeoSpy = vi.spyOn(uniqueGeometry, 'dispose');
      const lineGeoSpy = vi.spyOn(lineGeo, 'dispose');
      const sharedMatSpy = vi.spyOn(sharedMaterial, 'dispose');
      const matASpy = vi.spyOn(matA, 'dispose');
      const matBSpy = vi.spyOn(matB, 'dispose');
      const lineMatSpy = vi.spyOn(lineMat, 'dispose');
      const texSpy = vi.spyOn(texture, 'dispose');

      const stats = disposeObject3D(root);

      // Verify each resource is disposed exactly once
      expect(sharedGeoSpy).toHaveBeenCalledTimes(1);
      expect(uniqueGeoSpy).toHaveBeenCalledTimes(1);
      expect(lineGeoSpy).toHaveBeenCalledTimes(1);
      expect(sharedMatSpy).toHaveBeenCalledTimes(1);
      expect(matASpy).toHaveBeenCalledTimes(1);
      expect(matBSpy).toHaveBeenCalledTimes(1);
      expect(lineMatSpy).toHaveBeenCalledTimes(1);
      expect(texSpy).toHaveBeenCalledTimes(1);

      expect(stats).toEqual({
        geometries: 3, // sharedGeometry, uniqueGeometry, lineGeo
        materials: 4,  // sharedMaterial, matA, matB, lineMat
        textures: 1    // texture
      });
    });

    it('preserves geometries when skipGeometries: true is passed', () => {
      const root = new THREE.Group();
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      root.add(mesh);

      const geoSpy = vi.spyOn(geometry, 'dispose');
      const matSpy = vi.spyOn(material, 'dispose');

      const stats = disposeObject3D(root, { skipGeometries: true });

      expect(geoSpy).not.toHaveBeenCalled();
      expect(matSpy).toHaveBeenCalledTimes(1);
      expect(stats.geometries).toBe(0);
      expect(stats.materials).toBe(1);
    });
  });

  describe('attachWebGLContextLossGuard', () => {
    it('attaches listeners, prevents default on context lost, calls callbacks, and cleans up', () => {
      const canvas = document.createElement('canvas');
      const onLost = vi.fn();
      const onRestored = vi.fn();

      const cleanup = attachWebGLContextLossGuard(canvas, onLost, onRestored);

      // Simulate webglcontextlost event
      const lostEvent = new Event('webglcontextlost', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(lostEvent, 'preventDefault');
      canvas.dispatchEvent(lostEvent);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(onLost).toHaveBeenCalledTimes(1);

      // Simulate webglcontextrestored event
      const restoredEvent = new Event('webglcontextrestored');
      canvas.dispatchEvent(restoredEvent);

      expect(onRestored).toHaveBeenCalledTimes(1);

      // Teardown
      cleanup();

      // Dispatch again after cleanup
      canvas.dispatchEvent(lostEvent);
      canvas.dispatchEvent(restoredEvent);

      expect(onLost).toHaveBeenCalledTimes(1);
      expect(onRestored).toHaveBeenCalledTimes(1);
    });
  });
});
