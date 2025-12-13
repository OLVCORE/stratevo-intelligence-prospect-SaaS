# 🔍 ANÁLISE DO PROBLEMA - SEM ALTERAÇÕES

## ⚠️ SITUAÇÃO ATUAL IDENTIFICADA

### Migrations que afetam RLS de `tenant_products`:

1. **`20250201000001_tenant_products_catalog.sql`** (15/02/2025)
   - Cria política: `tenant_products_policy` (FOR ALL)
   - Usa: `SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()`
   - ❌ **PROBLEMA**: Não permite `auth.uid() IS NULL` (SERVICE_ROLE_KEY)

2. **`20250215000001_fix_tenant_products_rls.sql`** (15/02/2025)
   - Remove política antiga
   - Cria nova: `tenant_products_policy` (FOR ALL)
   - Usa: `get_user_tenant_ids()` (função RPC)
   - ❌ **PROBLEMA**: Ainda não permite `auth.uid() IS NULL` (SERVICE_ROLE_KEY)

3. **`20250220000001_fix_tenant_products_insert_rls.sql`** (20/02/2025)
   - Remove `tenant_products_policy`
   - Cria políticas separadas (SELECT, INSERT, UPDATE, DELETE)
   - ✅ **SOLUÇÃO**: Permite `auth.uid() IS NULL` (SERVICE_ROLE_KEY)
   - ⚠️ **STATUS**: Pode não ter sido aplicada ainda

---

## 🔴 PROBLEMA IDENTIFICADO

A política RLS atual (de `20250215000001`) **NÃO permite inserção com SERVICE_ROLE_KEY** porque:

```sql
-- Política atual (20250215000001)
CREATE POLICY "tenant_products_policy" ON tenant_products
  FOR ALL 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );
```

**Problema**: `get_user_tenant_ids()` retorna vazio quando `auth.uid() IS NULL` (SERVICE_ROLE_KEY), então a política bloqueia.

---

## ✅ SOLUÇÃO CIRÚRGICA (MÍNIMA E SEGURA)

### Opção 1: Aplicar apenas a correção da política INSERT (RECOMENDADO)

**O que faz:**
- Mantém políticas existentes (SELECT, UPDATE, DELETE)
- Adiciona apenas política INSERT que permite SERVICE_ROLE_KEY
- **NÃO remove nada que já funciona**

**Risco:** MÍNIMO - apenas adiciona política, não remove nada

**Script:**
```sql
-- APENAS adicionar política INSERT (não remover nada)
CREATE POLICY "tenant_products_insert_policy" ON tenant_products
  FOR INSERT
  WITH CHECK (
    -- SERVICE_ROLE_KEY (auth.uid() IS NULL) pode inserir
    auth.uid() IS NULL
    OR
    -- Usuário autenticado pode inserir em seus próprios tenants
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );
```

### Opção 2: Modificar política existente (MAIS ARRISCADO)

**O que faz:**
- Modifica política `tenant_products_policy` existente
- Adiciona condição `auth.uid() IS NULL`

**Risco:** MÉDIO - modifica política que pode estar sendo usada

---

## 📋 CHECKLIST ANTES DE QUALQUER AÇÃO

- [ ] Executar `DIAGNOSTICO_SEGURO_RLS.sql` para ver estado atual
- [ ] Verificar quais políticas existem no banco
- [ ] Verificar se `get_user_tenant_ids()` existe
- [ ] Decidir qual opção usar (1 ou 2)
- [ ] Testar em ambiente de desenvolvimento primeiro (se possível)
- [ ] Fazer backup do banco (se possível)

---

## 🎯 RECOMENDAÇÃO

**Usar Opção 1** (adicionar apenas política INSERT):
- ✅ Não remove nada existente
- ✅ Não modifica nada que já funciona
- ✅ Risco mínimo de quebrar algo
- ✅ Pode ser revertida facilmente (DROP POLICY)

---

## ⚠️ ALERTAS

1. **NÃO aplicar migration `20250220000001` completa** se ela já foi aplicada parcialmente
2. **Verificar estado atual primeiro** com `DIAGNOSTICO_SEGURO_RLS.sql`
3. **Testar após aplicar** para garantir que não quebrou nada
4. **Manter backup** se possível

