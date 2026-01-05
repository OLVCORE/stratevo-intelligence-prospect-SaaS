# 🚨 AÇÃO URGENTE NECESSÁRIA

## ❌ Erro Atual
```
Could not find the 'data_source' column of 'decision_makers' in the schema cache
```

## ✅ O QUE VOCÊ PRECISA FAZER AGORA

### PASSO 1: Execute o SQL (OBRIGATÓRIO)
1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo: `SOLUCAO_FINAL_REINICIAR_PROJETO.sql`
4. **COPIE TODO O CONTEÚDO** do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **RUN** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso

### PASSO 2: REINICIE o Projeto (OBRIGATÓRIO)
⚠️ **SEM ISSO, O ERRO CONTINUARÁ!**

1. No Supabase Dashboard, vá em **Settings** → **General**
2. Role até encontrar **Restart Project**
3. Clique em **Restart Project**
4. **AGUARDE 2-3 MINUTOS** até o projeto reiniciar completamente
5. Você verá uma mensagem quando estiver pronto

### PASSO 3: Verifique se Funcionou
1. Execute `VERIFICAR_FUNCAO_RPC_EXISTE.sql` no SQL Editor
2. Deve retornar a função `insert_decision_makers_batch`
3. Tente buscar decisores novamente na aplicação

## 🔍 Por Que Isso É Necessário?

O PostgREST (camada REST do Supabase) mantém um **cache interno** do schema do banco. Mesmo após remover colunas problemáticas, o cache pode continuar com referências antigas.

**A ÚNICA FORMA** de limpar esse cache completamente é **REINICIAR O PROJETO**.

## 📝 O Que Foi Modificado

1. ✅ Edge Function agora usa **APENAS** função RPC (bypass total do PostgREST)
2. ✅ Função RPC usa SQL dinâmico (não passa pelo PostgREST)
3. ✅ Tratamento de erros melhorado com mensagens claras
4. ✅ Script SQL remove colunas problemáticas e cria função correta

## ⚠️ IMPORTANTE

- **NÃO PULE O PASSO 2** (reiniciar o projeto)
- O erro **CONTINUARÁ** se você não reiniciar
- Aguarde **2-3 minutos** após o restart antes de testar

## 🆘 Se Ainda Não Funcionar

1. Verifique se executou o SQL corretamente
2. Verifique se reiniciou o projeto
3. Execute `VERIFICAR_FUNCAO_RPC_EXISTE.sql` para diagnosticar
4. Aguarde mais alguns minutos após o restart


