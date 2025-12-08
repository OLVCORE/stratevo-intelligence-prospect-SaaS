# Fluxo E2E STRATEVO Intelligence - Documentação Técnica

## 📋 Visão Geral

Este documento mapeia o fluxo completo de trabalho do STRATEVO Intelligence como um tenant real, do início ao fim.

## 🔄 Fluxo de Dados

```
IMPORT → QUALIFICAÇÃO → ESTOQUE → QUARENTENA → CRM → SEQUÊNCIAS
```

## 📊 Tabelas e Relações

### 1. Importação Bruta (`prospecting_candidates`)

**Tabela:** `public.prospecting_candidates`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `icp_id` (UUID, FK → `icp_profiles_metadata.id`)
- `source` (TEXT): 'EMPRESAS_AQUI', 'APOLLO', 'PHANTOMBUSTER', 'GOOGLE_SHEETS', 'MANUAL'
- `source_batch_id` (TEXT): ID do lote de importação
- `company_name` (TEXT, NOT NULL)
- `cnpj` (TEXT)
- `website`, `sector`, `uf`, `city`
- `contact_name`, `contact_email`, `contact_phone`
- `status` (TEXT): 'pending', 'processing', 'processed', 'failed'
- `created_at`, `updated_at`

**Status inicial:** `pending`

**Próximo passo:** Processar via motor de qualificação

---

### 2. Motor de Qualificação

**Tabela de Jobs:** `public.prospect_qualification_jobs`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `icp_id` (UUID, opcional)
- `job_name` (TEXT): Nome do lote
- `source_type` (TEXT): 'upload_csv', 'upload_excel', 'paste_list', 'apollo_import'
- `total_cnpjs` (INTEGER)
- `processed_count` (INTEGER)
- `status` (TEXT): 'pending', 'processing', 'completed', 'failed'
- `grade_a_plus`, `grade_a`, `grade_b`, `grade_c`, `grade_d` (contadores)
- `created_at`, `started_at`, `completed_at`

**Tabela de Prospects Qualificados:** `public.qualified_prospects`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `job_id` (UUID, FK → `prospect_qualification_jobs.id`)
- `icp_id` (UUID, opcional)
- `cnpj` (TEXT, NOT NULL)
- `razao_social`, `nome_fantasia`
- `cidade`, `estado`, `cep`, `endereco`
- `setor`, `capital_social`, `cnae_principal`, `porte`
- `fit_score` (NUMERIC 5,2): 0.00 a 100.00
- `grade` (TEXT): 'A+', 'A', 'B', 'C', 'D'
- `pipeline_status` (TEXT): 'new', 'approved', 'in_base', 'in_quarantine', 'discarded'
- `fit_reasons` (JSONB): Array de strings explicando o score
- `created_at`, `updated_at`

**Constraint:** `UNIQUE(tenant_id, cnpj)`

**Funções:**
- `approve_prospects_bulk(tenant_id, job_id, grades[])` → Move para `empresas` com status `pending_review`
- `discard_prospects_bulk(tenant_id, job_id, grades[], reason)` → Marca como `discarded`

---

### 3. Estoque de Empresas Qualificadas

**Tabela:** `public.qualified_prospects` (mesma da qualificação)

**Filtros disponíveis:**
- `fit_score` / `grade` (A+, A, B, C, D)
- `setor`
- `estado` / `cidade`
- `pipeline_status` ('new', 'approved', 'in_base', 'in_quarantine', 'discarded')
- `job_id` (origem da lista)

**Ações:**
- "Enviar para Quarentena" → Atualiza `pipeline_status = 'in_quarantine'`
- "Aprovar direto para CRM" → Chama `approve_prospects_bulk()` → Move para `empresas`

---

### 4. Quarentena / Lapidação

**Tabela:** `public.leads_quarantine`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `cnpj` (TEXT)
- `name` (TEXT): Razão social
- `nome_fantasia` (TEXT)
- `validation_status` (TEXT): 'pending', 'approved', 'rejected'
- `icp_score` (INTEGER): Score de qualificação ICP
- `icp_id` (UUID)
- `icp_name` (TEXT)
- `temperatura` (TEXT): 'hot', 'warm', 'cold'
- `qualification_data` (JSONB): Dados completos da qualificação
- `review_status` (TEXT): 'pending', 'approved', 'rejected'
- `created_at`, `updated_at`

