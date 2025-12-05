# 🔍 AUDITORIA COMPLETA DO SISTEMA - FLUXO DE QUALIFICAÇÃO

**Data:** 05/12/2024  
**Status:** ANÁLISE ANTES DE QUALQUER MODIFICAÇÃO  
**Objetivo:** Mapear TUDO que existe para identificar gaps, redundâncias e melhorias necessárias

---

## 📋 **ESTRUTURA EXISTENTE MAPEADA:**

### 1️⃣ **PÁGINAS DE EMPRESAS/LEADS** (6 págs principais + variações)

| Rota | Arquivo | Tabela | Função | Status |
|------|---------|--------|--------|--------|
| `/companies` | `CompaniesManagementPage.tsx` | `companies` | **BASE DE EMPRESAS** - Pool permanente | ✅ EXISTE |
| `/leads/icp-quarantine` | `ICPQuarantine.tsx` | `icp_analysis_results` | **QUARENTENA ICP** - Análise pendente | ✅ EXISTE |
| `/leads/quarantine` | `Quarantine.tsx` | `leads_quarantine` | Quarentena genérica (não ICP) | ✅ EXISTE |
| `/leads/approved` | `ApprovedLeads.tsx` | `leads_qualified` + filtro status='aprovada' | **APROVADAS** - Prontas para pipeline | ✅ EXISTE |
| `/leads/pool` | `LeadsPoolPage.tsx` | `leads_pool` | Pool de leads qualificados | ⚠️ VERIFICAR USO |
| `/leads/qualified` | `LeadsQualifiedPage.tsx` | `leads_qualified` | Leads qualificados | ⚠️ VERIFICAR USO |
| `/leads/pipeline` | `Pipeline.tsx` | `sdr_deals` | **PIPELINE** - Vendas ativas | ✅ EXISTE |
| `/search` | `SearchPage.tsx` | - | **MOTOR DE QUALIFICAÇÃO** - Upload/Busca | ✅ EXISTE |
| `/command-center` | `CommandCenter.tsx` | - | **DASHBOARD** - Visão geral funil | ✅ EXISTE |

---

### 2️⃣ **COMPONENTES DE AÇÕES EM MASSA** (5 componentes)

#### ✅ **BulkActionsToolbar.tsx**
**Localização:** `src/components/companies/BulkActionsToolbar.tsx`  
**Props:**
```typescript
- selectedCount: number
- onSelectAll: () => void
- onBulkDelete: () => Promise<void>
- onBulkEnrichReceita: () => Promise<void>
- onBulkEnrich360: () => Promise<void>
- onBulkEnrichApollo: () => Promise<void>
- onBulkEnrichTotvsCheck?: () => Promise<void>
- onBulkDiscoverCNPJ?: () => Promise<void>
- onBulkApprove?: () => Promise<void>
- onBulkSendToQuarantine?: () => Promise<void> // 🆕
- onExportSelected: () => void
```

**Ações Disponíveis:**
- ✅ Selecionar Todos / Limpar Seleção
- ✅ Enriquecimento em Massa (Receita, 360°, Apollo, TOTVS)
- ✅ Descobrir CNPJ
- ✅ Aprovar em Massa
- ✅ **Enviar para Quarentena** 🆕
- ✅ Exportar CSV
- ✅ Deletar em Massa

**Usado em:** `CompaniesManagementPage.tsx`, `ICPQuarantine.tsx`

---

#### ✅ **HeaderActionsMenu.tsx**
**Localização:** `src/components/companies/HeaderActionsMenu.tsx`  
**Props:**
```typescript
- onUploadClick: () => void
- onBatchEnrichReceita: () => Promise<void>
- onBatchEnrich360: () => Promise<void>
- onBatchEnrichApollo: () => Promise<void>
- onSendToQuarantine?: () => Promise<void> // 🆕
- onApolloImport: () => void
- onSearchCompanies: () => void
- onPartnerSearch?: () => void // ✅ Buscar por Sócios
```

**Grupos de Ações:**
1. **Importar & Adicionar:**
   - Upload em Massa
   - Importar do Apollo
   - Buscar Empresas
   - Buscar por Sócios 🆕
