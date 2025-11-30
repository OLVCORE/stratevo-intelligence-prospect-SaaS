# 🔍 ANÁLISE COMPLETA: REGISTRO DE EMPRESAS EM PLATAFORMAS SaaS DE PRIMEIRA CLASSE

## 📊 PLATAFORMAS ANALISADAS

### Tier 1 (B2B Sales & Marketing Intelligence)
- **Apollo.io** - Sales Intelligence & Lead Generation
- **ZoomInfo** - B2B Contact Database
- **HubSpot** - CRM & Marketing Platform
- **Salesforce** - Enterprise CRM
- **LinkedIn Sales Navigator** - Social Selling Platform
- **Clearbit** - Data Enrichment Platform
- **Lusha** - B2B Contact Database

---

## 🎯 CAMPOS OBRIGATÓRIOS NO REGISTRO DE EMPRESAS

### 1. IDENTIFICAÇÃO BÁSICA (Todas as plataformas)

#### ✅ Campos Essenciais:
- **CNPJ** (Brasil) / **EIN** (EUA) / **Company Number** (UK)
- **Razão Social** / **Legal Name**
- **Nome Fantasia** / **Trade Name** / **DBA**
- **Website** / **Domain**
- **Email Corporativo**
- **Telefone Principal**

#### ⚠️ Campos Adicionais Importantes:
- **LinkedIn Company Page URL**
- **Data de Fundação**
- **Situação Cadastral** (Ativa/Inativa)
- **Natureza Jurídica**

---

### 2. LOCALIZAÇÃO E PRESENÇA GEOGRÁFICA (Crítico para Matching)

#### ✅ Campos Obrigatórios:
- **Endereço Completo** (Logradouro, Número, Complemento)
- **Bairro**
- **CEP**
- **Cidade**
- **Estado/UF**
- **País**
- **Coordenadas GPS** (Latitude/Longitude) - *Apollo.io, ZoomInfo*

#### ⚠️ Campos Avançados:
- **Região de Vendas** (Norte, Sul, Sudeste, etc.)
- **Microrregião/Mesorregião**
- **Timezone**
- **Código de Área Telefônico**

---

### 3. ATIVIDADE ECONÔMICA E CLASSIFICAÇÃO (Crítico para Matching)

#### ✅ Campos Obrigatórios:
- **CNAE Principal** (Brasil) / **SIC Code** (EUA) / **NAICS Code** (EUA)
- **CNAEs Secundários** (Array)
- **Setor Principal** (Ex: Tecnologia, Indústria, Serviços)
- **Subsetor** (Ex: Software, Hardware, Consultoria)
- **Descrição das Atividades** (Texto livre)

#### ⚠️ Campos Avançados (Apollo.io, ZoomInfo):
- **Industry Tags** (Array de tags)
- **Market Segments** (Array)
- **Product Categories** (Array)
- **Keywords** (Palavras-chave relacionadas ao negócio)

---

### 4. PORTE E DIMENSÃO DA EMPRESA (Crítico para ICP Matching)

#### ✅ Campos Obrigatórios:
- **Número de Funcionários** (Range ou número exato)
- **Faturamento Anual** (Range ou valor exato)
- **Porte** (Micro/Pequena/Média/Grande/Enterprise)
- **Capital Social**

#### ⚠️ Campos Avançados:
- **Revenue Range** (Ex: $1M-$10M)
- **Employee Growth Rate** (% ao ano)
- **Revenue Growth Rate** (% ao ano)
- **Funding Total** (Para startups)
- **Number of Locations** (Matriz + Filiais)

---

### 5. INFORMAÇÕES TÉCNICAS E DIGITAIS (Crítico para Matching Tecnológico)

#### ✅ Campos Obrigatórios:
- **Website URL**
- **Domain** (extraído do website)
- **Email Corporativo**
- **LinkedIn Company Page**

#### ⚠️ Campos Avançados (Clearbit, Apollo.io):
- **Tech Stack** (Array de tecnologias usadas)
  - Ex: ["React", "PostgreSQL", "AWS", "Stripe"]
