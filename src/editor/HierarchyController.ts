import * as THREE from 'three';
import type { ProjectDataStore } from './ProjectDataStore';
interface HierarchyOptions {
  root: THREE.Group;
  dataStore: ProjectDataStore;
  getSelected: () => THREE.Object3D | null;
  isEffectivelyVisible: (object: THREE.Object3D) => boolean;
  selectObject: (object: THREE.Object3D) => void;
  clearSelection: () => void;
  refreshSelectionVisibility: () => void;
}
export function createHierarchyController({ root, dataStore, getSelected, isEffectivelyVisible, selectObject, clearSelection, refreshSelectionVisibility }: HierarchyOptions) {
  const hierarchy = document.querySelector<HTMLElement>('#sceneHierarchy');
  let hierarchyInitialized = false;
  let draggedObject: THREE.Object3D | null = null;
  const collapsedGroups = new Set<string>();
  function refreshHierarchy() {
    const selected = getSelected();
    if (!hierarchy) return;
    if (!hierarchyInitialized && root.children.length > 0) {
      root.children.forEach(object => {
        if (object instanceof THREE.Group && object.userData.sceneNodeId) {
          collapsedGroups.add(object.userData.sceneNodeId);
        }
      });
      hierarchyInitialized = true;
    }
    hierarchy.replaceChildren();
    const rootRow = document.createElement('div');
    rootRow.dataset.sceneRoot = 'true';
    rootRow.className = 'scene-hierarchy-row scene-root-row';
    rootRow.textContent = '◆ Project root';
    rootRow.title = 'Drop here to move an object out of its Group';
    hierarchy.appendChild(rootRow);
    function appendObject(object: THREE.Object3D, depth: number) {
      if (!object.userData.sceneNodeId) return;
      const row = document.createElement('div');
      row.className = 'scene-hierarchy-row';
      row.dataset.sceneObjectId = object.userData.sceneNodeId;
      row.style.paddingLeft = `${depth * 14}px`;
      row.classList.toggle('active', object === selected);
      row.classList.toggle('object-hidden', !isEffectivelyVisible(object));
      const isGroup = object instanceof THREE.Group;
      if (isGroup) {
        const collapseButton = document.createElement('button');
        collapseButton.type = 'button';
        collapseButton.className = 'scene-group-toggle';
        collapseButton.dataset.toggleGroup = object.userData.sceneNodeId;
        collapseButton.textContent = collapsedGroups.has(object.userData.sceneNodeId) ? '▸' : '▾';
        collapseButton.title = collapsedGroups.has(object.userData.sceneNodeId) ? 'Expand Group' : 'Collapse Group';
        row.appendChild(collapseButton);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'scene-group-spacer';
        row.appendChild(spacer);
      }
      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.draggable = true;
      selectButton.className = 'scene-object-select';
      selectButton.dataset.dragSceneObject = object.userData.sceneNodeId;
      selectButton.textContent = `${isGroup ? 'Group' : '•'} ${object.name}`;
      selectButton.title = isGroup ? 'Drag objects here to add them to this Group' : 'Drag to move this entity';
      const visibilityButton = document.createElement('button');
      visibilityButton.type = 'button';
      visibilityButton.className = 'scene-object-visibility';
      visibilityButton.dataset.toggleVisibility = object.userData.sceneNodeId;
      visibilityButton.textContent = object.visible ? '◉' : '○';
      visibilityButton.title = object.visible ? 'Hide object' : 'Show object';
      row.append(selectButton, visibilityButton);
      hierarchy?.appendChild(row);
      if (!isGroup || !collapsedGroups.has(object.userData.sceneNodeId)) object.children.forEach(child => appendObject(child, depth + 1));
    }
    root.children.forEach(object => appendObject(object, 0));
  }

  function handleHierarchyClick(event: Event) {
    const visibilityButton = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-toggle-visibility]');
    if (visibilityButton) {
      const object = findSceneObject(visibilityButton.dataset.toggleVisibility);
      if (!object) return;
      dataStore.setVisible(object, !object.visible);
      refreshSelectionVisibility();
      return refreshHierarchy();
    }
    const groupToggle = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-toggle-group]');
    if (groupToggle?.dataset.toggleGroup) {
      const id = groupToggle.dataset.toggleGroup;
      if (collapsedGroups.has(id)) collapsedGroups.delete(id);
      else collapsedGroups.add(id);
      return refreshHierarchy();
    }
    if ((event.target as HTMLElement).closest('[data-scene-root]')) return clearSelection();
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-scene-object-id]');
    if (!row) return;
    const object = findSceneObject(row.dataset.sceneObjectId);
    if (object) selectObject(object);
  }

  function findSceneObject(id?: string): THREE.Object3D | null {
    let object: THREE.Object3D | null = null;
    if (!id) return object;
    root.traverse(candidate => { if (candidate.userData.sceneNodeId === id) object = candidate; });
    return object;
  }

  function getDropParent(target: HTMLElement) {
    if (target.closest('[data-scene-root]')) return root;
    const row = target.closest<HTMLElement>('[data-scene-object-id]');
    const object = findSceneObject(row?.dataset.sceneObjectId);
    if (object instanceof THREE.Group) return object;
    return object?.parent instanceof THREE.Group ? object.parent : null;
  }

  function canReparent(object: THREE.Object3D, parent: THREE.Group) {
    if (object === parent || object.parent === parent) return false;
    let ancestor: THREE.Object3D | null = parent;
    while (ancestor) {
      if (ancestor === object) return false;
      ancestor = ancestor.parent;
    }
    return true;
  }

  function clearDropTargets() {
    hierarchy?.querySelectorAll('.drop-target').forEach(element => element.classList.remove('drop-target'));
  }

  function handleHierarchyDragStart(event: DragEvent) {
    const source = (event.target as HTMLElement).closest<HTMLElement>('[data-drag-scene-object]');
    const id = source?.dataset.dragSceneObject;
    const row = source?.closest<HTMLElement>('[data-scene-object-id]');
    if (!id || !row || !event.dataTransfer) return;
    event.dataTransfer.setData('application/x-scene-object', id);
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    draggedObject = findSceneObject(id);
    row.classList.add('dragging');
  }

  function handleHierarchyDragOver(event: DragEvent) {
    if (!event.dataTransfer) return;
    const object = draggedObject;
    const parent = getDropParent(event.target as HTMLElement);
    clearDropTargets();
    if (!object || !parent || !canReparent(object, parent)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    (event.target as HTMLElement).closest<HTMLElement>('[data-scene-root], [data-scene-object-id]')?.classList.add('drop-target');
  }

  function handleHierarchyDrop(event: DragEvent) {
    event.preventDefault();
    const id = event.dataTransfer?.getData('application/x-scene-object');
    const object = draggedObject ?? findSceneObject(id);
    const parent = getDropParent(event.target as HTMLElement);
    clearDropTargets();
    if (object && parent && dataStore.reparent(object, parent)) selectObject(object);
    draggedObject = null;
  }

  function handleHierarchyDragEnd() {
    draggedObject = null;
    clearDropTargets();
    hierarchy?.querySelectorAll('.dragging').forEach(element => element.classList.remove('dragging'));
  }

  return { refreshHierarchy, findSceneObject, handleHierarchyClick, handleHierarchyDragStart, handleHierarchyDragOver, handleHierarchyDrop, handleHierarchyDragEnd };
}
