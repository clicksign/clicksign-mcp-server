# No direct equivalent: limitation and alternative

When the code uses one of these, explain the difference, give the alternative and state what the developer loses or must decide. Never suggest keeping the call on 1.9 as the solution.

## Sign through the API (`POST /api/v1/sign`)

- **1.9:** the application decides when to sign. Signer with `auths: ["api"]`, a `secret` delivered by Clicksign after an authorization term, and a call with `request_signature_key` + `secret_hmac_sha256`.
- **3.0:** there is no `/sign` endpoint. Use automatic signature: request the term once with `POST /api/v3/auto_signature/terms`; the account admin and the signer sign it. In each envelope, create the signer with exactly the same `name`, `email`, `documentation` and `birthday` as the term, and an authentication requirement `auth: auto_signature`. The API validates the term when the requirement is created.
- **Limitations:** the signature happens automatically when the envelope reaches the signer's `group`, not when the application calls an endpoint. To control the moment, put the signer in a later `group` or activate the envelope only when it should sign. Only accounts registered as a company (pessoa jurídica) with company data filled in. Not combinable with in-person signature. The HMAC secret code is removed. If the sandbox account answers `403` to the term or to `auth: auto_signature`, ask Clicksign before changing the approach.
- Sources: https://developers.clicksign.com/docs/comparativo-tecnico.md, https://developers.clicksign.com/docs/assinatura-automatica.md, https://developers.clicksign.com/reference/api-criar-termo.md, https://developers.clicksign.com/docs/introducao-a-assinatura-presencial.md

## Batch (`POST /api/v1/batches`)

- **1.9:** groups up to 500 documents for one `signer_key` and returns one `request_signature_key` for a single signing session. The 1.9 API also updates a batch and appends documents to it (`PATCH /api/v1/batches/{key}`, `PUT /api/v1/batches/{key}/append`), which the 1.9 pages in `sources.md` do not list.
- **3.0:** build one envelope with all documents and create the requirements for that signer on each document. Use `bulk_requirements` to create many requirements in one call.
- **Limitations:** no API endpoint groups documents that were already sent in separate envelopes. The migration overview lists a logged-out bulk signing that lets signers sign documents from separate envelopes at once, but describes no API call for it; confirm with Clicksign before relying on it. Size limits: 10 MB per file, 100 MB per envelope. No document count limit is documented, so validate large batches in sandbox. If the 1.9 code created batches from documents produced at different times, the developer has to change when the envelope is built.
- Sources: https://developers.clicksign.com/v1.0/docs/criar-lote.md, https://developers.clicksign.com/reference/bulk-requirements.md, https://developers.clicksign.com/docs/faq-duvidas-e-problemas-comuns.md, https://developers.clicksign.com/docs/migracao-da-api-19-para-30.md

## Delete a finished or canceled document

- **1.9:** `DELETE /api/v1/documents/{key}` removes a closed or canceled document.
- **3.0:** delete endpoints work only while the envelope is `draft` (`403 "envelope não está com status draft"` otherwise).
- **Limitation:** there is no API deletion for a closed or canceled document, and its status cannot change anymore (`422 "documento não pode ser cancelado"`). Handle retention outside the API. Canceling is an alternative only for documents still `running`.
- Sources: https://developers.clicksign.com/reference/api-excluir-documento.md, https://developers.clicksign.com/reference/api-excluir-envelope.md, https://developers.clicksign.com/reference/editar-documento.md

## Cancel the whole process

- **1.9:** one call per document, `PATCH /api/v1/documents/{key}/cancel`.
- **3.0:** no cancel on the envelope. Cancel each `running` document with `PATCH .../documents/{document_id}` and `status: canceled`. An envelope can be deleted only in `draft`.
- Sources: https://developers.clicksign.com/docs/comparativo-tecnico.md, https://developers.clicksign.com/reference/editar-documento.md, https://developers.clicksign.com/reference/api-excluir-envelope.md

## Reusing signers and the contact list

- **1.9:** a signer is created once (`POST /api/v1/signers`) and its `key` is reused in any document; `GET /api/v2/signers` and `GET /api/v2/contacts` list them for the account.
- **3.0:** signers are created inside each envelope and cannot be edited. The 3.0 reference has no account-wide signer or contact listing.
- **Alternative:** keep the signer data in the developer's own database and create the signer in each envelope. Drop any code that stores 1.9 signer keys for reuse.
- Sources: https://developers.clicksign.com/v1.0/docs/criar-signatario.md, https://developers.clicksign.com/v1.0/docs/visualizar-todos-os-signatários.md, https://developers.clicksign.com/v1.0/docs/listar-contatos-da-agenda.md, https://developers.clicksign.com/docs/signatarios.md

## Notification with a custom link (`url`)

