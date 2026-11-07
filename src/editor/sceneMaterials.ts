import * as THREE from 'three';
import { type SceneMaterialData, type SceneNodeType, type SceneSurfaceType } from './sceneTypes';
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const textureCache = new Map<string, THREE.CanvasTexture>();

function createSurfaceTexture(surface: SceneSurfaceType, seed: number) {
  if (surface === 'plain' || surface === 'glass' || surface === 'acrylic' || typeof document === 'undefined') return undefined;
  const key = `${surface}-${Math.abs(seed) % 12}`;
  const existing = textureCache.get(key);
  if (existing) return existing;
  const random = seededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  context.fillStyle = surface === 'rust'
    ? '#665b54'
    : surface === 'brick'
      ? '#b2a39b'
      : surface === 'concrete'
        ? '#b5b9ba'
        : '#969da0';
  context.fillRect(0, 0, 128, 128);
  for (let index = 0; index < 650; index += 1) {
    const tone = Math.round(65 + random() * 150);
    context.fillStyle = `rgba(${tone},${tone},${tone},${0.06 + random() * 0.16})`;
    const size = random() > 0.92 ? 3 : 1;
    context.fillRect(random() * 128, random() * 128, size, size);
  }
  if (surface === 'concrete') {
    context.strokeStyle = 'rgba(58,62,62,.24)';
    context.lineWidth = 0.55;
    for (let crack = 0; crack < 2; crack += 1) {
      let x = random() * 128;
      let y = -8;
      context.beginPath();
      context.moveTo(x, y);
      for (let point = 0; point < 7; point += 1) {
        x += (random() - 0.5) * 14;
        y += 20;
        context.lineTo(x, y);
      }
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}

export function createMaterial(data: SceneMaterialData, type?: SceneNodeType) {
  const opacity = THREE.MathUtils.clamp(data.opacity, 0, 1);
  const surface = data.surface ?? 'plain';
  const isPipe = type === 'pipe';
  const isGlassPipe = isPipe && surface === 'glass';
  const isMetalPipe = isPipe && surface === 'metal';
  const isAcrylicPanel = surface === 'acrylic';
  const isAluminumPart = type === 'aluminumExtrusion'
    || type === 'lBracket3030'
    || type === 'aluminumProfile3030'
    || type === 'lConnector3030'
    || type === 'u8CombinationProfile';
  if (isGlassPipe) {
    return new THREE.MeshPhysicalMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: Math.max(0, data.emissiveIntensity),
      opacity,
      transparent: true,
      depthWrite: false,
      roughness: 0.04,
      metalness: 0,
      transmission: 0.94,
      thickness: 0.006,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      attenuationColor: data.color,
      attenuationDistance: 0.35,
      side: THREE.DoubleSide,
    });
  }
  if (isAcrylicPanel) {
    return new THREE.MeshPhysicalMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: Math.max(0, data.emissiveIntensity),
      opacity,
      transparent: true,
      depthWrite: false,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.88,
      thickness: 0.01,
      ior: 1.49,
      clearcoat: 0.65,
      clearcoatRoughness: 0.1,
      attenuationColor: data.color,
      attenuationDistance: 0.8,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: data.color,
    map: isAluminumPart ? null : createSurfaceTexture(surface, data.textureSeed ?? 1) ?? null,
    emissive: data.color,
    emissiveIntensity: Math.max(0, data.emissiveIntensity),
    opacity,
    transparent: opacity < 1,
    depthWrite: opacity >= 1,
    roughness: isMetalPipe ? 0.23 : isAluminumPart ? 0.25 : surface === 'concrete' ? 0.98 : surface === 'rust' || surface === 'brick' ? 0.9 : surface === 'metal' ? 0.64 : 0.78,
    metalness: isMetalPipe ? 0.82 : isAluminumPart ? 0.78 : surface === 'rust' ? 0.18 : surface === 'metal' ? 0.3 : 0,
    flatShading: surface === 'concrete' || surface === 'brick',
    side: type === 'pipe' ? THREE.DoubleSide : THREE.FrontSide,
  });
}

