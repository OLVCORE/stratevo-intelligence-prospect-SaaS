# 🔄 RENOMEACAÇÃO COMPLETA: Remover TOTVS da Plataforma

## 🎯 CONVENÇÃO DE NOMES PROFISSIONAIS

### ✅ TERMOS ESCOLHIDOS (Genéricos e Profissionais)

| Antes (TOTVS) | Depois (Genérico) | Contexto |
|---------------|-------------------|----------|
| `useSimpleTOTVSCheck` | `useUsageVerification` | Hook principal |
| `TOTVSCheckCard` | `UsageVerificationCard` | Componente principal |
| `simple-totvs-check` | `usage-verification` | Edge Function |
| `TOTVSCheckReport` | `UsageVerificationReport` | Página de relatório |
| "TOTVS Check" | "Verificação de Uso" | Título da aba |
| "Verificação TOTVS" | "Verificação de Uso" | Título da funcionalidade |
| "Produtos TOTVS" | "Produtos Detectados" | Produtos encontrados |
| "Cliente TOTVS" | "Cliente Identificado" | Status de cliente |
| "TOTVS detectado" | "Uso detectado" | Status de detecção |
| `stc_verification_history` | Manter `stc_verification_history` | Tabela (STC = Simple Technology Check) |

---

## 📋 CHECKLIST DE RENOMEACAÇÃO

### ✅ FASE 1: Arquivos Principais (Em Progresso)

- [x] `src/hooks/useSimpleTOTVSCheck.ts` → Criado `useUsageVerification.ts` (com alias)
- [x] `src/components/totvs/TOTVSCheckCard.tsx` → Renomeado internamente para `UsageVerificationCard`
- [ ] Renomear arquivo físico: `TOTVSCheckCard.tsx` → `UsageVerificationCard.tsx`
- [ ] `src/pages/Leads/TOTVSCheckReport.tsx` → `UsageVerificationReport.tsx`
- [ ] `supabase/functions/simple-totvs-check/` → `usage-verification/`

### ⏳ FASE 2: Componentes Relacionados

- [ ] `src/components/totvs/TOTVSStatusBadge.tsx` → `VerificationStatusBadge.tsx`
- [ ] `src/components/intelligence/SimpleTOTVSCheckDialog.tsx` → `UsageVerificationDialog.tsx`
- [ ] `src/components/sdr/TOTVSIntegrationButton.tsx` → `ProductIntegrationButton.tsx`
- [ ] `src/components/roi/TOTVSProductSelector.tsx` → `ProductSelector.tsx`
- [ ] `src/components/roi/TOTVSCostsSelector.tsx` → `ProductCostsSelector.tsx`

### ⏳ FASE 3: Hooks Relacionados

- [ ] `src/hooks/useTOTVSDetection.ts` → `useUsageDetection.ts`
- [ ] `src/hooks/useTOTVSDetectionV2.ts` → `useUsageDetectionV2.ts`
- [ ] `src/hooks/useTOTVSDetectionV3.ts` → `useUsageDetectionV3.ts`
- [ ] `src/hooks/useTOTVSDetectionReports.tsx` → `useUsageVerificationReports.tsx`
- [ ] `src/hooks/useBatchTOTVSAnalysis.ts` → `useBatchUsageAnalysis.ts`

### ⏳ FASE 4: Páginas

- [ ] `src/pages/Leads/TOTVSCheckReport.tsx` → `UsageVerificationReport.tsx`
- [ ] `src/pages/CentralICP/BatchTOTVSAnalysis.tsx` → `BatchUsageAnalysis.tsx`
- [ ] `src/pages/FitTOTVSPage.tsx` → `FitAnalysisPage.tsx`

### ⏳ FASE 5: Edge Functions

- [ ] `supabase/functions/simple-totvs-check/` → `usage-verification/`
- [ ] `supabase/functions/detect-totvs-usage/` → `detect-usage/`
- [ ] `supabase/functions/detect-totvs-usage-v2/` → `detect-usage-v2/`
- [ ] `supabase/functions/analyze-totvs-fit/` → `analyze-product-fit/`
- [ ] `supabase/functions/web-scraper-totvs/` → `web-scraper-usage/`
- [ ] `supabase/functions/totvs-integration/` → `product-integration/`

### ⏳ FASE 6: Textos e Mensagens

- [ ] Substituir "TOTVS" em todos os textos da UI
- [ ] Substituir "TOTVS Check" por "Verificação de Uso"
- [ ] Substituir "Produtos TOTVS" por "Produtos Detectados"
- [ ] Substituir "Cliente TOTVS" por "Cliente Identificado"

### ⏳ FASE 7: Imports e Referências

- [ ] Atualizar todos os imports
- [ ] Atualizar todas as referências em código
- [ ] Atualizar rotas (se aplicável)
- [ ] Atualizar documentação

---

## 🔧 SUBSTITUIÇÕES DE TEXTO

### Padrões de Busca e Substituição:

```typescript
// Hook
"useSimpleTOTVSCheck" → "useUsageVerification"
"SimpleTOTVSCheck" → "UsageVerification"

// Componente
"TOTVSCheckCard" → "UsageVerificationCard"
"TOTVSStatusBadge" → "VerificationStatusBadge"

// Textos UI
"Verificação TOTVS" → "Verificação de Uso"
"TOTVS Check" → "Verificação de Uso"
"Produtos TOTVS" → "Produtos Detectados"
"Cliente TOTVS" → "Cliente Identificado"
"TOTVS detectado" → "Uso detectado"

// Edge Function
"simple-totvs-check" → "usage-verification"
"detect-totvs-usage" → "detect-usage"
```

---

## 📊 PROGRESSO

**Status:** ⏳ Em progresso (~10% completo)

**Próximos passos:**
1. Renomear arquivo físico `TOTVSCheckCard.tsx`
2. Atualizar todos os imports
3. Renomear Edge Function
4. Substituir textos na UI

---

**Última atualização:** 19/01/2025

