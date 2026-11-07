import { readProject, writeProject } from './projectFiles';
import type { IntegerVec3, SceneNodeData, SceneTransformData } from '../src/editor/sceneTypes';

async function main() {
  const room = await readProject();
  room.modules ??= [];
  const transform = (position: IntegerVec3, scale: IntegerVec3 = [1, 1, 1]): SceneTransformData => ({
    position,
    rotation: [0, 0, 0],
    scale,
  });

  function basePanel(id: string, name: string): SceneNodeData {
    return {
      id,
      name,
      type: 'box',
      visible: true,
      moduleId: 'F4',
      transform: transform([0, 5, 0]),
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

  function acrylicPanel(id: string, name: string, orientation: 'x' | 'z', position: IntegerVec3): SceneNodeData {
    const alongX = orientation === 'x';
    return {
      id,
      name,
      type: 'box',
      visible: true,
      moduleId: 'F5',
      transform: transform(position),
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

  function extrusion(id: string, name: string, dimensions: IntegerVec3, position: IntegerVec3): SceneNodeData {
    return {
      id,
      name,
      type: 'aluminumExtrusion',
      visible: true,
      moduleId: 'A1',
      transform: transform(position),
      dimensions,
      material: {
        color: '#c7cdd0',
        emissiveIntensity: 0,
        opacity: 1,
        surface: 'metal',
        textureSeed: 130,
      },
    };
  }

  function sandboxStructure(prefix: string): SceneNodeData[] {
    return [
      basePanel(`${prefix}-base-panel`, '800 × 500 × 10 mm load-bearing base panel'),
      acrylicPanel(`${prefix}-panel-north`, 'North transparent acrylic panel', 'x', [0, 100, -240]),
      acrylicPanel(`${prefix}-panel-south`, 'South transparent acrylic panel', 'x', [0, 100, 240]),
      acrylicPanel(`${prefix}-panel-west`, 'West transparent acrylic panel', 'z', [-390, 100, 0]),
      acrylicPanel(`${prefix}-panel-east`, 'East transparent acrylic panel', 'z', [390, 100, 0]),
      extrusion(`${prefix}-bottom-north`, 'Bottom north aluminum extrusion', [800, 30, 30], [0, 20, -230]),
      extrusion(`${prefix}-bottom-south`, 'Bottom south aluminum extrusion', [800, 30, 30], [0, 20, 230]),
      extrusion(`${prefix}-bottom-west`, 'Bottom west aluminum extrusion', [30, 30, 500], [-380, 20, 0]),
      extrusion(`${prefix}-bottom-east`, 'Bottom east aluminum extrusion', [30, 30, 500], [380, 20, 0]),
      extrusion(`${prefix}-top-north`, 'Top north aluminum extrusion', [800, 30, 30], [0, 190, -230]),
      extrusion(`${prefix}-top-south`, 'Top south aluminum extrusion', [800, 30, 30], [0, 190, 230]),
      extrusion(`${prefix}-top-west`, 'Top west aluminum extrusion', [30, 30, 500], [-380, 190, 0]),
      extrusion(`${prefix}-top-east`, 'Top east aluminum extrusion', [30, 30, 500], [380, 190, 0]),
      extrusion(`${prefix}-post-nw`, 'Northwest aluminum post', [30, 140, 30], [-380, 100, -230]),
      extrusion(`${prefix}-post-ne`, 'Northeast aluminum post', [30, 140, 30], [380, 100, -230]),
      extrusion(`${prefix}-post-sw`, 'Southwest aluminum post', [30, 140, 30], [-380, 100, 230]),
      extrusion(`${prefix}-post-se`, 'Southeast aluminum post', [30, 140, 30], [380, 100, 230]),
      extrusion(`${prefix}-support-north`, 'North base support', [740, 30, 30], [0, 20, -80]),
      extrusion(`${prefix}-support-south`, 'South base support', [740, 30, 30], [0, 20, 80]),
      extrusion(`${prefix}-support-west`, 'West base support', [30, 30, 440], [-130, 20, 0]),
      extrusion(`${prefix}-support-east`, 'East base support', [30, 30, 440], [130, 20, 0]),
    ];
  }

  const f4 = room.modules.find(module => module.id === 'F4');
  if (f4) {
    f4.name = '10 mm load-bearing plastic base panel';
    f4.recommendedSizeMm = { length: 800, width: 500, thickness: 10 };
    f4.template = basePanel('template-f4', 'F4 800 × 500 × 10 mm base panel');
  }

  const f5 = room.modules.find(module => module.id === 'F5');
  if (f5) {
    f5.name = '10 mm transparent acrylic side panel';
    f5.recommendedSizeMm = { length: 500, height: 200, thickness: 10 };
    f5.template = acrylicPanel('template-f5', 'F5 500 × 200 × 10 mm acrylic panel', 'z', [0, 0, 0]);
  }

  room.modules = room.modules.filter(module => !['A1', 'SANDBOX'].includes(module.id));
  room.modules.push({
    id: 'A1',
    category: 'Frame',
    name: '30 × 30 mm slotted aluminum extrusion',
    recommendedSizeMm: { width: 30, height: 30, referenceLength: 500, slotWidth: 10 },
    recommendedQuantity: [16, 16],
    layers: ['L1', 'L2', 'L3'],
    purpose: 'Sandbox upper frame, lower frame, posts, and base supports',
    template: extrusion('template-a1', 'A1 30 × 30 × 500 mm aluminum extrusion', [30, 30, 500], [0, 0, 0]),
  });
  room.modules.push({
    id: 'SANDBOX',
    category: 'Container',
    name: '800 × 500 × 200 mm open sandbox',
    recommendedSizeMm: { length: 800, width: 500, height: 200 },
    recommendedQuantity: [3, 3],
    layers: ['L1', 'L2', 'L3'],
    purpose: 'Open ruin-layer container assembled from aluminum extrusion, acrylic panels, and a load-bearing base',
    template: {
      id: 'template-sandbox',
      name: '800 × 500 × 200 mm open sandbox',
      type: 'group',
      visible: true,
      moduleId: 'SANDBOX',
      transform: transform([0, 0, 0]),
      children: sandboxStructure('template-sandbox'),
    },
  });

  const legacyContainerModules = new Set(['A1', 'F1', 'F2', 'F4', 'F5']);
  for (let index = 0; index < 3; index += 1) {
    const layer = room.objects.find(node => node.id === `layer-l${index + 1}`);
    if (!layer?.children) continue;
    const contents = layer.children.filter(child => !legacyContainerModules.has(child.moduleId ?? ''));
    layer.moduleId = 'SANDBOX';
    layer.transform.position[1] = (2 - index) * 200;
    layer.children = [...sandboxStructure(`sandbox-l${index + 1}`), ...contents];
  }

  room.objects = room.objects.filter(node => node.id !== 'interlayer-supports');
  await writeProject(room);
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
