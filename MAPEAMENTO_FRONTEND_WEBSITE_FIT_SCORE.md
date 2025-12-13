# 🗺️ MAPEAMENTO FRONTEND: Website Fit Score + Produtos Extraídos

## 📋 ONDE AS INFORMAÇÕES SERÃO EXIBIDAS

### ✅ 1. MOTOR DE QUALIFICAÇÃO (`/leads/qualification-engine`)
**Arquivo:** `src/pages/QualificationEnginePage.tsx`
**Tabela:** `qualified_prospects`

#### Colunas a Adicionar:
- ✅ **Website** (coluna nova)
  - Mostrar website encontrado automaticamente ou da planilha
  - Link clicável com ícone `Globe`
  - Badge se foi encontrado automaticamente

- ✅ **Website Fit Score** (coluna nova)
  - Badge colorido: 0-5 (vermelho), 6-14 (amarelo), 15-20 (verde)
  - Tooltip mostrando produtos compatíveis encontrados

- ✅ **Produtos Compatíveis** (coluna nova ou expandida)
  - Badge com contador: "9 produtos"
  - Ao clicar, expandir mostrando lista de produtos compatíveis

- ✅ **LinkedIn** (coluna nova)
  - Link clicável com ícone `Linkedin`
  - Badge se foi encontrado automaticamente

#### Linha Expandida (já existe):
- Adicionar seção "Análise de Website":
  - Website encontrado: [link]
  - LinkedIn: [link]
  - Produtos extraídos: [lista]
  - Produtos compatíveis: [lista com match type]

---

### ✅ 2. ESTOQUE QUALIFICADO (`/leads/qualified-stock`)
**Arquivo:** `src/pages/QualifiedProspectsStock.tsx`
**Tabela:** `qualified_prospects`

#### Colunas a Adicionar:
- ✅ **Website** (coluna nova)
- ✅ **Website Fit Score** (coluna nova)
- ✅ **Produtos Compatíveis** (coluna nova)
- ✅ **LinkedIn** (coluna nova)

#### Filtros a Adicionar:
- Filtro por Website Fit Score: "0-5", "6-14", "15-20"
- Filtro por "Tem Website": Sim/Não
- Filtro por "Tem LinkedIn": Sim/Não

---

### ✅ 3. BASE DE EMPRESAS (`/companies`)
**Arquivo:** `src/pages/CompaniesManagementPage.tsx`
**Tabela:** `companies`

#### Colunas a Adicionar:
- ✅ **Website** (coluna nova)
  - Buscar de `qualified_prospects.website` ou `qualified_prospects.website_encontrado`
  - Link clicável

#### Observação:
- Se empresa veio de `qualified_prospects`, mostrar website fit score também
- Se não veio, apenas mostrar website se existir

---

### ✅ 4. QUARENTENA ICP (`/leads/icp-quarantine`)
**Arquivo:** `src/pages/Leads/ICPQuarantine.tsx`
**Tabela:** `icp_analysis_results`

#### Colunas a Adicionar:
- ✅ **Website** (coluna nova)
  - Buscar de `qualified_prospects` via CNPJ
  - Link clicável

- ✅ **Website Fit Score** (coluna nova, opcional)
  - Mostrar se empresa veio de `qualified_prospects`

#### Linha Expandida (já existe):
- Adicionar seção "Análise de Website" se disponível

---

### ✅ 5. LEADS APROVADOS (`/leads/approved`)
**Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
**Tabela:** `icp_analysis_results` (status='aprovada')

#### Colunas a Adicionar:
- ✅ **Website** (coluna nova)
- ✅ **Website Fit Score** (coluna nova)
- ✅ **LinkedIn** (coluna nova)

#### Observação:
- Empresas aprovadas devem ter website fit score alto
- Mostrar produtos compatíveis como diferencial

---

### ✅ 6. PIPELINE DE VENDAS (`/leads/pipeline`)
**Arquivo:** `src/pages/Leads/Pipeline.tsx`
**Tabela:** `sdr_deals` ou `companies` (com `deal_stage`)

#### Colunas a Adicionar:
- ✅ **Website** (coluna nova)
  - **CRÍTICO:** Website deve ser transportado para o pipeline
  - Buscar de `qualified_prospects` ou `companies.website`
  - Link clicável em cada card/linha

- ✅ **LinkedIn** (coluna nova)
  - Buscar de `qualified_prospects.linkedin_url`
  - Link clicável

#### Cards Kanban:
- Adicionar badge de Website Fit Score no card
- Mostrar produtos compatíveis no tooltip

---

