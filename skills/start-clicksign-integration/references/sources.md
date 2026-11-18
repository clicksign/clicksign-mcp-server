# Official sources

Every page below is the official Clicksign documentation for the API 3.0 (Envelope), served as Markdown. You should not need to fetch most of them: [concepts.md](concepts.md), [flows.md](flows.md), [webhooks.md](webhooks.md), [decisions.md](decisions.md) and [delivery.md](delivery.md) already distill everything the default flow needs, with these same pages cited as their sources. Fetch one page here only for a field, enum or response none of those five files spell out, or for a gap [limits.md](limits.md) flags — never to double-check something already stated in this skill's own files. The one other source is Clicksign's own catalog of integrations, listed at the end of this file. Do not use any other source, and do not fetch any `/v1.0/` page or a migration page: this skill never reads, mentions or recommends the legacy API 1.9.

## Index

| What | URL |
|---|---|
| API 3.0 index (current) | https://developers.clicksign.com/llms.txt |

## Scope, hosts and first steps

| Topic | URL |
|---|---|
| Hosts of each Clicksign product (Envelope API vs ClickFlow, ClickForm, Aceite/Notificação) | https://developers.clicksign.com/docs/informacoes-gerais.md |
| Glossary: envelope, signer, document, requirement, evidence, notification | https://developers.clicksign.com/docs/introducao-assinatura-digital.md |
| Hosts, access token header, JSON:API format | https://developers.clicksign.com/docs/ambientes-autenticacao-e-formato.md |
| Sandbox account and access token | https://developers.clicksign.com/docs/access-token.md |
| First steps (test the token) | https://developers.clicksign.com/docs/primeiros-passos.md |
| Full walkthrough with cURL | https://developers.clicksign.com/docs/veja-como-funciona-na-prática.md |
| Envelope creation guide (step by step, activation rules) | https://developers.clicksign.com/docs/guia-de-criacao-o-passo-a-passo-padrao.md |
| Error messages (JSON:API error shape) | https://developers.clicksign.com/docs/mensagens-de-erro.md |
| Rate limit | https://developers.clicksign.com/docs/limite-de-requisicoes.md |
| Resilient integration (retry, backoff) | https://developers.clicksign.com/docs/integracao-resiliente.md |
| FAQ | https://developers.clicksign.com/docs/faq-duvidas-e-problemas-comuns.md |

## Envelope

| Topic | URL |
|---|---|
| Envelope (concepts, statuses) | https://developers.clicksign.com/docs/envelope.md |
| Envelope fields and rules (`deadline_partial_signature_action` and others) | https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md |
| Create envelope | https://developers.clicksign.com/reference/api-criar-envelope.md |
| List envelopes (filters) | https://developers.clicksign.com/reference/api-listar-envelopes.md |
| Envelope details | https://developers.clicksign.com/reference/api-detalhes-do-envelope.md |
| Envelope queries and pagination | https://developers.clicksign.com/docs/gerenciamento-consultas-envelope.md |
| Activate or edit envelope | https://developers.clicksign.com/reference/api-editar-envelope.md |
| Asynchronous activation (marked as in development; use the `PATCH` instead) | https://developers.clicksign.com/docs/ativacao-escala-performatica.md |
| Delete envelope (`draft` only) | https://developers.clicksign.com/reference/api-excluir-envelope.md |
| Partial-signature deadline rule (`deadline_partial_signature_action`) | https://developers.clicksign.com/docs/aproveitamento-de-assinaturas-parciais-em-documentos-expirados.md |

## Documents

| Topic | URL |
|---|---|
| Documents (concepts) | https://developers.clicksign.com/docs/documentos.md |
| Document fields and rules | https://developers.clicksign.com/reference/documento-campos-e-regras-de-negocio.md |
| List documents (signed file link) | https://developers.clicksign.com/reference/api-listar-documentos.md |
| Document details | https://developers.clicksign.com/reference/detalhes-do-documento.md |
| Create document by upload | https://developers.clicksign.com/reference/api-upload-documentos.md |
| Create document from template | https://developers.clicksign.com/reference/criar-documento-por-modelo.md |
| Duplicate document | https://developers.clicksign.com/reference/api-duplicar-documento.md |
| Cancel or close document | https://developers.clicksign.com/reference/editar-documento.md |
| Delete document (`draft` only) | https://developers.clicksign.com/reference/api-excluir-documento.md |

## Templates

| Topic | URL |
|---|---|
| Templates (concepts) | https://developers.clicksign.com/docs/docs-modelos.md |
| List templates (look up the template id) | https://developers.clicksign.com/reference/api-listar-modelos.md |
| Template details (variable names) | https://developers.clicksign.com/reference/api-visualizar-modelo.md |

