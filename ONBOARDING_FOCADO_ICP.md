# 🎯 ONBOARDING FOCADO EM ICP - PLANO DE IMPLEMENTAÇÃO

## 📋 OBJETIVO
Refatorar onboarding para:
1. **Buscar dados administrativos automaticamente** via APIs (ReceitaWS, API Brasil)
2. **Focar apenas em informações úteis para ICP** (setores/nichos)
3. **Criar sistema de badges** mostrando setor/nicho e aderência ao ICP

---

## 🔄 MUDANÇAS NO STEP 1: DADOS BÁSICOS

### ❌ REMOVER (Buscar Automaticamente):
- Data de Abertura → Buscar via API
- Situação Cadastral → Buscar via API
- Natureza Jurídica → Buscar via API
- Capital Social → Buscar via API
- Endereço Completo → Buscar via API

### ✅ MANTER (Input Manual):
- CNPJ (obrigatório - usado para buscar tudo)
- Email (obrigatório - para comunicação)
- Website (opcional - para enriquecimento)
- Telefone (opcional)

### 🆕 ADICIONAR:
- **Botão "Buscar Dados Automaticamente"** ao preencher CNPJ
- **Exibição dos dados encontrados** (read-only após busca)
- **Confirmação** antes de prosseguir

---

## 🎯 NOVO FOCO: SETORES E NICHOS

### STEP 2: SETORES E NICHOS (Refatorar completamente)

#### 2.1 Setor/Nicho que a Empresa ESTÁ
- **Setor Principal** (select baseado em CNAE detectado)
- **Nicho Principal** (select baseado em setor selecionado)
- **CNAEs** (mostrar detectados, permitir adicionar)

#### 2.2 Setores/Nichos que a Empresa QUER BUSCAR (ICP)
- **Setores Alvo** (multi-select)
- **Nichos Alvo** (multi-select baseado em setores selecionados)
- **CNAEs Alvo** (multi-select)

---

## 🏷️ SISTEMA DE BADGES PARA EMPRESAS

### Badges a Criar:

1. **Badge de Setor**
   - Cor baseada no setor
   - Ex: "Tecnologia" (azul), "Indústria" (laranja), "Serviços" (verde)

2. **Badge de Nicho**
   - Cor baseada no nicho
   - Ex: "Software B2B" (roxo), "E-commerce" (rosa)

3. **Badge de Aderência ao ICP**
   - ✅ "Match ICP" (verde) - Empresa está no setor/nicho que o tenant busca
   - ⚠️ "Potencial" (amarelo) - Empresa está em setor/nicho relacionado
   - ❌ "Fora do ICP" (cinza) - Empresa não está no ICP do tenant

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### Tabela: `companies` (Adicionar campos)

```sql
-- Classificação por Setor/Nicho
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS
  sector_code VARCHAR(50), -- Código do setor (agro, tecnologia, industria, etc.)
  sector_name VARCHAR(100), -- Nome do setor
  niche_code VARCHAR(50), -- Código do nicho
  niche_name VARCHAR(100), -- Nome do nicho
  icp_match_score INTEGER DEFAULT 0, -- Score de aderência ao ICP (0-100)
  icp_match_tier VARCHAR(20), -- excellent, premium, qualified, potential, low
  icp_match_reasons TEXT[]; -- Razões do match

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_sector_code ON public.companies(sector_code);
CREATE INDEX IF NOT EXISTS idx_companies_niche_code ON public.companies(niche_code);
CREATE INDEX IF NOT EXISTS idx_companies_icp_match_score ON public.companies(icp_match_score);
```

### Tabela: `tenants` (Adicionar campos de ICP)

```sql
-- ICP do Tenant (Setores/Nichos que busca)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  icp_sectors TEXT[] DEFAULT '{}', -- Setores que busca
  icp_niches TEXT[] DEFAULT '{}', -- Nichos que busca
  icp_cnaes TEXT[] DEFAULT '{}'; -- CNAEs que busca

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_icp_sectors ON public.tenants USING GIN(icp_sectors);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_niches ON public.tenants USING GIN(icp_niches);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_cnaes ON public.tenants USING GIN(icp_cnaes);
```

---

## 🔧 FUNÇÕES NECESSÁRIAS

### 1. Função: Buscar Dados da Receita Federal

**Arquivo:** `src/services/receitaFederal.ts` (já existe, usar)

