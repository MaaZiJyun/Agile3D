import * as THREE from 'three';
import type { IntegerVec3 } from '../../editor/sceneTypes';

export function createBoxElementGeometry(dimensionsMm: IntegerVec3, sceneUnitsPerMm: number) {
  const [width, height, depth] = dimensionsMm.map(value => value * sceneUnitsPerMm);
  return new THREE.BoxGeometry(width, height, depth);
}
