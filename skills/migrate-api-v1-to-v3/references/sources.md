# Official sources

Every page below is the official Clicksign documentation, served as Markdown. Fetch the page when you need a field, enum or response that this skill does not spell out. Do not use any other source.

## Indexes

| What | URL |
|---|---|
| API 3.0 index (current) | https://developers.clicksign.com/llms.txt |
| API 1.9 index (legacy, read only to understand existing code) | https://developers.clicksign.com/v1.0/llms.txt |

The 1.9 index lists only part of the legacy pages. The other legacy pages follow the pattern `https://developers.clicksign.com/v1.0/docs/<slug>.md`; the ones this skill relies on are listed in the API 1.9 table below.

## Migration

| Topic | URL |
|---|---|
| Overview: why migrate | https://developers.clicksign.com/docs/migracao-da-api-19-para-30.md |
| Find out which version an integration uses | https://developers.clicksign.com/docs/descubra-sua-versao-da-api.md |
| Migration guide (concepts) | https://developers.clicksign.com/docs/guia-de-migracao.md |
| Technical comparison | https://developers.clicksign.com/docs/comparativo-tecnico.md |
| Migration FAQ | https://developers.clicksign.com/docs/faq-migracao.md |

## API 3.0

| Topic | URL |
|---|---|
| Hosts, access token, JSON:API | https://developers.clicksign.com/docs/ambientes-autenticacao-e-formato.md |
| Hosts of each Clicksign product | https://developers.clicksign.com/docs/informacoes-gerais.md |
| First steps (test the token) | https://developers.clicksign.com/docs/primeiros-passos.md |
| Sandbox account and access token | https://developers.clicksign.com/docs/access-token.md |
| Full walkthrough with cURL | https://developers.clicksign.com/docs/veja-como-funciona-na-prática.md |
| Envelope creation guide | https://developers.clicksign.com/docs/guia-de-criacao-o-passo-a-passo-padrao.md |
| Error messages | https://developers.clicksign.com/docs/mensagens-de-erro.md |
| Rate limit | https://developers.clicksign.com/docs/limite-de-requisicoes.md |
| Resilient integration (retry, backoff) | https://developers.clicksign.com/docs/integracao-resiliente.md |
| FAQ | https://developers.clicksign.com/docs/faq-duvidas-e-problemas-comuns.md |
| Envelope (concepts, statuses) | https://developers.clicksign.com/docs/envelope.md |
| Envelope fields and rules | https://developers.clicksign.com/reference/envelope-campos-e-regras-de-negocio.md |
| Create envelope | https://developers.clicksign.com/reference/api-criar-envelope.md |
| List envelopes (filters) | https://developers.clicksign.com/reference/api-listar-envelopes.md |
| Envelope details | https://developers.clicksign.com/reference/api-detalhes-do-envelope.md |
| Envelope queries and pagination | https://developers.clicksign.com/docs/gerenciamento-consultas-envelope.md |
| Activate or edit envelope | https://developers.clicksign.com/reference/api-editar-envelope.md |
| Asynchronous activation (marked as in development) | https://developers.clicksign.com/docs/ativacao-escala-performatica.md |
| Delete envelope | https://developers.clicksign.com/reference/api-excluir-envelope.md |
| List folders | https://developers.clicksign.com/reference/api-listar-pastas.md |
| Create folder | https://developers.clicksign.com/reference/criar-pasta.md |
| Documents (concepts) | https://developers.clicksign.com/docs/documentos.md |
| Document fields and rules | https://developers.clicksign.com/reference/documento-campos-e-regras-de-negocio.md |
| List documents (signed file link) | https://developers.clicksign.com/reference/api-listar-documentos.md |
| Document details | https://developers.clicksign.com/reference/detalhes-do-documento.md |
| Create document by upload | https://developers.clicksign.com/reference/api-upload-documentos.md |
| Create document from template | https://developers.clicksign.com/reference/criar-documento-por-modelo.md |
| Duplicate document | https://developers.clicksign.com/reference/api-duplicar-documento.md |
| Cancel or close document | https://developers.clicksign.com/reference/editar-documento.md |
| Delete document | https://developers.clicksign.com/reference/api-excluir-documento.md |
| Signer fields and rules | https://developers.clicksign.com/reference/signatario-campos-e-regras-de-negocio.md |
| Create signer | https://developers.clicksign.com/reference/api-criar-signatario.md |
| List signers | https://developers.clicksign.com/reference/api-listar-signatarios.md |
| Signer details | https://developers.clicksign.com/reference/api-detalhes-do-signatario.md |
| Delete signer | https://developers.clicksign.com/reference/api-excluir-signatario.md |
| Signers (concepts, what can change after activation) | https://developers.clicksign.com/docs/signatarios.md |
| Requirements (concepts) | https://developers.clicksign.com/docs/docs-requisitos.md |
| Requirement endpoints (overview) | https://developers.clicksign.com/reference/api-requisitos.md |
| Delete requirement | https://developers.clicksign.com/reference/api-excluir-requisito.md |
| Qualification roles | https://developers.clicksign.com/docs/adicionar-requisito-de-qualificacao.md |
| Authentication types | https://developers.clicksign.com/docs/tipos-de-requisitos-de-autenticacao.md |
| Create qualification requirement | https://developers.clicksign.com/reference/criar-requisito-qualificacao.md |
| Create authentication requirement | https://developers.clicksign.com/reference/criar-requisito-de-autenticacao.md |
| Create rubric requirement | https://developers.clicksign.com/reference/criar-requisito-de-rubrica.md |
| Bulk requirements | https://developers.clicksign.com/reference/bulk-requirements.md |
| Notifications (concepts) | https://developers.clicksign.com/docs/notificacoes.md |
| Notification endpoints (overview, active group) | https://developers.clicksign.com/reference/api-notificacoes.md |
| Notification fields | https://developers.clicksign.com/reference/notificacao-campos-e-regras-de-negocio.md |
| Notify one signer | https://developers.clicksign.com/reference/api-notificar-signatario.md |
| Notify all signers | https://developers.clicksign.com/reference/api-notificar-envelope.md |
| Templates | https://developers.clicksign.com/docs/docs-modelos.md |
| Create template | https://developers.clicksign.com/reference/api-criar-modelo.md |
| List templates | https://developers.clicksign.com/reference/api-listar-modelos.md |
| Template details | https://developers.clicksign.com/reference/api-visualizar-modelo.md |
| Edit template | https://developers.clicksign.com/reference/api-editar-modelo.md |
| Delete template | https://developers.clicksign.com/reference/api-excluir-modelo.md |
| Automatic signature | https://developers.clicksign.com/docs/assinatura-automatica.md |
| Automatic signature term | https://developers.clicksign.com/reference/api-criar-termo.md |
| Signature watchers | https://developers.clicksign.com/docs/observador-de-assinatura.md |
| Webhooks overview | https://developers.clicksign.com/docs/introducao-a-webhooks.md |
| Webhook delivery, timeout and retries | https://developers.clicksign.com/docs/disparos-de-webhooks.md |
| Webhook security (HMAC) | https://developers.clicksign.com/docs/seguranca-de-webhooks.md |
| Webhook best practices | https://developers.clicksign.com/docs/melhores-praticas-webhooks.md |
| Webhook events | https://developers.clicksign.com/docs/eventos.md |
| Webhook payload: document (signed file URL) | https://developers.clicksign.com/docs/exemplo-documento.md |
| Webhook payload: signers | https://developers.clicksign.com/docs/exemplo-signers.md |
| Create webhook | https://developers.clicksign.com/reference/api-criar-webhook.md |
| List webhooks (event names) | https://developers.clicksign.com/reference/api-listar-webhooks.md |
| Webhook details | https://developers.clicksign.com/reference/api-detalhes-do-webhook.md |
| Edit webhook | https://developers.clicksign.com/reference/api-editar-webhook.md |
| Delete webhook | https://developers.clicksign.com/reference/api-excluir-webhook.md |
| `document_closed` event | https://developers.clicksign.com/docs/evento-document-closed.md |
| Document events | https://developers.clicksign.com/reference/eventos-de-um-documento.md |
| Custom token event | https://developers.clicksign.com/reference/criar-evento-customizado.md |
| Image event | https://developers.clicksign.com/reference/criar-evento-com-imagem-para-o-documento.md |
| Widget Embedded | https://developers.clicksign.com/docs/implementando-o-widget-embedded.md |
| Embedded signature (no token) | https://developers.clicksign.com/docs/assinatura-incorporada-implementacoes-e-testes.md |
| Embedded signature: installation | https://developers.clicksign.com/docs/instalacao-de-widget-assinatura-tokenless.md |
| In-person signature (concepts, compatibility) | https://developers.clicksign.com/docs/introducao-a-assinatura-presencial.md |
| In-person signature | https://developers.clicksign.com/reference/fluxo-completo-da-assinatura-presencial.md |
| WhatsApp acceptance: create | https://developers.clicksign.com/reference/api-criar-aceite-whatsapp.md |
| WhatsApp acceptance: list | https://developers.clicksign.com/reference/api-listar-aceites-via-whatsapp.md |
| WhatsApp acceptance: details | https://developers.clicksign.com/reference/visualizar-um-aceite-via-whatsapp.md |
| WhatsApp acceptance: cancel | https://developers.clicksign.com/reference/editar-um-aceite-via-whatsapp.md |
| WhatsApp acceptance: cancel rules and errors | https://developers.clicksign.com/docs/cancelamento-e-erros-comuns.md |

