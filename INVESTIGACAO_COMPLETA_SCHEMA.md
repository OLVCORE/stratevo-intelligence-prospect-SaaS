# 🔍 INVESTIGAÇÃO COMPLETA: LOVABLE → CURSOR

## 📋 OBJETIVO:
Comparar TODAS as tabelas, queries e estruturas para encontrar incompatibilidades.

---

## 1️⃣ TABELAS RELACIONADAS À QUARENTENA ICP

### `icp_analysis_results`
- **Finalidade:** Armazenar resultados de análise ICP (empresas em quarentena)
- **Campos esperados:**
  - `id` (uuid)
  - `cnpj` (text)
  - `razao_social` / `company_name` (text) ⚠️ **CONFLITO POTENCIAL**
  - `status` (text: 'pendente', 'aprovado', 'descartada')
  - `icp_score` (numeric)
  - `temperatura` (text)
  - `created_at` (timestamp)
  - `raw_data` (jsonb)
  - `user_id` (uuid)

### `discarded_companies`
- **Finalidade:** Armazenar empresas descartadas da quarentena
- **Campos esperados:**
  - `id` (uuid)
  - `cnpj` (text)
  - `company_name` / `razao_social` (text) ⚠️ **CONFLITO POTENCIAL**
  - `discarded_at` (timestamp)
  - `reason` (text)
  - `user_id` (uuid)

---

## 2️⃣ TABELAS RELACIONADAS A EMPRESAS

### `companies`
- **Finalidade:** Tabela principal de empresas (ativas no pipeline)
- **Campos esperados:**
  - `id` (uuid)
  - `company_name` (text) ⚠️ **CAMPO REAL NO SUPABASE**
  - `name` (text) ⚠️ **CAMPO QUE DEVERIA SER ALIAS**
  - `cnpj` (text)
  - `industry` (text)
  - `employees` (integer)
  - `revenue` (numeric)
  - `lead_score` (numeric)
  - `digital_maturity_score` (numeric) ⚠️ **CAUSANDO ERRO 400**
  - `location` (jsonb)
  - `raw_data` (jsonb)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

---

## 3️⃣ TABELAS RELACIONADAS AO PIPELINE DE VENDAS

### `sdr_deals`
- **Finalidade:** Oportunidades de vendas (deals no pipeline)
- **Campos esperados:**
  - `id` (uuid)
  - `title` (text)
  - `description` (text)
  - `company_id` (uuid FK → companies.id)
  - `deal_stage` (text) ⚠️ **CAMPO REAL, NÃO 'stage'**
  - `status` (text) ⚠️ **NÃO EXISTE - CAUSANDO ERRO 400**
  - `value` (numeric)
  - `probability` (numeric)
  - `priority` (text)
  - `assigned_sdr` (uuid)
  - `expected_close_date` (timestamp)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### `sdr_pipeline_stages`
- **Finalidade:** Estágios do pipeline (Discovery, Qualification, etc.)
- **Campos esperados:**
  - `id` (uuid)
  - `name` (text)
  - `key` (text: 'discovery', 'qualification', 'proposal', etc.)
  - `order_index` (integer)
  - `color` (text)
  - `is_closed` (boolean)
  - `is_won` (boolean)
  - `probability_default` (numeric)

---

## 4️⃣ CONFLITOS IDENTIFICADOS

### ❌ CONFLITO 1: `name` vs `company_name`
- **Lovable:** Usava `name`
- **Supabase Real:** Tem `company_name`
- **Solução:** Criar coluna `name` como alias/trigger

### ❌ CONFLITO 2: `status` em `sdr_deals`
- **Código:** Tenta filtrar por `status='open'`
- **Supabase Real:** Coluna `status` não existe
- **Solução:** Usar `deal_stage` + `is_closed` da tabela `sdr_pipeline_stages`

### ❌ CONFLITO 3: `digital_maturity_score` em `companies`
- **Código:** Tenta selecionar `digital_maturity_score`
- **Supabase Real:** Coluna pode não existir
- **Solução:** Adicionar coluna ou remover do SELECT

### ❌ CONFLITO 4: Edge Functions requerem autenticação
- **Lovable:** Edge Functions públicas
- **Supabase Real:** Requer JWT ou desabilitar "Invoke authorization"
- **Solução:** Desabilitar auth nas funções ou usar backend proxy

---

## 5️⃣ PRÓXIMOS PASSOS

1. ✅ Verificar schema real do Supabase (via SQL)
2. ✅ Comparar com TypeScript types gerados
3. ✅ Criar migration SQL para corrigir TODAS as inconsistências
4. ✅ Atualizar TODOS os hooks/queries TypeScript
5. ✅ Testar cada página uma por uma

---

**INICIANDO INVESTIGAÇÃO...**

