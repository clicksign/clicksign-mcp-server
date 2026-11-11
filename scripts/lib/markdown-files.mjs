import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function markdownFilesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? markdownFilesIn(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

export function skillDirectories(root) {
  const skillsRoot = join(root, 'skills');
  if (!existsSync(skillsRoot)) return [];
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, dir: join(skillsRoot, entry.name) }));
}

export function skillSourcesFile(skillDir) {
  return join(skillDir, 'references', 'sources.md');
}
