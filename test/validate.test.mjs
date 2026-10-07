import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { validate } from '../scripts/validate.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'node_modules', 'dist']);

let copies = [];

function copyRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'clicksign-plugin-'));
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !SKIP.has(basename(src)) });
  copies.push(dir);
  return dir;
}

function editJson(dir, file, change) {
  const path = join(dir, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  change(data);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

const openai = (data) => data.extensions['com.openai'];

// Minimal valid PNG of the given size; only the header matters to the size check.
function png(width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    return Buffer.concat([length, Buffer.from(type), data, Buffer.alloc(4)]);
  };
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.alloc(1))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function assertError(result, pattern) {
  assert.ok(
    result.errors.some((message) => pattern.test(message)),
    `expected an error matching ${pattern}, got:\n${result.errors.join('\n') || '(no errors)'}`,
  );
}

afterEach(() => {
  for (const dir of copies) rmSync(dir, { recursive: true, force: true });
  copies = [];
});

describe('validate', () => {
  it('passes the repository with placeholder warnings only', () => {
    const result = validate(ROOT);
    assert.deepEqual(result.errors, []);
    assert.ok(result.warnings.some((message) => /placeholder/.test(message)));
  });

  it('turns placeholders into errors with --release', () => {
    const result = validate(ROOT, { release: true });
    assert.deepEqual(result.warnings, []);
    assertError(result, /supportURL.*placeholder|placeholder at .*supportURL/);
    assertError(result, /logo is still a placeholder image/);
  });

  it('rejects a displayName longer than 30 characters', () => {
    const dir = copyRepo();
    editJson(dir, 'plugin.json', (data) => (openai(data).interface.displayName = 'C'.repeat(31)));
    assertError(validate(dir), /displayName has 31 characters \(max 30\)/);
  });

  it('rejects any MCP URL other than the OAuth endpoint', () => {
    const dir = copyRepo();
    editJson(dir, 'mcp.json', (data) => (data.mcpServers.clicksign.url = 'https://mcp.clicksign.com/mcp/other'));
    assertError(validate(dir), /mcp\.json: mcpServers\.clicksign\.url must be https:\/\/mcp\.clicksign\.com\/mcp\/oauth2/);
  });

  it('rejects a logo that is not square', () => {
    const dir = copyRepo();
    writeFileSync(join(dir, 'assets', 'logo.png'), png(512, 256));
    assertError(validate(dir), /interface\.logo must be square, found 512x256/);
  });

  it('requires exactly five positive test cases', () => {
    const dir = copyRepo();
    editJson(dir, 'plugin.json', (data) => openai(data).review.test_cases.positive.pop());
    assertError(validate(dir), /positive must have exactly 5 cases \(found 4\)/);
  });

  it('rejects a client_secret in a manifest', () => {
    const dir = copyRepo();
    editJson(dir, '.cursor-plugin/plugin.json', (data) => (data.client_secret = 'abc123'));
    assertError(validate(dir), /\.cursor-plugin\/plugin\.json: looks like it contains a secret \(client_secret\)/);
  });

  it('detects version drift in the Claude manifest', () => {
    const dir = copyRepo();
    editJson(dir, '.claude-plugin/plugin.json', (data) => (data.version = '1.0.1'));
    assertError(validate(dir), /\.claude-plugin\/plugin\.json: version is "1\.0\.1", expected "1\.0\.0"/);
  });

  it('rejects a second MCP server', () => {
    const dir = copyRepo();
    editJson(dir, 'mcp.json', (data) => (data.mcpServers.other = { type: 'streamable-http', url: 'https://example.com/mcp' }));
    assertError(validate(dir), /mcp\.json: must declare exactly one MCP server \(found 2\)/);
  });

  it('rejects app references', () => {
    const dir = copyRepo();
    writeFileSync(join(dir, '.app.json'), '{"apps":{}}');
    assertError(validate(dir), /\.app\.json: is not allowed/);
  });

  it('rejects reviewer credentials in the package', () => {
    const dir = copyRepo();
    editJson(dir, 'plugin.json', (data) => (openai(data).review.test_credentials = 'user / pass'));
    assertError(validate(dir), /review\.test_credentials is rejected by OpenAI/);
  });

  it('validates skill frontmatter', () => {
    const dir = copyRepo();
    const skill = join(dir, 'skills', 'send-envelope');
    mkdirSync(skill);
    writeFileSync(join(skill, 'SKILL.md'), '---\nname: other-name\ndescription: Sends an envelope.\n---\n\nBody\n');
    assertError(validate(dir), /skills\/send-envelope\/SKILL\.md: frontmatter name must be "send-envelope"/);
  });
});
