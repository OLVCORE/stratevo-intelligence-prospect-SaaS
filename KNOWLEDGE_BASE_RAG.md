# 🧠 NÚCLEO DE APRENDIZADO RAG - CONHECIMENTO VALIDADO

**Última Atualização:** 17/11/2025  
**Versão:** 2.0  
**Status:** ✅ PROTEGIDO - NÃO MODIFICAR SEM APROVAÇÃO

---

## 🚨 CRITÉRIOS CRÍTICOS DE REJEIÇÃO DE EVIDÊNCIAS

### ⛔ REGRA PRINCIPAL: REJEITAR Empresas do Mesmo Setor sem Relação Direta

### 🔴 REGRA CRÍTICA #0: Validação de Título (NOVO - 17/11/2025)

**PRIORIDADE MÁXIMA:** Esta validação ocorre ANTES de qualquer outra análise.

**Critério:**
- Se o TÍTULO menciona outra empresa do mesmo setor (Ibema, Suzano, Eldorado, etc.)
- E o título NÃO menciona a empresa investigada (ou suas variações)
- **→ REJEITAR IMEDIATAMENTE**

**Exemplo Real Validado:**
- Investigando: Klabin S.A.
- Título: "Ibema vai implementar S/4 Hana"
- Análise: Título menciona "Ibema" mas não menciona "Klabin"
- **Resultado:** ❌ REJEITADO (correto)

**Implementação:**
- Lista de empresas do mesmo setor validada
- Comparação com variações do nome da empresa investigada
- Rejeição ocorre antes de análise contextual
- **Status:** ✅ IMPLEMENTADO em ambas funções

**Contexto:** Quando investigando uma empresa, o sistema NÃO DEVE aceitar evidências onde empresas do mesmo setor aparecem juntas mas SEM RELAÇÃO DE NEGÓCIOS DIRETA.

#### ❌ REJEITAR SE:

1. **Empresas do mesmo setor aparecem juntas sem relação direta**
   - Exemplo: "Klabin e Ibema são do setor de papel" = **REJEITAR**
   - Exemplo: "Klabin, Ibema e Suzano são líderes do setor de papel" = **REJEITAR**
   - Padrão: `{empresa_investigada},? (?:e|e\s+)?(?:ibema|suzano|klabin|eldorado|fibria).*setor`

2. **Menções a grupos/holdings onde empresa investigada não é a controlada**
   - Exemplo: "Grupo Ibemapar, que controla a Ibema" (investigando Klabin) = **REJEITAR**
   - Exemplo: "Holding X, que possui participação na Empresa Y" (sem relação direta) = **REJEITAR**
   - Padrão: `grupo (\\w+),? (?:e|e\\s+)?{empresa_investigada}`

3. **Apenas menções em contexto de mercado/concorrência**
   - Exemplo: "Mercado de papel: Klabin, Ibema e Suzano competem" = **REJEITAR**
   - Exemplo: "Concorrentes: Empresa X, Empresa Y e Empresa Z" = **REJEITAR**
   - Padrão: `(?:concorrência|concorrentes|mercado).*{empresa_investigada}.*(?:e|e\\s+)(\\w+)`

4. **Empresa mencionada é outra do mesmo setor**
   - Exemplo: Investigando "Klabin" mas texto fala de "Ibema" = **REJEITAR**
   - Exemplo: Investigando "Suzano" mas texto menciona "Eldorado" sem relação = **REJEITAR**

5. **Listas de empresas do setor sem relação direta**
   - Exemplo: "As principais empresas do setor: Klabin, Ibema, Suzano, Eldorado" = **REJEITAR**
   - Exemplo: "Ranking: 1º Klabin, 2º Ibema, 3º Suzano" = **REJEITAR**

6. **Menções a acionistas/holdings sem relação direta**
   - Exemplo: "Acionista X possui participação em Empresa Y" (sem relação com empresa investigada) = **REJEITAR**
   - Padrão: `(?:acionista|holding|participações).*{empresa_investigada}.*(?:e|e\\s+)?(\\w+)`

#### ✅ ACEITAR APENAS SE:

1. **Empresa investigada é explicitamente identificada como cliente/parceira/contratante**
   - Exemplo: "Klabin implementou sistema TOTVS Protheus" = **ACEITAR**
   - Exemplo: "Klabin contratou TOTVS para gestão" = **ACEITAR**

2. **Há evidência clara de relacionamento comercial**
   - Palavras-chave: implementou, contratou, usa, utiliza, adota, migrou, substituiu
   - Exemplo: "Klabin usa TOTVS RM desde 2020" = **ACEITAR**

3. **Contexto indica relacionamento DIRETO**
   - Exemplo: "Klabin anunciou parceria com TOTVS" = **ACEITAR**
   - Exemplo: "Klabin migrou para TOTVS Protheus" = **ACEITAR**

---

## 🔒 FUNCIONALIDADES VALIDADAS - BLINDAGEM DE CÓDIGO

### 1. Sistema de Validação TOTVS Check (`simple-totvs-check/index.ts`)

