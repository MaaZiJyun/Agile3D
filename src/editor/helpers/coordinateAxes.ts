import * as THREE from 'three';

// Editor-only visualization; it is not a project object.

const AXIS_LENGTH = 2;
type CoordinatePosition = [number, number, number];

export function createCoordinateAxes(scene: THREE.Scene, position: CoordinatePosition) {
  const object = new THREE.AxesHelper(AXIS_LENGTH);
  (object.material as THREE.LineBasicMaterial).toneMapped = false;
  object.name = 'coordinate-axes';
  object.position.set(...position);
  scene.add(object);
  return object;
}
