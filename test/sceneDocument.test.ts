import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { createNewNode, createObjectFromData, serializeObject, updatePipeSize, getPipeLengthMm, getPipeOuterDiameterMm } from '../src/editor/SceneDocument';
import { normalizeSceneDocument, validateSceneDocument } from '../src/editor/sceneValidation';
import type { SceneDocumentData } from '../src/editor/sceneTypes';

function emptyProject(): SceneDocumentData {
  return { version: 3, unit: 0.02, positionUnit: 0.02, updatedAt: null, modules: [], objects: [] };
}

test('bundled project and reusable library pass the migrated validator', async () => {
  const input: unknown = JSON.parse(await readFile('data/room.json', 'utf8'));
  assert.ok(validateSceneDocument(input));
  assert.ok(input.objects.length > 0);
  assert.ok(input.modules?.length);
});

test('duplicate IDs, fractional dimensions and invalid materials are rejected', () => {
  const project = emptyProject();
  const node = createNewNode('box', 1);
  project.objects = [node, structuredClone(node)];
  assert.equal(validateSceneDocument(project), false);
  project.objects = [node];
  node.dimensions = [1.5, 10, 10];
  assert.equal(validateSceneDocument(project), false);
  node.dimensions = [10, 10, 10];
  node.material!.opacity = 2;
  assert.equal(validateSceneDocument(project), false);
  assert.equal(normalizeSceneDocument({ version: 99 }), null);
});

test('legacy v2 conversion preserves input and converts positions and dimensions', () => {
  const project = { ...emptyProject(), version: 2, positionUnit: 0.01, objects: [createNewNode('box', 1)] };
  project.objects[0].transform.position = [1, 2, 3];
  const result = normalizeSceneDocument(project);
  assert.ok(result);
  assert.deepEqual(result.objects[0].transform.position, [10, 20, 30]);
  assert.deepEqual(result.objects[0].dimensions, [1000, 1000, 1000]);
  assert.equal(project.version, 2);
  assert.deepEqual(project.objects[0].transform.position, [1, 2, 3]);
});

test('all primitive types survive a scene serialization round trip', () => {
  const types = ['box', 'sphere', 'cylinder', 'irregular', 'tube', 'pipe', 'aluminumExtrusion', 'lBracket3030', 'aluminumProfile3030', 'lConnector3030', 'u8CombinationProfile'] as const;
  for (const [index, type] of types.entries()) {
    const node = createNewNode(type, index);
    const object = createObjectFromData(node);
    const restored = serializeObject(object);
    assert.equal(restored.type, type);
    assert.deepEqual(restored.dimensions, node.dimensions);
    assert.deepEqual(restored.transform, node.transform);
    assert.ok(validateSceneDocument({ ...emptyProject(), objects: [restored] }));
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      for (const material of [object.material].flat()) material.dispose();
    }
  }
});

test('pipe resizing retains a circular section and requested integer length', () => {
  const object = createObjectFromData(createNewNode('pipe', 1));
  updatePipeSize(object, 80, 400);
  assert.equal(getPipeOuterDiameterMm(object), 80);
  assert.equal(getPipeLengthMm(object), 400);
});
