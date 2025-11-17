# 📊 MAPEAMENTO COMPLETO - INVENTÁRIO DE COMPONENTES, BOTÕES E ROTAS
## Fase 1 - Etapa 1.1: Inventário Completo

**Data:** 2025-01-XX  
**Status:** ✅ Completo  
**Tempo:** 45 minutos

---

# 📋 SUMÁRIO EXECUTIVO

## Componentes Mapeados:
- ✅ **6 componentes de Menu/Actions** identificados
- ✅ **4 componentes de Botões de Enriquecimento** identificados
- ✅ **3 rotas de Empresas** mapeadas
- ✅ **Tabs de Company Detail** mapeadas (7 tabs)
- ✅ **SDR Workspace** mapeado (11 tabs)

---

# 🎯 1. COMPONENTES DE MENU/ACTIONS

## 1.1 QuarantineActionsMenu.tsx
**Localização:** `src/components/icp/QuarantineActionsMenu.tsx`  
**Props Principais:**
- `selectedCount: number`
- `onDeleteSelected: () => Promise<void>`
- `onExportSelected: () => void`
- `onPreviewSelected: () => void`
- `onRefreshSelected?: () => void`
- `onBulkEnrichReceita?: () => Promise<void>`
- `onBulkEnrichApollo?: () => Promise<void>`
- `onBulkEnrich360?: () => Promise<void>`
- `onBulkTotvsCheck?: () => Promise<void>`
- `onBulkDiscoverCNPJ?: () => Promise<void>`
- `onBulkApprove?: () => Promise<void>`
- `onReverifyAllV2?: () => void`
- `onRestoreDiscarded?: () => Promise<void>`

**Ações Disponíveis:**
1. Preview das Selecionadas
2. Exportar CSV
3. Exportar PDF
4. Atualizar Relatórios
5. Re-Verificar Tudo (V2)
6. Processar TOTVS em Lote
7. Descobrir CNPJ (em massa)
8. Receita Federal (em massa)
9. Apollo Decisores (em massa)
10. 360° Completo (em massa)
11. Aprovar e Mover para Pool
12. Deletar Selecionadas

**Onde é usado:** `ICPQuarantine.tsx`

---

## 1.2 QuarantineRowActions.tsx
**Localização:** `src/components/icp/QuarantineRowActions.tsx`  
**Props Principais:**
- `company: any`
- `onApprove: (id: string) => void`
- `onReject: (id: string, motivo: string) => void`
- `onDelete: (id: string) => void`
- `onPreview: (company: any) => void`
- `onRefresh?: (id: string) => void`
- `onEnrichReceita?: (id: string) => Promise<void>`
- `onEnrichApollo?: (id: string) => Promise<void>`
- `onEnrichEconodata?: (id: string) => Promise<void>` ⚠️ **DESABILITADO**
- `onEnrich360?: (id: string) => Promise<void>`
- `onEnrichTotvsCheck?: (id: string) => Promise<void>`
- `onDiscoverCNPJ?: (id: string) => void`
- `onOpenExecutiveReport?: () => void`
- `onEnrichCompleto?: (id: string) => Promise<void>`
- `onRestoreIndividual?: (cnpj: string) => Promise<void>`

**Ações Disponíveis:**
1. Ver Detalhes (Preview)
2. Editar/Salvar Dados
3. Simple TOTVS Check (STC) ⭐ **PRIORITÁRIO**
4. Ver Relatório Completo
5. Atualizar relatório
6. Criar Estratégia
7. **Análise Completa 360°** ⚡ **UNIFICADO** (Receita + Apollo + 360°)
8. Descobrir CNPJ
9. Receita Federal (individual)
10. Apollo Decisores (individual)
11. 360° Completo (individual)
12. Abrir Website
13. Aprovar e Mover para Pool
14. Descartar (Não qualificado)
15. Restaurar para Quarentena (se descartada)
16. Deletar Permanentemente

**Onde é usado:** `ICPQuarantine.tsx`

**Observações:**
- ⚡ **Análise Completa 360°** unifica Receita + Apollo + 360° em 1 clique
- ⚠️ **Econodata** está comentado (desabilitado - fase 2)

---

