import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The MCP URL from the shipped mcp.json, or CLICKSIGN_MCP_URL to point at another environment. */
export function serverUrl(root) {
  if (process.env.CLICKSIGN_MCP_URL) return process.env.CLICKSIGN_MCP_URL;
  const { mcpServers } = JSON.parse(readFileSync(join(root, 'mcp.json'), 'utf8'));
  return Object.values(mcpServers)[0].url;
}
