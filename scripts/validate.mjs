#!/usr/bin/env node
// Validates the plugin package before it is zipped and submitted to OpenAI.
// Usage: node scripts/validate.mjs [--release]
//   default    placeholders are warnings, so a draft package still validates
//   --release  placeholders are errors, so nothing unfinished gets submitted
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { imageSize } from 'image-size';
import { parse as parseYaml } from 'yaml';
import { packageFiles } from './lib/package-files.mjs';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

export const MCP_URL = 'https://mcp.clicksign.com/mcp/oauth2';
const SERVER_NAME = 'clicksign';

// SHA-256 of the generated placeholder icons in assets/. Replacing an icon with the
// real brand asset changes its hash and clears the warning.
const PLACEHOLDER_ASSETS = new Set([
  '88792dfc9aa80ff3877067b466e414713811212722619423d8437e476ffc62c5', // logo.png
  '9075a345b15e18c3bf291e89e0cd3c39f58ef3f9b307fc32914e44e9fd978d57', // logo-dark.png
  'ec67af7502d64ae926c468bd45601b1bcdcc4ad7738b69e6193a3758a9d4956f', // composer-icon.png
]);

const PLACEHOLDER = /<[^<>\n]+>|\bTODO\b/;
const SECRET_PATTERNS = [
  [/client_secret/i, 'client_secret'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/, 'Bearer token'],
  [/\bpassword\b/i, 'password'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
];
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
const ICON_FIELDS = ['logo', 'logoDark', 'composerIcon', 'composerIconDark'];
const URL_FIELDS = ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Category titles from the plugin_category_unknown error in
// https://developers.openai.com/plugins/deploy/submission-errors; any other value fails the upload.
const CATEGORIES = [
  'Productivity',
  'Creativity',
  'Developer Tools',
  'Business & Operations',
  'Data & Analytics',
  'Communication',
  'Education & Research',
  'Security',
  'Finance',
  'Healthcare',
  'Travel',
  'Entertainment',
  'Other',
];

export function validate(root, { release = false } = {}) {
  const errors = [];
  const warnings = [];
  const error = (file, message) => errors.push(`${file}: ${message}`);
  const placeholder = (file, message) => (release ? errors : warnings).push(`${file}: ${message}`);

  const readJson = (file) => {
    const path = join(root, file);
    if (!existsSync(path)) {
      error(file, 'file is missing');
      return undefined;
    }
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch (err) {
      error(file, `invalid JSON (${err.message})`);
      return undefined;
    }
  };

  const plugin = readJson('plugin.json');
  const mcp = readJson('mcp.json');
  const claudeMcp = readJson('.mcp.json');
  const claudePlugin = readJson('.claude-plugin/plugin.json');
  const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
  const cursorPlugin = readJson('.cursor-plugin/plugin.json');
  const codexMarketplace = readJson('.agents/plugins/marketplace.json');
  const npmPackage = readJson('package.json');

  checkSchemas();
  const openai = plugin?.extensions?.['com.openai'];
  if (plugin) checkPlaceholders('plugin.json', plugin);
  if (mcp) checkPlaceholders('mcp.json', mcp);
  if (plugin) checkIdentity();
  if (openai) checkListing(openai);
  else if (plugin) error('plugin.json', 'extensions["com.openai"] is required');
  checkMcpServers();
  checkDrift();
  checkForbidden();
  checkSkills();

  return { errors, warnings };

  function checkSchemas() {
    const ajv = new Ajv2020({ allErrors: true });
    for (const [file, data, schema] of [
      ['plugin.json', plugin, 'plugin.schema.json'],
      ['mcp.json', mcp, 'mcp.schema.json'],
    ]) {
      if (!data) continue;
      const check = ajv.compile(JSON.parse(readFileSync(join(SCRIPTS_DIR, 'schemas', schema), 'utf8')));
      if (!check(data)) {
        for (const e of check.errors) error(file, `schema: ${e.instancePath || '/'} ${e.message}`);
      }
    }
  }

  // Every placeholder string in the files that are submitted is reported once here;
  // the format checks below skip placeholder values instead of failing on them.
  function checkPlaceholders(file, value, path = '') {
    if (typeof value === 'string') {
      if (PLACEHOLDER.test(value)) placeholder(file, `placeholder at ${path || '/'}: ${JSON.stringify(value)}`);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => checkPlaceholders(file, item, `${path}/${i}`));
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) checkPlaceholders(file, item, `${path}/${key}`);
    }
  }

  function checkIdentity() {
    if (/--/.test(plugin.name ?? '')) error('plugin.json', 'name must use single hyphens');
    if (!plugin.version) error('plugin.json', 'version is required for submission');
    else if (!/^\d+\.\d+\.\d+$/.test(plugin.version)) error('plugin.json', `version "${plugin.version}" is not semver`);
    maxLength('plugin.json', 'description', plugin.description, 4000);
    maxLength('plugin.json', 'author.name', plugin.author?.name, 120);
    for (const field of ['homepage', 'repository']) httpsUrl('plugin.json', field, plugin[field], 2048, false);
    httpsUrl('plugin.json', 'author.url', plugin.author?.url, 2048, false);
  }

  function checkListing(openai) {
    const file = 'plugin.json';
    const ui = openai.interface ?? {};
    const at = (field) => `extensions.com.openai.interface.${field}`;

    for (const field of ['displayName', 'shortDescription', 'longDescription', 'developerName', 'category', 'logo']) {
      if (!ui[field]) error(file, `${at(field)} is required`);
    }
    if (!ui.composerIcon) error(file, `${at('composerIcon')} is required by Codex`);
    if (ui.category && !CATEGORIES.includes(ui.category)) {
      error(file, `${at('category')} "${ui.category}" is not an accepted category (${CATEGORIES.join(', ')})`);
    }
    maxLength(file, at('displayName'), ui.displayName, 30);
    maxLength(file, at('shortDescription'), ui.shortDescription, 30);
    maxLength(file, at('longDescription'), ui.longDescription, 4000);
    maxLength(file, at('developerName'), ui.developerName, 80);
    if (/\b(mcp|plugin)\b/i.test(ui.displayName ?? '')) {
      error(file, `${at('displayName')} must not add "MCP", "MCP Server" or "Plugin" to the company name`);
    }

    for (const field of URL_FIELDS) httpsUrl(file, at(field), ui[field], 1024, true);

    const prompts = typeof ui.defaultPrompt === 'string' ? [ui.defaultPrompt] : (ui.defaultPrompt ?? []);
    if (prompts.length > 3) error(file, `${at('defaultPrompt')} allows at most 3 prompts`);
    prompts.forEach((prompt, i) => maxLength(file, `${at('defaultPrompt')}[${i}]`, prompt, 128));
    if (new Set(prompts).size !== prompts.length) error(file, `${at('defaultPrompt')} prompts must be unique`);

    const capabilities = ui.capabilities ?? [];
    if (capabilities.length > 20) error(file, `${at('capabilities')} allows at most 20 items`);
    capabilities.forEach((capability, i) => maxLength(file, `${at('capabilities')}[${i}]`, capability, 120));

    for (const field of ['brandColor', 'brandColorDark']) {
      const color = ui[field];
      if (color !== undefined && !PLACEHOLDER.test(color) && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        error(file, `${at(field)} must be #RRGGBB`);
      }
    }

    for (const field of ICON_FIELDS) {
      if (ui[field] !== undefined) checkImage(at(field), ui[field], true);
    }
    (ui.screenshots ?? []).forEach((path, i) => checkImage(`${at('screenshots')}[${i}]`, path, false));

    checkReview(openai.review);
    checkPublication(openai.publication);

    if (openai.onboardingSkill !== undefined && !existsSync(join(root, openai.onboardingSkill))) {
      error(file, `extensions.com.openai.onboardingSkill points to a missing file: ${openai.onboardingSkill}`);
    }
  }

  function checkReview(review) {
    const file = 'plugin.json';
    const at = 'extensions.com.openai.review';
    if (!review) {
      error(file, `${at} is required for the initial MCP review`);
      return;
    }
    const positive = review.test_cases?.positive ?? [];
    const negative = review.test_cases?.negative ?? [];
    if (positive.length !== 5) error(file, `${at}.test_cases.positive must have exactly 5 cases (found ${positive.length})`);
    if (negative.length !== 3) error(file, `${at}.test_cases.negative must have exactly 3 cases (found ${negative.length})`);
    positive.forEach((testCase, i) => {
      for (const field of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
        if (!testCase?.[field]) error(file, `${at}.test_cases.positive[${i}].${field} is required`);
      }
      maxLength(file, `${at}.test_cases.positive[${i}].description`, testCase?.description, 4000);
    });
    negative.forEach((testCase, i) => {
      for (const field of ['description', 'prompt']) {
        if (!testCase?.[field]) error(file, `${at}.test_cases.negative[${i}].${field} is required`);
      }
    });
    // The demo video can come after the first upload, so a draft only warns.
    if (!review.demo_recording_url) placeholder(file, `${at}.demo_recording_url is required for the MCP review`);
    else httpsUrl(file, `${at}.demo_recording_url`, review.demo_recording_url, 2048, true);
    if (review.commerce !== undefined && typeof review.commerce !== 'boolean') error(file, `${at}.commerce must be a boolean`);
  }

  function checkPublication(publication) {
    if (!publication) return;
    const file = 'plugin.json';
    const at = 'extensions.com.openai.publication';
    for (const country of publication.countries ?? []) {
      if (!/^[A-Z]{2}$/.test(country)) error(file, `${at}.countries: "${country}" must be an uppercase ISO country code`);
    }
    for (const [locale, text] of Object.entries(publication.translations ?? {})) {
      if (!locale.trim()) error(file, `${at}.translations has an empty locale key`);
      if (text?.subtitle != null) {
        maxLength(file, `${at}.translations.${locale}.subtitle`, text.subtitle, 30);
        if (/[\n\t]/.test(text.subtitle)) error(file, `${at}.translations.${locale}.subtitle must be a single line`);
      }
      if (text?.description != null) maxLength(file, `${at}.translations.${locale}.description`, text.description, 4000);
    }
  }

  function checkImage(field, path, square) {
    const file = 'plugin.json';
    if (typeof path !== 'string' || !path.startsWith('./')) {
      error(file, `${field} must be a ./-prefixed path relative to the plugin root`);
      return;
    }
    const absolute = resolve(root, path);
    if (relative(root, absolute).startsWith('..')) {
      error(file, `${field} points outside the plugin root: ${path}`);
      return;
    }
    if (!existsSync(absolute)) {
      error(file, `${field} points to a missing file: ${path}`);
      return;
    }
    if (!IMAGE_EXTENSIONS.has(extname(path).toLowerCase())) {
      error(file, `${field} must be PNG, JPEG, WebP or SVG: ${path}`);
      return;
    }
    const buffer = readFileSync(absolute);
    if (buffer.length > 5 * 1024 * 1024) error(file, `${field} is larger than 5 MiB: ${path}`);
    let size;
    try {
      size = imageSize(buffer);
    } catch (err) {
      error(file, `${field} is not a readable image (${err.message}): ${path}`);
      return;
    }
    const { width, height } = size;
    if (square && width !== height) error(file, `${field} must be square, found ${width}x${height}: ${path}`);
    if (square && Math.min(width, height) < 48) error(file, `${field} must be at least 48x48, found ${width}x${height}: ${path}`);
    if (extname(path).toLowerCase() !== '.svg' && Math.max(width, height) > 4096) {
      error(file, `${field} must be at most 4096 px per side, found ${width}x${height}: ${path}`);
    }
    if (PLACEHOLDER_ASSETS.has(createHash('sha256').update(buffer).digest('hex'))) {
      placeholder(file, `${field} is still a placeholder image: ${path}`);
    }
  }

  function checkMcpServers() {
    for (const [file, config, type] of [
      ['mcp.json', mcp, 'streamable-http'],
      ['.mcp.json', claudeMcp, 'http'],
    ]) {
      if (!config) continue;
      const servers = Object.entries(config.mcpServers ?? {});
      if (servers.length !== 1) {
        error(file, `must declare exactly one MCP server (found ${servers.length})`);
        continue;
      }
      const [name, server] = servers[0];
      if (name !== SERVER_NAME) error(file, `MCP server must be named "${SERVER_NAME}" (found "${name}")`);
      if (server.type !== type) error(file, `mcpServers.${name}.type must be "${type}" (found "${server.type}")`);
      if (server.url !== MCP_URL) error(file, `mcpServers.${name}.url must be ${MCP_URL} (found ${server.url})`);
      if (server.headers && Object.keys(server.headers).length) error(file, `mcpServers.${name}.headers must be empty; auth uses OAuth`);
    }
  }

  // Every client manifest describes the same plugin; a release bump must touch all of them.
  function checkDrift() {
    if (!plugin) return;
    const { name, version, description } = plugin;
    const same = (file, field, actual, expected) => {
      if (actual !== expected) error(file, `${field} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)} (from plugin.json)`);
    };

    if (claudePlugin) {
      same('.claude-plugin/plugin.json', 'name', claudePlugin.name, name);
      same('.claude-plugin/plugin.json', 'version', claudePlugin.version, version);
      same('.claude-plugin/plugin.json', 'description', claudePlugin.description, description);
    }
    if (cursorPlugin) {
      same('.cursor-plugin/plugin.json', 'name', cursorPlugin.name, name);
      same('.cursor-plugin/plugin.json', 'version', cursorPlugin.version, version);
      same('.cursor-plugin/plugin.json', 'description', cursorPlugin.description, description);
    }
    const claudeEntry = claudeMarketplace?.plugins?.find((entry) => entry.name === name);
    if (claudeMarketplace && !claudeEntry) error('.claude-plugin/marketplace.json', `no plugin entry named "${name}"`);
    if (claudeEntry) {
      same('.claude-plugin/marketplace.json', `plugins[${name}].version`, claudeEntry.version, version);
      same('.claude-plugin/marketplace.json', `plugins[${name}].description`, claudeEntry.description, description);
      same('.claude-plugin/marketplace.json', `plugins[${name}].source`, claudeEntry.source, './');
    }
    const codexEntry = codexMarketplace?.plugins?.find((entry) => entry.name === name);
    if (codexMarketplace && !codexEntry) error('.agents/plugins/marketplace.json', `no plugin entry named "${name}"`);
    if (codexEntry) {
      same('.agents/plugins/marketplace.json', `plugins[${name}].source.path`, codexEntry.source?.path, './');
      same('.agents/plugins/marketplace.json', `plugins[${name}].category`, codexEntry.category, plugin.extensions?.['com.openai']?.interface?.category);
    }
    if (npmPackage) same('package.json', 'version', npmPackage.version, version);

    const changelog = existsSync(join(root, 'CHANGELOG.md')) ? readFileSync(join(root, 'CHANGELOG.md'), 'utf8') : '';
    if (!new RegExp(`^## \\[?${version.replaceAll('.', '\\.')}\\]?`, 'm').test(changelog)) {
      error('CHANGELOG.md', `has no entry for version ${version}`);
    }
  }

  function checkForbidden() {
    for (const path of ['.app.json', 'hooks', 'hooks.json', '.codex-plugin']) {
      if (existsSync(join(root, path))) error(path, 'is not allowed: OpenAI rejects app references and hooks, and .codex-plugin/ is ignored when extensions.com.openai is set');
    }
    if (plugin) {
      for (const key of ['apps', 'hooks']) if (key in plugin) error('plugin.json', `"${key}" is not allowed in a submitted plugin`);
      for (const key of ['test_credentials', 'reviewer_instructions']) {
        if (openai?.review && key in openai.review) error('plugin.json', `review.${key} is rejected by OpenAI; enter it in the dashboard`);
      }
    }

    // Secrets are searched in the manifests and in everything that goes into the ZIP.
    const manifests = ['.mcp.json', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', '.cursor-plugin/plugin.json', '.agents/plugins/marketplace.json'];
    const isText = (file) => extname(file).toLowerCase() === '.svg' || !IMAGE_EXTENSIONS.has(extname(file).toLowerCase());
    const textFiles = [...new Set([...packageFiles(root), ...manifests])]
      .filter((file) => isText(file) && existsSync(join(root, file)));
    for (const file of textFiles) {
      const text = readFileSync(join(root, file), 'utf8');
      for (const [pattern, label] of SECRET_PATTERNS) {
        if (pattern.test(text)) error(file, `looks like it contains a secret (${label}); credentials never go in the package`);
      }
    }
  }

  function checkSkills() {
    const skillsDir = join(root, 'skills');
    if (!existsSync(skillsDir)) return;
    for (const name of readdirSync(skillsDir)) {
      const dir = join(skillsDir, name);
      if (!statSync(dir).isDirectory()) continue;
      const file = `skills/${name}/SKILL.md`;
      if (!existsSync(join(dir, 'SKILL.md'))) {
        error(`skills/${name}`, 'skill directory has no SKILL.md');
        continue;
      }
      const match = readFileSync(join(dir, 'SKILL.md'), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) {
        error(file, 'missing YAML frontmatter');
        continue;
      }
      let frontmatter;
      try {
        frontmatter = parseYaml(match[1]) ?? {};
      } catch (err) {
        error(file, `invalid YAML frontmatter (${err.message})`);
        continue;
      }
      if (!KEBAB.test(name)) error(file, `directory name "${name}" must be kebab-case`);
      if (frontmatter.name !== name) error(file, `frontmatter name must be "${name}" (found ${JSON.stringify(frontmatter.name)})`);
      if (typeof frontmatter.description !== 'string' || !frontmatter.description.trim()) error(file, 'frontmatter description is required');
    }
  }

  function maxLength(file, field, value, max) {
    if (typeof value === 'string' && value.length > max) error(file, `${field} has ${value.length} characters (max ${max})`);
  }

  function httpsUrl(file, field, value, max, required) {
    if (value === undefined || value === '') {
      if (required) error(file, `${field} is required`);
      return;
    }
    if (PLACEHOLDER.test(value)) return;
    let url;
    try {
      url = new URL(value);
    } catch {
      error(file, `${field} is not a valid URL: ${value}`);
      return;
    }
    if (url.protocol !== 'https:') error(file, `${field} must use HTTPS: ${value}`);
    if (url.username || url.password) error(file, `${field} must not embed credentials`);
    if (value.length > max) error(file, `${field} is longer than ${max} characters`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const release = process.argv.includes('--release');
  const root = resolve(SCRIPTS_DIR, '..');
  const { errors, warnings } = validate(root, { release });
  for (const warning of warnings) console.warn(`warning  ${warning}`);
  for (const err of errors) console.error(`error    ${err}`);
  const mode = release ? 'release' : 'draft';
  if (errors.length) {
    console.error(`\n✖ validation failed (${mode}): ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }
  console.log(`\n✔ validation passed (${mode}): ${warnings.length} warning(s)`);
}

