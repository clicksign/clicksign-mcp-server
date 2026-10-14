---
name: migrate-api-v1-to-v3
description: Migrate a Clicksign integration from the legacy API 1.9 to API 3.0 (Envelope). Use when code or a snippet calls app.clicksign.com or sandbox.clicksign.com on /api/v1 or /api/v2, passes access_token in the query string, sends document, signer, list or batch JSON roots, uses request_signature_key, sign_as or auths, or when the user asks to migrate, upgrade or port a Clicksign 1.9 integration to 3.0. Also use for requests in Portuguese such as migrar, atualizar ou adaptar a integração Clicksign da API 1.9 (legada, v1) para a API 3.0 (v3, envelope), migração de documento, signatário, lista ou lote para envelope, ou trocar o access_token pelo header Authorization.
---

# Migrate a Clicksign integration from API 1.9 to API 3.0

You help a developer adapt existing code from the Clicksign API 1.9 (legacy) to the API 3.0 (Envelope), keeping what the integration does for their business. API 1.9 is legacy: it receives no new features. Use 1.9 knowledge only to read the existing code. Every change you propose targets 3.0.

## Rules

- Never recommend writing new code on API 1.9, and never keep a call on 1.9 as the answer to a missing feature. Explain the limitation and the 3.0 alternative.
- Use only the official documentation listed in [references/sources.md](references/sources.md). Do not cite third-party repositories, blog posts, or what you remember about older Clicksign versions. When this skill does not settle a field or behaviour, fetch the official `.md` page; if you cannot fetch it, say what needs checking.
- Do not invent endpoints, attributes or enum values. If the references do not cover something the code does, say so and ask.
- Use fictitious data in every example (`fulano@example.com`, `000.000.000-00`, `{{CLICKSIGN_ACCESS_TOKEN}}`). Never print, log or hard-code a real token.
- Point tests at sandbox (`https://sandbox.clicksign.com`), with the host and token in configuration. Never call production, never deploy, never run migrations against production data. You propose and apply code changes only with the developer's approval; shipping is the developer's decision.
- Answer in the developer's language.

## Workflow

### 1. Understand the integration before proposing changes

Read what the developer shared and the relevant code in the repository. Ask for what is missing before you map anything. One short round of questions is better than a wrong migration. The answers that change the result:

- Language, framework and HTTP client (or Clicksign SDK) in use.
- The business flow: what triggers a send, how many documents and signers per send, whether the same signer signs several documents together (1.9 batches), signing order.
- How signers authenticate (`auths`, `selfie_enabled` and the other flags) and their roles (`sign_as`).
- How signers are notified: Clicksign email, SMS, WhatsApp, or the developer's own channel (the `url` parameter).
- Whether the code uses webhooks, the Widget Embedded, the no-token widget, in-person signature, templates, or sign through the API (`/api/v1/sign`).
- Which 1.9 ids (`key`, `request_signature_key`, `list_key`) are stored in their database and who reads them.
- Whether the Clicksign account already has the Envelope API (accounts created before 01/07/2024 get `503` and must contact support) and a sandbox account for tests.

If the developer only shared a fragment, migrate the fragment but list the assumptions you made about the rest.

### 2. Inventory the 1.9 calls

Search the code for:

- `app.clicksign.com` or `sandbox.clicksign.com` with `/api/v1/` or `/api/v2/`;
- `access_token=` in URLs;
- JSON roots `document`, `signer`, `list`, `batch`, and fields `request_signature_key`, `signer_key`, `document_key`, `list_key`, `sign_as`, `auths`, `secret_hmac_sha256`;
- Widget code: `embedded.min-1.0.0.js`, `new Clicksign(`, `tokenlessWidget.js`, `TokenlessWidget`;
- webhook handlers reading `event.name`, `document.key`, `Content-Hmac`.

`/api/v1` on other Clicksign hosts (ClickFlow, ClickForm, acceptance and notification modules) belongs to current products, not to API 1.9. Leave it alone.

List every call with file and line, in the order the flow runs.

### 3. Map each call

Use [references/endpoint-map.md](references/endpoint-map.md) for endpoints, fields, `auths` and `sign_as`, and [references/concepts.md](references/concepts.md) for the model change. The 3.0 flow is always:

1. `POST /api/v3/envelopes` (draft, with the settings that lived on the 1.9 document);
2. `POST .../documents` (upload, template or duplicate);
3. `POST .../signers`;
4. requirements for each signer on each document: one qualification (`agree` + `role`) and at least one authentication (`provide_evidence` + `auth`);
5. `PATCH /api/v3/envelopes/{id}` with `status: running`;
6. `POST .../notifications`.

Then apply the transport changes: `Authorization` header instead of `access_token`, `application/vnd.api+json`, JSON:API bodies, `data.id` instead of `key`, JSON:API errors and pagination. [references/flows.md](references/flows.md) has the five essential flows side by side.

Watch these changes in behaviour, they cause most migration bugs:

- activation fails if a signer has no authentication requirement;
- `block_after_refusal` and `remind_interval` defaults changed;
- signers cannot be edited, and requirements can be created through `/requirements` only in `draft`;
- notifications work only while `running`, for the active group, 1 per minute per endpoint;
- the Widget starts with the signer id, not `request_signature_key`.

### 4. Handle what has no direct equivalent

Check [references/no-equivalent.md](references/no-equivalent.md) for sign through the API, batches, duplicate, delete, cancel, signer reuse and contacts, notification `url`, missing `sign_as` values, in-person email and the no-token widget. For each one that the code uses: explain the difference, give the 3.0 alternative, state the limitation, and ask the developer to choose when the alternative changes the business flow.

### 5. Propose the change

Reply with:

1. **Summary**: what the integration does today and what changes in 3.0, in a few sentences.
2. **Mapping table**: each 1.9 call (file and line), the 3.0 call or calls, and a short note.
3. **Code**: the adapted code in the developer's language and style, ready to apply. Keep their structure (services, clients, error handling); change only what the migration requires. Include the database or storage changes for ids that moved from `key` to `id`.
4. **Limitations and decisions**: items from step 4, each with the alternative.
5. **How to test in sandbox**: the sequence to run, what to check (envelope reaches `running`, notification arrives, webhook payload fields the handler reads, signed file download).
6. **Open questions**: anything you assumed.

Apply edits to the repository only when the developer asks you to, and keep them limited to the migration.

## References

- [references/concepts.md](references/concepts.md): model change, envelope lifecycle, what can change after activation.
- [references/endpoint-map.md](references/endpoint-map.md): transport, endpoints, document and signer fields, `auths`, `sign_as`, webhooks, Widget.
- [references/no-equivalent.md](references/no-equivalent.md): features without a direct equivalent, with limitation and alternative.
- [references/flows.md](references/flows.md): five essential flows in 1.9 and 3.0, as raw HTTP.
- [references/sources.md](references/sources.md): official `.md` pages to fetch for details.
