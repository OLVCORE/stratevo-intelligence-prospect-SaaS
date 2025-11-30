# ✅ CORREÇÃO APLICADA: Migrations FASE 1

## 🔧 PROBLEMA IDENTIFICADO

**Erro:** `ERROR: 42P01: relation "public.user_tenants" does not exist`

**Causa:** As migrations da FASE 1 estavam usando `user_tenants`, mas a tabela correta é `tenant_users` e o padrão usado no projeto é a função `get_current_tenant_id()`.

---

## ✅ CORREÇÕES APLICADAS

### 1. ✅ `20250122000020_ai_voice_sdr.sql`
**Corrigido:** Todas as RLS policies agora usam `get_current_tenant_id()` ao invés de `user_tenants`

**Antes:**
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid()
    AND ut.tenant_id = ai_voice_calls.tenant_id
  )
)
```

**Depois:**
```sql
USING (tenant_id = (SELECT get_current_tenant_id()))
```

---

### 2. ✅ `20250122000021_smart_templates.sql`
**Corrigido:** Todas as RLS policies agora usam `get_current_tenant_id()`

---

### 3. ✅ `20250122000023_revenue_intelligence.sql`
**Corrigido:** Todas as RLS policies agora usam `get_current_tenant_id()`

---

## 🎯 PADRÃO CORRETO USADO

Todas as migrations agora seguem o mesmo padrão das migrations existentes:

```sql
-- Para SELECT
USING (tenant_id = (SELECT get_current_tenant_id()))

-- Para INSERT
WITH CHECK (tenant_id = (SELECT get_current_tenant_id()))

-- Para UPDATE
USING (tenant_id = (SELECT get_current_tenant_id()))
WITH CHECK (tenant_id = (SELECT get_current_tenant_id()))

-- Para DELETE
USING (tenant_id = (SELECT get_current_tenant_id()))
```

---

## ✅ PRÓXIMOS PASSOS

Agora você pode aplicar as migrations novamente no Supabase SQL Editor:

1. ✅ `20250122000020_ai_voice_sdr.sql` - **CORRIGIDA**
2. ✅ `20250122000021_smart_templates.sql` - **CORRIGIDA**
3. ✅ `20250122000023_revenue_intelligence.sql` - **CORRIGIDA**

**Todas as migrations agora devem funcionar corretamente!** 🚀

