import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { frameCamera, changeProjection } from '../src/editor/cameraProjection';
import { projectOrientationAxes } from '../src/editor/helpers/orientationWidget';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
for (const [preset, centered] of ([['front', 'y'], ['right', 'x'], ['top', 'z']] as const)) {
  test(`${preset}: widget matches projected world axes and centers the viewing axis`, () => {
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .01, 100);
    camera.position.set(2, 3, 4);
    frameCamera(camera, new THREE.Vector3(), new THREE.Box3(), 1, preset);
    const origin = new THREE.Vector3().project(camera);
    const scale = (camera.right - camera.left) / 2;
    for (const point of projectOrientationAxes(camera.quaternion)) {
      const direction = new THREE.Vector3(point.axis === 'x' ? 1 : 0, point.axis === 'y' ? 1 : 0, point.axis === 'z' ? 1 : 0);
      const projected = direction.project(camera);
      close(point.x, 56 + (projected.x - origin.x) * scale * 37);
      close(point.y, 56 - (projected.y - origin.y) * scale * 37);
      if (point.axis === centered) {
        close(point.x, 56);
        close(point.y, 56);
        close(point.depth, 1);
      }
    }
  });
}

test('widget follows rotation while remaining independent of pan, zoom, and projection', () => {
  const camera = new THREE.PerspectiveCamera(46, 1.5, .01, 100);
  camera.position.set(4, 3, 2);
  camera.lookAt(0, 0, 0);
  const before = projectOrientationAxes(camera.quaternion);
  const ortho = changeProjection(camera, new THREE.Vector3(), false, 1.5);
  ortho.zoom = 3;
  ortho.position.add(new THREE.Vector3(2, 1, 3));
  ortho.updateProjectionMatrix();
  assert.deepEqual(projectOrientationAxes(ortho.quaternion), before);
  camera.lookAt(2, 1, 0);
  assert.notDeepEqual(projectOrientationAxes(camera.quaternion), before);
  for (const point of projectOrientationAxes(camera.quaternion)) {
    assert.ok(point.x >= 19 && point.x <= 93);
    assert.ok(point.y >= 19 && point.y <= 93);
  }
});