- **1.9:** `POST /api/v1/notifications` accepts `url`, sent in the email (for example a page with the Widget).
- **3.0:** the documented notification attributes are `message` and `email_customization`; no `url` field is documented.
- **Alternative:** if the signer must land on the developer's page, send that link through the developer's own channel and use the Widget with the signer id, or set `communicate_events.signature_request: none` and notify outside Clicksign. Confirm with the developer which experience they need.
- Sources: https://developers.clicksign.com/v1.0/docs/solicitar-assinatura-por-email.md, https://developers.clicksign.com/reference/notificacao-campos-e-regras-de-negocio.md

## Notification rules

- **1.9:** the code requests each signature on demand through its `request_signature_key`; the 1.9 pages document no per-minute notification limit.
- **3.0:** only signers of the active `group` can be notified, the envelope must be `running`, and each endpoint accepts 1 notification per minute. Later groups are notified automatically when their turn comes.
- Sources: https://developers.clicksign.com/docs/notificacoes.md, https://developers.clicksign.com/reference/api-notificacoes.md, https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md

## Editing a signer

- **1.9:** the signer exists on its own; it can be removed from a document (`DELETE /api/v1/lists/{key}`) and added again.
- **3.0:** a signer cannot be changed after it is created. Delete it (only if it has not started signing) and create a new one; in a `running` envelope, its requirements go through `bulk_requirements`.
- Sources: https://developers.clicksign.com/v1.0/docs/remover-signatario-de-documeto.md, https://developers.clicksign.com/v1.0/docs/adicionar-signatario-a-documento.md, https://developers.clicksign.com/docs/signatarios.md, https://developers.clicksign.com/reference/api-excluir-signatario.md

## `sign_as` values missing from the 3.0 docs

Two values of the 1.9 list are not in the documented 3.0 qualification roles: `condominium_member` and `signed`. The same applies to any other `sign_as` value the code sends that is not in the documented 3.0 list. Do not map them on your own: ask the developer to confirm with Clicksign that the value is accepted in 3.0, or to choose a role from the documented list.

Sources: https://developers.clicksign.com/v1.0/docs/adicionar-signatario-a-documento.md, https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md

## In-person signature: token sent to the signer

- **1.9:** `POST /api/v1/send_presential_signature_request/email` lets the code choose `recipient: signer` or `signature_host` and customize every text block. `POST /api/v1/send_presential_signature_request/sms` sends the token to the signer by SMS. The 1.9 API also accepts `POST /api/v1/send_presential_signature_request` (email to the host) and `GET /api/v1/sign_presential_url` (signing URL for a token), which the 1.9 pages in `sources.md` do not list.
- **3.0:** the documented flow emails the token to the host set in `signature_host` when the notification is sent, after activation; the documented notification customization is `email_customization`. Sending the token to the signer, by email or SMS, and looking up a signing URL from the token are not documented.
- **Alternative:** in the documented 3.0 flow the host is present at the signature and the signer enters the token there. If the 1.9 flow sent the token to the signer, ask the developer whether that works for the business, and confirm with Clicksign before promising another channel.
- Sources: https://developers.clicksign.com/v1.0/docs/notificacao-da-assinatura-presencial-por-e-mail.md, https://developers.clicksign.com/v1.0/docs/notificacao-da-assinatura-presencial-por-sms.md, https://developers.clicksign.com/reference/fluxo-completo-da-assinatura-presencial.md

## No-token Widget (`auths: ["tokenless"]`)

- **1.9:** beta, closed to new customers, `tokenlessWidget.js`.
- **3.0:** `auth: embedded_signature` and the `noWidget` client from Clicksign's `embedded-test` repository, started with the signer id. It runs without an iframe.
- Sources: https://developers.clicksign.com/v1.0/docs/instalacao-do-widget-assinatura-sem-token.md, https://developers.clicksign.com/v1.0/docs/implementacao-teste-tokenless.md, https://developers.clicksign.com/docs/instalacao-de-widget-assinatura-tokenless.md, https://developers.clicksign.com/docs/assinatura-incorporada-implementacoes-e-testes.md

## Clicksign operator calls

`POST /api/v1/accounts`, `POST /api/v1/accounts/create_subscription`, `POST /api/v1/accounts/{id}/functionalities/{code}/denieds` and `/api/v1/admin_users` are not in the 1.9 pages and answer `403` unless the token belongs to a Clicksign operator. The 3.0 reference has no account creation or subscription endpoint. If the code calls them, do not map them: ask Clicksign.

## Version detection pitfall

`/api/v1` is also used by current Clicksign products on their own hosts (ClickFlow, ClickForm, acceptance and notification modules). Only `/api/v1` and `/api/v2` on `app.clicksign.com` or `sandbox.clicksign.com` are API 1.9. Do not migrate calls to other hosts.

Sources: https://developers.clicksign.com/docs/informacoes-gerais.md, https://developers.clicksign.com/docs/descubra-sua-versao-da-api.md
