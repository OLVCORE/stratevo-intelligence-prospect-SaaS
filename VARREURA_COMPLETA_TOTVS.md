# 🔍 VARREURA COMPLETA: Renomeação TOTVS → Termos Profissionais

## 📊 ESTATÍSTICAS

- **Total de ocorrências:** 4,954
- **Arquivos afetados:** 413
- **Arquivos críticos (src/):** 150
- **Edge Functions:** 81

---

## 🎯 PLANO DE AÇÃO SISTEMÁTICO

### FASE 1: Arquivos Críticos (src/) - PRIORIDADE ALTA
1. ✅ `TOTVSCheckCard.tsx` - Já renomeado internamente
2. ✅ `TOTVSStatusBadge.tsx` - Já renomeado
3. ⏳ `ICPQuarantine.tsx` - Substituir variáveis e textos
4. ⏳ `TOTVSCheckReport.tsx` - Renomear arquivo e conteúdo
5. ⏳ Hooks relacionados (useTOTVSDetection*, useBatchTOTVSAnalysis)
6. ⏳ Componentes relacionados (SimpleTOTVSCheckDialog, etc.)

### FASE 2: Edge Functions - PRIORIDADE ALTA
1. ⏳ `simple-totvs-check` → `usage-verification`
2. ⏳ `detect-totvs-usage` → `detect-usage`
3. ⏳ `analyze-totvs-fit` → `analyze-product-fit`
4. ⏳ Outras Edge Functions

### FASE 3: Substituições de Texto - PRIORIDADE MÉDIA
1. ⏳ Variáveis: `totvsSaved`, `filterTOTVSStatus`, etc.
2. ⏳ Textos UI: "TOTVS Check", "Cliente TOTVS", etc.
3. ⏳ Console logs: `[TOTVS]` → `[VERIFICATION]`

### FASE 4: Arquivos de Configuração - PRIORIDADE BAIXA
1. ⏳ Migrations SQL (manter histórico, mas atualizar comentários)
2. ⏳ Documentação (atualizar referências)

---

## 🔄 MAPEAMENTO DE SUBSTITUIÇÕES

### Variáveis e Funções:
- `totvsSaved` → `verificationSaved`
- `filterTOTVSStatus` → `filterVerificationStatus`
- `enrichTotvsCheckMutation` → `enrichVerificationMutation`
- `handleBulkTotvsCheck` → `handleBulkVerification`
- `handleOpenTotvsCheck` → `handleOpenVerification`
- `is_cliente_totvs` → `is_cliente_identificado` (ou manter no DB)
- `totvs_status` → `verification_status` (ou manter no DB)
- `totvs_check_date` → `verification_date` (ou manter no DB)
- `totvs_evidences` → `verification_evidences` (ou manter no DB)

### Textos UI:
- "TOTVS Check" → "Verificação de Uso"
- "Cliente TOTVS" → "Cliente Identificado"
- "Já é cliente TOTVS" → "Já é cliente identificado"
- "TOTVS Check concluído" → "Verificação concluída"
- "Erro no TOTVS Check" → "Erro na verificação"
- "PROCESSAMENTO TOTVS EM LOTE" → "PROCESSAMENTO EM LOTE"
- "Aba TOTVS" → "Aba Verificação"
- "Assistente de vendas e análise TOTVS" → "Assistente de vendas e análise"

### Edge Functions:
- `simple-totvs-check` → `usage-verification`
- `detect-totvs-usage` → `detect-usage`
- `analyze-totvs-fit` → `analyze-product-fit`
- `web-scraper-totvs` → `web-scraper-usage`
- `totvs-integration` → `product-integration`

### Console Logs:
- `[TOTVS]` → `[VERIFICATION]`
- `[TOTVS-CARD]` → `[VERIFICATION-CARD]`
- `[TOTVS-REG]` → `[VERIFICATION-REG]`
- `[BATCH] ✅ ... totvsResult` → `[BATCH] ✅ ... verificationResult`

---

**Iniciando substituições sistemáticas...**

