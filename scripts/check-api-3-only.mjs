#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownFilesIn, skillDirectories } from './lib/markdown-files.mjs';

export const SKILLS_ALLOWED_TO_FULLY_CITE_THE_LEGACY_API = new Set(['migrate-api-v1-to-v3']);
export const SKILLS_ALLOWED_TO_NAME_THE_LEGACY_API_ONLY_TO_REDIRECT_AWAY_FROM_IT = new Set([
  'start-clicksign-integration',
]);

const LEGACY_API_SIGNALS = [
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

function fencedCodeBlockRanges(text) {
  return [...text.matchAll(/```[^\n]*\n[\s\S]*?```/g)].map((match) => [match.index, match.index + match[0].length]);
}

function isWithinAnyRange(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function legacyApiSignalsInsideFencedCodeBlocks(text) {
  const fencedRanges = fencedCodeBlockRanges(text);
  return legacyApiSignalsIn(text).filter((signal) => isWithinAnyRange(signal.index, fencedRanges));
}

function legacyApiSignalsIn(text) {
  const findings = [];
  for (const [pattern, label] of LEGACY_API_SIGNALS) {
    for (const match of text.matchAll(new RegExp(pattern.source, 'gi'))) {
      findings.push({ label, index: match.index, line: lineNumberAt(text, match.index) });
    }
  }
  return findings;
}

export function findLegacyApiViolations(root) {
  const violations = [];
  for (const { name, dir } of skillDirectories(root)) {
    if (SKILLS_ALLOWED_TO_FULLY_CITE_THE_LEGACY_API.has(name)) continue;
    const mayNameItOnlyToRedirectAwayFromIt = SKILLS_ALLOWED_TO_NAME_THE_LEGACY_API_ONLY_TO_REDIRECT_AWAY_FROM_IT.has(
      name,
    );

    for (const file of markdownFilesIn(dir)) {
      const text = readFileSync(file, 'utf8');
      const signals = mayNameItOnlyToRedirectAwayFromIt
        ? legacyApiSignalsInsideFencedCodeBlocks(text)
        : legacyApiSignalsIn(text);
      const location = mayNameItOnlyToRedirectAwayFromIt ? ' inside a fenced code block' : '';
      for (const { label, line } of signals) violations.push(`${file}:${line}: found "${label}"${location}`);
    }
  }
  return violations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..');
  const violations = findLegacyApiViolations(root);
  for (const line of violations) console.error(`✖ ${line}`);
  if (violations.length) {
    console.error(`\n✖ ${violations.length} legacy-api violation(s)`);
    process.exit(1);
  }
  console.log('✔ no skill recommends or shows an example call to the legacy API');
}