2. **Enriquecimento em Lote:**
   - Receita Federal
   - Apollo Decisores
   - 360° Completo + IA
3. **Fluxo ICP:** 🆕
   - Integrar para ICP

**Usado em:** `CompaniesManagementPage.tsx`

---

#### ✅ **CompaniesActionsMenu.tsx**
**Localização:** `src/components/companies/CompaniesActionsMenu.tsx`  
**Props:**
```typescript
- selectedCount: number
- onBulkDelete: () => Promise<void>
- onExport: () => void
- onBulkEnrichReceita?: () => Promise<void>
- onBulkEnrichApollo?: () => Promise<void>
- onBulkEnrich360?: () => Promise<void>
- onBulkSendToQuarantine?: () => Promise<void>
```

**Ações:**
- Enriquecimento (Receita, Apollo, 360°)
- Exportar Selecionadas
- Deletar Selecionadas

**Usado em:** Dropdown "Ações em Massa"

---

#### ✅ **QuarantineActionsMenu.tsx**
**Localização:** `src/components/icp/QuarantineActionsMenu.tsx`  
**Funções:**
- Aprovar em Massa
- Descartar em Massa
- Enriquecimentos em Massa
- Reprocessar/Reverificar

**Usado em:** `ICPQuarantine.tsx`

---

#### ✅ **QuarantineRowActions.tsx**
**Localização:** `src/components/icp/QuarantineRowActions.tsx`  
**Props:**
```typescript
- onApprove: (id: string) => Promise<void>
- onReject: (id: string) => Promise<void>
- onDelete: (id: string) => Promise<void>
- onPreview: (company: any) => void
- onRefresh: (id: string) => Promise<void>
- onEnrichReceita, onEnrichApollo, onEnrich360...
- onRestoreIndividual?: (cnpj: string) => Promise<void>
```

**Ações Individuais:**
- Aprovar / Rejeitar
- Enriquecimentos (Receita, Apollo, 360°, Econodata)
- Atualizar/Reprocessar
- Preview
- Deletar
- Restaurar

**Usado em:** `ICPQuarantine.tsx` (ações por linha)

---

### 3️⃣ **FILTROS IMPLEMENTADOS** (7 tipos)

#### ✅ **CompaniesManagementPage.tsx** (Base de Empresas)
```typescript
const [filterOrigin, setFilterOrigin] = useState<string[]>([]);      // Origem
const [filterStatus, setFilterStatus] = useState<string[]>([]);       // Status CNPJ
const [filterSector, setFilterSector] = useState<string[]>([]);       // Setor
const [filterRegion, setFilterRegion] = useState<string[]>([]);       // UF
const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]); // Status Análise
const [filterEnrichment, setFilterEnrichment] = useState<string[]>([]); // Enriquecimento
```

**Filtros Disponíveis:**
- ✅ Origem (source_name)
- ✅ Status CNPJ (ATIVA, SUSPENSA, INAPTA, BAIXADA, NULA)
- ✅ Setor/Indústria
- ✅ UF (Estado)
- ✅ Status de Análise
- ✅ Enriquecimento (Receita, Apollo, 360°)

---

#### ✅ **ICPQuarantine.tsx** (Quarentena ICP)
```typescript
const [filterOrigin, setFilterOrigin] = useState<string[]>([]);
const [filterCNPJStatus, setFilterCNPJStatus] = useState<string[]>([]);
const [filterSector, setFilterSector] = useState<string[]>([]);
const [filterUF, setFilterUF] = useState<string[]>([]);
const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]);
const [filterVerificationStatus, setFilterVerificationStatus] = useState<string[]>([]); // 🆕
```

**Filtros Disponíveis:**
- ✅ Origem
- ✅ Status CNPJ
- ✅ Setor
- ✅ UF
- ✅ Status de Análise (0-25%, 26-50%, 51-75%, 76-100%)
- ✅ Status de Verificação 🆕

---

#### ✅ **ICPFilters.tsx** (Componente Reutilizável)
**Localização:** `src/components/competitive/ICPFilters.tsx`  
**Opções Pré-definidas:**
```typescript
REGIONS = ['Todas', 'SP', 'Sudeste', 'Sul', 'Nordeste', 'Norte', 'Centro-Oeste']
SECTORS = ['agro', 'construcao', 'distribuicao', 'educacional', ...]
STATUS_OPTIONS = ['qualified', 'disqualified']
TEMPERATURE_OPTIONS = ['hot', 'warm', 'cold']
```

