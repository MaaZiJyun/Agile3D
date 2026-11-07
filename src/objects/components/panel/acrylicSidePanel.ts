import { defineSceneComponent } from '../core/sceneComponent';
import type { IntegerVec3, SceneNodeData } from '../../../editor/sceneTypes';

export const ACRYLIC_PANEL_SIZE_MM = { length: 500, height: 200, thickness: 10 } as const;

type PanelOrientation = 'x' | 'z';

export function createTransparentAcrylicPanelNode(
  id: string,
  name: string,
  orientation: PanelOrientation,
  position: IntegerVec3,
): SceneNodeData {
  const alongX = orientation === 'x';
  return {
    id,
    name,
    type: 'box',
    visible: true,
    moduleId: 'F5',
    transform: {
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    dimensions: alongX ? [800, 200, 10] : [10, 200, 500],
    material: {
      color: '#d8f2f8',
      emissiveIntensity: 0,
      opacity: 0.22,
      surface: 'acrylic',
      textureSeed: 128,
    },
  };
}

export const AcrylicSidePanel = defineSceneComponent('F5', 'Transparent acrylic side panel');
