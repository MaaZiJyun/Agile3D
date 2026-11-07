import * as THREE from 'three';
import type { IntegerVec3 } from '../../editor/sceneTypes';

function createProfileShape(widthMm: number, heightMm: number, sceneUnitsPerMm: number) {
  const halfWidth = widthMm * sceneUnitsPerMm / 2;
  const halfHeight = heightMm * sceneUnitsPerMm / 2;
  const slotHalfWidth = Math.min(5 * sceneUnitsPerMm, halfWidth * 0.7);
  const slotHalfHeight = Math.min(5 * sceneUnitsPerMm, halfHeight * 0.7);
  const slotDepth = Math.min(6 * sceneUnitsPerMm, halfWidth * 0.8, halfHeight * 0.8);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, halfHeight);
  shape.lineTo(-slotHalfWidth, halfHeight);
  shape.lineTo(-slotHalfWidth, halfHeight - slotDepth);
  shape.lineTo(slotHalfWidth, halfHeight - slotDepth);
  shape.lineTo(slotHalfWidth, halfHeight);
  shape.lineTo(halfWidth, halfHeight);
  shape.lineTo(halfWidth, slotHalfHeight);
  shape.lineTo(halfWidth - slotDepth, slotHalfHeight);
  shape.lineTo(halfWidth - slotDepth, -slotHalfHeight);
  shape.lineTo(halfWidth, -slotHalfHeight);
  shape.lineTo(halfWidth, -halfHeight);
  shape.lineTo(slotHalfWidth, -halfHeight);
  shape.lineTo(slotHalfWidth, -halfHeight + slotDepth);
  shape.lineTo(-slotHalfWidth, -halfHeight + slotDepth);
  shape.lineTo(-slotHalfWidth, -halfHeight);
  shape.lineTo(-halfWidth, -halfHeight);
  shape.lineTo(-halfWidth, -slotHalfHeight);
  shape.lineTo(-halfWidth + slotDepth, -slotHalfHeight);
  shape.lineTo(-halfWidth + slotDepth, slotHalfHeight);
  shape.lineTo(-halfWidth, slotHalfHeight);
  shape.closePath();
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, Math.min(4 * sceneUnitsPerMm, halfWidth * 0.35, halfHeight * 0.35), 0, Math.PI * 2, false);
  shape.holes.push(centerHole);
  return shape;
}

export function createAluminumExtrusionElementGeometry(dimensionsMm: IntegerVec3, sceneUnitsPerMm: number) {
  const longestAxis = dimensionsMm.indexOf(Math.max(...dimensionsMm));
  const crossSection = longestAxis === 0
    ? [dimensionsMm[2], dimensionsMm[1]]
    : longestAxis === 1 ? [dimensionsMm[0], dimensionsMm[2]] : [dimensionsMm[0], dimensionsMm[1]];
  const length = dimensionsMm[longestAxis] * sceneUnitsPerMm;
  const geometry = new THREE.ExtrudeGeometry(createProfileShape(crossSection[0], crossSection[1], sceneUnitsPerMm), {
    depth: length,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -length / 2);
  if (longestAxis === 0) geometry.rotateY(Math.PI / 2);
  if (longestAxis === 1) geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}
