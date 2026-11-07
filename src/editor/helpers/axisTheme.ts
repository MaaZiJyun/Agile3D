import * as THREE from 'three';

// app/theme.css owns the palette; both DOM and WebGL controls read these tokens.
export function readAxisColors(style: Pick<CSSStyleDeclaration, 'getPropertyValue'> = getComputedStyle(document.documentElement)) {
  const read = (token: string) => {
    const value = style.getPropertyValue(token).trim();
    if (!value) throw new Error(`Missing axis theme token: ${token}`);
    return new THREE.Color(value);
  };
  return { x: read('--axis-x'), y: read('--axis-y'), z: read('--axis-z'), active: read('--axis-active') };
}

// AxesHelper accepts the first three colors; TransformControls also uses active.
export function applyAxisColors(control: { setColors: (x: THREE.Color, y: THREE.Color, z: THREE.Color, active: THREE.Color) => void }, colors: ReturnType<typeof readAxisColors>) {
  control.setColors(colors.x, colors.y, colors.z, colors.active);
}
