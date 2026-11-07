import type * as THREE from 'three';
import type { SceneNodeData } from '../../../editor/sceneTypes';

export interface SceneComponentBuildContext {
  createGeneric(data: SceneNodeData): THREE.Object3D;
}

export interface SceneComponentDefinition {
  moduleId: string;
  displayName: string;
  create(data: SceneNodeData, context: SceneComponentBuildContext): THREE.Object3D;
}

export function defineSceneComponent(moduleId: string, displayName: string): SceneComponentDefinition {
  return {
    moduleId,
    displayName,
    create(data, context) {
      if (data.moduleId !== moduleId) {
        throw new Error(`Expected module ${moduleId}, received ${data.moduleId ?? 'none'}.`);
      }
      return context.createGeneric(data);
    },
  };
}
