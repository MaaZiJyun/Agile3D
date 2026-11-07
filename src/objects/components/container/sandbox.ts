import { defineSceneComponent } from '../core/sceneComponent';
import type { SceneNodeData } from '../../../editor/sceneTypes';
import { createAluminumExtrusionNode } from '../frame/AluminumExtrusion';
import { createBasePanelNode } from '../panel/layerBaseBoard';
import { createTransparentAcrylicPanelNode } from '../panel/acrylicSidePanel';

export const SANDBOX_SIZE_MM = { length: 800, width: 500, height: 200 } as const;

export function createSandboxStructure(prefix: string): SceneNodeData[] {
  const extrusion = (suffix: string, name: string, dimensions: [number, number, number], position: [number, number, number]) => (
    createAluminumExtrusionNode(`${prefix}-${suffix}`, name, dimensions, position)
  );

  return [
    createBasePanelNode(`${prefix}-base-panel`, '800 × 500 × 10 mm load-bearing base panel'),
    createTransparentAcrylicPanelNode(`${prefix}-panel-north`, 'North transparent acrylic panel', 'x', [0, 100, -240]),
    createTransparentAcrylicPanelNode(`${prefix}-panel-south`, 'South transparent acrylic panel', 'x', [0, 100, 240]),
    createTransparentAcrylicPanelNode(`${prefix}-panel-west`, 'West transparent acrylic panel', 'z', [-390, 100, 0]),
    createTransparentAcrylicPanelNode(`${prefix}-panel-east`, 'East transparent acrylic panel', 'z', [390, 100, 0]),

    extrusion('bottom-north', 'Bottom north aluminum extrusion', [800, 30, 30], [0, 20, -230]),
    extrusion('bottom-south', 'Bottom south aluminum extrusion', [800, 30, 30], [0, 20, 230]),
    extrusion('bottom-west', 'Bottom west aluminum extrusion', [30, 30, 500], [-380, 20, 0]),
    extrusion('bottom-east', 'Bottom east aluminum extrusion', [30, 30, 500], [380, 20, 0]),
    extrusion('top-north', 'Top north aluminum extrusion', [800, 30, 30], [0, 190, -230]),
    extrusion('top-south', 'Top south aluminum extrusion', [800, 30, 30], [0, 190, 230]),
    extrusion('top-west', 'Top west aluminum extrusion', [30, 30, 500], [-380, 190, 0]),
    extrusion('top-east', 'Top east aluminum extrusion', [30, 30, 500], [380, 190, 0]),

    extrusion('post-nw', 'Northwest aluminum post', [30, 140, 30], [-380, 100, -230]),
    extrusion('post-ne', 'Northeast aluminum post', [30, 140, 30], [380, 100, -230]),
    extrusion('post-sw', 'Southwest aluminum post', [30, 140, 30], [-380, 100, 230]),
    extrusion('post-se', 'Southeast aluminum post', [30, 140, 30], [380, 100, 230]),

    extrusion('support-north', 'North base support', [740, 30, 30], [0, 20, -80]),
    extrusion('support-south', 'South base support', [740, 30, 30], [0, 20, 80]),
    extrusion('support-west', 'West base support', [30, 30, 440], [-130, 20, 0]),
    extrusion('support-east', 'East base support', [30, 30, 440], [130, 20, 0]),
  ];
}

export const Sandbox = defineSceneComponent('SANDBOX', '800 × 500 × 200 mm open sandbox');
