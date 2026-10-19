# Endpoint and field map: API 1.9 to API 3.0

Base paths: 1.9 is `https://{host}/api/v1` (and some `/api/v2`), 3.0 is `https://{host}/api/v3`. Hosts are the same: `https://sandbox.clicksign.com` and `https://app.clicksign.com`. Each row cites the 3.0 page to fetch for exact payloads; the 1.9 pages are listed in `sources.md`.

## Transport

| Topic | API 1.9 | API 3.0 | Source (3.0) |
|---|---|---|---|
| Access token | Query string `?access_token={{CLICKSIGN_ACCESS_TOKEN}}` | Header `Authorization: {{CLICKSIGN_ACCESS_TOKEN}}`, the token alone, no `Bearer` prefix | https://developers.clicksign.com/docs/ambientes-autenticacao-e-formato.md |
| Headers | `Content-Type` and `Accept: application/json` | `Content-Type` and `Accept: application/vnd.api+json` | same |
| Request body | Root named after the resource: `{"document": {...}}`, `{"signer": {...}}`, `{"list": {...}}` | `{"data": {"type": "<plural>", "attributes": {...}, "relationships": {...}}}`; PATCH also sends `data.id` | https://developers.clicksign.com/reference/api-criar-envelope.md |
| IDs | `key` (e.g. `document.key`, `signer.key`, `list.key`) | `data.id` (UUID) | same |
| Pagination | `?page=N`, 30 per page, `page_infos` object | `?page[number]=N&page[size]=M`, `links.next`/`prev`, `meta.record_count` | https://developers.clicksign.com/docs/gerenciamento-consultas-envelope.md |
| Filters | None documented on lists | `filter[status]`, `filter[name]` (full name), `filter[created]`, `filter[modified]`, `filter[deadline_at]`, `sort=name` / `-name` | https://developers.clicksign.com/reference/api-listar-envelopes.md |
| Errors | `{"errors": ["<message>"]}` | `{"errors": [{"code", "status", "title", "detail", "source": {"pointer": "/data/attributes/<field>"}}]}` | https://developers.clicksign.com/docs/mensagens-de-erro.md |
| Rate limit | Per account, `429` when exceeded | Per account, `429` when exceeded, with `X-Rate-Limit-Remaining` and `X-Rate-Limit-Reset` (Unix time, UTC) on responses. Do not size the client by a fixed request rate: on `429`, retry with exponential backoff and jitter, wait at least until `X-Rate-Limit-Reset`, and cap the attempts. Before retrying a create that timed out, check that the resource was not already created. Notifications: 1 per minute per endpoint. Polling not allowed: use webhooks | https://developers.clicksign.com/docs/limite-de-requisicoes.md, https://developers.clicksign.com/docs/integracao-resiliente.md |
| Account readiness | n/a | Envelope API is enabled for accounts created from 01/07/2024; older accounts get `503 service_unavailable` and must contact support | https://developers.clicksign.com/docs/mensagens-de-erro.md |

JSON:API client libraries recommended by Clicksign (any language): see https://developers.clicksign.com/docs/comparativo-tecnico.md. Plain HTTP with the headers above also works.

## Endpoints

Rows marked **Undocumented 1.9** are calls the 1.9 API accepts but that are missing from the 1.9 pages listed in `sources.md`. They are here only to recognize and migrate existing code.

The 1.9 API also routes some calls under the other prefix (for example `PATCH` and `DELETE /api/v2/documents/{key}`, `POST /api/v2/signers`, `GET /api/v2/signers/{key}`, `GET /api/v1/signers`, `DELETE /api/v1/signers/{key}`) and accepts `PUT` where the docs show `PATCH`. Map them like the documented call.

