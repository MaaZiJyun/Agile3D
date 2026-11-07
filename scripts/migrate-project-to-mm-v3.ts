import { readProject, writeProject } from './projectFiles';

async function main() {
  await writeProject(await readProject());
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