- **CRM Atual** (Ex: Salesforce, HubSpot, Pipedrive)
- **ERP Atual** (Ex: SAP, TOTVS, Oracle)
- **Marketing Tools** (Ex: Mailchimp, Marketo)
- **E-commerce Platform** (Ex: Shopify, WooCommerce)
- **Cloud Provider** (Ex: AWS, Azure, GCP)
- **Programming Languages** (Array)
- **Frameworks** (Array)
- **Databases** (Array)
- **Analytics Tools** (Ex: Google Analytics, Mixpanel)

---

### 6. PRODUTOS E SERVIÇOS (Crítico para Matching de Oportunidades)

#### ✅ Campos Obrigatórios:
- **Catálogo de Produtos/Serviços** (Array)
  - Nome do Produto
  - Categoria
  - Descrição
  - Preço/Valor
  - NCM (Nomenclatura Comum do Mercosul) - *Brasil*
  - SKU/Código Interno

#### ⚠️ Campos Avançados:
- **Product Categories** (Array)
- **Service Offerings** (Array)
- **Target Market** (B2B, B2C, B2G)
- **Business Model** (SaaS, Marketplace, E-commerce, etc.)

---

### 7. INFORMAÇÕES ADMINISTRATIVAS E FINANCEIRAS

#### ✅ Campos Importantes:
- **Situação Cadastral** (Ativa, Suspensa, Baixada)
- **Data de Abertura**
- **Data Situação Cadastral**
- **Natureza Jurídica** (LTDA, SA, MEI, etc.)
- **Capital Social**
- **Quadro Societário** (Sócios e Participações)

#### ⚠️ Campos Avançados:
- **Credit Score** (Score de crédito)
- **Payment Behavior** (Histórico de pagamentos)
- **Financial Health Score** (Score de saúde financeira)

---

### 8. PRESENÇA DIGITAL E MARKETING (Crítico para Matching)

#### ✅ Campos Obrigatórios:
- **Website**
- **LinkedIn Company Page**
- **Email Corporativo**

#### ⚠️ Campos Avançados:
- **Social Media Profiles** (JSONB)
  - Facebook
  - Instagram
  - Twitter/X
  - YouTube
  - TikTok
- **Blog URL**
- **Newsletter Signup URL**
- **Contact Form URL**
- **Digital Maturity Score** (0-100)
- **SEO Score**
- **Domain Authority**
- **Monthly Website Visitors**
- **Social Media Followers** (Total)

---

### 9. INFORMAÇÕES DE VENDAS E MARKETING (Para Matching de Oportunidades)

#### ⚠️ Campos Avançados (HubSpot, Salesforce):
- **Sales Process** (Descrição do processo de vendas)
- **Average Deal Size** (Ticket médio)
- **Sales Cycle Length** (Duração média do ciclo)
- **Win Rate** (% de fechamento)
- **Customer Acquisition Cost (CAC)**
- **Lifetime Value (LTV)**
- **Churn Rate** (% de cancelamento)

---

### 10. INFORMAÇÕES DE COMPETIÇÃO E MERCADO

#### ⚠️ Campos Avançados:
- **Main Competitors** (Array de nomes)
- **Competitive Advantages** (Array de diferenciais)
- **Market Position** (Líder, Desafiante, Seguidor, Nicho)
- **Market Share** (% de participação)
- **Target Customers** (Descrição do cliente ideal)

---

## 🔄 COMPARAÇÃO: O QUE TEMOS vs O QUE PRECISAMOS

### ✅ O QUE JÁ TEMOS (Onboarding Atual)

#### Step 1: Dados Básicos
- ✅ CNPJ
- ✅ Razão Social
- ✅ Nome Fantasia
- ✅ Website
- ✅ Telefone
- ✅ Email
- ✅ Setor Principal
- ✅ Porte da Empresa

#### Step 2: Atividades e CNAEs
- ✅ CNAE Principal
- ✅ CNAEs Secundários
- ✅ Descrição das Atividades
- ✅ Produtos/Serviços (básico)

