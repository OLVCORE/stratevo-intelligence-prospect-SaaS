# 📋 PLANO COMPLETO MC1 → MC4
## Unificação ICP + CRM + SDR com Inteligência Mercadológica

**Data:** 2025-01-22  
**Status:** 📝 **AGUARDANDO APROVAÇÃO**

---

## 🎯 OBJETIVO MACRO

Consolidar e unificar:
- **ICP Engine** (motor de qualificação)
- **Biblioteca de ICPs do tenant** (15+ ICPs possíveis)
- **Camada de Inteligência Mercadológica** (BCG, produtos, competitiva, SWOT, plano)
- **CRM Hub**
- **SDR Workspace**
- **Motor de qualificação e quarentena**
- **Sidebar com fluxo completo**
- **Distribuição estatística de ICP**
- **Seleção de ICP(s) antes do upload**

Garantindo:
- **0% regressão**
- **0% destruição**
- **0% duplicação**
- **100% integração visual e funcional**

---

## 🧠 PRINCÍPIO FUNDAMENTAL

### O Sistema Trabalha com BIBLIOTECA de ICPs

**NÃO há apenas 1 ICP.** O sistema trabalha com **biblioteca de ICPs por tenant**, podendo ter **15+ ICPs**.

Cada tenant pode possuir:
- **1 ICP principal** (default → `icp_principal` / `ativo`)
- **vários outros ICPs adicionais**, modelados pelo próprio tenant ao longo do tempo

`icp_profiles_metadata` representa:
- **biblioteca completa de ICPs**
- **não apenas um único ICP**

### ICP = Motor Completo de Inteligência Mercadológica

O ICP não é apenas um cadastro simples. É um **motor completo de inteligência de mercado** com:

- **Critérios** (macroeconômico, setores, CNAEs, estatística, competitiva, tendências, projeções, comércio exterior)
- **Análise 360°**
- **Análise Competitiva** (BCG, perfil financeiro, mapa geográfico, diferenciais, concorrentes, SWOT/SACT)
- **Métricas de Produtos** (254 produtos, 19 categorias, tabela comparativa, diferenciais, alta concorrência, oportunidades, mapa de calor)
- **Plano Estratégico** (curto, médio, longo prazo)
- **Análise CEO** (recomendações estratégicas de IA)

**Tudo isso faz parte INTEGRANTE do modelo de ICP** e deve ser tratado como **fonte oficial de inteligência**.

---

## 🔍 ICP REAL (Origem e Composição)

### Fonte da Verdade = Onboarding + icp_profiles_metadata

**1. Dados do onboarding do tenant:**
- Configuração inicial (step1)
- Setores e nichos (step2)
- Perfil cliente ideal (step3)
- Situação atual (step4)
- Histórico e enriquecimento (step5)

**2. Dados persistidos:**
- Tabela: `public.icp_profiles_metadata`
- Campos: `tenant_id`, `ativo`, `icp_principal`, `metadata` (JSONB)
- Inteligência mercadológica já calculada e salva

**3. Regra da verdade:**
> Fonte da verdade = onboarding + `icp_profiles_metadata` + módulos de inteligência já existentes

**Você não pode criar novos modelos, schemas ou tabelas paralelas.**

---

## 🏛️ VISÃO FINAL (Como Deve Ser)

### A) Visualização do ICP Real

**Rota:** `/central-icp/profile-active`

**O que exibir:**
- **ICP principal consolidado** (dados básicos + inteligência mercadológica)
- **Resumo executivo** com:
  - Dados cadastrais
  - Persona
  - Dores
  - Objeções
  - Stack tech
  - Maturidade digital
- **Principais insights de análise competitiva:**
  - Top 3 concorrentes
  - Principais diferenciais
  - Oportunidades identificadas
- **Principais destaques da matriz BCG:**
  - Nichos prioritários
  - Clientes desejados
- **Principais produtos e oportunidades:**
  - Diferenciais principais
  - Oportunidades de expansão
  - Alta concorrência

