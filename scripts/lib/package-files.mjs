import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Only these files reach the plugin ZIP submitted to OpenAI. Client manifests for
// Claude, Cursor and the Codex marketplace, docs and tooling stay out of it.
const ROOT_FILES = ['plugin.json', 'mcp.json'];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Relative POSIX paths of every file that goes into the ZIP, sorted. */
export function packageFiles(root) {
  const files = ROOT_FILES.filter((file) => existsSync(join(root, file)));

  const assets = join(root, 'assets');
  if (existsSync(assets)) files.push(...walk(assets).map((path) => relative(root, path)));

  // A skill is a skills/<name>/ directory with a SKILL.md; skills/README.md is not packaged.
  const skills = join(root, 'skills');
  if (existsSync(skills)) {
    for (const name of readdirSync(skills)) {
      const dir = join(skills, name);
      if (statSync(dir).isDirectory() && existsSync(join(dir, 'SKILL.md'))) {
        files.push(...walk(dir).map((path) => relative(root, path)));
      }
    }
  }

  return files.map((file) => file.split(sep).join('/')).sort();
}
