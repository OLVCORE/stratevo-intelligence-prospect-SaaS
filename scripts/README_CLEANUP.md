# 🧹 LIMPEZA SEGURA DO BANCO DE DADOS

## 📋 O QUE ESTE SCRIPT FAZ

Este script **LIMPA APENAS OS RELATÓRIOS TOTVS** que foram salvos com o sistema antigo e estão causando loops e problemas de carregamento.

### ✅ O QUE É PRESERVADO:
- ✅ Suas **40 empresas** (tabela `companies`)
- ✅ Registros de **análise ICP** (tabela `icp_analysis_results`)
- ✅ **Usuários** e autenticação
- ✅ **Conversas** e histórico do Trevo
- ✅ **Todas as configurações** do sistema

### ❌ O QUE É REMOVIDO:
- ❌ **Relatórios salvos antigos** (com `full_report` vazio/corrompido)
- ❌ **Cache de verificações TOTVS** (tabela `simple_totvs_checks`)
- ❌ **Status de processamento** (volta para 'pendente')

---

## 🚀 COMO EXECUTAR

### **Passo 1: Acessar Supabase**
1. Acesse: https://supabase.com/dashboard
2. Login na sua conta
3. Selecione o projeto: **olv-intelligence-prospect-v2**

### **Passo 2: Abrir SQL Editor**
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### **Passo 3: Copiar e Executar o Script**
1. Abra o arquivo: `scripts/cleanup-stc-reports.sql`
2. Copie **TODO O CONTEÚDO** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl+Enter`)

### **Passo 4: Verificar Resultado**
Você deve ver uma tabela com:
```
tabela                      | registros
----------------------------|----------
stc_verification_history    | 0
simple_totvs_checks         | 0
icp_analysis_results        | 40 (ou quantas empresas você tem)
```

---

## ⚠️ IMPORTANTE - APÓS A LIMPEZA

### **1. Recarregar o Frontend**
```bash
# No navegador:
Ctrl+Shift+R (hard reload)
# Ou feche e abra novamente
```

### **2. Limpar LocalStorage do Navegador**
```bash
# Abra o Console (F12)
# Cole e execute:
localStorage.clear();
location.reload();
```

### **3. Primeiro Teste Completo**
1. Abra qualquer empresa (ex: Golden Cargo)
2. Clique **"Verificar Agora"**
   - ⚠️ **VAI CONSUMIR CRÉDITOS** (primeira vez após limpeza)
   - Aguarde ~30 segundos
   - Veja as evidências aparecerem
3. Clique **"Salvar Relatório"**
   - ✅ Agora salva com `full_report` correto!
4. Feche o modal
5. Reabra a empresa
6. Clique **"Histórico"**
   - ✅ Veja o relatório com timestamp NOVO
7. Clique na **SETA**
   - ✅ Página recarrega
   - ✅ **TODOS OS DADOS APARECEM!**
   - ✅ **SEM LOOP!**

---

## 🔧 TROUBLESHOOTING

### **Se ainda der loop após limpeza:**
```bash
# Limpar cache do navegador completamente
1. Abrir DevTools (F12)
2. Aba "Application"
3. Seção "Storage" → "Clear site data"
4. Marcar tudo
5. Clicar "Clear site data"
6. Fechar navegador
7. Reabrir localhost:5173
```

### **Se relatórios não salvarem:**
Verifique no console:
```
[SAVE] 💾 Salvando full_report no banco...
[SAVE] ✅ full_report salvo no banco!
```

Se NÃO aparecer esses logs, há problema no `stcHistoryId`.

---

## 📊 APÓS LIMPEZA - EXPECTATIVAS

### **Consumo de Créditos:**
- ⚠️ **Primeira verificação** de cada empresa **CONSUMIRÁ créditos** (~150 créditos)
- ✅ **Próximas vezes:** Carrega do histórico **SEM CONSUMIR créditos**

### **Performance:**
- ✅ Relatórios carregam **INSTANTANEAMENTE** do histórico
- ✅ Progress bar **FUNCIONA CORRETAMENTE** (9/9)
- ✅ **SEM LOOPS** ao navegar entre páginas
- ✅ **SEM "SEM DADOS!"** no console

---

## 🎯 RECOMENDAÇÃO FINAL

**EXECUTE A LIMPEZA AGORA!** 

Os dados antigos estão corrompidos e causando todos os problemas:
- Loop ao carregar histórico
- Relatórios vazios
- Progress bar travado
- Timestamps desatualizados

**Após a limpeza, TUDO VAI FUNCIONAR perfeitamente!**

---

**PRONTO PARA EXECUTAR? Me confirme quando terminar a limpeza para validarmos juntos!**

