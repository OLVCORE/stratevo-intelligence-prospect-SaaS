# 📋 GUIA: APLICAR FASE 1 NO SUPABASE

## ✅ AÇÕES NECESSÁRIAS

Você precisa aplicar **3 migrations** e fazer **deploy de 4 Edge Functions** no Supabase.

---

## 🗄️ PASSO 1: APLICAR MIGRATIONS (SQL Editor)

### 1.1. Migration: AI Voice SDR
**Arquivo:** `supabase/migrations/20250122000020_ai_voice_sdr.sql`

**Como aplicar:**
1. Acesse o Supabase Dashboard → SQL Editor
2. Copie TODO o conteúdo do arquivo `supabase/migrations/20250122000020_ai_voice_sdr.sql`
3. Cole no SQL Editor
4. Clique em "Run" ou pressione `Ctrl+Enter`
5. Aguarde confirmação de sucesso

**O que cria:**
- Tabela `ai_voice_calls`
- Tabela `ai_voice_scripts`
- Índices e RLS policies

---

### 1.2. Migration: Smart Templates
**Arquivo:** `supabase/migrations/20250122000021_smart_templates.sql`

**Como aplicar:**
1. Acesse o Supabase Dashboard → SQL Editor
2. Copie TODO o conteúdo do arquivo `supabase/migrations/20250122000021_smart_templates.sql`
3. Cole no SQL Editor
4. Clique em "Run" ou pressione `Ctrl+Enter`
5. Aguarde confirmação de sucesso

**O que cria:**
- Tabela `smart_templates`
- Tabela `template_ab_tests`
- Tabela `template_performance`
- Índices e RLS policies

---

### 1.3. Migration: Revenue Intelligence
**Arquivo:** `supabase/migrations/20250122000023_revenue_intelligence.sql`

**Como aplicar:**
1. Acesse o Supabase Dashboard → SQL Editor
2. Copie TODO o conteúdo do arquivo `supabase/migrations/20250122000023_revenue_intelligence.sql`
3. Cole no SQL Editor
4. Clique em "Run" ou pressione `Ctrl+Enter`
5. Aguarde confirmação de sucesso

**O que cria:**
- Tabela `revenue_forecasts`
- Tabela `deal_risk_scores`
- Tabela `pipeline_health_scores`
- Tabela `next_best_actions`
- Tabela `deal_scores`
- Índices e RLS policies

---

## 🚀 PASSO 2: DEPLOY DAS EDGE FUNCTIONS

### 2.1. Deploy via PowerShell (Recomendado)

Execute os comandos abaixo no PowerShell na raiz do projeto:

```powershell
# 1. AI Voice Call
npx supabase functions deploy crm-ai-voice-call --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

# 2. Smart Template Generator
npx supabase functions deploy crm-generate-smart-template --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

# 3. Predictive Forecast
npx supabase functions deploy crm-predictive-forecast --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

# 4. Deal Risk Analysis
npx supabase functions deploy crm-deal-risk-analysis --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

### 2.2. Deploy via Supabase Dashboard (Alternativa)

1. Acesse o Supabase Dashboard → Edge Functions
2. Para cada função, clique em "Deploy" e faça upload do arquivo `index.ts` correspondente:
   - `supabase/functions/crm-ai-voice-call/index.ts`
   - `supabase/functions/crm-generate-smart-template/index.ts`
   - `supabase/functions/crm-predictive-forecast/index.ts`
   - `supabase/functions/crm-deal-risk-analysis/index.ts`

---

## ✅ PASSO 3: VERIFICAR CONFIGURAÇÕES

### 3.1. Verificar se `app_config` existe

Execute no SQL Editor:

```sql
SELECT * FROM public.app_config WHERE key = 'supabase_url';
```

**Se não existir**, execute a migration:
- `supabase/migrations/20250122000019_create_app_config_table.sql`

### 3.2. Verificar se `pg_net` está habilitado

Execute no SQL Editor:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Se não estiver habilitado**, execute:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 📋 CHECKLIST FINAL

- [ ] Migration `20250122000020_ai_voice_sdr.sql` aplicada
- [ ] Migration `20250122000021_smart_templates.sql` aplicada
- [ ] Migration `20250122000023_revenue_intelligence.sql` aplicada
- [ ] Edge Function `crm-ai-voice-call` deployada
- [ ] Edge Function `crm-generate-smart-template` deployada
- [ ] Edge Function `crm-predictive-forecast` deployada
- [ ] Edge Function `crm-deal-risk-analysis` deployada
- [ ] Tabela `app_config` existe e tem `supabase_url`
- [ ] Extensão `pg_net` está habilitada

---

## 🧪 TESTAR APÓS APLICAR

1. **Testar no Frontend:**
   - Navegar para `/crm/leads` → Ver botão "IA Voice Call"
   - Navegar para `/crm/email-templates` → Ver aba "Smart Templates IA"
   - Navegar para `/crm/analytics` → Ver aba "Previsão Preditiva (IA)"

2. **Testar Edge Functions:**
   - Abrir Console do navegador (F12)
   - Verificar se não há erros ao clicar nos botões
   - Verificar se as chamadas às Edge Functions retornam sucesso

---

## ⚠️ IMPORTANTE

- **NÃO** execute as migrations em ordem diferente
- **NÃO** pule nenhuma migration
- **AGUARDE** confirmação de sucesso antes de passar para a próxima
- Se houver erro, **COPIE A MENSAGEM DE ERRO** e me envie

---

**Pronto! Após aplicar tudo, a FASE 1 estará 100% funcional!** 🚀

