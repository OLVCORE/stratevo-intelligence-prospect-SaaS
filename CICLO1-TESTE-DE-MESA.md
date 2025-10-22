# 🧪 CICLO 1 - Teste de Mesa

## Objetivo
Validar SearchHub único + Company Context com dados reais.

---

## 📋 Pré-requisitos

1. **Dependências instaladas:**
   ```bash
   npm install
   ```

2. **ENV configurado** (`.env.local`):
   - ✅ Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY)
   - ✅ RECEITAWS_API_TOKEN
   - ✅ GOOGLE_API_KEY + GOOGLE_CSE_ID **OU** SERPER_API_KEY

3. **Schema atualizado no Supabase:**
   Execute o SQL em `lib/supabase/migrations/001_ciclo1_companies.sql`

4. **Servidor rodando:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testes

### 1. Health Check

**Comando:**
```bash
curl http://localhost:3000/api/health
```

**Resultado Esperado:**
```json
{
  "healthy": true,
  "checks": {
    "supabase": { "ok": true },
    "env": { "ok": true },
    "apis": {
      "receitaws": { "ok": true },
      "google-cse": { "ok": true },
      "serper": { "ok": false, "error": "API key não configurada" }
    }
  },
  "timestamp": "2025-10-21T..."
}
```

**Status HTTP:** `200` (se Supabase OK) ou `503` (se falhar)

---

### 2. Buscar por CNPJ Válido

**Interface:** Acesse http://localhost:3000

**Passos:**
1. Selecione modo "CNPJ" no SearchHub
2. Digite: `18.627.195/0001-60` (ou outro CNPJ válido)
3. Clique em "Buscar"

**Resultado Esperado:**
- ✅ Alert: "Empresa selecionada com sucesso"
- ✅ Header atualizado com nome da empresa + CNPJ
- ✅ Input limpo automaticamente
- ✅ Módulos visíveis na página

**Validação no Banco:**
```sql
SELECT 
  name, 
  cnpj, 
  capital_social, 
  status, 
  source,
  website,
  domain
FROM companies 
WHERE cnpj = '18627195000160';
```

**Verificar:**
- ✅ `capital_social` está correto (ex: `500000.00`, NÃO `500000000.00`)
- ✅ `source` = `'receitaws'` ou `'mixed'`
- ✅ `website` preenchido (se busca CSE/Serper funcionou)
- ✅ `domain` extraído corretamente

---

### 3. Buscar Mesmo CNPJ Novamente (UPSERT)

**Passos:**
1. Busque o mesmo CNPJ do teste anterior
2. Repita 2-3 vezes

**Resultado Esperado:**
- ✅ Mesma empresa selecionada
- ✅ SEM duplicação no banco
- ✅ `updated_at` atualizado
- ✅ `created_at` mantém valor original

**Validação:**
```sql
SELECT COUNT(*) FROM companies WHERE cnpj = '18627195000160';
-- Resultado: 1 (não deve duplicar)
```

---

### 4. Buscar por Website

**Passos:**
1. Selecione modo "Website" no SearchHub
2. Digite: `nubank.com.br` (ou outro website conhecido)
3. Clique em "Buscar"

**Resultado Esperado:**
- ✅ Alert: "Empresa selecionada com sucesso"
- ✅ Header atualizado
- ✅ `domain` preenchido corretamente
- ✅ `name` extraído da busca (título da página)

**Validação no Banco:**
```sql
SELECT name, domain, website, source
FROM companies 
WHERE domain = 'nubank.com.br';
```

**Verificar:**
- ✅ `domain` = `'nubank.com.br'` (sem `www.`)
- ✅ `website` com URL completa
- ✅ `source` = `'cse'` ou `'serper'`

---

### 5. Trocar Empresa (Company Context)

**Passos:**
1. Com uma empresa selecionada, clique em "Trocar" no header
2. Busque outra empresa (por CNPJ ou Website)
3. Recarregue a página (F5)

**Resultado Esperado:**
- ✅ Contexto limpo ao clicar "Trocar"
- ✅ Nova empresa selecionada após busca
- ✅ **Após F5**: empresa ainda selecionada (localStorage)

---

### 6. Teste de Erro: CNPJ Inválido

