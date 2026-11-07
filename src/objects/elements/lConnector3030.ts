import * as THREE from 'three';

const SIZE_MM = 85;
const LEG_WIDTH_MM = 26;
const THICKNESS_MM = 2.5;
const HOLE_DIAMETER_MM = 7;

export function createLConnector3030ElementGeometry(sceneUnitsPerMm: number) {
  const mm = sceneUnitsPerMm;
  const size = SIZE_MM * mm;
  const leg = LEG_WIDTH_MM * mm;
  const half = size / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, half);
  shape.lineTo(-half + leg, half);
  shape.lineTo(-half + leg, -half + leg);
  shape.lineTo(half, -half + leg);
  shape.lineTo(half, -half);
  shape.lineTo(-half, -half);
  shape.closePath();

  const holesMm: Array<[number, number]> = [
    [11.5, 11.5], [11.5, 41.5], [34.5, 72], [72, 72],
  ];
  holesMm.forEach(([x, y]) => {
    const hole = new THREE.Path();
    hole.absarc((x - SIZE_MM / 2) * mm, (SIZE_MM / 2 - y) * mm, HOLE_DIAMETER_MM * mm / 2, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  });

  const thickness = THICKNESS_MM * mm;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 20 });
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export const L_CONNECTOR_3030_SIZE_MM = {
  width: SIZE_MM,
  height: SIZE_MM,
  legWidth: LEG_WIDTH_MM,
  thickness: THICKNESS_MM,
  holeDiameter: HOLE_DIAMETER_MM,
} as const;