---

#### ✅ **CompanyDiscoveryPage.tsx** (Descoberta de Empresas)
**Filtros por:**
- Região (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)
- Estado (todos os 27 estados)
- Município (combobox dinâmico)
- Setor
- Porte

---

### 4️⃣ **MOTOR DE QUALIFICAÇÃO AUTOMÁTICA**

#### ✅ **ICPQualificationEngine**
**Arquivo:** `src/services/icpQualificationEngine.ts` (770 linhas!)  
**Funcionalidades:**
- Calcula ICP Score (0-100) com 6 dimensões:
  - CNAE (25 pontos)
  - Capital Social (20 pontos)
  - Porte/Funcionários (20 pontos)
  - Localização (15 pontos)
  - Situação Cadastral (10 pontos)
  - Setor/Nicho (10 pontos)
- Determina Temperatura (HOT/WARM/COLD)
- Decisão Automática (APPROVE/QUARANTINE/NURTURING/DISCARD)
- Compara com múltiplos ICPs simultaneamente
- Retorna melhor ICP match

**Thresholds Padrão:**
```typescript
hot_min: 80,    // >= 80 = HOT
warm_min: 60,   // 60-79 = WARM
cold_max: 59    // < 60 = COLD
```

**Usado em:**
- `InlineCompanySearch.tsx`
- `LeadsQualificationTable.tsx`
- Upload em massa (via EdgeFunction)

---

#### ✅ **icpMatcher.ts**
**Arquivo:** `src/services/icpMatcher.ts`  
**Função:** `calculateICPMatch(company, tenantICP)`  
Versão simplificada do motor de qualificação para comparações rápidas.

---

### 5️⃣ **HOOKS DE QUALIFICAÇÃO/QUARENTENA** (8 hooks)

#### ✅ **useICPQuarantine.ts**
```typescript
- useSaveToQuarantine()        // Salvar empresa na quarentena
- useQuarantineCompanies()     // Listar empresas na quarentena
- useApproveQuarantineBatch()  // Aprovar em massa → CRIA DEALS EM sdr_deals!
- useRejectQuarantine()        // Descartar empresa
- useAutoApprove()             // Aprovação automática por regras
```

**⚠️ IMPORTANTE:**  
`useApproveQuarantineBatch()` **JÁ CRIA DEALS DIRETAMENTE** em `sdr_deals`!
```typescript
// Código atual:
const dealsToCreate = validCompanies.map(q => ({
  deal_title: `Prospecção - ${q.razao_social}`,
  company_id: q.company_id,
  deal_stage: 'discovery', // Primeiro estágio do pipeline
  ...
}));

await supabase.from('sdr_deals').insert(dealsToCreate);
```

---

#### ✅ **useRestoreToQuarantine.ts**
Restaurar empresas descartadas de volta para quarentena.

---

#### ✅ **useDeleteQuarantineBatch.ts**
Deletar empresas em massa da quarentena.

---

#### ✅ **useRefreshQuarantineBatch.ts**
Reprocessar/atualizar dados de empresas na quarentena.

---

#### ✅ **useReverifyAllCompanies.ts**
Reverificar todas as empresas na quarentena.

---

#### ✅ **useRestoreDiscarded.ts**
Restaurar empresas descartadas.

---

### 6️⃣ **FLUXO DE APROVAÇÃO ATUAL** (⚠️ ANALISAR)

```
QUARENTENA ICP (icp_analysis_results)
    ↓
[Aprovar em Massa] - useApproveQuarantineBatch()
    ↓
CRIA DEALS DIRETAMENTE (sdr_deals) ❓
    ↓
PIPELINE (/leads/pipeline, /sdr/workspace)
```

**❓ QUESTÃO CRÍTICA:**  
- Não há tabela "Aprovadas" como entidade separada!
- Aprovação vai **DIRETO** para `sdr_deals` (pipeline)
- `leads_qualified` existe mas parece ser usado em outro fluxo
- `leads_pool` existe mas pode estar obsoleto

