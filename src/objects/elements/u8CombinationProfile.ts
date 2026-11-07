import * as THREE from 'three';

export function createU8CombinationProfileElementGeometry(lengthMm: number, sceneUnitsPerMm: number) {
  const mm = sceneUnitsPerMm;
  const halfOuterWidth = 11.5 * mm / 2;
  const halfOpening = 6 * mm / 2;
  const innerWall = halfOuterWidth - 1.8 * mm;
  const outerHeight = 10 * mm;
  const bottomThickness = 1 * mm;
  const shape = new THREE.Shape();
  shape.moveTo(-halfOuterWidth, outerHeight);
  shape.lineTo(-halfOpening, outerHeight);
  shape.lineTo(-halfOpening, outerHeight - 1.2 * mm);
  shape.lineTo(-innerWall, outerHeight - 1.2 * mm);
  shape.lineTo(-innerWall, 2.2 * mm);
  shape.quadraticCurveTo(-innerWall, bottomThickness, -2.7 * mm, bottomThickness);
  shape.lineTo(2.7 * mm, bottomThickness);
  shape.quadraticCurveTo(innerWall, bottomThickness, innerWall, 2.2 * mm);
  shape.lineTo(innerWall, outerHeight - 1.2 * mm);
  shape.lineTo(halfOpening, outerHeight - 1.2 * mm);
  shape.lineTo(halfOpening, outerHeight);
  shape.lineTo(halfOuterWidth, outerHeight);
  shape.lineTo(halfOuterWidth, 2 * mm);
  shape.quadraticCurveTo(halfOuterWidth, 0, 3.25 * mm, 0);
  shape.lineTo(-3.25 * mm, 0);
  shape.quadraticCurveTo(-halfOuterWidth, 0, -halfOuterWidth, 2 * mm);
  shape.closePath();

  const length = Math.max(1, lengthMm) * mm;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 16 });
  geometry.translate(0, -outerHeight / 2, -length / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export const U8_COMBINATION_PROFILE_SIZE_MM = {
  outerWidth: 11.5,
  height: 10,
  defaultLength: 1000,
  opening: 6,
  sideThickness: 1.8,
  bottomThickness: 1,
} as const;
