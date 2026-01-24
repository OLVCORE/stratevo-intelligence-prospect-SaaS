# 🧭 MICROCICLO 1 — CLASSIFICAÇÃO ARQUITETURAL
## STRATEVO ONE — Governança Arquitetural

---

## 🎯 FLUXO CANÔNICO SOBERANO (DECLARADO)

```
LISTA (UPLOAD ou BUSCA)
→ BASE DE EMPRESAS
→ POOL COMERCIAL (GOVERNANÇA)
→ SALES TARGET (ATIVAÇÃO COMERCIAL)
→ PIPELINE DE VENDAS (CRM)
```

**Este é o fluxo único e soberano que comanda toda a plataforma STRATEVO ONE.**

---

## 📋 CLASSIFICAÇÃO DE COMPONENTES

### 🔵 CORE — Pertence ao Fluxo Canônico

#### 1. ENTRADA: LISTA (UPLOAD ou BUSCA)

**1.1. Upload de Listas (CSV/Excel/Google Sheets)**
- **Localização:** `src/components/companies/BulkUploadDialog.tsx`
- **Encaixe no fluxo:** LISTA → BASE DE EMPRESAS
- **Justificativa:** Ponto de entrada canônico. Recebe lista externa e insere em `prospecting_candidates` (quarentena) que alimenta a BASE DE EMPRESAS após qualificação.
- **Status:** CORE

**1.2. Motor de Busca Individual**
- **Localização:** `src/lib/engines/search/companySearch.ts`
- **Encaixe no fluxo:** LISTA → BASE DE EMPRESAS
- **Justificativa:** Ponto de entrada canônico alternativo. Busca individual que pode resultar em criação de empresa na BASE DE EMPRESAS.
- **Status:** CORE

**1.3. Busca Individual via UI**
- **Localização:** `src/components/companies/CompanyRowActions.tsx` (ação "Descobrir CNPJ")
- **Encaixe no fluxo:** LISTA → BASE DE EMPRESAS
- **Justificativa:** Permite adicionar empresas individualmente à BASE DE EMPRESAS.
- **Status:** CORE

#### 2. BASE DE EMPRESAS

**2.1. Tabela `companies`**
- **Encaixe no fluxo:** BASE DE EMPRESAS
- **Justificativa:** Repositório central de empresas qualificadas. Todas as empresas devem passar por aqui antes de ir para POOL COMERCIAL.
- **Status:** CORE

**2.2. Tabela `qualified_prospects` (Estoque Qualificado)**
- **Encaixe no fluxo:** BASE DE EMPRESAS
- **Justificativa:** Estoque de prospects qualificados que aguardam aprovação para POOL COMERCIAL.
- **Status:** CORE

**2.3. Tabela `prospecting_candidates` (Quarentena)**
- **Encaixe no fluxo:** LISTA → BASE DE EMPRESAS
- **Justificativa:** Zona de quarentena onde empresas entram antes de serem qualificadas e movidas para BASE DE EMPRESAS.
- **Status:** CORE

**2.4. Motor de Qualificação**
- **Localização:** `src/pages/QualificationEnginePage.tsx`
- **Encaixe no fluxo:** LISTA → BASE DE EMPRESAS
- **Justificativa:** Processa empresas da quarentena e qualifica para BASE DE EMPRESAS.
- **Status:** CORE

**2.5. Jobs de Qualificação (`prospect_qualification_jobs`)**
- **Encaixe no fluxo:** LISTA → BASE DE EMPRESAS
- **Justificativa:** Orquestra o processo de qualificação em lote.
- **Status:** CORE

#### 3. POOL COMERCIAL (GOVERNANÇA)

**3.1. Quarentena ICP (`leads_quarantine`)**
- **Localização:** `src/pages/Leads/Quarantine.tsx`
- **Encaixe no fluxo:** BASE DE EMPRESAS → POOL COMERCIAL
- **Justificativa:** Zona de governança onde empresas da BASE DE EMPRESAS são validadas antes de entrar no POOL COMERCIAL.
- **Status:** CORE

