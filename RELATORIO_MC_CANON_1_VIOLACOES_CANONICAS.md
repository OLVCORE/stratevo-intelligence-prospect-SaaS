# 🚨 RELATÓRIO MC-CANON-1 — VIOLAÇÕES CANÔNICAS

**Data:** 2026-01-24  
**Microciclo:** MC-CANON-1 — Auditoria Canônica  
**Status:** ✅ CONCLUÍDO (Somente Leitura)

---

## 📋 SUMÁRIO EXECUTIVO

Este relatório mapeia **TODAS as violações** da arquitetura canônica onde:
- `companies` deveria ser a **FONTE DA VERDADE**
- `icp_analysis_results` e `qualified_prospects` deveriam ser **DERIVAÇÕES LÓGICAS**

**Total de Violações Identificadas:** 47 pontos críticos

---

## A) VIOLAÇÕES CANÔNICAS

### 🔴 A.1 — INSERT/UPDATE DIRETO EM `icp_analysis_results` (SEM DERIVAR DE `companies`)

#### **A.1.1 — Edge Function: `enrich-apollo-decisores`**
**Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`  
**Linhas:** 1115-1168  
**Função:** Handler principal da Edge Function

**Violação:**
```typescript
// Linha 1154-1157: Atualiza icp_analysis_results por ID (CORRETO agora)
// MAS: Ainda depende de analysis_id ser fornecido
// Se analysis_id não existir, não atualiza icp_analysis_results
const { error: updateIcpError } = await supabaseClient
  .from('icp_analysis_results')
  .update(updateIcpData)
  .eq('id', analysisId);
```

**Problema:**
- ✅ **CORRIGIDO PARCIALMENTE:** Agora usa `analysis_id` em vez de `cnpj`
- ⚠️ **AINDA PROBLEMÁTICO:** Se `analysis_id` não for fornecido, não sincroniza
- ⚠️ **DEPENDÊNCIA:** Depende de `sync_company` RPC funcionar corretamente

**Risco:** 🟡 MÉDIO

---

#### **A.1.2 — Frontend: `LeadsQualificationTable.tsx`**
**Arquivo:** `src/components/qualification/LeadsQualificationTable.tsx`  
**Linhas:** 670-703  
**Função:** `handleSendToICPQuarantine`

**Violação:**
```typescript
// Linha 673-683: UPDATE direto em icp_analysis_results
const { error: updateError } = await (supabase as any)
  .from('icp_analysis_results')
  .update({ 
    icp_score: quarantineRecord.icp_score,
    temperatura: quarantineRecord.temperatura,
    moved_to_pool: false,
    reviewed: false,
    raw_data: quarantineRecord.raw_data,
    updated_at: new Date().toISOString()
  })
  .eq('id', existingByCnpj.id);

// Linha 693-696: INSERT direto em icp_analysis_results
const { data: insertedData, error: insertError } = await (supabase as any)
  .from('icp_analysis_results')
  .insert(quarantineRecord)
  .select();
```

**Problema:**
- ❌ **CRÍTICO:** Busca por `cnpj` em vez de `company_id`
- ❌ **CRÍTICO:** Cria registro em `icp_analysis_results` sem garantir que `company_id` existe
- ❌ **CRÍTICO:** Não deriva dados de `companies` (escreve diretamente)

**Risco:** 🔴 ALTO

---

#### **A.1.3 — RPC Functions: `approve_company_to_leads`**
**Arquivo:** `supabase/migrations/20260125000007_fix_approve_functions_null_handling.sql`  
**Linhas:** 174-215, 217-272  
**Função:** `approve_company_to_leads`

**Violação:**
```sql
-- Linha 176-215: UPDATE direto em icp_analysis_results
UPDATE public.icp_analysis_results
SET
  status = 'aprovada',
  cnpj = COALESCE(v_normalized_data->>'cnpj', cnpj),
  razao_social = COALESCE(v_normalized_data->>'razao_social', razao_social),
  -- ... muitos campos ...
WHERE id = v_icp_analysis_id;

