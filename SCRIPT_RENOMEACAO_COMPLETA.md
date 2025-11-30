# 🔄 SCRIPT DE RENOMEACAÇÃO COMPLETA: TOTVS → Termos Profissionais

## 🎯 CONVENÇÃO FINAL

### ✅ TERMOS ESCOLHIDOS:

| Antes | Depois | Tipo |
|-------|--------|------|
| `useSimpleTOTVSCheck` | `useUsageVerification` | Hook |
| `TOTVSCheckCard` | `UsageVerificationCard` | Componente |
| `simple-totvs-check` | `usage-verification` | Edge Function |
| `TOTVSStatusBadge` | `VerificationStatusBadge` | Componente |
| "TOTVS Check" | "Verificação de Uso" | Texto UI |
| "Verificação TOTVS" | "Verificação de Uso" | Texto UI |
| "Produtos TOTVS" | "Produtos Detectados" | Texto UI |
| "Cliente TOTVS" | "Cliente Identificado" | Texto UI |
| "TOTVS detectado" | "Uso detectado" | Texto UI |
| `filterTOTVSStatus` | `filterVerificationStatus` | Variável |

---

## 📋 SUBSTITUIÇÕES NECESSÁRIAS

### 1. Arquivos a Renomear (Físicos):

```bash
# Hooks
src/hooks/useSimpleTOTVSCheck.ts → src/hooks/useUsageVerification.ts

# Componentes
src/components/totvs/TOTVSCheckCard.tsx → src/components/verification/UsageVerificationCard.tsx
src/components/totvs/TOTVSStatusBadge.tsx → src/components/verification/VerificationStatusBadge.tsx
src/components/intelligence/SimpleTOTVSCheckDialog.tsx → src/components/verification/UsageVerificationDialog.tsx

# Páginas
src/pages/Leads/TOTVSCheckReport.tsx → src/pages/Leads/UsageVerificationReport.tsx
src/pages/CentralICP/BatchTOTVSAnalysis.tsx → src/pages/CentralICP/BatchUsageAnalysis.tsx
src/pages/FitTOTVSPage.tsx → src/pages/FitAnalysisPage.tsx

# Edge Functions
supabase/functions/simple-totvs-check/ → supabase/functions/usage-verification/
```

### 2. Substituições de Texto (Buscar e Substituir):

#### Em TODOS os arquivos `.ts`, `.tsx`, `.sql`:

```typescript
// Hooks
"useSimpleTOTVSCheck" → "useUsageVerification"
"SimpleTOTVSCheck" → "UsageVerification"

// Componentes
"TOTVSCheckCard" → "UsageVerificationCard"
"TOTVSStatusBadge" → "VerificationStatusBadge"
"SimpleTOTVSCheckDialog" → "UsageVerificationDialog"

// Edge Functions
"simple-totvs-check" → "usage-verification"
"detect-totvs-usage" → "detect-usage"
"analyze-totvs-fit" → "analyze-product-fit"

// Textos UI
"Verificação TOTVS" → "Verificação de Uso"
"TOTVS Check" → "Verificação de Uso"
"Produtos TOTVS" → "Produtos Detectados"
"Cliente TOTVS" → "Cliente Identificado"
"TOTVS detectado" → "Uso detectado"
"TOTVS marcado" → "Verificação marcada"

// Variáveis
"totvsSaved" → "verificationSaved"
"filterTOTVSStatus" → "filterVerificationStatus"
"TOTVSStatus" → "VerificationStatus"

// Console logs
"[TOTVS]" → "[VERIFICATION]"
"[TOTVS-CARD]" → "[VERIFICATION-CARD]"
"[TOTVS-REG]" → "[VERIFICATION-REG]"
```

---

## 🔧 COMANDOS PARA EXECUTAR

### PowerShell (Windows):

```powershell
# 1. Renomear arquivos
Rename-Item -Path "src\hooks\useSimpleTOTVSCheck.ts" -NewName "useUsageVerification.ts"
Rename-Item -Path "src\components\totvs\TOTVSCheckCard.tsx" -NewName "UsageVerificationCard.tsx"
Rename-Item -Path "src\components\totvs\TOTVSStatusBadge.tsx" -NewName "VerificationStatusBadge.tsx"
# ... (continuar para todos os arquivos)

# 2. Substituir texto em todos os arquivos
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | ForEach-Object {
    (Get-Content $_.FullName) -replace 'useSimpleTOTVSCheck', 'useUsageVerification' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'TOTVSCheckCard', 'UsageVerificationCard' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'TOTVSStatusBadge', 'VerificationStatusBadge' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'simple-totvs-check', 'usage-verification' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'Verificação TOTVS', 'Verificação de Uso' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'TOTVS Check', 'Verificação de Uso' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'Produtos TOTVS', 'Produtos Detectados' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'Cliente TOTVS', 'Cliente Identificado' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'totvsSaved', 'verificationSaved' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'filterTOTVSStatus', 'filterVerificationStatus' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace '\[TOTVS\]', '[VERIFICATION]' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace '\[TOTVS-CARD\]', '[VERIFICATION-CARD]' | Set-Content $_.FullName
}
```

---

## ✅ CHECKLIST DE RENOMEACAÇÃO

### FASE 1: Arquivos Principais ✅
- [x] Criado `useUsageVerification.ts` (com alias)
- [x] Atualizado `TOTVSCheckCard.tsx` internamente
- [ ] Renomear arquivo físico `TOTVSCheckCard.tsx` → `UsageVerificationCard.tsx`
- [ ] Atualizar todos os imports

### FASE 2: Componentes Relacionados ⏳
- [ ] `TOTVSStatusBadge.tsx` → `VerificationStatusBadge.tsx`
- [ ] `SimpleTOTVSCheckDialog.tsx` → `UsageVerificationDialog.tsx`
- [ ] Outros componentes

### FASE 3: Páginas ⏳
- [ ] `TOTVSCheckReport.tsx` → `UsageVerificationReport.tsx`
- [ ] `BatchTOTVSAnalysis.tsx` → `BatchUsageAnalysis.tsx`
- [ ] `FitTOTVSPage.tsx` → `FitAnalysisPage.tsx`

### FASE 4: Edge Functions ⏳
- [ ] `simple-totvs-check` → `usage-verification`
- [ ] Outras Edge Functions relacionadas

### FASE 5: Textos e Mensagens ⏳
- [ ] Substituir todos os textos na UI
- [ ] Atualizar mensagens de console
- [ ] Atualizar documentação

---

**Última atualização:** 19/01/2025  
**Status:** ⏳ Em progresso

