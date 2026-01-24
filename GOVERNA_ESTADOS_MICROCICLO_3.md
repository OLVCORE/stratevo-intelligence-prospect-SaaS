# 🚨 MICROCICLO 3 — GOVERNANÇA DE ESTADOS
## STRATEVO ONE — Status Canônico

---

## ✅ EXECUÇÃO EM ANDAMENTO

**Data:** 24 de Janeiro de 2026  
**Status:** MAPEAMENTO E IMPLEMENTAÇÃO  
**Alinhamento:** Fluxo Canônico Soberano

---

## 🎯 OBJETIVO

Definir e impor estados canônicos explícitos para todas as entidades centrais do STRATEVO ONE, garantindo aderência obrigatória ao fluxo:

```
LISTA → BASE → POOL → SALES TARGET → PIPELINE
```

---

## 🧭 ESTADOS CANÔNICOS (DECLARADOS)

Os seguintes estados são os **ÚNICOS VÁLIDOS**:

- **RAW** → entrada inicial (lista/busca)
- **BASE** → empresa qualificada
- **POOL** → governança comercial (quarentena ICP)
- **ACTIVE** → SALES TARGET (lead aprovado)
- **PIPELINE** → oportunidade ativa
- **DISCARDED** → descartado

**Nenhuma entidade pode existir fora desses estados.**

---

## 📋 MAPEAMENTO DE ESTADOS ATUAIS → CANÔNICOS

### 1. TABELA: `prospecting_candidates`

**Estados Atuais:**
- `pending` → aguardando qualificação
- `processing` → em processamento
- `qualified` → qualificado
- `rejected` → rejeitado
- `failed` → falhou

**Mapeamento Canônico:**
- `pending` → **RAW**
- `processing` → **RAW** (transitório)
- `qualified` → **BASE** (após qualificação)
- `rejected` → **DISCARDED**
- `failed` → **DISCARDED**

**Campo de Status:** `status` (já existe)

---

### 2. TABELA: `qualified_prospects`

**Estados Atuais:**
- `pipeline_status: 'new'` → recém qualificado
- `pipeline_status: 'ativo'` → ativo
- `pipeline_status: 'trabalhando'` → em trabalho
- `pipeline_status: 'pausado'` → pausado
- `pipeline_status: 'ganho'` → ganho
- `pipeline_status: 'perdido'` → perdido

**Mapeamento Canônico:**
- `pipeline_status: 'new'` → **BASE**
- `pipeline_status: 'ativo'` → **BASE** (mantém em BASE até aprovação)
- `pipeline_status: 'trabalhando'` → **BASE** (mantém em BASE)
- `pipeline_status: 'pausado'` → **BASE** (mantém em BASE)
- `pipeline_status: 'ganho'` → **PIPELINE** (se movido para deals)
- `pipeline_status: 'perdido'` → **DISCARDED**

**Campo de Status:** `pipeline_status` (já existe)

**Observação:** `qualified_prospects` representa BASE DE EMPRESAS. Quando aprovado, deve ir para POOL.

---

### 3. TABELA: `companies`

**Estados Atuais:**
- **IMPLÍCITO:** Empresa existe ou não existe
- `pipeline_status: 'ativo'` → ativo
- `pipeline_status: 'trabalhando'` → em trabalho
- `pipeline_status: 'pausado'` → pausado
- `pipeline_status: 'ganho'` → ganho
- `pipeline_status: 'perdido'` → perdido
- `cnpj_status: 'pendente'` → CNPJ pendente
- `cnpj_status: 'ativo'` → CNPJ ativo
- `cnpj_status: 'inativo'` → CNPJ inativo
- `cnpj_status: 'inexistente'` → CNPJ inexistente
- `journey_stage` → estágio da jornada (new, sdr_assigned, etc.)

**Mapeamento Canônico:**
- Empresa recém-criada (sem lead) → **BASE**
- Empresa com lead aprovado → **ACTIVE**
- Empresa com deal ativo → **PIPELINE**
- Empresa descartada → **DISCARDED**

**Campo de Status:** **CRIAR** `canonical_status` (novo campo)

**Observação:** `companies` pode estar em BASE, ACTIVE ou PIPELINE dependendo do contexto.

---

### 4. TABELA: `leads_quarantine`

**Estados Atuais:**
- `validation_status: 'pending'` → pendente de validação
- `validation_status: 'validating'` → em validação
- `validation_status: 'approved'` → aprovado
- `validation_status: 'rejected'` → rejeitado
- `validation_status: 'duplicate'` → duplicado
- `validation_status: 'invalid_data'` → dados inválidos

**Mapeamento Canônico:**
- `validation_status: 'pending'` → **POOL**
- `validation_status: 'validating'` → **POOL** (transitório)
- `validation_status: 'approved'` → **ACTIVE** (após aprovação)
- `validation_status: 'rejected'` → **DISCARDED**
- `validation_status: 'duplicate'` → **DISCARDED**
- `validation_status: 'invalid_data'` → **DISCARDED**

**Campo de Status:** `validation_status` (já existe)

**Observação:** `leads_quarantine` representa POOL COMERCIAL.

