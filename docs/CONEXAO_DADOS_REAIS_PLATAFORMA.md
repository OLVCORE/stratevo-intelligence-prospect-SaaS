# 🔥 CONEXÃO DE TODOS OS DADOS REAIS DA PLATAFORMA

## 🎯 Objetivo

Conectar TODOS os dados reais da plataforma ao relatório ICP, eliminando completamente conteúdo genérico e hardcoded.

## ✅ Dados Reais Disponíveis na Plataforma

### 1. **Concorrentes (11 cadastrados)**
- Tabela: `onboarding_sessions.step1_data.concorrentesDiretos`
- Tabela: `onboarding_sessions.step4_data.concorrentesDiretos`
- Tabela: `icp_competitive_swot` (análise SWOT baseada em produtos)
- Dados: nome, CNPJ, setor, cidade, estado, capital social, diferencial

### 2. **Produtos do Tenant (29 produtos)**
- Tabela: `tenant_products`
- Campos: `nome` ou `product_name`, `categoria` ou `category`, `descricao` ou `description`
- 19 categorias diferentes

### 3. **Produtos dos Concorrentes (225 produtos)**
- Tabela: `tenant_competitor_products`
- Campos: `competitor_name`, `competitor_cnpj`, `nome`, `categoria`, `descricao`
- 10 concorrentes com produtos cadastrados

### 4. **Empresas de Benchmarking (6 empresas)**
- Tabela: `onboarding_sessions.step5_data.empresasBenchmarking`
- Dados: nome, setor, capital social, motivo de referência

### 5. **Clientes Atuais (1 cliente)**
- Tabela: `onboarding_sessions.step5_data.clientesAtuais`
- Dados: nome, setor, ticket médio, motivo de compra

### 6. **Diferenciais Competitivos (10 diferenciais)**
- Tabela: `onboarding_sessions.step4_data.diferenciais`
- Lista de diferenciais reais do tenant

### 7. **Análise SWOT Baseada em Produtos**
- Tabela: `icp_competitive_swot`
- Campos: `strengths`, `weaknesses`, `opportunities`, `threats`
- Calculada automaticamente baseada em produtos do tenant vs concorrentes

### 8. **Matriz BCG**
- Tabela: `icp_bcg_matrix`
- Campos: `stars`, `cash_cows`, `question_marks`, `dogs`
- Segmentação de clientes e nichos

### 9. **Tickets e Ciclos de Venda**
- Tabela: `onboarding_sessions.step4_data.ticketsECiclos`
- Dados: ticket médio, ciclo de venda, critério

## 🔧 Alterações Implementadas

### 1. **Função `fetchCompetitiveAnalysis` Expandida**
- ✅ Busca concorrentes de `step1_data` e `step4_data`
- ✅ Busca análise SWOT de `icp_competitive_swot` (prioridade) ou `competitive_analysis`
- ✅ Logs detalhados de concorrentes encontrados

### 2. **Função `fetchProductHeatmap` Expandida**
- ✅ Busca produtos do tenant (suporta `nome` ou `product_name`, `categoria` ou `category`)
- ✅ Busca produtos dos concorrentes
- ✅ Agrupa produtos por concorrente
- ✅ Logs detalhados de produtos encontrados

### 3. **Função `fetchClientBCGData` Expandida**
- ✅ Busca clientes atuais de `step5_data`
- ✅ Busca empresas de benchmarking de `step5_data`
- ✅ Busca matriz BCG de `icp_bcg_matrix`
- ✅ Calcula segmentação de clientes (highValue, mediumValue, lowValue)

### 4. **Prompt Ultra-Específico**
- ✅ Instruções OBRIGATÓRIAS sobre como usar cada dado
- ✅ Formato OBRIGATÓRIO para listar concorrentes
- ✅ Formato OBRIGATÓRIO para listar produtos
- ✅ Formato OBRIGATÓRIO para listar clientes e benchmarking
- ✅ Exemplos do que NÃO fazer vs o que fazer

### 5. **Validação Anti-Genérico**
- ✅ Detecta e REJEITA automaticamente conteúdo proibido
- ✅ Lista expandida de frases proibidas
- ✅ Relatório não é salvo se detectar conteúdo genérico

## 📊 Estrutura do ReportModel

