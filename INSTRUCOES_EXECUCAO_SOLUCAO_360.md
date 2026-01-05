# 📋 INSTRUÇÕES DE EXECUÇÃO - SOLUÇÃO 360°

## 🎯 OBJETIVO

Resolver definitivamente os problemas de extração de decisores (Apollo + LinkedIn/Polo).

---

## ✅ PASSO A PASSO

### 1. Executar Script SQL

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `SOLUCAO_DEFINITIVA_360_ENGENHEIRO_CHEFE.sql`
4. Copie e cole todo o conteúdo
5. Clique em **RUN** (ou pressione Ctrl+Enter)
6. Verifique se apareceu a mensagem: `✅ SCRIPT EXECUTADO COM SUCESSO!`

### 2. Verificar Resultado do Script

O script deve mostrar 3 tabelas de verificação:

1. **COLUNAS_SOURCE**: Deve mostrar apenas `data_sources` (plural), NÃO `data_source` (singular)
2. **FUNCAO_RPC**: Deve mostrar `insert_decision_makers_batch` com tipo `FUNCTION`
3. **PARAMETROS_FUNCAO**: Deve mostrar `decisores_data_text` com tipo `TEXT`

**Se aparecer `data_source` (singular), execute o script novamente.**

### 3. 🔴 REINICIAR PROJETO SUPABASE (OBRIGATÓRIO)

⚠️ **ESTE PASSO É OBRIGATÓRIO!** Sem reiniciar, o cache do PostgREST não será limpo e o erro persistirá.

1. No Supabase Dashboard, vá em **Settings** → **General**
2. Role até encontrar **Danger Zone**
3. Clique em **Restart Project**
4. Confirme a ação
5. **Aguarde 2-3 minutos** (o projeto ficará indisponível durante este tempo)

### 4. Verificar se Projeto Reiniciou

1. Aguarde até o status do projeto voltar a **Active**
2. Teste uma query simples no SQL Editor:
   ```sql
   SELECT COUNT(*) FROM decision_makers;
   ```
3. Se funcionar, o projeto reiniciou corretamente

### 5. Testar Busca de Decisores

1. Acesse a aplicação
2. Vá para uma empresa na **Quarentena** ou **Aprovados**
3. Clique em **Buscar Decisores** (botão Apollo)
4. Verifique os logs no console do navegador
5. Verifique os logs da Edge Function no Supabase Dashboard:
   - **Edge Functions** → `enrich-apollo-decisores` → **Logs**

---

## 🔍 VERIFICAÇÃO DE PROBLEMAS

### Se o erro persistir após reiniciar:

1. **Verificar se função RPC existe:**
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'insert_decision_makers_batch';
   ```
   Deve retornar 1 linha com `routine_type = 'FUNCTION'`

2. **Verificar parâmetros da função:**
   ```sql
   SELECT parameter_name, data_type 
   FROM information_schema.parameters 
   WHERE specific_schema = 'public'
   AND specific_name LIKE 'insert_decision_makers_batch%';
   ```
   Deve mostrar `decisores_data_text` com tipo `TEXT`

3. **Verificar colunas da tabela:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'decision_makers'
   AND (column_name LIKE '%source%');
   ```
   Deve mostrar apenas `data_sources` (plural), NÃO `data_source` (singular)

### Se Apollo retornar 0 decisores:

1. **Verificar logs da Edge Function:**
   - Dashboard → Edge Functions → `enrich-apollo-decisores` → Logs
   - Procure por: `[ENRICH-APOLLO] ✅ Organização encontrada`
   - Procure por: `[ENRICH-APOLLO] ✅ Coleta finalizada: X pessoas no total`

2. **Verificar se organização foi encontrada:**
   - Logs devem mostrar: `[ENRICH-APOLLO-DECISORES] ✅ Organização selecionada`
   - Se não aparecer, a organização pode não estar no Apollo

