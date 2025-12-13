# ✅ CORREÇÃO FINAL - ERRO 500 NO TENANT SELECTOR

## 🔧 CORREÇÕES APLICADAS

### 1. ✅ `TenantSelector.tsx`
- Loop infinito corrigido
- Usa função RPC `get_user_tenant_ids()` primeiro
- Fallback para query direta se RPC não existir
- Para após erro 500 (não tenta infinitamente)

### 2. ✅ `multi-tenant.service.ts`
- Função `obterTenant()` agora usa RPC `get_tenant_safe()` primeiro
- Fallback para query direta com tratamento de erro 500
- Usa tenant do localStorage como último recurso

### 3. ✅ Migration SQL Criada
- `APLICAR_MIGRATION_FIX_TENANT_SELECTOR.sql` - **EXECUTAR NO SUPABASE**

---

## 🚨 AÇÃO URGENTE: Aplicar Migration SQL

**Execute no Supabase SQL Editor:**

```sql
-- Copie e cole o conteúdo completo de:
-- APLICAR_MIGRATION_FIX_TENANT_SELECTOR.sql
```

Isso criará as funções RPC que estão faltando e corrigirá o erro 404/500.

---

## 📋 TESTE COMPLETO - UNILUVAS

Após aplicar a migration, execute no Supabase SQL Editor:

**Arquivo:** `TESTE_COMPLETO_UNILUVAS.sql`

Isso testa:
1. ✅ Verificar tenant e ICP
2. ✅ Extrair inteligência do ICP
3. ✅ Verificar CNAE do tenant
4. ✅ Verificar produtos
5. ✅ Verificar supply chain
6. ✅ Verificar prospects qualificados
7. ✅ Estatísticas de matching
8. ✅ Exemplo de prospect com metodologia

---

## 🔍 SE O ERRO 500 PERSISTIR

Se mesmo após aplicar a migration o erro 500 continuar, pode ser problema de **RLS (Row Level Security)** na tabela `tenants`.

### Verificar RLS:
```sql
-- Verificar políticas RLS da tabela tenants
SELECT * FROM pg_policies 
WHERE tablename = 'tenants' AND schemaname = 'public';
```

### Se necessário, criar política temporária:
```sql
-- Política temporária para permitir leitura (AJUSTAR CONFORME NECESSÁRIO)
CREATE POLICY "temp_allow_tenant_read" ON public.tenants
  FOR SELECT
  USING (true); -- ⚠️ ATENÇÃO: Isso permite leitura de todos os tenants
```

---

## ✅ CHECKLIST FINAL

- [ ] Migration SQL aplicada (`APLICAR_MIGRATION_FIX_TENANT_SELECTOR.sql`)
- [ ] Página recarregada (loop deve parar)
- [ ] Teste completo executado (`TESTE_COMPLETO_UNILUVAS.sql`)
- [ ] Se erro 500 persistir, verificar RLS da tabela `tenants`

---

## 📁 ARQUIVOS MODIFICADOS

1. ✅ `src/components/layout/TenantSelector.tsx`
2. ✅ `src/services/multi-tenant.service.ts`
3. ✅ `APLICAR_MIGRATION_FIX_TENANT_SELECTOR.sql` (executar)
4. ✅ `TESTE_COMPLETO_UNILUVAS.sql` (testar)
5. ✅ `QUERIES_TESTE_MATCHING_SNIPER.sql` (atualizado)

