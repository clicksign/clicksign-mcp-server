#!/usr/bin/env node
// Builds dist/clicksign-<version>.zip, the file uploaded at https://platform.openai.com/plugins.
// Usage: node scripts/package.mjs [--release] [--dev]
import { createHash } from 'node:crypto';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { finished } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import yazl from 'yazl';
import { packageFiles } from './lib/package-files.mjs';
import { validate } from './validate.mjs';

// Fixed metadata so the same commit always produces a byte-identical ZIP. ZIP stores
// local time, so the date is built in local time and the UTC extra field is left out:
// the archive is identical whatever the machine's timezone.
const MTIME = new Date(2000, 0, 1);
const MODE = 0o100644;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const release = process.argv.includes('--release');
const dev = process.argv.includes('--dev');

if (dev && release) {
  console.error('✖ --dev creates a development ZIP and cannot be combined with --release');
  process.exit(1);
}

const { errors, warnings } = validate(root, { release });
for (const warning of warnings) console.warn(`warning  ${warning}`);
for (const err of errors) console.error(`error    ${err}`);
if (errors.length) {
  console.error(`\n✖ not packaged: validation failed (${release ? 'release' : 'draft'}) with ${errors.length} error(s)`);
  process.exit(1);
}

const plugin = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8'));
const { version } = plugin;
const name = dev ? `${plugin.name}-dev` : plugin.name;
const files = packageFiles(root);
const output = join(root, 'dist', `${name}-${version}.zip`);
mkdirSync(dirname(output), { recursive: true });

const zip = new yazl.ZipFile();
for (const file of files) {
  const contents = dev && file === 'plugin.json'
    ? Buffer.from(`${JSON.stringify({ ...plugin, name }, null, 2)}\n`)
    : readFileSync(join(root, file));
  zip.addBuffer(contents, file, { mtime: MTIME, mode: MODE, compress: true, forceDosTimestamp: true });
}
zip.end();
await finished(zip.outputStream.pipe(createWriteStream(output)));

const sha256 = createHash('sha256').update(readFileSync(output)).digest('hex');
console.log(`\n${warnings.length ? '⚠' : '✔'} packaged ${output.slice(root.length + 1)} (${dev ? 'development' : release ? 'release' : 'draft'}, ${warnings.length} warning(s))`);
for (const file of files) console.log(`  ${file}`);
console.log(`sha256 ${sha256}`);
