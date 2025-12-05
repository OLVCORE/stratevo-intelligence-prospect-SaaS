# 🗺️ MAPA COMPLETO - ROTAS DE QUALIFICAÇÃO

**Data:** 05/12/2024  
**Objetivo:** Identificar TODAS as rotas relacionadas a qualificação e aprovação

---

## 📍 **ROTAS IDENTIFICADAS:**

### **1. 📊 Base de Empresas (Pool Permanente)**
- **Rota:** `/companies`
- **Arquivo:** `src/pages/CompaniesManagementPage.tsx`
- **Tabela:** `companies`
- **Função:** Pool permanente de empresas qualificadas (12.000+)
- **Menu Sidebar:** "Empresas" → "Base de Empresas"
- **Estrutura:** ✅ Tabela completa com filtros e ações em massa

---

### **2. 🔍 Motor de Qualificação (Upload + Busca)**
- **Rota:** `/central-icp/qualification`
- **Arquivo:** `src/pages/QualificationDashboard.tsx`
- **Tabela:** `companies` (filtra por `pipeline_status`)
- **Função:** Dashboard de qualificação Go/No-Go
- **Menu Sidebar:** "ICP" → "Central ICP" → "Qualificação"
- **Estrutura:** ⚠️ TEM componente `LeadsQualificationTable` - VERIFICAR se é idêntica

---

### **3. 🟠 Quarentena ICP (Análise Pendente)**
- **Rota:** `/leads/icp-quarantine`
- **Arquivo:** `src/pages/Leads/ICPQuarantine.tsx`
- **Tabela:** `icp_analysis_results` WHERE `status='pendente'`
- **Função:** Empresas aguardando análise manual (1.350)
- **Menu Sidebar:** "ICP" → "Quarentena ICP"
- **Estrutura:** ✅ Tabela completa com filtros e ações em massa

---

### **4. ✅ Leads Aprovados**
- **Rota:** `/leads/approved`
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Tabela:** `icp_analysis_results` WHERE `status='aprovada'`
- **Função:** Empresas aprovadas, prontas para criar deals (150)
- **Menu Sidebar:** "ICP" → "Leads Aprovados"
- **Estrutura:** ⚠️ VERIFICAR se tem mesma estrutura das outras

---

### **5. 🔵 Pipeline de Vendas**
- **Rota:** `/leads/pipeline`
- **Arquivo:** `src/pages/Leads/Pipeline.tsx`
- **Tabela:** `sdr_deals`
- **Função:** Deals ativos (150)
- **Menu Sidebar:** "Leads" → "Pipeline"
- **Estrutura:** ⚠️ Estrutura de Kanban (não tabela)

---

### **6. ⚡ Motor de Qualificação (Alt - SearchPage)**
- **Rota:** `/search`
- **Arquivo:** `src/pages/SearchPage.tsx`
- **Tabela:** -
- **Função:** Busca individual + Upload em massa
- **Menu Sidebar:** "Motor de Qualificação"
- **Estrutura:** ⚠️ Formulário de busca (não tabela)

---

## 🎯 **RESPOSTA À PERGUNTA DO USUÁRIO:**

### **"A tabela de qualificação está idêntica às demais?"**

Preciso verificar **4 tabelas principais:**

| Página | Rota | Tem Tabela? | Filtros? | Ações Massa? | Idêntica? |
|--------|------|-------------|----------|--------------|-----------|
| **Base de Empresas** | `/companies` | ✅ SIM | ✅ 6 tipos | ✅ SIM | - (referência) |
| **Quarentena ICP** | `/leads/icp-quarantine` | ✅ SIM | ✅ 6 tipos | ✅ SIM | ✅ SIMILAR |
| **Leads Aprovados** | `/leads/approved` | ❓ ? | ❓ ? | ❓ ? | ❓ VERIFICAR |
| **Qualificação Dashboard** | `/central-icp/qualification` | ⚠️ Componente | ❓ ? | ❓ ? | ❓ VERIFICAR |

---

## 🔍 **PRÓXIMO PASSO:**

Verificar se `ApprovedLeads.tsx` e `QualificationDashboard.tsx` têm:
- ✅ Mesmos filtros (Origem, Status, Setor, UF, Análise, Enriquecimento)
- ✅ Mesmas ações em massa (Aprovar, Enriquecer, Deletar, Exportar)
- ✅ Mesma estrutura de tabela (colunas, layout, etc.)

**Aguarde...** Vou verificar agora! 🔍