| API 1.9 | API 3.0 | Notes | Source (3.0) |
|---|---|---|---|
| `GET /api/v1/accounts` (test the token) | `GET /api/v3/envelopes` | No account endpoint in the 3.0 reference; listing envelopes validates the token | https://developers.clicksign.com/docs/primeiros-passos.md |
| `POST /api/v1/documents` (upload) | `POST /api/v3/envelopes`, then `POST /api/v3/envelopes/{id}/documents` | Settings go to the envelope, the file to the document. Field map below | https://developers.clicksign.com/reference/api-upload-documentos.md |
| `POST /api/v1/documents` with `signers[]` inside `document` | Envelope and document as above, then `POST .../signers`, requirements, activation, and a notification for each signer whose `send_email` is not `false` | **Undocumented 1.9.** One call creates the document, its signers and their lists, and notifies them. Each item carries signer fields (`name`, `email`, `phone_number`, `documentation`, `birthday`, `has_documentation`, `auths`, `delivery`), list fields (`sign_as`, `refusable`), `send_email` (required on every item) and `message`. Map them with the tables below; see `flows.md` | https://developers.clicksign.com/docs/guia-de-criacao-o-passo-a-passo-padrao.md |
| `POST /api/v1/templates/{key}/documents` | `POST /api/v3/envelopes/{id}/documents` with `template: {key, data}` | `filename` ends in `.docx` | https://developers.clicksign.com/reference/criar-documento-por-modelo.md |
| `POST /api/v2/templates` (multipart) | `POST /api/v3/templates` (JSON:API, `name`, `content_base64` of the `.docx`, `color`) | Content cannot be edited later: delete and create again | https://developers.clicksign.com/reference/api-criar-modelo.md |
| `GET /api/v2/templates` | `GET /api/v3/templates` | `403` if the plan has no templates | https://developers.clicksign.com/reference/api-listar-modelos.md |
| `GET`, `PATCH`, `DELETE /api/v2/templates/{key}`; `POST /api/v2/templates/{key}/documents` | `GET`, `PATCH`, `DELETE /api/v3/templates/{id}`; documents as in the `/api/v1/templates/{key}/documents` row | **Undocumented 1.9.** In 3.0 only `name` and `color` change through `PATCH`; the content cannot | https://developers.clicksign.com/reference/api-visualizar-modelo.md, https://developers.clicksign.com/reference/api-editar-modelo.md, https://developers.clicksign.com/reference/api-excluir-modelo.md |
| `GET /api/v1/documents/{key}` | `GET /api/v3/envelopes/{id}`, `.../documents/{document_id}`, `.../signers`, `.../requirements` | The document no longer embeds signers and events. Events: `GET .../documents/{document_id}/events` | https://developers.clicksign.com/reference/detalhes-do-documento.md |
| `GET /api/v1/documents?page=N` | `GET /api/v3/envelopes` with filters, then `GET .../documents` per envelope | No account-wide document listing | https://developers.clicksign.com/reference/api-listar-envelopes.md |
| `PATCH /api/v1/documents/{key}` (settings) | `PATCH /api/v3/envelopes/{id}` | Settings are per envelope, not per document | https://developers.clicksign.com/reference/api-editar-envelope.md |
| `PATCH /api/v1/documents/{key}/finish` | `PATCH /api/v3/envelopes/{id}/documents/{document_id}` with `status: closed` | Only for `running` documents | https://developers.clicksign.com/reference/editar-documento.md |
| `PATCH /api/v1/documents/{key}/cancel` | `PATCH /api/v3/envelopes/{id}/documents/{document_id}` with `status: canceled` | Per document; there is no cancel on the envelope | https://developers.clicksign.com/reference/editar-documento.md |
| `POST /api/v1/documents/{key}/duplicate` | `POST /api/v3/envelopes/{id}/documents` with `filename` and `duplicate: {key: <document id>}` | The source must be closed. As in 1.9, the copy is a new document without the previous signatures. Run one duplicate in sandbox on the account that will use it before relying on it; if the API rejects `duplicate`, ask Clicksign before changing the approach | https://developers.clicksign.com/reference/api-duplicar-documento.md |
| `DELETE /api/v1/documents/{key}` | `DELETE /api/v3/envelopes/{id}/documents/{document_id}` or `DELETE /api/v3/envelopes/{id}` | Only in `draft`, see `no-equivalent.md` | https://developers.clicksign.com/reference/api-excluir-documento.md |
| `POST /api/v1/batches` | One envelope with all documents and requirements for that signer | See `no-equivalent.md` | https://developers.clicksign.com/docs/guia-de-criacao-o-passo-a-passo-padrao.md |
| `PATCH /api/v1/batches/{key}`, `PUT /api/v1/batches/{key}/append` | None | **Undocumented 1.9.** Updates a batch and adds documents to an existing batch. 3.0 has no batch, see `no-equivalent.md` | |
| `POST /api/v1/signers` | `POST /api/v3/envelopes/{id}/signers` | Created per envelope; cannot be edited. Field map below | https://developers.clicksign.com/reference/api-criar-signatario.md |
| `GET /api/v1/signers/{key}` | `GET /api/v3/envelopes/{id}/signers/{signer_id}` | | https://developers.clicksign.com/reference/api-detalhes-do-signatario.md |
| `GET /api/v2/signers` (account-wide) | `GET /api/v3/envelopes/{id}/signers` (per envelope) | No account-wide signer listing | https://developers.clicksign.com/reference/api-listar-signatarios.md |
| `DELETE /api/v2/signers/{key}` | `DELETE /api/v3/envelopes/{id}/signers/{signer_id}` | Only if the signer has not started signing | https://developers.clicksign.com/reference/api-excluir-signatario.md |
| `POST /api/v1/documents/{key}/signers` (`signers[]`) | `POST /api/v3/envelopes/{id}/signers`; in a `running` envelope its requirements go through `bulk_requirements`; then the signer notification | **Undocumented 1.9.** Adds signers to an existing document and notifies them unless `send_email` is `false`. Items carry signer and list fields (`sign_as`, `refusable`, `auths`), plus `send_email` and `message` | https://developers.clicksign.com/reference/bulk-requirements.md |
| `DELETE /api/v1/documents/{key}/signers` with `signers[]` (signer keys) | Same as `DELETE /api/v1/lists/{key}` below, or `DELETE /api/v3/envelopes/{id}/signers/{signer_id}` when the signer leaves the whole envelope | **Undocumented 1.9.** Removes the listed signers from that document. A signer key appended to the path is ignored: the keys come from `signers[]` | https://developers.clicksign.com/reference/bulk-requirements.md |
| `POST /api/v1/signers/{key}/notify` | `POST /api/v3/envelopes/{id}/signers/{signer_id}/notifications` | **Undocumented 1.9.** Notifies one signer, with an optional `message` | https://developers.clicksign.com/reference/api-notificar-signatario.md |
| `GET /api/v2/contacts` | None | See `no-equivalent.md` | |
| `POST /api/v1/lists` | `POST /api/v3/envelopes/{id}/requirements` twice: `agree` + `role`, and `provide_evidence` + `auth` | `group` and `refusable` move to the signer. `message` moves to the notification | https://developers.clicksign.com/reference/criar-requisito-qualificacao.md |
| `DELETE /api/v1/lists/{key}` | `DELETE /api/v3/envelopes/{id}/requirements/{requirement_id}` (`draft`) or `bulk_requirements` with `op: remove` (`running`) | | https://developers.clicksign.com/reference/bulk-requirements.md |
| `POST /api/v1/notifications` | `POST /api/v3/envelopes/{id}/signers/{signer_id}/notifications` or `POST /api/v3/envelopes/{id}/notifications` | Envelope must be `running`; only the active group is notified. `message` is used by email only; `email_customization` customizes the email | https://developers.clicksign.com/reference/api-notificar-signatario.md |
| `POST /api/v1/notify_by_sms`, `POST /api/v1/notify_by_whatsapp` | Same notification endpoints | The channel comes from the signer's `communicate_events.signature_request` (`email`, `sms`, `whatsapp`, `none`) | https://developers.clicksign.com/docs/notificacoes.md |
| `POST /api/v1/sign` | Automatic signature: term + `auth: auto_signature` | See `no-equivalent.md` and `flows.md` | https://developers.clicksign.com/docs/assinatura-automatica.md |
| `POST /api/v2/documents/{key}/events` (custom token) | `POST /api/v3/envelopes/{id}/documents/{document_id}/events` with `name: custom` | `data.kind`: `token_email`, `token_sms` | https://developers.clicksign.com/reference/criar-evento-customizado.md |
| `POST /api/v2/documents/{key}/images` | Same events endpoint with `name: add_image`, `content_base64`, `data.title`, `data.occurred_at` | | https://developers.clicksign.com/reference/criar-evento-com-imagem-para-o-documento.md |
| `POST /api/v2/webhooks`, `GET /api/v2/webhooks` | `POST /api/v3/webhooks`, `GET /api/v3/webhooks`, plus `PATCH` and `DELETE /api/v3/webhooks/{id}` | JSON:API body with `endpoint`, `status`, `events`. Always send `events` with the event names the handler uses, even though the create page marks only `endpoint` as required. If the 3.0 webhook endpoints answer `403` on the account, register the webhook in the account settings or ask Clicksign | https://developers.clicksign.com/reference/api-criar-webhook.md |
| `GET`, `PATCH`, `DELETE /api/v2/webhooks/{id}`, `POST /api/v2/webhooks/{id}/activate` | `GET`, `PATCH`, `DELETE /api/v3/webhooks/{id}`; activate becomes `PATCH` with `status: active` | **Undocumented 1.9.** | https://developers.clicksign.com/reference/api-detalhes-do-webhook.md, https://developers.clicksign.com/reference/api-editar-webhook.md, https://developers.clicksign.com/reference/api-excluir-webhook.md |
| `POST /api/v2/acceptance_term/whatsapps` (WhatsApp acceptance) | `POST /api/v3/acceptance_term/whatsapps` | JSON:API `type: acceptance_term_whatsapps`. `name` → `title`, `sender_name` → `sender_name_option` (same values), `content` → `message`; `signer_phone` and `signer_name` keep their names. `sender_phone` has no documented 3.0 attribute: ask before dropping it. Use the usual 3.0 `Authorization` header without `Bearer`, even where an acceptance guide example shows it. Test one acceptance in sandbox on the account first; if it answers `403`, ask Clicksign | https://developers.clicksign.com/reference/api-criar-aceite-whatsapp.md |
| `GET /api/v2/acceptance_term/whatsapps`, `GET /api/v2/acceptance_term/whatsapps/{key}` | `GET /api/v3/acceptance_term/whatsapps`, `GET /api/v3/acceptance_term/whatsapps/{id}` | | https://developers.clicksign.com/reference/api-listar-aceites-via-whatsapp.md, https://developers.clicksign.com/reference/visualizar-um-aceite-via-whatsapp.md |
| `PATCH /api/v2/acceptance_term/whatsapps/{key}/cancel` | `PATCH /api/v3/acceptance_term/whatsapps/{id}` with `data.id` and `status: canceled` | Only a pending acceptance can be canceled; an accepted or expired one returns an error, and a canceled one cannot be reactivated | https://developers.clicksign.com/reference/editar-um-aceite-via-whatsapp.md, https://developers.clicksign.com/docs/cancelamento-e-erros-comuns.md |
| `POST /api/v1/send_presential_signature_request/email`, `.../sms` | Signer with `signature_host` + `auth: presential` requirement, then the notification endpoint | The host gets a 6-character token by email, valid for 24 h after activation. Sending the token to the signer (`recipient: signer`, `/sms`) has no documented 3.0 equivalent, see `no-equivalent.md` | https://developers.clicksign.com/reference/fluxo-completo-da-assinatura-presencial.md |
| `POST /api/v1/send_presential_signature_request`, `GET /api/v1/sign_presential_url` | Same as the row above | **Undocumented 1.9.** The first emails the token to the host, the second returns the signing URL for a token. No documented 3.0 equivalent for the URL lookup | https://developers.clicksign.com/reference/fluxo-completo-da-assinatura-presencial.md |

