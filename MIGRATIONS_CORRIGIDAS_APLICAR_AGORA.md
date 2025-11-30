# ✅ MIGRATIONS CORRIGIDAS - APLICAR AGORA

## 🔧 CORREÇÃO APLICADA

**Problema:** `ERROR: 42P01: relation "public.user_tenants" does not exist`

**Solução:** Todas as 3 migrations foram corrigidas para usar `get_current_tenant_id()` ao invés de `user_tenants`.

---

## ✅ MIGRATIONS CORRIGIDAS

1. ✅ `supabase/migrations/20250122000020_ai_voice_sdr.sql` - **CORRIGIDA**
2. ✅ `supabase/migrations/20250122000021_smart_templates.sql` - **CORRIGIDA**
3. ✅ `supabase/migrations/20250122000023_revenue_intelligence.sql` - **CORRIGIDA**

---

## 📋 APLICAR NO SUPABASE (ORDEM)

### 1. Migration: AI Voice SDR
**Arquivo:** `supabase/migrations/20250122000020_ai_voice_sdr.sql`

1. Abra o arquivo
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute (Run)
5. ✅ Aguarde confirmação de sucesso

---

### 2. Migration: Smart Templates
**Arquivo:** `supabase/migrations/20250122000021_smart_templates.sql`

1. Abra o arquivo
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute (Run)
5. ✅ Aguarde confirmação de sucesso

---

### 3. Migration: Revenue Intelligence
**Arquivo:** `supabase/migrations/20250122000023_revenue_intelligence.sql`

1. Abra o arquivo
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute (Run)
5. ✅ Aguarde confirmação de sucesso

---

## 🚀 DEPOIS DAS MIGRATIONS: DEPLOY EDGE FUNCTIONS

Execute no PowerShell:

```powershell
.\DEPLOY_EDGE_FUNCTIONS_FASE1.ps1
```

Ou manualmente:

```powershell
npx supabase functions deploy crm-ai-voice-call --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
npx supabase functions deploy crm-generate-smart-template --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
npx supabase functions deploy crm-predictive-forecast --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
npx supabase functions deploy crm-deal-risk-analysis --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

---

## ✅ CHECKLIST

- [ ] Migration `20250122000020_ai_voice_sdr.sql` aplicada com sucesso
- [ ] Migration `20250122000021_smart_templates.sql` aplicada com sucesso
- [ ] Migration `20250122000023_revenue_intelligence.sql` aplicada com sucesso
- [ ] 4 Edge Functions deployadas
- [ ] Testar no frontend

---

**Todas as migrations foram corrigidas e estão prontas para aplicar!** 🚀

