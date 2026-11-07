import { createMaterial } from './sceneMaterials';
import * as THREE from 'three';
import { createAluminumExtrusionElementGeometry } from '../objects/elements/aluminumExtrusion';
import { createAluminumProfile3030ElementGeometry } from '../objects/elements/aluminumProfile3030';
import { createBoxElementGeometry } from '../objects/elements/box';
import { createCylinderElementGeometry } from '../objects/elements/cylinder';
import { createHollowPipeGeometry } from '../objects/elements/hollowPipe';
import { createIrregularPolyhedronElementGeometry } from '../objects/elements/irregularPolyhedron';
import { createLBracket3030ElementGeometry } from '../objects/elements/lBracket3030';
import { createLConnector3030ElementGeometry } from '../objects/elements/lConnector3030';
import { createSphereElementGeometry } from '../objects/elements/sphere';
import { createTubeElementGeometry } from '../objects/elements/tube';
import { createU8CombinationProfileElementGeometry } from '../objects/elements/u8CombinationProfile';
import { createRegisteredSceneComponent } from '../objects/registry';

import { SCENE_UNITS_PER_MM, SCENE_DOCUMENT_VERSION, type IntegerVec3, type SceneNodeType, type SceneNodeData, type SceneDocumentData, type SceneModuleDefinition, type SceneMaterialData, type SceneTransformData, type SceneShapeData, type SceneTubeData, type ScenePipeData } from './sceneTypes';
export * from './sceneTypes';
export { normalizeSceneDocument, validateSceneDocument } from './sceneValidation';
type EditableMaterial = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
};

function integer(value: number) {
  return Math.max(1, Math.round(value));
}

function createGeometry(
  type: Exclude<SceneNodeType, 'group'>,
  dimensions: IntegerVec3,
  shape?: SceneShapeData,
  path?: IntegerVec3[],
  tube?: SceneTubeData,
  pipe?: ScenePipeData,
) {
  if (type === 'box') return createBoxElementGeometry(dimensions, SCENE_UNITS_PER_MM);
  if (type === 'sphere') return createSphereElementGeometry(dimensions, SCENE_UNITS_PER_MM);
  if (type === 'cylinder') return createCylinderElementGeometry(dimensions, SCENE_UNITS_PER_MM);
  if (type === 'irregular') return createIrregularPolyhedronElementGeometry(dimensions, SCENE_UNITS_PER_MM, shape);
  if (type === 'tube') return createTubeElementGeometry(dimensions, path, tube, SCENE_UNITS_PER_MM);
  if (type === 'aluminumExtrusion') return createAluminumExtrusionElementGeometry(dimensions, SCENE_UNITS_PER_MM);
  if (type === 'lBracket3030') return createLBracket3030ElementGeometry(SCENE_UNITS_PER_MM);
  if (type === 'aluminumProfile3030') return createAluminumProfile3030ElementGeometry(dimensions[2], SCENE_UNITS_PER_MM);
  if (type === 'lConnector3030') return createLConnector3030ElementGeometry(SCENE_UNITS_PER_MM);
  if (type === 'u8CombinationProfile') return createU8CombinationProfileElementGeometry(dimensions[2], SCENE_UNITS_PER_MM);
  if (type === 'pipe') return createHollowPipeGeometry(
    path?.length ? path : [[-80, 0, 0], [70, 0, 0]],
    pipe ?? { innerDiameterMm: 80, wallThicknessMm: 6 },
    SCENE_UNITS_PER_MM,
  );
  return createBoxElementGeometry(dimensions, SCENE_UNITS_PER_MM);
}

function applyTransform(object: THREE.Object3D, transform: SceneTransformData) {
  const [positionX, positionY, positionZ] = transform.position;
  const [rotationX, rotationY, rotationZ] = transform.rotation;
  object.position.set(
    Math.round(positionX) * SCENE_UNITS_PER_MM,
    Math.round(positionY) * SCENE_UNITS_PER_MM,
    Math.round(positionZ) * SCENE_UNITS_PER_MM,
  );
  object.rotation.set(
    THREE.MathUtils.degToRad(rotationX),
    THREE.MathUtils.degToRad(rotationY),
    THREE.MathUtils.degToRad(rotationZ),
  );
  object.scale.fromArray(transform.scale);
}