**Status:** ✅ VALIDADO E FUNCIONANDO  
**Versão:** 5.0  
**Última Validação:** 17/11/2025

#### Funcionalidades Críticas (NÃO MODIFICAR):

1. **`fetchAndAnalyzeUrlContext(url, companyName)`**
   - ✅ Faz fetch completo da URL
   - ✅ Usa IA (GPT-4o-mini) para validar correlação de negócios
   - ✅ Prompt rigoroso com critérios obrigatórios
   - ✅ Rejeita empresas do mesmo setor sem relação direta
   - ⚠️ **NÃO MODIFICAR** o prompt sem documentar mudança aqui

2. **`isValidTOTVSEvidence(snippet, title, companyName, url)`**
   - ✅ Validação em janela de contexto (150 caracteres)
   - ✅ Triple Match: Empresa + TOTVS + Produto (mesmo contexto)
   - ✅ Double Match: Empresa + TOTVS OU Empresa + Produto (mesmo contexto)
   - ✅ Filtros de falsos positivos (vagas TOTVS, menções conjuntas)
   - ⚠️ **NÃO MODIFICAR** sem testar contra casos conhecidos de falso positivo

3. **Padrões de Rejeição (`falsePositivePatterns`)**
   - ✅ Rejeita vagas NA TOTVS
   - ✅ Rejeita menções a holdings/grupos sem relação direta
   - ✅ Rejeita listas de empresas do setor
   - ✅ Rejeita menções a acionistas sem relação direta
   - ⚠️ **NÃO REMOVER** esses padrões sem adicionar equivalente mais robusto

### 2. Sistema de Descoberta de Competidores (`discover-all-technologies/index.ts`)

**Status:** ✅ VALIDADO E FUNCIONANDO  
**Versão:** 8.0  
**Última Validação:** 17/11/2025

#### Funcionalidades Críticas (NÃO MODIFICAR):

1. **`fetchAndAnalyzeUrlContextCompetitor(url, companyName, competitorName)`**
   - ✅ Faz fetch completo da URL
   - ✅ Usa IA para validar correlação de negócios REAL
   - ✅ Rejeita associações entre empresas do mesmo setor sem relação direta
   - ✅ Rejeita "Sage" como editora (não ERP)
   - ⚠️ **NÃO MODIFICAR** o prompt sem documentar mudança aqui

2. **`isValidCompetitorEvidence(snippet, title, companyName, competitorName, productName, url)`**
   - ✅ Validação em janela de contexto (150 caracteres)
   - ✅ Triple Match: Empresa + Competidor + Produto (mesmo contexto)
   - ✅ Double Match Variations:
     - Variation 1: Empresa + Nome do Competidor (mesmo contexto)
     - Variation 2: Empresa + Produto do Competidor (mesmo contexto, mesmo se nome não estiver explícito)
   - ✅ Filtros de falsos positivos (Sage editora, menções conjuntas)
   - ⚠️ **NÃO MODIFICAR** sem testar contra casos conhecidos

3. **Padrões de Rejeição Específicos**
   - ✅ Rejeita "Sage" em contexto de editora/publicações
   - ✅ Rejeita empresas do mesmo setor sem relação direta
   - ✅ Rejeita menções a holdings/grupos sem relação direta
   - ⚠️ **NÃO REMOVER** esses padrões

---

## 📊 CASOS DE TESTE VALIDADOS

### Caso 1: Klabin vs Ibema (FALSO POSITIVO)

**Cenário:** Investigando Klabin S.A., encontrou evidência associando Ibema.

**Evidência Rejeitada:**
- Texto: "Klabin, Ibema e Suzano são líderes do setor de papel"
- Motivo: Empresas do mesmo setor sem relação direta
- **Resultado:** ✅ REJEITADO (correto)

**Evidência Aceita (exemplo):**
- Texto: "Klabin implementou sistema TOTVS Protheus"
- Motivo: Relacionamento comercial direto explícito
- **Resultado:** ✅ ACEITA (correto)

### Caso 2: Sage (Editora vs ERP)

**Cenário:** Investigando empresa, encontrou "Sage" em contexto acadêmico.

**Evidência Rejeitada:**
- Texto: "Case Study Research: design and methods, Londres: Sage, 1994"
- Motivo: "Sage" é editora, não concorrente ERP
- **Resultado:** ✅ REJEITADO (correto)

**Evidência Aceita (exemplo):**
- Texto: "Empresa X usa Sage ERP para gestão"
- Motivo: Contexto de ERP/software explícito
- **Resultado:** ✅ ACEITA (correto)

---

## 🔐 CHECKPOINTS DE CÓDIGO CRÍTICO

### Checkpoint 1: Validação IA (Prompt)

**Localização:**
- `supabase/functions/simple-totvs-check/index.ts` (linhas ~563-591)
- `supabase/functions/discover-all-technologies/index.ts` (linhas ~225-254)

