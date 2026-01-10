# 🚨 INSTRUÇÕES DEFINITIVAS PARA RESOLVER O ERRO

## ❌ Erro Atual
```
Could not find the 'data_source' column of 'decision_makers' in the schema cache
```

## ✅ Solução em 3 Passos

### PASSO 1: Execute o SQL no Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Vá em: **SQL Editor**
3. Cole e execute o conteúdo do arquivo: **`SOLUCAO_FINAL_REINICIAR_PROJETO.sql`**
4. Aguarde a confirmação de sucesso

### PASSO 2: REINICIE o Projeto Supabase (OBRIGATÓRIO)

⚠️ **IMPORTANTE**: O cache do PostgREST só será limpo completamente quando você reiniciar o projeto!

1. Acesse: https://supabase.com/dashboard
2. Vá em: **Settings** → **General**
3. Role até encontrar: **Restart Project**
4. Clique em: **Restart Project**
5. Aguarde 2-3 minutos até o projeto reiniciar completamente

### PASSO 3: Teste a Funcionalidade

1. Volte para a aplicação
2. Tente buscar decisores novamente
3. O erro não deve mais aparecer

## 🔍 O Que Foi Corrigido

1. ✅ Removida coluna `source` (singular) - migração antiga
2. ✅ Removida coluna `data_source` (singular) - conflito
3. ✅ Garantida coluna `data_sources` (plural, JSONB) - schema correto
4. ✅ Criada função RPC `insert_decision_makers_batch` que usa SQL dinâmico
5. ✅ Edge Function modificada para usar APENAS a função RPC (bypass total do PostgREST)

## 📝 Notas Técnicas

- A função RPC usa SQL dinâmico, que bypassa completamente o PostgREST
- O PostgREST tem um cache interno que só é limpo quando o projeto é reiniciado
- Por isso, o PASSO 2 (reiniciar o projeto) é **OBRIGATÓRIO**

## 🆘 Se o Erro Persistir

1. Verifique se executou o SQL corretamente
2. Verifique se reiniciou o projeto
3. Aguarde mais 2-3 minutos após o restart
4. Execute `VERIFICAR_TODAS_REFERENCIAS.sql` para diagnosticar