function createGenericObjectFromData(data: SceneNodeData): THREE.Object3D {
  let object: THREE.Object3D;
  if (data.type === 'group') {
    object = new THREE.Group();
    data.children?.forEach(child => object.add(createObjectFromData(child)));
  } else {
    const dimensions = (data.dimensions ?? [10, 10, 10]).map(integer) as IntegerVec3;
    const material = createMaterial(data.material ?? { color: '#d6ac7c', emissiveIntensity: 0, opacity: 1 }, data.type);
    const mesh = new THREE.Mesh(createGeometry(data.type, dimensions, data.shape, data.path, data.tube, data.pipe), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.dimensions = dimensions;
    mesh.userData.shape = data.shape;
    mesh.userData.tube = data.tube;
    mesh.userData.pipe = data.pipe;
    mesh.userData.path = data.path;
    mesh.userData.surface = data.material?.surface;
    mesh.userData.textureSeed = data.material?.textureSeed;
    object = mesh;
  }
  object.name = data.name;
  object.visible = data.visible;
  object.userData.sceneNodeId = data.id;
  object.userData.sceneNodeType = data.type;
  object.userData.moduleId = data.moduleId;
  object.userData.editorEmissiveIntensity = data.material?.emissiveIntensity ?? 0;
  applyTransform(object, data.transform);
  return object;
}

const sceneComponentBuildContext = { createGeneric: createGenericObjectFromData };

export function createObjectFromData(data: SceneNodeData): THREE.Object3D {
  return createRegisteredSceneComponent(data, sceneComponentBuildContext) ?? createGenericObjectFromData(data);
}

export function rebuildScene(root: THREE.Group, document: SceneDocumentData) {
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => material.dispose());
  });
  root.clear();
  document.objects.forEach(node => root.add(createObjectFromData(node)));
  root.updateMatrixWorld(true);
}

function materialData(object: THREE.Mesh): SceneMaterialData {
  const material = (Array.isArray(object.material) ? object.material[0] : object.material) as EditableMaterial;
  return {
    color: material.color ? `#${material.color.getHexString()}` : '#ffffff',
    emissiveIntensity: object.userData.editorEmissiveIntensity ?? material.emissiveIntensity ?? 0,
    opacity: material.opacity,
    surface: object.userData.surface,
    textureSeed: object.userData.textureSeed,
  };
}

export function serializeObject(object: THREE.Object3D): SceneNodeData {
  const type = object.userData.sceneNodeType as SceneNodeType;
  const data: SceneNodeData = {
    id: object.userData.sceneNodeId,
    name: object.name,
    type,
    visible: object.visible,
    moduleId: object.userData.moduleId,
    transform: {
      position: object.position.toArray().map(value => Math.round(value / SCENE_UNITS_PER_MM)) as IntegerVec3,
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z].map(THREE.MathUtils.radToDeg) as [number, number, number],
      scale: object.scale.toArray() as [number, number, number],
    },
  };
  if (object instanceof THREE.Mesh) {
    data.dimensions = object.userData.dimensions;
    data.material = materialData(object);
    if (type === 'irregular') data.shape = object.userData.shape;
    if (type === 'tube') {
      data.tube = object.userData.tube;
      data.path = object.userData.path;
    }
    if (type === 'pipe') {
      data.pipe = object.userData.pipe;
      data.path = object.userData.path;
    }
  }
  if (object instanceof THREE.Group) data.children = object.children.filter(child => child.userData.sceneNodeId).map(serializeObject);
  return data;
}

