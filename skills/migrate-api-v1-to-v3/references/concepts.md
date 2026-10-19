# Concepts: API 1.9 vs API 3.0

API 1.9 is legacy. It still works, but it receives no new features and "pode ser descontinuada no futuro" (migration FAQ). Documents already sent through 1.9 stay valid; the migration only affects documents sent after the new integration goes live. The migration can be gradual: new flows on 3.0 while existing ones keep running. Manage documents created in a 3.0 envelope only through 3.0: the 1.9 configure, duplicate and delete calls answer `403` for them (behaviour the 1.9 pages do not describe).

Sources: https://developers.clicksign.com/docs/faq-migracao.md, https://developers.clicksign.com/docs/guia-de-migracao.md, https://developers.clicksign.com/docs/comparativo-tecnico.md

## The model change

1.9 is centered on the **document**: each document is sent on its own, the signer is attached to the document through a **list**, and a **batch** lets one signer sign several running documents at once. Settings (deadline, reminders, sequence) live on each document.

3.0 is centered on the **envelope**: one transaction that groups documents, signers and the rules that connect them. You build it in `draft`, activate it (`running`) and then notify. Settings live on the envelope.

| API 1.9 | API 3.0 | What changes |
|---|---|---|
| Document (`/api/v1/documents`) | Envelope (`/api/v3/envelopes`) + Document (`/envelopes/{id}/documents`) | Deadline, locale, reminders, auto close and refusal blocking move from the document to the envelope. The document only carries the file, a template or a duplicate reference, and `metadata`. |
| Signer (`/api/v1/signers`), created once per account and reused | Signer (`/envelopes/{id}/signers`), created inside each envelope | The signer belongs to one envelope and has its lifecycle. It cannot be edited after it is created. |
| `auths` and `*_enabled` flags on the signer | Authentication requirement (`action: provide_evidence`, `auth`) per signer and document | How the signer proves identity is a requirement, not a signer attribute. |
| List (`/api/v1/lists`) with `sign_as` | Qualification requirement (`action: agree`, `role`) per signer and document | "Ele substitui o "List" da API 1.9". `role` uses the same identifiers as `sign_as`, except `condominium_member` and `signed`, which are not in the 3.0 list (see `endpoint-map.md`). |
| Signature | Evidence | Proof the signer produced to fulfil a requirement. |
| Batch (`/api/v1/batches`) | One envelope with several documents and requirements for the same signer | No endpoint to group documents that were already sent. See `no-equivalent.md`. |
| `request_signature_key` (notifications, Widget, sign through API) | Signer `id` | Notifications are sent per envelope or per signer id; the Widget is started with the signer id. |
| `sequence_enabled` + list `group` | Signer `group` | Groups are always on: higher groups sign only after every earlier group. Send `group` on every signer instead of relying on its default. 1.9 ignored `group` when `sequence_enabled` was `false`, so in that case give every signer the same group. |
| `POST /api/v1/sign` | Automatic signature (`auth: auto_signature`) | See `no-equivalent.md`. |
| Custom JSON, `{"document": {...}}` roots | JSON:API, `{"data": {"type", "attributes", "relationships"}}` | Media type `application/vnd.api+json`. |

## Envelope lifecycle (3.0)

1. `POST /api/v3/envelopes`: status `draft`, visible only to the API user.
2. Add documents, signers and requirements. Requirements through `/requirements` only while `draft`.
3. `PATCH /api/v3/envelopes/{id}` with `status: running`: activates. Irreversible.
4. `POST /api/v3/envelopes/{id}/notifications` (or per signer): sends the signature request. Activation alone does not notify.
5. The envelope becomes `closed` when every requirement is met (with `auto_close`) or `canceled`. Documents are canceled or closed one by one.

The documented activation rules are that every signer has at least one **authentication** requirement and every document has at least one **qualification** requirement for each signer who signs it. The creation guide also checks that every document has at least two requirements. Create both on every document a signer signs: one qualification and at least one authentication for that signer on that document. Do not rely on one authentication requirement covering the signer's other documents.

A signer only signs the documents it has requirements on, which replaces the 1.9 rule that every signer signs every document of a batch.

Sources: https://developers.clicksign.com/reference/api-editar-envelope.md, https://developers.clicksign.com/docs/docs-requisitos.md, https://developers.clicksign.com/docs/guia-de-criacao-o-passo-a-passo-padrao.md

## What can change after activation (3.0)

| Action | Allowed while `running` |
|---|---|
| Edit envelope settings (`deadline_at`, `locale`, `auto_close`, `remind_interval`, `block_after_refusal`, `default_message`) | Yes. `default_subject` only in `draft`. |
| Add a document | Not documented; plan documents before activation |
| Delete envelope or document | No (`403`, only in `draft`) |
| Remove a requirement | Only through `bulk_requirements` with `op: remove`; a direct `DELETE .../requirements/{id}` works only in `draft` |
| Cancel or close a document; edit `metadata` | Yes |
| Add a signer | Yes, and its requirements must go through `bulk_requirements` |
| Edit a signer | Never |
| Delete a signer | Only if it has not started signing |
| Add a signature watcher | Yes |
| Notify | Only while `running` |

Sources: https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md, https://developers.clicksign.com/docs/signatarios.md

## Things that are new in 3.0

Useful to mention when the developer asks what they gain, never as a reason to change the flow they asked to migrate:

- several documents per envelope, each signer signing only what it is assigned to;
- authentication types without 1.9 equivalent: `documentscopy`, `biometric` (Serpro), `identity_biometrics`, `address_proof`;
- rubric requirements and positioned signature in templates (`{{~position_sign_<ID>}}`);
- signature watchers (`/signature_watchers`);
- `deadline_partial_signature_action` (`closed` or `canceled`) for documents with partial signatures at the deadline;
- per-signer channels through `communicate_events`;
- webhook events such as `signature_started`, `liveness_refused`, `documentscopy_refused`.

Sources: https://developers.clicksign.com/docs/migracao-da-api-19-para-30.md, https://developers.clicksign.com/docs/tipos-de-requisitos-de-autenticacao.md