## Document settings: 1.9 document to 3.0 envelope

| 1.9 (`document`) | 3.0 | Default 1.9 | Default 3.0 |
|---|---|---|---|
| `path` (folder + filename) | Document `filename`; folder through the envelope `folder` relationship | n/a | n/a |
| `content_base64` | Document `content_base64` (same `data:<mime>;base64,` prefix) | n/a | n/a |
| `deadline_at` | Envelope `deadline_at` (max 90 days, must be in the future) | +30 days | +30 days |
| `auto_close` | Envelope `auto_close` | `true` | `true` |
| `locale` | Envelope `locale` (`pt-BR`, `en-US`) | `pt-BR` | send it explicitly |
| `remind_interval` | Envelope `remind_interval` (`1`, `2`, `3`, `7`, `14`, `null`) | disabled | **`3`** |
| `block_after_refusal` | Envelope `block_after_refusal` | `true` | send it explicitly |
| `sequence_enabled` | Signer `group`, sent on every signer (the same group for all when 1.9 had `sequence_enabled: false`) | `false` | groups always on; send it explicitly |
| (none) | Envelope `name` (required), `default_subject`, `default_message`, `deadline_partial_signature_action` | | |

The `remind_interval` default changed: send `null` to keep reminders off as in 1.9, or the interval the integration needs. Always send `block_after_refusal` and `locale` too, with the values the 1.9 code sent or relied on. Do not rely on a 3.0 default for these two.

