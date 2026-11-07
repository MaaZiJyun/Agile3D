import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { readAxisColors, applyAxisColors } from '../src/editor/helpers/axisTheme';

function palette(values: Record<string, string>) {
  return readAxisColors({ getPropertyValue: name => values[name] ?? '' });
}

test('a shared palette updates world axes and every transform mode, including cached colors', () => {
  const axes = new THREE.AxesHelper(2);
  const camera = new THREE.PerspectiveCamera(46, 1, .01, 100);
  camera.position.set(4, 3, 5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const controls = new TransformControls(camera);
  const scene = new THREE.Scene();
  const object = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  scene.add(object, controls.getHelper());
  controls.attach(object);
  for (const values of [
    { '--axis-x': '#ff6b6b', '--axis-y': '#12e6c8', '--axis-z': '#7575ff', '--axis-active': '#4eeaf6' },
    { '--axis-x': '#fda312', '--axis-y': '#75ffa5', '--axis-z': '#a575ff', '--axis-active': '#ff75d1' },
  ]) {
    const colors = palette(values);
    applyAxisColors(axes, colors);
    applyAxisColors(controls, colors);
    const buffer = axes.geometry.getAttribute('color');
    for (const [index, key] of (['x', 'y', 'z'] as const).entries()) {
      const color = new THREE.Color().fromBufferAttribute(buffer, index * 2);
      assert.ok(Math.abs(color.r - colors[key].r) < 1e-6);
      assert.ok(Math.abs(color.g - colors[key].g) < 1e-6);
      assert.ok(Math.abs(color.b - colors[key].b) < 1e-6);
    }
    for (const mode of (['translate', 'rotate', 'scale'] as const)) {
      controls.setMode(mode);
      controls.axis = null;
      scene.updateMatrixWorld(true);
      const renderedColors = new Set();
      controls.getHelper().traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) renderedColors.add(child.material.color.getHexString());
      });
      for (const key of (['x', 'y', 'z'] as const)) assert.ok(renderedColors.has(colors[key].getHexString()), `${mode}: ${key} uses the shared color`);
      controls.axis = 'X';
      scene.updateMatrixWorld(true);
      const highlighted = [];
      controls.getHelper().traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial && child.name === 'X' && child.material.color.equals(colors.active)) highlighted.push(child);
      });
      assert.ok(highlighted.length, `${mode}: selection uses the shared active color`);
    }
  }
});

test('missing theme tokens fail explicitly instead of leaving a default RGB axis', () => {
  assert.throws(() => palette({}), /Missing axis theme token: --axis-x/);
});
