# 🚨 MICROCICLO 4 — SINCRONIA FRONTEND + SIDEBAR
## STRATEVO ONE — UI Governada por Estado Canônico

---

## ✅ EXECUÇÃO EM ANDAMENTO

**Data:** 24 de Janeiro de 2026  
**Status:** SINCRONIZAÇÃO FRONTEND  
**Alinhamento:** Estados Canônicos do MICROCICLO 3

---

## 🎯 OBJETIVO

Garantir que o FRONTEND e a SIDEBAR respeitem integralmente os estados canônicos definidos no MICROCICLO 3.

**Nenhuma ação de UI pode:**
- Induzir salto de estado
- Permitir ação ilegal
- Contradizer o backend

---

## 🧭 ESTADOS CANÔNICOS (LEMBRETE)

```
RAW → BASE → POOL → ACTIVE → PIPELINE → DISCARDED
```

---

## 📋 AÇÕES DE UI IDENTIFICADAS

### 1. Criar Lead
- **Onde:** `Quarantine.tsx` (aprovação), `ApprovedLeads.tsx`
- **Transição:** POOL → ACTIVE
- **Validação:** ✅ Lead só pode ser criado se quarentena estiver em POOL

### 2. Aprovar Lead
- **Onde:** `Quarantine.tsx`, `ICPQuarantine.tsx`
- **Transição:** POOL → ACTIVE
- **Validação:** ✅ Aprovação só permitida em POOL

### 3. Criar Deal
- **Onde:** `ApprovedLeads.tsx` (Enviar para Pipeline)
- **Transição:** ACTIVE → PIPELINE
- **Validação:** ✅ Deal só pode ser criado se empresa estiver em ACTIVE

### 4. Mover para POOL
- **Onde:** `CompaniesManagementPage.tsx` (Integrar para ICP)
- **Transição:** BASE → POOL
- **Validação:** ✅ Só permitido se empresa estiver em BASE

### 5. Enriquecer
- **Onde:** Múltiplos componentes (já bloqueado no MC2)
- **Transição:** N/A (ação, não transição)
- **Validação:** ✅ Só permitido em ACTIVE (já implementado MC2)

### 6. Qualificar/Descartar
- **Onde:** `QualifiedProspectsStock.tsx`, `Quarantine.tsx`
- **Transição:** Qualquer → DISCARDED
- **Validação:** ✅ Sempre permitido (exceto se já DISCARDED)

---

## ✅ IMPLEMENTAÇÃO REALIZADA

### Hook Criado: `useCanonicalState.ts`

**Funcionalidades:**
1. ✅ `currentState` — Estado canônico atual
2. ✅ `canTransitionTo()` — Verifica se pode transicionar
3. ✅ `isActionAllowed()` — Verifica se ação é permitida
4. ✅ `getActionError()` — Mensagem de erro para ação bloqueada

**Ações Validadas:**
- `enrich` — Só permitido em ACTIVE
- `approve` — Só permitido em POOL
- `create_lead` — Só permitido em ACTIVE
- `create_deal` — Só permitido em ACTIVE
- `move_to_pool` — Só permitido em BASE
- `move_to_pipeline` — Só permitido em ACTIVE
- `discard` — Permitido de qualquer estado (exceto DISCARDED)

### Componente Criado: `CanonicalStateBadge.tsx`

**Funcionalidades:**
- Exibe badge com estado canônico atual
- Tooltip explicativo sobre o estado
- Variantes visuais por estado

### Componentes Sincronizados

#### 1. BulkActionsToolbar
- ✅ Validação de `move_to_pool` (BASE → POOL)
- ✅ Validação de `approve` (BASE → POOL)
- ✅ Tooltips explicativos quando bloqueado
- ✅ Botões desabilitados quando ação não permitida

**Modificações:**
- Adicionada prop `selectedCompanies` para validação
- Validação de estados antes de permitir ações
- Mensagens de erro claras

#### 2. QuarantineRowActions
- ✅ Validação de `approve` (POOL → ACTIVE)
- ✅ Botão desabilitado se não estiver em POOL
- ✅ Tooltip explicativo quando bloqueado

**Modificações:**
- Uso de `useCanonicalState` para validar estado
- `handleApprove` valida antes de executar
- Toast de erro se tentar aprovar fora de POOL

#### 3. ApprovedLeads
- ✅ Validação de `create_deal` (ACTIVE → PIPELINE)
- ✅ Verifica estado antes de criar deals

**Modificações:**
- `handleSendToPipeline` valida que empresas estão em ACTIVE
- Toast de erro se tentar criar deal fora de ACTIVE

#### 4. QualifiedProspectsStock
- ✅ Validação de `move_to_pool` (BASE → POOL)
- ✅ Verifica estado antes de promover para companies

