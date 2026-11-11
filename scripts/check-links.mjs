#!/usr/bin/env node
// Checks that every official documentation URL cited by a skill still answers 200,
// so a skill never points the agent to a page that was renamed or removed.
// Usage: node scripts/check-links.mjs
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownFilesIn, skillDirectories } from './lib/markdown-files.mjs';

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const URL_PATTERN = /https:\/\/developers\.clicksign\.com\/[^\s)`"'<>\]]+/g;

/** developers.clicksign.com URLs cited in a Markdown text, without trailing punctuation. */
export function urlsIn(text) {
  const urls = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    // A URL cut by a placeholder such as `<slug>` is a pattern in prose, not a cited page.
    if (text[match.index + match[0].length] === '<') continue;
    urls.push(match[0].replace(/[.,;:]+$/, ''));
  }
  return urls;
}

/** Markdown files of skills/<name>/, skipping skills/README.md. */
export function skillFiles(root) {
  return skillDirectories(root).flatMap(({ dir }) => markdownFilesIn(dir));
}

/** Unique developers.clicksign.com URLs cited in skills/<name>/**.md, sorted. */
export function skillUrls(root) {
  const urls = new Set(skillFiles(root).flatMap((file) => urlsIn(readFileSync(file, 'utf8'))));
  return [...urls].sort();
}

async function status(url) {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return response.status;
  } catch (err) {
    return err.message;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const urls = skillUrls(root);
  const broken = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(status));
    batch.forEach((url, j) => {
      if (results[j] !== 200) broken.push(`${results[j]}  ${url}`);
    });
  }
  for (const line of broken) console.error(`✖ ${line}`);
  if (broken.length) {
    console.error(`\n✖ ${broken.length} of ${urls.length} link(s) are broken`);
    process.exit(1);
  }
  console.log(`✔ ${urls.length} link(s) answer 200`);
}
