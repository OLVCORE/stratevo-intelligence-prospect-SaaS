# Recuperação: Aba Decisores em branco (Apollo)

## Nova estrutura: 3 abas por fonte (Apollo | LinkedIn | Lusha)

A aba **Decisores** do dossiê foi separada em **três sub-abas**, cada uma exclusiva da sua fonte:

| Sub-aba | Fonte | O que mostra |
|--------|--------|--------------|
| **Decisores Apollo** | Apollo.io | Apenas decisores da API Apollo (`mixed_people/api_search`). Botão "Extrair Decisores (Apollo)" + Apollo Org ID manual. Sem fallback. |
| **Decisores LinkedIn** | LinkedIn / PhantomBuster | Contatos com `raw_linkedin_data`. Botão "Coletar do LinkedIn" abre o coletor de leads. |
| **Decisores Lusha** | Lusha | Contatos com email ou telefone (Lusha complementa após Apollo). Lista somente quem tem contato preenchido. |

Assim não há mais mistura de fallback (LinkedIn → Apollo → Lusha → Hunter) numa única tela: cada fonte tem sua aba e seu botão.

---

## Situação (Apollo em branco)

A aba **Decisores** do Dossiê Estratégico mostra 0 leads, 0 decisores, 0 emails, mesmo após clicar em **Extrair Decisores**. A inteligência (Apollo → decisores → banco → tela) já funcionou no passado; hoje a tela continua vazia.

---

## Causa raiz (única)

A **Edge Function em produção** (`enrich-apollo-decisores`) ainda chama o **endpoint antigo** da Apollo:

- **Antigo (deprecado):** `https://api.apollo.io/v1/mixed_people/search`  
- **Resposta da Apollo:** `422 - "This endpoint is deprecated... Please use mixed_people/api_search"`  
- **Efeito:** 0 pessoas retornadas → nada é salvo em `decision_makers` → a aba recarrega e continua vazia.

O **código no repositório** já está correto:

- Base: `https://api.apollo.io/api/v1`
- Endpoint: `mixed_people/api_search`
- Arquivo: `supabase/functions/enrich-apollo-decisores/index.ts`

Ou seja: o que está rodando no Supabase **não** é essa versão. O problema não é lógica nem front; é a **versão da função publicada**.

---

## Solução em um passo: publicar a função atual

É preciso **fazer deploy** da Edge Function `enrich-apollo-decisores` que está no código (com `api/v1` e `mixed_people/api_search`).

### Opção A – CLI (quando der)

```bash
cd c:\Projects\stratevo-intelligence-prospect
supabase functions deploy enrich-apollo-decisores
```

- Se aparecer erro de Docker: subir o Docker Desktop e rodar de novo.
- Se aparecer erro de rede/proxy: tentar sem VPN/proxy ou em outra rede; ou usar Opção B.

### Opção B – Dashboard Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto.
2. **Edge Functions** → `enrich-apollo-decisores`.
3. Se existir **“Deploy”**, **“Redeploy”** ou **“Sync from GitHub”**, use para publicar a versão mais recente do repositório (onde já está o `api_search`).

### Opção C – Outra máquina

Em um PC onde o `supabase functions deploy` já funcione (Docker e rede ok), clonar o repo, rodar o mesmo comando acima e fazer o deploy a partir daí.

---

## O que acontece depois do deploy certo

1. Usuário abre o dossiê (ex.: Ceramfix) → aba **Decisores**.
2. Clica em **Extrair Decisores** (ou informa o Apollo Organization ID e dispara).
3. A Edge Function chama `https://api.apollo.io/api/v1/mixed_people/api_search` (já no código).
4. A Apollo retorna pessoas; a função grava em `decision_makers`.
5. O front chama `loadDecisorsData()` (após ~1,5 s) e lê de `decision_makers`.
6. A aba passa a mostrar totais e a lista de decisores.

Ou seja: **não é preciso reescrever fluxo nem “refazer a inteligência”**; basta a função em produção ser a que já está no código.

---

## Como confirmar que a versão certa está no ar

Nos **logs** da função `enrich-apollo-decisores` no Supabase, após uma nova extração, deve aparecer:

```text
[ENRICH-APOLLO] 🌐 People search URL: https://api.apollo.io/api/v1/mixed_people/api_search
```

- Se essa linha aparecer e não houver mais 422 “deprecated”, a versão correta está em produção.
- Se ainda aparecer 422 “deprecated”, a URL nos logs será a que está sendo chamada de fato (útil para debug).

---

## Resumo

| O que                         | Estado |
|------------------------------|--------|
| Código da Edge Function      | ✅ Correto (api/v1 + api_search) |
| Front (Extrair → reload)      | ✅ Ok; só depende de dados no banco |
| Salvamento em `decision_makers` | ✅ Ok quando a Apollo retorna pessoas |
| **Função publicada no Supabase** | ❌ Ainda antiga (endpoint deprecado) |

**Ação:** fazer deploy da `enrich-apollo-decisores` (CLI, Dashboard ou outra máquina). Depois disso, a aba Decisores volta a preencher quando a extração tiver sucesso.
