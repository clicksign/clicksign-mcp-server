import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { skillUrls } from '../scripts/check-links.mjs';

describe('skillUrls', () => {
  const root = mkdtempSync(join(tmpdir(), 'clicksign-links-'));
  after(() => rmSync(root, { recursive: true, force: true }));

  it('collects unique documentation URLs from every skill file, without trailing punctuation', () => {
    const skill = join(root, 'skills', 'demo');
    mkdirSync(join(skill, 'references'), { recursive: true });
    writeFileSync(
      join(skill, 'SKILL.md'),
      'See [envelope](https://developers.clicksign.com/docs/envelope.md) and https://developers.clicksign.com/v1.0/llms.txt.\n',
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