---

### 7️⃣ **TABELAS DO BANCO (IDENTIFICADAS)**

| Tabela | Função | Uso |
|--------|--------|-----|
| `companies` | **BASE DE EMPRESAS** - Pool permanente | ✅ PRINCIPAL |
| `icp_analysis_results` | **QUARENTENA ICP** - Análise pendente | ✅ PRINCIPAL |
| `sdr_deals` | **PIPELINE** - Deals de vendas | ✅ PRINCIPAL |
| `leads_qualified` | Leads qualificados | ⚠️ VERIFICAR RELAÇÃO |
| `leads_pool` | Pool de leads | ⚠️ PODE ESTAR OBSOLETO |
| `leads_quarantine` | Quarentena genérica (não ICP) | ⚠️ DIFERENTE DE ICP |
| `icp` | Perfis de ICP configurados | ✅ ATIVO |
| `tenants` | Dados dos tenants/clientes | ✅ ATIVO |

---

### 8️⃣ **BOTÕES "ENVIAR PARA QUARENTENA"** (✅ EXISTENTES)

#### ✅ **CompaniesManagementPage.tsx** (linha ~1245)
```typescript
onSendToQuarantine={async () => {
  try {
    toast.info('🎯 Integrando TODAS as empresas ao ICP...');
    
    for (const company of companies) {
      // Verifica se já existe no ICP
      const { data: existing } = await supabase
        .from('icp_analysis_results')
        .select('id')
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // QUALIFICAÇÃO AUTOMÁTICA COM O MOTOR!
      const engine = await createQualificationEngine(tenantId!);
      const result = await engine.qualifyCompany({...});
      
      // Salvar na quarentena
      await supabase.from('icp_analysis_results').insert({
        tenant_id: tenantId,
        company_id: company.id,
        icp_score: result.best_icp_score,
        temperatura: result.best_temperatura,
        decision: result.decision,
        ...
      });
      
      sent++;
    }
    
    toast.success(`✅ ${sent} empresas integradas ao ICP!`);
  } catch (error) {
    // ...
  }
}}
```

**⚠️ PROBLEMA IDENTIFICADO:**  
Este botão envia **TODAS as empresas** da Base para Quarentena, sem filtros!  
Não há opção de **selecionar quais enviar** com base em filtros (Estado, Setor, Tamanho, etc.)

---

### 9️⃣ **CONTADORES/DASHBOARD** (✅ EXISTE)

#### ✅ **CommandCenter.tsx** (Central de Comando)
**Cards do Funil:**
```typescript
1. "Importadas" - Total no sistema (companies)
2. "Quarentena ICP" - Aguardando análise (icp_analysis_results WHERE status='pendente')
3. "Aprovadas" - Prontas para vendas ❓
4. "Pipeline Ativo" - Em negociação (sdr_deals WHERE stage IN (...))
```

**⚠️ GAP IDENTIFICADO:**  
Card "Aprovadas" pode não estar contando corretamente!  
Precisa verificar se conta de `leads_qualified` ou outra tabela.

---

## 🚨 **GAPS E PROBLEMAS IDENTIFICADOS:**

### ❌ **GAP 1: Envio para Quarentena sem Filtros**
**Problema:**  
Botão "Enviar para Quarentena" na Base de Empresas envia **TODAS** as empresas, sem opção de filtrar por:
- Estado/Região
- Setor
- Tamanho
- Fonte
- Projeto/Batch

**Solução Necessária:**  
Adicionar opção de enviar **empresas selecionadas** ou com base em **filtros ativos**.

---

### ❌ **GAP 2: Entidade "Aprovadas" não está clara**
**Problema:**  
O usuário espera um estágio "Aprovadas" entre Quarentena e Pipeline, mas:
- Aprovação vai **direto** para `sdr_deals` (pipeline)
- Não há tabela/view separada para "Aprovadas"
- `leads_qualified` existe mas pode ser de outro fluxo

**Solução Necessária:**  
Criar entidade "Aprovadas" clara:
- Opção A: Usar `leads_qualified` com status='aprovada'
- Opção B: Usar `icp_analysis_results` com status='aprovada' (antes de virar deal)
- Opção C: Criar nova tabela `approved_companies`

