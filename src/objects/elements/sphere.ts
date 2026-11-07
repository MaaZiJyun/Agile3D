import * as THREE from 'three';
import type { IntegerVec3 } from '../../editor/sceneTypes';

export function createSphereElementGeometry(dimensionsMm: IntegerVec3, sceneUnitsPerMm: number) {
  const [width, height, depth] = dimensionsMm.map(value => value * sceneUnitsPerMm);
  const geometry = new THREE.SphereGeometry(0.5, 32, 20);
  geometry.scale(width, height, depth);
  return geometry;
}