Source: https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md

## Signer fields

| 1.9 (`signer`) | 3.0 |
|---|---|
| `name`, `email`, `phone_number`, `documentation`, `birthday`, `has_documentation` | Same attributes on the 3.0 signer |
| `location_required_enabled` | Same attribute on the signer |
| `communicate_by` (`email`, `whatsapp`) | `communicate_events.signature_request` and `communicate_events.document_signed` |
| `delivery` | `communicate_events.document_signed` |
| List `group` | Signer `group`, now per envelope instead of per document |
| List `refusable` | Signer `refusable` |
| List `sign_as` | Qualification requirement `role` |
| `auths` and `*_enabled` | Authentication requirements, table below |

`documentation` must be formatted `000.000.000-00` in 3.0. Source: https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md

## `auths` and flags to authentication requirements

Each row becomes one `POST /envelopes/{id}/requirements` with `action: provide_evidence` and the `auth` below, for each document the signer signs.

| 1.9 | 3.0 `auth` | Note |
|---|---|---|
| `auths: ["email"]` | `email` | `communicate_events.signature_request` is a separate choice (default `email`): keep the channel the integration uses, `none` if it notifies outside Clicksign |
| `auths: ["sms"]` | `sms` | Set `communicate_events.signature_request: sms` if the request also goes by SMS |
| `auths: ["whatsapp"]` | `whatsapp` | Same for WhatsApp. Only one token type per signer |
| `auths: ["pix"]` | `pix` | CPF required |
| `auths: ["icp_brasil"]` | `icp_brasil` | |
| `auths: ["registro_civil"]` | None documented | The 1.9 API accepts it, but the 1.9 pages in `sources.md` do not list it, and no `registro_civil` `auth` is documented in 3.0. Ask the developer and Clicksign before mapping it |
| `auths: ["api"]` | `auto_signature` | Needs the automatic signature term, see `flows.md` |
| `auths: ["tokenless"]` | `embedded_signature` | Signer gives name, CPF, birth date and location |
| `auths: ["presential"]` | `presential` | Signer needs `signature_host` |
| `selfie_enabled: true` | `selfie` | |
| `handwritten_enabled: true` | `handwritten` | |
| `official_document_enabled: true` | `official_document` | |
| `liveness_enabled: true` | `liveness` | |
| `facial_biometrics_enabled: true` | `facial_biometrics` | Not combinable with `official_document`, `liveness`, `selfie`, `identity_biometrics`. Billed per successful check |

