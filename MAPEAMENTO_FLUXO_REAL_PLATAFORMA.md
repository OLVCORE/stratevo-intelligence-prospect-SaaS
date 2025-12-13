# 🗺️ MAPEAMENTO COMPLETO DO FLUXO REAL DA PLATAFORMA

**Data:** 2025-02-20  
**Status:** 🔍 **ANÁLISE EM ANDAMENTO - AGUARDANDO CONFIRMAÇÃO**

---

## 📋 FLUXO ATUAL IDENTIFICADO

### **FLUXO 1: Upload via BulkUploadDialog (EXISTENTE)**

**Caminho:** Dashboard > leads > qualification-engine > Upload CSV/Excel

**Passos:**
1. **Upload CSV/Excel** → `BulkUploadDialog`
2. **Salva em:** `prospecting_candidates` (tabela de candidatos)
3. **Cria job:** `prospect_qualification_jobs`
4. **Qualificação:** Processa via `process_qualification_job_sniper` (RPC)
5. **Resultado:** Salva em `qualified_prospects`
6. **Próximo passo:** Estoque Qualificado (`/leads/qualified-stock`)
7. **Promoção:** Estoque Qualificado → `companies` (Banco de Empresas)

**Tabelas envolvidas:**
- `prospecting_candidates` (entrada)
- `prospect_qualification_jobs` (controle)
- `qualified_prospects` (saída qualificada)
- `companies` (destino final)

---

### **FLUXO 2: Upload direto para Companies (ALTERNATIVO?)**

**Caminho:** Dashboard > leads > qualification-engine > Upload CSV/Excel

**Passos:**
1. **Upload CSV/Excel** → `BulkUploadDialog`
2. **Salva em:** `companies` (com status `quarantine`)
3. **Cria em:** `icp_analysis_results` (quarentena ICP)
4. **Próximo passo:** Quarentena ICP (`/leads/icp-quarantine`)
5. **Aprovação:** Quarentena ICP → `companies` (aprovadas)

**Tabelas envolvidas:**
- `companies` (entrada com status quarantine)
- `icp_analysis_results` (quarentena)
- `companies` (destino final aprovado)

---

## ❓ DÚVIDAS CRÍTICAS

### **1. Qual é o fluxo CORRETO?**
- Fluxo 1 (prospecting_candidates → qualified_prospects → companies)?
- Fluxo 2 (companies → icp_analysis_results → companies)?
- Ambos existem para casos diferentes?

### **2. Onde BulkUploadDialog realmente salva?**
- `prospecting_candidates`?
- `companies`?
- Ambos dependendo da configuração?

### **3. O que o usuário pediu para MC10?**
- Melhorar o processamento de CNPJs em massa?
- Criar um caminho mais direto?
- Ou duplicar funcionalidade?

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### **BulkUploadDialog - Onde salva?**

**Linha 586:** `// FLUXO NOVO: SEMPRE importa para estoque (companies) e redireciona para Quarentena ICP`

**Linha 750:** `insertDirectlyToProspectingCandidates` - função que salva em `prospecting_candidates`

**Conclusão:** Parece que salva em `prospecting_candidates`, mas o comentário diz "companies". Preciso verificar o código real.

---

## ⚠️ PROBLEMA IDENTIFICADO

### **MC10 - BulkCNPJUpload pode estar DUPLICANDO:**

**BulkCNPJUpload (NOVO):**
- Upload de CNPJs
- Cria job: `prospect_qualification_jobs`
- Processa via: `qualify-prospects-bulk` (Edge Function)
- Salva em: `qualified_prospects`

**BulkUploadDialog (EXISTENTE):**
- Upload de empresas completas
- Cria job: `prospect_qualification_jobs`
- Processa via: `process_qualification_job_sniper` (RPC)
- Salva em: `qualified_prospects` (após qualificação)

**⚠️ CONFLITO:** Ambos criam jobs e salvam em `qualified_prospects`!

---

## 🎯 O QUE O USUÁRIO PEDIU

> "eu havia pedido para criar o caminho Dashboard > leads > qualification-engine para subir esses lead via up load em massa, depois da qualificação ele iiria para a base de empresa"

**Interpretação:**
- Caminho: Dashboard > leads > qualification-engine
- Upload em massa de leads
- Qualificação automática
- Depois: Base de Empresas (`companies`)

**Isso já existe via BulkUploadDialog!**

---

## ✅ CONCLUSÃO PRELIMINAR

**MC10 pode estar DUPLICANDO funcionalidade existente!**

**Próximos passos:**
1. Verificar exatamente onde BulkUploadDialog salva
2. Verificar se o fluxo atual já faz o que o usuário pediu
3. Se sim, REMOVER MC10 e melhorar BulkUploadDialog existente
4. Se não, ajustar MC10 para não duplicar

---

**Status:** 🔍 **AGUARDANDO ANÁLISE MAIS PROFUNDA DO CÓDIGO**