#### Step 3: Perfil Cliente Ideal (ICP)
- ✅ Setores Alvo
- ✅ CNAEs Alvo
- ✅ Porte Alvo
- ✅ Localização Alvo
- ✅ Faturamento Alvo
- ✅ Funcionários Alvo
- ✅ Características Especiais

#### Step 4: Situação Atual
- ✅ Categoria Solução
- ✅ Diferenciais
- ✅ Casos de Uso
- ✅ Ticket Médio
- ✅ Ciclo de Venda Média
- ✅ Concorrentes Diretos

#### Step 5: Histórico e Enriquecimento
- ✅ Clientes Atuais
- ✅ Catálogo Produtos (upload)
- ✅ Apresentação Empresa (upload)
- ✅ Cases de Sucesso (upload)

---

### ❌ O QUE ESTÁ FALTANDO (Baseado em Plataformas Tier 1)

#### 1. LOCALIZAÇÃO COMPLETA
- ❌ Endereço Completo (Logradouro, Número, Complemento, Bairro, CEP)
- ❌ Coordenadas GPS
- ❌ Região de Vendas
- ❌ Timezone

#### 2. INFORMAÇÕES TÉCNICAS/DIGITAIS
- ❌ Tech Stack (Array de tecnologias)
- ❌ CRM Atual
- ❌ ERP Atual
- ❌ Marketing Tools
- ❌ Cloud Provider
- ❌ Digital Maturity Score

#### 3. PRODUTOS/SERVIÇOS DETALHADOS
- ❌ NCM (Nomenclatura Comum do Mercosul)
- ❌ SKU/Código Interno
- ❌ Preço/Valor por produto
- ❌ Categorização detalhada
- ❌ Upload de catálogo estruturado (CSV/Excel)

#### 4. INFORMAÇÕES ADMINISTRATIVAS
- ❌ Data de Abertura
- ❌ Situação Cadastral
- ❌ Natureza Jurídica
- ❌ Capital Social
- ❌ Quadro Societário

#### 5. PRESENÇA DIGITAL COMPLETA
- ❌ LinkedIn Company Page (campo específico)
- ❌ Redes Sociais (Facebook, Instagram, Twitter, YouTube)
- ❌ Blog URL
- ❌ Domain Authority
- ❌ Monthly Website Visitors

#### 6. INFORMAÇÕES DE VENDAS
- ❌ Sales Process
- ❌ Win Rate
- ❌ CAC (Customer Acquisition Cost)
- ❌ LTV (Lifetime Value)
- ❌ Churn Rate

---

## 🎯 PRIORIZAÇÃO: O QUE IMPLEMENTAR PRIMEIRO

### 🔴 PRIORIDADE CRÍTICA (Para Matching Funcionar)

1. **Localização Completa**
   - Endereço completo (Logradouro, Número, Complemento, Bairro, CEP)
   - Coordenadas GPS (via geocoding)
   - Região de Vendas

2. **Tech Stack e Ferramentas**
   - Tech Stack (Array)
   - CRM Atual
   - ERP Atual
   - Cloud Provider

3. **Produtos/Serviços Detalhados**
   - NCM por produto
   - Preço/Valor
   - Categorização completa
   - Upload de catálogo estruturado

4. **Informações Administrativas**
   - Data de Abertura
   - Situação Cadastral
   - Natureza Jurídica
   - Capital Social

### 🟡 PRIORIDADE ALTA (Melhora Matching)

5. **Presença Digital**
   - LinkedIn Company Page (campo específico)
   - Redes Sociais
   - Domain Authority
   - Digital Maturity Score

6. **Informações de Vendas**
   - Sales Process
   - Win Rate
   - CAC/LTV

### 🟢 PRIORIDADE MÉDIA (Nice to Have)

7. **Informações de Competição**
   - Market Position
   - Market Share
   - Competitive Advantages detalhados

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Expandir Step 1 (Dados Básicos)
**Prazo: 3-5 dias**

- [ ] Adicionar campos de endereço completo
- [ ] Adicionar campo LinkedIn Company Page
- [ ] Adicionar Data de Abertura
- [ ] Adicionar Situação Cadastral
- [ ] Adicionar Natureza Jurídica
- [ ] Adicionar Capital Social
- [ ] Integrar geocoding para coordenadas GPS

