# Handoff: conexão do plugin Clicksign ao MCP

Data do diagnóstico: 14/10/2026. Objetivo: fazer o plugin local `clicksign@clicksign` autenticar no MCP hospedado e executar `list_templates` em uma conversa Work/Codex.

## Estado confirmado

- O repositório atual é o pacote de distribuição do plugin; o servidor hospedado é implementado no repositório irmão `../mcp-api-tavola-v3`.
- `codex-cli 0.162.1` mostra `clicksign@clicksign` versão `1.0.0` como `installed, enabled`, com política de autenticação `ON_USE`. `codex mcp get clicksign` encontra o servidor quando `mcp.json` contém apenas `type` e `url`.
- O endpoint `https://mcp.clicksign.com/mcp/oauth2` responde ao `POST initialize` anônimo com `401` e `WWW-Authenticate: Bearer resource_metadata="https://mcp.clicksign.com/.well-known/oauth-protected-resource"`.
- Os documentos de recurso protegido e servidor de autorização respondem `200` com JSON. Anunciam `registration_endpoint` para DCR e PKCE `S256`. O `npm run smoke` original passa porque testa `POST` e metadados, mas não testa `GET` no endpoint MCP.
- `GET /mcp/oauth2` anônimo, com `Accept: text/event-stream` ou `application/json`, não retorna cabeçalhos nem corpo em 5 segundos. Já `codex mcp login clicksign --no-browser` termina após cerca de 30 segundos com `Metadata error: OAuth metadata discovery failed ... Caused by: HTTP request failed: error decoding response body`. Com `--oauth-client-registration dcr`, a falha é a mesma.
- Um teste temporário de `GET` adicionado ao smoke falhou com timeout; a alteração foi revertida a pedido do usuário. Não houve login concluído nem chamada autenticada a `list_templates`.

Reprodução no estado atual:

```sh
codex plugin list --marketplace clicksign
codex mcp get clicksign
codex mcp login clicksign --no-browser
curl -i --max-time 5 -H 'Accept: text/event-stream' https://mcp.clicksign.com/mcp/oauth2
npm run smoke
```

Os dois primeiros comandos confirmam a instalação; o login falha na descoberta; o `curl` expira sem resposta; o smoke original passa porque não verifica esse `GET`.

## Causa provável e correção necessária

No servidor, `../mcp-api-tavola-v3/cmd/server/oauth_facade.go`, a função `challengeMiddleware` encaminha qualquer método diferente de `POST` diretamente ao transporte MCP (`if r.Method != http.MethodPost { next.ServeHTTP(w, r); return }`). A rota está em `../mcp-api-tavola-v3/cmd/server/main.go`: `/mcp/oauth2` usa esse middleware antes de `mcpHandler`. Assim, o `GET` anônimo não recebe o desafio OAuth e fica aguardando o stream. Esse comportamento é a explicação mais forte para o timeout do login do Codex; falta um trace do cliente para provar qual requisição específica produziu o erro de decodificação.

No repositório do servidor:

1. Fazer `challengeMiddleware` exigir e validar o bearer também para `GET` no endpoint OAuth, retornando `401` imediatamente com `WWW-Authenticate` e `resource_metadata` quando não houver credencial. Preservar o fluxo de `POST`; tratar métodos suportados de forma explícita e não expor o stream com bearer inválido.
2. Adicionar testes de `GET` anônimo (desafio `401`), bearer inválido (`401`) e bearer válido (encaminha ao handler), além dos testes existentes de `POST`.
3. Publicar a correção no ambiente que atende `mcp.clicksign.com`. Uma alteração local do plugin não modifica o servidor de produção.

No repositório deste plugin, após a correção do servidor:

1. Ampliar `scripts/smoke.mjs` para exigir que `GET /mcp/oauth2` anônimo retorne rapidamente `401` com `resource_metadata`; assim o problema não volta a passar despercebido.
2. Corrigir `docs/setup-codex.md`: ele diz `ON_FIRST_USE`, enquanto o marketplace local e o CLI usam `ON_USE`. Atualizar também as instruções para testar em uma nova conversa Work/Codex, selecionando o plugin no menu `@`.
3. Rodar `npm test`, `npm run validate`, `npm run smoke` e `codex mcp login clicksign --no-browser`. Depois completar o OAuth no navegador e confirmar `list_templates` em uma nova conversa.

## Experimento com o manifesto OAuth

A [documentação da OpenAI](https://developers.openai.com/plugins/build/plugins) mostra `extensions.com.openai.auth` dentro de cada servidor em `mcp.json`. Durante este diagnóstico, adicionar `auth.type: "oauth"` (com e sem `client.mode: "dcr"`) ao manifesto fez o `codex-cli 0.162.1` omitir completamente o servidor da lista de MCPs, embora o plugin continuasse instalado. O manifesto original foi restaurado e reinstalado; o servidor voltou a aparecer. Não reaplicar essa alteração sem investigar a compatibilidade do cliente/manifesto. Ela não resolve o `GET` pendente no servidor.

## Contexto da conversa e limites

O plugin ainda não está publicado no diretório universal. Por isso, uma busca de plugins por `Clicksign` retorna vazia e não demonstra que a instalação local está ausente. A resposta anterior de que “não há conexão Clicksign” foi baseada nessa busca e na falta da ferramenta nesta sessão. A [documentação de teste](https://developers.openai.com/plugins/deploy/connect-chatgpt) orienta instalar o plugin local, abrir uma nova conversa e selecioná-lo pelo menu `@`.

O servidor de produção não foi alterado neste diagnóstico. A única alteração intencional deixada neste repositório por este handoff é este arquivo. A mudança prévia do usuário em `.agents/plugins/marketplace.json` (`ON_FIRST_USE` para `ON_USE`) foi preservada. Há também um `.DS_Store` não rastreado preexistente. Um pacote de rascunho `dist/clicksign-1.0.0.zip` foi gerado durante o teste e é ignorado pelo Git.