**Ações na Quarentena:**
1. **Editar dados básicos** → Atualiza campos (telefone, e-mail, contato principal)
2. **Marcar duplicados** → `review_status = 'rejected'`, motivo = 'duplicate'
3. **Rejeitar definitivamente** → `review_status = 'rejected'`
4. **Aprovar para CRM** → `review_status = 'approved'` → Cria/atualiza em `empresas` e cria `leads`/`deals`

**Ao aprovar:**
- Cria/atualiza registro em `public.empresas` (se não existir)
- Cria `public.leads` (se houver contato)
- Cria `public.deals` (oportunidade inicial, opcional)

---

### 5. CRM Interno (Pipeline)

#### 5.1. Contas / Empresas

**Tabela:** `public.empresas` (ou `public.companies` - verificar qual está sendo usada)

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `cnpj` (TEXT)
- `razao_social`, `nome_fantasia`
- `cidade`, `estado`
- `setor`, `capital_social`
- `fit_score`, `grade`
- `status` (TEXT): 'pending_review', 'active', 'inactive'
- `origem` (TEXT): 'motor_qualificacao', 'manual', 'apollo', etc.
- `created_at`, `updated_at`

#### 5.2. Contatos

**Tabela:** `public.leads`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `name` (TEXT): Nome do contato
- `email` (TEXT)
- `phone` (TEXT)
- `company_name` (TEXT)
- `position` (TEXT)
- `status` (TEXT): 'novo', 'qualificado', 'contato_inicial', 'proposta', 'negociacao', 'fechado', 'perdido'
- `lead_score` (INTEGER)
- `priority` (TEXT): 'low', 'medium', 'high', 'urgent'
- `created_at`, `updated_at`

#### 5.3. Oportunidades / Deals

**Tabela:** `public.deals`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `lead_id` (UUID, FK → `leads.id`)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `value` (NUMERIC)
- `currency` (TEXT): 'BRL'
- `stage` (TEXT, NOT NULL): 'discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
- `probability` (INTEGER): 0-100
- `expected_close_date` (DATE)
- `owner_id` (UUID, FK → `auth.users.id`)
- `priority` (TEXT)
- `source` (TEXT)
- `created_at`, `updated_at`

**Estágios do funil:**
- `discovery` → `qualification` → `proposal` → `negotiation` → `closed_won` / `closed_lost`

#### 5.4. Atividades

**Tabela:** `public.activities`

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `lead_id` (UUID, FK → `leads.id`)
- `deal_id` (UUID, FK → `deals.id`)
- `type` (TEXT, NOT NULL): 'call', 'email', 'meeting', 'task', 'visit', 'demo', 'proposal', 'follow_up'
- `subject` (TEXT, NOT NULL)
- `description` (TEXT)
- `due_date` (TIMESTAMPTZ)
- `completed` (BOOLEAN)
- `completed_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK → `auth.users.id`)
- `created_at`, `updated_at`

---

### 6. Sequências Comerciais (MVP)

**Tabela de Sequências:** `public.sequences` (a criar)

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at`

**Tabela de Steps:** `public.sequence_steps` (a criar)

**Campos principais:**
- `id` (UUID, PK)
- `sequence_id` (UUID, FK → `sequences.id`)
- `day_offset` (INTEGER): Dias após início da sequência
- `tipo` (TEXT): 'whatsapp', 'email', 'task'
- `template_text` (TEXT)
- `order` (INTEGER)
- `created_at`

