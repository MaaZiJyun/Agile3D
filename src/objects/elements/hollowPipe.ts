import * as THREE from 'three';

// An indivisible hollow tube element used by pipe components.

export type PipePathPoint = [number, number, number];

export interface HollowPipeParameters {
  innerDiameterMm: number;
  wallThicknessMm: number;
}

export function createHollowPipeGeometry(
  path: PipePathPoint[],
  parameters: HollowPipeParameters,
  sceneUnitsPerMm: number,
) {
  const points = path.map(([x, y, z]) => new THREE.Vector3(
    x * sceneUnitsPerMm,
    y * sceneUnitsPerMm,
    z * sceneUnitsPerMm,
  ));
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const tubularSegments = Math.max(24, path.length * 12);
  const radialSegments = 24;
  const innerRadius = Math.max(sceneUnitsPerMm * 0.5, parameters.innerDiameterMm * sceneUnitsPerMm / 2);
  const outerRadius = innerRadius + Math.max(sceneUnitsPerMm, parameters.wallThicknessMm * sceneUnitsPerMm);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring <= tubularSegments; ring += 1) {
    const center = curve.getPointAt(ring / tubularSegments);
    for (const radius of [outerRadius, innerRadius]) {
      for (let side = 0; side < radialSegments; side += 1) {
        const angle = side / radialSegments * Math.PI * 2;
        const radial = frames.normals[ring].clone().multiplyScalar(Math.cos(angle))
          .add(frames.binormals[ring].clone().multiplyScalar(Math.sin(angle)));
        const point = center.clone().addScaledVector(radial, radius);
        positions.push(point.x, point.y, point.z);
        uvs.push(ring / tubularSegments, side / radialSegments);
      }
    }
  }

  const ringStride = radialSegments * 2;
  const outerIndex = (ring: number, side: number) => ring * ringStride + side;
  const innerIndex = (ring: number, side: number) => ring * ringStride + radialSegments + side;
  for (let ring = 0; ring < tubularSegments; ring += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const next = (side + 1) % radialSegments;
      const outerA = outerIndex(ring, side);
      const outerB = outerIndex(ring + 1, side);
      const outerC = outerIndex(ring + 1, next);
      const outerD = outerIndex(ring, next);
      indices.push(outerA, outerB, outerD, outerB, outerC, outerD);

      const innerA = innerIndex(ring, side);
      const innerB = innerIndex(ring, next);
      const innerC = innerIndex(ring + 1, next);
      const innerD = innerIndex(ring + 1, side);
      indices.push(innerA, innerB, innerD, innerB, innerC, innerD);
    }
  }

  for (let side = 0; side < radialSegments; side += 1) {
    const next = (side + 1) % radialSegments;
    const startOuter = outerIndex(0, side);
    const startOuterNext = outerIndex(0, next);
    const startInner = innerIndex(0, side);
    const startInnerNext = innerIndex(0, next);
    indices.push(startOuter, startOuterNext, startInner, startOuterNext, startInnerNext, startInner);

    const endOuter = outerIndex(tubularSegments, side);
    const endInner = innerIndex(tubularSegments, side);
    const endOuterNext = outerIndex(tubularSegments, next);
    const endInnerNext = innerIndex(tubularSegments, next);
    indices.push(endOuter, endInner, endOuterNext, endOuterNext, endInner, endInnerNext);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
