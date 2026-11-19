#!/usr/bin/env node
// Checks, without credentials, that the MCP URL in mcp.json answers like an
// OAuth-protected MCP server that ChatGPT and Codex can connect to:
//   1. an unauthenticated MCP request (POST, and GET for the SSE stream) gets 401 with
//      WWW-Authenticate resource_metadata (RFC 9728), without hanging
//   2. the protected resource metadata names an authorization server
//   3. the authorization server metadata (RFC 8414) has the endpoints clients need
// Usage: node scripts/smoke.mjs   (CLICKSIGN_MCP_URL overrides the URL)
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverUrl } from './lib/server-url.mjs';

const TIMEOUT_MS = 15_000;
const GET_TIMEOUT_MS = 5_000;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = serverUrl(root);

let failed = 0;
const pass = (message) => console.log(`✔ ${message}`);
const fail = (message) => {
  failed++;
  console.error(`✖ ${message}`);
};

async function getJson(target) {
  const response = await fetch(target, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// RFC 8414 / RFC 9728 put the well-known segment between the origin and the path.
function wellKnown(base, suffix) {
  const { origin, pathname } = new URL(base);
  const path = pathname === '/' ? '' : pathname.replace(/\/$/, '');
  return `${origin}/.well-known/${suffix}${path}`;
}

async function firstJson(candidates) {
  for (const candidate of candidates) {
    try {
      return { source: candidate, body: await getJson(candidate) };
    } catch {
      // try the next well-known location
    }
  }
  return undefined;
}

console.log(`MCP server: ${url}\n`);

// 1. Unauthenticated initialize must be rejected with a pointer to the resource metadata.
let resourceMetadataUrl;
try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'clicksign-plugin-smoke', version: '1.0.0' } },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const challenge = response.headers.get('www-authenticate') ?? '';
  if (response.status === 401) pass('unauthenticated request is rejected with 401');
  else fail(`unauthenticated request returned HTTP ${response.status}, expected 401`);
  resourceMetadataUrl = challenge.match(/resource_metadata="([^"]+)"/)?.[1];
  if (resourceMetadataUrl) pass(`WWW-Authenticate points to resource metadata: ${resourceMetadataUrl}`);
  else fail(`WWW-Authenticate has no resource_metadata (got ${JSON.stringify(challenge)})`);
} catch (err) {
  fail(`could not reach ${url}: ${err.message}`);
}

// 1b. An unauthenticated GET (the streamable-HTTP SSE stream) must be challenged immediately.
// A server that forwards it to the stream leaves OAuth clients waiting and discovery never starts.
try {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'text/event-stream' },
    signal: AbortSignal.timeout(GET_TIMEOUT_MS),
  });
  const challenge = response.headers.get('www-authenticate') ?? '';
  if (response.status === 401 && /resource_metadata="[^"]+"/.test(challenge)) pass('unauthenticated GET is rejected with 401 and resource_metadata');
  else fail(`unauthenticated GET returned HTTP ${response.status} with WWW-Authenticate ${JSON.stringify(challenge)}, expected 401 with resource_metadata`);
  await response.body?.cancel();
} catch (err) {
  if (err.name === 'TimeoutError') fail(`unauthenticated GET did not answer within ${GET_TIMEOUT_MS / 1000}s: the server must challenge GET, not hold the stream open`);
  else fail(`unauthenticated GET failed: ${err.message}`);
}

// 2. Protected resource metadata.
const resource = await firstJson(
  [resourceMetadataUrl, wellKnown(url, 'oauth-protected-resource'), `${new URL(url).origin}/.well-known/oauth-protected-resource`].filter(Boolean),
);
const authorizationServer = resource?.body.authorization_servers?.[0];
if (!resource) fail('protected resource metadata not found');
else if (!authorizationServer) fail(`${resource.source} lists no authorization_servers`);
else pass(`protected resource metadata names authorization server ${authorizationServer}`);

// 3. Authorization server metadata.
if (authorizationServer) {
  const metadata = await firstJson([
    wellKnown(authorizationServer, 'oauth-authorization-server'),
    wellKnown(authorizationServer, 'openid-configuration'),
    `${authorizationServer.replace(/\/$/, '')}/.well-known/openid-configuration`,
  ]);
  if (!metadata) {
    fail(`authorization server metadata not found for ${authorizationServer}`);
  } else {
    const body = metadata.body;
    pass(`authorization server metadata found at ${metadata.source}`);
    for (const field of ['authorization_endpoint', 'token_endpoint']) {
      if (body[field]) pass(`${field}: ${body[field]}`);
      else fail(`${field} is missing`);
    }
    if (body.registration_endpoint) pass(`dynamic client registration: ${body.registration_endpoint}`);
    else fail('registration_endpoint is missing (ChatGPT registers itself through dynamic client registration)');
    if (body.code_challenge_methods_supported?.includes('S256')) pass('PKCE S256 is supported');
    else fail('code_challenge_methods_supported does not include S256');
  }
}

console.log(failed ? `\n✖ smoke failed: ${failed} check(s)` : '\n✔ smoke passed');
process.exit(failed ? 1 : 0);
