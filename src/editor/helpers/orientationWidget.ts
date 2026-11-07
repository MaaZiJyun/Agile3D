import * as THREE from 'three';

const AXES = [
  { axis: 'x', direction: new THREE.Vector3(1, 0, 0) },
  { axis: 'y', direction: new THREE.Vector3(0, 1, 0) },
  { axis: 'z', direction: new THREE.Vector3(0, 0, 1) },
];
const CENTER = 56;
const LENGTH = 37;

// Rotate world axes into camera space; ignore camera position and zoom.
export function projectOrientationAxes(cameraQuaternion: THREE.Quaternion) {
  const inverse = cameraQuaternion.clone().invert();
  return AXES.map(({ axis, direction }) => {
    const point = direction.clone().applyQuaternion(inverse);
    return { axis, x: CENTER + point.x * LENGTH, y: CENTER - point.y * LENGTH, depth: point.z };
  });
}

export function setupOrientationWidget(container: HTMLElement) {
  const lastRotation = new THREE.Quaternion(0, 0, 0, 0);
  const elements = new Map(AXES.map(({ axis }) => [axis, {
    line: container.querySelector<SVGLineElement>(`[data-orientation-line="${axis}"]`),
    button: container.querySelector<HTMLElement>(`[data-orientation-axis="${axis}"]`),
  }]));
  return {
    update(camera: THREE.Camera) {
      if (lastRotation.equals(camera.quaternion)) return;
      lastRotation.copy(camera.quaternion);
      for (const { axis, x, y, depth } of projectOrientationAxes(camera.quaternion)) {
        const { line, button } = elements.get(axis)!;
        if (!line || !button) continue;
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(y));
        line.style.opacity = depth < -0.01 ? '0.5' : '1';
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.style.zIndex = String(2 + Math.round((depth + 1) * 10));
        button.classList.toggle('axis-behind', depth < -0.01);
      }
    },
  };
}
