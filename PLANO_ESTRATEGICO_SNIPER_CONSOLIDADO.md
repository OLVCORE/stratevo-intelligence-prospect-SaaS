# 🎯 PLANO ESTRATÉGICO SNIPER - CONSOLIDADO
## Transformando a Ferramenta em um "Sniper" de Qualificação

**Data de Criação Original:** 2025-01-22  
**Última Atualização:** 2025-02-20  
**Status Atual:** ✅ **VERSÃO ESTABILIZADA - PRONTA PARA RETOMAR**

---

## 📋 RESUMO EXECUTIVO

Este documento consolida o **plano estratégico completo** para transformar a plataforma STRATEVO One em uma ferramenta de qualificação de empresas **ultra-assertiva**, funcionando como um "sniper" que identifica empresas com **fit perfeito** baseado no ICP (Ideal Customer Profile) do tenant.

### 🎯 Objetivo Principal

Criar um sistema que:
1. **Lê arquivos com CNPJs em massa**
2. **Calcula fit score** baseado em todos os dados do ICP (6 stages + análise 360°)
3. **Classifica empresas** por grau de aderência (A+, A, B, C, D)
4. **Identifica padrões** de clientes base e benchmarking
5. **Exclui automaticamente** empresas de concorrentes
6. **Gera recomendações** consultivas baseadas em fit real

---

## 🗺️ MAPA DE MICRO-CICLOS (MCs)

### ✅ **MCs COMPLETADOS (MC1 → MC9)**

#### **MC1 - ICP VISÍVEL**
- ✅ Criar painel "ICP – Perfil Ideal"
- ✅ Exibir dados básicos + inteligência mercadológica consolidada
- ✅ Mostrar resumo executivo dos módulos complexos
- ✅ Criar biblioteca de ICPs (leitura)

**Status:** ✅ Concluído

---

#### **MC2 - SELEÇÃO ICP(s) ANTES DO UPLOAD**
- ✅ Permitir seleção de 1 ou mais ICPs antes do upload de planilha
- ✅ Modal de seleção com múltipla escolha
- ✅ Motor de qualificação recebe array de ICPs
- ✅ Retorna scores para cada ICP selecionado

**Status:** ✅ Concluído

---

#### **MC3 - DISTRIBUIÇÃO ESTATÍSTICA**
- ✅ Exibir painel de resultados após análise
- ✅ Usar dados já calculados pela camada de inteligência
- ✅ Distribuição por score (Ideal, Strong, Good, Weak, No ICP)
- ✅ Heatmaps por categoria de produto
- ✅ Análise de compatibilidade cruzada

**Status:** ✅ Concluído

---

#### **MC4 - MATCH & FIT ENGINE**
- ✅ Criar engine de matching entre lead + ICP + portfólio
- ✅ Calcular scores de aderência (0-100)
- ✅ Gerar recomendações consultivas
- ✅ Breakdown detalhado por critério (setor, CNAE, porte, região)
- ✅ Classificação por grade (A+, A, B, C, D)

**Status:** ✅ Concluído  
**Arquivos:**
- `src/services/matchFitEngine.ts`
- `RELATORIO_MC4_MATCH_FIT_IMPLEMENTACAO.md`

---

#### **MC5 - SIDEBAR UNIFICADO**
- ✅ Reorganizar sidebar com fluxo completo
- ✅ Conectar visualmente ICP → Upload → Análise → Resultados → Quarentena → CRM → SDR
- ✅ Adicionar indicadores visuais e badges com contadores

**Status:** ✅ Concluído

---

#### **MC6 - INTEGRAÇÃO MATCH & FIT NO RELATÓRIO ICP**
- ✅ Integrar Match & Fit no relatório de ICP
- ✅ Gerar visão resumida de compatibilidade entre ICP e portfólio
- ✅ Campo opcional `icpMatchFitOverview` no relatório
- ✅ Score global de aderência (0-100)

**Status:** ✅ Concluído  
**Arquivos:**
- `supabase/functions/generate-icp-report/index.ts` (modificado)
- `docs/RELATORIO_MC6_INTEGRAÇÃO_ICP_MATCH_FIT.md`

---

#### **MC7 - TESTES END-TO-END**
- ✅ Validação completa do fluxo
- ✅ Testes de integração
- ✅ Validação de dados

**Status:** ✅ Concluído

