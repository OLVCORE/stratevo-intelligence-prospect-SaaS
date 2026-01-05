# 🔧 Solução Final: Problema de Cache do PostgREST

## 🔴 Problema Identificado

O erro `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"` ocorre porque:

1. ✅ A função RPC `insert_decision_makers_batch` **EXISTE** e está correta
2. ❌ O **PostgREST** valida o schema da tabela `decision_makers` **ANTES** de executar a função RPC
3. ❌ O cache do PostgREST ainda está procurando pela coluna `data_source` (singular) em vez de `data_sources` (plural)

## ✅ Soluções Possíveis

### Opção 1: Reiniciar o Projeto Supabase (RECOMENDADO)

O cache do PostgREST é atualizado quando o projeto é reiniciado:

1. Acesse: https://supabase.com/dashboard
2. Vá em: **Settings** → **General**
3. Clique em: **Restart Project**
4. Aguarde 2-3 minutos
5. Teste novamente a busca de decisores

### Opção 2: Aguardar Atualização Automática

O cache do PostgREST é atualizado automaticamente, mas pode levar alguns minutos. Aguarde 5-10 minutos e teste novamente.

### Opção 3: Forçar Recarregamento do Schema (Avançado)

Execute este SQL no Supabase SQL Editor:

```sql
-- Forçar PostgREST a recarregar schema
NOTIFY pgrst, 'reload schema';

-- Aguardar alguns segundos
SELECT pg_sleep(2);

-- Verificar se as colunas existem
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('data_source', 'data_sources')
ORDER BY column_name;
```

## 🔍 Verificação

Após aplicar uma das soluções, verifique se o problema foi resolvido:

1. Tente buscar decisores novamente
2. Se o erro persistir, verifique os logs da Edge Function:
   - Dashboard → Edge Functions → `enrich-apollo-decisores` → Logs
   - Procure por mensagens de erro detalhadas

## 📝 Nota Técnica

O PostgREST mantém um cache do schema do banco de dados para melhorar a performance. Quando o schema muda (como adicionar/remover colunas), o cache pode ficar desatualizado até ser recarregado.

A função RPC `insert_decision_makers_batch` está correta e funciona, mas o PostgREST valida o schema antes de executá-la, causando o erro quando o cache está desatualizado.

