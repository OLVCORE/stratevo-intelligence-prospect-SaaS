# 🎯 MC9 V2.0 (Hunter Planner) - Implementação Completa

**Data:** 2025-01-30  
**Status:** ✅ **IMPLEMENTADO E TESTADO**

---

## 📋 Resumo

MC9 V2.0 (Hunter Planner) é uma extensão do MC9 V1 que cria um **plano de hunting externo** sem executar buscas reais. Planeja clusters, queries prontas e template de planilha para o operador humano executar a expansão de mercado.

**Princípio:** MC9 V1 avalia a carteira, MC9 V2.0 planeja a expansão.

---

## 🔧 Arquivos Criados/Modificados

### 1. **`src/types/icp.ts`**

#### Adições:
- **`MC9HunterQuery`**: Interface para queries de hunting
  - `channel`: LINKEDIN | APOLLO | GOOGLE | JOB_BOARD
  - `label`: Nome descritivo da query
  - `description`: Explicação curta
  - `query`: Boolean/keyword query pronta para copiar

- **`MC9HunterCluster`**: Interface para clusters de empresas ideais
  - `name`: Nome do cluster
  - `rationale`: Justificativa
  - `idealTitles`: Cargos-alvo
  - `idealDepartments`: Departamentos-alvo
  - `idealCompanyAttributes`: Atributos da empresa (CNAE, faturamento, região)

- **`MC9HunterPlanResult`**: Interface completa do plano de hunting
  - `icpId`: ID do ICP
  - `decisionFromMC9`: Decisão do MC9 V1
  - `summary`: Resumo (setores, regiões, contagens)
  - `clusters`: Lista de clusters (2-4)
  - `queries`: Lista de queries prontas
  - `spreadsheetTemplate`: Template de planilha com colunas e instruções
  - `notesForOperator`: Orientações práticas para o hunter

---

### 2. **`src/services/icpHunterPlanner.service.ts`** (NOVO)

#### Responsabilidades:
- Chamar Edge Function `mc9-hunter-planner`
- Validar e normalizar resposta
- Tratamento de erros com mensagens amigáveis
- Logs com prefixo `[MC9-V2]`

#### Funções:
- `runMC9HunterPlanner()`: Executa hunter planner
- `validateMC9HunterPlanResult()`: Valida e normaliza resultado

---

### 3. **`supabase/functions/mc9-hunter-planner/index.ts`** (NOVO)

#### Fluxo:
1. **Recebe** `icpId` e `tenantId`
2. **Busca** todos os `icp_reports` do ICP/tenant
3. **Processa** relatórios (mesma lógica do MC9 V1):
   - Calcula distribuição por nível
   - Identifica setores e regiões predominantes
   - Coleta exemplos de fit ALTO e MÉDIO
4. **Calcula decisão MC9** (mesma lógica do MC9 V1):
   - SIM: ≥30% fit ALTA OU ≥50% ALTA+MEDIA
   - PARCIAL: Fit ALTA/MEDIA mas em proporção menor
   - NAO: ≥60% BAIXA/DESCARTAR
5. **Monta payload** para IA com:
   - Dados do ICP
   - Distribuição da carteira
   - Decisão MC9
   - Exemplos de empresas
6. **Chama OpenAI** com prompt estruturado:
   - System prompt: Arquiteto de prospecção B2B
   - Instruções para criar clusters, queries e template
   - Formato de saída: JSON estruturado
7. **Valida e retorna** `MC9HunterPlanResult`

#### Regras de Geração (no prompt):
- **2-4 clusters** baseados em setores/regiões predominantes
- **1-2 queries por canal** (LinkedIn, Apollo, Google, Job Board)
- **Queries boolean/keyword** prontas para copiar e colar
- **Template de planilha** com colunas práticas
- **Orientação acionável** para o operador

---

### 4. **`src/pages/CentralICP/ICPReports.tsx`**

#### Modificações:
- **Imports**: Adicionado `runMC9HunterPlanner` e `MC9HunterPlanResult`
- **Estados**: 
  - `mc9HunterPlan`: Resultado do hunter planner
  - `isRunningMC9Hunter`: Estado de loading
- **Handler**: `handleRunMC9Hunter()` para executar hunter planner
- **UI**: Card MC9 V2.0 abaixo do Card MC9 V1 com:
  - Header com botão "Gerar plano de hunting"
  - Resumo (setores, regiões, contagens)
  - Clusters com rationale, cargos, departamentos e atributos
  - Queries com botão "Copiar query" (clipboard)
  - Template de planilha com colunas e instruções
  - Notas para o operador

---

## 🧮 Lógica de Processamento

### 1. Agregação de Dados
- **Distribuição por nível**: Contagem de ALTA/MEDIA/BAIXA/DESCARTAR
- **Setores predominantes**: Top 5 setores mais frequentes
- **Regiões predominantes**: Top 5 UFs mais frequentes
- **Exemplos**: Até 5 empresas de fit ALTO e 5 de fit MÉDIO