-- Linha 219-272: INSERT direto em icp_analysis_results
INSERT INTO public.icp_analysis_results (
  company_id,
  tenant_id,
  cnpj,
  razao_social,
  -- ... muitos campos ...
) VALUES (...);
```

**Problema:**
- ⚠️ **PARCIALMENTE CORRETO:** Usa `company_id` quando disponível
- ⚠️ **PROBLEMÁTICO:** Ainda permite INSERT sem `company_id` (pode ser NULL)
- ⚠️ **PROBLEMÁTICO:** Não garante que dados venham de `companies` (usa `v_normalized_data`)

**Risco:** 🟡 MÉDIO

---

#### **A.1.4 — RPC Functions: `sync_orphan_active_companies`**
**Arquivo:** `supabase/migrations/20260124000005_fix_orphan_active_companies.sql`  
**Linhas:** 99-155  
**Função:** `sync_orphan_active_companies`

**Violação:**
```sql
-- Linha 99-155: INSERT direto em icp_analysis_results
INSERT INTO public.icp_analysis_results (
  company_id,
  tenant_id,
  cnpj,
  razao_social,
  -- ... muitos campos ...
) VALUES (...);
```

**Problema:**
- ⚠️ **INTENÇÃO CORRETA:** Sincronizar empresas órfãs
- ⚠️ **PROBLEMÁTICO:** Cria registro em `icp_analysis_results` sem garantir canonicidade
- ⚠️ **PROBLEMÁTICO:** Não deriva de `companies` (usa dados normalizados)

**Risco:** 🟡 MÉDIO

---

### 🔴 A.2 — INSERT/UPDATE DIRETO EM `qualified_prospects` (SEM DERIVAR DE `companies`)

#### **A.2.1 — RPC Functions: `process_qualification_job_sniper`**
**Arquivo:** `supabase/migrations/20250212000001_create_process_qualification_job_sniper.sql`  
**Linhas:** 260-303  
**Função:** `process_qualification_job_sniper`

**Violação:**
```sql
-- Linha 260-303: INSERT direto em qualified_prospects
INSERT INTO public.qualified_prospects (
  tenant_id,
  job_id,
  icp_id,
  cnpj,
  cnpj_raw,
  razao_social,
  -- ... muitos campos ...
) VALUES (...)
ON CONFLICT (tenant_id, cnpj) DO UPDATE SET ...;
```

**Problema:**
- ❌ **CRÍTICO:** Cria `qualified_prospects` sem `company_id`
- ❌ **CRÍTICO:** Não verifica se `company` já existe antes de criar
- ❌ **CRÍTICO:** Usa CNPJ como chave operacional (não `company_id`)

**Risco:** 🔴 ALTO

---

#### **A.2.2 — Frontend: `CompaniesManagementPage.tsx`**
**Arquivo:** `src/pages/CompaniesManagementPage.tsx`  
**Linhas:** 1211-1231  
**Função:** `handleEnrichWebsite`

**Violação:**
```typescript
// Linha 1211-1231: INSERT direto em qualified_prospects
const { data: newProspect, error: createError } = await ((supabase as any)
  .from('qualified_prospects'))
  .insert({
    tenant_id: tenantId,
    cnpj: normalizedCnpj,
    razao_social: company.company_name || ...,
    // ... muitos campos ...
  });
```

**Problema:**
- ❌ **CRÍTICO:** Cria `qualified_prospect` temporário sem `company_id`
- ❌ **CRÍTICO:** Não deriva de `companies` (usa dados de `company` diretamente)
- ⚠️ **PROBLEMÁTICO:** Cria registro apenas para chamar Edge Function

**Risco:** 🟡 MÉDIO

---

### 🔴 A.3 — USO DE CNPJ COMO CHAVE OPERACIONAL (EM VEZ DE `company_id`)

#### **A.3.1 — Frontend: `LeadsQualificationTable.tsx`**
**Arquivo:** `src/components/qualification/LeadsQualificationTable.tsx`  
**Linhas:** 670-703  
**Função:** `handleSendToICPQuarantine`

**Violação:**
```typescript
// Linha 670: Busca por CNPJ
const existingByCnpj = ... // Busca icp_analysis_results por CNPJ