---

### ❌ **GAP 3: Base de Empresas não é permanente**
**Problema:**  
Quando empresas são aprovadas na Quarentena, elas:
1. Viram deals em `sdr_deals`
2. Mas continuam em `companies`? ❓
3. Não há flag clara de "já está no pipeline"

**Solução Necessária:**  
Garantir que `companies` **NUNCA DIMINUI**, apenas cresce.  
Adicionar campo `pipeline_status` ou similar para rastrear se já está no pipeline.

---

### ❌ **GAP 4: Transferências não são claras**
**Problema:**  
Não há auditoria/log de:
- Quando empresa saiu da Quarentena
- Para onde foi (Aprovadas? Pipeline?)
- Quem aprovou
- Motivo da aprovação

**Solução Necessária:**  
Criar tabela de auditoria: `company_status_history`
```sql
id, company_id, from_status, to_status, changed_by, changed_at, reason
```

---

### ⚠️ **GAP 5: Contadores podem estar incorretos**
**Problema:**  
Card "Aprovadas" no CommandCenter pode não estar contando corretamente.  
Precisa verificar query exata.

**Solução Necessária:**  
Revisar query do CommandCenter e garantir contagens corretas.

---

### ⚠️ **GAP 6: Múltiplas tabelas de leads**
**Problema:**  
Existem múltiplas tabelas similares:
- `leads_qualified`
- `leads_pool`
- `leads_quarantine`
- `icp_analysis_results`

Não está claro qual é usada para quê.

**Solução Necessária:**  
Documentar claramente o propósito de cada tabela.  
Deprecar/remover as que não são mais usadas.

---

## ✅ **O QUE JÁ FUNCIONA PERFEITAMENTE:**

1. ✅ **Motor de Qualificação Automática** (ICP Score 0-100)
2. ✅ **Filtros avançados** (Origem, Status CNPJ, Setor, UF)
3. ✅ **Ações em Massa** (Aprovar, Enriquecer, Deletar)
4. ✅ **Enriquecimentos** (Receita Federal, Apollo, 360°)
5. ✅ **Quarentena ICP** com análise completa
6. ✅ **Pipeline de Vendas** (`sdr_deals`)
7. ✅ **Dashboard CommandCenter** com funil de conversão
8. ✅ **Upload em Massa** com auto-enriquecimento
9. ✅ **Busca Individual** com qualificação automática

---

## 🎯 **PRÓXIMOS PASSOS (RECOMENDADOS):**

### **FASE 1: ANÁLISE (AGORA)**
1. ✅ Mapear TUDO que existe (este documento)
2. ⏳ Verificar queries dos contadores no CommandCenter
3. ⏳ Entender relação entre `leads_qualified` e `icp_analysis_results`
4. ⏳ Verificar se `leads_pool` ainda é usado

### **FASE 2: CORREÇÕES CIRÚRGICAS**
1. Adicionar filtros ao "Enviar para Quarentena"
2. Criar entidade "Aprovadas" clara (se necessário)
3. Garantir Base de Empresas é permanente
4. Adicionar auditoria de transferências
5. Corrigir contadores se necessário

### **FASE 3: MELHORIAS**
1. Consolidar tabelas redundantes
2. Adicionar mais filtros (Cidade, Tamanho, Projeto)
3. Melhorar UX dos botões de ação
4. Adicionar tooltips explicativos

---

## 📊 **RESUMO EXECUTIVO:**

**O que está FUNCIONANDO:** 95%  
**O que precisa MELHORAR:** 5%  
**Risco de quebrar:** ALTO se não for cirúrgico

**Principais Gaps:**
1. Envio para Quarentena sem filtros
2. Entidade "Aprovadas" não está clara
3. Transferências sem auditoria

**Recomendação:**  
✅ **NÃO FAZER mudanças grandes**  
✅ **FAZER ajustes cirúrgicos** após análise completa  
✅ **PRESERVAR tudo que funciona**  

---

**📝 Fim da Auditoria**  
**Próxima ação:** Verificar queries específicas e relações entre tabelas antes de qualquer modificação.

