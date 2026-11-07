import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { changeProjection, frameCamera, resizeCamera, WORLD_UP } from '../src/editor/cameraProjection';

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const target = new THREE.Vector3();
function perspective() {
  const camera = new THREE.PerspectiveCamera(46, 1.5, .005, 2000);
  camera.position.set(0, 0, 5);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return camera;
}
const projectX = (camera: THREE.Camera, z: number) => new THREE.Vector3(1, 0, z).project(camera).x;

test('perspective has depth-dependent size; orthographic projection does not', () => {
  const camera = perspective();
  assert.ok(projectX(camera, 1) > projectX(camera, -1));
  const ortho = changeProjection(camera, target, false, 1.5);
  close(projectX(ortho, 1), projectX(ortho, -1));
});

test('projection switching preserves target-plane scale, pose and orthographic zoom', () => {
  const camera = perspective();
  const ortho = changeProjection(camera, target, false, 1.5);
  close(projectX(camera, 0), projectX(ortho, 0));
  assert.ok(ortho.position.equals(camera.position));
  ortho.zoom = 4;
  ortho.updateProjectionMatrix();
  const restored = changeProjection(ortho, target, true, 1.5);
  close(projectX(restored, 0), projectX(ortho, 0));
  assert.ok(restored.quaternion.equals(camera.quaternion));
});

const bounds = new THREE.Box3(new THREE.Vector3(-2, -3, -4), new THREE.Vector3(2, 3, 4));
for (const [preset, expected] of ([['front', [0, -1, 0]], ['right', [-1, 0, 0]], ['top', [0, 0, -1]]] as const)) {
  for (const isPerspective of [true, false]) {
    test(`${preset} aligns to its axis in ${isPerspective ? 'perspective' : 'orthographic'} mode, including OrbitControls`, () => {
      const camera = isPerspective ? perspective() : changeProjection(perspective(), target, false, 1.5);
      const orbitTarget = new THREE.Vector3();
      frameCamera(camera, orbitTarget, bounds, 1.5, preset);
      const controls = new OrbitControls(camera, null);
      controls.target.copy(orbitTarget);
      controls.update();
      const direction = camera.getWorldDirection(new THREE.Vector3());
      assert.ok(direction.distanceTo(new THREE.Vector3(...expected)) < 1e-8);
      for (const x of [-2, 2]) for (const y of [-3, 3]) for (const z of [-4, 4]) {
        const point = new THREE.Vector3(x, y, z).project(camera);
        assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1 && Math.abs(point.z) < 1);
      }
      // No DOM listeners are attached when controls are constructed with null.
    });
  }
}

test('orthographic resize preserves vertical scale and correct aspect', () => {
  const camera = changeProjection(perspective(), target, false, 1.5);
  const height = camera.top - camera.bottom;
  resizeCamera(camera, .6);
  close(camera.top - camera.bottom, height);
  close((camera.right - camera.left) / height, .6);
  const persp = perspective();
  resizeCamera(persp, .6);
  close(persp.aspect, .6);
});

test('auto framing keeps the projection and current view orientation', () => {
  const camera = changeProjection(perspective(), target, false, .6);
  const orbitTarget = new THREE.Vector3();
  frameCamera(camera, orbitTarget, bounds, .6, 'top');
  const direction = camera.getWorldDirection(new THREE.Vector3());
  frameCamera(camera, orbitTarget, bounds.clone().translate(new THREE.Vector3(8, 4, 2)), .6);
  assert.ok(camera instanceof THREE.OrthographicCamera);
  assert.ok(direction.distanceTo(camera.getWorldDirection(new THREE.Vector3())) < 1e-8);
  assert.ok(orbitTarget.equals(new THREE.Vector3(8, 4, 2)));
});

test('Z is the default vertical axis through orbiting and projection switches', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.5, .005, 2000);
  camera.up.fromArray(WORLD_UP);
  camera.position.set(1.25, 1.15, .78);
  const orbitTarget = new THREE.Vector3(0, 0, .29);
  const controls = new OrbitControls(camera, null);
  controls.target.copy(orbitTarget);
  controls.update();
  assert.deepEqual(camera.up.toArray(), [0, 0, 1]);
  controls.autoRotate = true;
  controls.update(0.1);
  const ortho = changeProjection(camera, orbitTarget, false, 1.5);
  const restored = changeProjection(ortho, orbitTarget, true, 1.5);
  assert.deepEqual(restored.up.toArray(), [0, 0, 1]);
  assert.ok(restored.quaternion.angleTo(camera.quaternion) < 1e-7);
});

test('requesting the active projection keeps the current camera', () => {
  const camera = perspective();
  assert.equal(changeProjection(camera, target, true, 1.5), camera);
  const ortho = changeProjection(camera, target, false, 1.5);
  assert.equal(changeProjection(ortho, target, false, 1.5), ortho);
});
