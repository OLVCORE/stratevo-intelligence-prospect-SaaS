# 🎯 MC9 V1 (Self-Prospecting Engine) - Implementação Completa

**Data:** 2025-01-30  
**Status:** ✅ **IMPLEMENTADO E TESTADO**

---

## 📋 Resumo

MC9 V1 é um motor de auto-prospecção que avalia se vale a pena perseguir um ICP como prioridade, com base na distribuição de empresas já analisadas (via MC8). Diferente do MC8 que pensa por empresa, o MC9 pensa pela carteira inteira.

**Princípio:** MC8 pensa por empresa, MC9 pensa pela carteira inteira.

---

## 🔧 Arquivos Criados/Modificados

### 1. **`src/types/icp.ts`**

#### Adições:
- **`MC9GlobalDecision`**: Tipo para decisão global (SIM/NAO/PARCIAL)
- **`MC9TargetLead`**: Interface para alvos prioritários
- **`MC9SelfProspectingResult`**: Interface completa do resultado MC9
  - `decision`: Decisão global
  - `confidence`: Confiança (0-1)
  - `rationale`: Justificativa
  - `summary`: Resumo da carteira (distribuição por nível, setores, regiões)
  - `topTargets`: Lista de alvos prioritários (top 20)
  - `scripts`: Scripts de abordagem por cluster (ALTO/MÉDIO)

---

### 2. **`src/services/icpSelfProspecting.service.ts`** (NOVO)

#### Responsabilidades:
- Chamar Edge Function `mc9-self-prospecting`
- Validar e normalizar resposta
- Tratamento de erros com mensagens amigáveis
- Logs com prefixo `[MC9]`

#### Funções:
- `runMC9SelfProspecting()`: Executa avaliação MC9
- `validateMC9Result()`: Valida e normaliza resultado da Edge Function

---

### 3. **`supabase/functions/mc9-self-prospecting/index.ts`** (NOVO)

#### Fluxo:
1. **Recebe** `icpId` e `tenantId`
2. **Busca** todos os `icp_reports` do ICP/tenant
3. **Processa** cada relatório:
   - Extrai `mc8Assessment` de `report_data`
   - Conta distribuição por nível (ALTA/MEDIA/BAIXA/DESCARTAR)
   - Identifica setores e regiões predominantes
   - Monta lista de top targets (priorizando ALTA depois MEDIA, ordenado por confidence)
4. **Monta payload** para IA com:
   - Dados do ICP
   - Distribuição da carteira
   - Setores/regiões predominantes
   - Amostras de empresas de fit ALTO e MÉDIO
   - Top targets calculados
5. **Chama OpenAI** com prompt estruturado:
   - System prompt: Instruções para estrategista de prospecção B2B
   - User prompt: Dados do ICP e carteira
   - Formato de saída: JSON estruturado
6. **Valida e mescla** resultado:
   - Usa top targets calculados (não os da IA, para garantir IDs corretos)
   - Mescla scripts gerados pela IA
   - Retorna `MC9SelfProspectingResult`

#### Regras de Decisão (no prompt):
- **SIM**: ≥30% fit ALTA OU ≥50% ALTA+MEDIA
- **PARCIAL**: Fit ALTA/MEDIA mas em proporção menor, ou potencial com restrições
- **NAO**: ≥60% BAIXA/DESCARTAR ou dados insuficientes

---

### 4. **`src/pages/CentralICP/ICPReports.tsx`**

#### Modificações:
- **Imports**: Adicionado `runMC9SelfProspecting` e `MC9SelfProspectingResult`
- **Estados**: 
  - `mc9Result`: Resultado do MC9
  - `isRunningMC9`: Estado de loading
- **Handler**: `handleRunMC9()` para executar MC9
- **UI**: Card MC9 abaixo do Card MC8 com:
  - Header com botão "Rodar MC9"
  - Decisão global e confiança
  - Rationale (justificativa)
  - Resumo da carteira (distribuição por nível)
  - Setores e regiões predominantes (badges)
  - Top alvos recomendados (lista com até 10 empresas)
  - Scripts de abordagem (ALTO e MÉDIO)

