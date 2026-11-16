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

const ACTIONABLE_LEGACY_CALL =
  /\b(GET|POST|PATCH|PUT|DELETE)\s+`?((?:https?:\/\/[^\s`/]+)?\/(?:api\/v[12]\b|v1\.0\/)[^\s`]*)/gi;
const LEGACY_API_RECOGNITION_REGION =
  /<!--\s*legacy-api-recognition\s*-->[\s\S]*?<!--\s*\/legacy-api-recognition\s*-->/g;

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

function textWithRecognitionRegionsBlanked(text) {
  return text.replace(LEGACY_API_RECOGNITION_REGION, (region) => region.replace(/[^\n]/g, ' '));
}

function actionableLegacyCallsOutsideFencedBlocks(text) {
  const fencedRanges = fencedCodeBlockRanges(text);
  const visible = textWithRecognitionRegionsBlanked(text);
  return [...visible.matchAll(ACTIONABLE_LEGACY_CALL)]
    .filter((match) => !isWithinAnyRange(match.index, fencedRanges))
    .map((match) => ({
      label: `${match[1].toUpperCase()} ${match[2]}`,
      index: match.index,
      line: lineNumberAt(text, match.index),
    }));
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
      if (mayNameItOnlyToRedirectAwayFromIt) {
        for (const { label, line } of legacyApiSignalsInsideFencedCodeBlocks(text)) {
          violations.push(`${file}:${line}: found "${label}" inside a fenced code block`);
        }
        for (const { label, line } of actionableLegacyCallsOutsideFencedBlocks(text)) {
          violations.push(`${file}:${line}: found "${label}" outside a fenced code block`);
        }
        continue;
      }
      for (const { label, line } of legacyApiSignalsIn(text)) violations.push(`${file}:${line}: found "${label}"`);
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