## 1.3 BulkActionsToolbar.tsx
**Localização:** `src/components/companies/BulkActionsToolbar.tsx`  
**Props Principais:**
- `selectedCount: number`
- `totalCount: number`
- `onSelectAll: () => void`
- `onClearSelection: () => void`
- `onBulkDelete: () => Promise<void>`
- `onBulkEnrichReceita: () => Promise<void>`
- `onBulkEnrich360: () => Promise<void>`
- `onBulkEnrichApollo: () => Promise<void>`
- `onBulkEnrichTotvsCheck?: () => Promise<void>`
- `onBulkDiscoverCNPJ?: () => Promise<void>`
- `onBulkApprove?: () => Promise<void>`
- `onBulkSendToQuarantine?: () => Promise<void>` 🆕 **NOVO**

**Ações Disponíveis:**
1. Selecionar tudo / Limpar seleção
2. **Enriquecer** (dropdown):
   - Descobrir CNPJ
   - Receita Federal
   - Apollo Decisores
   - TOTVS Check
   - 360° Completo
3. Exportar CSV
4. **Ações em Massa** (dropdown):
   - 🎯 Integrar para ICP 🆕
   - Aprovar e Mover para Pool
   - Exportar CSV
   - Excluir em Massa
5. Deletar (botão direto)

**Onde é usado:** `CompaniesManagementPage.tsx`

**Observações:**
- Toolbar visível quando `selectedCount > 0`
- Badge mostra quantidade selecionada

---

## 1.4 HeaderActionsMenu.tsx
**Localização:** `src/components/companies/HeaderActionsMenu.tsx`  
**Props Principais:**
- `onUploadClick: () => void`
- `onBatchEnrichReceita: () => Promise<void>`
- `onBatchEnrich360: () => Promise<void>`
- `onBatchEnrichApollo: () => Promise<void>`
- `onSendToQuarantine?: () => Promise<void>` 🆕 **NOVO**
- `onApolloImport: () => void`
- `onSearchCompanies: () => void`
- `onPartnerSearch?: () => void` ✅ **NOVO: Buscar por Sócios**

**Ações Disponíveis:**

**Grupo 1: Importar & Adicionar**
1. Upload em Massa
2. Importar do Apollo
3. Buscar Empresas
4. ✅ **Buscar por Sócios** 🆕 (Descobrir empresas via proprietários)

**Grupo 2: Enriquecimento em Lote**
1. Receita Federal (Lote) - "Apenas sem dados"
2. Apollo Decisores & Contatos
3. 360° Completo + IA

**Grupo 3: Fluxo ICP** 🆕
1. 🎯 **Integrar para ICP**

**Onde é usado:** `CompaniesManagementPage.tsx`

**Observações:**
- Menu aparece no header da página
- Foco em ações em massa (não selecionadas)

---

## 1.5 CompaniesActionsMenu.tsx
**Localização:** `src/components/companies/CompaniesActionsMenu.tsx`  
**Props Principais:**
- `selectedCount: number`
- `onBulkDelete: () => Promise<void>`
- `onExport: () => void`
- `onBulkEnrichReceita?: () => Promise<void>`
- `onBulkEnrichApollo?: () => Promise<void>`
- `onBulkEnrich360?: () => Promise<void>`
- `onBulkEcoBooster?: () => Promise<void>` ⚠️ **NÃO USADO?**
- `onBulkSendToQuarantine?: () => Promise<void>`

**Ações Disponíveis:**

**Grupo 1: Enriquecimentos**
1. Receita Federal em Lote
2. Apollo em Lote
3. 360° em Lote
4. Eco-Booster em Lote ⚠️ **VERIFICAR SE É USADO**

**Grupo 2: Ações**
1. Exportar Selecionadas
2. Deletar Selecionadas

**Onde é usado:** `CompaniesManagementPage.tsx` (linha 1594)

**Observações:**
- Similar ao `BulkActionsToolbar`, mas como menu dropdown
- ❌ **Eco-Booster NÃO É USADO** - Código morto identificado
  - Em `QuarantineRowActions.tsx` está comentado (desabilitado)
  - Em `CompaniesActionsMenu.tsx` aparece mas `onBulkEcoBooster` **NÃO é passado** em `CompaniesManagementPage.tsx`
  - **AÇÃO:** Remover `onBulkEcoBooster` de `CompaniesActionsMenu.tsx`

---

