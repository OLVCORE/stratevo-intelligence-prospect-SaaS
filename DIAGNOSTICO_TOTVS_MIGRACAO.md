# 🔍 DIAGNÓSTICO COMPLETO: Dependências TOTVS e Migração para Extratevo One

## 📊 RESUMO EXECUTIVO

**Status:** Plataforma migrada de TOTVS para multi-tenant (Extratevo One)
**Problema:** Sistema ainda possui dependências de TOTVS que não devem bloquear aprovações
**Impacto:** Badge de enriquecimento mostra 75% (3/4) porque TOTVS check é obrigatório

---

## 🎯 DEPENDÊNCIAS TOTVS IDENTIFICADAS

### 1. **BADGE DE ENRIQUECIMENTO (BLOQUEADOR VISUAL)**
**Arquivo:** `src/components/icp/QuarantineEnrichmentStatusBadge.tsx`

**Problema:**
- Badge calcula porcentagem com **4 checks**: Receita Federal (25%), Apollo (50%), 360° (75%), **TOTVS (100%)**
- TOTVS é obrigatório para chegar a 100% de enriquecimento
- Isso causa confusão visual, mas **NÃO bloqueia aprovação**

**Impacto:** Badge sempre mostra 75% máximo (3/4 checks) sem TOTVS

**Solução:** Remover TOTVS do cálculo ou torná-lo opcional

---

### 2. **VALIDAÇÃO DE APROVAÇÃO (NÃO BLOQUEIA)**
**Arquivo:** `src/hooks/useICPQuarantine.ts` - `useApproveQuarantineBatch`

**Status:** ✅ **NÃO BLOQUEIA**
- Aprovação valida apenas: `CNPJ` e `Razão Social`
- **NÃO verifica TOTVS** antes de aprovar
- Aprovação funciona normalmente sem TOTVS check

**Código relevante:**
```typescript
const validCompanies = quarantineData.filter(q => 
  q.cnpj && 
  q.cnpj.trim() !== '' && 
  q.razao_social && 
  q.razao_social.trim() !== ''
);
```

---

### 3. **EDGE FUNCTION DE QUALIFICAÇÃO (BLOQUEADOR INDIRETO)**
**Arquivo:** `supabase/functions/ai-qualification-analysis/index.ts`

**Problema:**
- Regra absoluta: `TOTVS Score > 0 → SEMPRE NO-GO`
- Isso é usado para **qualificação de leads**, não para aprovação da quarentena
- Se essa função for chamada antes da aprovação, pode bloquear

**Status:** ⚠️ **Pode bloquear se usado no fluxo de quarentena**

---

### 4. **COLUNAS DO BANCO DE DADOS (INFORMATIVAS)**
**Tabelas:** `icp_analysis_results`, `companies`

**Colunas TOTVS:**
- `is_cliente_totvs` (BOOLEAN)
- `totvs_status` (TEXT: 'go'|'no-go'|'revisar')
- `totvs_check_date` (TIMESTAMPTZ)
- `totvs_evidences` (JSONB)
- `totvs_confidence` (TEXT)

**Status:** ✅ **Apenas informativo - não bloqueia aprovação**

---

### 5. **MUTATIONS DE ENRIQUECIMENTO (OPCIONAL)**
**Arquivos:** 
- `src/pages/Leads/ICPQuarantine.tsx` (linha 533)
- `src/pages/Leads/ApprovedLeads.tsx` (linha 532)

**Função:** `enrichVerificationMutation`
- Chama Edge Function `usage-verification` (antiga `simple-totvs-check`)
- Atualiza campos TOTVS na tabela
- **Opcional** - não é obrigatório para aprovação

**Status:** ✅ **Opcional - pode ser ignorado**

---

## 🔧 CORREÇÕES NECESSÁRIAS

### ✅ PRIORIDADE ALTA: Remover TOTVS do Badge

**Arquivo:** `src/components/icp/QuarantineEnrichmentStatusBadge.tsx`

**Mudança:**
- Remover TOTVS dos 4 checks
- Usar apenas 3 checks: Receita Federal, Apollo, 360°
- Porcentagem: 33% (1/3), 67% (2/3), 100% (3/3)

---

### ⚠️ PRIORIDADE MÉDIA: Verificar Edge Functions

**Verificar se:**
- `ai-qualification-analysis` é chamada durante aprovação da quarentena
- Se sim, remover regra de bloqueio TOTVS ou tornar opcional

---

### 📝 PRIORIDADE BAIXA: Limpeza Geral

1. **Manter colunas TOTVS no banco** (dados históricos)
2. **Manter Edge Functions TOTVS** (pode ser útil no futuro)
3. **Atualizar textos UI** (remover referências obrigatórias)

---

## 🚀 PLANO DE AÇÃO

### FASE 1: Correção Imediata (5 min)
1. ✅ Remover TOTVS do cálculo do badge
2. ✅ Testar aprovação da quarentena

### FASE 2: Verificação (10 min)
1. ✅ Verificar se Edge Functions bloqueiam aprovação
2. ✅ Testar fluxo completo: Quarentena → Aprovadas → Pipeline

### FASE 3: Limpeza (Opcional)
1. Atualizar textos UI
2. Documentar mudanças
3. Remover código não utilizado (se houver)

---

## ✅ CONCLUSÃO

**APROVAÇÃO FUNCIONA SEM TOTVS:**
- ✅ Validação não verifica TOTVS
- ✅ Aprovação cria deals normalmente
- ✅ Único problema é visual (badge mostra 75%)

**PRÓXIMOS PASSOS:**
1. Remover TOTVS do badge (correção visual)
2. Testar aprovação completa
3. Verificar se há outros bloqueios não identificados


