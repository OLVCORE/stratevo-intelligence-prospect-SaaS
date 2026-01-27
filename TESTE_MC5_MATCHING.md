# 🧪 TESTE MC-5: MATCHING PROFISSIONAL

## 📋 CASOS DE TESTE OBRIGATÓRIOS

### ✅ CASO 1: Tenant sem produtos cadastrados

**Como testar:**
1. Acesse a página "2.2 Estoque Qualificado"
2. Selecione um prospect que tenha website
3. Clique em "Receita Federal" ou "Escanear Website"
4. **ANTES**: Remova temporariamente todos os produtos do tenant (ou use um tenant sem produtos)

**Resultado esperado:**
```json
{
  "success": true,
  "executed": false,
  "skipped": true,
  "reason": "tenant_products_empty",
  "message": "Tenant não possui produtos cadastrados. Cadastre produtos antes de executar matching.",
  "website_fit_score": 0,
  "website_products_match": [],
  "products_found": <número de produtos extraídos do website>
}
```

**Logs esperados:**
```
[MC-5 MATCHING] ⏭️ SKIPPED - tenant_products vazio
```

---

### ✅ CASO 2: Prospect sem produtos extraídos do website

**Como testar:**
1. Acesse a página "2.2 Estoque Qualificado"
2. Selecione um prospect que tenha website mas que não contenha informações de produtos/serviços
3. Clique em "Receita Federal" ou "Escanear Website"

**Resultado esperado:**
```json
{
  "success": true,
  "executed": false,
  "skipped": true,
  "reason": "prospect_products_empty",
  "message": "Nenhum produto extraído do website do prospect. Website pode não conter informações de produtos.",
  "website_fit_score": 0,
  "website_products_match": [],
  "products_found": 0
}
```

**Logs esperados:**
```
[MC-5 MATCHING] ⏭️ SKIPPED - prospect_extracted_products vazio
```

---

### ✅ CASO 3: IA retorna vazio → Fallback heurístico ativado

**Como testar:**
1. Acesse a página "2.2 Estoque Qualificado"
2. Selecione um prospect que tenha website com produtos
3. Tenha produtos cadastrados no tenant
4. **SIMULAR**: Temporariamente desabilite a chave OpenAI ou force um erro na API
5. Clique em "Receita Federal" ou "Escanear Website"

**Resultado esperado:**
```json
{
  "success": true,
  "executed": true,
  "skipped": false,
  "website_fit_score": <score > 0 se houver match, ou 0 se não houver>,
  "website_products_match": [
    {
      "prospect_product": "...",
      "tenant_product": "...",
      "match_type": "categoria" | "subcategoria" | "keywords",
      "confidence": 0.5-0.9,
      "reason": "..."
    }
  ],
  "matching_metadata": {
    "score_total": <número>,
    "score_breakdown": {
      "categoria": <pontos>,
      "subcategoria": <pontos>,
      "keywords": <pontos>
    },
    "matching_reason": "categoria_match + keyword_overlap" | "heuristic_fallback" | "no_match_found",
    "matches_count": <número>,
    "source_used": "heuristic",
    "computed_at": "<ISO timestamp>"
  }
}
```

**Logs esperados:**
```
[MC-5 MATCHING] ⚠️ IA retornou vazio — fallback heurístico ativado
[MC-5 MATCHING] ✅ Matching heurístico aplicado: categoria_match + keyword_overlap
[MC-5 MATCHING] ✅ Score breakdown: {"categoria": 4, "subcategoria": 0, "keywords": 2}
[MC-5 MATCHING] ✅ Website Fit Score: 6/20 pontos
```

**Verificações:**
- ✅ `matching_metadata.source_used` = `"heuristic"`
- ✅ `matching_metadata.computed_at` está preenchido
- ✅ `score_breakdown` mostra pontos por categoria/subcategoria/keywords
- ✅ Se não houver match: `matching_reason` = `"no_match_found"` e `score_total` = 0

---

### ✅ CASO 4: Reexecutar → Idempotência (already_computed)

**Como testar:**
1. Execute o Caso 3 (ou qualquer matching que funcione)
2. **IMEDIATAMENTE** (dentro de 24 horas), execute novamente o mesmo prospect
3. Clique em "Receita Federal" ou "Escanear Website" novamente

**Resultado esperado:**
```json
{
  "success": true,
  "executed": false,
  "skipped": true,
  "reason": "already_computed",
  "message": "Matching já foi calculado recentemente. Use force recompute para recalcular.",
  "website_fit_score": <score anterior>,
  "website_products_match": <array anterior>,
  "matching_metadata": <metadata anterior>,
  "computed_at": "<timestamp anterior>"
}
```

**Logs esperados:**
```
[MC-5 MATCHING] ⏭️ SKIPPED - already_computed (há X horas)
```

**Verificações:**
- ✅ Não recalcula matching
- ✅ Retorna dados anteriores
- ✅ `computed_at` mostra quando foi calculado anteriormente

---

### ✅ CASO 5: IA funciona normalmente → Score explicável

**Como testar:**
1. Acesse a página "2.2 Estoque Qualificado"
2. Selecione um prospect que tenha website com produtos
3. Tenha produtos cadastrados no tenant
4. **GARANTIR**: OpenAI key está configurada e funcionando
5. Clique em "Receita Federal" ou "Escanear Website"

