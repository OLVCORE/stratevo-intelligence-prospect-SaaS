# 🔍 ANÁLISE COMPLETA: NORMALIZADOR UNIVERSAL PARA UPLOAD DE EMPRESAS

## 📋 OBJETIVO
Criar um normalizador universal que mapeie os **87 campos do upload CSV/Excel** para as colunas corretas nas tabelas:
- `prospecting_candidates` (Motor de Qualificação)
- `qualified_prospects` (Estoque Qualificado)
- `companies` (Base de Empresas)
- `leads_quarantine` (Quarentena)

---

## 🗂️ ESTRUTURA DAS TABELAS

### 1. `prospecting_candidates` (Motor de Qualificação)
**Colunas disponíveis:**
```sql
- id (UUID)
- tenant_id (UUID) ✅
- icp_id (UUID) ✅
- source (TEXT) ✅
- source_batch_id (TEXT) ✅
- company_name (TEXT) ✅
- cnpj (TEXT) ✅
- cnpj_raw (TEXT) ✅
- website (TEXT) ✅
- sector (TEXT) ✅
- uf (TEXT) ✅
- city (TEXT) ✅
- country (TEXT) ✅
- contact_name (TEXT) ✅
- contact_role (TEXT) ✅
- contact_email (TEXT) ✅
- contact_phone (TEXT) ✅
- linkedin_url (TEXT) ✅
- notes (TEXT) ✅
- status (TEXT) ✅
- processed_at (TIMESTAMPTZ)
- error_message (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**❌ COLUNAS QUE NÃO EXISTEM (mas estão sendo usadas):**
- `nome_fantasia` ❌ (NÃO EXISTE - está causando erro PGRST204)

---

### 2. `qualified_prospects` (Estoque Qualificado)
**Colunas disponíveis:**
```sql
- id (UUID)
- tenant_id (UUID) ✅
- job_id (UUID) ✅
- icp_id (UUID) ✅
- cnpj (TEXT) ✅
- cnpj_raw (TEXT) ✅
- razao_social (TEXT) ✅
- nome_fantasia (TEXT) ✅ (EXISTE AQUI!)
- cidade (TEXT) ✅
- estado (TEXT) ✅
- cep (TEXT) ✅
- endereco (TEXT) ✅
- bairro (TEXT) ✅
- numero (TEXT) ✅
- setor (TEXT) ✅
- capital_social (NUMERIC) ✅
- cnae_principal (TEXT) ✅
- cnae_descricao (TEXT) ✅
- situacao_cnpj (TEXT) ✅
- porte (TEXT) ✅
- data_abertura (DATE) ✅
- website (TEXT) ✅
- produtos (JSONB) ✅
- produtos_count (INTEGER) ✅
- fit_score (NUMERIC) ✅
- grade (TEXT) ✅
- product_similarity_score (NUMERIC) ✅
- sector_fit_score (NUMERIC) ✅
- capital_fit_score (NUMERIC) ✅
- geo_fit_score (NUMERIC) ✅
- maturity_score (NUMERIC) ✅
- fit_reasons (JSONB) ✅
- compatible_products (JSONB) ✅
- risk_flags (JSONB) ✅
- pipeline_status (TEXT) ✅
- approved_at (TIMESTAMPTZ)
- discarded_at (TIMESTAMPTZ)
- discard_reason (TEXT)
- enrichment_data (JSONB) ✅
- ai_analysis (JSONB) ✅
- match_breakdown (JSONB) ✅
- source_name (TEXT) ✅
- source_metadata (JSONB) ✅
- company_id (UUID) ✅
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

### 3. `companies` (Base de Empresas)
**Colunas principais:**
```sql
- id (UUID)
- name (TEXT) ✅
- company_name (TEXT) ✅
- cnpj (TEXT) ✅
- domain (TEXT) ✅
- website (TEXT) ✅
- industry (TEXT) ✅
- employees (INTEGER) ✅
- revenue (TEXT) ✅
- location (JSONB) ✅
- linkedin_url (TEXT) ✅
- technologies (TEXT[]) ✅
- digital_maturity_score (NUMERIC) ✅
- raw_data (JSONB) ✅
- tenant_id (UUID) ✅
- apollo_id (TEXT)
- apollo_organization_id (TEXT)
- headquarters_city (TEXT)
- headquarters_state (TEXT)
- headquarters_country (TEXT)
- ... (muitas outras colunas Apollo)
```

---

### 4. `leads_quarantine` (Quarentena)
**Colunas principais:**
```sql
- id (UUID)
- name (TEXT) ✅
- cnpj (TEXT) ✅
- website (TEXT) ✅
- email (TEXT) ✅
- phone (TEXT) ✅
- sector (TEXT) ✅
- state (TEXT) ✅
- city (TEXT) ✅
- employees (INTEGER) ✅
- revenue (DECIMAL) ✅
- validation_status (TEXT) ✅
- ... (outras colunas de validação)
```

---

