# 🚨 PLANO URGENTE: RESTAURAR ENRIQUECIMENTO COMPLETO

## 📊 DIAGNÓSTICO ATUAL

### ❌ **PROBLEMAS CRÍTICOS IDENTIFICADOS**

1. **CORS AINDA BLOQUEANDO** (PRIORIDADE MÁXIMA)
   - Erro: `Response to preflight request doesn't pass access control check: It does not have HTTP ok status.`
   - Afeta: `scan-prospect-website` e `usage-verification`
   - **Causa**: Edge Functions **NÃO FORAM DEPLOYADAS** com as correções de CORS
   - **Impacto**: Nenhum enriquecimento de website/LinkedIn funciona

2. **ERROS 400 BAD REQUEST** (PRIORIDADE ALTA)
   - Múltiplos erros em PATCH para `companies`
   - Erros em: `conversations`, `decision_makers`, `leads_pool`, `account_strategies`, `messages`, `insights`, `legal_data`, `digital_presence`
   - **Causa provável**: RLS (Row Level Security) ou validação de schema
   - **Impacto**: Dados não estão sendo salvos no banco

3. **DADOS NÃO APARECEM NO FRONTEND**
   - Website Fit vazio
   - LinkedIn vazio
   - Decisores não aparecem
   - Leads não aparecem
   - **Causa**: Combinação de CORS + erros 400

---

## ✅ **O QUE ESTÁ FUNCIONANDO**

- ✅ Receita Federal (BrasilAPI) - funcionando
- ✅ Enrichment 360 - calculando scores
- ✅ Apollo enrichment - concluindo (mas dados não salvam por causa dos 400)

---

## 🚀 **AÇÃO IMEDIATA (EXECUTAR AGORA)**

### **PASSO 1: DEPLOY DAS EDGE FUNCTIONS COM CORREÇÕES CORS**

**⚠️ CRÍTICO**: As correções de CORS foram feitas no código, mas **NÃO FORAM DEPLOYADAS**.

```bash
# 1. Verificar se está no diretório correto
cd c:\Projects\stratevo-intelligence-prospect

# 2. Deploy scan-prospect-website (com correções CORS)
supabase functions deploy scan-prospect-website

# 3. Deploy usage-verification (com correções CORS)
supabase functions deploy usage-verification
```

**Verificar após deploy:**
- Ir para: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
- Confirmar que ambas as funções aparecem como "Active"
- Verificar logs para confirmar que OPTIONS está sendo tratado

---

### **PASSO 2: DIAGNOSTICAR ERROS 400**

**Verificar RLS Policies:**

```sql
-- Verificar políticas RLS em companies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'companies';
```

**Verificar se tenant_id está sendo passado:**

Os erros 400 podem ser causados por:
1. **RLS bloqueando** - falta `tenant_id` no WHERE
2. **Campos obrigatórios faltando** - NOT NULL constraints
3. **Formato de dados incorreto** - JSONB malformado

**Ação:**
- Verificar logs do Supabase Dashboard → Logs → API
- Procurar por erros detalhados dos PATCH requests
- Verificar se `tenant_id` está sendo incluído em todas as queries

---

### **PASSO 3: VERIFICAR VARIÁVEIS DE AMBIENTE**

**No Supabase Dashboard → Settings → Edge Functions → Secrets:**

Verificar se estão configuradas:
- ✅ `SERPER_API_KEY`
- ✅ `OPENAI_API_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL`

---

## 🔍 **VERIFICAÇÕES PÓS-DEPLOY**

### **Teste 1: CORS Resolvido**

1. Abrir console do navegador
2. Clicar em "Enriquecimento Website" em uma empresa
3. **Esperado**: Não deve aparecer erro CORS
4. **Esperado**: Log `[SCAN-PROSPECT-WEBSITE] ✅ OPTIONS preflight recebido` nos logs do Supabase

### **Teste 2: Dados Salvando**

1. Executar enriquecimento
2. Verificar logs do Supabase → Logs → API
3. **Esperado**: PATCH requests devem retornar 200 (não 400)
4. **Esperado**: Dados devem aparecer no frontend após refresh

### **Teste 3: Enriquecimento Completo**

1. Executar "Enriquecimento 360"
2. **Esperado**: Website preenchido
3. **Esperado**: LinkedIn preenchido
4. **Esperado**: Decisores aparecem
5. **Esperado**: Leads aparecem

---

## 📋 **CHECKLIST DE RESTAURAÇÃO**

- [ ] **PASSO 1**: Deploy `scan-prospect-website` com correções CORS
- [ ] **PASSO 1**: Deploy `usage-verification` com correções CORS
- [ ] **PASSO 2**: Verificar RLS policies em `companies`
- [ ] **PASSO 2**: Verificar se `tenant_id` está sendo passado
- [ ] **PASSO 3**: Verificar variáveis de ambiente no Supabase
- [ ] **TESTE 1**: CORS resolvido (sem erros no console)
- [ ] **TESTE 2**: Dados salvando (PATCH retorna 200)
- [ ] **TESTE 3**: Enriquecimento completo funcionando

---

## 🚨 **SE OS PROBLEMAS PERSISTIREM**

### **CORS ainda bloqueando após deploy:**

1. **Limpar cache do navegador** (Ctrl+Shift+Delete)
2. **Verificar logs do Supabase** → Edge Functions → Logs
3. **Testar com curl** para confirmar que OPTIONS retorna 200:
   ```bash
   curl -X OPTIONS https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/scan-prospect-website \
     -H "Origin: https://stratevo-intelligence-prospect-saa.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
4. **Se ainda falhar**: Pode ser bug do Supabase - reportar no GitHub

### **Erros 400 ainda ocorrendo:**

1. **Verificar logs detalhados** no Supabase Dashboard → Logs → API
2. **Verificar RLS policies** - pode precisar ajustar políticas
3. **Verificar schema** - campos obrigatórios podem estar faltando
4. **Testar com Service Role Key** diretamente (bypass RLS) para confirmar se é RLS

---

## 📝 **PRÓXIMOS PASSOS APÓS RESTAURAÇÃO**

1. **MC-6**: Sincronismo Interno (Empresas ↔ Qualified ↔ Leads)
2. **MC-7**: Go-Live Técnico (testes completos)
3. **Monitoramento**: Verificar logs diariamente
4. **Documentação**: Atualizar guias de deploy

---

## ⚠️ **IMPORTANTE**

**NÃO fazer mais alterações de código até:**
1. ✅ Deploy das Edge Functions com correções CORS
2. ✅ CORS resolvido (testado e confirmado)
3. ✅ Erros 400 diagnosticados e corrigidos

**Foco total em:**
- Deploy das correções existentes
- Diagnóstico dos erros 400
- Restauração da funcionalidade básica
