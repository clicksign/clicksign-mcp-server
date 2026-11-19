#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { urlsIn } from './check-links.mjs';
import { markdownFilesIn, skillDirectories, skillSourcesFile } from './lib/markdown-files.mjs';

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const HTTP_VERBS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
const LEGACY_API_PATH = /\/api\/v1\b|\/api\/v2\b|\/v1\.0\//;
const SHORTHAND_PATH_PREFIX = '...';
const KNOWN_V3_TOP_LEVEL_RESOURCES = new Set([
  'envelopes',
  'webhooks',
  'templates',
  'folders',
  'documents',
  'signers',
  'requirements',
  'notifications',
  'events',
  'bulk_requirements',
  'auto_signature',
  'acceptance_term',
]);

const API_ORIGIN = String.raw`(?:\{\{BASE_URL\}\}|https://(?:sandbox|app)\.clicksign\.com)`;

function withoutApiOrigin(path) {
  return path.replace(new RegExp(`^${API_ORIGIN}`), '');
}

function withoutApiV3Prefix(path) {
  return path.replace(/^\/api\/v3/, '');
}

function withoutQueryString(path) {
  return path.split('?')[0];
}

function withoutTrailingPunctuation(path) {
  return path.replace(/[.,;:)\]]+$/, '');
}

function withParamsAsPlaceholders(path) {
  return path.replace(/\{\{?[a-zA-Z_]+\}\}?/g, '{}');
}

export function normalizePath(rawPath) {
  const path = withoutApiV3Prefix(withoutApiOrigin(rawPath));
  return withParamsAsPlaceholders(withoutTrailingPunctuation(withoutQueryString(path)));
}

function firstPathSegment(path) {
  return normalizePath(path).split('/').filter(Boolean)[0];
}

function isKnownV3Resource(path) {
  const segment = firstPathSegment(path);
  return segment !== undefined && KNOWN_V3_TOP_LEVEL_RESOURCES.has(segment);
}

function isShorthandPath(path) {
  return path.startsWith(SHORTHAND_PATH_PREFIX);
}

function isExplicitV3Path(path) {
  const withoutOrigin = withoutApiOrigin(path);
  return withoutOrigin === '/api/v3' || withoutOrigin.startsWith('/api/v3/');
}

function operationFromMention(method, path) {
  if (LEGACY_API_PATH.test(path)) return null;
  if (isShorthandPath(path)) {
    return { method, suffix: normalizePath(path.slice(SHORTHAND_PATH_PREFIX.length)) };
  }
  if (isKnownV3Resource(path) || isExplicitV3Path(path)) return { method, path: normalizePath(path) };
  return null;
}

function verbsSharing(groupText, path) {
  const head = groupText.slice(0, groupText.lastIndexOf(path));
  return [...head.matchAll(new RegExp(`\\b(${HTTP_VERBS.join('|')})\\b`, 'gi'))].map((match) => match[1].toUpperCase());
}

function groupedVerbPattern() {
  const verbToken = `\`?\\b(?:${HTTP_VERBS.join('|')})\\b\`?`;
  return new RegExp(`${verbToken}(?:\\s*(?:,|and)\\s*${verbToken})+\\s+(\`?)([^\\s\`]*/[^\\s\`]*)\\1`, 'gi');
}

export function mentionedOperations(text) {
  const operations = [];
  const rangesCoveredByAGroup = [];
  for (const match of text.matchAll(groupedVerbPattern())) {
    const path = match[2];
    const start = match.index;
    rangesCoveredByAGroup.push([start, start + match[0].length]);
    for (const method of verbsSharing(match[0], path)) {
      const operation = operationFromMention(method, path);
      if (operation) operations.push(operation);
    }
  }

  const singleVerbAndPath = new RegExp(`\\b(${HTTP_VERBS.join('|')})\\s+([^\\s\`]*\\/[^\\s\`]*)`, 'g');
  for (const match of text.matchAll(singleVerbAndPath)) {
    const insideAGroup = rangesCoveredByAGroup.some(([start, end]) => match.index >= start && match.index < end);
    if (insideAGroup) continue;
    const operation = operationFromMention(match[1], match[2]);
    if (operation) operations.push(operation);
  }
  return operations;
}