**Passos:**
1. Digite CNPJ inválido: `123`
2. Clique em "Buscar"

**Resultado Esperado:**
- ✅ Alert: "Falha: CNPJ inválido"
- ✅ Status HTTP: `422`
- ✅ Response:
  ```json
  {
    "ok": false,
    "code": "INVALID_INPUT",
    "fields": { "cnpj": "CNPJ inválido" }
  }
  ```

---

### 7. Teste de Erro: API Down

**Passos:**
1. Remova temporariamente `RECEITAWS_API_TOKEN` do `.env.local`
2. Reinicie o servidor
3. Busque um CNPJ

**Resultado Esperado:**
- ✅ Alert: "Falha: RECEITAWS_API_TOKEN missing"
- ✅ Status HTTP: `502`
- ✅ Response:
  ```json
  {
    "ok": false,
    "code": "PROVIDER_DOWN",
    "provider": "receitaws",
    "message": "RECEITAWS_API_TOKEN missing"
  }
  ```

---

### 8. Teste de Erro: Website Não Encontrado

**Passos:**
1. Remova temporariamente `GOOGLE_API_KEY` e `SERPER_API_KEY` do `.env.local`
2. Reinicie o servidor
3. Busque por Website

**Resultado Esperado:**
- ✅ Alert: "Falha: No search provider keys configured"
- ✅ Status HTTP: `502`

---

### 9. Validar Telemetria Básica

**Passos:**
1. Busque uma empresa por CNPJ
2. No banco, verifique o campo `raw`:

```sql
SELECT raw->'receitaws' as receitaws_data
FROM companies 
WHERE cnpj = '18627195000160';
```

**Verificar:**
- ✅ `raw.receitaws.json` contém resposta completa da API
- ✅ `raw.receitaws.ms` contém tempo de resposta (ms)
- ✅ `raw.receitaws.source` = `'receitaws'`
- ✅ `raw.search` (se website encontrado) contém dados do Google/Serper

---

### 10. Validar Capital Social (SEM Multiplicação)

**SQL:**
```sql
SELECT 
  name,
  capital_social,
  raw->'receitaws'->'json'->>'capital_social' as raw_capital
FROM companies 
WHERE capital_social IS NOT NULL
LIMIT 5;
```

**Verificar:**
- ✅ `capital_social` (NUMERIC) = valor correto em reais
- ✅ SEM multiplicação por 1000
- ✅ Formato: `500000.00` (não `500000000.00`)

---

## ✅ Definition of Done (DoD)

Marque todos antes de considerar o Ciclo 1 completo:

- [ ] SearchHub único funcional (CNPJ + Website)
- [ ] `/api/companies/smart-search` responde corretamente
- [ ] UPSERT idempotente (sem duplicação de CNPJ)
- [ ] `capital_social` sem multiplicação (NUMERIC correto)
- [ ] Company Context persiste no localStorage
- [ ] Header mostra empresa selecionada
- [ ] Botão "Trocar" limpa contexto
- [ ] Telemetria básica salva (`raw.receitaws.ms`, `raw.search.ms`)
- [ ] Erros 422/502 com mensagens claras
- [ ] Validação Zod em todos os inputs
- [ ] Sem vazamento de `SUPABASE_SERVICE_ROLE_KEY` no browser
- [ ] Health check funcionando
- [ ] Build sem erros TypeScript (`npm run build`)

---

## 🐛 Troubleshooting

### ❌ Erro: "supabaseAdmin is not a function"
**Solução:** Verifique que `lib/supabase/server.ts` exporta `supabaseAdmin` (não default)

### ❌ Capital x1000 (errado)
**Solução:** `toNumberBRL` apenas parseia, não multiplica. Tipo NUMERIC(16,2) no banco.

### ❌ "No search provider keys configured"
**Solução:** Configure `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` OU `SERPER_API_KEY`

### ❌ UPSERT duplicando registros
**Solução:** Verifique `onConflict: 'cnpj'` na query e constraint UNIQUE no banco

### ❌ Empresa não persiste após F5
**Solução:** Verifique se `restoreCompanyFromStorage()` está sendo chamado no layout

---

**✅ CICLO 1 COMPLETO!**

Aguardando **Ciclo 2 - Lista de Empresas & Seleção** 🚀

