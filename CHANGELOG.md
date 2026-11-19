# Changelog

All notable changes to this package are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). The version matches `version` in `plugin.json` and every client manifest.

## [1.0.0] - Unreleased

### Added

- OpenAI plugin package for ChatGPT and Codex: root `plugin.json` (Agent Plugins 1.0.0 with `extensions.com.openai` listing, review and publication metadata) and `mcp.json` pointing at the hosted Clicksign MCP server (`https://mcp.clicksign.com/mcp/oauth2`, OAuth 2.1).
- Codex repo marketplace in `.agents/plugins/marketplace.json`.
- Claude Code and Cursor manifests (not published yet).
- Skills directory convention.
- `migrate-api-v1-to-v3` skill: guides the migration of an integration from the legacy API 1.9 to API 3.0 (Envelope), fixes or adjusts calls existing 1.9 code already makes, and answers requests for new 1.9 code with the 3.0 equivalent, with references distilled from the official documentation.
- `start-clicksign-integration` skill: builds a brand-new Clicksign integration on API 3.0 only. It reads the client's repository, decides autonomously what the official documentation already settles, asks only the open business rules in one short batch, and delivers a working integration (HTTP client, send function, webhook handler with HMAC validation, configuration, offline tests) in the client's own code, plus a sandbox script up to the signed envelope and the received webhook. When the code connects to a system with a ready-made integration in the Clicksign integrations catalog, it first gives the developer the context and asks whether to build from scratch or follow that integration (`references/native-integrations.md`, a dated snapshot of the catalog).
- Link check for the documentation URLs cited by skills (`npm run check:links`), also run in the validate workflow.
- Legacy-API check (`npm run check:api-3-only`) that fails if a skill other than `migrate-api-v1-to-v3` recommends or shows an example call to the legacy API 1.9, also run in the validate workflow.
- Endpoint check (`npm run check:endpoints`) that fails if a skill cites an endpoint that is not a documented operation on a page that same skill already lists in its own `references/sources.md`, also run in the validate workflow.
- Weekly `docs-drift` workflow that compares the documentation pages cited by skills with `scripts/docs-sources.lock.json` and opens or updates a `docs-drift` issue when they change (`npm run check:docs-drift`, `npm run docs:lock`, `npm run docs:lock:add` to record only a new skill's first citations).
- Skill frontmatter limits from the Agent Skills specification in `npm run validate` (`name` up to 64 characters, `description` up to 1024), and `privacyPolicyUrl` in the Claude plugin manifest.
- Validation (`npm run validate`), packaging (`npm run package`), connection smoke test (`npm run smoke`) and MCP Inspector helpers (`npm run inspect`, `npm run inspect:cli`).
