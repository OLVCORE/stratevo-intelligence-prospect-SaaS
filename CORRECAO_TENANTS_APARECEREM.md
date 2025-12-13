# 🔧 CORREÇÃO: Tenants Não Aparecem na Tela

## ❌ PROBLEMA IDENTIFICADO

Os tenants não aparecem na tela porque:
1. **Erros 500** estão impedindo o acesso ao banco de dados
2. **Dados hardcoded foram removidos** (conforme solicitado - é PROIBIDO em SaaS multi-tenant)
3. O sistema precisa buscar **TODOS os tenants do banco**, não apenas IDs conhecidos

## ✅ CORREÇÕES APLICADAS

### 1. **TenantSelector.tsx** - Removido IDs conhecidos e dados hardcoded
- ✅ Removida lógica de IDs conhecidos (`knownTenantIds`)
- ✅ Removidos dados hardcoded
- ✅ Agora busca **TODOS os tenants** do banco via:
  1. RPC `get_user_tenant_ids()` (primeira tentativa)
  2. Query direta na tabela `users` → `tenants` (fallback)
  3. RPC `get_tenant_safe()` com tenant_ids do localStorage (último recurso)

### 2. **TenantContext.tsx** - Removidos dados hardcoded
- ✅ Removida constante `HARDCODED_TENANTS`
- ✅ Removidos todos os fallbacks com dados hardcoded
- ✅ Sistema agora busca **APENAS do banco de dados**

### 3. **MyCompanies.tsx** - Removidos dados hardcoded
- ✅ Removidos arrays hardcoded de tenants
- ✅ Sistema busca **TODOS os tenants** do banco

## 🔍 VERIFICAÇÕES NECESSÁRIAS NO BANCO

Execute o arquivo `VERIFICAR_TENANTS_NO_BANCO.sql` no Supabase SQL Editor para verificar:

1. **Se os tenants existem no banco:**
   ```sql
   SELECT * FROM tenants;
   ```

2. **Se os usuários estão associados aos tenants:**
   ```sql
   SELECT u.*, t.name, t.cnpj 
   FROM users u 
   LEFT JOIN tenants t ON t.id = u.tenant_id;
   ```

3. **Se as funções RPC existem e têm permissões:**
   - `get_user_tenant_ids()`
   - `get_tenant_safe(UUID)`

4. **Se as políticas RLS estão corretas:**
   - Tabela `tenants`
   - Tabela `users`

## 🚨 SE OS TENANTS AINDA NÃO APARECEM

### Passo 1: Verificar se os tenants existem no banco
Execute:
```sql
SELECT id, name, cnpj, status FROM tenants;
```

### Passo 2: Verificar se as funções RPC existem
Execute:
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('get_user_tenant_ids', 'get_tenant_safe');
```

Se não existirem, execute `APLICAR_MIGRATION_FIX_TENANT_SELECTOR.sql` no Supabase SQL Editor.

### Passo 3: Verificar erros 500 no console do navegador
- Abra o DevTools (F12)
- Vá na aba Network
- Procure por requisições com status 500
- Verifique qual endpoint está falhando

### Passo 4: Verificar políticas RLS
As políticas RLS podem estar bloqueando o acesso. Verifique:
```sql
SELECT * FROM pg_policies WHERE tablename = 'tenants';
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 📋 PRÓXIMOS PASSOS

1. ✅ **Execute `VERIFICAR_TENANTS_NO_BANCO.sql`** para diagnosticar
2. ✅ **Execute `APLICAR_MIGRATION_FIX_TENANT_SELECTOR.sql`** se as funções RPC não existirem
3. ✅ **Verifique o console do navegador** para erros 500
4. ✅ **Verifique as políticas RLS** se os tenants existem mas não aparecem

## ⚠️ IMPORTANTE

- **NÃO há dados hardcoded** - todos os dados vêm do banco
- **Os dados NÃO foram deletados** - apenas removidos os fallbacks hardcoded
- **O problema são os erros 500** que impedem o acesso ao banco
- **Precisa corrigir os erros 500** no backend/Supabase para os tenants aparecerem