---

### 5. TABELA: `leads`

**Estados Atuais:**
- `status: 'novo'` → novo
- `status: 'qualificado'` → qualificado
- `status: 'contato_inicial'` → contato inicial
- `status: 'proposta'` → proposta
- `status: 'negociacao'` → negociação
- `status: 'fechado'` → fechado
- `status: 'perdido'` → perdido

**Mapeamento Canônico:**
- `status: 'novo'` → **ACTIVE** (lead aprovado)
- `status: 'qualificado'` → **ACTIVE**
- `status: 'contato_inicial'` → **ACTIVE**
- `status: 'proposta'` → **PIPELINE** (se tiver deal)
- `status: 'negociacao'` → **PIPELINE** (se tiver deal)
- `status: 'fechado'` → **PIPELINE** (se ganho) ou **DISCARDED** (se perdido)
- `status: 'perdido'` → **DISCARDED**

**Campo de Status:** `status` (já existe)

**Observação:** Leads só podem ser criados em **ACTIVE**. Não podem nascer em RAW, BASE ou POOL.

---

### 6. TABELA: `deals` / `sdr_deals`

**Estados Atuais:**
- `stage: 'discovery'` → descoberta
- `stage: 'qualification'` → qualificação
- `stage: 'proposal'` → proposta
- `stage: 'negotiation'` → negociação
- `stage: 'closed_won'` → fechado ganho
- `stage: 'closed_lost'` → fechado perdido

**Mapeamento Canônico:**
- `stage: 'discovery'` → **PIPELINE**
- `stage: 'qualification'` → **PIPELINE**
- `stage: 'proposal'` → **PIPELINE**
- `stage: 'negotiation'` → **PIPELINE**
- `stage: 'closed_won'` → **PIPELINE** (finalizado ganho)
- `stage: 'closed_lost'` → **DISCARDED**

**Campo de Status:** `stage` (já existe)

**Observação:** Deals só podem ser criados a partir de **ACTIVE** (leads aprovados).

---

## 🚫 TRANSIÇÕES PERMITIDAS E BLOQUEADAS

### Transições Permitidas (Sequenciais)

```
RAW → BASE → POOL → ACTIVE → PIPELINE
  ↓      ↓      ↓        ↓         ↓
DISCARDED  DISCARDED  DISCARDED  DISCARDED  DISCARDED
```

**Regras:**
1. ✅ RAW → BASE (após qualificação)
2. ✅ BASE → POOL (após integração para ICP)
3. ✅ POOL → ACTIVE (após aprovação)
4. ✅ ACTIVE → PIPELINE (quando deal é criado)
5. ✅ Qualquer estado → DISCARDED (descarte)

### Transições Bloqueadas (Saltos)

**PROIBIDO:**
- ❌ RAW → ACTIVE (pula BASE e POOL)
- ❌ RAW → PIPELINE (pula BASE, POOL e ACTIVE)
- ❌ BASE → ACTIVE (pula POOL)
- ❌ BASE → PIPELINE (pula POOL e ACTIVE)
- ❌ POOL → PIPELINE (pula ACTIVE)
- ❌ ACTIVE → RAW (regressão)
- ❌ ACTIVE → BASE (regressão)
- ❌ ACTIVE → POOL (regressão)
- ❌ PIPELINE → ACTIVE (regressão)
- ❌ PIPELINE → BASE (regressão)
- ❌ PIPELINE → POOL (regressão)
- ❌ PIPELINE → RAW (regressão)

---

## 🔧 IMPLEMENTAÇÃO

### Backend — Validador de Transições

**Arquivo:** `src/lib/utils/stateTransitionValidator.ts` (CRIAR)

**Funções:**
1. `validateStateTransition(from: CanonicalState, to: CanonicalState): boolean`
2. `getCanonicalState(entity: any, entityType: string): CanonicalState`
3. `canTransitionTo(entity: any, targetState: CanonicalState): boolean`

### Backend — Bloqueio de Criação de Leads

**Regra:** Leads só podem ser criados se a entidade origem estiver em **ACTIVE**.

**Pontos de Bloqueio:**
1. RPC `approve_quarantine_to_crm` — validar que quarentena está em POOL antes de criar lead
2. Edge Functions que criam leads — validar contexto
3. Frontend — desabilitar criação de leads fora de ACTIVE

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Criar `stateTransitionValidator.ts`
- [ ] Adicionar campo `canonical_status` em `companies` (migration)
- [ ] Implementar validação em RPCs de transição
- [ ] Bloquear criação de leads fora de ACTIVE
- [ ] Bloquear saltos de estado em todas as transições

### Frontend
- [ ] Sincronizar UI com estados canônicos
- [ ] Desabilitar botões que causariam saltos
- [ ] Adicionar feedback visual de estado atual
- [ ] Tooltips explicativos sobre transições

### Sidebar/Navegação
- [ ] Verificar que navegação não induz saltos
- [ ] Garantir coerência entre estado e tela

---

## ✅ IMPLEMENTAÇÃO REALIZADA

### Backend — Validador de Transições

**Arquivo Criado:** `src/lib/utils/stateTransitionValidator.ts`

