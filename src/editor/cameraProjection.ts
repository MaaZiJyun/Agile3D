import * as THREE from 'three';

export type ModelCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;
export type CameraPreset = 'front' | 'right' | 'top';
const DEFAULT_FOV = 46;
export const WORLD_UP: [number, number, number] = [0, 0, 1];
const VIEW_AXES = {
  front: { direction: [0, 1, 0], up: WORLD_UP },
  right: { direction: [1, 0, 0], up: WORLD_UP },
  top: { direction: [0, 0, 1], up: [0, 1, 0] },
};

export function resizeCamera(camera: ModelCamera, aspect: number) {
  if (camera instanceof THREE.PerspectiveCamera) camera.aspect = aspect;
  else {
    const halfHeight = (camera.top - camera.bottom) / 2;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
  }
  camera.updateProjectionMatrix();
}

// Match the visible scale at the orbit target when switching projection.
export function changeProjection(current: ModelCamera, target: THREE.Vector3, perspective: true, aspect: number): THREE.PerspectiveCamera;
export function changeProjection(current: ModelCamera, target: THREE.Vector3, perspective: false, aspect: number): THREE.OrthographicCamera;
export function changeProjection(current: ModelCamera, target: THREE.Vector3, perspective: boolean, aspect: number): ModelCamera;
export function changeProjection(current: ModelCamera, target: THREE.Vector3, perspective: boolean, aspect: number) {
  if (perspective === (current instanceof THREE.PerspectiveCamera)) return current;
  let next: ModelCamera;
  const distance = current.position.distanceTo(target);
  if (perspective && current instanceof THREE.OrthographicCamera) {
    next = new THREE.PerspectiveCamera(DEFAULT_FOV, aspect, current.near, current.far);
    const height = (current.top - current.bottom) / current.zoom;
    const nextDistance = height / (2 * Math.tan(THREE.MathUtils.degToRad(DEFAULT_FOV / 2)));
    next.position.copy(current.position).sub(target).setLength(nextDistance).add(target);
  } else if (current instanceof THREE.PerspectiveCamera) {
    const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(current.getEffectiveFOV() / 2));
    next = new THREE.OrthographicCamera(-halfHeight * aspect, halfHeight * aspect, halfHeight, -halfHeight, current.near, current.far);
    next.position.copy(current.position);
  }
  else return current;
  next.far = Math.max(current.far, next.position.distanceTo(target) * 5);
  next.updateProjectionMatrix();
  next.up.copy(current.up);
  next.quaternion.copy(current.quaternion);
  next.updateMatrixWorld();
  return next;
}

export function frameCamera(camera: ModelCamera, target: THREE.Vector3, bounds: THREE.Box3, aspect: number, preset?: CameraPreset) {
  const direction = camera.position.clone().sub(target).normalize();
  if (preset) {
    direction.fromArray(VIEW_AXES[preset].direction);
    camera.up.fromArray(VIEW_AXES[preset].up);
  }
  if (!direction.lengthSq()) direction.set(1, 1, 0.72).normalize();
  const sphere = bounds.isEmpty()
    ? new THREE.Sphere(new THREE.Vector3(), Math.sqrt(3) * 0.25)
    : bounds.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(0.2, sphere.radius);
  const verticalFov = THREE.MathUtils.degToRad(camera instanceof THREE.PerspectiveCamera ? camera.getEffectiveFOV() : DEFAULT_FOV);
  const limitingFov = Math.min(verticalFov, 2 * Math.atan(Math.tan(verticalFov / 2) * aspect));
  const distance = radius / Math.sin(limitingFov / 2) * 1.25;
  if (camera instanceof THREE.OrthographicCamera) {
    const halfHeight = radius * 1.25 / Math.min(1, aspect);
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.zoom = 1;
    resizeCamera(camera, aspect);
  }
  target.copy(sphere.center);
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.far = Math.max(20, distance * 5);
  camera.updateProjectionMatrix();
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return distance;
}
