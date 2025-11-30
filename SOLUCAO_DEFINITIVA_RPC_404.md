# 🔥 SOLUÇÃO DEFINITIVA: RPC 404 - PostgREST não vê função

## Problema Identificado

O PostgREST está retornando **404** para a função RPC `get_sectors_niches()`, o que significa que ele **não está vendo a função no schema cache**.

## Possíveis Causas

1. **Função não existe realmente** (improvável, mas possível)
2. **Função está em schema errado** (não está em `public`)
3. **PostgREST não está reconhecendo o schema `public`**
4. **Configuração do Supabase/PostgREST incorreta**
5. **Cache do PostgREST extremamente desatualizado**

## Solução Passo a Passo

### PASSO 1: Verificar se a função existe

Execute `VERIFICAR_FUNCAO_RPC_EXISTE.sql` no Supabase SQL Editor.

**Resultado esperado:**
- Deve mostrar a função `get_sectors_niches` no schema `public`
- Deve mostrar permissões para `authenticated` e `anon`

### PASSO 2: Recriar a função com configurações corretas

Execute `RECRIAR_FUNCAO_RPC_FORCADA.sql` no Supabase SQL Editor.

Este script:
- Dropa a função se existir
- Recria com todas as configurações corretas
- Garante permissões explícitas
- Testa a função diretamente
- Força reload do PostgREST

### PASSO 3: Verificar configuração do Supabase

No Supabase Dashboard:
1. Vá em **Settings** → **API**
2. Verifique se o **API URL** está correto
3. Verifique se a **anon key** está correta
4. Verifique se há alguma configuração de **schema** ou **exposed schemas**

### PASSO 4: Verificar logs do PostgREST

No Supabase Dashboard:
1. Vá em **Logs** → **API Logs**
2. Procure por requisições para `/rest/v1/rpc/get_sectors_niches`
3. Veja qual erro específico está sendo retornado

### PASSO 5: Testar API diretamente

Abra o navegador e teste:

```
https://YOUR_PROJECT_URL.supabase.co/rest/v1/rpc/get_sectors_niches
```

Com headers:
```
apikey: YOUR_ANON_KEY
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

### PASSO 6: Último recurso - Verificar configuração do PostgREST

Se nada funcionar, pode ser um problema de configuração do PostgREST no Supabase. Nesse caso:

1. **Contate o suporte do Supabase** ou
2. **Verifique se há alguma configuração de schema** que está bloqueando

## Scripts Criados

1. **`VERIFICAR_FUNCAO_RPC_EXISTE.sql`** - Verifica se a função existe e está configurada corretamente
2. **`RECRIAR_FUNCAO_RPC_FORCADA.sql`** - Recria a função com todas as configurações corretas

## Próximos Passos

1. Execute `VERIFICAR_FUNCAO_RPC_EXISTE.sql` primeiro
2. Se a função não existir ou estiver incorreta, execute `RECRIAR_FUNCAO_RPC_FORCADA.sql`
3. Teste a API diretamente no navegador
4. Verifique os logs do PostgREST
5. Se ainda não funcionar, pode ser necessário contatar o suporte do Supabase

