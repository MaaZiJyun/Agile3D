import type * as THREE from 'three';
import type { SceneNodeData } from '../editor/sceneTypes';
import { BrokenRedBrick } from './components/brick/brokenRedBrick';
import { CompleteRedBrick } from './components/brick/completeRedBrick';
import { FracturedConcreteWall } from './components/concrete/fracturedConcreteWall';
import { IrregularConcreteBlock } from './components/concrete/irregularConcreteBlock';
import { LargeFracturedFloorSlab } from './components/concrete/largeFracturedFloorSlab';
import { MediumFracturedFloorSlab } from './components/concrete/mediumFracturedFloorSlab';
import { Sandbox } from './components/container/sandbox';
import type { SceneComponentBuildContext, SceneComponentDefinition } from './components/core/sceneComponent';
import { AluminumExtrusion } from './components/frame/AluminumExtrusion';
import { InterlayerSupportPost } from './components/frame/interlayerSupportPost';
import { LongPerimeterFrame } from './components/frame/longPerimeterFrame';
import { ShortPerimeterFrame } from './components/frame/shortPerimeterFrame';
import { GreenLedMarker } from './components/marker/greenLedMarker';
import { RedLedMarker } from './components/marker/redLedMarker';
import { AcrylicSidePanel } from './components/panel/acrylicSidePanel';
import { LayerBaseBoard } from './components/panel/layerBaseBoard';
import { GlassPipe } from './components/pipe/glassPipe';
import { PipeElbow } from './components/pipe/pipeElbow';
import { PipeTJunction } from './components/pipe/pipeTJunction';
import { StraightPipe } from './components/pipe/straightPipe';
import { VerticalPipe } from './components/pipe/verticalPipe';
import { ReinforcingBar } from './components/rebar/reinforcingBar';
import { IrregularRubble } from './components/rubble/irregularRubble';
import { LowVisibilityCavity } from './components/void/lowVisibilityCavity';

export const sceneComponentDefinitions: readonly SceneComponentDefinition[] = [
  IrregularRubble,
  CompleteRedBrick,
  BrokenRedBrick,
  LargeFracturedFloorSlab,
  MediumFracturedFloorSlab,
  FracturedConcreteWall,
  IrregularConcreteBlock,
  ReinforcingBar,
  StraightPipe,
  PipeElbow,
  PipeTJunction,
  GlassPipe,
  VerticalPipe,
  LowVisibilityCavity,
  GreenLedMarker,
  RedLedMarker,
  LongPerimeterFrame,
  ShortPerimeterFrame,
  InterlayerSupportPost,
  LayerBaseBoard,
  AcrylicSidePanel,
  AluminumExtrusion,
  Sandbox,
];

const definitionsByModuleId = new Map(
  sceneComponentDefinitions.map(definition => [definition.moduleId, definition]),
);

export function createRegisteredSceneComponent(
  data: SceneNodeData,
  context: SceneComponentBuildContext,
): THREE.Object3D | undefined {
  if (!data.moduleId) return undefined;
  return definitionsByModuleId.get(data.moduleId)?.create(data, context);
}
