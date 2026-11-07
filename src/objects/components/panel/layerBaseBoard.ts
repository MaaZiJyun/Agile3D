import { defineSceneComponent } from '../core/sceneComponent';
import type { SceneNodeData } from '../../../editor/sceneTypes';

export const BASE_PANEL_SIZE_MM = { length: 800, width: 500, thickness: 10 } as const;

export function createBasePanelNode(id: string, name: string): SceneNodeData {
  return {
    id,
    name,
    type: 'box',
    visible: true,
    moduleId: 'F4',
    transform: {
      position: [0, 5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    dimensions: [800, 10, 500],
    material: {
      color: '#343a3d',
      emissiveIntensity: 0,
      opacity: 1,
      surface: 'plain',
      textureSeed: 127,
    },
  };
}

export const LayerBaseBoard = defineSceneComponent('F4', 'Layer base board');