**3.2. Aprovação na Quarentena (RPC `approve_quarantine_to_crm`)**
- **Localização:** `src/pages/Leads/Quarantine.tsx` (linhas 84-132)
- **Encaixe no fluxo:** POOL COMERCIAL → SALES TARGET
- **Justificativa:** Ação de governança que move empresas aprovadas para SALES TARGET (cria leads/deals).
- **Status:** CORE

**3.3. Ação "Integrar para ICP"**
- **Localização:** `src/components/companies/BulkActionsToolbar.tsx` (linhas 221-232)
- **Encaixe no fluxo:** BASE DE EMPRESAS → POOL COMERCIAL
- **Justificativa:** Move empresas da BASE DE EMPRESAS para POOL COMERCIAL (quarentena ICP).
- **Status:** CORE

**3.4. Ação "Aprovar e Mover para Pool"**
- **Localização:** `src/components/companies/BulkActionsToolbar.tsx`
- **Encaixe no fluxo:** BASE DE EMPRESAS → POOL COMERCIAL
- **Justificativa:** Ação de governança que aprova empresas e as move para POOL COMERCIAL.
- **Status:** CORE

#### 4. SALES TARGET (ATIVAÇÃO COMERCIAL)

**4.1. Tabela `leads`**
- **Encaixe no fluxo:** POOL COMERCIAL → SALES TARGET → PIPELINE DE VENDAS
- **Justificativa:** Entidade que representa empresas aprovadas e prontas para ativação comercial.
- **Status:** CORE

**4.2. Tabela `sdr_deals`**
- **Encaixe no fluxo:** SALES TARGET → PIPELINE DE VENDAS
- **Justificativa:** Oportunidades comerciais criadas a partir de leads aprovados.
- **Status:** CORE

**4.3. Página de Leads Aprovados**
- **Localização:** `src/pages/Leads/ApprovedLeads.tsx`
- **Encaixe no fluxo:** SALES TARGET
- **Justificativa:** Interface para visualizar e gerenciar leads aprovados (SALES TARGET).
- **Status:** CORE

#### 5. PIPELINE DE VENDAS (CRM)

**5.1. Módulo CRM**
- **Localização:** `src/modules/crm/`
- **Encaixe no fluxo:** PIPELINE DE VENDAS
- **Justificativa:** Sistema completo de gestão de pipeline de vendas.
- **Status:** CORE

**5.2. Pipeline de Vendas**
- **Localização:** `src/pages/Leads/Pipeline.tsx`
- **Encaixe no fluxo:** PIPELINE DE VENDAS
- **Justificativa:** Visualização e gestão do pipeline de vendas.
- **Status:** CORE

**5.3. Tabela `deals` (CRM)**
- **Encaixe no fluxo:** PIPELINE DE VENDAS
- **Justificativa:** Oportunidades em andamento no pipeline de vendas.
- **Status:** CORE

---

### 🟡 LEGACY — Existe, mas não deve comandar o fluxo

**1. Quarentena de Leads (antiga)**
- **Localização:** `src/pages/Leads/Quarantine.tsx`
- **Razão:** Existe uma quarentena antiga que não está claramente alinhada com o fluxo canônico. Pode ter sido substituída pela Quarentena ICP.
- **Status:** LEGACY

**2. Fluxo direto Upload → Estoque Qualificado**
- **Localização:** `src/components/companies/BulkUploadDialog.tsx`
- **Razão:** Upload cria job automaticamente que pode qualificar empresas sem passar por governança explícita. Não segue o fluxo canônico que exige POOL COMERCIAL.
- **Status:** LEGACY

**3. Criação automática de leads/deals na aprovação da quarentena**
- **Localização:** `src/pages/Leads/Quarantine.tsx` (RPC `approve_quarantine_to_crm`)
- **Razão:** Pula a etapa SALES TARGET e vai direto para PIPELINE DE VENDAS. Não segue o fluxo canônico que exige ativação comercial intermediária.
- **Status:** LEGACY