```typescript
// Usar função existente para buscar dados administrativos
const receitaData = await buscarDadosReceitaFederal(cnpj);

// Dados retornados:
// - data_abertura
// - situacao_cadastral
// - natureza_juridica
// - capital_social
// - endereco_completo
// - cnaes
```

### 2. Função: Classificar Empresa por Setor/Nicho

**Arquivo:** `src/services/companyClassifier.ts` (criar)

```typescript
export function classifyCompanyByCNAE(cnae: string, companyName: string): {
  sector_code: string;
  sector_name: string;
  niche_code: string;
  niche_name: string;
} {
  // Mapear CNAE para setor/nicho
  // Usar tabela sectors e niches do banco
}
```

### 3. Função: Verificar Aderência ao ICP

**Arquivo:** `src/services/icpMatcher.ts` (criar)

```typescript
export function calculateICPMatch(
  company: { sector_code: string; niche_code: string; cnaes: string[] },
  tenantICP: { sectors: string[]; niches: string[]; cnaes: string[] }
): {
  score: number; // 0-100
  tier: 'excellent' | 'premium' | 'qualified' | 'potential' | 'low';
  reasons: string[];
} {
  // Calcular match baseado em:
  // - Setor match? (+30 pontos)
  // - Nicho match? (+30 pontos)
  // - CNAE match? (+20 pontos)
  // - Setor relacionado? (+10 pontos)
  // - Nicho relacionado? (+10 pontos)
}
```

---

## 🎨 COMPONENTES A CRIAR/MODIFICAR

### 1. Modificar: `Step1DadosBasicos.tsx`
- Adicionar botão "Buscar Dados Automaticamente"
- Exibir dados encontrados (read-only)
- Remover campos administrativos (buscar automaticamente)

### 2. Refatorar: `Step2AtividadesCNAEs.tsx` → `Step2SetoresNichos.tsx`
- Focar em setores/nichos que empresa ESTÁ
- Focar em setores/nichos que empresa QUER BUSCAR (ICP)

### 3. Criar: `CompanySectorNicheBadges.tsx`
- Badge de Setor
- Badge de Nicho
- Badge de Aderência ICP

### 4. Criar: `ICPMatchIndicator.tsx`
- Indicador visual de match com ICP
- Score e tier
- Razões do match

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Buscar Dados Automaticamente (2-3 dias)
- [ ] Modificar `Step1DadosBasicos.tsx` para buscar dados via API
- [ ] Adicionar botão "Buscar Dados Automaticamente"
- [ ] Exibir dados encontrados (read-only)
- [ ] Salvar dados administrativos automaticamente no tenant

### FASE 2: Refatorar Step 2 para Setores/Nichos (3-5 dias)
- [ ] Criar `Step2SetoresNichos.tsx`
- [ ] Seção: "Setor/Nicho que sua empresa ESTÁ"
- [ ] Seção: "Setores/Nichos que você QUER BUSCAR" (ICP)
- [ ] Integrar com tabelas `sectors` e `niches` do banco
- [ ] Classificação automática baseada em CNAE

### FASE 3: Sistema de Badges (2-3 dias)
- [ ] Criar `CompanySectorNicheBadges.tsx`
- [ ] Criar `ICPMatchIndicator.tsx`
- [ ] Adicionar badges em listagem de empresas
- [ ] Adicionar badges em cards de empresas

### FASE 4: Função de Classificação e Match (3-5 dias)
- [ ] Criar `companyClassifier.ts`
- [ ] Criar `icpMatcher.ts`
- [ ] Criar migration para adicionar campos no banco
- [ ] Atualizar empresas existentes com classificação
- [ ] Calcular match ao adicionar empresa

### FASE 5: Integrar em Bulk Upload (2-3 dias)
- [ ] Classificar empresas automaticamente ao fazer upload
- [ ] Calcular match com ICP do tenant
- [ ] Mostrar badges na preview do upload
- [ ] Filtrar por aderência ao ICP

---

## 🚀 PRÓXIMO PASSO

**Começar pela FASE 1** - Modificar Step 1 para buscar dados automaticamente via API quando CNPJ for informado.

Isso já vai simplificar muito o onboarding e garantir que dados administrativos sejam sempre corretos (vindos da fonte oficial).

---

**Última atualização:** 2025-01-19  
**Status:** 📋 Plano criado | ⏳ Aguardando implementação