**Fonte de dados:**
- Consumir dados já calculados (não recalcular)
- Ler de `icp_profiles_metadata.metadata`
- Ler de componentes existentes (`BCGMatrix`, `CompetitiveAnalysis`, `ProductComparisonMatrix`)

---

### B) Biblioteca de ICPs

**Rota:** `/central-icp/library` (NOVA)

**O que exibir:**
- Listar **todos os ICPs** do tenant
- Destaque visual para o **ICP principal**
- UI para **abrir ICPs adicionais**
- Cards com resumo de cada ICP:
  - Nome
  - Setor/Nicho
  - Status (ativo/inativo)
  - Data de criação
  - Última atualização

**Ações:**
- Visualizar ICP completo
- Ativar/desativar ICP
- Definir como principal
- (Futuro: CRUD completo)

**Nada de CRUD agora — apenas leitura e ativação.**

---

### C) Seleção de ICP(s) Antes do Upload

**Fluxo:**
1. Usuário inicia upload de planilha
2. Sistema abre modal: "Qual ICP você quer usar?"
3. Opções:
   - **ICP Principal** (padrão, destacado)
   - **ICP Adicional 1**
   - **ICP Adicional 2**
   - ...
   - **Múltiplos ICPs** (checkbox para selecionar vários)
4. Após seleção → Upload prossegue
5. Motor de qualificação recebe `[array de ICPs]`

**Motor de qualificação:**
- Recebe: `[array de ICPs]`
- Retorna: score da empresa para **cada ICP**
- Identifica: ICP dominante (melhor match)
- Identifica: empresas compatíveis com múltiplos ICPs

**Sem alterar:**
- Engine base
- Quarentena
- Pipeline
- Estoque existente

---

### D) Motor de Qualificação (Atualizado)

**Entrada:**
- `companies: CompanyToQualify[]`
- `icpIds: string[]` (array de ICPs selecionados)

**Processamento:**
- Para cada empresa:
  - Calcular match com **cada ICP** selecionado
  - Retornar scores individuais
  - Identificar melhor match
  - Identificar compatibilidade cruzada (A+B)

**Saída:**
- `QualificationResult` com:
  - `icp_scores: Array<{ icp_id, icp_name, score, breakdown }>`
  - `best_icp_match: { id, name, score }`
  - `cross_icp_compatibility: boolean` (match em múltiplos ICPs)

**Sem alterar:**
- Lógica base de cálculo
- Regras de quarentena
- Aprovação/descarte

---

### E) Distribuição Estatística

**Rota:** `/central-icp/analysis-results` (NOVA)

**O que exibir:**

**1. Visão Geral:**
- Total de empresas analisadas
- Total ICP match (qualquer ICP)
- Distribuição por ICP individual
- Compatibilidade cruzada (A+B)

**2. Distribuição por Score:**
- Ideal ICP (90-100)
- Strong ICP (75-89)
- Good ICP (60-74)
- Weak ICP (25-59)
- No ICP (0-24)

**3. Distribuição por ICP:**
- Empresas no core do ICP (critérios principais)
- Empresas em oportunidades de expansão (produtos não cobertos)
- Empresas em alta concorrência (categorias competitivas)
- Empresas totalmente fora (lixo)

**4. Insights:**
- Heatmaps por categoria de produto
- Mapas de distribuição geográfica
- Análise de compatibilidade cruzada
- Recomendações baseadas em dados já calculados

**Fonte de dados:**
- Usar dados já calculados pela camada de inteligência
- Não recalcular produtos, categorias, mapas, benchmarks
- Consumir resultados de `icp_analysis_results`

---

## 🚀 METODOLOGIA DE EXECUÇÃO → MICRO CICLOS

### MC1 — ICP VISÍVEL (Com Inteligência Mercadológica)

**🎯 OBJETIVO:**
Criar painel "ICP – Perfil Ideal" que:
- Leia o ICP principal já criado
- Exiba dados básicos + inteligência mercadológica consolidada
- Mostre resumo executivo dos módulos complexos
- Crie biblioteca de ICPs (leitura)