## 1.6 CompanyRowActions.tsx
**Localização:** `src/components/companies/CompanyRowActions.tsx`  
**Props Principais:**
- `company: any`
- `onDelete: () => void`
- `onEnrichReceita: () => Promise<void>`
- `onEnrich360: () => Promise<void>`
- `onEnrichApollo: () => Promise<void>`
- `onDiscoverCNPJ?: () => void`

**Ações Disponíveis:**
1. Ver Detalhes
2. Relatório Executivo
3. Editar/Salvar Dados
4. Criar Estratégia
5. Descobrir CNPJ (se não tem CNPJ)
6. Receita Federal
7. Apollo Decisores
8. 360° Completo
9. Abrir Website
10. Excluir

**Onde é usado:** `CompaniesManagementPage.tsx`

**Observações:**
- Ações individuais por empresa
- Menu aparece em cada linha da tabela

---

# 🎨 2. BOTÕES DE ENRIQUECIMENTO

## 2.1 ApolloEnrichButton.tsx
**Localização:** `src/components/companies/ApolloEnrichButton.tsx`  
**Funcionalidade:** Enriquece empresa com Apollo.io (CICLO 3 - completo)  
**Props:**
- `companyId: string`
- `companyName: string`
- `companyDomain?: string`
- `cnpj?: string`
- `razaoSocial?: string`
- `hasApolloId: boolean`
- `onSuccess?: () => void`

**O que faz:**
1. Abre `ApolloSearchDialog` para buscar/selecionar organização
2. Se não tem CNPJ, abre `CNPJDiscoveryDialog`
3. Chama `enrich-apollo` edge function (tipo: `ciclo3_enrich_complete`)
4. Enriquece: decisores, campos, empresas similares

**Tempo estimado:** 30-60 segundos  
**Onde é usado:** Verificar com grep (provavelmente CompanyDetailPage)

---

## 2.2 AutoEnrichButton.tsx
**Localização:** `src/components/companies/AutoEnrichButton.tsx`  
**Funcionalidade:** Enriquece automaticamente até 50 empresas que têm Apollo ID mas não foram atualizadas nos últimos 30 dias  
**Props:** Nenhuma (usa hook `useAutoEnrich`)

**O que faz:**
- Enriquece automaticamente empresas antigas com Apollo ID
- Processa até 50 empresas
- Usa hook `useAutoEnrich`

**Tempo estimado:** 2-5 minutos (para 50 empresas)  
**Onde é usado:** Verificar com grep

---

## 2.3 UpdateNowButton.tsx
**Localização:** `src/components/companies/UpdateNowButton.tsx`  
**Funcionalidade:** Atualiza dados da empresa no Apollo.io com filtros inteligentes  
**Props:**
- `companyId: string`
- `companyName: string`
- `companyDomain?: string`
- `apolloOrganizationId?: string`
- `city?: string` 🎯 **FILTRO INTELIGENTE**
- `state?: string` 🎯 **FILTRO INTELIGENTE**
- `cep?: string` 🎯 **FILTRO CEP (98% precisão!)**
- `fantasia?: string` 🎯 **FILTRO NOME FANTASIA**
- `onSuccess?: () => void`

**O que faz:**
1. Se tem `apolloOrganizationId`: faz dry-run para estimar créditos
2. Se não tem: busca organizações no Apollo com filtros inteligentes
3. Usuário seleciona organização
4. Enriquece: company, people, similar
5. Mostra estimativa de créditos antes de executar

**Tempo estimado:** 30-90 segundos  
**Onde é usado:** Provavelmente CompanyDetailPage

**Observações:**
- ✅ Usa filtros inteligentes (cidade, estado, CEP, fantasia)
- ✅ Mostra estimativa de créditos antes de executar
- ✅ Confirmação antes de enriquecer

---

## 2.4 MultiLayerEnrichButton.tsx
**Localização:** `src/components/canvas/MultiLayerEnrichButton.tsx`  
**Funcionalidade:** Enriquecimento em múltiplas camadas (3 layers, não 5)  
**Props:**
- `companyId: string`
- `cnpj?: string`
- `onComplete?: () => void`

**O que faz:**
- **Layer 1 - Base:** EmpresaQui (dados básicos ilimitados)
- **Layer 2 - Enriquecimento:** Apollo.io (decisores) + ReceitaWS (gratuito)
- **Layer 3 - Premium (opcional):** Econodata (50 campos premium/financeiros, limitado a 50/mês)
- Mostra progresso geral e por layer
- Dialog com controle de camadas premium

