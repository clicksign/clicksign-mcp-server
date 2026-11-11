#!/usr/bin/env node
// Checks that every API 3.0 endpoint a skill cites (METHOD + path, in a fenced example or
// inline code) is a real, documented operation on one of the `/reference/*.md` pages that
// same skill already lists in its own references/sources.md. A skill cannot pass this check
// by citing an endpoint nowhere in its own sources.
//
// Legacy-API mentions (`/api/v1`, `/api/v2`, `/v1.0/`) are out of scope here; see
// check-api-3-only.mjs for that rule.
//
// Usage: node scripts/check-endpoints.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { urlsIn } from './check-links.mjs';

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
const LEGACY = /\/api\/v1\b|\/api\/v2\b|\/v1\.0\//;
// A mentioned path only gets checked when its first segment is a known v3 resource; this
// keeps the check from tripping on an unrelated "METHOD /something" in prose (for example a
// customer's own webhook endpoint URL inside a JSON example body).
const TOP_LEVEL_RESOURCES = new Set([
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

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

/** Strips `{{BASE_URL}}` and `/api/v3`, drops a query string and trailing punctuation, and
 * collapses every `{param}` or `{{param}}` segment to a single `{}` placeholder. */
export function normalizePath(raw) {
  let path = raw.replace(/^\{\{BASE_URL\}\}/, '');
  path = path.replace(/^\/api\/v3/, '');
  path = path.split('?')[0];
  path = path.replace(/[.,;:)\]]+$/, '');
  path = path.replace(/\{\{?[a-zA-Z_]+\}\}?/g, '{}');
  return path;
}

/** METHOD + normalized-path operations a Markdown text mentions, excluding legacy-API paths.
 * A `METHOD .../suffix` shorthand (used when the full path was already given a few lines
 * above) yields `{ method, suffix }` instead of `{ method, path }`; see `matches`. */
export function mentionedOperations(text) {
  const ops = [];
  const re = new RegExp(`\\b(${METHODS.join('|')})\\s+([^\\s\`]*\\/[^\\s\`]*)`, 'g');
  for (const match of text.matchAll(re)) {
    const [, method, rawPath] = match;
    if (LEGACY.test(rawPath)) continue;
    if (rawPath.startsWith('...')) {
      ops.push({ method, suffix: normalizePath(rawPath.slice(3)) });
      continue;
    }
    const firstSegment = rawPath
      .replace(/^\{\{BASE_URL\}\}/, '')
      .replace(/^\/api\/v3/, '')
      .split('/')
      .filter(Boolean)[0];
    if (!firstSegment || !TOP_LEVEL_RESOURCES.has(firstSegment)) continue;
    ops.push({ method, path: normalizePath(rawPath) });
  }
  return ops;
}

/** METHOD + normalized-path operations declared in a page's embedded OpenAPI `paths` object.
 * A reference page with no OpenAPI block (an index or overview page) yields no operations. */
export function operationsFromOpenApi(markdown) {
  const match = markdown.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return [];
  let spec;
  try {
    spec = JSON.parse(match[1]);
  } catch {
    return [];
  }
  const ops = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(methods ?? {})) {
      if (METHODS.includes(method.toUpperCase())) ops.push({ method: method.toUpperCase(), path: normalizePath(path) });
    }
  }
  return ops;
}

/** Whether a mentioned operation matches one of the known `METHOD path` strings: an exact
 * match for a full path, or a same-method, segment-aligned suffix match for a `...` shorthand. */
export function matches(op, known) {
  if (op.path !== undefined) return known.has(`${op.method} ${op.path}`);
  for (const key of known) {
    const spaceAt = key.indexOf(' ');
    const method = key.slice(0, spaceAt);
    const path = key.slice(spaceAt + 1);
    if (method === op.method && (path === op.suffix || path.endsWith(op.suffix))) return true;
  }
  return false;
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (response.status !== 200) throw new Error(String(response.status));
  return response.text();
}

async function knownOperations(referenceUrls) {
  const known = new Set();
  const errors = [];
  for (let i = 0; i < referenceUrls.length; i += CONCURRENCY) {
    const batch = referenceUrls.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(fetchText));
    results.forEach((result, j) => {
      if (result.status === 'fulfilled') {
        for (const op of operationsFromOpenApi(result.value)) known.add(`${op.method} ${op.path}`);
      } else {
        errors.push(`${result.reason.message}  ${batch[j]}`);
      }
    });
  }
  return { known, errors };
}

/** Skill directory names under `root/skills` that have a references/sources.md. */
export function skillsWithSources(root) {
  const skillsDir = join(root, 'skills');
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir).filter((name) => {
    const dir = join(skillsDir, name);
    return statSync(dir).isDirectory() && existsSync(join(dir, 'references', 'sources.md'));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..');
  const violations = [];
  const fetchErrors = [];

  for (const name of skillsWithSources(root)) {
    const dir = join(root, 'skills', name);
    const sourcesText = readFileSync(join(dir, 'references', 'sources.md'), 'utf8');
    const referenceUrls = [...new Set(urlsIn(sourcesText))].filter((url) => url.includes('/reference/'));
    const { known, errors } = await knownOperations(referenceUrls);
    for (const err of errors) fetchErrors.push(`${name}: ${err}`);

    for (const file of walk(dir)) {
      const text = readFileSync(file, 'utf8');
      for (const op of mentionedOperations(text)) {
        if (!matches(op, known)) {
          const shown = op.path ?? `...${op.suffix}`;
          violations.push(`${file}: ${op.method} ${shown} is not a documented operation on a page ${name} cites`);
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
