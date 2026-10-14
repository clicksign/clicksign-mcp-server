#!/usr/bin/env node
// Checks that every official documentation URL cited by a skill still answers 200,
// so a skill never points the agent to a page that was renamed or removed.
// Usage: node scripts/check-links.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;
const URL_PATTERN = /https:\/\/developers\.clicksign\.com\/[^\s)`"'<>\]]+/g;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

/** Unique developers.clicksign.com URLs cited in skills/<name>/**.md, sorted. */
export function skillUrls(root) {
  const skills = join(root, 'skills');
  if (!existsSync(skills)) return [];
  const files = readdirSync(skills, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => walk(join(skills, entry.name)));
  const urls = new Set();
  for (const file of files) {
    for (const match of readFileSync(file, 'utf8').matchAll(URL_PATTERN)) urls.add(match[0].replace(/[.,;:]+$/, ''));
  }
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
