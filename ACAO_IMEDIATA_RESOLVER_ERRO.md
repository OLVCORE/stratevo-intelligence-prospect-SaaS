# 🚨 AÇÃO IMEDIATA - RESOLVER ERRO AGORA

## ❌ ERRO ATUAL
```
"Could not find the 'data_source' column of 'decision_makers' in the schema cache"
```

## ✅ SOLUÇÃO EM 3 PASSOS

### PASSO 1: Verificar Estado Atual (OPCIONAL)
Execute no Supabase SQL Editor:
```sql
-- Arquivo: VERIFICAR_ESTADO_ANTES_CORRECAO.sql
```

### PASSO 2: Executar Correção (OBRIGATÓRIO)
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo: `SOLUCAO_DEFINITIVA_360_ENGENHEIRO_CHEFE.sql`
4. **Copie TODO o conteúdo** (280 linhas)
5. Cole no SQL Editor
6. Clique em **RUN** (ou Ctrl+Enter)
7. **Aguarde a mensagem**: `✅ SCRIPT EXECUTADO COM SUCESSO!`

### PASSO 3: REINICIAR PROJETO (OBRIGATÓRIO - MAIS IMPORTANTE!)
⚠️ **SEM ESTE PASSO, O ERRO CONTINUARÁ!**

1. No Supabase Dashboard, vá em **Settings** → **General**
2. Role até **Danger Zone**
3. Clique em **"Restart Project"**
4. **Confirme** a ação
5. **Aguarde 2-3 minutos** (projeto ficará indisponível)
6. Aguarde até o status voltar a **"Active"**

### PASSO 4: Testar
1. Recarregue a aplicação (F5)
2. Tente buscar decisores novamente
3. O erro deve ter desaparecido

---

## 🔍 SE O ERRO PERSISTIR

### Verificação 1: Função RPC existe?
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_decision_makers_batch';
```
**Deve retornar:** 1 linha com `routine_type = 'FUNCTION'`

### Verificação 2: Parâmetro correto?
```sql
SELECT parameter_name, data_type 
FROM information_schema.parameters 
WHERE specific_schema = 'public'
AND specific_name LIKE 'insert_decision_makers_batch%';
```
**Deve mostrar:** `decisores_data_text` com tipo `TEXT`

### Verificação 3: Coluna correta existe?
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'decision_makers'
AND column_name LIKE '%source%';
```
**Deve mostrar:** Apenas `data_sources` (plural), **NÃO** `data_source` (singular)

---

## ⚠️ PROBLEMAS COMUNS

### Problema: "Script executou mas erro continua"
**Causa:** Projeto não foi reiniciado
**Solução:** **REINICIE o projeto Supabase AGORA!**

### Problema: "Não consigo reiniciar o projeto"
**Causa:** Pode estar em uso
**Solução:** Aguarde alguns minutos e tente novamente

### Problema: "Erro mudou para outro"
**Causa:** Progresso! Cache foi limpo parcialmente
**Solução:** Execute o script novamente e reinicie novamente

---

## 📞 CHECKLIST FINAL

- [ ] Script SQL executado com sucesso
- [ ] Mensagem "✅ SCRIPT EXECUTADO COM SUCESSO!" apareceu
- [ ] **Projeto Supabase REINICIADO** (Settings → General → Restart)
- [ ] Projeto voltou ao status "Active"
- [ ] Aplicação recarregada (F5)
- [ ] Teste de busca de decisores executado
- [ ] Erro desapareceu ✅

---

**Última atualização:** 2025-01-06  
**Status:** 🔴 AGUARDANDO EXECUÇÃO

