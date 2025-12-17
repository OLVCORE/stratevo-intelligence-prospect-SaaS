# 🔧 CORREÇÃO: Migração de Empresas para Quarentena ICP

## 🚨 PROBLEMA IDENTIFICADO

A tabela `icp_analysis_results` **NÃO tinha** a coluna `tenant_id`, causando:
1. ❌ Empresas não apareciam na Quarentena ICP após migração
2. ❌ Queries retornavam 0 resultados porque não havia filtro por tenant
3. ❌ Dados de diferentes tenants se misturavam
4. ❌ RLS não funcionava corretamente para isolamento multi-tenant

## ✅ SOLUÇÃO APLICADA

### 1. Migration SQL Criada
**Arquivo:** `supabase/migrations/20250224000003_add_tenant_id_to_icp_analysis_results.sql`

**O que faz:**
- ✅ Adiciona coluna `tenant_id` à tabela `icp_analysis_results`
- ✅ Popula `tenant_id` existente com base em `company_id` → `companies.tenant_id`
- ✅ Popula `tenant_id` via `user_id` → `users.tenant_id` (fallback)
- ✅ Cria índice para performance
- ✅ Atualiza políticas RLS para filtrar por `tenant_id`

### 2. Código Frontend Corrigido

#### `src/pages/CompaniesManagementPage.tsx`
- ✅ Adicionado `tenant_id` ao payload de inserção (2 locais)
- ✅ Logs de debug melhorados

#### `src/hooks/useICPQuarantine.ts`
- ✅ `useQuarantineCompanies`: Filtra por `tenant_id` na query
- ✅ `useSaveToQuarantine`: Busca e inclui `tenant_id` ao inserir
- ✅ `useApproveQuarantineBatch`: Filtra por `tenant_id` ao buscar
- ✅ `useAutoApprove`: Filtra por `tenant_id` na query

## 📋 INSTRUÇÕES PARA APLICAR

### PASSO 1: Aplicar Migration SQL

Execute no **Supabase Dashboard > SQL Editor**:

```sql
-- Copiar e colar o conteúdo de:
-- supabase/migrations/20250224000003_add_tenant_id_to_icp_analysis_results.sql
```

OU via CLI:

```bash
supabase migration up
```

### PASSO 2: Verificar Migration

Execute para verificar se a coluna foi criada:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'icp_analysis_results'
  AND column_name = 'tenant_id';
```

### PASSO 3: Verificar Dados Populados

Execute para ver quantos registros têm `tenant_id`:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(tenant_id) as com_tenant_id,
  COUNT(*) - COUNT(tenant_id) as sem_tenant_id
FROM icp_analysis_results;
```

### PASSO 4: Testar Migração

1. Vá para "3. Base de Empresas"
2. Selecione uma empresa
3. Clique em "🎯 Mover para Quarentena ICP"
4. Verifique se aparece em "4. Quarentena ICP"

## 🔍 VERIFICAÇÕES ADICIONAIS

### Se ainda não funcionar:

1. **Verificar se `tenant_id` foi populado:**
   ```sql
   SELECT id, cnpj, razao_social, tenant_id, company_id
   FROM icp_analysis_results
   WHERE tenant_id IS NULL
   LIMIT 10;
   ```

2. **Verificar se `company_id` está vinculado:**
   ```sql
   SELECT 
     iar.id,
     iar.cnpj,
     iar.tenant_id as iar_tenant_id,
     c.tenant_id as company_tenant_id
   FROM icp_analysis_results iar
   LEFT JOIN companies c ON iar.company_id = c.id
   WHERE iar.tenant_id IS NULL
   LIMIT 10;
   ```

3. **Popular manualmente se necessário:**
   ```sql
   UPDATE icp_analysis_results iar
   SET tenant_id = c.tenant_id
   FROM companies c
   WHERE iar.company_id = c.id
     AND iar.tenant_id IS NULL
     AND c.tenant_id IS NOT NULL;
   ```

## ✅ ARQUIVOS MODIFICADOS

1. ✅ `supabase/migrations/20250224000003_add_tenant_id_to_icp_analysis_results.sql` (NOVO)
2. ✅ `src/pages/CompaniesManagementPage.tsx` (MODIFICADO)
3. ✅ `src/hooks/useICPQuarantine.ts` (MODIFICADO)

## 🎯 RESULTADO ESPERADO

Após aplicar a migration:
- ✅ Empresas migradas aparecem na Quarentena ICP
- ✅ Dados isolados por tenant
- ✅ RLS funcionando corretamente
- ✅ Queries retornam apenas dados do tenant atual

