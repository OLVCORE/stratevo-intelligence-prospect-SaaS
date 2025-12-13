# 🚨 CORREÇÕES CRÍTICAS URGENTES

## PROBLEMAS IDENTIFICADOS

### 1. ❌ COLUNAS DE WEBSITE NÃO APARECEM
**Status:** Parcialmente corrigido (apenas Estoque Qualificado)
**Arquivos afetados:**
- ✅ `src/pages/QualifiedProspectsStock.tsx` - CORRIGIDO
- ❌ `src/pages/Leads/ApprovedLeads.tsx` - PENDENTE
- ❌ `src/pages/Leads/ICPQuarantine.tsx` - PENDENTE  
- ❌ `src/pages/CompaniesManagementPage.tsx` - PENDENTE

**Colunas necessárias:**
- `website_encontrado` (link clicável)
- `website_fit_score` (badge com pontos)
- `linkedin_url` (link clicável)

### 2. ❌ CAMPO "ORIGEM" MOSTRA "Legacy" AO INVÉS DO NOME DO ARQUIVO
**Problema:** `source_name` não está sendo salvo em `qualified_prospects`
**Solução:** Função SQL atualizada para salvar `v_job.source_file_name` em `source_name`
**Arquivo:** `APLICAR_FUNCAO_PROCESS_QUALIFICATION_JOB_SNIPER.sql` - ATUALIZADO

### 3. ❌ FIT SCORE INCONSISTENTE COM GRADE
**Problema:** Mostra 35% mas grade é A (deveria ser D)
**Causa possível:** `enrichment?.fit_score` sobrescrevendo `prospect.fit_score` incorretamente
**Arquivo:** `src/pages/QualifiedProspectsStock.tsx` - VERIFICAR LÓGICA

### 4. ❌ APENAS 5 DE 10 EMPRESAS APARECEM
**Problema:** Upload de 10 empresas, apenas 5 aparecem
**Causa:** Verificar query e filtros
**Arquivo:** `src/pages/QualifiedProspectsStock.tsx` - VERIFICAR FILTROS

### 5. ❌ ENRIQUECIMENTO EM MASSA USA METODOLOGIA ANTIGA
**Problema:** Botão "Enriquecer Selecionadas" não usa website fit score
**Arquivo:** `src/components/qualification/QualifiedStockActionsMenu.tsx` - ATUALIZAR

### 6. ❌ ENRIQUECIMENTO INDIVIDUAL USA METODOLOGIA ANTIGA
**Problema:** Dropdown de enriquecimento individual não usa nova metodologia
**Arquivo:** Verificar componentes de enriquecimento individual

## AÇÕES NECESSÁRIAS

1. ✅ Adicionar colunas website em QualifiedProspectsStock.tsx
2. ⏳ Adicionar colunas website em ApprovedLeads.tsx
3. ⏳ Adicionar colunas website em ICPQuarantine.tsx
4. ⏳ Adicionar colunas website em CompaniesManagementPage.tsx
5. ✅ Atualizar função SQL para salvar source_name
6. ⏳ Corrigir lógica de grade vs fit_score
7. ⏳ Investigar por que apenas 5 empresas aparecem
8. ⏳ Atualizar enriquecimento em massa
9. ⏳ Atualizar enriquecimento individual

