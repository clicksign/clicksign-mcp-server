# Delivery: what this skill generates, and the sandbox test script

Everything here is generated in the project's own language, style, and test framework, per [discovery.md](discovery.md). Keep the project's existing structure (services, clients, error handling); add only what the integration needs.

## What goes into the repository

1. **A thin Clicksign client**: base URL from configuration (default `https://sandbox.clicksign.com`), the `Authorization`, `Content-Type` and `Accept` headers from [concepts.md](concepts.md), a small JSON:API body helper, and backoff-with-jitter on `429` per [flows.md](flows.md). Reuse the project's existing HTTP client library instead of adding a new one.
2. **One send function** that runs the whole flow in [flows.md](flows.md) for one business record: create the envelope, add the document(s), add the signer(s), create the requirements, activate, notify. It is idempotent: before creating anything, it checks whether this business record already has a stored envelope id and, if so, does nothing. Wire it to the trigger point found in discovery only when discovery found one clear candidate; otherwise leave it as a function the developer calls, and say so in the report.
3. **A webhook endpoint**, in the project's own routing style, that: validates the HMAC per [webhooks.md](webhooks.md), responds `200` immediately, reads the event and the document or envelope id, and does the rest of the work idempotently (update the business record's status, store the signed file link) either inline or through the project's existing background job mechanism.
4. **Configuration**: `CLICKSIGN_ACCESS_TOKEN`, `CLICKSIGN_WEBHOOK_SECRET`, and `CLICKSIGN_BASE_URL` (defaulting to sandbox) added to `.env.example` or the project's own configuration file, never to a committed value. The client refuses to run against a non-sandbox, non-explicitly-configured host unless the developer has explicitly set a production URL.
5. **Storage for the Clicksign ids**: if the business record needs to remember its `envelope_id`, `document_id`, and the ids of its signers, generate (do not apply) a database migration in the project's own migration format, adding nullable columns or a small related table. Say in the report that it still needs to run.
6. **Offline tests**: using the project's test framework, with the HTTP layer faked (no real network call), covering: the send function builds the expected request sequence, the webhook handler accepts a validly signed payload and rejects a badly signed one, and the idempotency check short-circuits a repeat.

## What stays out, by default

- Commits, pushes, deploys, and applying the generated migration: the developer reviews with `git diff` and decides.
- Any dependency the project does not already have, unless there truly is no alternative; say so before adding one.
- Anything from [decisions.md](decisions.md)'s "ask" table that was not answered yet.

## Sandbox test script

Run this after the code is in place, to prove it end to end:

1. **Sandbox account and token.** Create a free account at the sandbox signup page if the developer does not have one, generate an access token, and associate the developer's own email with the API, per the sandbox page. Put the token in local configuration; never in a prompt, a log, or a committed file.
2. **Webhook URL.** Expose the local handler on a public URL (a tunnel, or a disposable inspection URL first, to see the raw payload before wiring real logic to it) and register it, or confirm one is already registered with `GET /webhooks`.
3. **Run the send function** against a business record with the developer's own mailbox as the signer's email, so they can actually receive and open the signature request.
4. **Sign it** in the browser, with the fictitious CPF the flow used.
5. **Confirm the webhook arrived**: a valid `Content-Hmac`, the expected event name, and the business record updated.
6. **Confirm the signed file is reachable**: either `downloads.signed_file_url` from the webhook payload, or `links.files.original` from a `GET` on the document, per [flows.md](flows.md).

Source: https://developers.clicksign.com/docs/access-token.md, https://developers.clicksign.com/docs/primeiros-passos.md, https://developers.clicksign.com/docs/veja-como-funciona-na-prática.md

## Report template

```
## What I understood
<stack, the entity that became the document, who signs, the trigger point>

## Decisions
<each decision, its value, the source page, and the one line to change it>

## Questions you answered
<each question and the answer used>

## What I built
<files added or changed, in the project's own paths>

## How to run it
<test command, and the sandbox script above>

## Only you can do this
<put the real token and the webhook secret in your configuration; expose a public URL for the webhook in sandbox; apply the generated migration if there is one>
```
