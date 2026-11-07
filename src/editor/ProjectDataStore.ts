import * as THREE from 'three';
import {
  SCENE_UNITS_PER_MM,
  bakeEntityScale,
  createNewNode,
  createObjectFromData,
  normalizeSceneDocument,
  rebuildScene,
  serializeObject,
  serializeScene,
  updateEntityDimensions,
  updatePipeSize,
  type IntegerVec3,
  type SceneDocumentData,
  type SceneModuleDefinition,
  type SceneNodeData,
  type SceneNodeType,
} from './SceneDocument';

const DEFAULT_PROJECT_FILE_NAME = 'untitled-model.json';

interface ProjectWritableFile {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface ProjectFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<ProjectWritableFile>;
}

type FilePickerWindow = Window & {
  showOpenFilePicker?: (options: object) => Promise<ProjectFileHandle[]>;
  showSaveFilePicker?: (options: object) => Promise<ProjectFileHandle>;
};

export function createProjectDataStore(root: THREE.Group) {
  let sequence = 1;
  let dirty = false;
  let activeProject = false;
  let projectFileName = DEFAULT_PROJECT_FILE_NAME;
  let projectFileHandle: ProjectFileHandle | null = null;
  let moduleDefinitions: SceneModuleDefinition[] = [];
  let savedSnapshot: SceneDocumentData | null = null;
  const listeners = new Set<() => void>();

  function setStatus(status: string) {
    const element = document.querySelector<HTMLElement>('#projectDataStatus');
    if (element) element.textContent = status;
  }

  function setProjectFileName(fileName: string) {
    const trimmedName = fileName.trim() || DEFAULT_PROJECT_FILE_NAME;
    projectFileName = trimmedName.toLowerCase().endsWith('.json') ? trimmedName : `${trimmedName}.json`;
    const element = document.querySelector<HTMLElement>('#projectFileName');
    if (element) element.textContent = projectFileName;
  }

  function setProjectAvailability(available: boolean) {
    activeProject = available;
    document.querySelectorAll<HTMLButtonElement>('[data-requires-project]').forEach(button => {
      button.disabled = !available;
    });
  }

  function notifySceneChanged() {
    listeners.forEach(listener => listener());
  }

  function rememberSavedState(document: SceneDocumentData) {
    savedSnapshot = structuredClone(document);
  }

  function changed() {
    if (!activeProject) return;
    dirty = true;
    setStatus('Unsaved');
  }

  function newProject() {
    const document: SceneDocumentData = {
      version: 3,
      unit: 0.02,
      positionUnit: 0.02,
      updatedAt: null,
      modules: structuredClone(moduleDefinitions),
      objects: [],
    };
    sequence = 1;
    rebuildScene(root, document);
    rememberSavedState(document);
    setProjectAvailability(true);
    projectFileHandle = null;
    dirty = false;
    setProjectFileName(DEFAULT_PROJECT_FILE_NAME);
    notifySceneChanged();
    setStatus('New project');
  }

  function add(type: SceneNodeType, parent?: THREE.Object3D | null) {
    if (!activeProject) return null;
    const node = createNewNode(type, sequence++);
    const object = createObjectFromData(node);
    const target = parent instanceof THREE.Group ? parent : root;
    target.add(object);
    target.updateMatrixWorld(true);
    notifySceneChanged();
    changed();
    return object;
  }

  function addModule(moduleId: string, parent?: THREE.Object3D | null) {
    if (!activeProject) return null;
    const definition = moduleDefinitions.find(module => module.id === moduleId);
    if (!definition) return null;
    const node = structuredClone(definition.template) as SceneNodeData;
    const instanceNumber = sequence++;
    let childNumber = 0;
    const assignInstanceData = (item: SceneNodeData, rootNode = false) => {
      childNumber += 1;
      item.id = `${moduleId.toLowerCase()}-${Date.now()}-${instanceNumber}-${childNumber}`;
      item.moduleId = moduleId;
      if (rootNode) item.name = `${moduleId} ${definition.name} ${instanceNumber}`;
      item.children?.forEach(child => assignInstanceData(child));
    };
    assignInstanceData(node, true);
    const object = createObjectFromData(node);
    const target = parent instanceof THREE.Group ? parent : root;
    target.add(object);
    target.updateMatrixWorld(true);
    notifySceneChanged();
    changed();
    return object;
  }

  function copyObject(object: THREE.Object3D) {
    if (!object.userData.sceneNodeId) return null;
    return structuredClone(serializeObject(object));
  }

  function pasteObject(source: SceneNodeData, parent?: THREE.Object3D | null) {
    if (!activeProject) return null;
    const node = structuredClone(source);
    const copyNumber = sequence++;
    let childNumber = 0;
    const assignCopyData = (item: SceneNodeData, rootNode = false) => {
      childNumber += 1;
      item.id = `${item.type}-copy-${Date.now()}-${copyNumber}-${childNumber}`;
      if (rootNode) item.name = `${item.name} copy`;
      item.children?.forEach(child => assignCopyData(child));
    };
    assignCopyData(node, true);
    const object = createObjectFromData(node);
    const target = parent instanceof THREE.Group ? parent : root;
    target.add(object);
    target.updateMatrixWorld(true);
    notifySceneChanged();
    changed();
    return object;
  }

  function remove(object: THREE.Object3D) {
    if (!object.parent || object === root) return;
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => material.dispose());
    });
    object.removeFromParent();
    notifySceneChanged();
    changed();
  }

  function reparent(object: THREE.Object3D, parent: THREE.Group) {
    if (object === root || !object.parent || object.parent === parent) return false;
    let ancestor: THREE.Object3D | null = parent;
    while (ancestor) {
      if (ancestor === object) return false;
      ancestor = ancestor.parent;
    }
    parent.attach(object);
    object.position.set(
      Math.round(object.position.x / SCENE_UNITS_PER_MM) * SCENE_UNITS_PER_MM,
      Math.round(object.position.y / SCENE_UNITS_PER_MM) * SCENE_UNITS_PER_MM,
      Math.round(object.position.z / SCENE_UNITS_PER_MM) * SCENE_UNITS_PER_MM,
    );
    object.updateMatrixWorld(true);
    notifySceneChanged();
    changed();
    return true;
  }

  function setVisible(object: THREE.Object3D, visible: boolean) {
    object.visible = visible;
    changed();
  }

  function resize(object: THREE.Object3D, dimensions: IntegerVec3) {
    updateEntityDimensions(object, dimensions);
    changed();
  }

  function resizePipe(object: THREE.Object3D, outerDiameterMm: number, lengthMm: number) {
    updatePipeSize(object, outerDiameterMm, lengthMm);
    changed();
  }

  function bakeScale(object: THREE.Object3D) {
    bakeEntityScale(object);
    changed();
  }

  async function openFile(file: File, fileHandle: ProjectFileHandle | null = null) {
    setStatus('Opening…');
    try {
      const document = normalizeSceneDocument(JSON.parse(await file.text()));
      if (!document) throw new Error('Invalid document');
      moduleDefinitions = document.modules ?? [];
      sequence = 1;
      rebuildScene(root, document);
      rememberSavedState(document);
      setProjectAvailability(true);
      projectFileHandle = fileHandle;
      dirty = false;
      setProjectFileName(file.name);
      notifySceneChanged();
      setStatus('Ready');
      return true;
    } catch {
      setStatus('Invalid JSON');
      return false;
    }
  }

  function supportsDirectFileOpen() {
    return typeof (window as FilePickerWindow).showOpenFilePicker === 'function';
  }

  async function openWithFilePicker() {
    const picker = (window as FilePickerWindow).showOpenFilePicker;
    if (!picker) return false;
    try {
      const [fileHandle] = await picker.call(window, {
        multiple: false,
        types: [{ description: 'JSON project', accept: { 'application/json': ['.json'] } }],
      });
      if (fileHandle) return await openFile(await fileHandle.getFile(), fileHandle);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'AbortError') setStatus('Unable to open file');
    }
    return false;
  }

  function createProjectJson() {
    const sceneDocument: SceneDocumentData = serializeScene(root, moduleDefinitions);
    sceneDocument.updatedAt = new Date().toISOString();
    return sceneDocument;
  }

  async function saveCurrentFile() {
    if (!activeProject) {
      setStatus('Choose a project first');
      return false;
    }
    try {
      if (!projectFileHandle) {
        const picker = (window as FilePickerWindow).showSaveFilePicker;
        if (!picker) {
          setStatus('Direct save unsupported · use Ctrl+D');
          return false;
        }
        projectFileHandle = await picker.call(window, {
          suggestedName: projectFileName,
          types: [{ description: 'JSON project', accept: { 'application/json': ['.json'] } }],
        });
        setProjectFileName(projectFileHandle.name);
      }
      const sceneDocument = createProjectJson();
      const writable = await projectFileHandle.createWritable();
      await writable.write(`${JSON.stringify(sceneDocument, null, 2)}\n`);
      await writable.close();
      rememberSavedState(sceneDocument);
      dirty = false;
      setStatus('Saved');
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') setStatus(dirty ? 'Save cancelled · Unsaved' : 'Save cancelled');
      else setStatus('Save failed');
      return false;
    }
  }

  function downloadFile() {
    if (!activeProject) {
      setStatus('Choose a project first');
      return false;
    }
    const sceneDocument = createProjectJson();
    const blob = new Blob([`${JSON.stringify(sceneDocument, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = projectFileName;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(dirty ? 'Downloaded copy · Unsaved' : 'Downloaded copy');
    return true;
  }

  function revertToSavedState() {
    if (!savedSnapshot) return false;
    const document = structuredClone(savedSnapshot);
    moduleDefinitions = document.modules ?? [];
    rebuildScene(root, document);
    dirty = false;
    notifySceneChanged();
    setStatus('Reverted to saved');
    return true;
  }

  setProjectAvailability(false);
  const fileNameElement = document.querySelector<HTMLElement>('#projectFileName');
  if (fileNameElement) fileNameElement.textContent = 'No project';
  setStatus('File → New / Open');
  return {
    changed,
    add,
    addModule,
    copyObject,
    pasteObject,
    remove,
    reparent,
    setVisible,
    resize,
    resizePipe,
    bakeScale,
    newProject,
    openFile,
    supportsDirectFileOpen,
    openWithFilePicker,
    saveCurrentFile,
    downloadFile,
    revertToSavedState,
    hasUnsavedChanges: () => dirty,
    hasActiveProject: () => activeProject,
    getProjectFileName: () => projectFileName,
    getModules: () => moduleDefinitions,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      listeners.clear();
    },
  };
}

export type ProjectDataStore = ReturnType<typeof createProjectDataStore>;
