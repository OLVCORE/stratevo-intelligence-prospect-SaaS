# 📋 FLUXO COMPLETO: LinkedIn Leads e Conexões

## 🎯 VISÃO GERAL

Este documento explica **EXATAMENTE** como funciona o sistema de LinkedIn, desde a coleta de leads até o envio de conexões.

---

## 🔄 FLUXO 1: COLETAR LEADS DO LINKEDIN (Motor de Busca Avançada)

### **Onde está:**
- **Página:** Motor de Busca Avançada (`/prospeccao-avancada`)
- **Botão:** "Coletar Leads do LinkedIn" (canto superior direito)

### **Como funciona:**

1. **Você clica em "Coletar Leads do LinkedIn"**
   - Abre um modal

2. **Você cola a URL de busca do LinkedIn**
   - Exemplo: `https://www.linkedin.com/search/results/people/?keywords=recrutadores`
   - Define quantidade (máx 50 leads)

3. **O sistema chama PhantomBuster**
   - Edge Function: `collect-linkedin-leads`
   - PhantomBuster coleta os perfis da URL
   - Retorna dados: nome, email, título, LinkedIn URL, etc.

4. **Os leads são salvos na tabela `decision_makers`**
   - Cada lead vira um registro em `decision_makers`
   - Campos preenchidos: `name`, `first_name`, `last_name`, `title`, `linkedin_url`, `location`, etc.
   - Campo `source_name` = "LinkedIn - Coleta Manual" (ou nome que você definir)

5. **Onde você vê os leads coletados:**
   - **Aba "Decisores & Contatos"** de qualquer empresa
   - **Tabela de Decisores** mostra todos os leads coletados
   - Filtros disponíveis: por cargo, localização, etc.

---

## 🔄 FLUXO 2: ENVIAR CONEXÕES NO LINKEDIN

### **Onde está:**
- **Página:** Aba "Decisores & Contatos" de uma empresa
- **Botão:** Botão verde com ícone de usuário (ao lado do ícone do LinkedIn)

### **Como funciona:**

1. **Você precisa estar conectado ao LinkedIn**
   - Vá em **Configurações** (`/settings`)
   - Card "Conexão LinkedIn"
   - Clique em "Conectar LinkedIn"
   - Digite email/senha OU cole Session Cookie do PhantomBuster

2. **Você clica no botão verde ao lado de um decisor**
   - Abre modal "Solicitar Conexão no LinkedIn"

3. **Você personaliza a mensagem**
   - Seleciona template OU escreve mensagem personalizada
   - Máximo 300 caracteres
   - Verifica limite diário (25 conexões/dia)

4. **Você clica em "Enviar Solicitação"**
   - Sistema salva no banco (`linkedin_connections`)
   - Abre perfil do LinkedIn em nova aba
   - **VOCÊ ENVIA MANUALMENTE** no LinkedIn (o sistema não envia automaticamente)

5. **Rastreamento:**
   - Status salvo: `pending`, `sent`, `accepted`, `rejected`
   - Você vê convites enviados no LinkedIn (aba "Rede")
   - Quando aceito, status é atualizado no sistema

---

## 📊 ONDE OS LEADS APARECEM

### **Tabela `decision_makers`:**
- **Todos os leads coletados** aparecem aqui
- Campos: `name`, `title`, `linkedin_url`, `email`, `phone`, `location`, etc.
- Campo `source_name` indica origem: "LinkedIn - Coleta Manual", "Apollo", etc.

### **Tabela `linkedin_connections`:**
- **Todas as conexões enviadas** aparecem aqui
- Campos: `decisor_name`, `decisor_linkedin_url`, `message`, `status`, `sent_date`

---

## ⚠️ PROBLEMAS ATUAIS E SOLUÇÕES

### **Problema 1: Tabela `profiles` não existe**
- **Solução:** Aplicar migration `20260106000001_create_profiles_table_with_linkedin.sql`
- **Como:** Via Supabase Dashboard → SQL Editor → Execute a migration

### **Problema 2: Erro CORS na Edge Function**
- **Solução:** Corrigir headers CORS na Edge Function
- **Status:** ✅ Já corrigido no código

### **Problema 3: Leads não aparecem com nome de origem**
- **Solução:** Adicionar campo `source_name` ao salvar leads
- **Status:** ⏳ Precisa implementar

### **Problema 4: Leads não têm todas as colunas do template**
- **Solução:** Mapear todos os campos do template ao salvar
- **Status:** ⏳ Precisa implementar

---

## 🎯 PRÓXIMOS PASSOS NECESSÁRIOS

1. ✅ Aplicar migration da tabela `profiles`
2. ⏳ Adicionar campo para nomear origem dos leads
3. ⏳ Garantir que todos os campos do template sejam preenchidos
4. ⏳ Criar visualização dos leads coletados no pipeline