**4. Estados implícitos em `companies`**
- **Razão:** Tabela `companies` não tem campo `status` explícito. Estados são inferidos pela existência ou não de dados relacionados. Não permite governança clara do fluxo.
- **Status:** LEGACY

**5. Múltiplos pontos de entrada sem unificação**
- **Razão:** Upload, busca individual, quarentena podem criar empresas em diferentes estados sem seguir o fluxo canônico unificado.
- **Status:** LEGACY

---

### 🟠 REDUNDANTE — Faz algo que outro ponto já faz

**1. Enrichment 360° Completo vs Enrichment 360° Simplificado**
- **Localizações:** 
  - `src/lib/engines/enrichment/enrichment360.ts` (completo)
  - `src/services/enrichment360.ts` (simplificado)
- **Razão:** Dois sistemas fazem enrichment 360°, um completo e outro simplificado. Ambos calculam scores mas com fontes diferentes.
- **Status:** REDUNDANTE

**2. Quick Refresh vs Atualização Completa**
- **Localização:** `src/components/companies/UnifiedEnrichButton.tsx`
- **Razão:** Dois modos de atualização (rápida ~30s vs completa ~2min) que podem conflitar ou sobrescrever dados.
- **Status:** REDUNDANTE

**3. Enrichment Individual vs Enrichment em Massa**
- **Localizações:**
  - `src/components/companies/UnifiedEnrichButton.tsx` (individual)
  - `src/components/companies/BulkActionsToolbar.tsx` (massa)
- **Razão:** Mesma funcionalidade (enrichment) disponível em dois pontos diferentes com lógicas potencialmente diferentes.
- **Status:** REDUNDANTE

**4. Múltiplas ações de enriquecimento (Receita, Apollo, 360°)**
- **Localizações:** Várias
- **Razão:** Enrichment pode ser disparado de múltiplos pontos (botão individual, toolbar massa, auto-agendado) sem coordenação central.
- **Status:** REDUNDANTE

**5. Verificação de duplicatas limitada vs global**
- **Localização:** `src/components/companies/BulkUploadDialog.tsx`
- **Razão:** Verifica duplicatas apenas no mesmo `source_batch_id`, mas não globalmente. Permite duplicatas entre diferentes fontes.
- **Status:** REDUNDANTE (lógica incompleta)

**6. Exportação CSV (múltiplos pontos)**
- **Localizações:** Várias
- **Razão:** Exportação disponível em múltiplos componentes sem unificação.
- **Status:** REDUNDANTE

---

### 🔴 FORA DO FLUXO — Não se encaixa no modelo soberano

**1. Intelligence 360° (Análise)**
- **Localização:** `src/pages/Analysis360Page.tsx`
- **Razão:** Página de análise e visualização de dados. Não faz parte do fluxo canônico de LISTA → BASE → POOL → TARGET → PIPELINE.
- **Status:** FORA DO FLUXO

**2. Central ICP (Configuração)**
- **Localização:** `src/pages/CentralICP/`
- **Razão:** Sistema de configuração de ICPs. Não é parte do fluxo canônico, mas é pré-requisito para qualificação.
- **Status:** FORA DO FLUXO

**3. Relatórios Executivos**
- **Localização:** `src/components/reports/ExecutiveReportModal.tsx`
- **Razão:** Visualização de relatórios. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**4. Account Strategy (Estratégia de Conta)**
- **Localização:** `src/pages/AccountStrategyPage.tsx`
- **Razão:** Criação de estratégias de conta. Não faz parte do fluxo canônico de movimentação de empresas.
- **Status:** FORA DO FLUXO

**5. Dashboard Executivo**
- **Localização:** `src/pages/Dashboard.tsx`
- **Razão:** Visualização de métricas e KPIs. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**6. Command Center**
- **Localização:** `src/pages/CommandCenter.tsx`
- **Razão:** Centro de comando e visualização geral. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**7. Guide/Tutorial**
- **Localização:** `src/pages/Guide/`
- **Razão:** Sistema de ajuda e tutoriais. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**8. Settings/Configurações**
- **Localização:** `src/pages/SettingsPage.tsx`
- **Razão:** Configurações gerais do sistema. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**9. Sales Academy**
- **Localização:** `src/modules/sales-academy/`
- **Razão:** Módulo de treinamento e capacitação. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**10. Webhooks/Integrações Externas**
- **Razão:** Sistema de integração com sistemas externos. Não faz parte do fluxo canônico interno.
- **Status:** FORA DO FLUXO