Source: https://developers.clicksign.com/docs/tipos-de-requisitos-de-autenticacao.md

## `sign_as` to `role`

`role` (qualification requirement, `action: agree`) takes the same identifier as `sign_as` when the value is in the documented 3.0 list, for example `sign`, `party`, `witness`, `contractor`, `contractee`, `approve`, `receipt`. Two values of the 1.9 list are not in the 3.0 list: `condominium_member` and `signed`. Ask before mapping them, and any other `sign_as` value that is not in the documented 3.0 list (see `no-equivalent.md`). Full list: https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md

## Webhooks

| Topic | 1.9 | 3.0 |
|---|---|---|
| Register | App settings or `POST /api/v2/webhooks` | App settings or `POST /api/v3/webhooks` |
| Delivery | `POST` JSON, header `Event: <name>` | Same |
| Signature | `Content-Hmac: sha256=<hex>`, HMAC-SHA256 of the raw body with the webhook secret | Same |
| Retries, timeout | 5 s timeout, 10 attempts over about a day, redirects are errors | Same |
| Event names | `upload`, `add_signer`, `remove_signer`, `sign`, `refusal`, `auto_close`, `close`, `document_closed`, `cancel`, `deadline`, `update_deadline`, `update_auto_close`, `custom`, `add_image`, `attempts_by_whatsapp_exceeded`, `facematch_refused` | Same names, plus `signature_started`, `update_locale`, `liveness_refused`, `biometric_refused`, `identity_biometrics_refused`, `documentscopy_refused`, `ocr_refused`, `attempts_by_liveness_or_facematch_exceeded` |
| WhatsApp acceptance events | `acceptance_term_enqueued`, `acceptance_term_sent`, `acceptance_term_completed`, `acceptance_term_refused`, `acceptance_term_canceled`, `acceptance_term_expired`, `acceptance_term_error` | Same names |
| Payload | `{"event": {...}, "document": {...}}` | Same outer shape; `document` keeps `key`, `status`, `downloads`, `signers`, `events` |
| `document.signers[]` items | Signer fields plus list fields (`list_key`, `request_signature_key`, `sign_as`, `auths`, `delivery`, `refusable`, `url`) | Signer fields only (`key`, `name`, `email`, `phone_number`, `documentation`, `has_documentation`, `birthday`, `created_at`). Read roles and authentications from the envelope requirements instead |