**Modificações:**
- `handlePromoteToCompanies` valida que prospects estão em BASE
- Toast de erro se tentar promover fora de BASE

#### 5. CompanyDetailPage
- ✅ Badge de estado canônico exibido no header
- ✅ Estado visível para o usuário

**Modificações:**
- Importado `CanonicalStateBadge` e `useCanonicalState`
- Badge exibido ao lado do nome da empresa

---

## 📊 LISTA DE AÇÕES BLOQUEADAS POR ESTADO

### RAW
- ❌ Enrichment
- ❌ Aprovar
- ❌ Criar Lead
- ❌ Criar Deal
- ❌ Mover para Pipeline
- ✅ Mover para BASE (qualificação)
- ✅ Descartar

### BASE
- ❌ Enrichment
- ❌ Aprovar (não está em POOL)
- ❌ Criar Lead
- ❌ Criar Deal
- ❌ Mover para Pipeline
- ✅ Mover para POOL (Integrar para ICP)
- ✅ Descartar

### POOL
- ❌ Enrichment
- ✅ Aprovar (POOL → ACTIVE)
- ❌ Criar Lead diretamente
- ❌ Criar Deal
- ❌ Mover para Pipeline
- ❌ Mover para BASE (regressão)
- ✅ Descartar

### ACTIVE
- ✅ Enrichment (permitido)
- ❌ Aprovar (já está aprovado)
- ✅ Criar Lead (permitido)
- ✅ Criar Deal (ACTIVE → PIPELINE)
- ✅ Mover para Pipeline
- ❌ Mover para BASE/POOL (regressão)
- ✅ Descartar

### PIPELINE
- ❌ Enrichment
- ❌ Aprovar
- ❌ Criar Lead
- ❌ Criar Deal (já tem deal)
- ❌ Mover para outros estados (regressão)
- ✅ Descartar

### DISCARDED
- ❌ Todas as ações (estado terminal)

---

## 🔍 SINCRONIA BACKEND ↔ FRONTEND ↔ SIDEBAR

### ✅ Backend Confirmado (MICROCICLO 3)
1. Validação de transições — Trigger em `companies`
2. Validação de criação de leads — Função SQL
3. RPC protegida — `approve_quarantine_to_crm`
4. Edge Functions protegidas — `crm-leads`

### ✅ Frontend Confirmado (MICROCICLO 4)
1. Hook `useCanonicalState` — Valida ações
2. Componente `CanonicalStateBadge` — Exibe estado
3. BulkActionsToolbar — Valida transições
4. QuarantineRowActions — Valida aprovação
5. ApprovedLeads — Valida criação de deals
6. QualifiedProspectsStock — Valida promoção

### ✅ Sidebar/Navegação (Confirmado)
- ✅ Sidebar apenas navega para telas (não executa ações)
- ✅ Telas protegidas com validações de estado
- ✅ Badge de estado adicionado em CompanyDetailPage
- ✅ Coerência garantida: ações bloqueadas quando estado não permite

---

## 📝 ARQUIVOS MODIFICADOS/CRIADOS

### Criados
1. ✅ `src/hooks/useCanonicalState.ts`
2. ✅ `src/components/companies/CanonicalStateBadge.tsx`
3. ✅ `SINCRONIA_FRONTEND_MICROCICLO_4.md`

### Modificados
4. ✅ `src/components/companies/BulkActionsToolbar.tsx`
5. ✅ `src/components/icp/QuarantineRowActions.tsx`
6. ✅ `src/pages/Leads/ApprovedLeads.tsx`
7. ✅ `src/pages/QualifiedProspectsStock.tsx`
8. ✅ `src/pages/CompanyDetailPage.tsx`

**Total:** 8 arquivos

---

## 🛑 REGRA DE PARADA

**MICROCICLO 4 — FRONTEND CONCLUÍDO**

Sincronia frontend implementada conforme especificação.

**Alterações realizadas:**
- ✅ Hook `useCanonicalState` criado
- ✅ Componente `CanonicalStateBadge` criado
- ✅ 5 componentes sincronizados com validação de estados
- ✅ Tooltips e desabilitações implementadas
- ✅ Mensagens de erro claras
- ✅ Badge de estado exibido em CompanyDetailPage

**Sidebar/Navegação:**
- ✅ Confirmado: Sidebar apenas navega, telas já protegidas

**Nenhuma funcionalidade foi deletada.**
**Apenas validações e bloqueios foram aplicados.**

Aguardando validação humana explícita antes de prosseguir para revisão da sidebar.

---

**FIM DO MICROCICLO 4 — FRONTEND**

*Este documento documenta todas as alterações realizadas no MICROCICLO 4.*