**📋 PASSOS DETALHADOS:**

**1. Criar Hook para Buscar ICP Ativo**
- Arquivo: `src/hooks/useActiveICP.ts` (NOVO)
- Buscar por `ativo = true` → `icp_principal = true` → mais recente
- Retornar ICP completo com metadata

**2. Criar Hook para Buscar Biblioteca de ICPs**
- Arquivo: `src/hooks/useICPLibrary.ts` (NOVO)
- Buscar todos ICPs do tenant
- Ordenar por: principal primeiro, depois por data

**3. Criar Página ICP Ativo**
- Arquivo: `src/pages/CentralICP/ActiveICPProfile.tsx` (NOVO)
- Rota: `/central-icp/profile-active`
- Exibir:
  - Dados básicos (nome, setor, nicho)
  - Resumo executivo (persona, dores, objeções)
  - Principais insights competitivos (top 3 concorrentes, diferenciais)
  - Principais destaques BCG (nichos prioritários)
  - Principais produtos (diferenciais, oportunidades)
  - Link para ver completo (`/central-icp/profile/:id`)

**4. Criar Página Biblioteca de ICPs**
- Arquivo: `src/pages/CentralICP/ICPLibrary.tsx` (NOVO)
- Rota: `/central-icp/library`
- Exibir:
  - Grid de cards (um por ICP)
  - Destaque visual para principal
  - Ações: visualizar, ativar, definir como principal

**5. Criar Componentes de Resumo**
- `src/components/icp/ICPExecutiveSummary.tsx` (NOVO)
- `src/components/icp/ICPCompetitiveInsights.tsx` (NOVO)
- `src/components/icp/ICPBCGHighlights.tsx` (NOVO)
- `src/components/icp/ICPProductHighlights.tsx` (NOVO)

**6. Adicionar Rotas**
- `App.tsx`: `/central-icp/profile-active` e `/central-icp/library`

**7. Adicionar na Sidebar**
- Grupo "Configuração ICP"
- Item "ICP Ativo" → `/central-icp/profile-active`
- Item "Biblioteca de ICPs" → `/central-icp/library`

**⚠️ REGRAS:**
- ✅ Apenas leitura (não criar/editar)
- ✅ Consumir dados já calculados
- ✅ Não recalcular análises
- ✅ Não alterar componentes existentes
- ✅ Não alterar motor de qualificação

**⏱️ ESTIMATIVA:** 7 passos, 1 commit isolado

**✅ TESTE:**
- Verificar se ICP ativo é exibido
- Verificar se biblioteca lista todos ICPs
- Verificar se resumos são exibidos corretamente
- Verificar se links para detalhes funcionam

---

### MC2 — Seleção ICP(s) Antes do Upload

**🎯 OBJETIVO:**
Permitir seleção de 1 ou mais ICPs antes do upload de planilha.

**📋 PASSOS DETALHADOS:**

**1. Criar Componente de Seleção**
- Arquivo: `src/components/icp/ICPSelectionDialog.tsx` (NOVO)
- Modal com:
  - Lista de ICPs disponíveis
  - Checkbox para múltipla seleção
  - Destaque para ICP principal
  - Preview de cada ICP (resumo)

**2. Modificar BulkUploadDialog**
- Arquivo: `src/components/companies/BulkUploadDialog.tsx` (MODIFICAR)
- Antes de permitir upload:
  - Verificar se há ICPs cadastrados
  - Se não houver → Redirecionar para criar ICP
  - Se houver → Abrir `ICPSelectionDialog`
  - Aguardar seleção
  - Salvar seleção em state/context

**3. Criar Context para ICP Selecionado**
- Arquivo: `src/contexts/ICPSelectionContext.tsx` (NOVO)
- Armazenar: `selectedICPIds: string[]`
- Provider global

