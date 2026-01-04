# 📊 O QUE ESPERAR DAS IMPLEMENTAÇÕES

## 🔍 PROBLEMA ATUAL: Zero Empresas Retornadas

**Diagnóstico:**
- `candidates_collected: 0` - API EmpresaQui não está retornando empresas
- Possíveis causas:
  1. API key não configurada ou inválida
  2. Filtros muito restritivos (CNAE/localização não encontrados)
  3. API EmpresaQui temporariamente indisponível
  4. Formato dos parâmetros incorreto

**Solução Imediata:**
1. Verificar logs do Edge Function no Supabase Dashboard
2. Verificar se `EMPRESASAQUI_API_KEY` está configurada
3. Testar API diretamente com curl

---

## ✅ O QUE AS IMPLEMENTAÇÕES FAZEM:

### FASE 1 - Concluída:
1. **BrasilAPI V2**: Busca dados mais completos e atualizados
2. **Scoring 0-100**: Melhor ordenação das empresas encontradas
3. **Validação rigorosa**: Apenas empresas ATIVAS são retornadas
4. **Filtragem inteligente**: Usa Setor/Categoria para encontrar CNAEs relacionados

**Resultado esperado:** Empresas mais relevantes e com dados mais completos

### FASE 2 - Parcial:
1. **Enriquecimento multi-camada**: Busca Apollo + Hunter + PhantomBuster em paralelo
2. **Mais dados**: LinkedIn, e-mails, decisores encontrados automaticamente

**Resultado esperado:** Empresas com mais informações de contato

---

## 🗂️ SINCRONIZAÇÃO DAS TABELAS:

### 1. Motor de Qualificação (`qualified_prospects`)
**Campos principais:**
- ✅ `cnpj`, `razao_social`, `nome_fantasia`
- ✅ `cidade`, `estado`, `cep`, `endereco`
- ✅ `website`, `cnae_principal`, `porte`
- ✅ `fit_score`, `grade`, `pipeline_status`

**Compatibilidade:** ✅ Sincronizado com `prospects_raw`

### 2. Estoque Qualificado (`qualified_prospects` - mesmo da #1)
**Status:** `pipeline_status = 'new'` ou `'approved'`

### 3. Base de Empresas (`companies`)
**Campos principais:**
- ✅ `cnpj`, `razao_social`, `nome_fantasia`
- ✅ `cidade`, `uf`, `website`, `linkedin_url`
- ✅ `cnae_principal`, `porte`, `segmento`
- ✅ `website_encontrado`, `website_fit_score`

**Compatibilidade:** ✅ Sincronizado (campos básicos)

### 4. Quarentena ICP (`icp_analysis_results`)
**Campos principais:**
- ✅ `cnpj`, `razao_social`, `nome_fantasia`
- ✅ `cidade`, `estado`, `website`
- ✅ `icp_score`, `status` ('pendente' ou 'aprovada')

**Compatibilidade:** ⚠️ Precisa verificar mapeamento de `prospects_raw` → `icp_analysis_results`

### 5. Leads Aprovados (`icp_analysis_results` - mesmo da #4)
**Status:** `status = 'aprovada'`

### 6. Pipeline de Vendas (`sdr_deals`)
**Campos principais:**
- ✅ `company_id` (referência a `companies`)
- ✅ `deal_name`, `deal_value`, `stage`

**Compatibilidade:** ✅ Usa `companies` como base

---

## ⚠️ GAPS IDENTIFICADOS:

1. **`prospects_raw` → `icp_analysis_results`**: Não há função automática de migração
2. **`prospects_raw` → `companies`**: Não há função automática de migração
3. **Campos faltando em algumas tabelas:**
   - `prospects_raw` não tem `linkedin_url` (tem `linkedin`)
   - `companies` tem `linkedin_url` mas `prospects_raw` tem `linkedin`

---

## 🔧 PRÓXIMOS PASSOS RECOMENDADOS:

1. **Diagnosticar zero empresas:**
   - Verificar logs do Edge Function
   - Testar API EmpresaQui diretamente
   - Verificar API key

2. **Criar funções de migração:**
   - `prospects_raw` → `icp_analysis_results` (quarentena)
   - `prospects_raw` → `companies` (base de empresas)
   - `prospects_raw` → `qualified_prospects` (motor de qualificação)

3. **Sincronizar campos:**
   - Padronizar `linkedin` vs `linkedin_url`
   - Garantir que todos os campos enriquecidos sejam salvos

