import type { SceneNodeType } from './sceneTypes';
import type { ProjectDataStore } from './ProjectDataStore';
export function createAddObjectMenu(dataStore: ProjectDataStore, addMenu: HTMLElement | null, addMenuButton: HTMLButtonElement | null) {
  function closeAddMenu() {
    if (addMenu) addMenu.hidden = true;
    addMenuButton?.setAttribute('aria-expanded', 'false');
  }

  function toggleAddMenu() {
    if (!addMenu || !addMenuButton || addMenuButton.disabled) return;
    addMenu.hidden = !addMenu.hidden;
    addMenuButton.setAttribute('aria-expanded', String(!addMenu.hidden));
  }

  function refreshAddMenu() {
    if (!addMenu) return;
    const categories = new Map<string, Array<{ label: string; type?: SceneNodeType; moduleId?: string }>>();
    categories.set('Basic', [
      { label: 'Group', type: 'group' },
      { label: 'Box', type: 'box' },
      { label: 'Sphere', type: 'sphere' },
      { label: 'Cylinder', type: 'cylinder' },
      { label: 'Irregular', type: 'irregular' },
      { label: 'Bent tube', type: 'tube' },
      { label: 'Pipe', type: 'pipe' },
      { label: 'Aluminum extrusion', type: 'aluminumExtrusion' },
      { label: '3030 corner bracket', type: 'lBracket3030' },
      { label: '3030 aluminum profile', type: 'aluminumProfile3030' },
      { label: '3030 L connector plate', type: 'lConnector3030' },
      { label: 'U8 combination profile', type: 'u8CombinationProfile' },
    ]);
    dataStore.getModules().forEach(module => {
      const options = categories.get(module.category) ?? [];
      options.push({ label: `${module.id} · ${module.name}`, moduleId: module.id });
      categories.set(module.category, options);
    });
    const categoryElements = Array.from(categories, ([category, options]) => {
      const section = document.createElement('section');
      section.className = 'editor-add-category';
      const title = document.createElement('h3');
      title.className = 'editor-add-category-title';
      title.textContent = category;
      section.appendChild(title);
      options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'editor-add-option';
        button.setAttribute('role', 'menuitem');
        button.textContent = option.label;
        if (option.type) button.dataset.createType = option.type;
        if (option.moduleId) button.dataset.addModuleId = option.moduleId;
        section.appendChild(button);
      });
      return section;
    });
    addMenu.replaceChildren(...categoryElements);
    closeAddMenu();
  }

  return { closeAddMenu, toggleAddMenu, refreshAddMenu };
}
