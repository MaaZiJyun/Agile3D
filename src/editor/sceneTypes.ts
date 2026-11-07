/** Three.js scene units used to render one real-world millimetre. */
export const SCENE_UNITS_PER_MM = 0.02;
export const SCENE_DOCUMENT_VERSION = 3;

export type SceneNodeType =
  | 'group'
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'irregular'
  | 'tube'
  | 'pipe'
  | 'aluminumExtrusion'
  | 'lBracket3030'
  | 'aluminumProfile3030'
  | 'lConnector3030'
  | 'u8CombinationProfile';
export type IntegerVec3 = [number, number, number];
export type SceneSurfaceType = 'plain' | 'concrete' | 'rust' | 'brick' | 'metal' | 'glass' | 'acrylic';

export interface SceneShapeData {
  seed: number;
  roughness: number;
  form?: 'chunk' | 'slab';
}

export interface SceneTubeData {
  radiusScale: number;
}

export interface ScenePipeData {
  innerDiameterMm: number;
  wallThicknessMm: number;
}

export interface SceneMaterialData {
  color: string;
  emissiveIntensity: number;
  opacity: number;
  surface?: SceneSurfaceType;
  textureSeed?: number;
}

export interface SceneTransformData {
  position: IntegerVec3;
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface SceneNodeData {
  id: string;
  name: string;
  type: SceneNodeType;
  visible: boolean;
  moduleId?: string;
  transform: SceneTransformData;
  dimensions?: IntegerVec3;
  material?: SceneMaterialData;
  shape?: SceneShapeData;
  tube?: SceneTubeData;
  pipe?: ScenePipeData;
  path?: IntegerVec3[];
  children?: SceneNodeData[];
}

export interface SceneModuleDefinition {
  id: string;
  category: string;
  name: string;
  recommendedSizeMm: Record<string, number | string>;
  recommendedQuantity: [number, number];
  layers: string[];
  purpose: string;
  template: SceneNodeData;
}

export interface SceneDocumentData {
  version: 3;
  unit: 0.02;
  positionUnit: 0.02;
  updatedAt: string | null;
  modules?: SceneModuleDefinition[];
  objects: SceneNodeData[];
}

