# ✅ TESTE DE CRIAÇÃO DE TENANT

## Status Atual
- ✅ Edge Function `create-tenant` deployada
- ⚠️ Verificar se scripts SQL foram executados

## Próximos Passos

### 1. Execute os Scripts SQL (se ainda não executou)

Execute no Supabase SQL Editor:
1. `SOLUCAO_ALTERNATIVA_TENANTS.sql`
2. `CRIAR_FUNCAO_RPC_CREATE_TENANT.sql`

### 2. Verificar Edge Function

A Edge Function está disponível em:
```
https://qtcwetabhhkhvomcrqgm.supabase.co/functions/v1/create-tenant
```

### 3. Testar Criação de Tenant

1. Complete o onboarding até o Step 5
2. Clique em "Finalizar"
3. O sistema tentará criar o tenant usando 3 métodos:
   - **Método 1**: Edge Function (bypass PostgREST) ✅
   - **Método 2**: RPC Function (SQL direto)
   - **Método 3**: PostgREST direto (fallback)

### 4. Verificar Logs

Se ainda der erro, verifique:
- Console do navegador (F12)
- Supabase Dashboard → Edge Functions → create-tenant → Logs

## O que Esperar

Se tudo funcionar:
- ✅ Tenant criado em `public.tenants`
- ✅ Usuário criado em `public.users`
- ✅ ICP Profile salvo
- ✅ Redirecionamento para `/dashboard`

Se ainda der erro:
- Verifique os logs da Edge Function
- Verifique se a tabela `tenants` existe no banco
- Verifique se o schema `public` está exposto

