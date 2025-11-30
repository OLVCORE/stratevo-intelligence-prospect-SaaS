# ✅ SOLUÇÃO FINAL COMPLETA - CRIAR TENANT

## Status Atual
- ✅ Edge Function `create-tenant` redeployada (sem necessidade de autenticação)
- ✅ Código atualizado para usar `apikey` apenas
- ⚠️ Execute o script SQL abaixo

## Passo 1: Execute o Script SQL

Execute no Supabase SQL Editor:
**`CRIAR_TUDO_COMPLETO_FINAL.sql`**

Este script cria:
- ✅ Tabela `public.tenants` (com todas as colunas)
- ✅ Tabela `public.users` (se não existir)
- ✅ Função RPC `create_tenant_direct`
- ✅ Função RPC `get_user_tenant`
- ✅ Todas as permissões necessárias
- ✅ Força reload do PostgREST (10 vezes)

## Passo 2: Aguarde 30 Segundos

Após executar o script, aguarde 30 segundos para o PostgREST processar.

## Passo 3: Teste o Onboarding

1. Complete o onboarding até o Step 5
2. Clique em "Finalizar"
3. O sistema tentará criar o tenant usando 3 métodos:

### Método 1: Edge Function (PRIMÁRIO) ✅
- URL: `/functions/v1/create-tenant`
- Usa `SERVICE_ROLE_KEY` internamente
- **Não precisa de autenticação do usuário**
- Bypassa completamente o PostgREST

### Método 2: RPC Function (FALLBACK)
- Função: `create_tenant_direct`
- Cria tenant via SQL direto

### Método 3: PostgREST Direto (ÚLTIMO RECURSO)
- Tenta criar via `.from('tenants').insert()`

## O que Esperar

Se tudo funcionar:
- ✅ Tenant criado em `public.tenants`
- ✅ Usuário criado em `public.users`
- ✅ ICP Profile salvo
- ✅ Redirecionamento para `/dashboard`

## Verificar Logs

No console do navegador (F12), procure por:
- `[MultiTenantService] Tentando criar tenant via Edge Function...`
- `[MultiTenantService] ✅ Tenant criado via Edge Function`

Se a Edge Function funcionar, você verá a mensagem de sucesso.

## Se Ainda Der Erro

1. Verifique os logs da Edge Function:
   - Supabase Dashboard → Edge Functions → create-tenant → Logs

2. Verifique se as tabelas existem:
   - Supabase Dashboard → Table Editor
   - Deve ver `tenants` e `users` no schema `public`

3. Verifique se as funções RPC existem:
   - Supabase Dashboard → Database → Functions
   - Deve ver `create_tenant_direct` e `get_user_tenant`

