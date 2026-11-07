import * as THREE from 'three';
import type { IntegerVec3 } from '../../editor/sceneTypes';

export function createCylinderElementGeometry(dimensionsMm: IntegerVec3, sceneUnitsPerMm: number) {
  const [width, height, depth] = dimensionsMm.map(value => value * sceneUnitsPerMm);
  const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  geometry.scale(width, height, depth);
  return geometry;
}