## API 1.9 (legacy)

Use these pages to understand what the existing code does and to fix or adjust the calls it already makes. Never use them to write new 1.9 calls, endpoints or flows.

| Topic | URL |
|---|---|
| Hosts and access token | https://developers.clicksign.com/v1.0/docs/informacoes-gerais.md |
| First steps (test the token) | https://developers.clicksign.com/v1.0/docs/primeiros-passos.md |
| Rate limit | https://developers.clicksign.com/v1.0/docs/limite-de-requisicoes.md |
| Error messages | https://developers.clicksign.com/v1.0/docs/mensagens-de-erro.md |
| Create document | https://developers.clicksign.com/v1.0/docs/criar-documento.md |
| Create document from template | https://developers.clicksign.com/v1.0/docs/criar-documento-via-modelos.md |
| Create template by upload | https://developers.clicksign.com/v1.0/docs/criar-modelo-via-upload.md |
| Configure document | https://developers.clicksign.com/v1.0/docs/configurar-documento.md |
| List documents | https://developers.clicksign.com/v1.0/docs/visualizar-todos-os-documentos.md |
| View document | https://developers.clicksign.com/v1.0/docs/visualizar-documento.md |
| Cancel document | https://developers.clicksign.com/v1.0/docs/cancelar-documento.md |
| Finish document | https://developers.clicksign.com/v1.0/docs/finalizar-documento.md |
| Duplicate document | https://developers.clicksign.com/v1.0/docs/duplicar-documento.md |
| Delete document | https://developers.clicksign.com/v1.0/docs/excluir-documento.md |
| Create batch | https://developers.clicksign.com/v1.0/docs/criar-lote.md |
| Create signer | https://developers.clicksign.com/v1.0/docs/criar-signatario.md |
| View signer | https://developers.clicksign.com/v1.0/docs/visualizar-signatario.md |
| List signers | https://developers.clicksign.com/v1.0/docs/visualizar-todos-os-signatários.md |
| Delete signer | https://developers.clicksign.com/v1.0/docs/excluir-signatário-2.md |
| List contacts | https://developers.clicksign.com/v1.0/docs/listar-contatos-da-agenda.md |
| Add signer to document (list) | https://developers.clicksign.com/v1.0/docs/adicionar-signatario-a-documento.md |
| Remove signer from document (list) | https://developers.clicksign.com/v1.0/docs/remover-signatario-de-documeto.md |
| Request signature by email | https://developers.clicksign.com/v1.0/docs/solicitar-assinatura-por-email.md |
| Request signature by SMS | https://developers.clicksign.com/v1.0/docs/solicitar-assinatura-por-sms.md |
| Request signature by WhatsApp | https://developers.clicksign.com/v1.0/docs/solicitar-assinatura-por-whatsapp.md |
| Sign through the API | https://developers.clicksign.com/v1.0/docs/assinar-documentos-via-api.md |
| Custom token and image events | https://developers.clicksign.com/v1.0/docs/eventos-customizados.md |
| Register webhooks through the API | https://developers.clicksign.com/v1.0/docs/cadastro-de-webhooks-via-api.md |
| Webhook delivery | https://developers.clicksign.com/v1.0/docs/disparos-de-webhooks.md |
| Webhook security (HMAC) | https://developers.clicksign.com/v1.0/docs/seguranca-de-webhooks.md |
| Webhook events | https://developers.clicksign.com/v1.0/docs/eventos.md |
| Widget Embedded | https://developers.clicksign.com/v1.0/docs/instalacao-do-widget-embedded.md |
| No-token widget | https://developers.clicksign.com/v1.0/docs/instalacao-do-widget-assinatura-sem-token.md |
| No-token widget: test implementation | https://developers.clicksign.com/v1.0/docs/implementacao-teste-tokenless.md |
| In-person signature | https://developers.clicksign.com/v1.0/docs/cadastrar-a-assinatura-presencial-de-signatarios.md |
| In-person signature: token by email | https://developers.clicksign.com/v1.0/docs/notificacao-da-assinatura-presencial-por-e-mail.md |
| In-person signature: token by SMS | https://developers.clicksign.com/v1.0/docs/notificacao-da-assinatura-presencial-por-sms.md |
| WhatsApp acceptance: create | https://developers.clicksign.com/v1.0/docs/criando-um-aceite-via-whatsapp.md |
| WhatsApp acceptance: view | https://developers.clicksign.com/v1.0/docs/visualizar-aceite-via-whatsapp.md |
| WhatsApp acceptance: list | https://developers.clicksign.com/v1.0/docs/visualizar-todos-os-aceites-enviados-através-do-aceite-via-whatsapp.md |
| WhatsApp acceptance: cancel | https://developers.clicksign.com/v1.0/docs/cancelar-envio-do-aceite-via-whatsapp.md |
| WhatsApp acceptance: events | https://developers.clicksign.com/v1.0/docs/eventos-aceite-via-whatsapp.md |
