# 🧠 Estratégia Inteligente para Motor de Busca Avançada

## 📊 Análise: Como Grandes Plataformas Fazem

### Apollo.io / ZoomInfo / LinkedIn Sales Navigator

**Estratégia em Fases:**

1. **ICP Matching First** - Priorizam empresas que batem com o ICP do cliente
2. **Multi-Source Aggregation** - Combinam dados de múltiplas fontes
3. **Intelligent Scoring** - Score baseado em múltiplos fatores
4. **Progressive Enrichment** - Enriquecimento em camadas (dados básicos → contatos → decisores)
5. **Deduplication** - Remoção inteligente de duplicatas
6. **Ranking Inteligente** - Ordenação por relevância + fit score

## 🎯 Nossa Estratégia: Pipeline em 7 Fases

### **FASE 1: Carregar ICP do Tenant** ⚡
- Buscar dados do ICP ativo do tenant
- Extrair: setores, nichos, CNAEs, critérios (porte, faturamento, funcionários, localização)
- Se não houver ICP, usar apenas filtros do formulário

### **FASE 2: Combinar Filtros (ICP + Formulário)** 🔀
- **Prioridade 1:** Filtros do formulário (mais específicos)
- **Prioridade 2:** Dados do ICP (fallback se formulário vazio)
- **Estratégia:** Intersecção inteligente (AND lógico para critérios obrigatórios)

### **FASE 3: Busca Multi-Fonte (Paralela)** 🔍
Buscar em paralelo usando múltiplas estratégias:

**3.1. EmpresaQui (Primária)**
- Por CNAE (se ICP tem CNAEs)
- Por segmento (se ICP tem setores)
- Por localização (cidade/estado)
- Por porte (micro/pequena/média/grande)

**3.2. BrasilAPI/ReceitaWS (Fallback)**
- Busca por CNAE principal
- Validação de CNPJ
- Dados cadastrais oficiais

**3.3. Apollo (Enriquecimento)**
- Busca por domínio (se tiver site)
- Decisores e contatos

**3.4. Hunter.io (E-mails)**
- Busca por domínio
- E-mails corporativos

### **FASE 4: Classificação e Scoring** 📊
Para cada empresa encontrada:

**4.1. Classificação Automática**
- Classificar por CNAE → Setor/Nicho
- Usar `classifyCompanyByCNAE()` existente

**4.2. ICP Match Score**
- Calcular score usando `calculateICPMatch()`
- Pontos:
  - Setor match: +30
  - Nicho match: +30
  - CNAE match: +20
  - Setor relacionado: +10
  - Critérios (porte, faturamento, funcionários): +10

**4.3. Relevância Score**
- Dados completos: +20
- Tem site: +10
- Tem LinkedIn: +10
- Tem decisores: +15
- Tem e-mails: +10

**Score Final = ICP Match (0-100) + Relevância (0-65)**

### **FASE 5: Deduplicação Inteligente** 🔄
- Agrupar por CNPJ (14 dígitos)
- Se sem CNPJ, agrupar por domínio (site)
- Se sem site, agrupar por nome similar (fuzzy match)
- Manter o registro com maior score

### **FASE 6: Filtragem e Validação** ✅
- Remover empresas sem CNPJ válido (14 dígitos) OU sem nome + site
- Remover empresas com `situacao_cadastral != 'ATIVA'`
- Aplicar filtros de faturamento/funcionários
- Aplicar filtros de localização

### **FASE 7: Ordenação e Paginação** 📄
- Ordenar por: Score Total (DESC) → ICP Match (DESC) → Relevância (DESC)
- Aplicar paginação (page, pageSize)
- Retornar top N empresas

## 🔧 Implementação Técnica

### Arquitetura

```
Edge Function (prospeccao-avancada-buscar)
├── Fase 1: loadTenantICP()
├── Fase 2: combineFilters()
├── Fase 3: searchMultiSource() [Paralelo]
│   ├── searchEmpresaQui()
│   ├── searchBrasilAPI()
│   └── searchApollo() [Opcional]
├── Fase 4: classifyAndScore()
│   ├── classifyCompany()
│   └── calculateICPMatch()
├── Fase 5: deduplicate()
├── Fase 6: filterAndValidate()
└── Fase 7: sortAndPaginate()
```

### Novas Funções Necessárias

1. **`loadTenantICP(tenantId)`**
   - Busca dados do ICP do tenant
   - Retorna: setores, nichos, CNAEs, critérios

2. **`combineFilters(icpData, formFilters)`**
   - Combina ICP + formulário
   - Prioriza formulário, usa ICP como fallback

3. **`searchEmpresaQuiByICP(filtros, icpData)`**
   - Busca otimizada usando dados do ICP
   - Múltiplas queries paralelas (CNAE, setor, localização)

4. **`classifyAndScoreCompany(empresa, icpData)`**
   - Classifica empresa
   - Calcula ICP match score
   - Calcula relevância score
   - Retorna score total

5. **`deduplicateCompanies(empresas)`**
   - Agrupa por CNPJ/domínio/nome
   - Mantém melhor registro

## 📈 Melhorias vs. Implementação Atual

| Aspecto | Atual | Nova Estratégia |
|---------|-------|----------------|
| **Uso de ICP** | ❌ Não usa | ✅ Usa ICP do tenant |
| **Scoring** | ❌ Sem scoring | ✅ Score ICP + Relevância |
| **Ordenação** | ❌ Sem ordem | ✅ Ordenado por score |
| **Busca** | ⚠️ Genérica | ✅ Personalizada por ICP |
| **Deduplicação** | ⚠️ Básica | ✅ Inteligente (CNPJ/domínio/nome) |
| **Validação** | ✅ Sim | ✅ Melhorada |

## 🚀 Próximos Passos

1. ✅ Criar documento de estratégia (este arquivo)
2. ⏳ Implementar `loadTenantICP()` na Edge Function
3. ⏳ Implementar `combineFilters()`
4. ⏳ Refatorar `buscarViaEmpresaQui()` para usar ICP
5. ⏳ Implementar `classifyAndScoreCompany()`
6. ⏳ Implementar `deduplicateCompanies()`
7. ⏳ Atualizar ordenação final
8. ⏳ Testar com tenant real

## 📝 Notas Importantes

- **Backward Compatible:** Se tenant não tem ICP, funciona como antes (só filtros do formulário)
- **Performance:** Buscas paralelas para não bloquear
- **Custo:** Usar APIs de forma inteligente (não fazer chamadas desnecessárias)
- **Qualidade:** Priorizar empresas com maior fit ao ICP