**Tempo estimado:** 1-3 minutos (depende das camadas selecionadas)  
**Onde é usado:** `CompanyDetailPage.tsx` (Tab "Ações", linha 1881)

**Observações:**
- Arquivo está em `src/components/canvas/` (não em `companies/`)
- Usado na tab "Ações" do Company Detail
- Layer 3 (Econodata) é opcional e limitado

---

## 2.5 Buscas "enrich" em Páginas

### CompanyDetailPage.tsx
**Buscar:** `grep -r "enrich\|Enrich\|Smart Refresh\|Atualizar" src/pages/CompanyDetailPage.tsx`

**Encontrado:**
- `Smart Refresh` / `Atualização Inteligente (360°)` - Linha ~1896
- `MultiLayerEnrichButton` - Linha ~1881
- `handleSmartRefresh` - função de atualização inteligente

**Ações de Enriquecimento:**
1. MultiLayerEnrichButton (5 camadas)
2. Smart Refresh / Atualização Inteligente (360°)
3. Outros botões nas tabs

### ICPQuarantine.tsx
**Múltiplas mutações de enriquecimento:**
- `enrichReceitaMutation` - Enriquecer Receita Federal
- `enrichApolloMutation` - Enriquecer Apollo
- `enrich360Mutation` - Enriquecer 360°
- `enrichTotvsCheckMutation` - TOTVS Check
- `enrichCompletoMutation` - Enriquecimento completo (3 etapas)

---

# 🗺️ 3. ROTAS PRINCIPAIS

## 3.1 Rotas de Empresas

### /companies
**Página:** `CompaniesManagementPage.tsx`  
**Funcionalidade:** Gerenciar empresas (tabela completa com filtros)  
**Características:**
- Tabela com empresas
- Filtros por coluna (tipo Excel)
- Seleção múltipla
- BulkActionsToolbar
- HeaderActionsMenu
- ExpandedCompanyCard
- STC Bot

**Componentes principais:**
- BulkActionsToolbar
- HeaderActionsMenu
- CompanyRowActions
- ExpandedCompanyCard
- STCAgent

---

### /intelligence
**Página:** `IntelligencePage.tsx`  
**Funcionalidade:** Visão geral de inteligência (estatísticas e insights)  
**Características:**
- Cards de estatísticas (Decisores, Sinais, Empresas)
- Lista de decisores recentes
- Lista de sinais de governança
- Não é tabela de empresas, é dashboard de insights

**Diferença de /companies:**
- `/companies` = tabela de empresas para gerenciar
- `/intelligence` = dashboard de insights e estatísticas

---

### /intelligence-360
**Página:** `Intelligence360Page.tsx`  
**Funcionalidade:** Página de apresentação/landing do Intelligence 360°  
**Características:**
- Página de apresentação do recurso
- Cards de features
- Formulário de input de empresa (`EnhancedCompanyInputForm`)
- Lista de fontes de dados
- Não é lista de empresas, é landing page + input

**Diferença de /companies e /intelligence:**
- `/companies` = gerenciar empresas (tabela)
- `/intelligence` = dashboard de insights
- `/intelligence-360` = landing page + input para análise 360°

**⚠️ REDUNDÂNCIA POTENCIAL:** Três rotas diferentes podem confundir usuário

---

## 3.2 Rotas ICP

### /leads/icp-quarantine
**Página:** `ICPQuarantine.tsx`  
**Funcionalidade:** Quarentena ICP - empresas pendentes de análise  
**Componentes:**
- QuarantineActionsMenu (ações em massa)
- QuarantineRowActions (ações individuais)
- ExpandedCompanyCard
- STCAgent

---

### /leads/quarantine
**Página:** `Quarantine.tsx` (alias: `LeadsQuarantine`)  
**Funcionalidade:** Quarentena genérica de leads (não ICP específica)  
**Diferença de `/leads/icp-quarantine`:**
- **Tabela:** `leads_quarantine` (quarentena genérica)
- **Tabela ICP:** `icp_analysis_results` (quarentena ICP)
- **Características:**
  - Filtros: status, source, search
  - Validação de leads genéricos
  - Aprovação/rejeição simples
  - **NÃO tem** análise ICP, TOTVS Check, STC Bot
