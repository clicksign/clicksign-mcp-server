import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, it } from 'node:test';
import { diffLock, parsePage, readLock, renderReport, trackedUrls } from '../scripts/check-docs-drift.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('parsePage', () => {
  it('reads updatedAt from the frontmatter and hashes only the body', () => {
    const v1 = parsePage('---\nupdatedAt: 2026-10-02T15:18:15.000Z\nagentTools:\n  projectIndex: x\n---\n\n# Guia\n\nTexto.\n');
    const v2 = parsePage('---\r\nupdatedAt: 2026-10-09T10:00:00.000Z\r\n---\r\n# Guia\r\n\r\nTexto.\r\n');
    assert.equal(v1.updatedAt, '2026-10-02T15:18:15.000Z');
    assert.equal(v2.updatedAt, '2026-10-09T10:00:00.000Z');
    assert.equal(v1.sha256, v2.sha256);
  });

  it('hashes pages without frontmatter, such as llms.txt', () => {
    const page = parsePage('# Clicksign\n\n- [Envelope](https://developers.clicksign.com/docs/envelope.md)\n');
    assert.equal(page.updatedAt, null);
    assert.match(page.sha256, /^[0-9a-f]{64}$/);
    assert.notEqual(page.sha256, parsePage('# Clicksign\n').sha256);
  });
});

describe('diffLock', () => {
  const page = (sha256, updatedAt = null) => ({ sha256, updatedAt });

  it('reports changed, added and removed pages, ignoring updatedAt-only changes', () => {
    const lock = { a: page('1', 'old'), b: page('2', 'old'), gone: page('3') };
    const current = { a: page('1', 'new'), b: page('9', 'new'), fresh: page('4') };
    assert.deepEqual(diffLock(lock, current), { changed: ['b'], added: ['fresh'], removed: ['gone'] });
  });

  it('renders a report with URLs and dates only', () => {
    const lock = { 'https://developers.clicksign.com/docs/envelope.md': page('1', '2026-10-01') };
    const current = { 'https://developers.clicksign.com/docs/envelope.md': page('2', '2026-10-10') };
    const report = renderReport(diffLock(lock, current), lock, current);
    assert.match(report, /\| https:\/\/developers\.clicksign\.com\/docs\/envelope\.md \| 2026-10-01 \| 2026-10-10 \|/);
    assert.match(report, /npm run docs:lock/);
  });
});

describe('trackedUrls', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'clicksign-drift-'));
  after(() => rmSync(tmp, { recursive: true, force: true }));

  it('keeps Markdown pages and indexes, dropping prose patterns', () => {
    mkdirSync(join(tmp, 'skills', 'demo'), { recursive: true });
    writeFileSync(
      join(tmp, 'skills', 'demo', 'SKILL.md'),
      'https://developers.clicksign.com/docs/envelope.md https://developers.clicksign.com/llms.txt `https://developers.clicksign.com/v1.0/docs/<slug>.md`\n',
    );
    assert.deepEqual(trackedUrls(tmp), [
      'https://developers.clicksign.com/docs/envelope.md',
      'https://developers.clicksign.com/llms.txt',
    ]);
  });
});

describe('docs-sources.lock.json', () => {
  it('records exactly the pages cited by the skills (run npm run docs:lock after changing citations)', () => {
    assert.deepEqual(Object.keys(readLock(root)).sort(), trackedUrls(root));
  });
});