export function serializeScene(root: THREE.Group, modules: SceneModuleDefinition[] = []): SceneDocumentData {
  return {
    version: SCENE_DOCUMENT_VERSION,
    unit: SCENE_UNITS_PER_MM,
    positionUnit: SCENE_UNITS_PER_MM,
    updatedAt: null,
    modules,
    objects: root.children.filter(child => child.userData.sceneNodeId).map(serializeObject),
  };
}

export function updateEntityDimensions(object: THREE.Object3D, dimensions: IntegerVec3) {
  if (!(object instanceof THREE.Mesh)) return;
  const type = object.userData.sceneNodeType as Exclude<SceneNodeType, 'group'>;
  const nextDimensions = dimensions.map(integer) as IntegerVec3;
  object.geometry.dispose();
  object.geometry = createGeometry(type, nextDimensions, object.userData.shape, object.userData.path, object.userData.tube, object.userData.pipe);
  object.userData.dimensions = nextDimensions;
  object.updateMatrixWorld(true);
}

function pipePathFromObject(object: THREE.Object3D) {
  const path = object.userData.path as IntegerVec3[] | undefined;
  return path?.length && path.length >= 2 ? path : [[-80, 0, 0], [80, 0, 0]] as IntegerVec3[];
}

function pipeCurveLengthMm(path: IntegerVec3[]) {
  const points = path.map(point => new THREE.Vector3(...point));
  return new THREE.CatmullRomCurve3(points, false, 'centripetal').getLength();
}

export function getPipeLengthMm(object: THREE.Object3D) {
  return Math.max(1, Math.round(pipeCurveLengthMm(pipePathFromObject(object))));
}

export function getPipeOuterDiameterMm(object: THREE.Object3D) {
  const pipe = object.userData.pipe as ScenePipeData | undefined;
  return Math.max(1, Math.round((pipe?.innerDiameterMm ?? 48) + 2 * (pipe?.wallThicknessMm ?? 6)));
}

export function getPipePrimaryAxis(object: THREE.Object3D): 0 | 1 | 2 {
  const path = pipePathFromObject(object);
  const ranges = ([0, 1, 2] as const).map(axis => {
    const values = path.map(point => point[axis]);
    return Math.max(...values) - Math.min(...values);
  });
  return ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2;
}

/** Resize a hollow pipe without turning its circular section into an ellipse. */
export function updatePipeSize(object: THREE.Object3D, outerDiameterMm: number, lengthMm: number) {
  if (!(object instanceof THREE.Mesh) || object.userData.sceneNodeType !== 'pipe') return;
  // One millimetre for the opening and one millimetre for each wall.
  const diameter = Math.max(3, integer(outerDiameterMm));
  const targetLength = integer(lengthMm);
  const currentPath = pipePathFromObject(object);
  const currentLength = Math.max(0.001, pipeCurveLengthMm(currentPath));
  const pathCenter = new THREE.Vector3(...currentPath[0]).add(new THREE.Vector3(...currentPath.at(-1)!)).multiplyScalar(0.5);
  // Editing only the diameter feeds the rounded displayed length back here;
  // avoid repeatedly nudging a curved path because of that display rounding.
  const lengthScale = Math.abs(targetLength - currentLength) < 0.5 ? 1 : targetLength / currentLength;
  const resizedPath = currentPath.map(point => {
    const resized = new THREE.Vector3(...point).sub(pathCenter).multiplyScalar(lengthScale).add(pathCenter);
    return resized.toArray().map(Math.round) as IntegerVec3;
  }).filter((point, index, points) => index === 0 || point.some((value, axis) => value !== points[index - 1][axis]));
  if (resizedPath.length < 2) {
    const axis = getPipePrimaryAxis(object);
    const start = pathCenter.toArray().map(Math.round) as IntegerVec3;
    const end = [...start] as IntegerVec3;
    end[axis] += targetLength;
    resizedPath.splice(0, resizedPath.length, start, end);
  }

  const currentPipe = object.userData.pipe as ScenePipeData | undefined;
  const wallThicknessMm = Math.max(1, Math.min(
    Math.round(currentPipe?.wallThicknessMm ?? 6),
    Math.floor((diameter - 1) / 2),
  ));
  const pipe: ScenePipeData = {
    innerDiameterMm: Math.max(1, diameter - wallThicknessMm * 2),
    wallThicknessMm,
  };
  object.geometry.dispose();
  object.geometry = createHollowPipeGeometry(resizedPath, pipe, SCENE_UNITS_PER_MM);
  object.geometry.computeBoundingBox();
  const bounds = object.geometry.boundingBox as THREE.Box3 | null;
  const renderedSize = bounds
    ? bounds.getSize(new THREE.Vector3()).toArray().map(value => integer(value / SCENE_UNITS_PER_MM)) as IntegerVec3
    : [diameter, diameter, targetLength] as IntegerVec3;
  object.userData.path = resizedPath;
  object.userData.pipe = pipe;
  object.userData.dimensions = renderedSize;
  object.updateMatrixWorld(true);
}

