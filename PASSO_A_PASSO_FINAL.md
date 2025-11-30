# 🚨 PASSO A PASSO FINAL - RESOLVER ERRO 500

## Status Atual
- ✅ Edge Function está sendo chamada (não é mais 401)
- ❌ Edge Function retorna 500 (erro interno)
- ❌ Tabela `tenants` não existe no PostgREST cache

## Passo 1: Execute o Script SQL

**Execute no Supabase SQL Editor:**
```
EXECUTAR_AGORA.sql
```

Este script cria:
- Tabela `public.tenants`
- Tabela `public.users`
- Função RPC `create_tenant_direct`
- Função RPC `get_user_tenant`
- Todas as permissões

## Passo 2: Verifique se Tudo Foi Criado

**Execute no Supabase SQL Editor:**
```
VERIFICAR_SE_TUDO_EXISTE.sql
```

Você deve ver:
- ✅ Tabela tenants EXISTE
- ✅ Tabela users EXISTE
- ✅ Função create_tenant_direct EXISTE
- ✅ Função get_user_tenant EXISTE

## Passo 3: Verifique os Logs da Edge Function

1. Vá para: **Supabase Dashboard → Edge Functions → create-tenant → Logs**
2. Procure por erros recentes
3. Os logs agora mostram:
   - `[create-tenant] 🔍 Criando tenant: {...}`
   - `[create-tenant] ❌ Erro ao criar tenant: {...}` (se houver erro)

## Passo 4: Se Ainda Der Erro 500

O erro 500 pode ser causado por:

### Causa 1: Tabela não existe
**Sintoma:** Log mostra "relation 'public.tenants' does not exist"
**Solução:** Execute `EXECUTAR_AGORA.sql` novamente

### Causa 2: Variáveis de ambiente faltando
**Sintoma:** Log mostra "Configuração do Supabase incompleta"
**Solução:** Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada nos Secrets da Edge Function

### Causa 3: Erro de permissão
**Sintoma:** Log mostra erro de permissão
**Solução:** Execute `EXECUTAR_AGORA.sql` novamente para garantir permissões

## Passo 5: Teste Novamente

Após executar os scripts:
1. Aguarde 30 segundos
2. Recarregue o frontend (Ctrl+Shift+R)
3. Tente criar o tenant novamente
4. Verifique os logs da Edge Function para ver o erro exato

## O Que Esperar

Se tudo funcionar:
- Edge Function retorna 200 OK
- Tenant criado em `public.tenants`
- Log mostra: `[create-tenant] ✅ Tenant criado via SQL direto: {id}`