function embeddedJsonBlockOf(markdown) {
  return markdown.match(/```json\n([\s\S]*?)\n```/)?.[1];
}

function parsedAsJsonOrNull(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function operationsFromOpenApi(markdown) {
  const openApiSpec = parsedAsJsonOrNull(embeddedJsonBlockOf(markdown) ?? '');
  if (!openApiSpec) return [];
  const operations = [];
  for (const [path, methodsByVerb] of Object.entries(openApiSpec.paths ?? {})) {
    for (const verb of Object.keys(methodsByVerb ?? {}).map((verb) => verb.toUpperCase())) {
      if (HTTP_VERBS.includes(verb)) operations.push({ method: verb, path: normalizePath(path) });
    }
  }
  return operations;
}

function operationKey(method, path) {
  return `${method} ${path}`;
}

function splitOperationKey(key) {
  const separatorIndex = key.indexOf(' ');
  return [key.slice(0, separatorIndex), key.slice(separatorIndex + 1)];
}

export function matches(mentionedOperation, knownOperationKeys) {
  if (mentionedOperation.path !== undefined) {
    return knownOperationKeys.has(operationKey(mentionedOperation.method, mentionedOperation.path));
  }
  return [...knownOperationKeys].some((key) => {
    const [method, path] = splitOperationKey(key);
    return method === mentionedOperation.method && path.endsWith(mentionedOperation.suffix);
  });
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (response.status !== 200) throw new Error(String(response.status));
  return response.text();
}

async function knownOperationKeysFrom(referenceUrls) {
  const knownOperationKeys = new Set();
  const fetchErrors = [];
  for (let i = 0; i < referenceUrls.length; i += CONCURRENCY) {
    const batch = referenceUrls.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(fetchText));
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        for (const op of operationsFromOpenApi(result.value)) knownOperationKeys.add(operationKey(op.method, op.path));
      } else {
        fetchErrors.push(`${result.reason.message}  ${batch[index]}`);
      }
    });
  }
  return { knownOperationKeys, fetchErrors };
}

function referenceUrlsCitedBy(skillDir) {
  const sourcesFile = skillSourcesFile(skillDir);
  if (!existsSync(sourcesFile)) return [];
  const sourcesText = readFileSync(sourcesFile, 'utf8');
  return [...new Set(urlsIn(sourcesText))].filter((url) => url.includes('/reference/'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..');
  const violations = [];
  const fetchErrors = [];

  for (const { name, dir } of skillDirectories(root)) {
    if (!existsSync(skillSourcesFile(dir))) continue;

    const { knownOperationKeys, fetchErrors: skillFetchErrors } = await knownOperationKeysFrom(
      referenceUrlsCitedBy(dir),
    );
    fetchErrors.push(...skillFetchErrors.map((error) => `${name}: ${error}`));

    for (const file of markdownFilesIn(dir)) {
      const text = readFileSync(file, 'utf8');
      for (const operation of mentionedOperations(text)) {
        if (!matches(operation, knownOperationKeys)) {
          const shown = operation.path ?? `...${operation.suffix}`;
          violations.push(`${file}: ${operation.method} ${shown} is not a documented operation on a page ${name} cites`);
        }
      }
    }
  }

  if (fetchErrors.length) {
    for (const line of fetchErrors) console.error(`✖ ${line}`);
    console.error(`\n✖ could not fetch ${fetchErrors.length} reference page(s)`);
    process.exit(1);
  }
  for (const line of violations) console.error(`✖ ${line}`);
  if (violations.length) {
    console.error(`\n✖ ${violations.length} endpoint(s) are not documented on a page their skill cites`);
    process.exit(1);
  }
  console.log('✔ every cited endpoint matches a documented operation on a page its skill cites');
}
