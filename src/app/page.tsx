'use client';

import { useEffect, useRef } from 'react';
import { EditorMenu } from '../components/EditorMenu';
import { EditorPanels } from '../components/EditorPanels';
import { OrientationWidget } from '../components/OrientationWidget';
import initModeler from '../main';

export default function Home() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const cleanupScene = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return undefined;
    cleanupScene.current = initModeler(sceneRef.current);
    return () => {
      cleanupScene.current?.();
      cleanupScene.current = null;
    };
  }, []);

  return (
    <main id="app">
      <div id="scene" ref={sceneRef} />

      <EditorMenu />

      <input id="projectJsonInput" type="file" accept="application/json,.json" hidden />

      <EditorPanels />

      <OrientationWidget />

    </main>
  );
}
