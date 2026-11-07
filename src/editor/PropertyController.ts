import * as THREE from 'three';
import type { ProjectDataStore } from './ProjectDataStore';
import { SCENE_UNITS_PER_MM, getPipeLengthMm, getPipeOuterDiameterMm, getPipePrimaryAxis, type IntegerVec3 } from './SceneDocument';
type Axis = 'x' | 'y' | 'z';
type VectorProperty = 'position' | 'rotation' | 'scale';
type EditableMaterial = THREE.Material & { color?: THREE.Color; emissive?: THREE.Color; emissiveIntensity?: number };
interface PropertyOptions {
  dataStore: ProjectDataStore;
  getSelected: () => THREE.Object3D | null;
  updateSelected: (save?: boolean) => void;
  updateMenuAvailability: () => void;
  updatePanelVisibility: () => void;
  refreshHierarchy: () => void;
}
export function createPropertyController({ dataStore, getSelected, updateSelected, updateMenuAvailability, updatePanelVisibility, refreshHierarchy }: PropertyOptions) {
  const selectedName = document.querySelector<HTMLInputElement>('#editorName');
  const vectorInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-editor-vector]'));
  const dimensionInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-editor-dimension]'));
  const dimensionLabels = Array.from(document.querySelectorAll<HTMLElement>('[data-editor-dimension-label]'));
  const colorInput = document.querySelector<HTMLInputElement>('#editorColor');
  const emissiveInput = document.querySelector<HTMLInputElement>('#editorEmissive');
  const opacityInput = document.querySelector<HTMLInputElement>('#editorOpacity');
  function getMaterials(object: THREE.Object3D) {
    const materials: EditableMaterial[] = [];
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const list = Array.isArray(child.material) ? child.material : [child.material];
      list.forEach(material => materials.push(material as EditableMaterial));
    });
    return materials;
  }

  function makeMaterialsIndependent(object: THREE.Object3D) {
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh) || child.userData.editorMaterialCloned) return;
      child.material = Array.isArray(child.material) ? child.material.map(material => material.clone()) : child.material.clone();
      child.userData.editorMaterialCloned = true;
    });
  }

  function updateInputs() {
    const selected = getSelected();
    if (selectedName) {
      selectedName.value = selected?.name ?? '';
      selectedName.disabled = !selected;
    }
    vectorInputs.forEach(input => {
      input.disabled = !selected;
      if (!selected) return void (input.value = '');
      const property = input.dataset.editorVector as VectorProperty;
      const axis = input.dataset.axis as Axis;
      let value = selected[property][axis];
      if (property === 'position') value = Math.round(value / SCENE_UNITS_PER_MM);
      if (property === 'rotation') value = THREE.MathUtils.radToDeg(value);
      input.value = value.toFixed(property === 'position' ? 0 : 2);
    });
    const dimensions = selected instanceof THREE.Mesh ? selected.userData.dimensions as IntegerVec3 : null;
    const isPipe = selected instanceof THREE.Mesh && selected.userData.sceneNodeType === 'pipe';
    const pipePrimaryAxis = isPipe ? getPipePrimaryAxis(selected) : -1;
    const defaultDimensionLabels = ['Width', 'Height', 'Depth'];
    dimensionInputs.forEach((input, index) => {
      input.disabled = !dimensions;
      if (dimensionLabels[index]) dimensionLabels[index].textContent = isPipe
        ? index === pipePrimaryAxis ? 'Length' : 'Diameter'
        : defaultDimensionLabels[index];
      input.value = dimensions
        ? String(isPipe
          ? index === pipePrimaryAxis ? getPipeLengthMm(selected) : getPipeOuterDiameterMm(selected)
          : dimensions[index])
        : '';
    });
    const material = selected ? getMaterials(selected)[0] : null;
    if (colorInput) { colorInput.disabled = !material; colorInput.value = material?.color ? `#${material.color.getHexString()}` : '#ffffff'; }
    if (emissiveInput) { emissiveInput.disabled = !material; emissiveInput.value = String(selected?.userData.editorEmissiveIntensity ?? 0); }
    if (opacityInput) { opacityInput.disabled = !material; opacityInput.value = String(material?.opacity ?? 1); }
    updateMenuAvailability();
    updatePanelVisibility();
    refreshHierarchy();
  }

  function handleVectorInput(event: Event) {
    const selected = getSelected();
    if (!selected) return;
    const input = event.currentTarget as HTMLInputElement;
    const property = input.dataset.editorVector as VectorProperty;
    const axis = input.dataset.axis as Axis;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    selected[property][axis] = property === 'position'
      ? Math.round(value) * SCENE_UNITS_PER_MM
      : property === 'rotation' ? THREE.MathUtils.degToRad(value) : value;
    if (property === 'scale' && selected instanceof THREE.Mesh) dataStore.bakeScale(selected);
    updateSelected();
  }

  function handleDimensionInput(event: Event) {
    const selected = getSelected();
    if (!(selected instanceof THREE.Mesh)) return;
    if (selected.userData.sceneNodeType === 'pipe') {
      const editedAxis = dimensionInputs.indexOf(event.currentTarget as HTMLInputElement);
      const primaryAxis = getPipePrimaryAxis(selected);
      const editedValue = Math.max(1, Math.round(Number((event.currentTarget as HTMLInputElement).value)));
      const diameter = editedAxis === primaryAxis ? getPipeOuterDiameterMm(selected) : editedValue;
      const length = editedAxis === primaryAxis ? editedValue : getPipeLengthMm(selected);
      dataStore.resizePipe(selected, diameter, length);
      return updateSelected(false);
    }
    const dimensions = dimensionInputs.map(input => Math.max(1, Math.round(Number(input.value)))) as IntegerVec3;
    dataStore.resize(selected, dimensions);
    updateSelected(false);
  }

  function handleAppearanceInput() {
    const selected = getSelected();
    if (!selected) return;
    makeMaterialsIndependent(selected);
    const color = colorInput?.value;
    const glow = Math.max(0, Number(emissiveInput?.value ?? 0));
    const opacity = THREE.MathUtils.clamp(Number(opacityInput?.value ?? 1), 0, 1);
    selected.userData.editorEmissiveIntensity = glow;
    getMaterials(selected).forEach(material => {
      if (color) material.color?.set(color);
      if (material.emissive) { if (color) material.emissive.set(color); material.emissiveIntensity = glow; }
      material.opacity = opacity;
      material.transparent = opacity < 1;
      material.depthWrite = opacity >= 1;
      material.needsUpdate = true;
    });
    updateSelected();
  }

  function handleNameInput() {
    const selected = getSelected();
    if (!selected || !selectedName) return;
    selected.name = selectedName.value.trim() || selected.type;
    updateSelected();
  }

  return { selectedName, vectorInputs, dimensionInputs, colorInput, emissiveInput, opacityInput, updateInputs, handleVectorInput, handleDimensionInput, handleAppearanceInput, handleNameInput };
}
