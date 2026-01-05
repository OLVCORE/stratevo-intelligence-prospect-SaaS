# 🚨 AÇÃO NECESSÁRIA: Aplicar Função SQL

## Problema Atual

O erro `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"` ocorre porque o **PostgREST** (API REST do Supabase) está usando um cache desatualizado.

## Solução

A função SQL `insert_decision_makers_batch` contorna o cache do PostgREST inserindo dados diretamente no banco.

## ⚡ Passos para Aplicar (2 minutos)

### 1. Abrir Supabase SQL Editor
- Acesse: https://supabase.com/dashboard
- Vá em: **Database** → **SQL Editor**
- Clique em: **New Query**

### 2. Copiar e Colar o Script
- Abra o arquivo: `APLICAR_FUNCAO_INSERT_DECISION_MAKERS.sql`
- Copie **TODO** o conteúdo
- Cole no SQL Editor do Supabase

### 3. Executar
- Clique em **Run** (ou pressione `Ctrl+Enter`)
- Aguarde a mensagem de sucesso

### 4. Verificar
Você deve ver uma mensagem como:
```
Success. No rows returned
```

E uma query de verificação mostrando:
```
routine_name: insert_decision_makers_batch
routine_type: FUNCTION
```

### 5. Testar
- Volte para a aplicação
- Tente buscar decisores novamente
- O erro não deve mais aparecer

## ✅ Resultado Esperado

Após aplicar a função:
- ✅ Busca de decisores funcionando
- ✅ Decisores sendo salvos corretamente
- ✅ Sem erro de cache do PostgREST

## 🔍 Verificação Rápida

Execute esta query no SQL Editor para verificar se a função existe:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';
```

Se retornar uma linha, a função está aplicada! ✅

