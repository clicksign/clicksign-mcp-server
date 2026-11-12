# Delivery: what this skill generates, and the sandbox test script

Everything here is generated in the project's own language, style, and test framework, per [discovery.md](discovery.md). Keep the project's existing structure (services, clients, error handling); add only what the integration needs.

## What goes into the repository

1. **A thin Clicksign client**: base URL from configuration (default `https://sandbox.clicksign.com`), the `Authorization`, `Content-Type` and `Accept` headers from [concepts.md](concepts.md), a small JSON:API body helper, and backoff-with-jitter on `429` per [flows.md](flows.md). Reuse the project's existing HTTP client library instead of adding a new one.
2. **One send function** that runs the whole flow in [flows.md](flows.md) for one business record: create the envelope, add the document(s), add the signer(s), create the requirements, activate, notify. It is idempotent: before creating anything, it checks whether this business record already has a stored envelope id and, if so, does nothing. Wire it to the trigger point found in discovery only when discovery found one clear candidate; otherwise leave it as a function the developer calls, and say so in the report.
3. **A webhook endpoint**, in the project's own routing style, that: validates the HMAC per [webhooks.md](webhooks.md), responds `200` immediately, reads the event and the document or envelope id, and does the rest of the work idempotently (update the business record's status, download the signed file right away on `document_closed` since its URL is short-lived, update the status to canceled on `cancel`) either inline or through the project's existing background job mechanism.
4. **Configuration**: `CLICKSIGN_ACCESS_TOKEN`, `CLICKSIGN_WEBHOOK_SECRET`, and `CLICKSIGN_BASE_URL` (defaulting to sandbox) added to `.env.example` or the project's own configuration file, never to a committed value. The client refuses to run against a non-sandbox, non-explicitly-configured host unless the developer has explicitly set a production URL.
5. **Storage for the Clicksign ids**: if the business record needs to remember its `envelope_id`, `document_id`, and the ids of its signers, generate (do not apply) a database migration in the project's own migration format, adding nullable columns or a small related table. If the project has no migration system at all (a plain in-memory or ad hoc data structure), extend that structure directly instead, and say so in the report. Say in the report that a real migration still needs to run, when there is one.
6. **Offline tests**: using the project's test framework, with the HTTP layer faked (no real network call), covering: the send function builds the expected request sequence, the webhook handler accepts a validly signed payload and rejects a badly signed one, and the idempotency check short-circuits a repeat.

## What stays out, by default

- Commits, pushes, deploys, and applying the generated migration: the developer reviews with `git diff` and decides.
- Any dependency the project does not already have, unless there truly is no alternative; say so before adding one.
- Anything from [decisions.md](decisions.md)'s "ask" table that was not answered yet.
- Switching the integration from sandbox to production: that is a separate concern (its own skill, `promote-sandbox-to-clicksign-production`, covers it). This skill always targets sandbox by default and never flips that switch itself.

## Generate the access token

Always part of the report (see "Report template" below), not only something to mention while testing:

1. Create a free account at <https://sandbox.clicksign.com/signup> if the developer does not have one yet.
2. Sign in, go to **Configurações > API**.
3. Click **Gerar Access Token**, type a description, and click **Gerar**.
4. Copy the token now and keep it as secret as a login credential; it is not shown again in full.
5. On the same screen, associate the account's email with the API (**Salvar e-mail**) — without this step, API calls do not reach it.

Source: https://developers.clicksign.com/docs/access-token.md

## Register the webhook

Also always part of the report:

1. Check whether one is already registered: `GET {{BASE_URL}}/api/v3/webhooks`.
2. If not, register it: `POST {{BASE_URL}}/api/v3/webhooks` with `endpoint` set to the public URL that reaches the webhook route this skill built, `status: "active"`, and `events` set to the exact array this integration reads — by default `["document_closed", "refusal", "cancel"]`, not "all events" from the dashboard's event picker. Add `sign` or `upload` only if the generated code reads them too.
3. Copy `data.attributes.secret` from that response right away; a later plain `GET` does not show it again.

Registering through the account settings UI works too, and skips the API call, but still do step 1 first, so the account does not end up with two webhooks pointing at the same place.

Source: https://developers.clicksign.com/reference/api-criar-webhook.md, https://developers.clicksign.com/reference/api-listar-webhooks.md

## Sandbox test script

Run this after the code is in place, to prove it end to end. Steps 1 and 2 are the same two sections above; do them once and reuse the result.

1. **Sandbox account and token.** See "Generate the access token" above.
2. **Webhook URL.** See "Register the webhook" above. Before a public URL exists, use a disposable inspection URL (`webhook.site`) or a tunnel (`ngrok`) to see the raw payload first.
3. **Run the send function** against a business record with the developer's own mailbox as the signer's email, so they can actually receive and open the signature request.
4. **Sign it** in the browser, with the fictitious CPF the flow used.
5. **Confirm the webhook arrived**: a valid `Content-Hmac`, the expected event name, and the business record updated.
6. **Confirm the signed file is reachable**: either `downloads.signed_file_url` from the webhook payload, or `links.files.original` from a `GET` on the document, per [flows.md](flows.md).

Source: https://developers.clicksign.com/docs/access-token.md, https://developers.clicksign.com/docs/primeiros-passos.md, https://developers.clicksign.com/docs/veja-como-funciona-na-prática.md

## Report template

Every report ends with the "Only you can do this" section, in full, with its three numbered step groups filled in for this project — the exact steps from "Generate the access token" and "Register the webhook" above, plus where to put the result. This holds even when the rest of the report is short (a single self-contained module, or no repository at all): the developer always needs these three things to actually use what was built. Never skip or shorten this block.

````
## What I understood
<stack, the entity that became the document, who signs, the trigger point>

## Decisions
<each decision, its value, the source page, and the one line to change it>

## Questions you answered
<each question and the answer used>

## What I built
<files added or changed, in the project's own paths>

## How to run it
<test command>

## Only you can do this

### 1. Generate the access token
<the five numbered steps from "Generate the access token" above, as given>

### 2. Register the webhook
<the three numbered steps from "Register the webhook" above, with the real endpoint URL and event names for this project>

### 3. Put them in your app
Add to <the project's .env file or configuration path found in discovery>:
```
CLICKSIGN_ACCESS_TOKEN=<the token from step 1>
CLICKSIGN_WEBHOOK_SECRET=<the secret from step 2>
CLICKSIGN_BASE_URL=https://sandbox.clicksign.com
```
Never commit these values. `.env.example` (or the project's equivalent) only documents the variable names, with no real value.
````

