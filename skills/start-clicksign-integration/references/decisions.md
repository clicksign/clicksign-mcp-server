# Decision rule: what to decide versus what to ask

## The rule

Decide silently when all three hold:

1. The official documentation defines a pattern or names a recommended practice for the setting.
2. The choice is reversible: it lives in sandbox, in a `draft` envelope, or in configuration, not in something already sent to a real signer.
3. It does not change who signs, with what proof, or what a real person receives (channel, cost, or the content of a message).

Otherwise, ask, once, in a short batch, with a suggested default so the developer can answer "ok". A decision without a documentation source listed below is a question, never a silent default: see [limits.md](limits.md) for what the documentation does not cover.

Every decision made this way goes into the final report, with the value used, the source page, and the one line to change to override it.

## Decide silently

| Decision | Default used | Source |
|---|---|---|
| `locale` | `pt-BR` or `en-US` only. Use the codebase language when it is already one of those two (treat `pt` as `pt-BR` and `en` as `en-US`); any other language, including one with no evident language, sends `pt-BR` | https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md |
| `auto_close` | `true` (close the envelope once every requirement is met) | https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md |
| `block_after_refusal` | `true` (one refusal blocks the rest of the flow) | https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md |
| `remind_interval` | `3` (the documented default; send it explicitly instead of omitting it) | https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md |
| `deadline_at` | +30 days from send, unless the discovery scan finds an existing deadline field to reuse | https://developers.clicksign.com/docs/aproveitamento-de-assinaturas-parciais-em-documentos-expirados.md |
| `deadline_partial_signature_action` | `closed` (the documented default: keep partial signatures instead of invalidating them) | https://developers.clicksign.com/docs/aproveitamento-de-assinaturas-parciais-em-documentos-expirados.md |
| Signer `group` | Never send it. The server assigns it on its own (`1` while there is no sequence, otherwise the highest group plus one); the value sent at creation is ignored, and sending it while the envelope is `running` answers `400`. See [limits.md](limits.md) if the business genuinely needs sequential signing order. | https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md |
| Minimum authentication requirement | `email`, the lowest-friction documented type, for a signer with no stated authentication need | https://developers.clicksign.com/docs/tipos-de-requisitos-de-autenticacao.md |
| Qualification role when only one party type exists | `sign`, the plain, general-purpose role | https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md |
| `communicate_events.signature_request` | `email`, unless the discovery scan or an answered question says otherwise | https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md |
| Which webhook events to subscribe to | At least `document_closed` (or `close`), `refusal`, and `cancel`, regardless of whether the generated code's own flow ever cancels anything: an envelope can be canceled outside the application (dashboard, support), and the stored state should still reflect it. Add `upload`, `sign` only if the flow reads them. | https://developers.clicksign.com/docs/eventos.md |
| Downloading the signed file | Immediately, when `document_closed` arrives, instead of only storing `downloads.signed_file_url`: it is a short-lived signed URL (confirmed in sandbox testing, consistent with the ~5-minute validity documented for the analogous `links.files.original` field), not a permanent link | https://developers.clicksign.com/reference/api-listar-documentos.md |
| HMAC validation on the webhook | Always on, computed from the raw request body | https://developers.clicksign.com/docs/seguranca-de-webhooks.md |
| Webhook response | `200` immediately, with any slow work moved to a background job if the project already has one | https://developers.clicksign.com/docs/melhores-praticas-webhooks.md |
| Idempotency on the webhook handler and on the send function | Always on. The webhook deduplicates by the event's own id scoped to the document, or by a fingerprint of the verified event name plus the document id, and marks that event handled only after its side effects succeed, so a handled `sign` still lets a later `document_closed` download the signed file. The send function stores which step finished, resumes an incomplete send for that business record, returns immediately only when the send already completed, and runs one trigger at a time for the same record, so a retry never creates a second envelope | https://developers.clicksign.com/docs/integracao-resiliente.md |
| Retry on `429` | Exponential backoff with jitter, capped, waiting at least until `X-Rate-Limit-Reset` | https://developers.clicksign.com/docs/limite-de-requisicoes.md, https://developers.clicksign.com/docs/integracao-resiliente.md |
| Names, folders, and code style | Match the project's own conventions found in discovery | n/a, not a documentation choice |
| Where configuration lives | The project's existing convention, or `.env.example` if none | n/a, not a documentation choice |
| Test style | Offline, with the project's own test framework and a faked HTTP layer; never call sandbox from the automated test suite | n/a, not a documentation choice |
| Document customization in notification emails | Off (keep Clicksign's standard email) unless the discovery scan or an answer says the account already has it enabled | https://developers.clicksign.com/docs/customizar-notificacoes-por-email.md |

## Ask, with a suggested default

Ask about a row below only when the discovery scan actually leaves it open. When discovery already resolves it without ambiguity (for example, the entity has exactly one plausible signer, or a template id is already on it), skip the question: decide it, and state the resolved value and why in the report instead, the same way as a "decide silently" item above.

| Question | Why it cannot be decided silently | Suggested default to offer |
|---|---|---|
| Which event triggers the send, and which document(s) go in it | The business event is not in the documentation; guessing wrong sends the wrong thing to a real signer | The clearest single candidate found in discovery, stated as the default |
| Where the document's content comes from, when discovery finds no file, stored path, or template id on the entity (see [discovery.md](discovery.md)) | Uploading or templating the wrong content is not reversible once a real signer is notified; the documentation cannot say what the developer's document is | A template already in the developer's Clicksign account, if one plausibly fits; otherwise ask for a sample file to upload as a placeholder, to be replaced later |
| Who signs, with which role, and whether signing order matters | Changes who signs and in what order; not reversible once notified | One signer, role `sign`, single group, if discovery finds only one plausible signer entity |
| Any channel beyond email (SMS, WhatsApp) or an authentication billed per check (biometrics, `pix`, `icp_brasil`) | Costs money or reaches a person by a channel the documentation does not let you assume | Email only, the lowest-cost documented default |
| Deadline, refusal and cancellation business rules | Business policy, not an API default | The decide-silently defaults above, offered as the starting point |
| A change to an existing database column, model, or behaviour already in the code | Could break something that works today | The smallest addition that does not touch existing columns (a new table or a new nullable column) |
| Rubric (handwritten or initials) as an extra requirement | Optional, changes the signing experience | Off, unless discovery finds an existing rubric requirement in the client's current signing flow |
| Anything this skill's documentation does not cover | No source to decide from, see [limits.md](limits.md) | None; say what needs checking and, if useful, who to ask (Clicksign support) |

## Signer and document count

When discovery finds more than one plausible document or more than one plausible signer entity for the same trigger, ask which ones belong together instead of guessing a pairing. When discovery finds exactly one of each, proceed and list the assumption in the report.

