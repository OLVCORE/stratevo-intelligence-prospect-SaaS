# 🔍 Análise de Erros do Console - Vercel

## 📊 Resumo dos Erros Encontrados

### 1. ❌ Erros CORS (Críticos)
**Problema:** Várias Edge Functions bloqueadas por CORS

**Edge Functions afetadas:**
- `usage-verification` - Bloqueado por CORS
- `enrich-apollo-decisores` - Bloqueado por CORS (múltiplas tentativas)
- `stc-agent-internal` - Bloqueado por CORS
- `company-intelligence-chat` - Bloqueado por CORS
- `enrich-apollo` - Bloqueado por CORS

**Sintoma:**
```
Access to fetch at 'https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/[FUNCTION]' 
from origin 'https://stratevo-intelligence-prospect-saa-661q5e6h3-olv-core444.vercel.app' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

**Causa Provável:**
- Edge Functions não estão retornando headers CORS corretos no OPTIONS (preflight)
- Ou estão retornando erro antes de processar o OPTIONS

**Solução:**
Verificar se todas as Edge Functions têm:
```typescript
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

---

### 2. ❌ Erros 400/406 (Queries Supabase)

**Problema:** Queries ao Supabase retornando 400 (Bad Request) ou 406 (Not Acceptable)

**Queries afetadas:**
- `users?select=tenant_id&auth_user_id=eq...` → **406**
- `qualified_prospects?select=tenant_id%2Cpurchase_intent_analysis&id=eq...` → **400**
- `decision_makers?select=*&is_decision_maker=eq.true&validation_status=eq.valid&company_id=eq...` → **400**
- `tenant_products?select=*&tenant_id=eq...&is_active=eq.true&order=display_order.asc` → **400**
- `tenant_search_configs?select=*&tenant_id=eq...` → **406**

**Causa Provável:**
- **406 (Not Acceptable):** Headers `Accept` ou `Content-Type` incorretos
- **400 (Bad Request):** 
  - Campos que não existem na tabela
  - Tipos de dados incorretos
  - RLS (Row Level Security) bloqueando a query

**Solução:**
1. Verificar se os campos existem nas tabelas
2. Verificar RLS policies
3. Verificar headers nas requisições

---

### 3. ❌ Erros 500 (Edge Functions)

**Problema:** Edge Functions retornando erro interno

**Edge Functions afetadas:**
- `calculate-enhanced-purchase-intent` → **500**
- `generate-company-report` → **500** (múltiplas tentativas - 20+ vezes)

**Causa Provável:**
- Erro no código da Edge Function
- Variável de ambiente faltando
- Timeout ou erro de processamento

**Solução:**
- Verificar logs no Supabase Dashboard
- Verificar se todas as variáveis de ambiente estão configuradas
- Adicionar tratamento de erro mais robusto

---

### 4. ❌ Erros 404 (Not Found)

**Problema:** Recursos não encontrados

**Recursos afetados:**
- `servicodados.ibge.gov.br/api/v2/cnae/subclasses/33.29-5/99` → **404**
- `executive_summaries?select=*&company_id=eq...` → **404**

**Causa Provável:**
- CNAE `33.29-5/99` não existe na API do IBGE
- Tabela `executive_summaries` não tem registro para aquele `company_id`

**Solução:**
- Validar CNAE antes de buscar na API do IBGE
- Tratar 404 como "não encontrado" (não é erro crítico)

---

### 5. ❌ Erro 401 (Unauthorized)

**Problema:** Acesso não autorizado

**Recurso afetado:**
- `manifest.json` → **401**

**Causa Provável:**
- Arquivo `manifest.json` está protegido por autenticação
- Ou não existe e está retornando 401

**Solução:**
- Verificar se `manifest.json` existe e está acessível publicamente
- Ou remover referência se não for necessário

---

## 🎯 Priorização

### 🔴 **CRÍTICO - Corrigir Imediatamente:**
1. **Erros CORS** - Bloqueiam funcionalidades essenciais
2. **Erros 500** - `generate-company-report` falhando 20+ vezes

### 🟡 **IMPORTANTE - Corrigir em Breve:**
3. **Erros 400/406** - Queries Supabase falhando
4. **Erros 404** - Validar antes de buscar

### 🟢 **BAIXA PRIORIDADE:**
5. **Erro 401** - `manifest.json` (não crítico)

---

## 🔧 Ações Recomendadas

### 1. Verificar CORS em Todas as Edge Functions

**Arquivos para verificar:**
- `supabase/functions/usage-verification/index.ts`
- `supabase/functions/enrich-apollo-decisores/index.ts`
- `supabase/functions/stc-agent-internal/index.ts`
- `supabase/functions/company-intelligence-chat/index.ts`
- `supabase/functions/enrich-apollo/index.ts`

**Padrão esperado:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  // ... resto do código
});
```

### 2. Verificar Logs das Edge Functions com Erro 500

**Acessar:**
- Supabase Dashboard → Edge Functions → `generate-company-report` → Logs
- Supabase Dashboard → Edge Functions → `calculate-enhanced-purchase-intent` → Logs

**Procurar por:**
- Erros de sintaxe
- Variáveis de ambiente faltando
- Timeouts
- Erros de API externa

### 3. Verificar Queries Supabase com Erro 400/406

**Verificar:**
- Se os campos existem nas tabelas
- Se as RLS policies permitem acesso
- Se os headers estão corretos

**Exemplo de verificação:**
```sql
-- Verificar se campo existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qualified_prospects' 
AND column_name = 'purchase_intent_analysis';

-- Verificar RLS
SELECT * FROM pg_policies 
WHERE tablename = 'qualified_prospects';
```

---

## 📝 Nota

Estes erros **NÃO estão relacionados** ao módulo de **Prospecção Avançada** que estávamos trabalhando. São problemas existentes em outras partes do sistema.

O módulo de Prospecção Avançada tem seu próprio tratamento de CORS e não deve estar gerando estes erros específicos.

