import { createAddObjectMenu } from './AddObjectMenu';
import { createHierarchyController } from './HierarchyController';
import { createPropertyController } from './PropertyController';
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  SCENE_UNITS_PER_MM,
  type SceneNodeData,
  type SceneNodeType,
} from './SceneDocument';
import type { ProjectDataStore } from './ProjectDataStore';
import { applyAxisColors } from './helpers/axisTheme';

type Axis = 'x' | 'y' | 'z';
const SCALE_STEP = 0.05;
const ROTATION_STEP_DEGREES = 5;


interface ObjectEditorOptions {
  scene: THREE.Scene;
  root: THREE.Group;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  orbitControls: OrbitControls;
  dataStore: ProjectDataStore;
  onFrameProject: () => void;
}

function styleOutline(outline: THREE.BoxHelper, opacity: number, color: THREE.Color) {
  const material = outline.material as THREE.LineBasicMaterial;
  material.color.copy(color);
  material.transparent = true;
  material.opacity = opacity;
  material.depthTest = false;
  material.toneMapped = false;
  material.blending = THREE.NormalBlending;
  outline.renderOrder = 1000;
}

export function setupObjectEditor({ scene, root, camera, renderer, orbitControls, dataStore, onFrameProject }: ObjectEditorOptions) {
  const toggle = document.querySelector<HTMLInputElement>('#editorToggle');
  const panel = document.querySelector<HTMLElement>('#objectEditorPanel');
  const sidebar = document.querySelector<HTMLElement>('#sceneSidebar');
  const menuBar = document.querySelector<HTMLElement>('#menuBar');
  const objectsPanelToggle = document.querySelector<HTMLInputElement>('#objectsPanelToggle');
  const propertiesPanelToggle = document.querySelector<HTMLInputElement>('#propertiesPanelToggle');
  const importInput = document.querySelector<HTMLInputElement>('#projectJsonInput');
  const addMenuButton = document.querySelector<HTMLButtonElement>('#addObjectMenuButton');
  const addMenu = document.querySelector<HTMLElement>('#addObjectMenu');
  const { closeAddMenu, toggleAddMenu, refreshAddMenu } = createAddObjectMenu(dataStore, addMenu, addMenuButton);
  const hierarchy = document.querySelector<HTMLElement>('#sceneHierarchy');
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-transform-mode]'));
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const transformControls = new TransformControls(camera, renderer.domElement);
  const transformHelper = transformControls.getHelper();
  transformControls.setMode('translate');
  transformControls.setTranslationSnap(SCENE_UNITS_PER_MM);
  transformControls.setRotationSnap(THREE.MathUtils.degToRad(ROTATION_STEP_DEGREES));
  transformControls.setScaleSnap(SCALE_STEP);
  transformControls.setSize(0.8);
  transformHelper.visible = false;
  scene.add(transformHelper);

  const outlineColor = new THREE.Color();
  let enabled = false;
  let selected: THREE.Object3D | null = null;
  let hovered: THREE.Object3D | null = null;
  let selectionOutline: THREE.BoxHelper | null = null;
  let hoverOutline: THREE.BoxHelper | null = null;
  let copiedNode: SceneNodeData | null = null;
  let copiedParentId: string | null = null;
  let canvasPress: { id: number; x: number; y: number; blocked: boolean } | null = null;

  const { refreshHierarchy, findSceneObject, handleHierarchyClick, handleHierarchyDragStart, handleHierarchyDragOver, handleHierarchyDrop, handleHierarchyDragEnd } = createHierarchyController({
    root, dataStore, getSelected: () => selected, isEffectivelyVisible, selectObject, clearSelection,
    refreshSelectionVisibility: () => {
      setHoverOutline(null);
      setSelectionOutline(selected);
      transformHelper.visible = Boolean(selected && isEffectivelyVisible(selected));
    },
  });
  const { selectedName, vectorInputs, dimensionInputs, colorInput, emissiveInput, opacityInput, updateInputs, handleVectorInput, handleDimensionInput, handleAppearanceInput, handleNameInput } = createPropertyController({
    dataStore, getSelected: () => selected, updateSelected, updateMenuAvailability, updatePanelVisibility, refreshHierarchy,
  });

  function disposeOutline(outline: THREE.BoxHelper | null) {
    if (!outline) return;
    scene.remove(outline);
    outline.geometry.dispose();
    const material = outline.material;
    if (Array.isArray(material)) material.forEach(item => item.dispose());
    else material.dispose();
  }

  function isEffectivelyVisible(object: THREE.Object3D) {
    let current: THREE.Object3D | null = object;
    while (current && current !== scene) {
      if (!current.visible) return false;
      current = current.parent;
    }
    return true;
  }

  function setHoverOutline(object: THREE.Object3D | null) {
    disposeOutline(hoverOutline);
    hoverOutline = null;
    hovered = object;
    if (!object || object === selected || !isEffectivelyVisible(object)) return;
    hoverOutline = new THREE.BoxHelper(object, outlineColor);
    styleOutline(hoverOutline, 0.65, outlineColor);
    scene.add(hoverOutline);
  }

  function setSelectionOutline(object: THREE.Object3D | null) {
    disposeOutline(selectionOutline);
    selectionOutline = null;
    if (!object || !isEffectivelyVisible(object)) return;
    selectionOutline = new THREE.BoxHelper(object, outlineColor);
    styleOutline(selectionOutline, 1, outlineColor);
    scene.add(selectionOutline);
  }

  function selectObject(object: THREE.Object3D) {
    selected = object;
    setHoverOutline(null);
    setSelectionOutline(object);
    transformControls.setSpace(object.parent === root ? 'world' : 'local');
    transformControls.attach(object);
    transformHelper.visible = isEffectivelyVisible(object);
    updateInputs();
  }

  function clearSelection() {
    selected = null;
    transformControls.detach();
    transformHelper.visible = false;
    setSelectionOutline(null);
    updateInputs();
  }

  function pick(clientX: number, clientY: number) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(root.children, true).find(intersection => isEffectivelyVisible(intersection.object))?.object ?? null;
  }

  function resolveSelection(hit: THREE.Object3D) {
    if (selected) {
      let ancestor: THREE.Object3D | null = hit;
      while (ancestor && ancestor !== selected) ancestor = ancestor.parent;
      if (ancestor === selected && hit !== selected) {
        let nextLevel = hit;
        while (nextLevel.parent && nextLevel.parent !== selected) nextLevel = nextLevel.parent;
        if (nextLevel.parent === selected) return nextLevel;
      }
    }
    let projectObject = hit;
    while (projectObject.parent && projectObject.parent !== root) projectObject = projectObject.parent;
    return projectObject;
  }

  function updateSelected(save = true) {
    if (!selected) return;
    selected.updateMatrixWorld(true);
    selectionOutline?.update();
    transformHelper.updateMatrixWorld(true);
    updateInputs();
    if (save) dataStore.changed();
  }

  function handleCanvasPointerDown(event: PointerEvent) {
    if (canvasPress) canvasPress.blocked = true;
    if (!enabled || !event.isPrimary || event.button !== 0) return;
    canvasPress = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      blocked: transformControls.dragging || transformControls.axis !== null || Boolean(pick(event.clientX, event.clientY)),
    };
  }

  function handleCanvasPointerUp(event: PointerEvent) {
    const press = canvasPress;
    if (!press || press.id !== event.pointerId) return;
    canvasPress = null;
    if (!enabled || !selected || press.blocked || transformControls.dragging || event.button !== 0) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    if (!pick(event.clientX, event.clientY)) {
      setHoverOutline(null);
      clearSelection();
    }
  }

  function handleCanvasPointerCancel() {
    canvasPress = null;
  }

  function handlePointerMove(event: PointerEvent) {
    if (canvasPress?.id === event.pointerId && Math.hypot(event.clientX - canvasPress.x, event.clientY - canvasPress.y) > 5) {
      canvasPress.blocked = true;
    }
    if (!enabled || transformControls.dragging) return;
    const hit = pick(event.clientX, event.clientY);
    const candidate = hit ? resolveSelection(hit) : null;
    if (candidate !== hovered) setHoverOutline(candidate);
  }

  function handleDoubleClick(event: MouseEvent) {
    if (!enabled || transformControls.dragging) return;
    const hit = pick(event.clientX, event.clientY);
    if (hit) selectObject(resolveSelection(hit));
    else clearSelection();
  }

  function updateMenuAvailability() {
    modeButtons.forEach(button => { button.disabled = !selected || !enabled; });
    menuBar?.querySelectorAll<HTMLButtonElement>('[data-requires-selection]').forEach(button => {
      button.disabled = !selected || !enabled;
    });
    const paste = menuBar?.querySelector<HTMLButtonElement>('[data-editor-command="paste"]');
    if (paste) paste.disabled = !copiedNode || !enabled || !dataStore.hasActiveProject();
    if (addMenuButton) addMenuButton.disabled = !enabled || !dataStore.hasActiveProject();
  }

  function copySelection() {
    if (!selected || !enabled) return;
    copiedNode = dataStore.copyObject(selected);
    copiedParentId = selected.parent && selected.parent !== root
      ? selected.parent.userData.sceneNodeId ?? null : null;
    updateMenuAvailability();
  }

  function pasteSelection() {
    if (!copiedNode || !enabled) return;
    const copiedParent = copiedParentId ? findSceneObject(copiedParentId) : root;
    const parent = copiedParent instanceof THREE.Group ? copiedParent : root;
    const object = dataStore.pasteObject(copiedNode, parent);
    if (object) selectObject(object);
  }

  function handlePanelClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('button:disabled')) return;
    const command = target.closest<HTMLElement>('[data-editor-command]')?.dataset.editorCommand;
    if (command === 'copy') return copySelection();
    if (command === 'paste') return pasteSelection();
    if (command === 'deselect') { setHoverOutline(null); return clearSelection(); }
    if (command === 'download') return dataStore.downloadFile();
    if (command === 'revert') return dataStore.revertToSavedState();
    if (target.closest('#addObjectMenuButton')) {
      toggleAddMenu();
      return;
    }
    const modeButton = target.closest<HTMLButtonElement>('[data-transform-mode]');
    if (modeButton) {
      const mode = modeButton.dataset.transformMode as 'translate' | 'rotate' | 'scale';
      transformControls.setMode(mode);
      modeButtons.forEach(button => {
        const active = button.dataset.transformMode === mode;
        button.classList.toggle('active', active);
        button.setAttribute(button.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', String(active));
      });
      return;
    }
    const createButton = target.closest<HTMLButtonElement>('[data-create-type]');
    if (createButton) {
      const parent = selected instanceof THREE.Group ? selected : selected?.parent instanceof THREE.Group && selected.parent !== root ? selected.parent : root;
      const object = dataStore.add(createButton.dataset.createType as SceneNodeType, parent);
      closeAddMenu();
      if (object) return selectObject(object);
    }
    const moduleButton = target.closest<HTMLButtonElement>('[data-add-module-id]');
    if (moduleButton?.dataset.addModuleId) {
      const parent = selected instanceof THREE.Group ? selected : selected?.parent instanceof THREE.Group && selected.parent !== root ? selected.parent : root;
      const object = dataStore.addModule(moduleButton.dataset.addModuleId, parent);
      closeAddMenu();
      if (object) return selectObject(object);
    }
    if (target.closest('#deleteObjectButton') && selected) {
      const removed = selected;
      clearSelection();
      dataStore.remove(removed);
      return;
    }
    if (target.closest('#saveProjectJson')) void dataStore.saveCurrentFile();
    if (target.closest('#openProjectJson')) {
      if (dataStore.supportsDirectFileOpen()) {
        if (dataStore.hasUnsavedChanges() && !window.confirm('当前项目尚未保存。确定打开另一个 JSON 项目吗？')) return;
        void dataStore.openWithFilePicker().then(opened => { if (opened) frameProject(); });
      } else importInput?.click();
    }
    if (target.closest('#newProject')) {
      if (dataStore.hasUnsavedChanges() && !window.confirm('当前项目尚未保存。确定新建项目吗？')) return;
      clearSelection();
      dataStore.newProject();
    }
  }

  function handleImportChange() {
    const file = importInput?.files?.[0];
    if (file && (!dataStore.hasUnsavedChanges() || window.confirm('当前项目尚未保存。确定打开另一个 JSON 项目吗？'))) {
      clearSelection();
      void dataStore.openFile(file).then(opened => { if (opened) frameProject(); });
    }
    if (importInput) importInput.value = '';
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!dataStore.hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  function handlePointerLeave() {
    setHoverOutline(null);
  }

  function frameProject() {
    window.requestAnimationFrame(() => {
      onFrameProject();
    });
  }

  function handleDocumentPointerDown(event: PointerEvent) {
    if (addMenu?.hidden || (event.target instanceof Node && (addMenu?.contains(event.target) || addMenuButton?.contains(event.target)))) return;
    closeAddMenu();
  }

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const commandKey = event.ctrlKey || event.metaKey;
    if (commandKey && key === 's') {
      event.preventDefault();
      if (event.target instanceof HTMLElement) event.target.blur();
      void dataStore.saveCurrentFile();
      return;
    }
    if (commandKey && key === 'd') {
      event.preventDefault();
      dataStore.downloadFile();
      return;
    }
    if (commandKey && key === 'z') {
      event.preventDefault();
      dataStore.revertToSavedState();
      return;
    }
    const editingText = event.target instanceof HTMLInputElement
      || event.target instanceof HTMLTextAreaElement
      || event.target instanceof HTMLSelectElement
      || (event.target instanceof HTMLElement && event.target.isContentEditable);
    if (!enabled || editingText) return;
    if (commandKey && key === 'c') {
      if (!selected) return;
      event.preventDefault();
      return copySelection();
    }
    if (commandKey && key === 'v') {
      if (!copiedNode) return;
      event.preventDefault();
      return pasteSelection();
    }
    const moves: Record<string, [Axis, number]> = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', 1], ArrowDown: ['y', -1], PageUp: ['z', 1], PageDown: ['z', -1] };
    if (event.key === 'Escape' && addMenu && !addMenu.hidden) return closeAddMenu();
    if (event.key === 'Escape') return clearSelection();
    const move = moves[event.key];
    if (!move || !selected) return;
    event.preventDefault();
    selected.position[move[0]] = Math.round(selected.position[move[0]] / SCENE_UNITS_PER_MM + move[1]) * SCENE_UNITS_PER_MM;
    updateSelected();
  }

  function handleToggle() {
    enabled = Boolean(toggle?.checked);
    updatePanelVisibility();
    updateMenuAvailability();
    renderer.domElement.classList.toggle('editing', enabled);
    if (!enabled) { setHoverOutline(null); clearSelection(); }
  }

  function updatePanelVisibility() {
    panel?.classList.toggle('hidden', !enabled || !selected || !propertiesPanelToggle?.checked);
    sidebar?.classList.toggle('hidden', !enabled || !objectsPanelToggle?.checked);
  }

  function handleDraggingChanged(event: { value: unknown }) {
    orbitControls.enabled = !Boolean(event.value);
    if (event.value) {
      if (canvasPress) canvasPress.blocked = true;
      setHoverOutline(null);
    }
  }

  function handleTransformChange() {
    if (!selected) return;
    selectionOutline?.update();
    updateInputs();
    dataStore.changed();
  }

  function handleTransformMouseUp() {
    if (selected instanceof THREE.Mesh && transformControls.getMode() === 'scale') dataStore.bakeScale(selected);
    updateSelected(false);
  }

  const unsubscribe = dataStore.subscribe(() => { clearSelection(); refreshHierarchy(); refreshAddMenu(); });
  toggle?.addEventListener('change', handleToggle);
  menuBar?.addEventListener('click', handlePanelClick);
  objectsPanelToggle?.addEventListener('change', updatePanelVisibility);
  propertiesPanelToggle?.addEventListener('change', updatePanelVisibility);
  panel?.addEventListener('click', handlePanelClick);
  sidebar?.addEventListener('click', handlePanelClick);
  selectedName?.addEventListener('change', handleNameInput);
  vectorInputs.forEach(input => input.addEventListener('change', handleVectorInput));
  dimensionInputs.forEach(input => input.addEventListener('change', handleDimensionInput));
  colorInput?.addEventListener('input', handleAppearanceInput);
  emissiveInput?.addEventListener('change', handleAppearanceInput);
  opacityInput?.addEventListener('input', handleAppearanceInput);
  importInput?.addEventListener('change', handleImportChange);
  hierarchy?.addEventListener('click', handleHierarchyClick);
  hierarchy?.addEventListener('dragstart', handleHierarchyDragStart);
  hierarchy?.addEventListener('dragover', handleHierarchyDragOver);
  hierarchy?.addEventListener('drop', handleHierarchyDrop);
  hierarchy?.addEventListener('dragend', handleHierarchyDragEnd);
  renderer.domElement.addEventListener('pointerdown', handleCanvasPointerDown, true);
  renderer.domElement.addEventListener('pointerup', handleCanvasPointerUp, true);
  renderer.domElement.addEventListener('pointercancel', handleCanvasPointerCancel);
  renderer.domElement.addEventListener('pointermove', handlePointerMove);
  renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
  renderer.domElement.addEventListener('dblclick', handleDoubleClick);
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('beforeunload', handleBeforeUnload);
  transformControls.addEventListener('dragging-changed', handleDraggingChanged);
  transformControls.addEventListener('objectChange', handleTransformChange);
  transformControls.addEventListener('mouseUp', handleTransformMouseUp);
  handleToggle();
  refreshHierarchy();
  refreshAddMenu();
  updateMenuAvailability();

  return {
    isEnabled: () => enabled,
    setAxisColors(colors: { x: THREE.Color; y: THREE.Color; z: THREE.Color; active: THREE.Color }) {
      applyAxisColors(transformControls, colors);
      outlineColor.copy(colors.active);
      if (hoverOutline) styleOutline(hoverOutline, 0.65, outlineColor);
      if (selectionOutline) styleOutline(selectionOutline, 1, outlineColor);
    },
    setCamera(nextCamera: THREE.Camera, nextOrbitControls: OrbitControls) {
      camera = nextCamera;
      orbitControls = nextOrbitControls;
      transformControls.camera = nextCamera;
    },
    dispose() {
      unsubscribe();
      toggle?.removeEventListener('change', handleToggle);
      menuBar?.removeEventListener('click', handlePanelClick);
      objectsPanelToggle?.removeEventListener('change', updatePanelVisibility);
      propertiesPanelToggle?.removeEventListener('change', updatePanelVisibility);
      panel?.removeEventListener('click', handlePanelClick);
      sidebar?.removeEventListener('click', handlePanelClick);
      selectedName?.removeEventListener('change', handleNameInput);
      vectorInputs.forEach(input => input.removeEventListener('change', handleVectorInput));
      dimensionInputs.forEach(input => input.removeEventListener('change', handleDimensionInput));
      colorInput?.removeEventListener('input', handleAppearanceInput);
      emissiveInput?.removeEventListener('change', handleAppearanceInput);
      opacityInput?.removeEventListener('input', handleAppearanceInput);
      importInput?.removeEventListener('change', handleImportChange);
      hierarchy?.removeEventListener('click', handleHierarchyClick);
      hierarchy?.removeEventListener('dragstart', handleHierarchyDragStart);
      hierarchy?.removeEventListener('dragover', handleHierarchyDragOver);
      hierarchy?.removeEventListener('drop', handleHierarchyDrop);
      hierarchy?.removeEventListener('dragend', handleHierarchyDragEnd);
      renderer.domElement.removeEventListener('pointerdown', handleCanvasPointerDown, true);
      renderer.domElement.removeEventListener('pointerup', handleCanvasPointerUp, true);
      renderer.domElement.removeEventListener('pointercancel', handleCanvasPointerCancel);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      transformControls.removeEventListener('dragging-changed', handleDraggingChanged);
      transformControls.removeEventListener('objectChange', handleTransformChange);
      transformControls.removeEventListener('mouseUp', handleTransformMouseUp);
      setHoverOutline(null);
      clearSelection();
      scene.remove(transformHelper);
      transformControls.dispose();
    },
  };
}
