import { SCENE_UNITS_PER_MM, SCENE_DOCUMENT_VERSION, type IntegerVec3, type SceneNodeType, type SceneNodeData, type SceneDocumentData, type SceneModuleDefinition, type SceneSurfaceType } from './sceneTypes';
function migrateVersion2Node(node: SceneNodeData) {
  node.transform.position = node.transform.position.map(value => Math.round(value * 10)) as IntegerVec3;
  if (node.path) node.path = node.path.map(point => point.map(value => Math.round(value * 10)) as IntegerVec3);
  if (node.type === 'group') {
    node.children?.forEach(migrateVersion2Node);
    return;
  }
  const legacyDimensions = node.dimensions ?? [1, 1, 1];
  const legacyScale = node.transform.scale;
  if (node.type === 'aluminumExtrusion') {
    const longestAxis = legacyDimensions.indexOf(Math.max(...legacyDimensions));
    node.dimensions = legacyDimensions.map((value, axis) => Math.max(1, Math.round(
      (axis === longestAxis ? value * 20 : 30) * legacyScale[axis],
    ))) as IntegerVec3;
    node.transform.scale = [1, 1, 1];
    return;
  }
  if (node.type === 'pipe' || node.type === 'tube') {
    node.dimensions = legacyDimensions.map(value => Math.max(1, Math.round(value * 20))) as IntegerVec3;
    return;
  }
  node.dimensions = legacyDimensions.map((value, axis) => Math.max(1, Math.round(value * 20 * legacyScale[axis]))) as IntegerVec3;
  node.transform.scale = [1, 1, 1];
}

/** Accepts the former centimetre-based v2 format and returns the millimetre-based v3 format. */
export function normalizeSceneDocument(value: unknown): SceneDocumentData | null {
  if (validateSceneDocument(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const legacy = value as { version?: unknown; unit?: unknown; positionUnit?: unknown; objects?: unknown; modules?: unknown };
  if (legacy.version !== 2 || legacy.unit !== 0.02 || legacy.positionUnit !== 0.01 || !Array.isArray(legacy.objects)) return null;
  const migrated = structuredClone(value) as SceneDocumentData & { version: number; positionUnit: number };
  migrated.version = 3;
  migrated.positionUnit = SCENE_UNITS_PER_MM;
  migrated.objects.forEach(migrateVersion2Node);
  migrated.modules?.forEach(module => migrateVersion2Node(module.template));
  return validateSceneDocument(migrated) ? migrated : null;
}

export function validateSceneDocument(value: unknown): value is SceneDocumentData {
  if (!value || typeof value !== 'object') return false;
  const document = value as Partial<SceneDocumentData>;
  if (document.version !== SCENE_DOCUMENT_VERSION || document.unit !== SCENE_UNITS_PER_MM || document.positionUnit !== SCENE_UNITS_PER_MM || !Array.isArray(document.objects)) return false;
  if (document.modules !== undefined && !validateModuleDefinitions(document.modules)) return false;
  const ids = new Set<string>();
  return document.objects.every(node => validateSceneNode(node, ids, 0));
}

function isNumberTuple(value: unknown, integerOnly = false): value is [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every(item => typeof item === 'number' && Number.isFinite(item) && (!integerOnly || Number.isInteger(item)));
}

function validateSceneNode(value: unknown, ids: Set<string>, depth: number): value is SceneNodeData {
  if (!value || typeof value !== 'object' || depth > 100) return false;
  const node = value as Partial<SceneNodeData>;
  if (typeof node.id !== 'string' || !node.id || ids.has(node.id) || typeof node.name !== 'string' || typeof node.visible !== 'boolean') return false;
  if (!node.type || !([
    'group',
    'box',
    'sphere',
    'cylinder',
    'irregular',
    'tube',
    'pipe',
    'aluminumExtrusion',
    'lBracket3030',
    'aluminumProfile3030',
    'lConnector3030',
    'u8CombinationProfile',
  ] as SceneNodeType[]).includes(node.type)) return false;
  if (node.moduleId !== undefined && (typeof node.moduleId !== 'string' || !node.moduleId)) return false;
  if (!node.transform || !isNumberTuple(node.transform.position, true) || !isNumberTuple(node.transform.rotation) || !isNumberTuple(node.transform.scale)) return false;
  if (node.transform.scale.some(value => value <= 0)) return false;
  ids.add(node.id);
  if (node.type === 'group') return Array.isArray(node.children) && node.children.every(child => validateSceneNode(child, ids, depth + 1));
  if (!isNumberTuple(node.dimensions, true) || node.dimensions.some(value => value < 1)) return false;
  if (node.type === 'irregular' && (
    !node.shape
    || !Number.isInteger(node.shape.seed)
    || !Number.isFinite(node.shape.roughness)
    || node.shape.roughness < 0
    || node.shape.roughness > 0.45
    || (node.shape.form !== undefined && !(['chunk', 'slab'] as const).includes(node.shape.form))
  )) return false;
  if (node.type === 'tube' && (
    !Array.isArray(node.path)
    || node.path.length < 2
    || !node.path.every(point => isNumberTuple(point, true))
    || (node.tube !== undefined && (!Number.isFinite(node.tube.radiusScale) || node.tube.radiusScale < 0.1 || node.tube.radiusScale > 2))
  )) return false;
  if (node.type === 'pipe' && (
    !Array.isArray(node.path)
    || node.path.length < 2
    || !node.path.every(point => isNumberTuple(point, true))
    || !node.pipe
    || !Number.isFinite(node.pipe.innerDiameterMm)
    || node.pipe.innerDiameterMm <= 0
    || !Number.isFinite(node.pipe.wallThicknessMm)
    || node.pipe.wallThicknessMm <= 0
  )) return false;
  return Boolean(node.material)
    && typeof node.material?.color === 'string'
    && /^#[0-9a-f]{6}$/i.test(node.material.color)
    && typeof node.material.emissiveIntensity === 'number'
    && Number.isFinite(node.material.emissiveIntensity)
    && node.material.emissiveIntensity >= 0
    && typeof node.material.opacity === 'number'
    && Number.isFinite(node.material.opacity)
    && node.material.opacity >= 0
    && node.material.opacity <= 1
    && (node.material.surface === undefined || (['plain', 'concrete', 'rust', 'brick', 'metal', 'glass', 'acrylic'] as SceneSurfaceType[]).includes(node.material.surface))
    && (node.material.textureSeed === undefined || Number.isInteger(node.material.textureSeed));
}

function validateModuleDefinitions(value: unknown): value is SceneModuleDefinition[] {
  if (!Array.isArray(value)) return false;
  const moduleIds = new Set<string>();
  return value.every(module => {
    if (!module || typeof module !== 'object') return false;
    const definition = module as Partial<SceneModuleDefinition>;
    if (typeof definition.id !== 'string' || !definition.id || moduleIds.has(definition.id)) return false;
    moduleIds.add(definition.id);
    return typeof definition.category === 'string'
      && typeof definition.name === 'string'
      && Boolean(definition.recommendedSizeMm)
      && typeof definition.recommendedSizeMm === 'object'
      && Object.values(definition.recommendedSizeMm).every(item => typeof item === 'string' || (typeof item === 'number' && Number.isFinite(item)))
      && Array.isArray(definition.recommendedQuantity)
      && definition.recommendedQuantity.length === 2
      && definition.recommendedQuantity.every(item => Number.isInteger(item) && item >= 0)
      && Array.isArray(definition.layers)
      && definition.layers.every(layer => typeof layer === 'string')
      && typeof definition.purpose === 'string'
      && validateSceneNode(definition.template, new Set<string>(), 0);
  });
}
