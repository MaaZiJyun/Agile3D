import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCoordinateAxes } from './editor/helpers/coordinateAxes';
import { setupObjectEditor } from './editor/ObjectEditor';
import { createProjectDataStore } from './editor/ProjectDataStore';
import { type ModelCamera, type CameraPreset, changeProjection, frameCamera, resizeCamera, WORLD_UP } from './editor/cameraProjection';
import { setupMenuBar } from './editor/MenuBar';
import { setupOrientationWidget } from './editor/helpers/orientationWidget';
import { readAxisColors, applyAxisColors } from './editor/helpers/axisTheme';

export default function initModeler(sceneContainer: HTMLDivElement) {
  const themeRoot = document.documentElement;
  const nightToggle = document.querySelector<HTMLInputElement>('#nightToggle');
  const canvasColor = () => getComputedStyle(themeRoot).getPropertyValue('--o-color-canvas').trim();
  themeRoot.dataset.oTheme = nightToggle?.checked ? 'dark' : 'light';
  const scene = new THREE.Scene();
  const background = new THREE.Color(canvasColor());
  scene.background = background;
  const fog = new THREE.Fog(canvasColor(), 20, 100);
  scene.fog = fog;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  sceneContainer.appendChild(renderer.domElement);

  const environmentScene = new RoomEnvironment();
  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTarget = environmentGenerator.fromScene(environmentScene, 0.04);
  scene.environment = environmentTarget.texture;
  environmentScene.dispose();
  environmentGenerator.dispose();

  const projectionButtons = Array.from(document.querySelectorAll('[data-projection-toggle]'));
  let camera: ModelCamera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.005, 2000);
  camera.up.fromArray(WORLD_UP);
  camera.position.set(1.25, 1.15, 0.78);
  let controls = createOrbitControls(camera, new THREE.Vector3(0, 0, 0.29));

  function createOrbitControls(activeCamera: ModelCamera, target: THREE.Vector3, previous?: OrbitControls) {
    const next = new OrbitControls(activeCamera, renderer.domElement);
    next.enableDamping = true;
    next.dampingFactor = 0.06;
    next.target.copy(target);
    next.minDistance = previous?.minDistance ?? 0.2;
    next.maxDistance = previous?.maxDistance ?? 4;
    next.enabled = previous?.enabled ?? true;
    next.update();
    return next;
  }

  function rebindCamera(nextCamera: ModelCamera) {
    const previous = controls;
    const target = previous.target.clone();
    previous.dispose();
    camera = nextCamera;
    // Recreate controls so their orbit axis follows the camera's up vector.
    controls = createOrbitControls(camera, target, previous);
    objectEditor.setCamera(camera, controls);
  }

  const root = new THREE.Group();
  root.name = 'project-document-root';
  scene.add(root);
  const coordinateAxes = createCoordinateAxes(scene, [0, 0, 0]);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x4b5250, 1.75);
  scene.add(hemisphereLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.15);
  directionalLight.position.set(28, 42, 26);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.left = -40;
  directionalLight.shadow.camera.right = 40;
  directionalLight.shadow.camera.top = 40;
  directionalLight.shadow.camera.bottom = -40;
  scene.add(directionalLight);

  const projectDataStore = createProjectDataStore(root);
  const objectEditor = setupObjectEditor({
    scene,
    root,
    camera,
    renderer,
    orbitControls: controls,
    dataStore: projectDataStore,
    onFrameProject: handleFrameProject,
  });

  const orientationWidget = setupOrientationWidget(document.querySelector<HTMLElement>('#orientationWidget')!);
  const cameraButtons = Array.from(document.querySelectorAll('[data-camera]'));
  function handleFrameProject(preset?: CameraPreset) {
    const distance = frameCamera(camera, controls.target, new THREE.Box3().setFromObject(root), innerWidth / innerHeight, preset);
    controls.maxDistance = Math.max(4, distance * 3);
    fog.near = distance * 1.5;
    fog.far = distance * 4;
    rebindCamera(camera);
  }
  const handleCameraPreset = (event: Event) => handleFrameProject((event.currentTarget as HTMLElement).dataset.camera as CameraPreset);
  cameraButtons.forEach(button => button.addEventListener('click', handleCameraPreset));

  const handleProjectionToggle = () => {
    const perspective = !(camera instanceof THREE.PerspectiveCamera);
    const next = changeProjection(camera, controls.target, perspective, innerWidth / innerHeight);
    const distance = next.position.distanceTo(controls.target);
    controls.minDistance = Math.min(controls.minDistance, distance * 0.5);
    controls.maxDistance = Math.max(controls.maxDistance, distance * 3);
    rebindCamera(next);
    syncProjectionButtons(perspective);
  };
  function syncProjectionButtons(perspective: boolean) {
    projectionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(perspective));
      if (button.getAttribute('role') === 'menuitemcheckbox') button.setAttribute('aria-checked', String(perspective));
    });
  }
  syncProjectionButtons(true);
  projectionButtons.forEach(button => button.addEventListener('click', handleProjectionToggle));
  const frameButton = document.querySelector('#frameProject');
  const fitProject = () => handleFrameProject();
  frameButton?.addEventListener('click', fitProject);
  const disposeMenuBar = setupMenuBar(document.querySelector<HTMLElement>('#menuBar')!);

  const axesToggle = document.querySelector('#axesToggle');
  const handleAxes = (event: Event) => { coordinateAxes.visible = (event.target as HTMLInputElement).checked; };
  const handleNight = () => {
    const night = nightToggle?.checked ?? false;
    themeRoot.dataset.oTheme = night ? 'dark' : 'light';
    const axisColors = readAxisColors();
    applyAxisColors(coordinateAxes, axisColors);
    objectEditor.setAxisColors(axisColors);
    background.set(canvasColor());
    fog.color.set(canvasColor());
    hemisphereLight.intensity = night ? .32 : 1.75;
    directionalLight.intensity = night ? .35 : 2.15;
    renderer.toneMappingExposure = night ? .88 : 1.05;
  };
  axesToggle?.addEventListener('change', handleAxes);
  nightToggle?.addEventListener('change', handleNight);
  handleNight();

  let animationFrame = 0;
  function animate() {
    animationFrame = requestAnimationFrame(animate);
    controls.update();
    orientationWidget.update(camera);
    renderer.render(scene, camera);
  }
  animate();

  const handleResize = () => {
    resizeCamera(camera, innerWidth / innerHeight);
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', handleResize);

  return () => {
    cancelAnimationFrame(animationFrame);
    disposeMenuBar();
    frameButton?.removeEventListener('click', fitProject);
    objectEditor.dispose();
    controls.dispose();
    projectionButtons.forEach(button => button.removeEventListener('click', handleProjectionToggle));
    projectDataStore.dispose();
    cameraButtons.forEach(button => button.removeEventListener('click', handleCameraPreset));
    axesToggle?.removeEventListener('change', handleAxes);
    nightToggle?.removeEventListener('change', handleNight);
    removeEventListener('resize', handleResize);
    renderer.dispose();
    environmentTarget.dispose();
    renderer.domElement.remove();
  };
}
