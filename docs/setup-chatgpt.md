# Connect Clicksign to ChatGPT

Clicksign connects to ChatGPT as a plugin backed by the hosted Clicksign MCP server. You sign in with your Clicksign account through OAuth in the browser. ChatGPT never sees your password or an API key.

You need:

- a Clicksign account;
- a ChatGPT plan that supports plugins.

## From the plugin directory

> The Clicksign plugin is not published in the directory yet. Until it is, use [developer mode](#developer-mode-before-publication).

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins) and search for **Clicksign**.
2. Select **Connect**.
3. A Clicksign login page opens. Sign in and approve the access.
4. Back in ChatGPT, try a prompt such as *"List my Clicksign templates."*

## Developer mode (before publication)

Use this to test the connector before it is listed.

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins), select the plus button, then **Add custom MCP server**.
2. Fill in the form:
   - **MCP Server URL:** `https://mcp.clicksign.com/mcp/oauth2`
   - **Authentication:** OAuth. ChatGPT registers itself with the Clicksign authorization server (dynamic client registration), so no client ID or secret is needed.
3. Review the risk warning and select **I understand and want to continue**.
4. Complete the Clicksign login in the browser.

## After you sign in

- **One Clicksign account:** it is selected automatically.
- **More than one account:** ChatGPT shows the list. Pick one by name, for example *"Use the account ACME"*. The choice is kept for later conversations of the same connection.

Try:

- *"Who still needs to sign my latest envelope?"*
- *"Send the 'NDA' template to maria@example.com for signature."*
- *"Send a reminder to the pending signers of 'ACME Contract'."*

Sending an envelope or a reminder emails the signers (or sends WhatsApp/SMS when configured) and cannot be undone, so confirm the details before you approve the action.

## Troubleshooting

| Symptom | What to do |
|---|---|
| The login page does not open | Allow pop-ups for chatgpt.com and select **Connect** again. |
| *"select_account is required"* | Your login has more than one Clicksign account. Ask ChatGPT to list them and pick one. |
| The connection expired | Disconnect Clicksign in ChatGPT settings and connect again. |

---

## Resumo em português

1. **Depois da publicação:** em [ChatGPT Plugins](https://chatgpt.com/plugins), busque **Clicksign**, clique em **Connect** e faça login na Clicksign.
2. **Antes da publicação (developer mode):** use **Add custom MCP server** com a URL `https://mcp.clicksign.com/mcp/oauth2` e autenticação OAuth. Não é preciso client ID nem segredo.
3. **Várias contas:** se o seu login tiver mais de uma conta Clicksign, escolha uma pelo nome, por exemplo *"Use a conta ACME"*.
4. **Envios:** enviar envelope ou lembrete notifica os signatários e não pode ser desfeito. Confira antes de aprovar.