---

## 🧮 Lógica de Processamento

### 1. Agregação de Dados
- **Total de relatórios**: Contagem de `icp_reports` do ICP/tenant
- **Distribuição por nível**: Contagem de ALTA/MEDIA/BAIXA/DESCARTAR
- **Setores predominantes**: Top 5 setores mais frequentes
- **Regiões predominantes**: Top 5 UFs mais frequentes

### 2. Top Targets
- **Filtro**: Apenas empresas com fit ALTA ou MEDIA
- **Ordenação**: 
  1. ALTA primeiro
  2. Depois por confidence (maior primeiro)
- **Limite**: Top 20 alvos

### 3. Decisão Global (via IA)
- Baseada em distribuição da carteira
- Considera proporções e contexto do ICP
- Gera scripts específicos por cluster

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
    "sampleHighFit": [...],
    "sampleMediumFit": [...]
  },
  "topTargets": [...]
}
```

### Resposta da IA:
```json
{
  "decision": "SIM | NAO | PARCIAL",
  "confidence": 0.0-1.0,
  "rationale": "explicação em texto corrido",
  "summary": {
    "totalCompanies": 0,
    "byLevel": {...},
    "mainSectors": [...],
    "mainRegions": [...]
  },
  "topTargets": [...],
  "scripts": {
    "highFitScript": "...",
    "mediumFitScript": "..."
  },
  "generatedAt": "ISO timestamp"
}
```

---

## ✅ Validação

- ✅ **Build**: `npm run build` passou sem erros
- ✅ **TypeScript**: Sem erros de tipo
- ✅ **Compatibilidade**: Não quebra MC6/MC8 existentes
- ✅ **Logs**: Todos com prefixo `[MC9]`
- ✅ **UI**: Integrado abaixo do MC8, seguindo padrão visual

---

## 🎨 UI/UX

### Card MC9:
- **Header**: Título, descrição e botão "Rodar MC9"
- **Decisão**: Badge com decisão global e confiança
- **Rationale**: Texto explicativo
- **Resumo**: Grid 3 colunas (carteira, setores, regiões)
- **Top Alvos**: Lista de até 10 empresas com badges de nível
- **Scripts**: Dois blocos de texto (ALTO e MÉDIO) com background destacado

### Estados:
- **Sem resultado**: Mensagem para rodar MC9
- **Loading**: Botão desabilitado com spinner
- **Com resultado**: Exibe todos os dados

---

## 🚀 Próximos Passos (Opcional)

1. **Persistência**: Salvar resultado MC9 em `icp_profiles_metadata` ou tabela dedicada
2. **Histórico**: Mostrar histórico de execuções MC9
3. **Exportação**: Exportar top targets para CSV/Excel
4. **Integração CRM**: Enviar top targets diretamente para pipeline
5. **Filtros**: Permitir filtrar top targets por setor/região
6. **Atualização automática**: Re-executar MC9 quando novos relatórios forem gerados

---

## 📝 Notas Técnicas

- **Sem breaking changes**: Não altera nenhuma funcionalidade existente
- **Dependência MC8**: MC9 funciona melhor quando há MC8 rodado, mas não é obrigatório
- **Performance**: Edge Function processa relatórios em memória (adequado para até ~1000 relatórios)
- **Logs**: Todos os logs incluem prefixo `[MC9]` para rastreabilidade
- **Tratamento de erros**: Mensagens amigáveis em PT-BR

---

## 🔗 Integração com Outros Módulos

- **MC6**: Usa dados de `icp_reports` gerados pelo MC6
- **MC8**: Usa `mc8Assessment` de cada relatório
- **Base de Empresas**: Extrai dados de empresas dos `report_data`

---

**Status Final:** ✅ **PRONTO PARA PRODUÇÃO**

**Ciclo Completo:**
- MC6: Gera relatórios ICP
- MC8: Avalia fit por empresa
- MC9: Avalia se vale perseguir o ICP (carteira inteira)