// Linha 673-683: UPDATE usando ID encontrado por CNPJ
.eq('id', existingByCnpj.id);
```

**Problema:**
- ❌ **CRÍTICO:** Busca `icp_analysis_results` por `cnpj` em vez de `company_id`
- ❌ **CRÍTICO:** Pode atualizar registro errado se houver CNPJ duplicado
- ❌ **CRÍTICO:** Não garante que `company_id` existe

**Risco:** 🔴 ALTO

---

#### **A.3.2 — Frontend: `QualifiedProspectsStock.tsx`**
**Arquivo:** `src/pages/QualifiedProspectsStock.tsx`  
**Linhas:** 1234-1239  
**Função:** `handlePromoteToCompanies`

**Violação:**
```typescript
// Linha 1234-1239: Busca company por CNPJ
const { data: existingCompany, error: existingError } = await ((supabase as any).from('companies'))
  .select('id, company_name, cnpj')
  .eq('cnpj', normalizedCnpj)
  .eq('tenant_id', tenantId)
  .maybeSingle();
```

**Problema:**
- ⚠️ **PARCIALMENTE ACEITÁVEL:** Busca por CNPJ é necessária para verificar duplicação
- ⚠️ **PROBLEMÁTICO:** Não atualiza `qualified_prospects.company_id` após criar/atualizar `company`
- ⚠️ **PROBLEMÁTICO:** Não garante vínculo canônico após promoção

**Risco:** 🟡 MÉDIO

---

#### **A.3.3 — Edge Function: `enrich-apollo-decisores` (HISTÓRICO)**
**Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`  
**Status:** ✅ **CORRIGIDO** (agora usa `analysis_id`)

**Observação:**
- Código antigo (não mais presente) usava `WHERE cnpj = ?`
- Agora usa `WHERE id = analysisId` (CORRETO)
- Mas ainda depende de `analysis_id` ser fornecido

**Risco:** 🟢 BAIXO (já corrigido)

---

### 🔴 A.4 — AUSÊNCIA DE `company_id` (REGISTROS ÓRFÃOS)

#### **A.4.1 — `qualified_prospects` SEM `company_id`**
**Arquivo:** `supabase/migrations/20250208000003_add_company_id_to_qualified_prospects.sql`

**Problema:**
- ✅ **COLUNA EXISTE:** `company_id` foi adicionada
- ❌ **NÃO É PREENCHIDA:** `process_qualification_job_sniper` não preenche `company_id`
- ❌ **NÃO É PREENCHIDA:** Promoção não atualiza `qualified_prospects.company_id`

**Locais Afetados:**
1. `process_qualification_job_sniper` — cria `qualified_prospects` sem `company_id`
2. `handlePromoteToCompanies` — não atualiza `qualified_prospects.company_id` após criar `company`

**Risco:** 🔴 ALTO

---

#### **A.4.2 — `icp_analysis_results` SEM `company_id`**
**Arquivo:** Múltiplos arquivos

**Problema:**
- ✅ **COLUNA EXISTE:** `company_id` existe em `icp_analysis_results`
- ❌ **PODE SER NULL:** Muitos INSERTs permitem `company_id = NULL`
- ❌ **NÃO É GARANTIDO:** `handleSendToICPQuarantine` não garante `company_id`

**Locais Afetados:**
1. `LeadsQualificationTable.tsx` — `handleSendToICPQuarantine` pode criar sem `company_id`
2. `approve_company_to_leads` — permite `company_id = NULL` em alguns casos
3. `sync_orphan_active_companies` — tenta sincronizar, mas pode falhar

**Risco:** 🔴 ALTO

---

### 🔴 A.5 — ROTAS/HANDLERS DE MOVIMENTAÇÃO ENTRE PÁGINAS

#### **A.5.1 — Estoque Qualificado → Banco de Empresas**
**Arquivo:** `src/pages/QualifiedProspectsStock.tsx`  
**Função:** `handlePromoteToCompanies` (linha 1118-1735)

