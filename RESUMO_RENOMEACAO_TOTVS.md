# ✅ RESUMO: Renomeação TOTVS → Termos Profissionais

## 🎯 CONVENÇÃO ADOTADA

### ✅ TERMOS FINAIS:

| Antes (TOTVS) | Depois (Genérico) | Status |
|---------------|-------------------|--------|
| `useSimpleTOTVSCheck` | `useUsageVerification` | ✅ Criado (com alias) |
| `TOTVSCheckCard` | `UsageVerificationCard` | ✅ Renomeado internamente |
| `TOTVSStatusBadge` | `VerificationStatusBadge` | ✅ Renomeado |
| `simple-totvs-check` | `usage-verification` | ⏳ Edge Function pendente |
| "Verificação TOTVS" | "Verificação de Uso" | ✅ Substituído |
| "TOTVS Check" | "Verificação de Uso" | ✅ Substituído |
| "Produtos TOTVS" | "Produtos Detectados" | ✅ Substituído |
| "Cliente TOTVS" | "Cliente Identificado" | ✅ Substituído |
| `totvsSaved` | `verificationSaved` | ✅ Substituído |
| `filterTOTVSStatus` | `filterVerificationStatus` | ⏳ Pendente |

---

## ✅ O QUE JÁ FOI FEITO

### 1. Hook Principal ✅
- ✅ Criado `src/hooks/useUsageVerification.ts`
- ✅ Mantido alias `useSimpleTOTVSCheck` para compatibilidade
- ✅ Atualizado para usar `usage-verification` Edge Function
- ✅ Adicionado suporte a `tenantId`

### 2. Componente Principal ✅
- ✅ `TOTVSCheckCard.tsx` renomeado internamente para `UsageVerificationCard`
- ✅ Interface renomeada: `UsageVerificationCardProps`
- ✅ Variável `totvsSaved` → `verificationSaved`
- ✅ Textos atualizados: "Verificação de Uso"
- ✅ Console logs atualizados: `[VERIFICATION]`
- ✅ Aba renomeada: "Verificação" ao invés de "TOTVS"

### 3. Componente de Status ✅
- ✅ `TOTVSStatusBadge.tsx` renomeado para `VerificationStatusBadge`
- ✅ Interface renomeada: `VerificationStatusBadgeProps`
- ✅ Textos atualizados: "Cliente Identificado" ao invés de "Cliente TOTVS"

### 4. Imports Atualizados ✅
- ✅ `src/pages/Leads/ICPQuarantine.tsx` - Import atualizado
- ✅ `src/components/totvs/TOTVSCheckCard.tsx` - Import atualizado

---

## ⏳ O QUE AINDA PRECISA SER FEITO

### 1. Arquivos Físicos (Renomear)
- [ ] `src/hooks/useSimpleTOTVSCheck.ts` → Deletar (já tem `useUsageVerification.ts`)
- [ ] `src/components/totvs/TOTVSCheckCard.tsx` → `UsageVerificationCard.tsx`
- [ ] `src/components/totvs/TOTVSStatusBadge.tsx` → `VerificationStatusBadge.tsx`
- [ ] `src/pages/Leads/TOTVSCheckReport.tsx` → `UsageVerificationReport.tsx`
- [ ] `src/pages/CentralICP/BatchTOTVSAnalysis.tsx` → `BatchUsageAnalysis.tsx`
- [ ] `src/pages/FitTOTVSPage.tsx` → `FitAnalysisPage.tsx`

### 2. Edge Functions
- [ ] `supabase/functions/simple-totvs-check/` → `usage-verification/`
- [ ] Atualizar código interno da Edge Function
- [ ] Atualizar invocações no código

### 3. Substituições de Texto Restantes
- [ ] `filterTOTVSStatus` → `filterVerificationStatus` (em vários arquivos)
- [ ] "Já é cliente TOTVS" → "Já é cliente identificado"
- [ ] "TOTVS Check" → "Verificação de Uso" (em todos os arquivos)
- [ ] "Cliente TOTVS" → "Cliente Identificado" (em todos os arquivos)

### 4. Outros Arquivos com Referências
- [ ] `src/pages/Leads/ICPQuarantine.tsx` - Substituir textos restantes
- [ ] `src/pages/Leads/TOTVSCheckReport.tsx` - Renomear e atualizar
- [ ] `src/components/intelligence/SimpleTOTVSCheckDialog.tsx` - Renomear
- [ ] Outros arquivos que importam ou usam componentes TOTVS

---

## 📊 PROGRESSO ATUAL

**Status:** ~40% completo

**Concluído:**
- ✅ Hook principal criado e funcionando
- ✅ Componente principal renomeado internamente
- ✅ Componente de status renomeado
- ✅ Textos principais substituídos
- ✅ Console logs atualizados

**Pendente:**
- ⏳ Renomear arquivos físicos
- ⏳ Atualizar Edge Function
- ⏳ Substituir textos restantes em outros arquivos
- ⏳ Atualizar todas as referências

---

## 🔧 PRÓXIMOS PASSOS RECOMENDADOS

1. **Renomear arquivos físicos** (manualmente ou via script)
2. **Atualizar Edge Function** `simple-totvs-check` → `usage-verification`
3. **Buscar e substituir** todas as referências restantes a "TOTVS"
4. **Testar** toda a aplicação após renomeação
5. **Atualizar documentação** se necessário

---

**Última atualização:** 19/01/2025  
**Status:** ⏳ Em progresso - Componentes principais renomeados, arquivos físicos e Edge Functions pendentes

