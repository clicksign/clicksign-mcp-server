# Install Clicksign in Codex

This repository is also a Codex marketplace: `.agents/plugins/marketplace.json` lists the `clicksign` plugin, which is the repository root itself. Codex reads the root `plugin.json` and `mcp.json`, the same package that is submitted for ChatGPT.

You need a Clicksign account and the Codex CLI or the ChatGPT desktop app.

## Install from GitHub

```sh
codex plugin marketplace add clicksign/clicksign-mcp-server
```

Then open the Plugins Directory in Codex, choose the **Clicksign** marketplace and install **Clicksign**.

Authentication happens when a Clicksign tool is used (`ON_USE`). The first time one runs, a browser window opens for the Clicksign login.

To pick up a new version later:

```sh
codex plugin marketplace upgrade clicksign
```

## Install from a local clone

```sh
git clone https://github.com/clicksign/clicksign-mcp-server.git
codex plugin marketplace add ./clicksign-mcp-server
```

Use this to try changes to the manifests before they are released.

## Enable or disable it for one project

In the project's `.codex/config.toml`:

```toml
[plugins."clicksign@clicksign"]
enabled = true
```

The key is `<plugin name>@<marketplace name>`, and both are `clicksign`. Codex loads the project config only for trusted projects.

## Check the install

```sh
codex plugin marketplace list
```

The `clicksign` marketplace should appear. Then open a **new** conversation, select **Clicksign** from the `@` menu and ask *"List my Clicksign templates."* to trigger the login and a first call.

To start the login without a conversation, run `codex mcp login clicksign --no-browser`.

---

## Resumo em português

1. **Instalar:** rode `codex plugin marketplace add clicksign/clicksign-mcp-server` e instale **Clicksign** pelo Plugins Directory do Codex.
2. **Login:** acontece quando uma ferramenta é usada (`ON_USE`). O navegador abre para o login da Clicksign. Teste em uma conversa nova, selecionando o plugin no menu `@`.
3. **Atualizar:** `codex plugin marketplace upgrade clicksign`.
4. **Por projeto:** use `[plugins."clicksign@clicksign"]` no `.codex/config.toml` do projeto.
