import { readProject, writeProject } from './projectFiles';
import type { SceneNodeData } from '../src/editor/sceneTypes';

async function main() {
  const room = await readProject();
  room.modules ??= [];
  function seededRandom(seed: number) {
    let state = seed >>> 0;
    return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function pick<T>(random: () => number, values: T[]): T {
    return values[Math.floor(random() * values.length)];
  }

  function decimal(value: number) {
    return Math.round(value * 100) / 100;
  }

  function refinePipe(node: SceneNodeData) {
    if (node.type === 'pipe') {
      const wallThicknessMm = node.pipe?.wallThicknessMm ?? 6;
      const isGlass = (node.material?.opacity ?? 1) < 1 || /transparent/i.test(node.name);
      node.pipe = {
        ...node.pipe,
        // Keep the finished outside diameter at exactly 60 real-world millimetres.
        innerDiameterMm: 60 - wallThicknessMm * 2,
        wallThicknessMm,
      };
      if (node.material) {
        node.material.color = isGlass ? '#d9f2f7' : '#b9c1c5';
        node.material.surface = isGlass ? 'glass' : 'metal';
        if (isGlass) node.material.opacity = 0.16;
      }
    }
    node.children?.forEach(refinePipe);
  }

  function findPipe(node: SceneNodeData): SceneNodeData | undefined {
    if (node.type === 'pipe') return node;
    for (const child of node.children ?? []) {
      const pipe = findPipe(child);
      if (pipe) return pipe;
    }
    return undefined;
  }

  function createGravel(layerId: string, layerNumber: number): SceneNodeData[] {
    const random = seededRandom(51803 + layerNumber * 7919);
    const gravel: SceneNodeData[] = [];
    const columns = 22;
    const rows = 14;
    const colors = ['#747a7c', '#83898b', '#929798', '#a1a5a6', '#afb2b2'];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const sequence = row * columns + column + 1;
        const width = pick(random, [20, 40, 40, 40, 60, 60]);
        const height = pick(random, [20, 20, 20, 20, 40]);
        const depth = pick(random, [20, 40, 40, 40, 60, 60]);
        const scaleY = decimal(0.86 + random() * 0.22);
        const x = Math.round(-330 + column * (660 / (columns - 1)) + (random() - 0.5) * 14);
        const z = Math.round(-190 + row * (380 / (rows - 1)) + (random() - 0.5) * 14);
        const uniqueSeed = 710000 + layerNumber * 10000 + sequence * 37;

        gravel.push({
          id: `r1-fill-${layerId}-${String(sequence).padStart(3, '0')}`,
          name: `R1 L${layerNumber} gravel fill ${String(sequence).padStart(3, '0')}`,
          type: 'irregular',
          visible: true,
          moduleId: 'R1',
          transform: {
            position: [x, Math.round(20 + height * scaleY / 2), z],
            rotation: [
              Math.round((random() - 0.5) * 34),
              Math.round(random() * 359),
              Math.round((random() - 0.5) * 34),
            ],
            scale: [
              decimal(0.84 + random() * 0.3),
              scaleY,
              decimal(0.84 + random() * 0.3),
            ],
          },
          dimensions: [width, height, depth],
          material: {
            color: pick(random, colors),
            emissiveIntensity: 0,
            opacity: 1,
            surface: 'concrete',
            textureSeed: uniqueSeed,
          },
          shape: {
            seed: uniqueSeed + 1103,
            roughness: decimal(0.32 + random() * 0.13),
            form: 'chunk',
          },
        });
      }
    }
    return gravel;
  }

  function createL3BrickRubble(): SceneNodeData[] {
    const random = seededRandom(93173);
    const colors = ['#7f4637', '#8f5140', '#9f5b47', '#ad6850', '#b87358'];
    return Array.from({ length: 24 }, (_, index) => {
      const sequence = index + 9;
      const uniqueSeed = 840000 + sequence * 53;
      return {
        id: `b2-fill-l3-${String(index + 1).padStart(3, '0')}`,
        name: `B2 L3 red brick rubble ${String(sequence).padStart(2, '0')}`,
        type: 'irregular',
        visible: true,
        moduleId: 'B2',
        transform: {
          position: [
            Math.round(-320 + random() * 640),
            30 + Math.floor(random() * 30),
            Math.round(-180 + random() * 360),
          ],
          rotation: [
            Math.round((random() - 0.5) * 52),
            Math.round(random() * 359),
            Math.round((random() - 0.5) * 52),
          ],
          scale: [
            decimal(0.68 + random() * 0.48),
            decimal(0.62 + random() * 0.34),
            decimal(0.72 + random() * 0.46),
          ],
        },
        dimensions: [pick(random, [20, 40, 40, 40]), 20, 20],
        material: {
          color: pick(random, colors),
          emissiveIntensity: 0,
          opacity: 1,
          surface: 'brick',
          textureSeed: uniqueSeed,
        },
        shape: {
          seed: uniqueSeed + 1301,
          roughness: decimal(0.36 + random() * 0.09),
          form: 'chunk',
        },
      };
    });
  }

  for (const definition of room.modules ?? []) {
    refinePipe(definition.template);
    if (definition.id === 'R1') definition.recommendedQuantity = [150, 170];
    if (definition.category === 'Pipe') {
      const wallThicknessMm = findPipe(definition.template)?.pipe?.wallThicknessMm ?? 6;
      definition.recommendedSizeMm = {
        ...definition.recommendedSizeMm,
        outerDiameter: 60,
        innerDiameter: 60 - wallThicknessMm * 2,
      };
    }
  }

  for (const node of room.objects) refinePipe(node);

  for (let index = 0; index < 3; index += 1) {
    const layer = room.objects.find(node => node.id === `layer-l${index + 1}`);
    if (!layer?.children) continue;
    const firstRubbleIndex = Math.max(0, layer.children.findIndex(child => child.moduleId === 'R1'));
    const nonRubble = layer.children.filter(child => child.moduleId !== 'R1');
    nonRubble.splice(firstRubbleIndex, 0, ...createGravel(`l${index + 1}`, index + 1));
    layer.children = nonRubble;
  }

  const thirdLayer = room.objects.find(node => node.id === 'layer-l3');
  if (thirdLayer?.children) {
    const children = thirdLayer.children.filter(child => !child.id.startsWith('b2-fill-l3-'));
    let lastBrickIndex = -1;
    children.forEach((child, index) => {
      if (child.moduleId === 'B1' || child.moduleId === 'B2') lastBrickIndex = index;
    });
    children.splice(lastBrickIndex + 1, 0, ...createL3BrickRubble());
    thirdLayer.children = children;
  }

  await writeProject(room);
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
