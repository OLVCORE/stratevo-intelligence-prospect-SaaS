# 🚨 INSTRUÇÕES URGENTES - REINICIAR PROJETO SUPABASE

## 🔴 Problema CRÍTICO

O erro `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"` **PERSISTE** porque:

1. ❌ O PostgREST valida o schema da tabela **ANTES** de executar qualquer função RPC
2. ❌ O cache do PostgREST ainda contém referência à coluna antiga `data_source` (singular)
3. ❌ Mesmo removendo a coluna e forçando reload, o cache **PERSISTE**
4. ❌ **NÃO HÁ OUTRA SOLUÇÃO** além de reiniciar o projeto Supabase

## ⚠️ ATENÇÃO: Esta é a ÚNICA solução que funciona!

## ✅ SOLUÇÃO DEFINITIVA

### Passo 1: Execute o script SQL

Execute no Supabase SQL Editor:

**`VERIFICAR_E_REMOVER_DATA_SOURCE.sql`**

Este script:
1. ✅ Verifica todas as colunas da tabela
2. ✅ Remove a coluna `data_source` (singular) se existir
3. ✅ Garante que `data_sources` (plural) existe
4. ✅ Força recarregamento do cache múltiplas vezes

### Passo 2: REINICIE O PROJETO SUPABASE ⚠️ OBRIGATÓRIO

**Esta é a ÚNICA forma garantida de limpar o cache do PostgREST:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → General**
4. Role até encontrar: **Restart Project**
5. Clique em: **Restart Project**
6. Aguarde 2-3 minutos (o projeto será reiniciado)
7. Tente buscar decisores novamente

## 🔍 Por que isso é necessário?

O PostgREST mantém um cache do schema das tabelas em memória. Quando você:
- Remove uma coluna
- Adiciona uma coluna
- Altera o tipo de uma coluna

O PostgREST pode não atualizar o cache imediatamente, mesmo com:
- `NOTIFY pgrst, 'reload schema';`
- Múltiplas notificações
- Aguardar vários segundos

A única forma garantida de limpar o cache é **reiniciar o projeto Supabase**.

## 📝 O que foi implementado no código

1. ✅ **Função RPC com SQL dinâmico**: Bypass do PostgREST usando SQL dinâmico
2. ✅ **Fallback automático**: Tenta inserção direta quando a RPC falha
3. ✅ **Inserção individual**: Se o batch falhar, tenta inserir um por vez
4. ✅ **Edge Function atualizada**: Passa dados como TEXT para evitar validação

## 🚀 Após Reiniciar

1. Execute `VERIFICAR_E_REMOVER_DATA_SOURCE.sql` (se ainda não executou)
2. Reinicie o projeto Supabase
3. Aguarde 2-3 minutos
4. Tente buscar decisores novamente
5. O erro deve desaparecer

## ✅ Verificação

Após reiniciar, verifique:

```sql
-- Deve mostrar apenas data_sources (plural), NÃO data_source (singular)
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%data_source%' OR column_name LIKE '%data_sources%')
ORDER BY column_name;
```

Se ainda mostrar `data_source` (singular), execute o script SQL novamente e reinicie o projeto novamente.

