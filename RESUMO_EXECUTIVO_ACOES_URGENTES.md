# 🚨 RESUMO EXECUTIVO - AÇÕES URGENTES

## ❌ PROBLEMA CRÍTICO: Erro 406

**Causa:** Migration SQL não foi aplicada no banco de dados.

**Sintoma:** Todos os lugares que tentam buscar `icp_profile` retornam erro 406.

**Solução:** Aplicar a migration SQL abaixo.

---

## ✅ AÇÃO 1: APLICAR MIGRATION SQL (URGENTE)

**Arquivo:** `APLICAR_URGENTE_MIGRATION.sql`

**Como aplicar:**
1. Abra Supabase Dashboard
2. Vá em SQL Editor
3. Cole e execute TODO o conteúdo do arquivo `APLICAR_URGENTE_MIGRATION.sql`

**Verificar se funcionou:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_icp_profile_from_tenant';
```

---

## ✅ AÇÃO 2: DEPLOY EDGE FUNCTION

```bash
supabase functions deploy generate-icp-report
```

---

## ✅ AÇÃO 3: VERIFICAR SECRETS

No Supabase Dashboard → Settings → Edge Functions → Secrets:
- `OPENAI_API_KEY` (obrigatório)
- `SERPER_API_KEY` (opcional, para web search)

---

## 📋 O QUE FOI CORRIGIDO NO CÓDIGO

### ✅ Código Frontend
- Todos os lugares agora usam RPC function `get_icp_profile_from_tenant()`
- Import do `useSearchParams` corrigido
- Relatórios clicáveis e funcionais

### ✅ Edge Function `generate-icp-report`
- Busca critérios de análise configurados
- Gera prompt específico baseado nos critérios
- Inclui análises apenas se o critério estiver habilitado

### ✅ Integração dos Critérios
- Critérios configurados são usados na geração
- Prompt da IA específico para cada análise
- Dados reais, não mockados

---

## 🎯 FLUXO CORRETO

1. **Configurar Critérios** (Tab "Critérios de Análise" no ICP Detail)
2. **Salvar Critérios**
3. **Gerar Relatório** → Edge Function usa critérios configurados
4. **Visualizar** → Relatório formatado com análises reais

---

## ⚠️ SE AINDA DER ERRO 406

Verifique:
1. A migration SQL foi aplicada? (execute o SQL de verificação)
2. A função RPC existe no banco?
3. Todos os arquivos estão salvos?

