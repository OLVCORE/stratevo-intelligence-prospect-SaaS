# 🛡️ CHECKPOINT DE PROTEÇÃO DE CÓDIGO

**Data de Criação:** 17/11/2025  
**Objetivo:** Proteger código validado e funcionalidades críticas

---

## ⚠️ ORDEM DE OPERAÇÃO - NUNCA VIOLAR

### ANTES DE QUALQUER MODIFICAÇÃO:

1. ✅ **LER** `CRITICAL_VALIDATED_RULES.md`
2. ✅ **LER** `KNOWLEDGE_BASE_RAG.md`
3. ✅ **VERIFICAR** se mudança afeta código crítico
4. ✅ **CONSULTAR** histórico de validações
5. ✅ **TESTAR** contra casos conhecidos
6. ✅ **DOCUMENTAR** mudança antes de aplicar

---

## 🔒 ARQUIVOS PROTEGIDOS (NÃO MODIFICAR SEM AUTORIZAÇÃO)

### Nível 1: CRÍTICO (Nunca Modificar)

1. **`supabase/functions/simple-totvs-check/index.ts`**
   - Função: `isValidTOTVSEvidence()` (linhas ~609-760)
   - Função: `fetchAndAnalyzeUrlContext()` (linhas ~515-604)
   - Padrões regex: `falsePositivePatterns` (linhas ~663-686)
   - **Status:** ✅ VALIDADO EM 20+ ITERAÇÕES

2. **`supabase/functions/discover-all-technologies/index.ts`**
   - Função: `isValidCompetitorEvidence()` (linhas ~273-500)
   - Função: `fetchAndAnalyzeUrlContextCompetitor()` (linhas ~182-267)
   - Padrões regex: `falsePositivePatterns` (linhas ~311-354)
   - **Status:** ✅ VALIDADO EM 20+ ITERAÇÕES

3. **Documentação de Conhecimento:**
   - `CRITICAL_VALIDATED_RULES.md` - NUNCA APAGAR
   - `KNOWLEDGE_BASE_RAG.md` - NUNCA APAGAR
   - `CHECKPOINT_CODE_PROTECTION.md` - Este arquivo

### Nível 2: IMPORTANTE (Modificar com Cuidado)

1. Componentes de UI que usam dados das funções críticas
2. Hooks que chamam edge functions
3. Validações de frontend que replicam lógica de backend

---

## 🧪 CASOS DE TESTE OBRIGATÓRIOS

### Antes de Deploy, SEMPRE Testar:

1. **Klabin vs Ibema (Falso Positivo)**
   - Cenário: Investigando Klabin
   - Evidência: "Klabin, Ibema e Suzano são do setor de papel"
   - Resultado Esperado: ❌ REJEITAR

2. **Klabin + TOTVS (Verdadeiro Positivo)**
   - Cenário: Investigando Klabin
   - Evidência: "Klabin implementou TOTVS Protheus"
   - Resultado Esperado: ✅ ACEITAR

3. **Sage Editora (Falso Positivo)**
   - Cenário: Investigando empresa qualquer
   - Evidência: "Case Study Research: design and methods, Londres: Sage, 1994"
   - Resultado Esperado: ❌ REJEITAR

4. **Sage ERP (Verdadeiro Positivo)**
   - Cenário: Investigando empresa qualquer
   - Evidência: "Empresa usa Sage ERP para gestão"
   - Resultado Esperado: ✅ ACEITAR

---

## 📋 CHECKLIST DE PROTEÇÃO

### Antes de Modificar Código Crítico:

- [ ] Li `CRITICAL_VALIDATED_RULES.md`
- [ ] Li `KNOWLEDGE_BASE_RAG.md`
- [ ] Identifiquei qual regra está sendo afetada
- [ ] Documentei motivo da mudança
- [ ] Testei contra casos conhecidos
- [ ] Validei que não introduz novos falsos positivos
- [ ] Atualizei histórico de modificações
- [ ] Obtive aprovação antes de aplicar

### Antes de Deploy:

- [ ] Executei todos os casos de teste obrigatórios
- [ ] Validei assertividade não diminuiu
- [ ] Verifiquei que não há regressões
- [ ] Documentei mudanças no histórico
- [ ] Atualizei arquivos de conhecimento

---

## 🔄 FLUXO DE PROTEÇÃO

```
Usuário pede mudança
    ↓
Verificar se afeta código crítico
    ↓
Se SIM → Ler documentação protegida
    ↓
Testar contra casos conhecidos
    ↓
Documentar mudança proposta
    ↓
Aplicar apenas se aprovação
    ↓
Atualizar histórico
```

---

**💡 Este arquivo garante que conhecimento validado não seja perdido.**