- **ICPQuarantine:**
  - Tem análise ICP completa
  - TOTVS Check integrado
  - STC Bot
  - ExpandedCompanyCard
  - QuarantineActionsMenu e QuarantineRowActions

**⚠️ CONCLUSÃO:** São quarentenas diferentes para propósitos diferentes. Manter ambas.

**Observações:**
- `/leads/quarantine` = quarentena genérica (leads simples)
- `/leads/icp-quarantine` = quarentena ICP (análise completa)

---

### /central-icp
**Página:** `CentralICP/Home.tsx`  
**Funcionalidade:** Home da Central ICP  
**⚠️ VERIFICAR:** Conteúdo e diferença de `/leads/icp-quarantine`

---

### /central-icp/individual
**Página:** `CentralICP/IndividualAnalysis.tsx`  
**Funcionalidade:** Análise ICP individual

---

### /central-icp/batch
**Página:** `CentralICP/BatchAnalysis.tsx`  
**Funcionalidade:** Análise ICP em massa

---

### /central-icp/batch-analysis
**Página:** `CentralICP/BatchAnalysis.tsx` ⚠️ **DUPLICATA!**  
**⚠️ PROBLEMA:** Duas rotas apontando para mesma página!

---

## 3.3 Rotas SDR

### /sdr/workspace
**Página:** `SDRWorkspacePage.tsx`  
**Tabs internas (11 tabs):**
1. Executive
2. Pipeline (Kanban)
3. Health
4. Analytics
5. Forecast
6. Funil AI
7. Predição
8. Automações
9. **Inbox** ⚠️
10. **Smart Tasks** ⚠️
11. **Email Sequences** ⚠️

**⚠️ DUPLICATAS:**
- Tab "Inbox" vs `/sdr/inbox` (SDRInboxPage.tsx)
- Tab "Smart Tasks" vs `/sdr/tasks` (SmartTasksPage.tsx)
- Tab "Email Sequences" vs `/sdr/sequences` (SDRSequencesPage.tsx)

---

### /sdr/inbox
**Página:** `SDRInboxPage.tsx`  
**⚠️ DUPLICATA:** Tab "Inbox" no workspace

---

### /sdr/tasks
**Página:** `SmartTasksPage.tsx`  
**⚠️ DUPLICATA:** Tab "Smart Tasks" no workspace

---

### /sdr/sequences
**Página:** `SDRSequencesPage.tsx`  
**⚠️ DUPLICATA:** Tab "Email Sequences" no workspace

---

### /sdr/analytics
**Página:** `SDRAnalyticsPage.tsx`  
**⚠️ DUPLICATA:** Tab "Analytics" no workspace

---

# 📑 4. TABS DE COMPANY DETAIL PAGE

**Rota:** `/company/:id`  
**Página:** `CompanyDetailPage.tsx`

**Tabs identificadas (7 tabs):**

1. **Overview** (Visão Geral)
   - Dados cadastrais
   - Localização
   - Tecnologias
   - Score de maturidade
   - Insights

2. **Inteligencia**
   - Hub analítico
   - Empresa + decisores + similares + insights IA
   - ApolloDataSection
   - ApolloDecisorsCard

3. **Decisores**
   - Decisores e contatos
   - DecisionMakerSearchDialog
   - DecisionMakersTab

4. **Financeiro**
   - Capital social, faturamento
   - Dívidas
   - Integração Serasa

5. **RADAR** (Apollo360)
   - ⚠️ **NOME ABREVIADO** - usuário pode não entender
   - People, Similares, Technologies, Insights, Trends, Visitors, News, Vagas
   - CompanyEnrichmentTabs (sub-tabs)

6. **Créditos**
   - ⚠️ **NÃO É SOBRE A EMPRESA!** - é sobre o sistema
   - Uso de créditos Apollo.io
   - CreditsDashboard
   - CreditUsageHistory

7. **Ações**
   - Workspace de prospecção
   - MultiLayerEnrichButton
   - Smart Refresh
   - Outros botões de enriquecimento

**⚠️ PROBLEMAS IDENTIFICADOS:**
- Tab "Créditos" não é sobre a empresa - deveria estar em Settings
- Tab "RADAR" - nome abreviado, confuso
- Tab "Ações" - muitos botões, pode ser simplificada

---