### FASE 2: Expandir Step 2 (Atividades e Produtos)
**Prazo: 5-7 dias**

- [ ] Adicionar NCM por produto
- [ ] Adicionar Preço/Valor por produto
- [ ] Adicionar SKU/Código Interno
- [ ] Melhorar categorização de produtos
- [ ] Implementar upload de catálogo CSV/Excel
- [ ] Validação de NCM

### FASE 3: Novo Step 6 (Informações Técnicas)
**Prazo: 5-7 dias**

- [ ] Criar Step 6: "Informações Técnicas e Digitais"
- [ ] Campo Tech Stack (multi-select com autocomplete)
- [ ] Campo CRM Atual (select)
- [ ] Campo ERP Atual (select)
- [ ] Campo Marketing Tools (multi-select)
- [ ] Campo Cloud Provider (select)
- [ ] Integração com APIs para detectar tech stack automaticamente

### FASE 4: Novo Step 7 (Presença Digital)
**Prazo: 3-5 dias**

- [ ] Criar Step 7: "Presença Digital"
- [ ] Campo Redes Sociais (Facebook, Instagram, Twitter, YouTube)
- [ ] Campo Blog URL
- [ ] Integração para calcular Domain Authority
- [ ] Integração para obter Monthly Website Visitors
- [ ] Cálculo automático de Digital Maturity Score

### FASE 5: Expandir Step 4 (Informações de Vendas)
**Prazo: 3-5 dias**

- [ ] Adicionar Sales Process (textarea)
- [ ] Adicionar Win Rate (%)
- [ ] Adicionar CAC (Customer Acquisition Cost)
- [ ] Adicionar LTV (Lifetime Value)
- [ ] Adicionar Churn Rate (%)

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS NECESSÁRIA

### Tabela: `tenants` (Expandir)

```sql
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  -- Localização
  endereco_completo JSONB,
  coordenadas_gps POINT,
  regiao_vendas VARCHAR(50),
  
  -- Informações Administrativas
  data_abertura DATE,
  situacao_cadastral VARCHAR(50),
  natureza_juridica VARCHAR(100),
  capital_social DECIMAL(15,2),
  quadro_societario JSONB,
  
  -- Presença Digital
  linkedin_company_page TEXT,
  redes_sociais JSONB,
  blog_url TEXT,
  domain_authority INTEGER,
  monthly_visitors INTEGER,
  digital_maturity_score INTEGER,
  
  -- Informações Técnicas
  tech_stack TEXT[],
  crm_atual VARCHAR(100),
  erp_atual VARCHAR(100),
  marketing_tools TEXT[],
  cloud_provider VARCHAR(100),
  
  -- Informações de Vendas
  sales_process TEXT,
  win_rate DECIMAL(5,2),
  cac DECIMAL(10,2),
  ltv DECIMAL(10,2),
  churn_rate DECIMAL(5,2);
```

### Tabela: `tenant_product_catalog` (Nova)

```sql
CREATE TABLE IF NOT EXISTS public.tenant_product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT,
  ncm VARCHAR(10),
  preco DECIMAL(10,2),
  sku VARCHAR(100),
  especificacoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenant_product_catalog_tenant_id ON public.tenant_product_catalog(tenant_id);
CREATE INDEX idx_tenant_product_catalog_ncm ON public.tenant_product_catalog(ncm);
```

---

## 🚀 CONCLUSÃO

### O Que Temos:
✅ **60% do necessário** para matching básico funcionar

### O Que Falta:
❌ **40% crítico** para matching de primeira classe:
- Localização completa
- Tech Stack
- Produtos detalhados com NCM
- Informações administrativas
- Presença digital completa

### Próximo Passo:
**Implementar FASE 1 e FASE 2** para ter matching funcional básico, depois expandir com FASE 3-5 para matching de primeira classe.

---

**Última atualização:** 2025-01-19  
**Baseado em:** Apollo.io, ZoomInfo, HubSpot, Salesforce, Clearbit, Lusha

