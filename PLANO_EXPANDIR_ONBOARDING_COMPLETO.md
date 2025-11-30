# 🚀 PLANO COMPLETO: EXPANDIR ONBOARDING PARA MATCHING DE PRIMEIRA CLASSE

## 📋 OBJETIVO
Expandir o onboarding atual para coletar todas as informações necessárias para matching de empresas similar ao nível de plataformas Tier 1 (Apollo.io, ZoomInfo, HubSpot).

---

## 🎯 ESTRUTURA PROPOSTA: 7 STEPS

### ✅ STEP 1: DADOS BÁSICOS (Expandir)
**Status:** ✅ Existe | ⚠️ Precisa expandir

#### Campos Atuais:
- ✅ CNPJ
- ✅ Razão Social
- ✅ Nome Fantasia
- ✅ Website
- ✅ Telefone
- ✅ Email
- ✅ Setor Principal
- ✅ Porte da Empresa

#### Campos a Adicionar:
- ❌ **Endereço Completo**
  - Logradouro
  - Número
  - Complemento
  - Bairro
  - CEP
  - Cidade
  - Estado/UF
  - País
- ❌ **LinkedIn Company Page** (campo específico)
- ❌ **Data de Abertura**
- ❌ **Situação Cadastral** (select: Ativa, Suspensa, Baixada)
- ❌ **Natureza Jurídica** (select: LTDA, SA, MEI, EIRELI, etc.)
- ❌ **Capital Social**

---

### ✅ STEP 2: ATIVIDADES E CNAEs (Expandir)
**Status:** ✅ Existe | ⚠️ Precisa expandir

#### Campos Atuais:
- ✅ CNAE Principal
- ✅ CNAEs Secundários
- ✅ Descrição das Atividades
- ✅ Produtos/Serviços (básico: nome, categoria, descrição)

#### Campos a Adicionar:
- ❌ **NCM por Produto** (Nomenclatura Comum do Mercosul)
- ❌ **Preço/Valor por Produto**
- ❌ **SKU/Código Interno**
- ❌ **Categorização Detalhada**
  - Categoria Principal
  - Subcategoria
  - Tags/Keywords
- ❌ **Upload de Catálogo CSV/Excel**
  - Validação de formato
  - Preview antes de importar
  - Mapeamento de colunas

---

### ✅ STEP 3: PERFIL CLIENTE IDEAL (ICP) (Manter)
**Status:** ✅ Completo

#### Campos Atuais (Todos necessários):
- ✅ Setores Alvo
- ✅ CNAEs Alvo
- ✅ Porte Alvo
- ✅ Localização Alvo
- ✅ Faturamento Alvo
- ✅ Funcionários Alvo
- ✅ Características Especiais

**Ação:** ✅ Manter como está

---

### ✅ STEP 4: SITUAÇÃO ATUAL (Expandir)
**Status:** ✅ Existe | ⚠️ Precisa expandir

#### Campos Atuais:
- ✅ Categoria Solução
- ✅ Diferenciais
- ✅ Casos de Uso
- ✅ Ticket Médio
- ✅ Ciclo de Venda Média
- ✅ Concorrentes Diretos

#### Campos a Adicionar:
- ❌ **Sales Process** (textarea)
- ❌ **Win Rate** (% de fechamento)
- ❌ **CAC** (Customer Acquisition Cost)
- ❌ **LTV** (Lifetime Value)
- ❌ **Churn Rate** (% de cancelamento)
- ❌ **Market Position** (select: Líder, Desafiante, Seguidor, Nicho)
- ❌ **Market Share** (% de participação)

---

### ❌ STEP 5: INFORMAÇÕES TÉCNICAS E DIGITAIS (NOVO)
**Status:** ❌ Não existe | 🆕 Criar

#### Campos a Adicionar:
- ❌ **Tech Stack** (multi-select com autocomplete)
  - Frontend: React, Vue, Angular, etc.
  - Backend: Node.js, Python, Java, etc.
  - Database: PostgreSQL, MySQL, MongoDB, etc.
  - Cloud: AWS, Azure, GCP, etc.
- ❌ **CRM Atual** (select)
  - Salesforce
  - HubSpot
  - Pipedrive
  - RD Station
  - Outros
- ❌ **ERP Atual** (select)
  - SAP
  - TOTVS
  - Oracle
  - Microsoft Dynamics
  - Outros
- ❌ **Marketing Tools** (multi-select)
  - Mailchimp
  - RD Station
  - Marketo
  - Outros
- ❌ **Cloud Provider** (select)
  - AWS
  - Azure
  - Google Cloud
  - Outros