# 📊 5. RESUMO DE PROBLEMAS IDENTIFICADOS

## 5.1 Redundâncias de Componentes

### QuarantineActionsMenu vs BulkActionsToolbar
- **Similaridade:** Ambos fazem ações em massa
- **Diferença:** Um é dropdown menu, outro é toolbar
- **Contexto:** Um é para quarentena, outro para empresas aprovadas
- **Ação:** ✅ Manter ambos (contextos diferentes)

### QuarantineRowActions vs CompanyRowActions
- **Similaridade:** Ambos fazem ações individuais por empresa
- **Diferença:** Um é para quarentena, outro para empresas aprovadas
- **Ação:** ✅ Manter ambos (contextos diferentes)

---

## 5.2 Botões de Enriquecimento Espalhados

**Botões encontrados:**
1. Smart Refresh / Atualização Inteligente (360°)
2. Auto-Enrich
3. ApolloEnrichButton
4. UpdateNowButton
5. MultiLayerEnrichButton (referências)
6. Receita Federal (individual e batch)
7. Apollo (individual e batch)
8. 360° Completo (individual e batch)
9. Análise Completa 360° (unificado em QuarantineRowActions)

**⚠️ PROBLEMA:** Múltiplos botões fazendo coisas similares em locais diferentes

**💡 SOLUÇÃO PROPOSTA:** Unificar em dropdown inteligente

---

## 5.3 Rotas Redundantes

### Empresas:
- `/companies` vs `/intelligence` vs `/intelligence-360`
  - **Problema:** 3 rotas diferentes podem confundir
  - **Solução:** Consolidar ou deixar claro a diferença

### ICP:
- `/central-icp/batch` vs `/central-icp/batch-analysis`
  - **Problema:** Duas rotas apontando para mesma página
  - **Solução:** Remover duplicata

- `/leads/quarantine` vs `/leads/icp-quarantine`
  - **Problema:** Duas quarentenas diferentes?
  - **Solução:** Verificar diferença e consolidar se necessário

### SDR:
- Tabs no `/sdr/workspace` vs páginas separadas
  - **Problema:** Conteúdo duplicado
  - **Solução:** Escolher um ou outro (tabs OU páginas separadas)

---

## 5.4 Company Detail - Muitas Tabs

**7 tabs identificadas:**
- Overview ✅
- Inteligencia ⚠️ (nome confuso)
- Decisores ✅
- Financeiro ✅
- RADAR ⚠️ (nome abreviado)
- Créditos ❌ (não é sobre a empresa)
- Ações ⚠️ (pode ser simplificada)

**💡 SOLUÇÃO PROPOSTA:** Reduzir para 3-4 tabs claras

---

# ✅ PRÓXIMOS PASSOS

1. ✅ Verificar uso de `MultiLayerEnrichButton` - ✅ Encontrado em `CompanyDetailPage.tsx`
2. ✅ Verificar diferença real entre `/leads/quarantine` e `/leads/icp-quarantine` - ✅ São diferentes (genérica vs ICP)
3. ⚠️ Verificar se Eco-Booster é usado - ⚠️ Código existe mas pode estar desabilitado (verificar CompaniesManagementPage)
4. ✅ Verificar conteúdo das tabs SDR Workspace vs páginas separadas - ✅ Duplicatas identificadas
5. ⏭️ **Etapa 1.2:** Mapear todas as ações disponíveis com detalhes (próximo passo)

---

# 📊 RESUMO FINAL ETAPA 1.1

## ✅ COMPLETO:
- ✅ 6 componentes de Menu/Actions mapeados
- ✅ 4-5 botões de enriquecimento mapeados
- ✅ 3 rotas de empresas mapeadas e diferenças identificadas
- ✅ Rotas ICP mapeadas (duplicata identificada)
- ✅ Rotas SDR mapeadas (duplicatas identificadas)
- ✅ 7 tabs de Company Detail mapeadas
- ✅ Duas quarentenas diferentes identificadas e diferenciadas

## ⚠️ CÓDIGO MORTO IDENTIFICADO:
- ❌ **Eco-Booster** - Não é usado, remover de `CompaniesActionsMenu.tsx`

---

**🎯 Etapa 1.1: ✅ COMPLETA!**

**Próximo:** Etapa 1.2 - Mapear todas as ações disponíveis com detalhes completos (props, callbacks, onde é usado)