## 📊 OS 87 CAMPOS DO UPLOAD

### CAMPOS BÁSICOS (1-10)
1. CNPJ
2. Nome da Empresa
3. Nome Fantasia
4. Razão Social
5. Website
6. Domínio
7. Instagram
8. LinkedIn
9. Facebook
10. Twitter

### ENDEREÇO (11-20)
11. CEP
12. Logradouro
13. Número
14. Complemento
15. Bairro
16. Município
17. UF
18. País
19. Latitude
20. Longitude

### CONTATO (21-30)
21. Telefone
22. Email
23. Email Verificado
24. CNAE Principal Código
25. CNAE Principal Descrição
26. CNAEs Secundários Quantidade
27. CNAEs Secundários
28. Quadro Societário Quantidade
29. Sócios
30. Score Maturidade Digital

### ... (continua até 87 campos)

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### PROBLEMA 1: `nome_fantasia` não existe em `prospecting_candidates`
**Erro atual:** `PGRST204: Could not find the 'nome_fantasia' column`
**Causa:** Código tenta inserir `nome_fantasia` mas a coluna não existe
**Solução:** Remover do insert e colocar em `notes` se diferente da razão social

### PROBLEMA 2: Inconsistência de nomes de colunas
- `prospecting_candidates`: `company_name`, `city`, `uf`
- `qualified_prospects`: `razao_social`, `cidade`, `estado`
- **Mapeamento necessário:** `company_name` → `razao_social`, `city` → `cidade`, `uf` → `estado`

### PROBLEMA 3: Campos do upload não mapeados
- Muitos dos 87 campos não estão sendo mapeados
- Dados importantes podem estar sendo perdidos
- Necessário mapeamento completo

### PROBLEMA 4: Falta de normalizador centralizado
- Mapeamento está espalhado no código
- Dificulta manutenção
- Pode causar inconsistências

---

## 🎯 PROPOSTA DE SOLUÇÃO

### 1. CRIAR NORMALIZADOR UNIVERSAL
**Arquivo:** `src/lib/normalizers/universalCompanyNormalizer.ts`

**Função principal:**
```typescript
export function normalizeCompanyForProspectingCandidates(
  rawData: any, // 87 campos do upload
  columnMapping: ColumnMapping[]
): ProspectingCandidatePayload

export function normalizeCompanyForQualifiedProspects(
  candidate: ProspectingCandidate
): QualifiedProspectPayload

export function normalizeCompanyForCompanies(
  prospect: QualifiedProspect
): CompanyPayload
```

### 2. MAPEAMENTO COMPLETO DOS 87 CAMPOS

**Para `prospecting_candidates`:**
- CNPJ → `cnpj` (normalizado) + `cnpj_raw` (original)
- Razão Social → `company_name`
- Nome Fantasia → `notes` (se diferente)
- Website → `website`
- Setor → `sector`
- UF → `uf`
- Cidade → `city`
- Email → `contact_email`
- Telefone → `contact_phone`
- LinkedIn → `linkedin_url`
- Demais campos → `notes` (JSON stringificado)

**Para `qualified_prospects`:**
- `company_name` → `razao_social`
- Nome Fantasia → `nome_fantasia` (EXISTE AQUI!)
- `city` → `cidade`
- `uf` → `estado`
- Setor → `setor`
- Website → `website`
- CEP → `cep`
- Endereço completo → `endereco`, `bairro`, `numero`

### 3. CORREÇÃO IMEDIATA (SEM QUEBRAR)
- Remover `nome_fantasia` do insert em `prospecting_candidates`
- Adicionar nome fantasia em `notes` se disponível
- Garantir que o mapeamento `company_name` → `razao_social` funcione na função SQL

---

## 📝 PRÓXIMOS PASSOS (APÓS APROVAÇÃO)

1. ✅ Criar arquivo de normalizador universal
2. ✅ Mapear todos os 87 campos
3. ✅ Criar funções de conversão entre tabelas
4. ✅ Atualizar código de upload para usar normalizador
5. ✅ Testar fluxo completo

---

## ⚠️ GARANTIAS

**NÃO VOU:**
- ❌ Remover código existente
- ❌ Modificar lógica que funciona
- ❌ Quebrar fluxos existentes

**VOU APENAS:**
- ✅ Criar normalizador novo (não substituir)
- ✅ Corrigir erro de `nome_fantasia` (remover do insert)
- ✅ Adicionar mapeamento completo
- ✅ Documentar tudo antes de executar

---

## ❓ CONFIRMAÇÃO NECESSÁRIA

**Posso prosseguir com:**
1. ✅ Remover `nome_fantasia` do insert em `prospecting_candidates` (correção imediata)
2. ✅ Criar documento de mapeamento completo dos 87 campos
3. ✅ Criar normalizador universal (sem substituir código existente)
4. ✅ Testar antes de aplicar

**AGUARDANDO SUA APROVAÇÃO PARA CONTINUAR** 🚀