3. **Verificar filtros:**
   - Os filtros de cidade/estado podem estar muito restritivos
   - Tente buscar sem filtros primeiro

---

## 📊 LOGS ESPERADOS (Sucesso)

### Console do Navegador:
```
[Apollo+Phantom] 🔥 Extração híbrida: NOME_EMPRESA | companyId: xxx
[Apollo+Phantom] 🚀 Chamando Apollo backend...
[Apollo+Phantom] 📡 Response status: 200
[Apollo+Phantom] 📦 Response body: {success: true, decisores: Array(X), ...}
[Apollo+Phantom] 🔍 Decisores extraídos do response: X
[Apollo+Phantom] ✅ Extração completa, retornando X decisores
```

### Logs da Edge Function:
```
[ENRICH-APOLLO] 📥 Request recebido: {company_id: xxx, company_name: "..."}
[ENRICH-APOLLO-DECISORES] Buscando decisores para: NOME_EMPRESA
[ENRICH-APOLLO-DECISORES] ✅ Organização selecionada: {id: xxx, nome: "..."}
[ENRICH-APOLLO] ✅ Organização encontrada: {id: xxx, name: "..."}
[ENRICH-APOLLO] 🔄 Iniciando coleta completa de pessoas (paginação)...
[ENRICH-APOLLO] 📄 Coletando página 1...
[ENRICH-APOLLO] 📊 Página 1: X pessoas encontradas
[ENRICH-APOLLO] ✅ Coleta finalizada: X pessoas no total
[ENRICH-APOLLO] Total mapeados: X
[ENRICH-APOLLO] Decision makers: X
[ENRICH-APOLLO] Preparando para salvar: X decisores
[ENRICH-APOLLO] 🔄 Tentando usar função RPC (contorna cache PostgREST)...
[ENRICH-APOLLO] ✅ Lote 1 salvo (RPC): X decisores
[ENRICH-APOLLO] ✅ TOTAL SALVOS: X decisores no banco!
```

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema: Erro 500 "Could not find the 'data_source' column"

**Causa:** Cache do PostgREST ainda contém referência à coluna antiga.

**Solução:**
1. Execute o script SQL novamente
2. **REINICIE o projeto Supabase** (obrigatório!)
3. Aguarde 2-3 minutos
4. Tente novamente

### Problema: Apollo retorna 0 decisores

**Causas possíveis:**
1. Organização não encontrada no Apollo
2. Organização sem pessoas cadastradas
3. Filtros muito restritivos

**Soluções:**
1. Verificar logs da Edge Function para ver se organização foi encontrada
2. Tentar buscar sem filtros de cidade/estado
3. Verificar se empresa tem LinkedIn URL (pode usar PhantomBuster como fallback)

### Problema: Erros CORS (522/521)

**Causa:** Problemas de infraestrutura do Supabase ou timeout.

**Soluções:**
1. Aguardar alguns minutos e tentar novamente
2. Verificar status do Supabase: https://status.supabase.com/
3. Se persistir, pode ser problema temporário de infraestrutura

---

## 📝 CHECKLIST FINAL

- [ ] Script SQL executado com sucesso
- [ ] Verificação mostra apenas `data_sources` (plural)
- [ ] Função RPC criada corretamente (recebe TEXT)
- [ ] **Projeto Supabase reiniciado** (obrigatório!)
- [ ] Projeto voltou ao status Active
- [ ] Teste de busca de decisores executado
- [ ] Logs verificados (sem erros)
- [ ] Decisores aparecem na interface

---

## 🎯 PRÓXIMOS PASSOS APÓS CORREÇÃO

1. **Monitorar logs** por 24 horas para garantir estabilidade
2. **Testar em múltiplas empresas** para validar funcionamento
3. **Documentar** qualquer problema adicional encontrado
4. **Otimizar busca Apollo** se necessário (ajustar filtros)

---

**Última atualização:** 2025-01-06  
**Status:** ✅ Pronto para execução

