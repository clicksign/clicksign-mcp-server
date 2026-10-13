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

## Repository layout

```
plugin.json                        OpenAI plugin manifest (Agent Plugins 1.0.0 + extensions.com.openai)
mcp.json                           MCP server for ChatGPT and Codex (streamable HTTP, OAuth)
.agents/plugins/marketplace.json   Codex marketplace that installs the plugin from this repo
.claude-plugin/, .mcp.json         Claude Code plugin and marketplace (not published)
.cursor-plugin/                    Cursor plugin (not published)
assets/                            Listing icons
docs/                              Setup guides for ChatGPT and Codex
scripts/                           Validation, packaging, smoke test and MCP Inspector helpers
```

Opening this repository in Claude Code offers `clicksign` as a project MCP server, because `.mcp.json` sits at the root. That file is the Claude plugin's server config; approve it only if you want to connect.

## Development

Requires Node.js 22 or later (`.tool-versions` pins the version used here).

```sh
npm install
npm test                    # validator test suite
npm run validate            # check every manifest; placeholders are warnings
npm run package             # validate, then build dist/clicksign-<version>.zip
npm run package -- --release  # same, but placeholders are errors
```

`npm run package` puts only `plugin.json`, `mcp.json` and `assets/` in the ZIP. That ZIP is what gets uploaded at [platform.openai.com/plugins](https://platform.openai.com/plugins). The build is reproducible: the same commit produces the same SHA-256.

### Testing the connection

These commands reach the production server.

```sh
npm run smoke         # no login: checks the 401 challenge and the OAuth discovery metadata
npm run inspect       # opens the MCP Inspector web UI; sign in with OAuth and explore tools
npm run inspect:cli   # lists the tools, compares them with scripts/expected-tools.json
                      # and reports tools without a title or annotations
```

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) runs the OAuth login itself and keeps the token in its own store, so the scripts never handle credentials. Set `CLICKSIGN_MCP_URL` to point these commands at another environment.

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

As 15 tools estão na tabela [Tools](#tools). Enviar um envelope ou lembrete notifica os signatários e não pode ser desfeito. O conector nunca assina documentos em nome de ninguém.

### Desenvolvimento

```sh
npm install
npm test                      # testes do validador
npm run validate              # valida os manifests; placeholders viram aviso
npm run package               # gera dist/clicksign-<versão>.zip
npm run package -- --release  # placeholders viram erro
npm run smoke                 # checa o desafio 401 e a descoberta OAuth (produção, sem login)
npm run inspect               # abre o MCP Inspector para login OAuth e testes manuais
npm run inspect:cli           # compara as tools com scripts/expected-tools.json
```
