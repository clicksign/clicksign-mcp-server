#!/usr/bin/env node
// Detects changes in the official documentation pages cited by skills, by comparing each
// page with the snapshot in scripts/docs-sources.lock.json. Run weekly by docs-drift.yml.
// Usage:
//   node scripts/check-docs-drift.mjs [--report <file>]   exit 0 unchanged, 2 changed, 1 fetch error
//   node scripts/check-docs-drift.mjs --update            rewrite the lock after reviewing the skill
//   node scripts/check-docs-drift.mjs --add               record only a new skill's first citations
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skillUrls } from './check-links.mjs';

export const LOCK_PATH = join('scripts', 'docs-sources.lock.json');
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

/** Cited URLs that are Markdown pages or indexes; other matches are prose patterns, not pages. */
export function trackedUrls(root) {
  return skillUrls(root).filter((url) => url.endsWith('.md') || url.endsWith('.txt'));
}

/** Splits a ReadMe Markdown page into its updatedAt and the sha256 of the body without frontmatter. */
export function parsePage(markdown) {
  const text = markdown.replace(/\r\n/g, '\n');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const updatedAt = frontmatter?.[1].match(/^updatedAt:\s*(\S+)/m)?.[1] ?? null;
  const body = frontmatter ? text.slice(frontmatter[0].length) : text;
  return { updatedAt, sha256: createHash('sha256').update(body.trim()).digest('hex') };
}

/** Compares the lock with the current snapshot. Pages only count as changed when the body hash differs. */
export function diffLock(lock, current) {
  const changed = [];
  const added = [];
  const removed = [];
  for (const [url, page] of Object.entries(current)) {
    if (!lock[url]) added.push(url);
    else if (lock[url].sha256 !== page.sha256) changed.push(url);
  }
  for (const url of Object.keys(lock)) if (!current[url]) removed.push(url);
  return { changed: changed.sort(), added: added.sort(), removed: removed.sort() };
}

export function readLock(root) {
  const path = join(root, LOCK_PATH);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

export function urlsNotYetInLock(lock, urls) {
  return urls.filter((url) => !lock[url]);
}

export function withNewUrlsAdded(lock, newUrls) {
  return { ...newUrls, ...lock };
}

/** Markdown body for the docs-drift issue. Lists URLs and dates only, never page content. */
export function renderReport(diff, lock, current) {
  const lines = ['The official documentation cited by the skills changed since the last review.', ''];
  if (diff.changed.length) {
    lines.push('## Changed pages', '', '| Page | Reviewed version | Current version |', '|---|---|---|');
    for (const url of diff.changed) {
      lines.push(`| ${url} | ${lock[url].updatedAt ?? '-'} | ${current[url].updatedAt ?? '-'} |`);
    }
    lines.push('');
  }
  if (diff.added.length) lines.push('## Cited but not in the lock', '', ...diff.added.map((url) => `- ${url}`), '');
  if (diff.removed.length) lines.push('## In the lock but no longer cited', '', ...diff.removed.map((url) => `- ${url}`), '');
  lines.push(
    '## How to resolve',
    '',
    '1. Read each changed page and update the skill files that cite it, if the change affects them.',
    '2. Run `npm run docs:lock` to record the reviewed versions.',
    '3. Open a pull request with the skill changes and `scripts/docs-sources.lock.json`.',
    '',
    'This issue is updated by the `docs-drift` workflow and can be closed once the pull request is merged.',
  );
  return `${lines.join('\n')}\n`;
}

async function fetchPage(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (response.status !== 200) throw new Error(String(response.status));
  return parsePage(await response.text());
}

async function snapshot(urls) {
  const current = {};
  const errors = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(fetchPage));
    results.forEach((result, j) => {
      if (result.status === 'fulfilled') current[batch[j]] = result.value;
      else errors.push(`${result.reason.message}  ${batch[j]}`);
    });
  }
  return { current, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  const reportIndex = args.indexOf('--report');
  const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : null;

  const urls = trackedUrls(root);
  const lock = readLock(root);

  if (args.includes('--add')) {
    const newUrls = urlsNotYetInLock(lock, urls);
    if (!newUrls.length) {
      console.log(`✔ ${urls.length} page(s) already in ${LOCK_PATH}; nothing to add`);
      process.exit(0);
    }
    const { current: newPages, errors: fetchErrors } = await snapshot(newUrls);
    if (fetchErrors.length) {
      for (const line of fetchErrors) console.error(`✖ ${line}`);
      console.error(`\n✖ could not fetch ${fetchErrors.length} of ${newUrls.length} new page(s)`);
      process.exit(1);
    }
    const updatedLock = withNewUrlsAdded(lock, newPages);
    const sorted = Object.fromEntries(Object.keys(updatedLock).sort().map((url) => [url, updatedLock[url]]));
    writeFileSync(join(root, LOCK_PATH), `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`✔ added ${newUrls.length} new page(s) to ${LOCK_PATH}; left ${Object.keys(lock).length} existing entries untouched`);
    process.exit(0);
  }

  const { current, errors } = await snapshot(urls);
  if (errors.length) {
    for (const line of errors) console.error(`✖ ${line}`);
    console.error(`\n✖ could not fetch ${errors.length} of ${urls.length} page(s)`);
    process.exit(1);
  }

  if (args.includes('--update')) {
    const sorted = Object.fromEntries(Object.keys(current).sort().map((url) => [url, current[url]]));
    writeFileSync(join(root, LOCK_PATH), `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`✔ recorded ${urls.length} page(s) in ${LOCK_PATH}`);
    process.exit(0);
  }

  const diff = diffLock(lock, current);
  const total = diff.changed.length + diff.added.length + diff.removed.length;
  if (!total) {
    console.log(`✔ ${urls.length} page(s) match ${LOCK_PATH}`);
    process.exit(0);
  }
  for (const url of diff.changed) console.error(`changed  ${url}`);
  for (const url of diff.added) console.error(`added    ${url}`);
  for (const url of diff.removed) console.error(`removed  ${url}`);
  if (reportPath) writeFileSync(reportPath, renderReport(diff, lock, current));
  console.error(`\n${total} documentation change(s) to review; run npm run docs:lock after updating the skill`);
  process.exit(2);
}
