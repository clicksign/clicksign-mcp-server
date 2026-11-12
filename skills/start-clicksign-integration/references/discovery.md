# Discovery: read before you ask

A read-only pass over the repository before any question or any edit. The goal is to answer, from the code, everything that does not need the developer, and to narrow the business questions to what is genuinely open.

## What to look for

| Signal | Where to look | What it decides |
|---|---|---|
| Language and framework | Dependency manifest (`package.json`, `go.mod`, `requirements.txt`, `pom.xml`, `Gemfile`, `composer.json`), entry point | The language of the generated code and its idioms |
| HTTP client already in use | Imports and dependencies (`axios`, `fetch`, `net/http`, `requests`, `Faraday`, `HttpClient`, `Guzzle`) | Reuse it for the Clicksign client instead of adding a dependency |
| Configuration convention | `.env.example`, `config/`, a settings module or class, how other API keys are read | Where `CLICKSIGN_ACCESS_TOKEN`, the host and the webhook secret are read from |
| Contract or document entity | Models or tables named `contract`, `document`, `agreement`, `proposal`, or similar; the fields that already hold a date, a status or a PDF | What the envelope and the document represent in the client's domain |
| Document content source | A file field, a stored PDF path, a blob/object-storage reference, or a saved template id on that entity | Whether the generated code uploads an existing file, fills in a template, or has no source at all yet |
| People who sign | Models for `customer`, `user`, `member`, `tenant`, `partner`, with name, email, phone or CPF fields | The signer payload, and whether CPF or phone is already collected |
| Trigger point | Where the contract or document entity changes status, a controller action, a queued job, a form submission handler | Where the send function gets called from |
| Routes and endpoint style | Router or controller files, URL and response conventions already in place | Where the webhook endpoint goes and how it should look |
| Background jobs or queues | A job/worker framework, a queue library, a scheduler | Whether the webhook handler should enqueue work instead of processing inline |
| Persistence | ORM or query layer, migration folder and its naming convention | How to generate (not apply) a migration for the stored Clicksign ids |
| Test framework | Test folder, test runner config, existing HTTP mocks | How to write the offline tests for the new code |
| PDF generation | A PDF library or a template renderer already in the codebase | Whether the document is generated locally or already stored and only needs upload |

If the entity found for "Contract or document entity" has none of the signals in "Document content source" (no file field, no stored path, no template id anywhere in the code), the document's origin is an open question, not something to assume: add it to the question batch in [decisions.md](decisions.md) instead of guessing an upload or a template.

End the scan with a short "here is what I understood" summary: stack, the entity that will become the document, who signs, where the send is triggered from, and whether webhooks or background jobs already exist. The developer corrects it instead of you guessing further.

## Reading secrets

Read only variable *names*, never values: `.env.example`, a `config/*.yml` or `settings.py` schema, or how an existing API key is referenced in code. Never open `.env`, a secrets file, a keychain, or a deployed configuration. If the project has no configuration convention yet, add `CLICKSIGN_ACCESS_TOKEN` (and, if the webhook needs it, `CLICKSIGN_WEBHOOK_SECRET`, see [webhooks.md](webhooks.md)) to a new or existing `.env.example`, matching the style already in the project.

## No repository, or only pasted functions

If the task has no repository to scan, or the developer only pasted one or more functions:

1. Ask only language and framework (the minimum the fallback above cannot read from anywhere).
2. Deliver a single, self-contained module: the Clicksign client, the send function, and the webhook handler as one file or one small set of files with no assumed project structure, plus the sandbox test script from [delivery.md](delivery.md).
3. Still apply the decision rule from [decisions.md](decisions.md): decide what the documentation settles, and ask the same short batch of business questions before writing the send function.

## Signs of an existing 1.9 integration

Stop and point to the migration skill instead of continuing here when the code already has: a call to `/api/v1` or `/api/v2`, `access_token` in a query string, JSON roots named `document`, `signer`, `list` or `batch`, or fields such as `request_signature_key`, `signer_key`, `list_key`, `sign_as`, `auths` or `secret_hmac_sha256`. This skill builds only new integrations; it does not touch or extend 1.9 code.