**11. Auto-Enrich Agendado**
- **Localização:** `src/components/companies/UnifiedEnrichButton.tsx`
- **Razão:** Enrichment automático agendado (3AM). Não faz parte do fluxo canônico de entrada de empresas.
- **Status:** FORA DO FLUXO

**12. Lusha (não mapeado)**
- **Razão:** Configuração identificada mas implementação não mapeada. Status incerto.
- **Status:** FORA DO FLUXO

**13. Ingestões Automáticas (webhooks)**
- **Razão:** Sistema de ingestão automática via webhooks. Não segue o fluxo canônico de LISTA → BASE.
- **Status:** FORA DO FLUXO

**14. Módulo CRM completo (fora do pipeline de vendas)**
- **Localização:** `src/modules/crm/`
- **Razão:** Módulo CRM tem funcionalidades que não são parte do pipeline de vendas canônico (ex: templates, workflows, analytics).
- **Status:** FORA DO FLUXO (parcialmente - apenas pipeline é CORE)

**15. Análise Competitiva**
- **Razão:** Sistema de análise de concorrentes. Não faz parte do fluxo canônico.
- **Status:** FORA DO FLUXO

**16. Discovery/Descoberta de Empresas**
- **Localização:** `src/pages/CompanyDiscoveryPage.tsx`
- **Razão:** Sistema de descoberta de empresas. Não segue o fluxo canônico de LISTA → BASE.
- **Status:** FORA DO FLUXO

---

## 📊 RESUMO DA CLASSIFICAÇÃO

### CORE (Pertence ao Fluxo Canônico)
- **Total:** 20 componentes
- **Função:** Componentes essenciais que compõem o fluxo canônico LISTA → BASE → POOL → TARGET → PIPELINE

### LEGACY (Existe, mas não deve comandar)
- **Total:** 5 componentes
- **Função:** Componentes que existem mas não seguem o fluxo canônico ou têm lógica que precisa ser alinhada

### REDUNDANTE (Faz algo que outro já faz)
- **Total:** 6 componentes
- **Função:** Componentes que duplicam funcionalidade ou têm lógica incompleta que pode conflitar

### FORA DO FLUXO (Não se encaixa no modelo)
- **Total:** 16 componentes
- **Função:** Componentes que são auxiliares, de configuração, análise ou visualização, mas não fazem parte do fluxo canônico

---

## 🎯 MAPEAMENTO DO FLUXO CANÔNICO

### ETAPA 1: LISTA (UPLOAD ou BUSCA)
**Componentes CORE:**
- Upload de Listas (`BulkUploadDialog.tsx`)
- Motor de Busca Individual (`companySearch.ts`)
- Busca Individual via UI (`CompanyRowActions.tsx`)
- Tabela `prospecting_candidates` (quarentena)

**Saída:** Empresas em `prospecting_candidates` (quarentena)

---

### ETAPA 2: BASE DE EMPRESAS
**Componentes CORE:**
- Motor de Qualificação (`QualificationEnginePage.tsx`)
- Jobs de Qualificação (`prospect_qualification_jobs`)
- Tabela `qualified_prospects` (estoque qualificado)
- Tabela `companies` (base de empresas)

**Entrada:** Empresas de `prospecting_candidates`
**Saída:** Empresas qualificadas em `companies` ou `qualified_prospects`

---

### ETAPA 3: POOL COMERCIAL (GOVERNANÇA)
**Componentes CORE:**
- Quarentena ICP (`leads_quarantine`)
- Ação "Integrar para ICP" (`BulkActionsToolbar.tsx`)
- Ação "Aprovar e Mover para Pool" (`BulkActionsToolbar.tsx`)
- Aprovação na Quarentena (`approve_quarantine_to_crm`)

