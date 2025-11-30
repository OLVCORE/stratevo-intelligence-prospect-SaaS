# 🔄 PLANO DE RENOMEACAÇÃO: Remover TOTVS e Usar Termos Profissionais

## 🎯 OBJETIVO

Remover todas as referências a "TOTVS" e substituir por termos genéricos e profissionais que funcionem para qualquer tenant.

---

## 📝 CONVENÇÃO DE NOMES

### ANTES → DEPOIS

| Antes (TOTVS) | Depois (Genérico) | Contexto |
|---------------|-------------------|----------|
| `useSimpleTOTVSCheck` | `useUsageVerification` | Hook de verificação |
| `TOTVSCheckCard` | `UsageVerificationCard` | Componente principal |
| `simple-totvs-check` | `usage-verification` | Edge Function |
| `TOTVSCheckReport` | `UsageVerificationReport` | Página de relatório |
| "TOTVS Check" | "Verificação de Uso" | Título da aba |
| "Produtos TOTVS" | "Produtos Detectados" | Produtos encontrados |
| "Cliente TOTVS" | "Cliente Identificado" | Status de cliente |
| `stc_verification_history` | `usage_verification_history` | Tabela (opcional, pode manter STC) |
| `SimpleTOTVSCheck` | `UsageVerification` | Tipo/Interface |

---

## 🔄 MAPEAMENTO COMPLETO

### 1. Hooks
- `useSimpleTOTVSCheck` → `useUsageVerification`
- `useTOTVSDetectionReports` → `useUsageVerificationReports`
- `useEnsureSTCHistory` → `useEnsureVerificationHistory` (ou manter STC)

### 2. Componentes
- `TOTVSCheckCard` → `UsageVerificationCard`
- `TOTVSCheckReport` → `UsageVerificationReport`
- `TOTVSStatusBadge` → `VerificationStatusBadge`
- `SimpleTOTVSCheckDialog` → `UsageVerificationDialog`

### 3. Edge Functions
- `simple-totvs-check` → `usage-verification`

### 4. Serviços
- `useProductGaps` → manter (já genérico)
- Funções relacionadas a TOTVS → genéricas

### 5. Textos/UI
- "TOTVS" → "Produtos/Serviços" ou "Soluções"
- "Verificação TOTVS" → "Verificação de Uso"
- "Cliente TOTVS" → "Cliente Identificado"
- "Produtos TOTVS detectados" → "Produtos detectados"

---

## 📋 CHECKLIST DE RENOMEACAÇÃO

### FASE 1: Arquivos Principais
- [ ] `src/hooks/useSimpleTOTVSCheck.ts` → `useUsageVerification.ts`
- [ ] `src/components/totvs/TOTVSCheckCard.tsx` → `UsageVerificationCard.tsx`
- [ ] `src/pages/Leads/TOTVSCheckReport.tsx` → `UsageVerificationReport.tsx`
- [ ] `supabase/functions/simple-totvs-check/` → `usage-verification/`

### FASE 2: Componentes Relacionados
- [ ] `src/components/totvs/TOTVSStatusBadge.tsx` → `VerificationStatusBadge.tsx`
- [ ] `src/components/intelligence/SimpleTOTVSCheckDialog.tsx` → `UsageVerificationDialog.tsx`
- [ ] Outros componentes com TOTVS

### FASE 3: Textos e Mensagens
- [ ] Substituir "TOTVS" em todos os textos
- [ ] Substituir "TOTVS Check" por "Verificação de Uso"
- [ ] Substituir "Produtos TOTVS" por "Produtos Detectados"

### FASE 4: Imports e Referências
- [ ] Atualizar todos os imports
- [ ] Atualizar todas as referências em código
- [ ] Atualizar rotas (se aplicável)

---

## 🎯 TERMOS PROFISSIONAIS SUGERIDOS

### Para Verificação:
- ✅ **"Verificação de Uso"** (Usage Verification)
- ✅ **"Análise de Uso"** (Usage Analysis)
- ✅ **"Detecção de Uso"** (Usage Detection)

### Para Produtos:
- ✅ **"Produtos Detectados"** (Detected Products)
- ✅ **"Soluções Identificadas"** (Identified Solutions)
- ✅ **"Produtos em Uso"** (Products in Use)

### Para Status:
- ✅ **"Cliente Identificado"** (Identified Customer)
- ✅ **"Uso Confirmado"** (Usage Confirmed)
- ✅ **"Uso Não Detectado"** (Usage Not Detected)

### Para Componentes:
- ✅ **UsageVerificationCard** (Card de Verificação de Uso)
- ✅ **VerificationStatusBadge** (Badge de Status)
- ✅ **UsageVerificationReport** (Relatório de Verificação)

---

## 📁 ESTRUTURA DE ARQUIVOS NOVA

```
src/
├── hooks/
│   ├── useUsageVerification.ts (ex useSimpleTOTVSCheck.ts)
│   └── useUsageVerificationReports.ts (ex useTOTVSDetectionReports.ts)
├── components/
│   ├── verification/ (ex totvs/)
│   │   ├── UsageVerificationCard.tsx (ex TOTVSCheckCard.tsx)
│   │   ├── VerificationStatusBadge.tsx (ex TOTVSStatusBadge.tsx)
│   │   └── UsageVerificationDialog.tsx (ex SimpleTOTVSCheckDialog.tsx)
│   └── ...
└── pages/
    └── Leads/
        └── UsageVerificationReport.tsx (ex TOTVSCheckReport.tsx)

supabase/
└── functions/
    └── usage-verification/ (ex simple-totvs-check/)
```

---

## ✅ PRINCÍPIOS

1. **Genérico:** Nenhum nome deve associar a um tenant específico
2. **Profissional:** Termos claros e corporativos
3. **Consistente:** Mesma convenção em toda a plataforma
4. **Descritivo:** Nomes que explicam a função

---

**Última atualização:** 19/01/2025

