# Essential flows, side by side

Raw HTTP, so the agent can translate it into the developer's language and HTTP client. All values are fictitious. `{{BASE_URL}}` is `https://sandbox.clicksign.com` while testing. `{{SIGNER_CPF}}` is a fictitious CPF with valid check digits, formatted `000.000.000-00`: the API answers `422` (`documentation - inválido`) to an invalid one. `{{DEADLINE_AT}}` is a date and time in the future, at most 90 days ahead, with its offset (`YYYY-MM-DDTHH:MM:SS-03:00`). Every 3.0 request carries:

```http
Authorization: {{CLICKSIGN_ACCESS_TOKEN}}
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
```

Every 1.9 request carries `?access_token={{CLICKSIGN_ACCESS_TOKEN}}` and `Content-Type: application/json`.

## 1. Create the envelope and upload a document

API 1.9: one call creates the document with its settings.

```http
POST {{BASE_URL}}/api/v1/documents?access_token={{CLICKSIGN_ACCESS_TOKEN}}

{"document": {"path": "/Contratos/contrato-exemplo.pdf", "content_base64": "data:application/pdf;base64,{{BASE64}}", "deadline_at": "{{DEADLINE_AT}}", "auto_close": true, "locale": "pt-BR"}}
```

API 3.0: the envelope holds the settings, the document holds the file. Keep `data.id` of each response.

```http
POST {{BASE_URL}}/api/v3/envelopes

{"data": {"type": "envelopes", "attributes": {"name": "Contrato exemplo", "deadline_at": "{{DEADLINE_AT}}", "auto_close": true, "locale": "pt-BR", "block_after_refusal": true, "remind_interval": null}}}
```

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/documents

{"data": {"type": "documents", "attributes": {"filename": "contrato-exemplo.pdf", "content_base64": "data:application/pdf;base64,{{BASE64}}"}}}
```

`remind_interval` is sent as `null` because its default changed (1.9: disabled; 3.0: `3`). `block_after_refusal` and `locale` are always sent with what the 1.9 code used (here `true`, the 1.9 default, and the `pt-BR` the 1.9 call sends), so the result does not depend on a 3.0 default. Several documents go into the same envelope with more `POST .../documents` calls.

### 1.9 code that sends `signers[]` inside `document`

The 1.9 API also accepts a `signers` array inside the `document` root of `POST /api/v1/documents`, with `send_email` on every item. The 1.9 pages in `sources.md` do not show it. That one call creates the document, the signers and their lists, and notifies each signer whose `send_email` is not `false`. In 3.0 it becomes this flow, then flow 3 for each item (signer fields and `auths` to the signer and authentication requirements, `sign_as` to the qualification requirement), then flow 4: activate, and notify each signer whose `send_email` was not `false`, with the item's `message`.

Sources: https://developers.clicksign.com/reference/api-criar-envelope.md, https://developers.clicksign.com/reference/api-upload-documentos.md

## 2. Create a document from a template

API 1.9:

```http
POST {{BASE_URL}}/api/v1/templates/{{TEMPLATE_KEY}}/documents?access_token={{CLICKSIGN_ACCESS_TOKEN}}

{"document": {"path": "/Contratos/contrato-exemplo.docx", "template": {"data": {"nome": "Fulano de Tal", "cidade": "Cidade Exemplo"}}}}
```

API 3.0: inside an existing `draft` envelope.

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/documents

{"data": {"type": "documents", "attributes": {"filename": "contrato-exemplo.docx", "template": {"key": "{{template_id}}", "data": {"nome": "Fulano de Tal", "cidade": "Cidade Exemplo"}}}}}
```

Template variables keep the same names (`{{nome}}` in the `.docx`, `"nome"` in `data`). Look up `template.key` with `GET /api/v3/templates` (it is the template `data.id`) instead of assuming the key stored by the 1.9 code still applies.

Source: https://developers.clicksign.com/reference/criar-documento-por-modelo.md

## 3. Add a signer with qualification and authentication

API 1.9: the signer carries the authentication, the list carries the role.

```http
POST {{BASE_URL}}/api/v1/signers?access_token={{CLICKSIGN_ACCESS_TOKEN}}

{"signer": {"name": "Fulano de Tal", "email": "fulano@example.com", "auths": ["email"], "documentation": "{{SIGNER_CPF}}", "birthday": "1990-01-01", "has_documentation": true, "selfie_enabled": true}}
```

```http
POST {{BASE_URL}}/api/v1/lists?access_token={{CLICKSIGN_ACCESS_TOKEN}}

{"list": {"document_key": "{{DOCUMENT_KEY}}", "signer_key": "{{SIGNER_KEY}}", "sign_as": "contractor", "refusable": true}}
```