```typescript
interface ReportModel {
  tenantCompany: { ... },
  icpProfile: { ... },
  onboardingData: {
    diferenciais: string[], // 10 diferenciais reais
    casosDeUso: string[],
    ticketsECiclos: Array<{ ... }>,
    setoresAlvo: string[],
    nichosAlvo: string[],
    // ... outros dados
  },
  competitiveAnalysis: {
    competitors: Array<{
      nome: string, // Nome REAL do concorrente
      cnpj: string,
      setor: string,
      cidade: string,
      estado: string,
      capitalSocial: number, // Valor REAL
    }>, // 11 concorrentes reais
    swotAnalysis: {
      strengths: string[],
      weaknesses: string[],
      opportunities: string[],
      threats: string[],
    },
    competitiveAdvantages: string[], // 10 diferenciais reais
  },
  productHeatmap: {
    tenantProducts: Array<{
      nome: string, // Nome REAL do produto
      categoria: string, // Categoria REAL
      descricao: string,
    }>, // 29 produtos reais
    competitorProducts: Array<{
      competitorName: string, // Nome REAL do concorrente
      competitorCnpj: string,
      produtos: Array<{
        nome: string,
        categoria: string,
      }>,
    }>, // 225 produtos de 10 concorrentes
  },
  clientBCGData: {
    clientesAtuais: Array<{
      nome: string, // Nome REAL do cliente
      setor: string,
      ticketMedio: number,
      motivoCompra: string,
    }>, // 1 cliente real (VALE S.A.)
    empresasBenchmarking: Array<{
      nome: string, // Nome REAL (GERDAU, KLABIN, etc.)
      setor: string,
      capitalSocial: number, // Valor REAL
      motivoReferencia: string,
    }>, // 6 empresas reais
    bcgMatrix: {
      stars: number,
      cashCows: number,
      questionMarks: number,
      dogs: number,
    },
    clientSegmentation: {
      highValue: number,
      mediumValue: number,
      lowValue: number,
    },
  },
  // ... outros dados
}
```

## 🚨 Regras Críticas no Prompt

1. **Se `competitiveAnalysis.competitors` existir e tiver dados:**
   - ✅ LISTAR TODOS os concorrentes REAIS
   - ❌ NUNCA escrever "faltando concorrentes" ou "sem concorrentes mapeados"

2. **Se `productHeatmap.tenantProducts` existir:**
   - ✅ LISTAR os produtos REAIS do tenant
   - ✅ Comparar com produtos REAIS dos concorrentes

3. **Se `clientBCGData.clientesAtuais` existir:**
   - ✅ MENCIONAR clientes REAIS
   - ✅ MENCIONAR empresas de benchmarking REAIS

4. **Se um dado NÃO existir:**
   - ✅ OMITIR completamente a seção
   - ❌ NÃO inventar dados
   - ❌ NÃO usar exemplos genéricos

## 🔍 Como Verificar

1. **Verificar logs da Edge Function:**
   ```
   [COMPETITIVE-ANALYSIS] ✅ Dados retornados: { competitorsCount: 11, ... }
   [PRODUCT-HEATMAP] ✅ Dados retornados: { tenantProductsCount: 29, competitorProductsCount: 225, ... }
   [CLIENT-BCG] ✅ Dados retornados: { clientesCount: 1, benchmarkingCount: 6, ... }
   ```

2. **Verificar se o relatório usa dados reais:**
   - Deve listar os 11 concorrentes REAIS (não genéricos)
   - Deve mencionar os 29 produtos REAIS do tenant
   - Deve mencionar produtos REAIS dos concorrentes
   - Deve mencionar VALE S.A. como cliente atual
   - Deve mencionar GERDAU, KLABIN, EMBRAER, WEG, JBS, KOMATSU como benchmarking

3. **Se o relatório for rejeitado:**
   - Verá erro: "LLM gerou conteúdo proibido"
   - Lista de frases proibidas detectadas
   - Relatório NÃO será salvo

## 📝 Próximos Passos

1. **Testar geração de relatório**
2. **Verificar logs** para confirmar que TODOS os dados estão sendo buscados
3. **Verificar relatório gerado** para confirmar que usa dados REAIS
4. **Se ainda houver conteúdo genérico:**
   - Verificar se a validação anti-genérico está funcionando
   - Verificar se os dados estão sendo passados corretamente no reportModel
   - Considerar adicionar mais validações

