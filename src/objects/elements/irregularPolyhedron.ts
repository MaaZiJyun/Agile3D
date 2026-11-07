import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import type { IntegerVec3, SceneShapeData } from '../../editor/sceneTypes';

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function createSlabGeometry(width: number, height: number, depth: number, shape?: SceneShapeData) {
  const random = seededRandom(shape?.seed ?? 1);
  const roughness = THREE.MathUtils.clamp(shape?.roughness ?? 0.18, 0, 0.45);
  const outline = [
    [-0.5, -0.28], [-0.34, -0.5], [0.05, -0.44], [0.22, -0.5],
    [0.48, -0.27], [0.44, 0.05], [0.5, 0.31], [0.18, 0.46],
    [-0.1, 0.42], [-0.36, 0.5], [-0.48, 0.22], [-0.42, -0.02],
  ].map(([x, z]) => {
    const erosion = 1 - roughness * (0.05 + random() * 0.22);
    return new THREE.Vector2(x * width * erosion, z * depth * erosion);
  });
  const polygon = new THREE.Shape();
  polygon.moveTo(outline[0].x, outline[0].y);
  outline.slice(1).forEach(point => polygon.lineTo(point.x, point.y));
  polygon.closePath();
  const geometry = new THREE.ExtrudeGeometry(polygon, { depth: height, steps: 1, bevelEnabled: false, curveSegments: 1 });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

export function createIrregularPolyhedronElementGeometry(
  dimensionsMm: IntegerVec3,
  sceneUnitsPerMm: number,
  shape?: SceneShapeData,
) {
  const [width, height, depth] = dimensionsMm.map(value => value * sceneUnitsPerMm);
  if (shape?.form === 'slab') return createSlabGeometry(width, height, depth, shape);
  const random = seededRandom(shape?.seed ?? 1);
  const roughness = THREE.MathUtils.clamp(shape?.roughness ?? 0.18, 0, 0.45);
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < 30; index += 1) {
    const direction = new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1);
    const maximum = Math.max(Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z));
    direction.multiplyScalar(0.5 / Math.max(maximum, 0.001));
    points.push(direction.multiplyScalar(1 - roughness * random()));
  }
  const geometry = new ConvexGeometry(points);
  geometry.scale(width, height, depth);
  const positions = geometry.getAttribute('position');
  const uvs: number[] = [];
  for (let index = 0; index < positions.count; index += 1) {
    uvs.push(positions.getX(index) / width + 0.5, positions.getY(index) / height + 0.5);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
