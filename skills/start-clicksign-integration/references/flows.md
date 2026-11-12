# The flow, as raw HTTP

Raw HTTP, so the agent translates it into the developer's language and HTTP client. All values are fictitious. `{{BASE_URL}}` is `https://sandbox.clicksign.com` while testing. `{{SIGNER_CPF}}` is a fictitious CPF with valid check digits, formatted `000.000.000-00`; the API answers `422` to an invalid one. `{{DEADLINE_AT}}` is a date and time in the future, at most 90 days ahead, with its offset (`YYYY-MM-DDTHH:MM:SS-03:00`). Every request carries the headers in [concepts.md](concepts.md).

## 1. Create the envelope (`draft`)

```http
POST {{BASE_URL}}/api/v3/envelopes

{"data": {"type": "envelopes", "attributes": {"name": "Contrato exemplo", "deadline_at": "{{DEADLINE_AT}}", "auto_close": true, "locale": "pt-BR", "block_after_refusal": true, "remind_interval": 3, "deadline_partial_signature_action": "closed"}}}
```

Keep `data.id` as `envelope_id`. These attributes are sent explicitly per the decide-silently defaults in [decisions.md](decisions.md), instead of relying on the API's own defaults.

Source: https://developers.clicksign.com/reference/api-criar-envelope.md, https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md

## 2. Add a document

By upload:

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/documents

{"data": {"type": "documents", "attributes": {"filename": "contrato-exemplo.pdf", "content_base64": "data:application/pdf;base64,{{BASE64}}"}}}
```

From a template, when the developer already has one in their account (look up `template.key` with `GET /api/v3/templates`, it is the template's `data.id`):

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/documents

{"data": {"type": "documents", "attributes": {"filename": "contrato-exemplo.docx", "template": {"key": "{{template_id}}", "data": {"nome": "Fulano de Tal", "cidade": "Cidade Exemplo"}}}}}
```

Template variables keep the same names in the `.docx` (`{{nome}}`) and in `data` (`"nome"`). Keep `data.id` as `document_id`. Several documents go into the same envelope with more calls to this endpoint.

Source: https://developers.clicksign.com/reference/api-upload-documentos.md, https://developers.clicksign.com/reference/criar-documento-por-modelo.md, https://developers.clicksign.com/reference/api-listar-modelos.md, https://developers.clicksign.com/docs/docs-modelos.md

## 3. Add a signer

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/signers

{"data": {"type": "signers", "attributes": {"name": "Fulano de Tal", "email": "fulano@example.com", "documentation": "{{SIGNER_CPF}}", "birthday": "1990-01-01", "has_documentation": true, "refusable": true, "communicate_events": {"signature_request": "email", "signature_reminder": "email", "document_signed": "email"}}}}
```

Keep `data.id` as `signer_id`. Never send `group`: the server assigns it on its own, ignores the value sent at creation, and answers `400` if `group` is sent while the envelope is `running` (for example, through `bulk_requirements` when adding a signer after activation). See [decisions.md](decisions.md) and [limits.md](limits.md).

Source: https://developers.clicksign.com/reference/api-criar-signatario.md, https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md

## 4. Requirements: one qualification and one authentication, per document the signer signs

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/requirements

{"data": {"type": "requirements", "attributes": {"action": "agree", "role": "sign"}, "relationships": {"document": {"data": {"type": "documents", "id": "{{document_id}}"}}, "signer": {"data": {"type": "signers", "id": "{{signer_id}}"}}}}}
```

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/requirements

{"data": {"type": "requirements", "attributes": {"action": "provide_evidence", "auth": "email"}, "relationships": {"document": {"data": {"type": "documents", "id": "{{document_id}}"}}, "signer": {"data": {"type": "signers", "id": "{{signer_id}}"}}}}}
```

Repeat both for every document the signer signs; activation fails without them. For many documents or signers, send the requirements in one `POST .../bulk_requirements` call with `atomic:operations` instead of looping this endpoint, and use the same `bulk_requirements` call to add requirements for a signer added after activation (`running`).

Documented `role` values: `sign`, `party`, `witness`, `contractor`, `contractee`, `approve`, `receipt`. Documented `auth` values: `email`, `sms`, `whatsapp`, `pix`, `icp_brasil`, `selfie`, `handwritten`, `official_document`, `liveness`, `facial_biometrics`, `embedded_signature`, `presential`, `auto_signature`. A value the developer needs that is not in these lists is a question, not a silent choice: see [decisions.md](decisions.md) and [limits.md](limits.md).

Source: https://developers.clicksign.com/reference/criar-requisito-qualificacao.md, https://developers.clicksign.com/reference/criar-requisito-de-autenticacao.md, https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md, https://developers.clicksign.com/docs/tipos-de-requisitos-de-autenticacao.md, https://developers.clicksign.com/reference/bulk-requirements.md, https://developers.clicksign.com/docs/docs-requisitos.md

## 5. Activate

```http
PATCH {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}

{"data": {"id": "{{envelope_id}}", "type": "envelopes", "attributes": {"status": "running"}}}
```

Irreversible. If this fails, the error names the missing requirement; see [concepts.md](concepts.md) for the activation rules.

Source: https://developers.clicksign.com/reference/api-editar-envelope.md

## 6. Notify

All signers of the active group:

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/notifications

{"data": {"type": "notifications", "attributes": {"message": "Olá, segue o contrato para assinatura."}}}
```

One signer: `POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/signers/{{signer_id}}/notifications`. SMS and WhatsApp use the same endpoints; the channel comes from the signer's `communicate_events.signature_request`, and `message` applies to email only. Notifications are limited to 1 per minute per endpoint.

Source: https://developers.clicksign.com/reference/api-notificar-envelope.md, https://developers.clicksign.com/reference/api-notificar-signatario.md, https://developers.clicksign.com/reference/notificacao-campos-e-regras-de-negocio.md, https://developers.clicksign.com/docs/notificacoes.md, https://developers.clicksign.com/docs/tipos-de-notificacoes-do-signatario.md

## 7. After signing

Once a document closes, the webhook carries `downloads.signed_file_url` (see [webhooks.md](webhooks.md)). Download the file as soon as that webhook arrives: sandbox testing confirms it is a short-lived signed URL (about 5 minutes), the same order of magnitude as `links.files.original` on a `GET {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/documents` read; neither is a permanent link to store. Confirm the exact field on a closed document in sandbox before relying on the REST path; prefer the webhook.

Source: https://developers.clicksign.com/reference/api-listar-documentos.md, https://developers.clicksign.com/docs/exemplo-documento.md

## Errors and retries

- JSON:API error shape: `{"errors": [{"code", "status", "title", "detail", "source": {"pointer": "/data/attributes/<field>"}}]}`.
- `429`: retry with exponential backoff and jitter, wait at least until the `X-Rate-Limit-Reset` header (Unix time, UTC), cap the attempts. Check whether a timed-out create already succeeded before retrying it.
- `503 service_unavailable`: the account does not have the Envelope API enabled yet; the fix is asking Clicksign support, not a code change.
- Never poll an envelope or a document on a fixed interval instead of waiting on the webhook; polling is capped by the same rate limit as everything else.

Source: https://developers.clicksign.com/docs/mensagens-de-erro.md, https://developers.clicksign.com/docs/limite-de-requisicoes.md, https://developers.clicksign.com/docs/integracao-resiliente.md

