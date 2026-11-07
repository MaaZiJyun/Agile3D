import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeSceneDocument } from '../src/editor/sceneValidation';
import type { SceneDocumentData } from '../src/editor/sceneTypes';

export const projectFile = resolve(process.argv[2] ?? 'data/room.json');

export async function readProject(): Promise<SceneDocumentData> {
  const input: unknown = JSON.parse(await readFile(projectFile, 'utf8'));
  const project = normalizeSceneDocument(input);
  if (!project) throw new Error(`Invalid project: ${projectFile}`);
  return project;
}

export async function writeProject(project: SceneDocumentData) {
  // Validate generated content before replacing the selected project file.
  if (!normalizeSceneDocument(project)) throw new Error('Generated project is invalid');
  project.updatedAt = new Date().toISOString();
  await writeFile(projectFile, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
}
