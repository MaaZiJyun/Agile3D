import * as THREE from 'three';
import type { IntegerVec3, SceneTubeData } from '../../editor/sceneTypes';

export function createTubeElementGeometry(
  dimensionsMm: IntegerVec3,
  pathMm: IntegerVec3[] | undefined,
  tube: SceneTubeData | undefined,
  sceneUnitsPerMm: number,
) {
  const diameter = dimensionsMm[0] * sceneUnitsPerMm;
  const radiusScale = THREE.MathUtils.clamp(tube?.radiusScale ?? 1, 0.1, 2);
  const points = (pathMm?.length ? pathMm : [[0, -100, 0], [0, 100, 0]]).map(([x, y, z]) => (
    new THREE.Vector3(x * sceneUnitsPerMm, y * sceneUnitsPerMm, z * sceneUnitsPerMm)
  ));
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return new THREE.TubeGeometry(curve, Math.max(12, points.length * 8), diameter * radiusScale / 2, 7, false);
}
