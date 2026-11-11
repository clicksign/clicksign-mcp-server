#!/usr/bin/env node
// Checks that a skill does not recommend or show example calls to the legacy Clicksign API
// 1.9 (`/api/v1`, `/api/v2`, `/v1.0/`), and does not use its request/response shape
// (`access_token` in a query string, or fields such as `request_signature_key`, `signer_key`,
// `list_key`, `sign_as`, `auths`, `secret_hmac_sha256`).
//
// Three allowance levels, by skill directory name:
//   full              every pattern is allowed anywhere (the skill's whole purpose is 1.9).
//   recognition-only  a pattern is allowed in prose or inline code, to recognize existing 1.9
//                      code and redirect elsewhere, but never inside a fenced code block,
//                      which would read as an example to call.
//   (default) none    no pattern is allowed anywhere.
//
// Usage: node scripts/check-api-3-only.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The migration skill's entire purpose is reading and porting 1.9 code: every page cites it.
export const FULL_EXEMPTION = new Set(['migrate-api-v1-to-v3']);
// May recognize and redirect away from existing 1.9 code in prose or inline code, but must
// never show a legacy call as a fenced example, the same bar every other skill meets fully.
export const RECOGNITION_ONLY = new Set(['start-clicksign-integration']);

const PATTERNS = [
  [/\/api\/v1\b/, '/api/v1'],
  [/\/api\/v2\b/, '/api/v2'],
  [/\/v1\.0\//, '/v1.0/'],
  [/\baccess_token=/, 'access_token= (query string)'],
  [/\brequest_signature_key\b/, 'request_signature_key'],
  [/\bsigner_key\b/, 'signer_key'],
  [/\blist_key\b/, 'list_key'],
  [/\bsign_as\b/, 'sign_as'],
  [/\bsecret_hmac_sha256\b/, 'secret_hmac_sha256'],
  [/\bauths\b/, 'auths'],
];

const FENCED_CODE_BLOCK = /```[^\n]*\n[\s\S]*?```/g;

/** [start, end) byte ranges of every fenced code block in a Markdown text. */
function codeBlockRanges(text) {
  const ranges = [];
  for (const match of text.matchAll(FENCED_CODE_BLOCK)) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function insideAny(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

/** Legacy-pattern violations across every skill in `root`, respecting each skill's allowance level. */
export function findViolations(root) {
  const violations = [];
  const skillsDir = join(root, 'skills');
  if (!existsSync(skillsDir)) return violations;

  for (const name of readdirSync(skillsDir)) {
    const dir = join(skillsDir, name);
    if (!statSync(dir).isDirectory()) continue;
    if (FULL_EXEMPTION.has(name)) continue;
    const recognitionOnly = RECOGNITION_ONLY.has(name);

    for (const file of walk(dir)) {
      const text = readFileSync(file, 'utf8');
      const ranges = recognitionOnly ? codeBlockRanges(text) : [];
      for (const [pattern, label] of PATTERNS) {
        const re = new RegExp(pattern.source, 'gi');
        for (const match of text.matchAll(re)) {
          if (recognitionOnly && !insideAny(match.index, ranges)) continue; // allowed: prose/inline recognition
          const line = text.slice(0, match.index).split('\n').length;
          violations.push(`${file}:${line}: found "${label}"${recognitionOnly ? ' inside a fenced code block' : ''}`);
        }
      }
    }
  }
  return violations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..');
  const violations = findViolations(root);
  for (const line of violations) console.error(`✖ ${line}`);
  if (violations.length) {
    console.error(`\n✖ ${violations.length} legacy-api violation(s)`);
    process.exit(1);
  }
  console.log('✔ no skill recommends or shows an example call to the legacy API');
}
