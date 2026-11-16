import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { findLegacyApiViolations } from '../scripts/check-api-3-only.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'node_modules', 'dist', '.docs-cache']);

let copies = [];

function copyRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'clicksign-api3-'));
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !SKIP.has(basename(src)) });
  copies.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of copies) rmSync(dir, { recursive: true, force: true });
  copies = [];
});

describe('findLegacyApiViolations', () => {
  it('passes the repository as committed', () => {
    assert.deepEqual(findLegacyApiViolations(ROOT), []);
  });

  it('flags a brand-new skill that recommends a legacy call in prose', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'demo-skill');
    mkdirSync(skill, { recursive: true });
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: demo-skill\ndescription: Demo.\n---\n\nCall POST /api/v1/documents to send a document.\n',
    );
    const violations = findLegacyApiViolations(dir);
    assert.ok(violations.some((v) => v.includes('demo-skill/SKILL.md') && v.includes('/api/v1')));
  });

  it('flags a brand-new skill that uses a legacy field name', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'demo-skill');
    mkdirSync(skill, { recursive: true });
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: demo-skill\ndescription: Demo.\n---\n\nStore the `request_signature_key` and notify with it.\n',
    );
    assert.ok(findLegacyApiViolations(dir).some((v) => v.includes('request_signature_key')));
  });

  it('does not flag the migration skill, which is fully exempt', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'migrate-api-v1-to-v3');
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: migrate-api-v1-to-v3\ndescription: Demo.\n---\n\n```http\nPOST /api/v1/documents\n```\n',
    );
    assert.deepEqual(findLegacyApiViolations(dir), []);
  });

  it('lets a recognition-only skill mention a legacy pattern in prose', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'start-clicksign-integration');
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: start-clicksign-integration\ndescription: Demo.\n---\n\n' +
        'Stop when the code already calls `/api/v1` or uses `sign_as`; point to the migration skill.\n',
    );
    assert.deepEqual(findLegacyApiViolations(dir), []);
  });

  it('flags a recognition-only skill that recommends a legacy call in prose', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'start-clicksign-integration');
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: start-clicksign-integration\ndescription: Demo.\n---\n\n' +
        'Call POST /api/v1/documents to send a document.\n',
    );
    const violations = findLegacyApiViolations(dir);
    assert.ok(violations.some((v) => v.includes('SKILL.md') && v.includes('POST /api/v1/documents')));
    assert.ok(violations.some((v) => v.includes('outside a fenced code block')));
  });

  it('flags an inline-code legacy call outside a fenced block', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'start-clicksign-integration');
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: start-clicksign-integration\ndescription: Demo.\n---\n\n' +
        'Send it with `POST /api/v1/documents`.\n',
    );
    assert.ok(findLegacyApiViolations(dir).some((v) => v.includes('POST /api/v1/documents')));
  });

  it('lets a marked recognition region name the legacy call it is there to recognize', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'start-clicksign-integration');
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: start-clicksign-integration\ndescription: Demo.\n---\n\n' +
        '<!-- legacy-api-recognition -->\n' +
        'Recognize `POST https://app.clicksign.com/api/v1/documents` and point to the migration skill.\n' +
        '<!-- /legacy-api-recognition -->\n',
    );
    assert.deepEqual(findLegacyApiViolations(dir), []);
  });

  it('still flags a recognition-only skill that shows a legacy call as a fenced example', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'start-clicksign-integration');
    writeFileSync(
      join(skill, 'SKILL.md'),
      '---\nname: start-clicksign-integration\ndescription: Demo.\n---\n\n' +
        '```http\nPOST /api/v1/documents?access_token={{TOKEN}}\n```\n',
    );
    const violations = findLegacyApiViolations(dir);
    assert.ok(violations.some((v) => v.includes('/api/v1') && v.includes('fenced code block')));
    assert.ok(violations.some((v) => v.includes('access_token')));
  });
});