**Entrada:** Empresas da BASE DE EMPRESAS
**Saída:** Empresas aprovadas prontas para SALES TARGET

---

### ETAPA 4: SALES TARGET (ATIVAÇÃO COMERCIAL)
**Componentes CORE:**
- Tabela `leads` (leads aprovados)
- Tabela `sdr_deals` (oportunidades)
- Página de Leads Aprovados (`ApprovedLeads.tsx`)

**Entrada:** Empresas aprovadas do POOL COMERCIAL
**Saída:** Leads e deals prontos para PIPELINE DE VENDAS

---

### ETAPA 5: PIPELINE DE VENDAS (CRM)
**Componentes CORE:**
- Módulo CRM (`src/modules/crm/`)
- Pipeline de Vendas (`Pipeline.tsx`)
- Tabela `deals` (CRM)

**Entrada:** Leads e deals de SALES TARGET
**Saída:** Oportunidades em andamento no pipeline

---

## ⚠️ OBSERVAÇÕES ARQUITETURAIS

### 1. Pontos de Ruptura no Fluxo Canônico

**Ruptura 1:** Upload → Estoque Qualificado (sem POOL COMERCIAL)
- Upload cria job que pode qualificar empresas diretamente para `qualified_prospects`
- Pula a etapa de POOL COMERCIAL (governança)
- **Impacto:** Empresas podem entrar na BASE DE EMPRESAS sem validação de governança

**Ruptura 2:** Quarentena → CRM (sem SALES TARGET)
- Aprovação na quarentena cria leads/deals diretamente
- Pula a etapa de SALES TARGET (ativação comercial)
- **Impacto:** Leads podem ir direto para PIPELINE sem ativação comercial

**Ruptura 3:** Múltiplos pontos de entrada sem unificação
- Upload, busca individual, quarentena podem criar empresas em diferentes estados
- Não há unificação que garanta que todas sigam o fluxo canônico
- **Impacto:** Dificulta governança e rastreamento

### 2. Componentes que Precisam de Alinhamento

**Alinhamento 1:** Estados implícitos em `companies`
- Tabela não tem campo `status` explícito
- Estados são inferidos pela existência de dados relacionados
- **Necessidade:** Campo `status` explícito que reflita a posição no fluxo canônico

**Alinhamento 2:** Verificação de duplicatas
- Verifica apenas no mesmo `source_batch_id`
- Não verifica globalmente entre diferentes fontes
- **Necessidade:** Verificação global de duplicatas antes de inserir na BASE DE EMPRESAS

**Alinhamento 3:** Enrichment múltiplo
- Múltiplos pontos podem disparar enrichment
- Pode gerar conflitos ou sobrescrita de dados
- **Necessidade:** Coordenação central de enrichment ou regras claras de quando disparar

### 3. Componentes Auxiliares (Fora do Fluxo, mas Necessários)

**Auxiliar 1:** Central ICP
- Configuração de ICPs é pré-requisito para qualificação
- Não faz parte do fluxo canônico, mas é necessário
- **Status:** Auxiliar necessário

**Auxiliar 2:** Enrichment
- Enrichment não faz parte do fluxo canônico de movimentação
- Mas é necessário para qualificar empresas
- **Status:** Auxiliar necessário (mas precisa de governança)

**Auxiliar 3:** Dashboard e Relatórios
- Visualização e análise não fazem parte do fluxo canônico
- Mas são necessários para gestão
- **Status:** Auxiliar necessário

---

## 🛑 REGRA DE PARADA

**MICROCICLO 1 CONCLUÍDO**

Este documento classifica todos os componentes identificados no MICROCICLO 0 conforme o fluxo canônico soberano declarado.

**Nenhuma alteração de código foi feita.**
**Nenhuma funcionalidade foi desativada.**
**Nenhum arquivo foi criado ou movido.**

Aguardando validação humana explícita antes de prosseguir para qualquer outro microciclo.

---

**FIM DO MICROCICLO 1**

*Este documento é puramente arquitetural e conceitual. Nenhuma alteração foi feita no código ou estrutura do sistema.*
