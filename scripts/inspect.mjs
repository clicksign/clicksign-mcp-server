#!/usr/bin/env node
// Runs the MCP Inspector against the server this package points to, using the shipped
// .mcp.json as the Inspector config (same format: mcpServers.<name>.{type: "http", url}).
//
//   node scripts/inspect.mjs web   opens the Inspector web UI; log in with OAuth there
//   node scripts/inspect.mjs cli   lists the tools and compares them with scripts/expected-tools.json,
//                                  reporting tools without title or annotations (G1)
//
// The Inspector runs the OAuth login itself and keeps the token in its own store
// (~/.mcp-inspector), shared by the web UI and the CLI. No token passes through
// this script. CLICKSIGN_MCP_URL points both modes at another environment.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Pinned on purpose: Inspector versions before 0.14.1 have an unauthenticated proxy (CVE-2025-49596).
const INSPECTOR = '@modelcontextprotocol/inspector@2.9.0';
const SERVER = 'clicksign';
const ANNOTATIONS = ['readOnlyHint', 'destructiveHint', 'openWorldHint'];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (!['web', 'cli'].includes(mode)) {
  console.error('usage: node scripts/inspect.mjs <web|cli>');
  process.exit(2);
}

const target = process.env.CLICKSIGN_MCP_URL
  ? ['--server-url', process.env.CLICKSIGN_MCP_URL, '--transport', 'http']
  : ['--config', join(root, '.mcp.json'), '--server', SERVER];

function run(args, { capture }) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('npx', ['-y', INSPECTOR, ...args], {
      cwd: root,
      // stdin and stderr stay on the terminal so the Inspector can run the interactive OAuth login.
      stdio: ['inherit', capture ? 'pipe' : 'inherit', 'inherit'],
    });
    let stdout = '';
    child.stdout?.on('data', (chunk) => (stdout += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolvePromise({ code, stdout }));
  });
}

if (mode === 'web') {
  const { code } = await run(['--web', ...target], { capture: false });
  process.exit(code ?? 1);
}

const { code, stdout } = await run(['--cli', ...target, '--method', 'tools/list', '--format', 'json'], { capture: true });
let result;
try {
  result = JSON.parse(stdout);
} catch {
  console.error(stdout);
  console.error(`✖ Inspector exited with code ${code} without a JSON tools/list result`);
  process.exit(1);
}
// --format json wraps the MCP response: {"result": {"tools": [...]}} or {"error": {...}}.
const tools = result.result?.tools;
if (code !== 0 || !Array.isArray(tools)) {
  console.error(JSON.stringify(result, null, 2));
  console.error(`✖ tools/list failed (Inspector exit code ${code})`);
  process.exit(1);
}

const expected = JSON.parse(readFileSync(join(root, 'scripts', 'expected-tools.json'), 'utf8'));
const names = tools.map((tool) => tool.name);
const missing = expected.filter((name) => !names.includes(name));
const unexpected = names.filter((name) => !expected.includes(name));

console.log(`tools/list returned ${tools.length} tool(s); expected ${expected.length}\n`);
for (const tool of tools) {
  const title = tool.title ?? tool.annotations?.title;
  const gaps = [
    ...(title ? [] : ['title']),
    ...ANNOTATIONS.filter((hint) => typeof tool.annotations?.[hint] !== 'boolean'),
  ];
  console.log(`${gaps.length ? '⚠' : '✔'} ${tool.name}${gaps.length ? `  missing: ${gaps.join(', ')}` : ''}`);
}

const annotationGaps = tools.filter(
  (tool) => !(tool.title ?? tool.annotations?.title) || ANNOTATIONS.some((hint) => typeof tool.annotations?.[hint] !== 'boolean'),
).length;
if (missing.length) console.error(`\n✖ missing tools: ${missing.join(', ')}`);
if (unexpected.length) console.error(`✖ unexpected tools: ${unexpected.join(', ')}`);
if (annotationGaps) console.error(`✖ ${annotationGaps} tool(s) lack a title or readOnlyHint/destructiveHint/openWorldHint (G1)`);

const ok = !missing.length && !unexpected.length && !annotationGaps;
console.log(ok ? '\n✔ tool list matches and every tool is annotated' : '');
process.exit(ok ? 0 : 1);