API 3.0: create the signer in the `draft` envelope, with `group` always sent, then one qualification requirement and one authentication requirement per extra check, for each document. Before reusing this payload for a signer added to a `running` envelope, test it in sandbox.

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/signers

{"data": {"type": "signers", "attributes": {"name": "Fulano de Tal", "email": "fulano@example.com", "documentation": "{{SIGNER_CPF}}", "birthday": "1990-01-01", "has_documentation": true, "refusable": true, "group": 1, "communicate_events": {"signature_request": "email", "signature_reminder": "email", "document_signed": "email"}}}}
```

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/requirements

{"data": {"type": "requirements", "attributes": {"action": "agree", "role": "contractor"}, "relationships": {"document": {"data": {"type": "documents", "id": "{{document_id}}"}}, "signer": {"data": {"type": "signers", "id": "{{signer_id}}"}}}}}
```

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/requirements

{"data": {"type": "requirements", "attributes": {"action": "provide_evidence", "auth": "email"}, "relationships": {"document": {"data": {"type": "documents", "id": "{{document_id}}"}}, "signer": {"data": {"type": "signers", "id": "{{signer_id}}"}}}}}
```

`selfie_enabled: true` becomes a second `provide_evidence` requirement with `auth: selfie`. Repeat both requirements for each document the signer signs; activation fails without them. For many documents or signers, send the requirements in one `POST .../bulk_requirements` call with `atomic:operations`.

Sources: https://developers.clicksign.com/reference/api-criar-signatario.md, https://developers.clicksign.com/reference/criar-requisito-qualificacao.md, https://developers.clicksign.com/reference/criar-requisito-de-autenticacao.md, https://developers.clicksign.com/reference/bulk-requirements.md

## 4. Activate and notify

API 1.9: the document is already running; notify through the list's `request_signature_key`.

```http
POST {{BASE_URL}}/api/v1/notifications?access_token={{CLICKSIGN_ACCESS_TOKEN}}

{"request_signature_key": "{{REQUEST_SIGNATURE_KEY}}", "message": "Olá, segue o contrato para assinatura."}
```

API 3.0: activate the envelope, then notify all signers of the active group (or one signer).

```http
PATCH {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}

{"data": {"id": "{{envelope_id}}", "type": "envelopes", "attributes": {"status": "running"}}}
```

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/notifications

{"data": {"type": "notifications", "attributes": {"message": "Olá, segue o contrato para assinatura."}}}
```

One signer: `POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/signers/{{signer_id}}/notifications`. SMS and WhatsApp use the same endpoints; the channel comes from the signer's `communicate_events.signature_request`, and `message` applies to email only.

Sources: https://developers.clicksign.com/reference/api-editar-envelope.md, https://developers.clicksign.com/reference/api-notificar-envelope.md, https://developers.clicksign.com/docs/notificacoes.md

## 5. Automatic signature (replaces sign through the API)

API 1.9: signer with `auths: ["api"]`, added through a list; the application signs when it wants.

```http
POST {{BASE_URL}}/api/v1/sign?access_token={{CLICKSIGN_ACCESS_TOKEN}}

{"request_signature_key": "{{REQUEST_SIGNATURE_KEY}}", "secret_hmac_sha256": "{{HMAC_SHA256_OF_REQUEST_SIGNATURE_KEY_WITH_SIGNER_SECRET}}"}
```

API 3.0: request the term once per signer; the account admin and the signer sign it.

```http
POST {{BASE_URL}}/api/v3/auto_signature/terms

{"data": {"type": "auto_signature_terms", "attributes": {"signer": {"name": "Fulano de Tal", "email": "fulano@example.com", "documentation": "{{SIGNER_CPF}}", "birthday": "1990-01-01"}, "api_email": "api@example.com", "admin_email": "admin@example.com"}}}
```

Then, in each envelope, create the signer with the same `name`, `email`, `documentation` and `birthday`, a qualification requirement, and:

```http
POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/requirements

{"data": {"type": "requirements", "attributes": {"action": "provide_evidence", "auth": "auto_signature"}, "relationships": {"document": {"data": {"type": "documents", "id": "{{document_id}}"}}, "signer": {"data": {"type": "signers", "id": "{{signer_id}}"}}}}}
```

After activation, the signer signs by itself when the envelope reaches its `group`. Remove the HMAC code and the stored signer secret. See `no-equivalent.md` for the limitations.

Sources: https://developers.clicksign.com/docs/assinatura-automatica.md, https://developers.clicksign.com/reference/api-criar-termo.md