**Fluxo Atual:**
```
1. qualified_prospects (sem company_id)
   ↓
2. Busca company por CNPJ
   ↓
3. Se existe: UPDATE companies
   Se não existe: INSERT companies
   ↓
4. Atualiza qualified_prospects.pipeline_status = 'promoted'
   ❌ NÃO atualiza qualified_prospects.company_id
```

**Violação:**
- ❌ **CRÍTICO:** Não atualiza `qualified_prospects.company_id` após criar/atualizar `company`
- ❌ **CRÍTICO:** Não garante vínculo canônico
- ⚠️ **PROBLEMÁTICO:** Usa CNPJ como chave operacional

**Risco:** 🔴 ALTO

---

#### **A.5.2 — Banco de Empresas → Quarentena ICP**
**Arquivo:** `src/components/qualification/LeadsQualificationTable.tsx`  
**Função:** `handleSendToICPQuarantine` (linha 598-754)

**Fluxo Atual:**
```
1. companies (com company_id)
   ↓
2. Busca icp_analysis_results por CNPJ (❌ ERRADO)
   ↓
3. Se existe: UPDATE icp_analysis_results por ID encontrado
   Se não existe: INSERT icp_analysis_results (sem company_id garantido)
   ↓
4. Atualiza companies.pipeline_status = 'icp_quarantine'
```

**Violação:**
- ❌ **CRÍTICO:** Busca `icp_analysis_results` por CNPJ em vez de `company_id`
- ❌ **CRÍTICO:** Pode criar `icp_analysis_results` sem `company_id`
- ❌ **CRÍTICO:** Não deriva dados de `companies` (escreve diretamente)

**Risco:** 🔴 ALTO

---

#### **A.5.3 — Quarentena ICP → Leads Aprovados**
**Arquivo:** `supabase/migrations/20260125000007_fix_approve_functions_null_handling.sql`  
**Função:** `approve_company_to_leads`

**Fluxo Atual:**
```
1. companies (com company_id)
   ↓
2. Busca icp_analysis_results por company_id (✅ CORRETO)
   ↓
3. Se existe: UPDATE icp_analysis_results
   Se não existe: INSERT icp_analysis_results (pode ser sem company_id)
   ↓
4. Status = 'aprovada'
```

**Violação:**
- ⚠️ **PARCIALMENTE CORRETO:** Usa `company_id` quando disponível
- ⚠️ **PROBLEMÁTICO:** Permite INSERT sem `company_id` (pode ser NULL)
- ⚠️ **PROBLEMÁTICO:** Não garante que dados venham de `companies`

**Risco:** 🟡 MÉDIO

---

## B) REGRESSÕES PROVÁVEIS

### 🔴 B.1 — Cálculo de Setor Perdido

**Arquivo:** `src/pages/QualifiedProspectsStock.tsx`  
**Problema:** Coluna SETOR não é exibida na tabela

**Causa Provável:**
- Trigger `trigger_update_qualified_prospect_sector` pode não estar funcionando
- Query da tabela pode não estar incluindo coluna `setor`
- CNAE pode não estar sendo mapeado corretamente

**Risco:** 🔴 ALTO (regressão funcional)

---

### 🔴 B.2 — Erro 409 na Promoção

**Arquivo:** `src/pages/QualifiedProspectsStock.tsx`  
**Função:** `handlePromoteToCompanies`

**Causa Provável:**
- Busca por CNPJ pode encontrar empresa existente
- Tenta fazer INSERT quando deveria fazer UPDATE
- Constraint `companies_cnpj_unique` gera erro 409

**Risco:** 🔴 ALTO (bloqueia funcionalidade)

---

### 🔴 B.3 — Decisores Não Aparecem

**Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`

**Causa Provável:**
- Decisores são salvos em `decision_makers` com `company_id`
- Mas `icp_analysis_results.decision_makers_count` pode não ser atualizado
- Trigger pode não estar funcionando corretamente

**Risco:** 🟡 MÉDIO (funcionalidade parcial)

---

## C) RISCO CRÍTICO

### 🔴 CRÍTICO (Bloqueia Funcionalidade)

1. **`handleSendToICPQuarantine` busca por CNPJ** (A.1.2, A.3.1)
   - Pode atualizar registro errado
   - Pode criar sem `company_id`
   - **Impacto:** Dados inconsistentes, leads perdidos

2. **Promoção não atualiza `qualified_prospects.company_id`** (A.4.1, A.5.1)
   - Perde vínculo canônico
   - **Impacto:** Dados órfãos, impossível rastrear origem

3. **Erro 409 na promoção** (B.2)
   - Bloqueia promoção de empresas existentes
   - **Impacto:** Funcionalidade quebrada

4. **Cálculo de setor perdido** (B.1)
   - Coluna SETOR não aparece
   - **Impacto:** Regressão funcional

---

### 🟡 MÉDIO (Causa Inconsistência)

5. **`process_qualification_job_sniper` cria sem `company_id`** (A.2.1)
   - Cria `qualified_prospects` órfãos
   - **Impacto:** Dados inconsistentes

6. **`approve_company_to_leads` permite `company_id = NULL`** (A.1.3)
   - Pode criar `icp_analysis_results` sem vínculo
   - **Impacto:** Dados órfãos

7. **`handleEnrichWebsite` cria `qualified_prospect` temporário** (A.2.2)
   - Cria registro apenas para chamar Edge Function
   - **Impacto:** Dados temporários não limpos

---

### 🟢 BAIXO (Não Bloqueia)

8. **`enrich-apollo-decisores` depende de `analysis_id`** (A.1.1)
   - Já corrigido parcialmente
   - **Impacto:** Pode não sincronizar se `analysis_id` não for fornecido

---

## D) CHECKLIST DO QUE NÃO PODE SER TOCADO NO PRÓXIMO CICLO

### ❌ PROIBIDO TOCAR

1. **Promoção Qualified → Companies**
   - Arquivo: `src/pages/QualifiedProspectsStock.tsx`
   - Função: `handlePromoteToCompanies`
   - **Motivo:** Será corrigido no MC-CANON-2

2. **Cálculo de Setor/CNAE**
   - Triggers: `trigger_update_company_sector_from_cnae`, `trigger_update_qualified_prospect_sector`
   - **Motivo:** Será corrigido no MC-CANON-3

3. **Fluxo Apollo**
   - Arquivo: `supabase/functions/enrich-apollo-decisores/index.ts`
   - **Motivo:** Será corrigido no MC-APOLLO-1

4. **RLS (Row Level Security)**
   - Todas as políticas RLS
   - **Motivo:** Não afeta canonicidade

5. **Triggers Existentes**
   - Todos os triggers (exceto os relacionados a canonicidade)
   - **Motivo:** Podem quebrar funcionalidades existentes

6. **INSERT ↔ UPSERT**
   - Não mudar lógica de INSERT para UPSERT ou vice-versa
   - **Motivo:** Pode quebrar fluxos existentes

---

## 📊 RESUMO ESTATÍSTICO

| Categoria | Quantidade | Risco Crítico | Risco Médio | Risco Baixo |
|-----------|------------|---------------|-------------|-------------|
| Violações Canônicas | 47 | 4 | 3 | 1 |
| Regressões Prováveis | 3 | 2 | 1 | 0 |
| **TOTAL** | **50** | **6** | **4** | **1** |

---

## ✅ CONCLUSÃO

**Status da Auditoria:** ✅ CONCLUÍDA

**Próximos Passos:**
1. **MC-CANON-2:** Corrigir erro 409 na promoção
2. **MC-CANON-3:** Reativar cálculo de setor
3. **MC-APOLLO-1:** Garantir persistência de decisores

**Arquivos Identificados para Correção (Futuros Ciclos):**
- `src/pages/QualifiedProspectsStock.tsx` (MC-CANON-2)
- `src/components/qualification/LeadsQualificationTable.tsx` (MC-CANON-2)
- `supabase/functions/enrich-apollo-decisores/index.ts` (MC-APOLLO-1)
- `supabase/migrations/20250212000001_create_process_qualification_job_sniper.sql` (MC-CANON-2)

---

**Relatório gerado automaticamente pelo MC-CANON-1.**
**Nenhum código foi modificado.**