export function bakeEntityScale(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh)) return;
  const type = object.userData.sceneNodeType as SceneNodeType;
  // These manufactured parts keep their drawing dimensions internally. Their
  // non-uniform editor scale remains in the transform instead of rebuilding a
  // simplified bounding box and losing sub-millimetre details.
  if (type === 'pipe' || type === 'lBracket3030' || type === 'lConnector3030') return;
  const dimensions = object.userData.dimensions as IntegerVec3;
  updateEntityDimensions(object, dimensions.map((value: number, index: number) => integer(value * object.scale.getComponent(index))) as IntegerVec3);
  object.scale.set(1, 1, 1);
}

export function createNewNode(type: SceneNodeType, sequence: number): SceneNodeData {
  const id = `${type}-${Date.now()}-${sequence}`;
  const node: SceneNodeData = {
    id,
    name: `${type}-${sequence}`,
    type,
    visible: true,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
  if (type === 'group') node.children = [];
  else {
    node.dimensions = [50, 50, 50];
    node.material = { color: '#d6ac7c', emissiveIntensity: 0, opacity: 1 };
    if (type === 'irregular') node.shape = { seed: Date.now() + sequence, roughness: 0.2 };
    if (type === 'tube') {
      node.dimensions = [20, 20, 20];
      node.tube = { radiusScale: 0.45 };
      node.path = [[0, -250, 0], [40, -100, 10], [-30, 80, -20], [0, 250, 0]];
    }
    if (type === 'pipe') {
      node.dimensions = [60, 60, 160];
      node.pipe = { innerDiameterMm: 48, wallThicknessMm: 6 };
      node.path = [[-80, 0, 0], [80, 0, 0]];
      node.material = { color: '#b9c1c5', emissiveIntensity: 0, opacity: 1, surface: 'metal' };
    }
    if (type === 'aluminumExtrusion') {
      node.dimensions = [500, 30, 30];
      node.material = { color: '#c7cdd0', emissiveIntensity: 0, opacity: 1, surface: 'metal' };
    }
    if (type === 'lBracket3030') {
      node.dimensions = [28, 35, 35];
      node.material = { color: '#bfc5c8', emissiveIntensity: 0, opacity: 1, surface: 'metal' };
    }
    if (type === 'aluminumProfile3030') {
      node.dimensions = [30, 30, 1000];
      node.material = { color: '#c7cdd0', emissiveIntensity: 0, opacity: 1, surface: 'metal' };
    }
    if (type === 'lConnector3030') {
      // The exact plate thickness is 2.5 mm inside its geometry. Dimensions
      // stay integer millimetres because this is the JSON editing grid.
      node.dimensions = [85, 85, 3];
      node.material = { color: '#bfc5c8', emissiveIntensity: 0, opacity: 1, surface: 'metal' };
    }
    if (type === 'u8CombinationProfile') {
      // The exact cross-section width is 11.5 mm inside its geometry.
      node.dimensions = [12, 10, 1000];
      node.material = { color: '#c7cdd0', emissiveIntensity: 0, opacity: 1, surface: 'metal' };
    }
  }
  return node;
}

