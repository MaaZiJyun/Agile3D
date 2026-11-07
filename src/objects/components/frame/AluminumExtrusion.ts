import { defineSceneComponent } from '../core/sceneComponent';
import type { IntegerVec3, SceneNodeData } from '../../../editor/sceneTypes';

export const ALUMINUM_EXTRUSION_SIZE_MM = {
  width: 30,
  height: 30,
  referenceLength: 500,
  slotWidth: 10,
} as const;

export function createAluminumExtrusionNode(
  id: string,
  name: string,
  dimensions: IntegerVec3,
  position: IntegerVec3,
): SceneNodeData {
  return {
    id,
    name,
    type: 'aluminumExtrusion',
    visible: true,
    moduleId: 'A1',
    transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
    dimensions,
    material: {
      color: '#adb1b3',
      emissiveIntensity: 0,
      opacity: 1,
      surface: 'metal',
      textureSeed: 130,
    },
  };
}

export const AluminumExtrusion = defineSceneComponent('A1', '30 × 30 mm aluminum extrusion');