**Funcionalidades:**
1. ✅ `validateStateTransition()` — Valida transições sequenciais
2. ✅ `getCanonicalState()` — Determina estado canônico de entidades
3. ✅ `canTransitionTo()` — Verifica se entidade pode transicionar
4. ✅ `getTransitionErrorMessage()` — Mensagens de erro amigáveis

### Backend — Migrations

**1. Migration: `20260124000001_add_canonical_status.sql`**
- ✅ Adiciona campo `canonical_status` em `companies`
- ✅ Atualiza empresas existentes baseado em estado atual
- ✅ Cria índice para performance

**2. Migration: `20260124000002_validate_state_transitions.sql`**
- ✅ Função `validate_state_transition()` — Valida transições no SQL
- ✅ Função `can_create_lead()` — Valida criação de leads
- ✅ Trigger `trigger_validate_company_state_transition` — Bloqueia saltos em companies

### Backend — RPC Modificada

**Arquivo:** `supabase/migrations/20250206000004_approve_quarantine_to_crm.sql`

**Modificações:**
- ✅ Valida que quarentena está em POOL antes de criar lead
- ✅ Define `canonical_status = 'ACTIVE'` ao criar/atualizar company
- ✅ Comentários explicativos adicionados

### Backend — Edge Functions

**Arquivo:** `supabase/functions/crm-leads/index.ts`

**Modificações:**
- ✅ Bloqueia criação direta de leads sem entidade origem
- ✅ Valida que entidade origem está em ACTIVE antes de criar lead
- ✅ Retorna erro 403 com mensagem clara

---

## 📊 LISTA DE BLOQUEIOS DE TRANSIÇÃO

### Transições Bloqueadas (Saltos)

1. ❌ **RAW → ACTIVE** — Pula BASE e POOL
2. ❌ **RAW → PIPELINE** — Pula BASE, POOL e ACTIVE
3. ❌ **BASE → ACTIVE** — Pula POOL
4. ❌ **BASE → PIPELINE** — Pula POOL e ACTIVE
5. ❌ **POOL → PIPELINE** — Pula ACTIVE
6. ❌ **Qualquer regressão** — ACTIVE → BASE, PIPELINE → ACTIVE, etc.

### Criação de Leads Bloqueada

1. ❌ **Criação direta sem entidade origem** — Bloqueada em `crm-leads`
2. ❌ **Criação a partir de BASE** — Leads não podem nascer em BASE
3. ❌ **Criação a partir de RAW** — Leads não podem nascer em RAW
4. ❌ **Criação a partir de POOL** — Apenas via `approve_quarantine_to_crm` (que valida POOL → ACTIVE)

---

## 🔍 SINCRONIA BACKEND ↔ FRONTEND

### ✅ Backend Confirmado

1. **Validação de transições** — Trigger em `companies` bloqueia saltos
2. **Validação de criação de leads** — Função SQL valida estado origem
3. **RPC protegida** — `approve_quarantine_to_crm` valida POOL antes de criar lead
4. **Edge Functions protegidas** — `crm-leads` bloqueia criação direta

### 🟡 Frontend (Pendente)

- [ ] Sincronizar UI com estados canônicos
- [ ] Desabilitar botões que causariam saltos
- [ ] Adicionar feedback visual de estado atual
- [ ] Tooltips explicativos sobre transições

### 🟡 Sidebar/Navegação (Pendente)

- [ ] Verificar que navegação não induz saltos
- [ ] Garantir coerência entre estado e tela

---

## 📝 ARQUIVOS MODIFICADOS/CRIADOS

### Criados
1. ✅ `src/lib/utils/stateTransitionValidator.ts`
2. ✅ `supabase/migrations/20260124000001_add_canonical_status.sql`
3. ✅ `supabase/migrations/20260124000002_validate_state_transitions.sql`
4. ✅ `GOVERNA_ESTADOS_MICROCICLO_3.md`

### Modificados
5. ✅ `supabase/migrations/20250206000004_approve_quarantine_to_crm.sql`
6. ✅ `supabase/functions/crm-leads/index.ts`

**Total:** 6 arquivos

---

## 🛑 REGRA DE PARADA

**MICROCICLO 3 — BACKEND CONCLUÍDO**

Governança de estados implementada no backend conforme especificação.

**Alterações realizadas:**
- ✅ Validador de transições criado (TypeScript + SQL)
- ✅ Campo `canonical_status` adicionado em `companies`
- ✅ Trigger bloqueia saltos de estado em `companies`
- ✅ Função SQL valida criação de leads
- ✅ RPC `approve_quarantine_to_crm` protegida
- ✅ Edge Function `crm-leads` bloqueia criação direta

**Frontend e Sidebar:**
- 🟡 Pendente sincronização (próxima etapa)

**Nenhuma funcionalidade foi deletada.**
**Apenas validações e bloqueios foram aplicados.**

Aguardando validação humana explícita antes de prosseguir para sincronização do frontend.

---

**FIM DO MICROCICLO 3 — BACKEND**

*Este documento documenta todas as alterações realizadas no MICROCICLO 3.*