- ❌ **E-commerce Platform** (select)
  - Shopify
  - WooCommerce
  - Magento
  - Outros
- ❌ **Detecção Automática** (botão)
  - "Detectar tecnologias automaticamente" (via API)

---

### ❌ STEP 6: PRESENÇA DIGITAL (NOVO)
**Status:** ❌ Não existe | 🆕 Criar

#### Campos a Adicionar:
- ❌ **LinkedIn Company Page** (se não preenchido no Step 1)
- ❌ **Redes Sociais** (JSONB ou campos separados)
  - Facebook
  - Instagram
  - Twitter/X
  - YouTube
  - TikTok
- ❌ **Blog URL**
- ❌ **Newsletter Signup URL**
- ❌ **Contact Form URL**
- ❌ **Detecção Automática** (botão)
  - "Analisar presença digital automaticamente"
  - Calcula Domain Authority
  - Obtém Monthly Website Visitors
  - Calcula Digital Maturity Score

---

### ✅ STEP 7: HISTÓRICO E ENRIQUECIMENTO (Manter)
**Status:** ✅ Existe

#### Campos Atuais:
- ✅ Clientes Atuais
- ✅ Catálogo Produtos (upload)
- ✅ Apresentação Empresa (upload)
- ✅ Cases de Sucesso (upload)
- ✅ Analisar com IA

**Ação:** ✅ Manter como está

---

## 🗄️ MUDANÇAS NO BANCO DE DADOS

### 1. Expandir Tabela `tenants`

```sql
-- Adicionar colunas de localização
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cep VARCHAR(10),
  endereco_cidade VARCHAR(100),
  endereco_estado VARCHAR(2),
  endereco_pais VARCHAR(50) DEFAULT 'Brasil',
  coordenadas_gps POINT,
  regiao_vendas VARCHAR(50);

-- Adicionar colunas administrativas
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  data_abertura DATE,
  situacao_cadastral VARCHAR(50),
  natureza_juridica VARCHAR(100),
  capital_social DECIMAL(15,2),
  quadro_societario JSONB;

-- Adicionar colunas de presença digital
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  linkedin_company_page TEXT,
  redes_sociais JSONB DEFAULT '{}'::jsonb,
  blog_url TEXT,
  domain_authority INTEGER,
  monthly_visitors INTEGER,
  digital_maturity_score INTEGER;

-- Adicionar colunas técnicas
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  tech_stack TEXT[] DEFAULT '{}',
  crm_atual VARCHAR(100),
  erp_atual VARCHAR(100),
  marketing_tools TEXT[] DEFAULT '{}',
  cloud_provider VARCHAR(100),
  ecommerce_platform VARCHAR(100);

-- Adicionar colunas de vendas
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  sales_process TEXT,
  win_rate DECIMAL(5,2),
  cac DECIMAL(10,2),
  ltv DECIMAL(10,2),
  churn_rate DECIMAL(5,2),
  market_position VARCHAR(50),
  market_share DECIMAL(5,2);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tenants_endereco_cep ON public.tenants(endereco_cep);
CREATE INDEX IF NOT EXISTS idx_tenants_endereco_cidade ON public.tenants(endereco_cidade);
CREATE INDEX IF NOT EXISTS idx_tenants_endereco_estado ON public.tenants(endereco_estado);
CREATE INDEX IF NOT EXISTS idx_tenants_tech_stack ON public.tenants USING GIN(tech_stack);
CREATE INDEX IF NOT EXISTS idx_tenants_crm_atual ON public.tenants(crm_atual);
CREATE INDEX IF NOT EXISTS idx_tenants_erp_atual ON public.tenants(erp_atual);
```

### 2. Criar Tabela `tenant_product_catalog`

