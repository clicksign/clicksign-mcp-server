# Clicksign for ChatGPT and Codex

Connect ChatGPT and Codex to your [Clicksign](https://www.clicksign.com) account. Send documents for electronic signature from your templates or from a file link, check who has signed and who is still pending, and remind pending signers, all from a conversation.

This repository is the **distribution package** for the Clicksign MCP server. It holds the plugin manifests, assets, docs and validation tooling. The MCP server itself is a hosted service at:

```
https://mcp.clicksign.com/mcp/oauth2
```

You sign in with your Clicksign account through OAuth 2.1 in the browser. No API key is pasted into the chat, and the connector only reaches the account you authorize.

> **Status:** version 1.0.0 is being prepared for the OpenAI plugin directory and is not published yet.

## Get started

| Client | Guide |
|---|---|
| ChatGPT | [docs/setup-chatgpt.md](docs/setup-chatgpt.md) |
| Codex | [docs/setup-codex.md](docs/setup-codex.md) |

Claude Code and Cursor manifests are included (`.claude-plugin/`, `.cursor-plugin/`, `.mcp.json`) but are not published yet.

## Tools

| Tool | What it does |
|---|---|
| `list_accounts` | List the Clicksign accounts available to your login and show which one is in use |
| `select_account` | Choose which Clicksign account to use when your login has more than one |
| `quick_send_envelope` | Create and send a minimal envelope: one document name and one signer email |
| `list_templates` | List the document templates in the account |
| `get_template_fields` | List the variable fields defined in a template |
| `create_template` | Create a template from a .doc/.docx document |
| `edit_template` | Rename a template or change its color |
| `create_envelope_with_template` | Create and send an envelope from a template |
| `create_envelope_with_file_url` | Create and send an envelope from a public HTTPS file link |
| `list_envelopes` | List envelopes, filtered by status, name or creation date |
| `get_envelope_details` | Show the details of an envelope |
| `list_envelope_documents` | List the documents in an envelope |
| `list_envelope_signers` | List an envelope's signers and who has signed |
| `get_document_details` | Show the details of a document |
| `send_envelope_reminders` | Remind every pending signer of an envelope |
| `send_signer_reminder` | Remind one pending signer |

Sending an envelope or a reminder notifies the signers and cannot be undone. The connector never signs documents on anyone's behalf.

## Skills

| Skill | What it does |
|---|---|
| `migrate-api-v1-to-v3` | Helps a developer migrate code from the legacy Clicksign API 1.9 to API 3.0 (Envelope). It asks for missing context, maps endpoints, payloads and flows, explains features without a direct equivalent, and proposes the adapted code to test in sandbox. It can fix or adjust the calls existing 1.9 code already makes, but does not write new code on API 1.9: a request for new 1.9 code gets the 3.0 equivalent instead. Works without signing in to the MCP server. |
| `start-clicksign-integration` | Builds a brand-new Clicksign integration on API 3.0 only, with the least possible effort from the developer. It reads the client's repository, decides autonomously everything the official documentation already settles, asks only the open business rules in one short batch, and delivers a working integration (HTTP client, send function, webhook handler with HMAC validation, configuration, offline tests) directly in the client's code, plus a sandbox script up to the signed envelope and the received webhook. It never mentions the legacy API 1.9; a project that already has 1.9 code gets pointed to the migration skill instead. Works without signing in to the MCP server. |

Ask the assistant, in a project with 1.9 code, something like *"Migrate my Clicksign integration from API 1.9 to 3.0"*. For a project with no Clicksign integration yet, ask something like *"Integrate Clicksign into my project to send contracts for signature"*.

Both skills need permission to read and edit files, run the project's own commands, and reach `developers.clicksign.com` and `sandbox.clicksign.com`. Cursor, Claude Code and Codex each ask for this approval through their own run-mode settings; the skill asks once, up front, instead of per file.

## Repository layout

```
plugin.json                        OpenAI plugin manifest (Agent Plugins 1.0.0 + extensions.com.openai)
mcp.json                           MCP server for ChatGPT and Codex (streamable HTTP, OAuth)
.agents/plugins/marketplace.json   Codex marketplace that installs the plugin from this repo
.claude-plugin/, .mcp.json         Claude Code plugin and marketplace (not published)
.cursor-plugin/                    Cursor plugin (not published)
skills/                            Agent Skills bundled with the plugin
assets/                            Listing icons
docs/                              Setup guides for ChatGPT and Codex
scripts/                           Validation, packaging, smoke test, MCP Inspector, link check and docs-drift helpers
```

Opening this repository in Claude Code offers `clicksign` as a project MCP server, because `.mcp.json` sits at the root. That file is the Claude plugin's server config; approve it only if you want to connect.

## Development

Requires Node.js 22 or later (`.tool-versions` pins the version used here).

```sh
npm install
npm test                    # tests for the validator, the link check and the docs-drift check
npm run validate            # check every manifest; placeholders are warnings
npm run package             # validate, then build dist/clicksign-<version>.zip
npm run package -- --release  # same, but placeholders are errors
npm run package:dev         # build an isolated development ZIP named clicksign-dev
```

`npm run package` puts only `plugin.json`, `mcp.json`, `assets/` and skill directories in the ZIP. That ZIP is what gets uploaded at [platform.openai.com/plugins](https://platform.openai.com/plugins). The build is reproducible: the same commit produces the same SHA-256.

`npm run package:dev` does not change the repository manifest. It produces `dist/clicksign-dev-<version>.zip` with only the ZIP's internal plugin `name` changed to `clicksign-dev`, so it can be installed alongside a locally imported `clicksign` package. Do not use this artifact for release or directory submission.

### Testing the connection

These commands reach the production server.

```sh
npm run smoke         # no login: checks the 401 challenge and the OAuth discovery metadata
npm run inspect       # opens the MCP Inspector web UI; sign in with OAuth and explore tools
npm run inspect:cli   # lists the tools, compares them with scripts/expected-tools.json
                      # and reports tools without a title or annotations
```

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) runs the OAuth login itself and keeps the token in its own store, so the scripts never handle credentials. Set `CLICKSIGN_MCP_URL` to point these commands at another environment.

### Keeping skills current

These commands read the public documentation at `developers.clicksign.com`, not the MCP server.

```sh
npm run check:links       # checks that every documentation URL cited by a skill answers 200
npm run check:api-3-only  # checks that a skill (other than the migration one) never recommends
                          # or shows an example call to the legacy API
npm run check:endpoints   # checks that every endpoint a skill cites is a documented operation
                          # on a page that same skill already lists in its own sources.md
npm run check:docs-drift  # compares the cited documentation pages with scripts/docs-sources.lock.json
npm run docs:lock         # records the current pages in the lock, after reviewing the skill
npm run docs:lock:add     # records only a new skill's first citations, without touching
                          # any existing (possibly still-drifted) entry
```

The `docs-drift` workflow runs every Monday and on demand. It compares the documentation pages cited by the skills with `scripts/docs-sources.lock.json` and opens or updates one issue labelled `docs-drift` when a page changed. It reads only public pages and uses the workflow's own `GITHUB_TOKEN`. The resolution steps are in [skills/README.md](skills/README.md). GitHub disables scheduled workflows in public repositories after 60 days without activity; re-enable it in the Actions tab if that happens.

### Releasing

1. Bump `version` in `plugin.json`, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `.cursor-plugin/plugin.json`, and add a `CHANGELOG.md` entry. `npm run validate` fails if any of them disagree.
2. Tag the commit `v<version>`. The release workflow builds the ZIP with `--release` and attaches it to a GitHub Release.

## License

[Apache License 2.0](LICENSE). The license does not grant rights to the Clicksign name or logo; see [NOTICE](NOTICE).

---

## Português (Brasil)

### Clicksign para ChatGPT e Codex

Conecte o ChatGPT e o Codex à sua conta [Clicksign](https://www.clicksign.com). Envie documentos para assinatura eletrônica a partir de modelos ou de um link de arquivo, veja quem já assinou e quem está pendente e envie lembretes, tudo pela conversa.

Este repositório é o **pacote de distribuição** do servidor MCP da Clicksign: manifests do plugin, ícones, documentação e ferramentas de validação. O servidor MCP é um serviço hospedado em `https://mcp.clicksign.com/mcp/oauth2`.

O login é feito com a sua conta Clicksign via OAuth 2.1, no navegador. Nenhuma chave de API é colada no chat, e o conector acessa só a conta que você autorizar.

> **Status:** a versão 1.0.0 está em preparação para o diretório de plugins da OpenAI e ainda não foi publicada.

### Como começar

- **ChatGPT:** [docs/setup-chatgpt.md](docs/setup-chatgpt.md)
- **Codex:** [docs/setup-codex.md](docs/setup-codex.md)

Os guias estão em inglês e têm um resumo em português no fim.

### O que o conector faz

As 16 tools estão na tabela [Tools](#tools). Enviar um envelope ou lembrete notifica os signatários e não pode ser desfeito. O conector nunca assina documentos em nome de ninguém.

### Skill de migração da API 1.9 para a 3.0

O plugin inclui a skill `migrate-api-v1-to-v3`. Ela ajuda quem tem uma integração na API 1.9 (legada) a adaptar o código para a API 3.0 (Envelope): pede o contexto que faltar, mapeia endpoints, payloads e fluxos, explica o que não tem equivalência direta e propõe o código para testar em sandbox. Ela pode corrigir ou ajustar as chamadas que o código 1.9 já faz, mas não escreve código novo na API 1.9: um pedido de código novo na 1.9 recebe a proposta equivalente na 3.0. Não precisa de login no servidor MCP. Peça ao assistente, no projeto com o código 1.9, algo como *"Migre minha integração Clicksign da API 1.9 para a 3.0"*.

### Skill de integração do zero na API 3.0

O plugin também inclui a skill `start-clicksign-integration`, para quem ainda não tem nenhuma integração com a Clicksign. Ela lê o repositório do cliente, decide sozinha tudo o que a documentação oficial já resolve, pergunta só as regras de negócio que ficam em aberto, e entrega a integração pronta no próprio código do cliente: cliente HTTP, função de envio, webhook com validação HMAC, configuração e testes offline, além de um roteiro de sandbox até o envelope assinado e o webhook recebido. Nunca menciona nem recomenda a API 1.9: um projeto que já chama a 1.9 é direcionado à skill de migração. Não precisa de login no servidor MCP. Peça ao assistente, num projeto sem integração com a Clicksign, algo como *"Integre a Clicksign no meu projeto para enviar contratos para assinatura"*.

As duas skills pedem permissão para ler e editar arquivos, rodar os comandos do próprio projeto e acessar `developers.clicksign.com` e `sandbox.clicksign.com`. Cursor, Claude Code e Codex pedem essa aprovação pelas próprias configurações de modo de execução; a skill avisa uma vez, no início, em vez de pedir arquivo por arquivo.

Para as skills não ficarem desatualizadas, o workflow `docs-drift` roda toda segunda e sob demanda: compara as páginas da documentação citadas com `scripts/docs-sources.lock.json` e abre ou atualiza uma issue com a label `docs-drift` quando alguma muda. Os passos para resolver estão em [skills/README.md](skills/README.md).

### Desenvolvimento

```sh
npm install
npm test                      # testes do validador, do link check e do docs-drift
npm run validate              # valida os manifests; placeholders viram aviso
npm run package               # gera dist/clicksign-<versão>.zip
npm run package -- --release  # placeholders viram erro
npm run smoke                 # checa o desafio 401 e a descoberta OAuth (produção, sem login)
npm run check:links           # checa se os links da documentação citados pelas skills respondem 200
npm run check:api-3-only      # checa se uma skill (fora a de migração) menciona ou recomenda a API legada
npm run check:endpoints       # checa se todo endpoint citado é uma operação documentada numa página
                               # que a própria skill já lista no seu sources.md
npm run check:docs-drift      # compara as páginas citadas com scripts/docs-sources.lock.json
npm run docs:lock             # registra as páginas atuais no lock, depois de revisar a skill
npm run docs:lock:add         # registra só as primeiras citações de uma skill nova, sem tocar
                               # em nenhuma entrada já existente
npm run inspect               # abre o MCP Inspector para login OAuth e testes manuais
npm run inspect:cli           # compara as tools com scripts/expected-tools.json
```