Re-check every field the handler reads against a real 3.0 sandbox delivery: the documented examples are partial, and the ids your database stores change from 1.9 `key` values to 3.0 ids.

Sources: https://developers.clicksign.com/docs/disparos-de-webhooks.md, https://developers.clicksign.com/docs/seguranca-de-webhooks.md, https://developers.clicksign.com/docs/melhores-praticas-webhooks.md, https://developers.clicksign.com/docs/eventos.md, https://developers.clicksign.com/docs/exemplo-documento.md, https://developers.clicksign.com/docs/exemplo-signers.md, https://developers.clicksign.com/reference/api-listar-webhooks.md

## Signed file download

The 3.0 document resource documents `links.files.original` (a signed S3 URL valid for about 5 minutes). The webhook `document` payload carries `downloads.signed_file_url`. Use the `document_closed` webhook to fetch the signed file as soon as it arrives, and confirm the link field on a closed document in sandbox before relying on the REST response.

Sources: https://developers.clicksign.com/reference/api-listar-documentos.md, https://developers.clicksign.com/docs/exemplo-documento.md, https://developers.clicksign.com/docs/evento-document-closed.md

## Widget Embedded

| | 1.9 | 3.0 |
|---|---|---|
| Script | `https://cdn-public-library.clicksign.com/embedded/embedded.min-1.0.0.js` | `https://cdn-public-library.clicksign.com/embedded/embedded.min-2.1.0.js` |
| Start | `new Clicksign('<request_signature_key>')` | `new Clicksign('<signer id>')`, envelope must be `running` |
| Rest of the API | `endpoint`, `origin`, `mount`, `unmount`, `on('loaded' / 'signed' / 'resized')` | Same |
| No-token signature | `tokenlessWidget.js` + `TokenlessWidget` (beta, closed to new customers) | `auth: embedded_signature` requirement + `noWidget` client, started with the signer id |

Sources: https://developers.clicksign.com/docs/implementando-o-widget-embedded.md, https://developers.clicksign.com/docs/assinatura-incorporada-implementacoes-e-testes.md