```sql
CREATE TABLE IF NOT EXISTS public.tenant_product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  descricao TEXT,
  ncm VARCHAR(10),
  preco DECIMAL(10,2),
  sku VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  especificacoes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_product_catalog_tenant_id ON public.tenant_product_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_product_catalog_ncm ON public.tenant_product_catalog(ncm);
CREATE INDEX IF NOT EXISTS idx_tenant_product_catalog_categoria ON public.tenant_product_catalog(categoria);
CREATE INDEX IF NOT EXISTS idx_tenant_product_catalog_tags ON public.tenant_product_catalog USING GIN(tags);

-- RLS
ALTER TABLE public.tenant_product_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can manage own catalog"
  ON public.tenant_product_catalog
  FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_tenant_product_catalog_updated_at
  BEFORE UPDATE ON public.tenant_product_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Expandir Step 1 (3-5 dias)
- [ ] Adicionar campos de endereço completo
- [ ] Adicionar campo LinkedIn Company Page
- [ ] Adicionar Data de Abertura
- [ ] Adicionar Situação Cadastral (select)
- [ ] Adicionar Natureza Jurídica (select)
- [ ] Adicionar Capital Social
- [ ] Integrar geocoding (coordenadas GPS)
- [ ] Validação de CEP (via API)
- [ ] Atualizar migration do banco

### FASE 2: Expandir Step 2 (5-7 dias)
- [ ] Adicionar NCM por produto
- [ ] Adicionar Preço/Valor por produto
- [ ] Adicionar SKU/Código Interno
- [ ] Adicionar Subcategoria
- [ ] Adicionar Tags/Keywords
- [ ] Implementar upload CSV/Excel
- [ ] Validação de formato CSV/Excel
- [ ] Preview antes de importar
- [ ] Mapeamento de colunas
- [ ] Validação de NCM (via API)
- [ ] Criar tabela `tenant_product_catalog`
- [ ] Atualizar migration do banco

### FASE 3: Criar Step 5 - Informações Técnicas (5-7 dias)
- [ ] Criar componente `Step5InformacoesTecnicas.tsx`
- [ ] Campo Tech Stack (multi-select com autocomplete)
- [ ] Campo CRM Atual (select)
- [ ] Campo ERP Atual (select)
- [ ] Campo Marketing Tools (multi-select)
- [ ] Campo Cloud Provider (select)
- [ ] Campo E-commerce Platform (select)
- [ ] Botão "Detectar automaticamente"
- [ ] Integração com API de detecção de tech stack
- [ ] Atualizar `OnboardingWizard.tsx` para incluir Step 5
- [ ] Atualizar migration do banco

### FASE 4: Criar Step 6 - Presença Digital (3-5 dias)
- [ ] Criar componente `Step6PresencaDigital.tsx`
- [ ] Campo LinkedIn Company Page
- [ ] Campos Redes Sociais (Facebook, Instagram, Twitter, YouTube, TikTok)
- [ ] Campo Blog URL
- [ ] Campo Newsletter Signup URL
- [ ] Campo Contact Form URL
- [ ] Botão "Analisar automaticamente"
- [ ] Integração para Domain Authority
- [ ] Integração para Monthly Visitors
- [ ] Cálculo de Digital Maturity Score
- [ ] Atualizar `OnboardingWizard.tsx` para incluir Step 6
- [ ] Atualizar migration do banco

### FASE 5: Expandir Step 4 (3-5 dias)
- [ ] Adicionar Sales Process (textarea)
- [ ] Adicionar Win Rate (%)
- [ ] Adicionar CAC (decimal)
- [ ] Adicionar LTV (decimal)
- [ ] Adicionar Churn Rate (%)
- [ ] Adicionar Market Position (select)
- [ ] Adicionar Market Share (%)
- [ ] Atualizar migration do banco

### FASE 6: Reordenar Steps (1 dia)
- [ ] Reordenar: Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
- [ ] Atualizar `ProgressBar` para 7 steps
- [ ] Testar fluxo completo

---

## 🎨 COMPONENTES A CRIAR/MODIFICAR

### Novos Componentes:
1. `src/components/onboarding/steps/Step5InformacoesTecnicas.tsx`
2. `src/components/onboarding/steps/Step6PresencaDigital.tsx`
3. `src/components/onboarding/ProductCatalogUpload.tsx` (para Step 2)
4. `src/components/onboarding/TechStackDetector.tsx` (para Step 5)
5. `src/components/onboarding/DigitalPresenceAnalyzer.tsx` (para Step 6)

### Componentes a Modificar:
1. `src/components/onboarding/steps/Step1DadosBasicos.tsx` - Adicionar campos
2. `src/components/onboarding/steps/Step2AtividadesCNAEs.tsx` - Adicionar campos e upload
3. `src/components/onboarding/steps/Step4SituacaoAtual.tsx` - Adicionar campos
4. `src/components/onboarding/OnboardingWizard.tsx` - Adicionar Steps 5 e 6

---

## 🚀 PRÓXIMO PASSO

**Começar pela FASE 1** - Expandir Step 1 com campos de localização e informações administrativas básicas.

Isso já vai melhorar significativamente o matching, pois localização é um dos fatores mais importantes para encontrar empresas similares.

---

**Última atualização:** 2025-01-19  
**Status:** 📋 Plano completo criado | ⏳ Aguardando implementação