---

#### **MC8 - AVALIAÇÃO DE FIT POR EMPRESA**
- ✅ MC8 V1: Avaliação básica de fit
- ✅ MC8 V2: Avaliação com features numéricas
- ✅ Badge MC8 na quarentena ICP
- ✅ Integração com relatórios ICP

**Status:** ✅ Concluído  
**Arquivos:**
- `src/services/icpMatchAssessment.service.ts`
- `src/components/icp/MC8Badge.tsx`
- `src/pages/Leads/ICPQuarantine.tsx` (modificado)

---

#### **MC9 - SELF-PROSPECTING & HUNTER PLANNER**
- ✅ MC9 V1: Avaliação se vale perseguir o ICP (carteira inteira)
- ✅ MC9 V2.0: Hunter Planner (planeja expansão de mercado)
- ✅ MC9 V2.4: Universal Report Fix
- ✅ Geração de clusters, queries e templates de planilha

**Status:** ✅ Concluído  
**Arquivos:**
- `supabase/functions/generate-icp-report/index.ts` (MC9 V1)
- `supabase/functions/mc9-hunter-planner/index.ts` (MC9 V2.0)
- `src/services/icpHunterPlanner.service.ts`
- `docs/MC9_V2_IMPLEMENTACAO.md`

---

### ⏸️ **MCs PLANEJADOS (MC10 → MC18)**

#### **MC10 - PROCESSAMENTO EM MASSA DE CNPJs**
**Objetivo:** Criar sistema robusto para processar arquivos CSV com milhares de CNPJs

**Funcionalidades:**
- Upload de arquivo CSV com coluna de CNPJs
- Validação e normalização de CNPJs
- Enriquecimento via Receita Federal (em massa)
- Cálculo de fit score para cada CNPJ
- Classificação automática por grade
- Exportação de resultados

**Arquivos a Criar/Modificar:**
- `src/components/companies/BulkCNPJUpload.tsx` (NOVO)
- `supabase/functions/qualify-prospects-bulk/index.ts` (JÁ EXISTE - melhorar)
- `src/services/bulkQualification.service.ts` (NOVO)

**Status:** ⏸️ Planejado

---

#### **MC11 - MATCHING 380° COM TODOS OS DADOS DO ICP**
**Objetivo:** Usar TODOS os dados dos 6 stages do onboarding + análise 360° para matching ultra-preciso

**Funcionalidades:**
- Extrair critérios de matching do `onboarding_sessions`
- Criar tabela `icp_matching_criteria` com arrays de CNAEs, setores, nichos
- Verificar CNAE principal E secundário
- Considerar padrões de clientes base
- Considerar empresas de benchmarking
- Excluir CNAEs de concorrentes
- Armazenar qual CNAE/setor fez match

**Arquivos a Criar/Modificar:**
- `supabase/migrations/XXXX_create_icp_matching_criteria.sql` (NOVO)
- `supabase/migrations/XXXX_extract_icp_matching_criteria_function.sql` (NOVO)
- `supabase/migrations/XXXX_process_qualification_job_v2.sql` (NOVO)
- `SOLUCAO_PODEROSA_MATCHING_ICP_COMPLETO.md` (JÁ EXISTE - implementar)

**Status:** ⏸️ Planejado (documentação completa já existe)

---

#### **MC12 - SISTEMA DE SCORING AVANÇADO**
**Objetivo:** Refinar sistema de scoring com pesos dinâmicos e machine learning

**Funcionalidades:**
- Pesos configuráveis por critério (CNAE: 40%, Setor: 30%, etc.)
- Aprendizado com feedback do usuário
- Ajuste automático de thresholds por tenant
- Histórico de evolução de scores

**Status:** ⏸️ Planejado

---

#### **MC13 - ANÁLISE PREDITIVA**
**Objetivo:** Prever probabilidade de conversão baseado em histórico

**Funcionalidades:**
- Análise de padrões de empresas convertidas
- Identificação de sinais de interesse
- Scoring preditivo de conversão
- Recomendações de abordagem

**Status:** ⏸️ Planejado

---

#### **MC14 - INTEGRAÇÃO COM FONTES EXTERNAS**
**Objetivo:** Enriquecer dados com múltiplas fontes

**Funcionalidades:**
- Integração com LinkedIn Sales Navigator
- Integração com Apollo.io
- Integração com Google Search
- Integração com Job Boards
- Agregação de dados de múltiplas fontes