**Tabela de Execuções:** `public.sequence_executions` (a criar)

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → `tenants.id`)
- `sequence_id` (UUID, FK → `sequences.id`)
- `lead_id` (UUID, FK → `leads.id`)
- `deal_id` (UUID, FK → `deals.id`)
- `current_step` (INTEGER)
- `status` (TEXT): 'active', 'paused', 'completed', 'cancelled'
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`

---

## 🔑 Chaves Estrangeiras e Relações

```
tenants (id)
  ├── prospecting_candidates (tenant_id)
  ├── prospect_qualification_jobs (tenant_id)
  ├── qualified_prospects (tenant_id)
  ├── leads_quarantine (tenant_id)
  ├── empresas (tenant_id)
  ├── leads (tenant_id)
  ├── deals (tenant_id)
  ├── activities (tenant_id)
  └── sequences (tenant_id)

prospect_qualification_jobs (id)
  └── qualified_prospects (job_id)

icp_profiles_metadata (id)
  ├── prospecting_candidates (icp_id)
  └── qualified_prospects (icp_id)

leads (id)
  ├── deals (lead_id)
  └── activities (lead_id)

deals (id)
  └── activities (deal_id)
```

---

## 📝 Campos Mínimos Obrigatórios por Etapa

### Importação (`prospecting_candidates`)
- ✅ `company_name` (obrigatório)
- ⚪ `cnpj` (opcional, mas recomendado)
- ⚪ `uf`, `city`, `sector` (opcionais)

### Qualificação (`qualified_prospects`)
- ✅ `cnpj` (obrigatório)
- ✅ `razao_social` (obrigatório)
- ✅ `fit_score` (obrigatório, calculado)
- ✅ `grade` (obrigatório, calculado)
- ⚪ `setor`, `estado`, `cidade` (opcionais)

### Quarentena (`leads_quarantine`)
- ✅ `cnpj` (obrigatório)
- ✅ `name` (obrigatório)
- ✅ `validation_status` (obrigatório, default: 'pending')
- ⚪ `icp_score`, `temperatura` (opcionais, mas recomendados)

### CRM - Leads (`leads`)
- ✅ `name` (obrigatório)
- ✅ `email` (obrigatório)
- ✅ `phone` (obrigatório)
- ⚪ `company_name`, `position` (opcionais)

### CRM - Deals (`deals`)
- ✅ `title` (obrigatório)
- ✅ `stage` (obrigatório, default: 'discovery')
- ⚪ `value`, `expected_close_date` (opcionais)

### CRM - Activities (`activities`)
- ✅ `type` (obrigatório)
- ✅ `subject` (obrigatório)
- ⚪ `description`, `due_date` (opcionais)

---

## 🔄 Fluxo de Status

### Importação → Qualificação
```
prospecting_candidates.status:
  'pending' → 'processing' → 'processed' / 'failed'
```

### Qualificação → Estoque
```
qualified_prospects.pipeline_status:
  'new' → (aguarda ação)
```

### Estoque → Quarentena
```
qualified_prospects.pipeline_status:
  'new' → 'in_quarantine'
  
leads_quarantine.validation_status:
  'pending' → (aguarda revisão)
```

### Quarentena → CRM
```
leads_quarantine.review_status:
  'pending' → 'approved' / 'rejected'

empresas.status:
  'pending_review' → 'active'

leads.status:
  'novo' → 'qualificado' → ...

deals.stage:
  'discovery' → 'qualification' → ...
```

---

## 🎯 Próximos Passos de Implementação

1. ✅ Documentação criada
2. ⏳ Ajustar página de importação (já existe `ProspectingImport.tsx`)
3. ⏳ Criar/ajustar tela de Motor de Qualificação
4. ⏳ Criar/ajustar tela de Estoque de Empresas
5. ⏳ Ajustar tela de Quarentena
6. ⏳ Ajustar CRM (pipeline, atividades)
7. ⏳ Criar estrutura de sequências comerciais

---

## 📌 Notas Importantes

- **NÃO** depender de `generate-icp-report` (relatório LLM avançado)
- **NÃO** usar dados hardcoded ou placeholders
- **NÃO** alterar lógica de segurança (RLS)
- **NÃO** apagar tabelas ou migrations
- Usar dados reais em todas as etapas
- Manter ICP, competitiva, BCG e SWOT funcionando

---

**Última atualização:** 07/12/2025


