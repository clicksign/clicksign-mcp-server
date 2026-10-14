# Changelog

All notable changes to this package are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). The version matches `version` in `plugin.json` and every client manifest.

## [1.0.0] - Unreleased

### Added

- OpenAI plugin package for ChatGPT and Codex: root `plugin.json` (Agent Plugins 1.0.0 with `extensions.com.openai` listing, review and publication metadata) and `mcp.json` pointing at the hosted Clicksign MCP server (`https://mcp.clicksign.com/mcp/oauth2`, OAuth 2.1).
- Codex repo marketplace in `.agents/plugins/marketplace.json`.
- Claude Code and Cursor manifests (not published yet).
- Skills directory convention.
- `migrate-api-v1-to-v3` skill: guides the migration of an integration from the legacy API 1.9 to API 3.0 (Envelope), with references distilled from the official documentation.
- Validation (`npm run validate`), packaging (`npm run package`), connection smoke test (`npm run smoke`) and MCP Inspector helpers (`npm run inspect`, `npm run inspect:cli`).
