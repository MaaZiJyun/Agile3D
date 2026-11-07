import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const WIDTH_MM = 28;
const HEIGHT_MM = 35;
const DEPTH_MM = 35;
const VERTICAL_THICKNESS_MM = 2.5;
const BASE_THICKNESS_MM = 4.5;
const SLOT_WIDTH_MM = 7;
const SLOT_LENGTH_MM = 18;

/** Adds a true obround slot: two straight sides joined by semicircular ends. */
function addRoundedSlot(shape: THREE.Shape, centerX: number, centerY: number, width: number, length: number) {
  const radius = width / 2;
  const straightHalf = (length - width) / 2;
  const lowerArcCenter = centerY - straightHalf;
  const upperArcCenter = centerY + straightHalf;
  const hole = new THREE.Path();
  hole.moveTo(centerX - radius, lowerArcCenter);
  hole.lineTo(centerX - radius, upperArcCenter);
  hole.absarc(centerX, upperArcCenter, radius, Math.PI, 0, true);
  hole.lineTo(centerX + radius, lowerArcCenter);
  hole.absarc(centerX, lowerArcCenter, radius, 0, -Math.PI, true);
  hole.closePath();
  shape.holes.push(hole);
}

function nonIndexed(geometry: THREE.BufferGeometry) {
  return geometry.index ? geometry.toNonIndexed() : geometry;
}

export function createLBracket3030ElementGeometry(sceneUnitsPerMm: number) {
  const width = WIDTH_MM * sceneUnitsPerMm;
  const height = HEIGHT_MM * sceneUnitsPerMm;
  const depth = DEPTH_MM * sceneUnitsPerMm;
  const verticalThickness = VERTICAL_THICKNESS_MM * sceneUnitsPerMm;
  const baseThickness = BASE_THICKNESS_MM * sceneUnitsPerMm;

  const verticalShape = new THREE.Shape();
  verticalShape.moveTo(-width / 2, 0);
  verticalShape.lineTo(width / 2, 0);
  verticalShape.lineTo(width / 2, height);
  verticalShape.lineTo(-width / 2, height);
  verticalShape.closePath();
  addRoundedSlot(verticalShape, 0, height * 0.52, SLOT_WIDTH_MM * sceneUnitsPerMm, SLOT_LENGTH_MM * sceneUnitsPerMm);
  const vertical = new THREE.ExtrudeGeometry(verticalShape, { depth: verticalThickness, bevelEnabled: false, curveSegments: 16 });
  vertical.translate(0, -height / 2, depth / 2 - verticalThickness);

  const baseShape = new THREE.Shape();
  baseShape.moveTo(-width / 2, -depth / 2);
  baseShape.lineTo(width / 2, -depth / 2);
  baseShape.lineTo(width / 2, depth / 2);
  baseShape.lineTo(-width / 2, depth / 2);
  baseShape.closePath();
  addRoundedSlot(baseShape, 0, 0, SLOT_WIDTH_MM * sceneUnitsPerMm, SLOT_LENGTH_MM * sceneUnitsPerMm);
  const base = new THREE.ExtrudeGeometry(baseShape, { depth: baseThickness, bevelEnabled: false, curveSegments: 16 });
  base.rotateX(Math.PI / 2);
  base.translate(0, -height / 2 + baseThickness, 0);

  const baseTop = -height / 2 + baseThickness;
  const verticalInnerFace = depth / 2 - verticalThickness;
  const braceTop = height * 0.22;
  const braceFront = -depth * 0.28;
  const braceShape = new THREE.Shape();
  // The shape's horizontal axis becomes -Z after rotateY(). Negating the Z
  // coordinates here keeps both perpendicular legs directly on the L faces.
  braceShape.moveTo(-braceFront, baseTop);
  braceShape.lineTo(-verticalInnerFace, baseTop);
  braceShape.lineTo(-verticalInnerFace, braceTop);
  braceShape.closePath();
  const braces = [-1, 1].map(side => {
    const brace = new THREE.ExtrudeGeometry(braceShape, { depth: verticalThickness, bevelEnabled: false });
    brace.translate(0, 0, -verticalThickness / 2);
    brace.rotateY(Math.PI / 2);
    brace.translate(side * (width / 2 - verticalThickness / 2), 0, 0);
    return nonIndexed(brace);
  });

  const merged = mergeGeometries([nonIndexed(vertical), nonIndexed(base), ...braces], false);
  if (!merged) throw new Error('Unable to build 3030 corner bracket geometry.');
  merged.computeVertexNormals();
  return merged;
}

export const L_BRACKET_3030_SIZE_MM = {
  width: WIDTH_MM,
  height: HEIGHT_MM,
  depth: DEPTH_MM,
  verticalThickness: VERTICAL_THICKNESS_MM,
  baseThickness: BASE_THICKNESS_MM,
  slot: [SLOT_WIDTH_MM, SLOT_LENGTH_MM],
} as const;