**Status:** ⏸️ Planejado

---

#### **MC15 - DASHBOARD DE INTELIGÊNCIA**
**Objetivo:** Criar dashboard executivo com insights acionáveis

**Funcionalidades:**
- Visão geral de fit scores (distribuição)
- Top empresas por fit
- Análise de tendências
- Recomendações estratégicas
- Exportação de relatórios

**Status:** ⏸️ Planejado

---

#### **MC16 - AUTOMAÇÃO DE WORKFLOWS**
**Objetivo:** Automatizar ações baseadas em fit score

**Funcionalidades:**
- Regras de automação (ex: se fit >= 90, adicionar ao pipeline)
- Notificações automáticas
- Sequências de email automáticas
- Integração com CRM

**Status:** ⏸️ Planejado

---

#### **MC17 - ANÁLISE COMPETITIVA AVANÇADA**
**Objetivo:** Identificar empresas que usam concorrentes

**Funcionalidades:**
- Detecção de uso de tecnologias concorrentes
- Análise de stack tecnológico
- Identificação de oportunidades de migração
- Scoring de "propensão a trocar"

**Status:** ⏸️ Planejado

---

#### **MC18 - RELATÓRIO FINAL E CHECKUP**
**Objetivo:** Consolidar todas as melhorias e validar sistema completo

**Funcionalidades:**
- Auditoria completa do sistema
- Validação de todos os MCs
- Documentação final
- Plano de manutenção

**Status:** ⏸️ Planejado

---

## 🧠 METODOLOGIA DE MATCHING "SNIPER"

### **Princípio Fundamental**

O sistema usa **TODOS os dados dos 6 stages do onboarding** + **análise 360° completa** para calcular fit score:

1. **Stage 1 - Dados Básicos:**
   - CNPJ, razão social, nome fantasia
   - Situação cadastral, data de abertura
   - Natureza jurídica, capital social
   - Porte da empresa
   - Endereço completo

2. **Stage 2 - Setores e CNAEs:**
   - Setores alvo (array)
   - CNAEs alvo (array - principal e secundários)
   - NCMs recomendados (array)

3. **Stage 3 - Perfil Cliente Ideal:**
   - Persona detalhada
   - Dores principais
   - Objeções comuns
   - Desejos e expectativas
   - Stack tecnológico
   - Maturidade digital

4. **Stage 4 - Situação Atual:**
   - Clientes atuais (array de empresas base)
   - Empresas de benchmarking (array)
   - Concorrentes diretos (array)

5. **Stage 5 - Histórico:**
   - Cases de sucesso
   - Apresentação da empresa
   - Catálogo de produtos

6. **Stage 6 - Análise 360°:**
   - Matriz BCG
   - Análise competitiva
   - Análise de produtos
   - Plano estratégico
   - Análise CEO

### **Sistema de Scoring**

#### **Pesos por Critério:**
- **CNAE Principal:** 40 pontos
- **CNAE Secundário:** 20 pontos
- **Setor:** 30 pontos
- **Nicho:** 15 pontos
- **Localização:** 10 pontos
- **Faturamento:** 20 pontos
- **Porte:** 15 pontos
- **Total:** 150 pontos (normalizado para 0-100)

#### **Classificação por Grade:**
- **A+ (90-100):** Fit perfeito - prioridade máxima
- **A (75-89):** Fit muito bom - alta prioridade
- **B (60-74):** Fit bom - prioridade média
- **C (40-59):** Fit fraco - baixa prioridade
- **D (0-39):** Sem fit - descartar

### **Exclusões Automáticas**

O sistema **automaticamente exclui** empresas que:
- Têm CNAE de concorrentes diretos
- Estão em setores excluídos
- Não atendem critérios mínimos de porte/faturamento

---

## 📊 ESTRUTURA DE DADOS

### **Tabela: `icp_matching_criteria`**