## Signers

| Topic | URL |
|---|---|
| Signers (concepts, what can change after activation) | https://developers.clicksign.com/docs/signatarios.md |
| Signer fields and rules | https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md |
| Create signer | https://developers.clicksign.com/reference/api-criar-signatario.md |
| List signers | https://developers.clicksign.com/reference/api-listar-signatarios.md |
| Signer details | https://developers.clicksign.com/reference/api-detalhes-do-signatario.md |
| Delete signer (only if it has not started signing) | https://developers.clicksign.com/reference/api-excluir-signatario.md |

## Requirements (qualification, authentication, rubric)

| Topic | URL |
|---|---|
| Requirements (concepts) | https://developers.clicksign.com/docs/docs-requisitos.md |
| Requirement endpoints (overview) | https://developers.clicksign.com/reference/api-requisitos.md |
| List requirements | https://developers.clicksign.com/reference/api-listar-requisitos.md |
| Requirement details | https://developers.clicksign.com/reference/detalhes-do-requisito.md |
| Delete requirement (`draft` only) | https://developers.clicksign.com/reference/api-excluir-requisito.md |
| Qualification roles | https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md |
| Authentication types | https://developers.clicksign.com/docs/tipos-de-requisitos-de-autenticacao.md |
| Create qualification requirement | https://developers.clicksign.com/reference/criar-requisito-qualificacao.md |
| Create authentication requirement | https://developers.clicksign.com/reference/criar-requisito-de-autenticacao.md |
| Bulk requirements (add to a `running` envelope) | https://developers.clicksign.com/reference/bulk-requirements.md |
| Rubric requirement (concepts, optional) | https://developers.clicksign.com/docs/adicionar-requisito-de-rubrica.md |
| Create rubric requirement | https://developers.clicksign.com/reference/criar-requisito-de-rubrica.md |

## Notifications

| Topic | URL |
|---|---|
| Notifications (concepts) | https://developers.clicksign.com/docs/notificacoes.md |
| Notification endpoints (overview, active group) | https://developers.clicksign.com/reference/api-notificacoes.md |
| Notification fields | https://developers.clicksign.com/reference/notificacao-campos-e-regras-de-negocio.md |
| Notify one signer | https://developers.clicksign.com/reference/api-notificar-signatario.md |
| Notify all signers | https://developers.clicksign.com/reference/api-notificar-envelope.md |
| Notification types sent to a signer | https://developers.clicksign.com/docs/tipos-de-notificacoes-do-signatario.md |
| Customize notification emails (account-gated, optional) | https://developers.clicksign.com/docs/customizar-notificacoes-por-email.md |

## Webhooks and events

| Topic | URL |
|---|---|
| Webhooks overview | https://developers.clicksign.com/docs/introducao-a-webhooks.md |
| Webhook delivery, timeout and retries | https://developers.clicksign.com/docs/disparos-de-webhooks.md |
| Webhook security (HMAC) | https://developers.clicksign.com/docs/seguranca-de-webhooks.md |
| Webhook best practices | https://developers.clicksign.com/docs/melhores-praticas-webhooks.md |
| Webhook events (names) | https://developers.clicksign.com/docs/eventos.md |
| Envelope-level events and custom events (concepts) | https://developers.clicksign.com/docs/envelope-eventos.md |
| Events endpoints (overview) | https://developers.clicksign.com/reference/api-eventos.md |
| Document events endpoint | https://developers.clicksign.com/reference/eventos-de-um-documento.md |
| Signature-viewed event (`signature_started`) | https://developers.clicksign.com/docs/visualização-de-notificações.md |
| Webhook payload: document (signed file URL) | https://developers.clicksign.com/docs/exemplo-documento.md |
| Webhook payload: signers | https://developers.clicksign.com/docs/exemplo-signers.md |
| Create webhook (response carries the HMAC secret) | https://developers.clicksign.com/reference/api-criar-webhook.md |
| List webhooks (event names, check for an existing registration) | https://developers.clicksign.com/reference/api-listar-webhooks.md |
| Webhook details | https://developers.clicksign.com/reference/api-detalhes-do-webhook.md |
| Edit webhook (activate it) | https://developers.clicksign.com/reference/api-editar-webhook.md |
| Delete webhook | https://developers.clicksign.com/reference/api-excluir-webhook.md |
| `document_closed` event | https://developers.clicksign.com/docs/evento-document-closed.md |
| `close` event | https://developers.clicksign.com/docs/evento-close.md |

## Integrations catalog (not API documentation)

| Topic | URL |
|---|---|
| Clicksign catalog of integrations: type, segment and a short description of each; the entry pages and help articles are listed in [native-integrations.md](native-integrations.md) | https://www.clicksign.com/integracao |
