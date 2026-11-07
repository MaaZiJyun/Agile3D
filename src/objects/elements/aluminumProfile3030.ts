import * as THREE from 'three';

function roundedRectHole(centerX: number, centerY: number, width: number, height: number, radius: number) {
  const hole = new THREE.Path();
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const bottom = centerY - height / 2;
  const top = centerY + height / 2;
  hole.moveTo(left + radius, bottom);
  hole.lineTo(right - radius, bottom);
  hole.quadraticCurveTo(right, bottom, right, bottom + radius);
  hole.lineTo(right, top - radius);
  hole.quadraticCurveTo(right, top, right - radius, top);
  hole.lineTo(left + radius, top);
  hole.quadraticCurveTo(left, top, left, top - radius);
  hole.lineTo(left, bottom + radius);
  hole.quadraticCurveTo(left, bottom, left + radius, bottom);
  hole.closePath();
  return hole;
}

export function createAluminumProfile3030ElementGeometry(lengthMm: number, sceneUnitsPerMm: number) {
  const mm = sceneUnitsPerMm;
  const half = 15 * mm;
  const slotHalf = 4.25 * mm;
  const neck = 13.6 * mm;
  const undercutHalf = 5.75 * mm;
  const channelHalf = 4.925 * mm;
  const channelDepth = 10.15 * mm;
  const cornerStart = 12.5 * mm;
  const shape = new THREE.Shape();
  shape.moveTo(-cornerStart, half);
  shape.lineTo(-slotHalf, half);
  shape.lineTo(-slotHalf, neck);
  shape.lineTo(-undercutHalf, neck);
  shape.lineTo(-undercutHalf, 11.1 * mm);
  shape.lineTo(-channelHalf, channelDepth);
  shape.lineTo(channelHalf, channelDepth);
  shape.lineTo(undercutHalf, 11.1 * mm);
  shape.lineTo(undercutHalf, neck);
  shape.lineTo(slotHalf, neck);
  shape.lineTo(slotHalf, half);
  shape.lineTo(cornerStart, half);
  shape.quadraticCurveTo(half, half, half, cornerStart);
  shape.lineTo(half, slotHalf);
  shape.lineTo(neck, slotHalf);
  shape.lineTo(neck, undercutHalf);
  shape.lineTo(11.1 * mm, undercutHalf);
  shape.lineTo(channelDepth, channelHalf);
  shape.lineTo(channelDepth, -channelHalf);
  shape.lineTo(11.1 * mm, -undercutHalf);
  shape.lineTo(neck, -undercutHalf);
  shape.lineTo(neck, -slotHalf);
  shape.lineTo(half, -slotHalf);
  shape.lineTo(half, -cornerStart);
  shape.quadraticCurveTo(half, -half, cornerStart, -half);
  shape.lineTo(slotHalf, -half);
  shape.lineTo(slotHalf, -neck);
  shape.lineTo(undercutHalf, -neck);
  shape.lineTo(undercutHalf, -11.1 * mm);
  shape.lineTo(channelHalf, -channelDepth);
  shape.lineTo(-channelHalf, -channelDepth);
  shape.lineTo(-undercutHalf, -11.1 * mm);
  shape.lineTo(-undercutHalf, -neck);
  shape.lineTo(-slotHalf, -neck);
  shape.lineTo(-slotHalf, -half);
  shape.lineTo(-cornerStart, -half);
  shape.quadraticCurveTo(-half, -half, -half, -cornerStart);
  shape.lineTo(-half, -slotHalf);
  shape.lineTo(-neck, -slotHalf);
  shape.lineTo(-neck, -undercutHalf);
  shape.lineTo(-11.1 * mm, -undercutHalf);
  shape.lineTo(-channelDepth, -channelHalf);
  shape.lineTo(-channelDepth, channelHalf);
  shape.lineTo(-11.1 * mm, undercutHalf);
  shape.lineTo(-neck, undercutHalf);
  shape.lineTo(-neck, slotHalf);
  shape.lineTo(-half, slotHalf);
  shape.lineTo(-half, cornerStart);
  shape.quadraticCurveTo(-half, half, -cornerStart, half);
  shape.closePath();

  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, 3.4 * mm, 0, Math.PI * 2, false);
  shape.holes.push(centerHole);
  const cavityOffset = 10 * mm;
  for (const x of [-cavityOffset, cavityOffset]) {
    for (const y of [-cavityOffset, cavityOffset]) {
      shape.holes.push(roundedRectHole(x, y, 5.6 * mm, 5.6 * mm, 1.1 * mm));
    }
  }

  const length = Math.max(1, lengthMm) * mm;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 12 });
  geometry.translate(0, 0, -length / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export const ALUMINUM_PROFILE_3030_SIZE_MM = {
  width: 30,
  height: 30,
  defaultLength: 1000,
  slotOpening: 8.5,
  centerHoleDiameter: 6.8,
  cornerRadius: 2.5,
} as const;