```sql
CREATE TABLE IF NOT EXISTS public.icp_matching_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_profile_metadata_id UUID NOT NULL REFERENCES public.icp_profiles_metadata(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- Arrays extraídos do onboarding
  cnaes_alvo TEXT[] DEFAULT '{}',
  setores_alvo TEXT[] DEFAULT '{}',
  nichos_alvo TEXT[] DEFAULT '{}',
  ncms_alvo TEXT[] DEFAULT '{}',
  
  -- Ranges financeiros
  faturamento_min NUMERIC(15,2),
  faturamento_max NUMERIC(15,2),
  funcionarios_min INTEGER,
  funcionarios_max INTEGER,
  
  -- Localização
  estados_alvo TEXT[] DEFAULT '{}',
  regioes_alvo TEXT[] DEFAULT '{}',
  cidades_alvo TEXT[] DEFAULT '{}',
  
  -- Porte
  portes_alvo TEXT[] DEFAULT '{}',
  
  -- Padrões extraídos de clientes base
  padroes_clientes_base JSONB DEFAULT '{}',
  
  -- Padrões extraídos de benchmarking
  padroes_benchmarking JSONB DEFAULT '{}',
  
  -- Exclusões (CNAEs de concorrentes)
  cnaes_excluidos TEXT[] DEFAULT '{}',
  setores_excluidos TEXT[] DEFAULT '{}',
  
  -- Metadados
  extraido_de_onboarding_session_id UUID,
  extraido_em TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(icp_profile_metadata_id)
);
```

### **Função: `extract_icp_matching_criteria()`**

Extrai automaticamente todos os critérios do `onboarding_sessions` e popula a tabela `icp_matching_criteria`.

**Status:** ✅ Documentação completa em `SOLUCAO_PODEROSA_MATCHING_ICP_COMPLETO.md`

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

### **FASE 1: ESTABILIZAÇÃO (Imediato)**
1. ✅ Validar versão atual estável
2. ✅ Commit e push da versão atual
3. ✅ Criar tag de checkpoint: `v-stable-pre-mc10`

### **FASE 2: RETOMAR DESENVOLVIMENTO (MC10)**
1. Implementar processamento em massa de CNPJs
2. Melhorar `qualify-prospects-bulk` Edge Function
3. Criar interface de upload de CSV
4. Testar com arquivo real de 1000+ CNPJs

### **FASE 3: MATCHING 380° (MC11)**
1. Criar migration para `icp_matching_criteria`
2. Implementar função `extract_icp_matching_criteria()`
3. Atualizar `process_qualification_job` para usar critérios completos
4. Testar matching com todos os dados do ICP

### **FASE 4: REFINAMENTO (MC12-MC15)**
1. Implementar sistema de scoring avançado
2. Criar dashboard de inteligência
3. Adicionar análises preditivas
4. Integrar com fontes externas

---

## 📁 DOCUMENTOS RELACIONADOS

### **Documentos de Planejamento:**
- `PLANO_MC1_MC4_COMPLETO.md` - Plano original MC1-MC4
- `PLANO_MC1_ICP_VISIVEL_AJUSTADO.md` - Ajustes do MC1
- `SOLUCAO_PODEROSA_MATCHING_ICP_COMPLETO.md` - Solução completa de matching 380°

### **Relatórios de Implementação:**
- `RELATORIO_MC4_MATCH_FIT_IMPLEMENTACAO.md` - MC4 concluído
- `docs/RELATORIO_MC6_INTEGRAÇÃO_ICP_MATCH_FIT.md` - MC6 concluído
- `docs/MC9_V2_IMPLEMENTACAO.md` - MC9 V2.0 concluído

### **Arquivos de Código:**
- `src/services/matchFitEngine.ts` - Engine de matching
- `supabase/functions/qualify-prospects-bulk/index.ts` - Processamento em massa
- `supabase/migrations/XXXX_process_qualification_job.sql` - Função de qualificação

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Antes de Retomar Desenvolvimento:**
- [x] Versão atual estável e funcionando
- [x] Commit e push realizados
- [x] Documentação consolidada
- [ ] Tag de checkpoint criada
- [ ] Testes end-to-end validados
- [ ] Aprovação para retomar MC10

---

## 🎯 CONCLUSÃO

O plano estratégico está **bem documentado e estruturado**. Os MCs 1-9 foram **concluídos com sucesso**, e os MCs 10-18 estão **planejados e documentados**.

**Próximo passo recomendado:** Implementar **MC10 (Processamento em Massa de CNPJs)** após validação da versão atual estável.

---

**Status Final:** ✅ **PLANO CONSOLIDADO - PRONTO PARA RETOMAR DESENVOLVIMENTO**

**Última Atualização:** 2025-02-20

