# 🚀 CICLOS 4 E 5: Preparação para IBGE e Cross-Matching CNAE

## ✅ RESUMO DO QUE FOI IMPLEMENTADO

### 1. **Filtros Adicionados em Todas as Tabelas**
- ✅ **ICP**: Filtro por nome do ICP
- ✅ **Fit Score**: Filtro por faixas (90-100, 75-89, 60-74, 40-59, 0-39)
- ✅ **Grade**: Filtro por grade (A+, A, B, C, D, Sem Grade)

**Tabelas atualizadas:**
- ✅ Empresas Qualificadas (`QualifiedProspectsStock.tsx`)
- ✅ Base de Empresas (`CompaniesManagementPage.tsx`)
- ✅ Quarentena (`ICPQuarantine.tsx`)
- ✅ Aprovadas (`ApprovedLeads.tsx`)

### 2. **Migração de Dados de Qualificação**
- ✅ `fit_score`, `grade`, `icp_id` e `source_name` são salvos em `raw_data` durante a migração
- ✅ Dados são preservados e exibidos corretamente em todas as páginas
- ✅ Leitura corrigida para buscar de `raw_data` primeiro

### 3. **Correções de Erro 400**
- ✅ Payload simplificado para incluir apenas campos que existem na tabela
- ✅ `raw_data` formatado corretamente como JSONB
- ✅ Logs detalhados para debug

---

## 📋 PRÓXIMOS PASSOS

### **CICLO 4: Integração IBGE para Classificação de Setor**

#### Objetivo:
Classificar automaticamente o setor das empresas usando a API do IBGE baseado no CNAE principal.

#### Implementação:

1. **Criar serviço IBGE** (`src/services/ibge.service.ts`):
   ```typescript
   // Buscar classificação de setor pelo CNAE
   export async function classificarSetorIBGE(cnae: string): Promise<{
     setor_ibge: string;
     divisao: string;
     secao: string;
     descricao: string;
   }>
   ```

2. **Integrar no fluxo de qualificação**:
   - Durante o enriquecimento, buscar classificação IBGE
   - Salvar em `raw_data.setor_ibge`
   - Usar para melhorar o cálculo de Fit Score

3. **Exibir na interface**:
   - Adicionar coluna "Setor IBGE" nas tabelas
   - Tooltip com detalhes da classificação

#### Endpoint IBGE:
- `https://servicodados.ibge.gov.br/api/v2/cnae/classes/{cnae}`

---

### **CICLO 5: Cross-Matching de CNAEs com IA**

#### Objetivo:
Usar IA para identificar CNAEs complementares e sugerir aderência de produtos.

#### Implementação:

1. **Criar serviço de cross-matching** (`src/services/cnaeCrossMatch.service.ts`):
   ```typescript
   // Analisar CNAEs e sugerir produtos/serviços
   export async function crossMatchCNAE(cnaes: string[]): Promise<{
     produtos_sugeridos: string[];
     cnaes_complementares: string[];
     score_aderencia: number;
     razao: string;
   }>
   ```

2. **Integrar no fluxo de qualificação**:
   - Durante o enriquecimento, analisar CNAEs da empresa
   - Buscar CNAEs complementares
   - Calcular score de aderência de produtos
   - Salvar em `raw_data.cnae_analysis`

3. **Exibir na interface**:
   - Badge com produtos sugeridos
   - Score de aderência
   - Lista de CNAEs complementares

#### Modelo de IA:
- Usar OpenAI/Anthropic para análise semântica de CNAEs
- Treinar modelo com histórico de vendas (se disponível)
- Fallback para regras baseadas em similaridade de CNAEs

---

## 🔧 ESTRUTURA DE ARQUIVOS NECESSÁRIA

```
src/
├── services/
│   ├── ibge.service.ts          # ✅ CRIAR
│   └── cnaeCrossMatch.service.ts # ✅ CRIAR
├── components/
│   └── qualification/
│       ├── IBGESectorBadge.tsx  # ✅ CRIAR
│       └── CNAECrossMatchCard.tsx # ✅ CRIAR
└── pages/
    └── Leads/
        └── QualifiedProspectsStock.tsx # ✅ ATUALIZAR
```

---

## 📊 DADOS A SEREM ARMAZENADOS

### Em `raw_data`:
```json
{
  "setor_ibge": {
    "codigo": "25",
    "divisao": "Fabricação de produtos de metal",
    "secao": "Indústria de transformação",
    "descricao": "Fabricação de produtos de metal, exceto máquinas e equipamentos"
  },
  "cnae_analysis": {
    "cnaes_complementares": ["2511000", "2512800"],
    "produtos_sugeridos": ["ERP", "Sistema de Gestão"],
    "score_aderencia": 85,
    "razao": "Empresas do setor de metalurgia frequentemente utilizam sistemas ERP"
  }
}
```

---

## 🎯 PRIORIDADES

1. **CICLO 4 (IBGE)** - Implementar primeiro (mais simples, API pública)
2. **CICLO 5 (Cross-Matching)** - Implementar depois (requer IA/configuração)

---

## ⚠️ NOTAS IMPORTANTES

- Os dados de qualificação (`fit_score`, `grade`, `icp_id`) já estão sendo salvos corretamente em `raw_data`
- A migração está funcionando para algumas empresas (veja logs de sucesso)
- Erros 400 podem estar relacionados a dados específicos - verificar logs detalhados
- Filtros estão funcionando em todas as 4 tabelas

---

## 🚀 PRÓXIMA AÇÃO

Aguardando confirmação para iniciar **CICLO 4** (Integração IBGE).