**4. Modificar Motor de Qualificação**
- Arquivo: `src/services/icpQualificationEngine.ts` (MODIFICAR MÍNIMO)
- Aceitar: `icpIds?: string[]` (opcional, fallback para todos)
- Filtrar ICPs carregados por `icpIds`
- Retornar scores para cada ICP

**5. Atualizar Resultados**
- Incluir `icp_scores` no resultado
- Identificar melhor match
- Identificar compatibilidade cruzada

**⚠️ REGRAS:**
- ✅ Não alterar lógica base de cálculo
- ✅ Não alterar regras de quarentena
- ✅ Apenas filtrar ICPs por seleção
- ✅ Manter compatibilidade com uso atual (sem seleção)

**⏱️ ESTIMATIVA:** 5 passos, 1 commit isolado

**✅ TESTE:**
- Verificar se modal aparece antes do upload
- Verificar se múltipla seleção funciona
- Verificar se motor usa ICPs selecionados
- Verificar se resultados incluem scores por ICP

---

### MC3 — Distribuição Estatística

**🎯 OBJETIVO:**
Exibir painel de resultados após análise, usando dados já calculados pela camada de inteligência.

**📋 PASSOS DETALHADOS:**

**1. Criar Página de Resultados**
- Arquivo: `src/pages/CentralICP/AnalysisResults.tsx` (NOVO)
- Rota: `/central-icp/analysis-results?batch_id=XXX`

**2. Buscar Resultados**
- Query: `icp_analysis_results` filtrado por `batch_id`
- Agrupar por:
  - Score ranges (Ideal, Strong, Good, Weak, No ICP)
  - ICP individual
  - Compatibilidade cruzada

**3. Criar Componentes de Visualização**
- `src/components/icp/AnalysisDistributionChart.tsx` (NOVO)
- `src/components/icp/ICPHeatmap.tsx` (NOVO)
- `src/components/icp/CrossICPCompatibility.tsx` (NOVO)
- `src/components/icp/AnalysisInsights.tsx` (NOVO)

**4. Integrar com Inteligência Mercadológica**
- Consumir dados de produtos já calculados
- Consumir dados de BCG já calculados
- Consumir dados competitivos já calculados
- Exibir:
  - Empresas no core (critérios principais)
  - Empresas em oportunidades (produtos não cobertos)
  - Empresas em alta concorrência
  - Empresas fora (lixo)

**5. Adicionar Rota e Sidebar**
- Rota: `/central-icp/analysis-results`
- Sidebar: "Resultados da Análise"

**⚠️ REGRAS:**
- ✅ Não recalcular análises
- ✅ Consumir dados já calculados
- ✅ Não alterar componentes de inteligência existentes

**⏱️ ESTIMATIVA:** 5 passos, 1 commit isolado

**✅ TESTE:**
- Verificar se distribuição é exibida corretamente
- Verificar se heatmaps funcionam
- Verificar se insights são relevantes

---

### MC4 — Sidebar Unificado

**🎯 OBJETIVO:**
Mostrar conexão visual ICP → CRM → SDR com fluxo completo.

**📋 PASSOS DETALHADOS:**

**1. Reorganizar Sidebar**
- Arquivo: `src/components/layout/AppSidebar.tsx` (MODIFICAR)
- Criar grupo "Fluxo de Qualificação":
  - 1. ICP Ativo / Biblioteca
  - 2. Upload e Análise
  - 3. Resultados da Análise
  - 4. Quarentena ICP
  - 5. Leads Aprovados
  - 6. Pipeline CRM
  - 7. SDR Workspace

**2. Adicionar Indicadores Visuais**
- Setas conectando etapas
- Badges com contadores
- Status de cada etapa

**3. Adicionar Breadcrumbs**
- Nas páginas principais
- Mostrar origem ICP

**4. Conectar Visualmente**
- ICP → Upload → Análise → Resultados → Quarentena → Aprovados → CRM → SDR

**⚠️ REGRAS:**
- ✅ Não alterar rotas existentes
- ✅ Não alterar componentes existentes
- ✅ Apenas reorganizar visualmente

