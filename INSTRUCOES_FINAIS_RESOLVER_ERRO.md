# 🔧 Instruções Finais para Resolver o Erro do PostgREST

## 🔴 Problema

O erro `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"` persiste mesmo após:
- ✅ Reiniciar o projeto Supabase
- ✅ Executar `NOTIFY pgrst, 'reload schema';`
- ✅ Verificar que a função RPC existe

## ✅ SOLUÇÃO ÚNICA E DEFINITIVA

### Execute APENAS este arquivo no Supabase SQL Editor:

**`SOLUCAO_DEFINITIVA_FINAL.sql`**

Este script:
1. ✅ Verifica e remove a coluna `data_source` (singular) se existir
2. ✅ Garante que `data_sources` (plural) existe
3. ✅ Recria a função RPC usando SQL dinâmico (bypass completo do PostgREST)
4. ✅ Força recarregamento do cache múltiplas vezes
5. ✅ Verifica tudo automaticamente

**Após executar, aguarde 30 segundos e teste novamente.**

### ⚠️ IMPORTANTE

Se ainda falhar após executar o script:
1. **Reinicie o projeto Supabase** (Settings → General → Restart Project)
2. Aguarde 2-3 minutos
3. Tente novamente

O problema é que o PostgREST valida o schema da tabela ANTES de executar qualquer função RPC, mesmo usando SQL dinâmico. A única forma de contornar isso completamente é reiniciar o projeto.

## 🔍 Verificação

Após executar os passos acima, verifique:

```sql
-- Verificar colunas
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('data_source', 'data_sources')
ORDER BY column_name;

-- Verificar função
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'insert_decision_makers_batch';
```

## 📝 O que foi implementado

1. ✅ **Fallback automático**: A Edge Function agora tenta inserção direta quando a RPC falha
2. ✅ **Inserção individual**: Se o batch falhar, tenta inserir um por vez
3. ✅ **Função SQL dinâmica**: Nova função que usa SQL dinâmico para contornar PostgREST

## 🚀 Próximos Passos

1. Execute os 3 passos acima no Supabase SQL Editor
2. Aguarde 30 segundos
3. Tente buscar decisores novamente
4. Se ainda falhar, verifique os logs da Edge Function no Supabase Dashboard