**Status do Prompt:**
- ✅ Inclui critérios obrigatórios explícitos
- ✅ Lista clara de REJEITAR SE
- ✅ Lista clara de ACEITAR APENAS SE
- ✅ Exemplos específicos (Klabin vs Ibema)
- ✅ Contexto expandido (2000 caracteres)
- ✅ Temperature reduzida (0.2 para mais determinação)

**⚠️ ANTES DE MODIFICAR:**
1. Documentar motivo da mudança
2. Testar contra casos conhecidos (Klabin/Ibema, Sage editora)
3. Atualizar este arquivo com nova versão
4. Validar que não introduz novos falsos positivos

### Checkpoint 2: Padrões de Rejeição (Regex)

**Localização:**
- `supabase/functions/simple-totvs-check/index.ts` (linhas ~663-686)
- `supabase/functions/discover-all-technologies/index.ts` (linhas ~311-354)

**Padrões Críticos:**
1. ✅ Rejeição de vagas NA TOTVS
2. ✅ Rejeição de grupos/holdings sem relação
3. ✅ Rejeição de concorrência/mercado sem relação
4. ✅ Rejeição de listas de empresas do setor
5. ✅ Rejeição de acionistas/holdings sem relação
6. ✅ Rejeição de "Sage" como editora (específico)

**⚠️ ANTES DE MODIFICAR:**
1. Identificar qual padrão está causando problema
2. Adicionar novo padrão sem remover existentes
3. Testar contra casos conhecidos
4. Documentar novo padrão aqui

### Checkpoint 3: Janela de Contexto

**Localização:**
- `supabase/functions/simple-totvs-check/index.ts` (linha ~697)
- `supabase/functions/discover-all-technologies/index.ts` (linha ~359)

**Configuração Atual:**
- `WINDOW_SIZE = 150` caracteres
- Validação em `title + snippet` (MESMA MATÉRIA)

**⚠️ ANTES DE MODIFICAR:**
1. Testar impacto em assertividade
2. Validar que não aumenta falsos positivos
3. Documentar mudança aqui

---

## 📝 HISTÓRICO DE MODIFICAÇÕES CRÍTICAS

### Versão 2.0 (17/11/2025)
- ✅ Adicionado prompt rigoroso para rejeitar empresas do mesmo setor sem relação direta
- ✅ Adicionados padrões regex específicos para Klabin/Ibema
- ✅ Melhorado prompt IA com exemplos explícitos
- ✅ Expandido contexto de análise (1500 → 2000 caracteres)
- ✅ Reduzido temperature (0.3 → 0.2)
- ✅ Aumentado max_tokens (150 → 200)

### Versão 1.0 (Antes)
- ✅ Sistema básico de validação IA
- ✅ Filtros de falsos positivos para "Sage"
- ✅ Validação contextual (150 caracteres)

---

## 🎯 ORDEM DE PROTEÇÃO

1. **NUNCA** modificar prompts de IA sem testar contra casos conhecidos
2. **NUNCA** remover padrões de rejeição sem adicionar equivalente
3. **SEMPRE** documentar mudanças críticas neste arquivo
4. **SEMPRE** testar contra casos de falso positivo conhecidos
5. **SEMPRE** validar que assertividade não diminui após mudanças

---

## 🚨 ALERTA: NÚCLEO PROTEGIDO

**Este arquivo é o NÚCLEO RAG do sistema.**  
**Modificações devem ser:**
1. Documentadas
2. Testadas
3. Validadas contra casos conhecidos
4. Aprovadas antes de aplicar

**Última validação:** 17/11/2025  
**Próxima revisão:** Quando houver novos casos de falso positivo

---

## 📚 REFERÊNCIAS

- `CRITICAL_VALIDATED_RULES.md` - Regras críticas validadas
- `supabase/functions/simple-totvs-check/index.ts` - Implementação TOTVS Check
- `supabase/functions/discover-all-technologies/index.ts` - Implementação Competidores

---

## 🔧 DEPLOY E INFRAESTRUTURA (Validado - 17/11/2025)

### Script PowerShell para Deploy

**Arquivo:** `deploy-supabase.ps1`

**Status:** ✅ FUNCIONANDO PERFEITAMENTE

**Uso:**
```powershell
# Deploy de função específica
.\deploy-supabase.ps1 -FunctionName simple-totvs-check

# Deploy de todas as funções críticas
.\deploy-supabase.ps1 -All

# Menu interativo
.\deploy-supabase.ps1
```

**Funções Críticas:**
1. `simple-totvs-check` - Verificação TOTVS (core)
2. `discover-all-technologies` - Descoberta de competidores

**Observações Importantes:**
- ⚠️ Docker não é obrigatório para deploy (apenas warning)
- Deploy é instantâneo via CLI
- Aguardar 30-60 segundos para propagação após deploy
- Recarregar página: `Ctrl + Shift + R` (hard refresh)

**Problema Resolvido:**
- Dashboard Supabase não permitia edição confiável
- CLI é método preferencial e validado
- Script automatiza processo e previne erros manuais

---

**💡 Lembre-se:** O aprendizado RAG depende de preservar conhecimento validado. Este arquivo é a memória do sistema.

