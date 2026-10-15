# No direct equivalent: limitation and alternative

When the code uses one of these, explain the difference, give the alternative and state what the developer loses or must decide. Never suggest keeping the call on 1.9 as the solution.

## Sign through the API (`POST /api/v1/sign`)

- **1.9:** the application decides when to sign. Signer with `auths: ["api"]`, a `secret` delivered by Clicksign after an authorization term, and a call with `request_signature_key` + `secret_hmac_sha256`.
- **3.0:** there is no `/sign` endpoint. Use automatic signature: request the term once with `POST /api/v3/auto_signature/terms`; the account admin and the signer sign it. In each envelope, create the signer with exactly the same `name`, `email`, `documentation` and `birthday` as the term, and an authentication requirement `auth: auto_signature`. The API validates the term when the requirement is created.
- **Limitations:** the signature happens automatically when the envelope reaches the signer's `group`, not when the application calls an endpoint. To control the moment, put the signer in a later `group` or activate the envelope only when it should sign. Only accounts registered as a company (pessoa jurídica) with company data filled in. Not combinable with in-person signature. The HMAC secret code is removed.
- Sources: https://developers.clicksign.com/docs/comparativo-tecnico.md, https://developers.clicksign.com/docs/assinatura-automatica.md, https://developers.clicksign.com/reference/api-criar-termo.md

## Batch (`POST /api/v1/batches`)

- **1.9:** groups up to 500 already running documents for one `signer_key` and returns one `request_signature_key` for a single signing session.
- **3.0:** build one envelope with all documents and create the requirements for that signer on each document. Use `bulk_requirements` to create many requirements in one call.
- **Limitations:** documents must be added while the envelope is `draft`; there is no way to group documents that were already sent in separate envelopes. Size limits: 10 MB per file, 100 MB per envelope. No document count limit is documented, so validate large batches in sandbox. If the 1.9 code created batches from documents produced at different times, the developer has to change when the envelope is built.
- Sources: https://developers.clicksign.com/v1.0/docs/criar-lote.md, https://developers.clicksign.com/reference/bulk-requirements.md, https://developers.clicksign.com/docs/faq-duvidas-e-problemas-comuns.md

## Duplicate document

- **1.9:** `POST /api/v1/documents/{key}/duplicate` creates a new running document from the **signed** file of a closed document.
- **3.0:** `POST /api/v3/envelopes/{id}/documents` with `filename` and `duplicate: {key: <document id>}` into a `draft` envelope. The source must be closed, and the copy takes the **unsigned** content.
- **Limitation:** the 3.0 copy does not carry the previous signatures. If the 1.9 flow relied on that (for example adding a new party on top of a signed contract), ask the developer what the business needs: a fresh signature round of the original, or the signed PDF uploaded as a new document (`content_base64`).
- Sources: https://developers.clicksign.com/v1.0/docs/duplicar-documento.md, https://developers.clicksign.com/docs/documentos.md

## Delete a finished or canceled document

- **1.9:** `DELETE /api/v1/documents/{key}` removes a closed or canceled document.
- **3.0:** delete endpoints work only while the envelope is `draft` (`403 "envelope não está com status draft"` otherwise).
- **Limitation:** there is no API deletion for a closed or canceled document, and its status cannot change anymore (`422 "documento não pode ser cancelado"`). Handle retention outside the API. Canceling is an alternative only for documents still `running`.
- Sources: https://developers.clicksign.com/reference/api-excluir-documento.md, https://developers.clicksign.com/reference/api-excluir-envelope.md, https://developers.clicksign.com/reference/editar-documento.md

## Cancel the whole process

- **1.9:** one call per document, `PATCH /api/v1/documents/{key}/cancel`.
- **3.0:** no cancel on the envelope. Cancel each `running` document with `PATCH .../documents/{document_id}` and `status: canceled`. An envelope can be deleted only in `draft`.
- Source: https://developers.clicksign.com/docs/comparativo-tecnico.md

## Reusing signers and the contact list

- **1.9:** a signer is created once (`POST /api/v1/signers`) and its `key` is reused in any document; `GET /api/v2/signers` and `GET /api/v2/contacts` list them for the account.
- **3.0:** signers are created inside each envelope and cannot be edited. The 3.0 reference has no account-wide signer or contact listing.
- **Alternative:** keep the signer data in the developer's own database and create the signer in each envelope. Drop any code that stores 1.9 signer keys for reuse.

## Notification with a custom link (`url`)

- **1.9:** `POST /api/v1/notifications` accepts `url`, sent in the email (for example a page with the Widget).
- **3.0:** the documented notification attributes are `message` and `email_customization`; no `url` field is documented.
- **Alternative:** if the signer must land on the developer's page, send that link through the developer's own channel and use the Widget with the signer id, or set `communicate_events.signature_request: none` and notify outside Clicksign. Confirm with the developer which experience they need.
- Sources: https://developers.clicksign.com/v1.0/docs/solicitar-assinatura-por-email.md, https://developers.clicksign.com/reference/notificacao-campos-e-regras-de-negocio.md

## Notifying a signer outside its turn

- **1.9:** any `request_signature_key` can be notified at any time.
- **3.0:** only signers of the active `group` can be notified, the envelope must be `running`, and each endpoint accepts 1 notification per minute. Later groups are notified automatically when their turn comes.
- Source: https://developers.clicksign.com/docs/notificacoes.md

## Editing a signer

- **1.9:** the signer exists on its own; it can be removed from a document (`DELETE /api/v1/lists/{key}`) and added again.
- **3.0:** a signer cannot be changed after it is created. Delete it (only if it has not started signing) and create a new one; in a `running` envelope, its requirements go through `bulk_requirements`.
- Source: https://developers.clicksign.com/docs/signatarios.md

## `sign_as` values missing in 3.0

`condominium_member` and `signed` exist in the 1.9 list but not in the 3.0 qualification roles. Ask the developer which listed `role` fits (for example `resident`, `owner` or `sign`) instead of guessing.

Source: https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md

## In-person signature: email to the signer

- **1.9:** `POST /api/v1/send_presential_signature_request/email` lets the code choose `recipient: signer` or `signature_host` and customize every text block.
- **3.0:** the host set in `signature_host` receives the token by email after activation; the documented notification customization is `email_customization`. Sending the token directly to the signer is not documented.
- Source: https://developers.clicksign.com/reference/fluxo-completo-da-assinatura-presencial.md

## No-token Widget (`auths: ["tokenless"]`)

- **1.9:** beta, closed to new customers, `tokenlessWidget.js`.
- **3.0:** `auth: embedded_signature` and the `noWidget` client from Clicksign's `embedded-test` repository, started with the signer id. It runs without an iframe.
- Source: https://developers.clicksign.com/docs/assinatura-incorporada-implementacoes-e-testes.md

## Version detection pitfall

`/api/v1` is also used by current Clicksign products on their own hosts (ClickFlow, ClickForm, acceptance and notification modules). Only `/api/v1` and `/api/v2` on `app.clicksign.com` or `sandbox.clicksign.com` are API 1.9. Do not migrate calls to other hosts.

Source: https://developers.clicksign.com/docs/informacoes-gerais.md
