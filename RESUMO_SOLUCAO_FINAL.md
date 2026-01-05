# 🎯 SOLUÇÃO FINAL - Erro do PostgREST Cache

## 🔴 Problema

O erro `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"` persiste porque:

1. O PostgREST valida o schema da tabela **ANTES** de executar qualquer função RPC
2. O cache do PostgREST ainda contém referência à coluna antiga `data_source` (singular)
3. Mesmo usando SQL dinâmico, o PostgREST valida o schema da tabela

## ✅ SOLUÇÃO ÚNICA

### Execute este arquivo no Supabase SQL Editor:

**`SOLUCAO_DEFINITIVA_FINAL.sql`**

Este script:
1. ✅ Remove a coluna `data_source` (singular) se existir
2. ✅ Garante que `data_sources` (plural) existe
3. ✅ Recria a função RPC usando SQL dinâmico
4. ✅ Força recarregamento do cache múltiplas vezes

### ⚠️ IMPORTANTE: Após executar o script

**Se ainda falhar, você DEVE reiniciar o projeto Supabase:**

1. Acesse: https://supabase.com/dashboard
2. Vá em: **Settings → General**
3. Clique em: **Restart Project**
4. Aguarde 2-3 minutos
5. Tente novamente

## 🔍 Por que isso acontece?

O PostgREST mantém um cache do schema das tabelas. Quando você:
- Remove uma coluna
- Adiciona uma coluna
- Altera o tipo de uma coluna

O PostgREST pode não atualizar o cache imediatamente, mesmo com `NOTIFY pgrst, 'reload schema';`.

A única forma garantida de limpar o cache é **reiniciar o projeto Supabase**.

## 📝 O que foi implementado no código

1. ✅ **Função RPC com SQL dinâmico**: Bypass do PostgREST usando SQL dinâmico
2. ✅ **Fallback automático**: Tenta inserção direta quando a RPC falha
3. ✅ **Inserção individual**: Se o batch falhar, tenta inserir um por vez
4. ✅ **Edge Function atualizada**: Passa dados como TEXT para evitar validação

## 🚀 Próximos Passos

1. Execute `SOLUCAO_DEFINITIVA_FINAL.sql` no Supabase SQL Editor
2. Aguarde 30 segundos
3. Se ainda falhar, **reinicie o projeto Supabase**
4. Aguarde 2-3 minutos após reiniciar
5. Tente buscar decisores novamente

## ✅ Verificação

Após executar o script, verifique:

```sql
-- Verificar colunas (deve mostrar apenas data_sources, não data_source)
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%data_source%' OR column_name LIKE '%data_sources%')
ORDER BY column_name;

-- Verificar função (deve existir)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'insert_decision_makers_batch';
```