**Resultado esperado:**
```json
{
  "success": true,
  "executed": true,
  "skipped": false,
  "website_fit_score": <score 0-20>,
  "website_products_match": [
    {
      "prospect_product": "...",
      "tenant_product": "...",
      "match_type": "aplicacao" | "uso" | "fabricacao" | "processo" | "suporte",
      "confidence": 0.0-1.0,
      "reason": "explicação curta do porquê há fit"
    }
  ],
  "matching_metadata": {
    "score_total": <número>,
    "score_breakdown": {
      "ai_matches": <número>,
      "ai_score": <número>
    },
    "matching_reason": "ai_analysis",
    "matches_count": <número>,
    "source_used": "ai",
    "computed_at": "<ISO timestamp>"
  }
}
```

**Logs esperados:**
```
[MC-5 MATCHING] ✅ Produtos compatíveis encontrados: X
[MC-5 MATCHING] ✅ Website Fit Score: X/20 pontos
[MC-5 MATCHING] ✅ Matching reason: ai_analysis
[MC-5 MATCHING] ✅ Score breakdown: {"ai_matches": X, "ai_score": Y}
```

**Verificações:**
- ✅ `matching_metadata.source_used` = `"ai"`
- ✅ `matching_reason` = `"ai_analysis"`
- ✅ `score_breakdown` mostra `ai_matches` e `ai_score`
- ✅ `computed_at` está preenchido

---

### ✅ CASO 6: Verificar persistência no banco

**Como testar:**
1. Execute qualquer matching que funcione (Caso 3 ou 5)
2. Abra o Supabase Dashboard
3. Vá em `qualified_prospects`
4. Busque o prospect que foi escaneado
5. Verifique os campos:

**Campos que devem estar preenchidos:**
- ✅ `website_fit_score` (número 0-20)
- ✅ `website_products_match` (array JSONB)
- ✅ `enrichment_data.matching_metadata` (objeto com):
  - `score_total`
  - `score_breakdown`
  - `matching_reason`
  - `matches_count`
  - `source_used` (`"ai"` ou `"heuristic"` ou `"none"`)
  - `computed_at` (timestamp ISO)

---

### ✅ CASO 7: Verificar que Leads Aprovados e Promoção NÃO foram afetados

**Como testar:**
1. Acesse "Leads Aprovados"
2. Verifique se a página carrega normalmente
3. Verifique se os badges de Setor/Categoria aparecem
4. Acesse "2.2 Estoque Qualificado"
5. Tente promover um prospect para "Base de Empresas"
6. Verifique se a promoção funciona normalmente

**Resultado esperado:**
- ✅ Leads Aprovados funciona normalmente
- ✅ Badges de Setor/Categoria aparecem
- ✅ Promoção Qualified → Companies funciona
- ✅ Nenhum erro no console

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após executar os testes, confirme:

- [ ] Caso 1: `tenant_products_empty` retorna skipped corretamente
- [ ] Caso 2: `prospect_products_empty` retorna skipped corretamente
- [ ] Caso 3: Fallback heurístico gera metadata e score quando IA falha
- [ ] Caso 4: Reexecutar retorna `already_computed` (idempotência)
- [ ] Caso 5: IA funciona e retorna metadata explicável
- [ ] Caso 6: Dados persistem corretamente no banco
- [ ] Caso 7: Leads Aprovados e promoção não foram afetados

---

## 🚨 O QUE NÃO DEVE ACONTECER

❌ **NUNCA** deve retornar score 0 sem reason explícita
❌ **NUNCA** deve recalcular matching se já foi calculado recentemente
❌ **NUNCA** deve quebrar Leads Aprovados ou promoção
❌ **NUNCA** deve faltar `computed_at` no `matching_metadata`
❌ **NUNCA** deve faltar `source_used` no `matching_metadata`

---

## 📝 EXEMPLO DE RESPOSTA ESPERADA (CASO 5 - SUCESSO)

```json
{
  "success": true,
  "executed": true,
  "skipped": false,
  "source_used": "website",
  "products_found": 5,
  "products_inserted": 5,
  "compatible_products": 3,
  "website_fit_score": 15,
  "website_products_match": [
    {
      "prospect_product": "Máquinas de terraplenagem",
      "tenant_product": "Software de gestão industrial",
      "match_type": "aplicacao",
      "confidence": 0.85,
      "reason": "Software pode ser aplicado na gestão da produção de máquinas"
    }
  ],
  "linkedin_url": "https://www.linkedin.com/company/empresa-exemplo",
  "matching_metadata": {
    "score_total": 15,
    "score_breakdown": {
      "ai_matches": 3,
      "ai_score": 15
    },
    "matching_reason": "ai_analysis",
    "matches_count": 3,
    "source_used": "ai",
    "computed_at": "2026-01-24T15:30:45.123Z"
  },
  "message": "Website escaneado. LinkedIn: website, Produtos: 5, Score: 15/20 (ai_analysis)"
}
```

---

## 🎯 TESTE MÍNIMO (SE PRECISAR RÁPIDO)

Execute apenas:
1. **Caso 4** (idempotência) - mais crítico
2. **Caso 5** (IA funciona) - valida o fluxo completo
3. **Caso 7** (não regrediu) - valida que não quebrou nada

Se esses 3 passarem, o MC-5 está funcional.