## 🎨 COMPONENTES A CRIAR/MODIFICAR

### 1. Componente: `WebsiteFitScoreBadge.tsx`
```tsx
// Badge colorido mostrando score 0-20
// Verde: 15-20, Amarelo: 6-14, Vermelho: 0-5
// Tooltip com produtos compatíveis
```

### 2. Componente: `WebsiteLink.tsx`
```tsx
// Link clicável para website
// Badge "Auto" se foi encontrado automaticamente
// Ícone Globe
```

### 3. Componente: `CompatibleProductsList.tsx`
```tsx
// Lista de produtos compatíveis
// Mostrar match type (categoria, keywords, substring)
// Expandir/colapsar
```

### 4. Componente: `ProspectWebsiteAnalysis.tsx`
```tsx
// Card completo com:
// - Website encontrado
// - LinkedIn encontrado
// - Produtos extraídos
// - Produtos compatíveis
// - Website fit score
```

---

## 📊 ESTRUTURA DE DADOS

### Tabela: `qualified_prospects`
```sql
website_encontrado text          -- Website encontrado automaticamente
website_fit_score numeric(5,2)   -- Score 0-20
website_products_match jsonb      -- Array de produtos compatíveis
linkedin_url text                 -- LinkedIn encontrado
```

### Tabela: `prospect_extracted_products`
```sql
qualified_prospect_id uuid        -- FK para qualified_prospects
nome text                         -- Nome do produto extraído
categoria text                    -- Categoria
fonte text                        -- 'website' ou 'linkedin'
```

---

## 🔄 FLUXO DE DADOS

### 1. Qualificação → Estoque Qualificado
- `qualified_prospects` → Exibir todas as colunas
- Website, Fit Score, Produtos, LinkedIn

### 2. Estoque Qualificado → Base de Empresas
- Ao aprovar, copiar `website` para `companies.website`
- Website fit score pode ser mantido em `raw_data`

### 3. Base de Empresas → Pipeline
- Website deve estar em `companies.website`
- LinkedIn pode estar em `companies.raw_data.linkedin_url`

### 4. Quarentena → Pipeline
- Buscar website de `qualified_prospects` via CNPJ
- Transportar para `companies.website` ao aprovar

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Motor de Qualificação
- [ ] Adicionar coluna Website
- [ ] Adicionar coluna Website Fit Score
- [ ] Adicionar coluna Produtos Compatíveis
- [ ] Adicionar coluna LinkedIn
- [ ] Adicionar seção na linha expandida

### Estoque Qualificado
- [ ] Adicionar coluna Website
- [ ] Adicionar coluna Website Fit Score
- [ ] Adicionar coluna Produtos Compatíveis
- [ ] Adicionar coluna LinkedIn
- [ ] Adicionar filtros

### Base de Empresas
- [ ] Adicionar coluna Website
- [ ] Buscar de `qualified_prospects` se disponível

### Quarentena ICP
- [ ] Adicionar coluna Website
- [ ] Buscar de `qualified_prospects` via CNPJ

### Leads Aprovados
- [ ] Adicionar coluna Website
- [ ] Adicionar coluna Website Fit Score
- [ ] Adicionar coluna LinkedIn

### Pipeline de Vendas
- [ ] Adicionar coluna Website (CRÍTICO)
- [ ] Adicionar coluna LinkedIn
- [ ] Adicionar badge Website Fit Score nos cards
- [ ] Garantir transporte de website ao criar deal

---

## 🎯 PRIORIDADES

### ALTA PRIORIDADE:
1. ✅ Pipeline de Vendas - Website (CRÍTICO)
2. ✅ Motor de Qualificação - Todas as colunas
3. ✅ Estoque Qualificado - Todas as colunas

### MÉDIA PRIORIDADE:
4. ✅ Base de Empresas - Website
5. ✅ Leads Aprovados - Todas as colunas

### BAIXA PRIORIDADE:
6. ✅ Quarentena ICP - Website (opcional)

---

## 📝 NOTAS IMPORTANTES

1. **Website deve ser transportado para Pipeline:**
   - Ao criar deal, copiar `qualified_prospects.website` para `companies.website`
   - Ou buscar de `qualified_prospects` via CNPJ quando exibir

2. **Produtos Compatíveis:**
   - Mostrar apenas contador na tabela
   - Detalhes na linha expandida ou modal

3. **Website Fit Score:**
   - Sempre mostrar, mesmo se 0
   - Tooltip explicando o que significa

4. **LinkedIn:**
   - Mostrar apenas se encontrado
   - Link direto para perfil da empresa