**⏱️ ESTIMATIVA:** 4 passos, 1 commit isolado

**✅ TESTE:**
- Verificar se fluxo está claro
- Verificar se todas rotas funcionam
- Verificar se contadores são exibidos

---

## 🛡️ REGRAS DE BLINDAGEM (OBRIGATÓRIO)

### ❌ NÃO ALTERAR:

1. **ICP Engine base** (`icpQualificationEngine.ts`)
   - Lógica de cálculo
   - Regras de quarentena
   - Aprovação/descarte

2. **Módulos de Inteligência Mercadológica:**
   - `BCGMatrix.tsx`
   - `CompetitiveAnalysis.tsx`
   - `ProductComparisonMatrix.tsx`
   - `StrategicActionPlan.tsx`
   - `ICPAnalysisCriteriaConfig.tsx`

3. **Integrações existentes:**
   - APIs Receita Federal
   - Web Scraping
   - OpenAI GPT-4o-mini
   - Geocodificação

4. **Quarentena, Pipeline, SDR, CRM:**
   - Fluxos existentes
   - Estruturas de dados
   - Lógicas de negócio

5. **Estrutura base:**
   - `TenantContext`
   - `Auth`
   - `QueryClient`
   - Rotas existentes

### ✅ PODE FAZER:

1. **Criar novos componentes** de visualização
2. **Criar novos hooks** para buscar dados
3. **Criar novas rotas** para exibição
4. **Consumir dados** já calculados
5. **Orquestrar módulos** existentes
6. **Adicionar indicadores visuais**
7. **Reorganizar sidebar** (sem quebrar rotas)

---

## 📄 ENTREGAS OBRIGATÓRIAS

### Antes de Executar Qualquer Código:

1. ✅ **RELATORIO_ARQUITETURAL_COMPLETO.md** (ATUALIZADO)
   - Mapeamento completo
   - Camada de inteligência mercadológica documentada
   - Gaps identificados

2. ✅ **PLANO_MC1_MC4_COMPLETO.md** (ESTE DOCUMENTO)
   - Descrição detalhada de cada MC
   - Fontes de dados identificadas
   - Passos sequenciais
   - Regras de blindagem

3. ✅ **MAPEAMENTO_ICP_EXISTENTE.md** (JÁ CRIADO)
   - Fluxo de onboarding
   - Tabelas e estruturas
   - Como identificar ICP ativo

4. ✅ **RELATORIO_MC0_BACKUP.md** (JÁ CRIADO)
   - Checkpoint Git realizado
   - Tag criada

---

## 🏁 APÓS APROVAÇÃO

Somente após aprovação explícita:

1. **Executar MC1**
   - Commit isolado
   - Tag de checkpoint
   - Teste visual
   - Screenshot
   - Aguardar autorização para MC2

2. **Executar MC2** (após aprovação MC1)
   - Commit isolado
   - Tag de checkpoint
   - Teste funcional
   - Aguardar autorização para MC3

3. **Executar MC3** (após aprovação MC2)
   - Commit isolado
   - Tag de checkpoint
   - Teste visual
   - Aguardar autorização para MC4

4. **Executar MC4** (após aprovação MC3)
   - Commit isolado
   - Tag de checkpoint
   - Teste completo
   - Finalização

---

## ✅ SEU PRIMEIRO PASSO AGORA

**Você já entregou:**
- ✅ Relatório arquitetural completo (ATUALIZADO com inteligência mercadológica)
- ✅ Plano MC1-MC4 completo (ESTE DOCUMENTO)
- ✅ Mapeamento ICP existente
- ✅ Relatório MC0 (backup realizado)

**Aguardando:**
- ⏸️ **APROVAÇÃO EXPLÍCITA** do plano completo
- ⏸️ **AUTORIZAÇÃO** para executar MC1

---

**Status:** 📝 **PLANO COMPLETO - AGUARDANDO APROVAÇÃO**

**Próxima Ação:** Aguardar aprovação antes de executar qualquer código.

