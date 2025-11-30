# Solução: PostgREST Schema Cache

## Problema Identificado

O erro `"Could not find the table 'public.sectors' in the schema cache"` indica que o **PostgREST** (API REST do Supabase) não está vendo as tabelas mesmo que elas existam no banco de dados.

## Causa

O PostgREST mantém um cache do schema do banco de dados. Quando você cria tabelas diretamente via SQL Editor, o cache pode não atualizar imediatamente.

## Solução Imediata (Já Implementada)

### 1. Função RPC como Fallback

Criamos a função `get_sectors_niches()` que funciona mesmo quando as tabelas não estão no cache do PostgREST, porque funções RPC usam `SECURITY DEFINER` e acessam diretamente o banco.

### 2. Código Atualizado

O componente `Step2SetoresNichos.tsx` agora:
- Tenta carregar via REST API primeiro
- Se falhar, usa automaticamente a função RPC como fallback
- Logs detalhados para debug

## Solução Definitiva

### Opção 1: Reiniciar o Projeto (Recomendado)

1. Vá para **Supabase Dashboard** → **Settings** → **General**
2. Role até **Restart Project**
3. Clique em **Restart**
4. Aguarde 1-2 minutos
5. Recarregue a página do onboarding

### Opção 2: Aguardar Atualização Automática

O PostgREST atualiza o schema cache automaticamente a cada alguns minutos. Você pode simplesmente aguardar.

### Opção 3: Executar SQL de Verificação

Execute o arquivo `CORRIGIR_POSTGREST_SCHEMA_CACHE.sql` que:
- Verifica se as tabelas existem
- Garante permissões corretas
- Cria/atualiza a função RPC
- Força atualização do cache

## Verificação

Após aplicar a solução, você deve ver no console:

```
✅ 12 setores carregados via RPC
✅ 120 nichos carregados via RPC
```

## Status Atual

✅ **Função RPC criada e funcionando** (retorna dados corretamente)
✅ **Código atualizado para usar RPC como fallback**
⏳ **Aguardando atualização do schema cache do PostgREST**

## Próximos Passos

1. Execute `CORRIGIR_POSTGREST_SCHEMA_CACHE.sql` no Supabase SQL Editor
2. Recarregue a página do onboarding
3. Os dados devem aparecer via RPC enquanto o cache não atualiza
4. Quando o cache atualizar, o código voltará a usar REST API automaticamente

