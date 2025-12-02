# 🚀 Pipeline de Implementações Pendentes

Este documento rastreia os itens críticos do pipeline que ainda precisam ser implementados.

## 📋 Itens Pendentes

### 1. 🔄 Criar Algoritmo de Matching
**Status:** Pendente  
**Prioridade:** Alta  
**Descrição:** Algoritmo para fazer matching entre empresas do banco de dados e o ICP configurado, calculando scores de fit.  
**Localização:** 
- Edge Function: `supabase/functions/match-companies-icp/`
- Componente Frontend: `src/components/qualification/MatchingEngine.tsx`
- Tabela: `icp_analysis_results` (já existe)

**Requisitos:**
- Calcular score baseado nos critérios do ICP (setores, nichos, CNAEs, porte, localização, faturamento, funcionários)
- Considerar pesos configuráveis por tenant
- Retornar score de 0-100
- Classificar como HOT/WARM/COLD baseado no score

---

### 2. ⏳ Busca Concorrentes/Fornecedores SERPER
**Status:** Pendente  
**Prioridade:** Média  
**Descrição:** Sistema para buscar automaticamente concorrentes e fornecedores usando SERPER API, baseado nos dados do tenant e ICP.  
**Localização:**
- Edge Function: `supabase/functions/search-competitors-suppliers/`
- Componente Frontend: `src/components/icp/CompetitorSupplierDiscovery.tsx`
- Integração: Já existe `serper-search` Edge Function (pode ser reutilizada)

**Requisitos:**
- Buscar concorrentes baseado em setores, nichos e CNAEs do ICP
- Buscar fornecedores relacionados aos produtos do tenant
- Filtrar resultados por localização (se configurado)
- Salvar resultados em tabela dedicada
- Permitir aprovação/rejeição manual

---

### 3. ⏳ Criar Mapa de Calor por Produto
**Status:** Pendente  
**Prioridade:** Alta  
**Descrição:** Visualização de mapa de calor (heatmap) mostrando o fit de cada produto do tenant com empresas prospectadas.  
**Localização:**
- Componente Frontend: `src/components/icp/ProductHeatMap.tsx`
- Edge Function: `supabase/functions/calculate-product-fit/`
- Tabela: `product_fit_analysis` (já existe parcialmente)

**Requisitos:**
- Matriz de produtos (tenant) vs empresas (prospects)
- Cores indicando nível de fit (verde = alto, amarelo = médio, vermelho = baixo)
- Filtros por produto, empresa, score mínimo
- Exportação para Excel/PDF
- Integração com tabela de qualificação

---

## 📊 Progresso Geral

| Item | Status | Prioridade | Estimativa |
|------|--------|------------|------------|
| Algoritmo de Matching | ⏳ Pendente | Alta | 3-5 dias |
| Busca SERPER | ⏳ Pendente | Média | 2-3 dias |
| Mapa de Calor | ⏳ Pendente | Alta | 4-6 dias |

---

## 🔗 Dependências

- **Algoritmo de Matching** → Depende de: `qualification_config`, `icp_profiles_metadata`, `companies`
- **Busca SERPER** → Depende de: `serper-search` Edge Function, `tenant_products`, `icp_profiles_metadata`
- **Mapa de Calor** → Depende de: `product_fit_analysis`, `tenant_products`, `icp_analysis_results`

---

## 📝 Notas

- Todos os itens devem ser implementados com testes unitários
- Documentação técnica deve ser atualizada após cada implementação
- UI/UX deve seguir o padrão visual estabelecido (mesma formatação de cards, etc.)

---

**Última atualização:** 2025-01-XX  
**Responsável:** Equipe de Desenvolvimento