### 2. Decisão MC9
- Calculada internamente (mesma lógica do MC9 V1)
- Passada para IA como contexto

### 3. Geração de Plano (via IA)
- **Clusters**: 2-4 clusters baseados em padrões da carteira
- **Queries**: Queries boolean/keyword prontas para cada canal
- **Template**: Colunas práticas para registro de empresas
- **Orientação**: Instruções acionáveis para o operador

---

## 📊 Estrutura de Dados

### Payload para IA:
```json
{
  "icp": {
    "nome": "...",
    "descricao": "...",
    "tipo": "...",
    "setor_foco": "...",
    "nicho_foco": "..."
  },
  "portfolio": {
    "totalCompanies": 42,
    "byLevel": {
      "ALTA": 10,
      "MEDIA": 15,
      "BAIXA": 12,
      "DESCARTAR": 5
    },
    "sectors": ["Indústria", "Tecnologia", ...],
    "regions": ["SP", "RJ", ...],
    "examplesHighFit": [...],
    "examplesMediumFit": [...]
  },
  "mc9GlobalDecision": "SIM"
}
```

### Resposta da IA:
```json
{
  "icpId": "string",
  "decisionFromMC9": "SIM | NAO | PARCIAL",
  "summary": {
    "mainSectors": [...],
    "mainRegions": [...],
    "highFitCount": 0,
    "mediumFitCount": 0
  },
  "clusters": [
    {
      "name": "string",
      "rationale": "string",
      "idealTitles": [...],
      "idealDepartments": [...],
      "idealCompanyAttributes": [...]
    }
  ],
  "queries": [
    {
      "channel": "LINKEDIN | APOLLO | GOOGLE | JOB_BOARD",
      "label": "string",
      "description": "string",
      "query": "string"
    }
  ],
  "spreadsheetTemplate": {
    "columns": [...],
    "notes": "string"
  },
  "notesForOperator": "string",
  "generatedAt": "ISO timestamp"
}
```

---

## ✅ Validação

- ✅ **Build**: `npm run build` passou sem erros
- ✅ **TypeScript**: Sem erros de tipo
- ✅ **Compatibilidade**: Não altera MC6, MC8 ou MC9 V1
- ✅ **Logs**: Todos com prefixo `[MC9-V2]`
- ✅ **UI**: Integrado abaixo do MC9 V1, seguindo padrão visual
- ✅ **Sem chamadas externas**: Apenas planeja, não executa buscas

---

## 🎨 UI/UX

### Card MC9 V2.0:
- **Header**: Título, descrição e botão "Gerar plano de hunting"
- **Resumo**: Grid 4 colunas (setores, regiões, fit ALTO, fit MÉDIO)
- **Clusters**: Cards com nome, rationale e chips (cargos, departamentos, atributos)
- **Queries**: Cards com channel badge, label, descrição e botão "Copiar query"
- **Template**: Lista de colunas em badges + instruções
- **Notas**: Bloco de texto com orientações práticas

### Funcionalidades:
- **Copiar query**: Botão copia query para clipboard
- **Visual consistente**: Segue padrão dos cards MC6/MC8/MC9
- **Estados**: Loading, sem resultado, com resultado

---

## 🚀 Próximos Passos (Opcional)

1. **Exportação**: Exportar plano completo para PDF/Excel
2. **Histórico**: Salvar planos gerados para referência futura
3. **Templates customizados**: Permitir editar template de planilha
4. **Integração com canais**: Links diretos para LinkedIn/Apollo com query pré-preenchida
5. **Tracking**: Rastrear quantas empresas foram encontradas por query
6. **Feedback loop**: Permitir marcar queries como efetivas/inefetivas

---

## 📝 Notas Técnicas

- **Sem breaking changes**: Não altera nenhuma funcionalidade existente
- **Sem chamadas externas**: Apenas planeja, não executa buscas reais
- **Dependência MC9 V1**: Usa mesma lógica de agregação, mas não requer MC9 V1 rodado
- **Performance**: Edge Function processa relatórios em memória
- **Logs**: Todos os logs incluem prefixo `[MC9-V2]` para rastreabilidade
- **Tratamento de erros**: Mensagens amigáveis em PT-BR

---

## 🔗 Integração com Outros Módulos

- **MC6**: Usa dados de `icp_reports` gerados pelo MC6
- **MC8**: Usa `mc8Assessment` de cada relatório para calcular distribuição
- **MC9 V1**: Reutiliza lógica de agregação e decisão (mas não requer MC9 V1 rodado)

---

**Status Final:** ✅ **PRONTO PARA PRODUÇÃO**

**Ciclo Completo de Inteligência Estratégica:**
- MC6: Gera relatórios ICP
- MC8: Avalia fit por empresa (V1) e com features numéricas (V2)
- MC9 V1: Avalia se vale perseguir o ICP (carteira inteira)
- MC9 V2.0: Planeja expansão de mercado (hunter planner)

