import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, it } from 'node:test';
import { skillFiles, skillUrls, urlsIn } from '../scripts/check-links.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('skillUrls', () => {
  const root = mkdtempSync(join(tmpdir(), 'clicksign-links-'));
  after(() => rmSync(root, { recursive: true, force: true }));

  it('collects unique documentation URLs from every skill file, without trailing punctuation', () => {
    const skill = join(root, 'skills', 'demo');
    mkdirSync(join(skill, 'references'), { recursive: true });
    writeFileSync(
      join(skill, 'SKILL.md'),
      'See [envelope](https://developers.clicksign.com/docs/envelope.md) and https://developers.clicksign.com/v1.0/llms.txt.\n' +
        'Legacy pages follow `https://developers.clicksign.com/v1.0/docs/<slug>.md`.\n',
    );
    writeFileSync(
      join(skill, 'references', 'map.md'),
      '| `POST /api/v1/documents` | https://developers.clicksign.com/docs/envelope.md |\nhttps://example.com/ignored\n',
    );
    writeFileSync(join(root, 'skills', 'README.md'), 'https://developers.clicksign.com/not-a-skill-file.md\n');

    assert.deepEqual(skillUrls(root), [
      'https://developers.clicksign.com/docs/envelope.md',
      'https://developers.clicksign.com/v1.0/llms.txt',
    ]);
  });
});

describe('references/sources.md', () => {
  // SKILL.md tells the assistant to use only the sources listed there.
  const skills = readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, 'skills', entry.name, 'references', 'sources.md')))
    .map((entry) => entry.name);

  for (const name of skills) {
    it(`lists every page cited by ${name}`, () => {
      const dir = join(ROOT, 'skills', name);
      const listed = new Set(urlsIn(readFileSync(join(dir, 'references', 'sources.md'), 'utf8')));
      const missing = skillFiles(ROOT)
        .filter((file) => file.startsWith(`${dir}/`))
        .flatMap((file) => urlsIn(readFileSync(file, 'utf8')).map((url) => ({ file: relative(ROOT, file), url })))
        .filter(({ url }) => !listed.has(url))
        .map(({ file, url }) => `${file}: ${url}`);
      assert.deepEqual([...new Set(missing)], []);
    });
  }
});
