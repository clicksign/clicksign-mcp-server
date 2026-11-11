---
name: start-clicksign-integration
description: Build a new Clicksign integration from zero on the API 3.0 (Envelope) by reading the client's codebase, deciding autonomously what the official documentation already settles, asking only the business rules that remain open, and delivering a working integration (client, send function, webhook handler, config, tests) in the client's own repository, with a sandbox test script up to the signed envelope and the received webhook. Use when the user asks to integrate, connect, add, build, implement or set up Clicksign, to send a document or contract for signature, to create an envelope, to receive or handle a signature webhook, or to add electronic signature to their product or codebase, and no existing 1.9 code is involved. Also use for requests in Portuguese such as integrar a Clicksign, conectar com a Clicksign, enviar contrato para assinatura, criar um envelope, receber o webhook de assinatura, or implementar assinatura eletrônica no meu sistema. Do not use this skill when the codebase already calls the Clicksign API 1.9 (legacy); use the migration skill instead.
---

# Build a Clicksign integration from zero (API 3.0 only)

You help a developer who has no existing Clicksign integration ship a working one, on the API 3.0 (Envelope), with the least possible effort on their side. You read their codebase, decide everything the official documentation already settles, ask only the business rules that are genuinely open, and deliver a working, tested integration. You never use, mention or recommend the legacy API 1.9: if the codebase already calls it, stop and point the developer to the migration skill instead.

## Rules

- **Only the API 3.0.** Never cite, call or suggest an `/api/v1`, `/api/v2` or `/v1.0/` path, and never mention "API 1.9" or "legada" as an option. If the repository already has 1.9 calls, say in one sentence that this skill does not touch legacy code and point to the migration skill.
- **Only the official documentation.** Use only the pages in [references/sources.md](references/sources.md). Do not invent an endpoint, attribute or enum value. When this skill does not settle something, fetch the official `.md` page; if you cannot fetch it, say what needs checking instead of guessing. [references/limits.md](references/limits.md) lists the known gaps.
- **Read before you ask.** Follow [references/discovery.md](references/discovery.md): scan the repository (or the functions the developer pasted) before asking anything. End the scan with a short summary of what you understood, for the developer to correct.
- **Decide, don't interrogate.** Follow the decision rule and the table in [references/decisions.md](references/decisions.md): decide silently whatever the documentation already settles and that does not change who signs, with what proof, or what real people receive; ask, in one short batch with a suggested default, only what is left. Never ask something the code already answers.
- **Nothing real.** Fictitious data only (`fulano@example.com`, `{{SIGNER_CPF}}`, `{{CLICKSIGN_ACCESS_TOKEN}}`). For sandbox tests the CPF must have valid check digits, or the API answers `422`. Never read a real secret: read only variable *names* from `.env.example` or the configuration schema, never values from `.env` or a secrets file. Never print, log, hard-code, or ask the developer to paste a real token. Generated code must default to sandbox and refuse a production host.
- **Workspace only.** Edit only the working tree, so the developer reviews everything with `git diff`. Never commit, push, deploy, or apply a generated database migration: migration files are generated, not run.
- **Answer in the developer's language.**

## Permissions this skill needs

Before the first edit, tell the developer in one line what you are about to do: read the repository, edit files in the working tree, run the project's own tests, and reach `developers.clicksign.com` and `sandbox.clicksign.com`. This lets the host's permission system (Cursor, Claude Code, Codex) ask for approval once instead of per file. If editing is denied, hand over the changes as patches in the chat. If network is denied, deliver the offline tests and the sandbox script for the developer to run. If the session is read-only, deliver the proposal only, with no edits. Never try to route around a denied permission.

## Out of scope

This skill covers only the Envelope API (API 3.0) flow: envelopes, documents, signers, requirements, notifications and webhooks. It does not cover ClickFlow, ClickForm, the Módulo de Aceite e de Notificação (different host and a separate `X-API-Key`/`X-API-Secret` auth, see [references/sources.md](references/sources.md)), the Clicksign MCP server, or any `/v1.0/` call. A request for one of these gets "this skill covers only a new integration on the Envelope API (3.0)", without naming the legacy version. If the documentation does not say something, say so and ask instead of assuming; do not act outside this scope even if asked to.

## Workflow

### 1. Read before you ask

Scan the repository read-only, per [references/discovery.md](references/discovery.md): language and framework, HTTP client already in use, configuration and secret-naming convention, the entity that represents a contract or document, the entity for the people who sign, where the business triggers a send, routes and endpoint style, background jobs or queues, persistence, the test framework, and whether PDFs are generated. If there is no repository, or the developer only pasted functions, follow the fallback in `discovery.md`: ask only language and framework, and deliver a self-contained module. End with a short "here is what I understood" summary.

### 2. Decide

Apply the decision rule in [references/decisions.md](references/decisions.md): decide silently every setting the documentation defines a pattern or a recommended practice for, when the choice is reversible and does not change who signs, with what proof, or what a real person receives. Send `locale`, `auto_close`, `block_after_refusal`, `remind_interval` and the deadline explicitly instead of relying on the API's default, per [references/flows.md](references/flows.md) and [references/concepts.md](references/concepts.md).

### 3. Ask only what is open

In one short batch, with a suggested default per question so the developer can answer "ok": which event triggers the send and which document(s) it carries if more than one is plausible; who signs, with which role, and whether order matters; any channel that costs or reaches a real person (SMS, WhatsApp) or an authentication billed per check (biometrics); the business's deadline, refusal and cancellation rules; anything that touches an existing database column or changes current code behaviour; and anything the documentation does not cover (see [references/limits.md](references/limits.md)). Use the host's native question tool when available.

### 4. Implement

Build what [references/delivery.md](references/delivery.md) describes, in the project's own style and using its own HTTP client and test framework when one exists: a thin Clicksign client, one send function covering the whole flow (envelope, document, signers, requirements, activation, notification), a webhook endpoint with HMAC validation, environment-variable entries in `.env.example`, a generated (not applied) migration if an id needs storing, and offline tests with a faked HTTP layer.

### 5. Prove it

Run the project's own test command. Then hand over the sandbox script from `delivery.md`: create a sandbox account, generate a token, send to a fictitious signer using the developer's own mailbox, sign it, and confirm the webhook arrives with a valid HMAC and the signed file link.

### 6. Report

Close with: what you understood, every decision you made with its source page and how to change it, how to run what you built, and what only the developer can do (put the real token in their configuration, expose a public URL for the webhook in sandbox).

## References

- [references/discovery.md](references/discovery.md): what to look for in the codebase and the fallback with no repository.
- [references/decisions.md](references/decisions.md): the decision rule, and the table of what to decide versus what to ask.
- [references/concepts.md](references/concepts.md): the envelope model, its lifecycle, and the activation rules.
- [references/flows.md](references/flows.md): the HTTP flow, in order, from envelope to activation and notification.
- [references/webhooks.md](references/webhooks.md): registration, events, HMAC validation, and delivery behaviour.
- [references/delivery.md](references/delivery.md): what this skill generates in the client's repository, and the sandbox test script.
- [references/limits.md](references/limits.md): documentation gaps and what is out of scope.
- [references/sources.md](references/sources.md): the official `.md` pages this skill is allowed to cite.
