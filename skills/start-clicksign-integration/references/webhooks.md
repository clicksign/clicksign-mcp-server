# Webhooks: registration, events, and security

Webhooks are the only reliable way to know a document closed; do not build a polling loop. The docs flag polling an envelope or document as against the documented rate-limit guidance.

Source: https://developers.clicksign.com/docs/introducao-a-webhooks.md, https://developers.clicksign.com/docs/limite-de-requisicoes.md

## Register a webhook

```http
POST {{BASE_URL}}/api/v3/webhooks

{"data": {"type": "webhooks", "attributes": {"endpoint": "https://example.com/webhooks/clicksign", "status": "active", "events": ["document_closed", "refusal", "cancel"]}}}
```

`endpoint` and `events` are both required (at least one event). **The create response carries the HMAC secret**, in `data.attributes.secret`; store it as `CLICKSIGN_WEBHOOK_SECRET` right away, it is not shown again on a plain `GET`. Send `status: "active"` explicitly: the documented create example shows a webhook coming back `inactive` when status is left out.

```json
{"data": {"id": "e72aab68-...", "type": "webhooks", "attributes": {"endpoint": "https://example.com", "secret": "973d92ca80c2206a0e65b35d2371d595", "status": "inactive", "events": ["add_image", "upload"]}}}
```

Manage it later with `GET /webhooks`, `GET /webhooks/{id}`, `PATCH /webhooks/{id}` (to activate or change events), `DELETE /webhooks/{id}`. Registering through the account settings UI is also valid and does not require the API call; check `GET /webhooks` first so discovery does not register a duplicate.

Source: https://developers.clicksign.com/reference/api-criar-webhook.md, https://developers.clicksign.com/reference/api-listar-webhooks.md, https://developers.clicksign.com/reference/api-detalhes-do-webhook.md, https://developers.clicksign.com/reference/api-editar-webhook.md, https://developers.clicksign.com/reference/api-excluir-webhook.md

## Events

Pick, in [decisions.md](decisions.md), the events the generated code actually reads, plus `cancel` by default: an envelope can be canceled outside the application (dashboard, support), and the stored state should still reflect it even though the application's own code never requests a cancellation. The minimal flow needs at least:

| Event | Meaning |
|---|---|
| `document_closed` | A document finished normally (every requirement met) |
| `close` | A document was finished manually by an account user |
| `refusal` | A signer refused to sign |
| `cancel` | A document was canceled |
| `sign` | One signer finished signing (fires before the document closes, if more signers remain) |
| `upload` | A document was added |
| `signature_started` | A signer opened the signing widget (useful for a "seen but not signed" follow-up; optional) |

The envelope- and document-level payload keeps the outer shape `{"event": {...}, "document": {...}}`. The `document` object carries `key`, `status`, `downloads` (including `signed_file_url` once closed), `signers`, and `events`. Re-check the exact fields the handler reads against a real sandbox delivery before relying on the documented examples, they are partial.

On `document_closed`, download the file at `downloads.signed_file_url` immediately: sandbox testing confirms it is a short-lived signed URL (about 5 minutes), not a permanent link, so storing it as-is for later leaves a dead link. On `cancel`, update the business record's status to canceled, the same way `refusal` is handled, even if nothing in this integration's own code ever cancels an envelope.

Source: https://developers.clicksign.com/docs/eventos.md, https://developers.clicksign.com/docs/evento-document-closed.md, https://developers.clicksign.com/docs/evento-close.md, https://developers.clicksign.com/docs/exemplo-documento.md, https://developers.clicksign.com/docs/exemplo-signers.md

### Documentation gap: envelope-level events endpoint

One guide (signature-viewed notifications) points at an envelope-wide path (`/envelopes/{envelope_id}/events?filter[name]=signature_started`) as if that endpoint existed. The events reference page documents only the per-document endpoint, `GET /envelopes/{envelope_id}/documents/{document_id}/events`. Treat the envelope-wide form as unconfirmed and do not call it: read `signature_started` (and any other event) from the webhook delivery instead. If the developer specifically needs a REST pull rather than a webhook, test the documented per-document endpoint first, and ask Clicksign support if a true envelope-wide endpoint is needed.

Source: https://developers.clicksign.com/docs/visualização-de-notificações.md, https://developers.clicksign.com/reference/api-eventos.md, https://developers.clicksign.com/reference/eventos-de-um-documento.md

## Security: HMAC validation

Every delivery carries `Content-Hmac: sha256=<hex>`, the SHA-256 HMAC of the **raw** request body (before any JSON parsing or reformatting) with the webhook's secret. Always validate it before trusting a delivery:

1. Read the raw body bytes.
2. Compute `HMAC-SHA256(raw_body, CLICKSIGN_WEBHOOK_SECRET)`.
3. Compare it, in constant time, to the hex digest after `sha256=` in the `Content-Hmac` header.
4. Reject the request (without processing it) if they do not match.

The HMAC covers the raw body only, so the `Event` header is not authenticated. After the HMAC matches, read the event name from the payload (`event.name`) and route the status update from that name. When the `Event` header is present and differs from `event.name`, reject the delivery and leave the business record unchanged.

Source: https://developers.clicksign.com/docs/seguranca-de-webhooks.md, https://developers.clicksign.com/docs/melhores-praticas-webhooks.md

## Delivery behaviour

- Respond `2XX` only after the handler has finished the work, or after a durable enqueue whose worker retries the job. A `200` sent before either of those tells Clicksign the delivery is done, so a later failure is not retried. Anything outside `2XX` (including a `301` redirect) counts as a failed delivery. The timeout is 5 seconds, so slow work (downloading the signed file, updating other systems) goes to that queue when the project has one.
- Timeout: 5 seconds. Retries: up to 10 attempts over about a day. Redirects are treated as errors, not followed.
- Firewall allowlist, if the endpoint restricts inbound IPs: production `34.204.113.69`, sandbox `3.232.199.65`.
- Testing before a public URL exists: use a disposable inspection URL (`webhook.site`) or a tunnel (`ngrok`) pointed at the local handler.

Source: https://developers.clicksign.com/docs/disparos-de-webhooks.md, https://developers.clicksign.com/docs/melhores-praticas-webhooks.md, https://developers.clicksign.com/docs/seguranca-de-webhooks.md

## Idempotency

A delivery can repeat (retry, or a duplicate from the developer's own infrastructure). Deduplicate by the event's own id when the authenticated payload includes one. When it does not, build the fingerprint from authenticated occurrence data that separates one delivery from another of the same name on the same document: for an event about one signer (`sign`, `refusal`, `signature_started`), include that signer's key (`event.data.signer.key` in the documented `sign` example) and `event.occurred_at` when it is present. A fingerprint of only the event name plus the document id gives both signers' `sign` events the same key and drops the second one. When the payload has neither an event id nor that occurrence data, do not drop the delivery: apply an idempotent side effect (record that this signer signed, or that the document closed) so a repeat is harmless. Re-check those fields against a real sandbox delivery before relying on them; the documented examples are partial. Mark the event handled only after its side effects succeed (the status update, and the signed-file download on `document_closed`), so a failure is retried on the next delivery. The same rule is the webhook half of the idempotency row in [decisions.md](decisions.md).

