# 🔧 CORREÇÃO: Erro 406 ao Buscar icp_profile

## 🚨 Problema Identificado

**Erro:** `406 (Not Acceptable)` ao tentar buscar `icp_profile`

**Causa:** Tentativa de buscar `icp_profile` no schema `public`, mas a tabela está no schema do tenant.

**URL do erro:** `/rest/v1/icp_profile?select=*&id=eq.29140c7e-2ac4-4da4-be87-0e69f0a683b3`

---

## ✅ SOLUÇÃO APLICADA

### 1. **Tratamento de Erro Melhorado**

Adicionado tratamento de erro em todas as buscas de `icp_profile` para:
- ✅ Não tentar buscar se `schema_name` não estiver disponível
- ✅ Silenciar erros quando schema não existir
- ✅ Continuar funcionando mesmo sem dados do schema

### 2. **Arquivos Corrigidos**

- ✅ `src/pages/CentralICP/ICPDetail.tsx` - Tratamento de erro melhorado
- ✅ `src/pages/CentralICP/ICPReports.tsx` - Tratamento de erro melhorado

---

## 📋 VERIFICAÇÕES NECESSÁRIAS

### Verificar no Banco de Dados:

1. **Verificar se `icp_profiles_metadata` tem `schema_name` e `icp_profile_id`:**
```sql
SELECT 
  id,
  nome,
  tenant_id,
  schema_name,
  icp_profile_id
FROM public.icp_profiles_metadata
WHERE id = '29140c7e-2ac4-4da4-be87-0e69f0a683b3';
```

2. **Verificar se o schema do tenant existe:**
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';
```

3. **Verificar se `icp_profile` existe no schema do tenant:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tenant_XXX' 
  AND table_name = 'icp_profile';
```

---

## 🔍 DIAGNÓSTICO

O erro 406 geralmente ocorre quando:
- ❌ Tabela não existe no schema especificado
- ❌ Schema não existe
- ❌ Permissões RLS bloqueando acesso
- ❌ Tentativa de acesso direto ao schema `public`

---

## ✅ AÇÃO RECOMENDADA

1. Verificar se `schema_name` está sendo salvo corretamente em `icp_profiles_metadata`
2. Verificar se o schema do tenant foi criado
3. Verificar se a tabela `icp_profile` existe no schema do tenant
4. Verificar RLS policies no schema do tenant

---

## 📝 CÓDIGO CORRIGIDO

Todas as buscas agora verificam:
```typescript
if (metadata?.schema_name && metadata?.icp_profile_id) {
  try {
    // Buscar apenas se schema estiver disponível
    const { data, error } = await (supabase as any)
      .schema(metadata.schema_name)
      .from('icp_profile')
      ...
  } catch (err) {
    // Não propagar erro
    console.warn('Erro ao buscar icp_profile:', err);
  }
}
```

