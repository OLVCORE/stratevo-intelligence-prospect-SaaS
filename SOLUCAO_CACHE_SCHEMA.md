# Solução: Cache de Schema do PostgREST

## Problema Identificado

O erro `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"` indica que o **PostgREST** (API REST do Supabase) está usando um cache de schema desatualizado que ainda procura pela coluna antiga `data_source` (singular), mesmo que o schema real tenha `data_sources` (plural, JSONB).

## Schema Real vs Cache

### Schema Real (Banco de Dados) ✅
- `data_sources` (plural, JSONB) - **EXISTE**
- `raw_apollo_data` (JSONB) - **EXISTE**
- `city`, `state`, `country` - **EXISTEM**
- `photo_url`, `headline` - **EXISTEM**

### Cache do PostgREST ❌
- Ainda procura `data_source` (singular) - **NÃO EXISTE**
- Cache desatualizado

## Soluções Implementadas

### 1. Código Ajustado ✅
- Lista explícita de campos válidos baseada no schema real
- Remoção de campos que não existem no schema
- Garantia de que `data_sources` sempre é um array

### 2. Script SQL Criado ✅
- `FORCAR_ATUALIZACAO_SCHEMA_CACHE.sql` - Remove coluna antiga se existir
- Garante que apenas `data_sources` (plural) existe
- Tenta forçar atualização do cache

## Solução Definitiva

### Opção 1: Reiniciar o Projeto Supabase (RECOMENDADO) 🔥

1. Vá para **Supabase Dashboard** → **Settings** → **General**
2. Role até **Restart Project**
3. Clique em **Restart**
4. Aguarde 2-3 minutos para o projeto reiniciar completamente
5. O cache do PostgREST será atualizado automaticamente
6. Teste novamente a busca de decisores

### Opção 2: Executar Script SQL

1. Execute `FORCAR_ATUALIZACAO_SCHEMA_CACHE.sql` no Supabase SQL Editor
2. Isso garante que não há coluna `data_source` (singular)
3. Aguarde alguns minutos para o cache atualizar
4. Teste novamente

### Opção 3: Aguardar Atualização Automática

O PostgREST atualiza o schema cache automaticamente a cada alguns minutos. Você pode simplesmente aguardar.

## Verificação

Após aplicar a solução, você deve ver:
- ✅ Busca de decisores funcionando sem erros
- ✅ Decisores sendo salvos corretamente no banco
- ✅ Sem erros de "Could not find the 'data_source' column"

## Status Atual

✅ **Código corrigido** - Usa apenas campos válidos do schema real
✅ **Script SQL criado** - Remove coluna antiga se existir
⏳ **Aguardando atualização do cache do PostgREST**

## Próximos Passos

1. **Reinicie o projeto Supabase** (Opção 1 - mais rápido)
2. Teste novamente a busca de decisores
3. O erro deve estar resolvido após o restart

