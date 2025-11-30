# 📋 PLANO DE EXECUÇÃO - ICP COMPLETO

## ✅ CONFIRMAÇÕES RECEBIDAS

### 1. Análises Adicionais (Seção Configurável)
- ✅ Botão ao lado de "Gerar ICP" → abre página de critérios
- ✅ Botão "+" para adicionar novos itens de análise
- ✅ Salvar e voltar para página do ICP
- ✅ Disponível na criação/edição E na página de detalhes (para re-análise)

### 2. Relatórios
- ✅ **Página separada** só para relatórios
- ✅ Botões: "Relatório Completo" e "Resumo"
- ✅ PDF completo: capa, índice, seções, gráficos/tabelas, conclusões
- ✅ Pré-visualização antes de exportar
- ✅ Salvar no banco (por tenant E por ICP)
- ✅ Persistir na tela

### 3. Fontes de Dados
- ✅ **70+ fontes já implementadas** (`src/config/fontes.config.ts`)
- ✅ **Web search real** usando Serper API (já implementado)
- ✅ A IA deve buscar dados reais da web
- ✅ Incluir URLs das fontes encontradas
- ✅ Fortalecer averiguação de dados econômicos/financeiros

### 4. Persistência
- ✅ Por tenant E por ICP

## 🎯 MICROCICLOS DE EXECUÇÃO

### 🔵 MICROCICLO 1: Melhorar Prompt Completo
**Prioridade:** ALTA  
**Objetivo:** Expandir prompt com todas as seções do JSON + instruções para web search

**Tarefas:**
1. Expandir prompt com JSON completo (todas as seções)
2. Adicionar instruções para web search usando fontes existentes
3. Incluir campo para análises adicionais configuráveis
4. Adicionar instruções para citar URLs encontradas
5. Melhorar instruções de análise macroeconômica com fontes reais

**Arquivos a modificar:**
- `supabase/functions/analyze-onboarding-icp/index.ts`
- Criar novo arquivo: `PROMPT_ICP_360_COMPLETO.txt`

### 🔵 MICROCICLO 2: Corrigir Exibição do Relatório
**Prioridade:** ALTA  
**Objetivo:** ICP gera mas não aparece - corrigir

**Tarefas:**
1. Investigar por que o relatório não aparece
2. Corrigir exibição na página `ICPDetail.tsx`
3. Garantir que dados sejam carregados corretamente

**Arquivos a modificar:**
- `src/pages/CentralICP/ICPDetail.tsx`
- `src/components/onboarding/OnboardingWizard.tsx` (verificar fluxo)

### 🔵 MICROCICLO 3: Seção de Análises Adicionais
**Prioridade:** MÉDIA  
**Objetivo:** Interface para escolher análises adicionais

**Tarefas:**
1. Criar página `ICPAdditionalCriteria.tsx`
2. Botão ao lado de "Gerar ICP" que abre essa página
3. Interface para adicionar novos critérios (+)
4. Salvar preferências no banco
5. Integrar escolhas ao prompt

**Arquivos a criar:**
- `src/pages/CentralICP/ICPAdditionalCriteria.tsx`
- Migration para tabela `icp_additional_criteria`

**Arquivos a modificar:**
- `src/pages/CentralICP/CreateNewICP.tsx`
- `src/pages/CentralICP/ICPDetail.tsx`
- `supabase/functions/analyze-onboarding-icp/index.ts`

### 🔵 MICROCICLO 4: Visualizações e Relatórios
**Prioridade:** ALTA  
**Objetivo:** Página de relatórios com PDF completo

**Tarefas:**
1. Criar página `ICPReports.tsx`
2. Botões "Relatório Completo" e "Resumo"
3. Componente de pré-visualização
4. Implementar exportação em PDF (usar biblioteca como `jspdf` ou `react-pdf`)
5. Salvar relatórios no banco (por tenant + ICP)
6. Persistir na tela

**Arquivos a criar:**
- `src/pages/CentralICP/ICPReports.tsx`
- `src/components/icp/ICPReportViewer.tsx`
- `src/components/icp/ICPReportPDF.tsx`
- Migration para tabela `icp_reports`

**Arquivos a modificar:**
- `src/pages/CentralICP/ICPDetail.tsx` (adicionar link para relatórios)
- `src/App.tsx` (adicionar rota)

## 📊 ESTRUTURA DO JSON EXPANDIDO

```json
{
  "icp_profile": { /* ... */ },
  "analise_detalhada": {
    "resumo_executivo": "...",
    "analise_macroeconomica": {
      "crescimento_setor": "...",
      "tendencias": [...],
      "projecoes": "...",
      "dados_ibge": "...",
      "fontes_consultadas": [
        {
          "nome": "IBGE",
          "url": "https://...",
          "dados_relevantes": "..."
        }
      ]
    },
    "analise_estatistica_clientes": { /* ... */ },
    "analise_cnaes_ncms": { /* ... */ },
    "analise_comercio_exterior": { /* ... */ },
    "analise_competitiva": { /* ... */ },
    "previsoes": { /* ... */ },
    "justificativa": "..."
  },
  "score_confianca": 85,
  "analises_adicionais": [
    {
      "criterio": "Análise de tecnologias",
      "resultado": "...",
      "fontes": [...]
    }
  ]
}
```

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Nova tabela: `icp_additional_criteria`
```sql
CREATE TABLE public.icp_additional_criteria (
  id UUID PRIMARY KEY,
  icp_profile_id UUID REFERENCES icp_profiles_metadata(id),
  tenant_id UUID REFERENCES tenants(id),
  criterio_nome TEXT NOT NULL,
  criterio_descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Nova tabela: `icp_reports`
```sql
CREATE TABLE public.icp_reports (
  id UUID PRIMARY KEY,
  icp_profile_id UUID REFERENCES icp_profiles_metadata(id),
  tenant_id UUID REFERENCES tenants(id),
  tipo TEXT NOT NULL, -- 'completo' | 'resumo'
  conteudo JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **MICROCICLO 1** - Melhorar prompt (permite gerar relatórios melhores)
2. **MICROCICLO 2** - Corrigir exibição (problema crítico atual)
3. **MICROCICLO 3** - Análises adicionais (melhora funcionalidade)
4. **MICROCICLO 4** - Relatórios PDF (completa funcionalidade)

## ⏱️ ESTIMATIVA

- **Microciclo 1**: 1-2 horas
- **Microciclo 2**: 30min - 1 hora
- **Microciclo 3**: 2-3 horas
- **Microciclo 4**: 3-4 horas

**Total estimado**: 6-10 horas

