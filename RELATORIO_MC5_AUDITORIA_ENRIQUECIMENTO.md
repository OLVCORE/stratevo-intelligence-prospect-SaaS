# 🔍 MC-5: AUDITORIA SILENCIOSA - ENRIQUECIMENTO TOTAL

## 📋 MAPEAMENTO COMPLETO (SEM ALTERAÇÕES)

### 1. ONDE CNAE É ENRIQUECIDO

#### **A) Receita Federal Service (`src/services/receitaFederal.ts`)**
- **Linha 180**: Extrai `cnaePrincipal` de `merged.atividade_principal?.[0]?.code`
- **Linha 191**: Persiste em `saveQualifiedEnrichment` com `cnae_principal: cnaePrincipal`
- **Status**: ✅ Persiste corretamente quando `saveEnrichment: true`

#### **B) QualifiedProspectsStock (`src/pages/QualifiedProspectsStock.tsx`)**
- **Linha 2160**: Extrai CNAE de `data.atividade_principal?.[0]?.code`
- **Linha 2169**: Salva em `enrichment_data.cnae_fiscal`
- **Linha 2173**: **PROBLEMA POTENCIAL**: Comentário diz "NÃO passar setor no updateData - deixar o TRIGGER calcular"
- **Status**: ⚠️ CNAE é extraído mas pode não estar sendo persistido em `cnae_principal` diretamente

#### **C) Edge Function `enrich-receita-federal`**
- **Linha 166**: Atualiza `cnae: enrichedData.cnae_fiscal`
- **Status**: ✅ Funciona para `suggested_companies`

---

### 2. ONDE DADOS DA RECEITA SÃO PERSISTIDOS

#### **A) `qualified_prospects` via `saveQualifiedEnrichment`**
- **Arquivo**: `src/services/qualifiedEnrichment.service.ts`
- **Status**: ✅ Persiste quando chamado com `saveEnrichment: true`

#### **B) `companies.raw_data`**
- **Arquivo**: `src/components/qualification/LeadsQualificationTable.tsx` (linha 437-461)
- **Status**: ✅ Persiste `receita_federal` em `raw_data`

#### **C) `qualified_prospects.enrichment_data`**
- **Arquivo**: `src/pages/QualifiedProspectsStock.tsx` (linha 2164-2171)
- **Status**: ✅ Persiste `receita_federal` em `enrichment_data`

---

### 3. ONDE WEBSITE SCAN GRAVA RESULTADOS

#### **A) Edge Function `scan-prospect-website`**
- **Linha 913**: Atualiza `website_encontrado`
- **Linha 920**: Atualiza `website_fit_score`
- **Linha 924**: Atualiza `website_products_match`
- **Linha 901**: Atualiza `linkedin_url`
- **Linha 937-943**: Atualiza `enrichment_data.matching_metadata`
- **Status**: ✅ Persiste todos os campos quando `qualified_prospect_id` existe

#### **B) Frontend `ApprovedLeads.tsx`**
- **Linha 1344-1352**: Atualiza `icp_analysis_results` após scan
- **Status**: ✅ Persiste corretamente

#### **C) Frontend `QualifiedProspectsStock.tsx`**
- **Linha 2055-2084**: Chama Edge Function e aguarda sincronização
- **Status**: ✅ Usa `supabase.functions.invoke()` (evita CORS)

---

### 4. ONDE ENRICHMENT FALHA SILENCIOSAMENTE

#### **A) CORS Bloqueando Edge Functions**
- **Erro**: `Response to preflight request doesn't pass access control check: It does not have HTTP ok status`
- **Arquivo**: `supabase/functions/scan-prospect-website/index.ts`
- **Linha 28-34**: OPTIONS handler existe mas pode não estar funcionando
- **Causa provável**: `await req.json()` pode estar sendo chamado antes do OPTIONS check
- **Status**: 🔴 **CRÍTICO - BLOQUEANDO TUDO**

#### **B) Try/Catch que aborta enrichment**
- **Arquivo**: `src/services/receitaFederal.ts` (linha 201-204)
- **Linha 202**: Erro de persistência é logado mas não falha o enrichment
- **Status**: ✅ Tratamento correto (não aborta)

#### **C) Early Returns sem persistência**
- **Arquivo**: `supabase/functions/scan-prospect-website/index.ts`
- **Linha 560-575**: Retorna `skipped: true` quando `tenant_products_empty`
- **Linha 577-592**: Retorna `skipped: true` quando `prospect_products_empty`
- **Status**: ✅ Retorna corretamente (não é falha silenciosa)

#### **D) Campos não sendo gravados apesar de dados retornarem**
- **Arquivo**: `src/pages/QualifiedProspectsStock.tsx` (linha 2173)
- **Problema**: Comentário diz "NÃO passar setor no updateData" - pode estar faltando `cnae_principal`
- **Status**: ⚠️ **VERIFICAR SE `cnae_principal` ESTÁ SENDO PERSISTIDO**

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **PROBLEMA 1: CORS Bloqueando Edge Functions**
- **Impacto**: 🔴 **CRÍTICO** - Todas as chamadas de Edge Functions falham
- **Local**: `supabase/functions/scan-prospect-website/index.ts`
- **Causa**: Preflight OPTIONS pode não estar retornando 200 corretamente

### **PROBLEMA 2: CNAE pode não estar sendo persistido em `cnae_principal`**
- **Impacto**: 🟡 **MÉDIO** - CNAE existe em `enrichment_data` mas pode faltar em campo direto
- **Local**: `src/pages/QualifiedProspectsStock.tsx` (linha 2173+)
- **Causa**: Comentário sugere não passar setor, mas não menciona `cnae_principal`

### **PROBLEMA 3: `enrichment_state` não está sendo atualizado**
- **Impacto**: 🟡 **MÉDIO** - Não há rastreabilidade de estado de enrichment
- **Local**: Nenhum arquivo encontrado atualizando `enrichment_state`
- **Causa**: Campo pode não existir ou não está sendo usado

---

## ✅ O QUE ESTÁ FUNCIONANDO

1. ✅ Receita Federal persiste em `enrichment_data.receita_federal`
2. ✅ Website scan persiste `website_fit_score`, `website_products_match`, `linkedin_url`
3. ✅ Matching metadata persiste em `enrichment_data.matching_metadata`
4. ✅ Try/catch não aborta enrichment quando persistência falha

---

## 📝 PRÓXIMOS PASSOS (PASSO 2)

1. **Corrigir CORS** (crítico - bloqueia tudo)
2. **Garantir persistência de `cnae_principal`** (além de `enrichment_data`)
3. **Adicionar atualização de `enrichment_state`** (se campo existir)
4. **Verificar early returns** (garantir que não abortam silenciosamente)
