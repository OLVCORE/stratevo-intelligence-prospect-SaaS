# 🎯 PLANO DE REVISÃO E IMPLEMENTAÇÃO - ABA TOTVS

## 📋 STATUS ATUAL - PROBLEMAS IDENTIFICADOS

### ❌ PROBLEMA 1: Botão "Atualizar" não funciona
**O que acontece:**
- Usuário clica em "Atualizar"
- Mostra alerta: "JÁ EXISTE UM RELATÓRIO SALVO!"
- Usuário confirma
- **Nada acontece** - o relatório não é refeito

**Causa Raiz:**
```typescript
// TOTVSCheckCard.tsx linha 673-749
const handleVerify = async () => {
  if (hasSaved) {
    const confirmar = window.confirm(...);
    if (!confirmar) return;
    // 🔥 PROBLEMA: Deleta cache mas não força nova busca
    // O `enabled` pode não estar sendo setado corretamente
    // O `refetch()` pode não estar sendo chamado
  }
}
```

### ❌ PROBLEMA 2: Zero evidências em empresas que usam TOTVS
**O que acontece:**
- Empresas conhecidas por usar TOTVS (Tradimaq S.A., etc.)
- Sistema retorna **0 evidências**
- Principalmente em buscas de **vagas**

**Causa Raiz Identificada:**
```typescript
// simple-totvs-check/index.ts linha 1124
const query = `site:${portal} "${companyName}" "TOTVS"`;
```

**PROBLEMA:** Esta query é MUITO restritiva:
- ❌ Busca EXATAMENTE "TOTVS" junto com nome da empresa
- ❌ Para vagas, geralmente menciona "Protheus", "RM", "ADVPL" mas NÃO "TOTVS"
- ❌ Exemplo real: "Vaga Desenvolvedor Protheus na Tradimaq" → **NÃO ENCONTRA** porque não tem "TOTVS" explícito

**Query Correta Deveria Ser:**
```typescript
// Para portais de vagas:
const query = `site:${portal} "${companyName}" ("Protheus" OR "RM" OR "Datasul" OR "Winthor" OR "Logix" OR "TOTVS" OR "ADVPL")`;

// Para casos oficiais TOTVS:
const query = `site:${portal} ("case" OR "cliente") "${companyName}"`;

// Para notícias:
const query = `site:${portal} "${companyName}" ("TOTVS" OR "ERP" OR "implementação" OR "sistema")`;
```

### ❌ PROBLEMA 3: Validação `isValidTOTVSEvidence` muito restritiva
**Problemas identificados:**
1. ✅ CORRIGIDO: Variações case-insensitive (S.A. vs S.a.)
2. ✅ CORRIGIDO: Busca de TOTVS com padrões melhorados
3. ⚠️ PENDENTE: Query de busca ainda não foi corrigida
4. ⚠️ PENDENTE: Produtos detectados podem não estar sendo considerados

### ❌ PROBLEMA 4: Barra de progresso não mostra fases reais
**O que acontece:**
- Barra usa apenas estimativas de tempo (15s, 27s, etc.)
- Backend não envia atualizações de fase em tempo real
- Usuário não sabe em qual fase real está

---

## 🔍 ANÁLISE DETALHADA - MICRO-CICLOS DE TRABALHO

### CICLO 1: CORRIGIR BOTÃO "ATUALIZAR" 
**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 30 minutos

**Análise:**
```typescript
// Arquivo: src/components/totvs/TOTVSCheckCard.tsx
// Função: handleVerify (linha 673)

PROBLEMAS ENCONTRADOS:
1. Linha 736: removeQueries mas não força refetch imediatamente
2. Linha 746: setEnabled(true) mas pode não estar funcionando se query está desabilitada
3. Linha 750: refetch() mas pode estar usando cache antigo
4. Linha 753: invalidateQueries mas pode ser depois do refetch

SOLUÇÃO PROPOSTA:
1. Após deletar cache, AGUARDAR confirmação (500ms)
2. FORÇAR refetch com { cancelRefetch: true }
3. INVALIDAR queries ANTES do refetch
4. SET enabled=true ANTES de qualquer await
5. ADICIONAR toast "Reiniciando verificação..." para feedback visual
```

**Mudanças Necessárias:**
- [ ] Reordenar chamadas: invalidate → setEnabled → await → refetch
- [ ] Adicionar toast de feedback
- [ ] Forçar cancelamento de refetch anterior
- [ ] Garantir que `enabled` está true antes de refetch

---

### CICLO 2: CORRIGIR QUERIES DE BUSCA
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 2 horas

**Análise:**
```typescript
// Arquivo: supabase/functions/simple-totvs-check/index.ts
// Função: searchMultiplePortals (linha 1107)

PROBLEMA ATUAL (linha 1124):
const query = `site:${portal} "${companyName}" "TOTVS"`;

QUERIES CORRETAS POR CATEGORIA:

1. PORTALS DE VAGAS (JOB_PORTALS_NACIONAL):
   ✅ DEVE BUSCAR produtos TOTVS (não só "TOTVS"):
   query = `site:${portal} "${companyName}" ("Protheus" OR "RM" OR "Datasul" OR "Winthor" OR "Logix" OR "TOTVS" OR "ADVPL" OR "TLPP")`;
   
   Exemplos:
   - LinkedIn: `site:linkedin.com/jobs "Tradimaq S.A." ("Protheus" OR "RM" OR "TOTVS")`
   - Indeed: `site:indeed.com.br "Tradimaq" ("Protheus" OR "ADVPL")`

2. CASES OFICIAIS TOTVS (TOTVS_OFFICIAL_SOURCES):
   ✅ DEVE BUSCAR por "case" ou "cliente":
   query = `site:${portal} ("case" OR "cliente" OR "depoimento") "${companyName}"`;
   
   Exemplo:
   - TOTVS Blog: `site:totvs.com/blog ("case" OR "cliente") "Tradimaq"`

3. NOTÍCIAS PREMIUM (NEWS_SOURCES_PREMIUM):
   ✅ DEVE BUSCAR contexto de uso/implementação:
   query = `site:${portal} "${companyName}" ("TOTVS" OR "ERP" OR "implementação" OR "migração" OR "sistema")`;
   
   Exemplo:
   - Valor: `site:valor.globo.com "Tradimaq" ("TOTVS" OR "Protheus" OR "implementação")`

4. FONTES OFICIAIS (OFFICIAL_SOURCES_BR):
   ✅ DEVE BUSCAR contratos/menções:
   query = `site:${portal} "${companyName}" ("TOTVS" OR "contrato" OR "licitação")`;
   
   Exemplo:
   - Portal Transparência: `site:portaltransparencia.gov.br "Tradimaq" "TOTVS"`

5. REDES SOCIAIS/VIDEOS:
   ✅ DEVE BUSCAR produtos + empresa:
   query = `site:${portal} "${companyName}" ("Protheus" OR "RM" OR "TOTVS")`;
   
   Exemplo:
   - YouTube: `site:youtube.com "Tradimaq" ("TOTVS" OR "Protheus")`
   - LinkedIn: `site:linkedin.com/posts "${companyName}" ("TOTVS" OR "Protheus" OR "RM")`
```

**Mudanças Necessárias:**
- [ ] Criar função `generateQueryBySourceType(sourceType, portal, companyName, produtos)`
- [ ] Implementar queries específicas por categoria (vagas, cases, notícias, etc.)
- [ ] Adicionar produtos TOTVS nas queries de vagas
- [ ] Testar queries manualmente no Google antes de implementar

---

### CICLO 3: MELHORAR DETECÇÃO DE PRODUTOS EM QUERIES
**Prioridade:** 🟡 ALTA
**Estimativa:** 1 hora

**Análise:**
```typescript
// Arquivo: supabase/functions/simple-totvs-check/index.ts
// Função: detectTotvsProducts (linha ~950)

PROBLEMA:
- Produtos são detectados APÓS busca, mas query não inclui produtos
- Se busca só "TOTVS", pode não encontrar "Protheus" ou "RM"
- Precisa INCLUIR produtos NA QUERY desde o início

SOLUÇÃO:
1. Identificar produtos TOTVS do setor ANTES de buscar
2. Incluir produtos na query de busca
3. Detectar produtos TAMBÉM na validação (backup)
```

**Mudanças Necessárias:**
- [ ] Identificar setor da empresa
- [ ] Buscar produtos TOTVS do setor (MATRIZ_SETORES_PRODUTOS)
- [ ] Incluir produtos na query de busca
- [ ] Manter detecção de produtos na validação como backup

---

### CICLO 4: AJUSTAR VALIDAÇÃO PARA ACEITAR PRODUTOS SEM "TOTVS"
**Prioridade:** 🟡 ALTA
**Estimativa:** 1 hora

**Análise:**
```typescript
// Arquivo: supabase/functions/simple-totvs-check/index.ts
// Função: isValidTOTVSEvidence (linha 660)

MUDANÇAS JÁ IMPLEMENTADAS:
✅ Variações case-insensitive (S.A. vs S.a.)
✅ Padrões de busca TOTVS melhorados (totvs.com.br, totvs rm, etc.)
✅ Detecção de produtos no contexto

MUDANÇAS PENDENTES:
⚠️ Aceitar produtos sem "TOTVS" explícito como DOUBLE MATCH
⚠️ Melhorar detecção de produtos em snippets curtos
⚠️ Ajustar janela de contexto para vagas (podem ter menos texto)
```

**Mudanças Necessárias:**
- [ ] Revisar lógica de DOUBLE MATCH com produtos
- [ ] Ajustar validação para aceitar "Protheus" sem "TOTVS" se contexto for válido
- [ ] Melhorar detecção de produtos em snippets de vagas

---

### CICLO 5: IMPLEMENTAR PROGRESSO REAL NO BACKEND
**Prioridade:** 🟢 MÉDIA (melhoria UX)
**Estimativa:** 2 horas

**Análise:**
```typescript
// PROBLEMA: Backend não envia progresso em tempo real
// SOLUÇÃO: Implementar SSE (Server-Sent Events) ou polling com status

OPÇÃO 1: SSE (Melhor, mas complexo)
- Backend envia eventos de progresso
- Frontend escuta eventos e atualiza barra

OPÇÃO 2: Polling com status (Mais simples)
- Backend salva status em database durante execução
- Frontend faz polling a cada 2s para verificar status
- Status inclui: fase atual, % completo, evidências encontradas

OPÇÃO 3: Melhorar estimativas (Mais rápido de implementar)
- Ajustar estimativas baseadas em resultados reais
- Adicionar contador de evidências encontradas na barra
```

**Recomendação:** OPÇÃO 3 primeiro (rápido), depois OPÇÃO 2 (médio prazo)

---

## 📊 MATRIZ DE QUERIES CORRIGIDAS

### Template de Query por Categoria:

```typescript
interface QueryTemplate {
  sourceType: string;
  portals: string[];
  queryPattern: string;
  exemplo: string;
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    sourceType: 'job_portals',
    portals: ['br.linkedin.com/jobs', 'br.indeed.com', 'portal.gupy.io'],
    queryPattern: `site:{portal} "{empresa}" ("{produtos}")`,
    exemplo: `site:linkedin.com/jobs "Tradimaq" ("Protheus" OR "RM" OR "ADVPL" OR "TOTVS")`
  },
  {
    sourceType: 'totvs_cases',
    portals: ['totvs.com/blog', 'totvs.com/cases'],
    queryPattern: `site:{portal} ("case" OR "cliente" OR "depoimento") "{empresa}"`,
    exemplo: `site:totvs.com/blog ("case" OR "cliente") "Tradimaq"`
  },
  {
    sourceType: 'premium_news',
    portals: ['valor.globo.com', 'exame.com', 'infomoney.com.br'],
    queryPattern: `site:{portal} "{empresa}" ("TOTVS" OR "ERP" OR "implementação" OR "migração")`,
    exemplo: `site:valor.globo.com "Tradimaq" ("TOTVS" OR "Protheus" OR "implementação")`
  },
  // ... outras categorias
];
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO - ORDEM DE EXECUÇÃO

### FASE 1: CORREÇÕES CRÍTICAS (Urgente - Fazer AGORA)
**Tempo estimado:** 3-4 horas

1. **CICLO 1:** Corrigir botão "Atualizar" ✅
   - [ ] Reordenar lógica de cache invalidation
   - [ ] Forçar refetch após limpar cache
   - [ ] Adicionar toast de feedback
   - [ ] Testar fluxo completo

2. **CICLO 2:** Corrigir queries de busca ✅
   - [ ] Criar função `generateQueryBySourceType`
   - [ ] Implementar queries específicas por categoria
   - [ ] Adicionar produtos TOTVS nas queries
   - [ ] Testar queries manualmente no Google
   - [ ] Deploy e teste com Tradimaq S.A.

### FASE 2: MELHORIAS IMPORTANTES (Próximos 2 dias)
**Tempo estimado:** 2-3 horas

3. **CICLO 3:** Melhorar detecção de produtos
   - [ ] Identificar setor antes de buscar
   - [ ] Incluir produtos do setor nas queries
   - [ ] Testar com diferentes setores

4. **CICLO 4:** Ajustar validação
   - [ ] Revisar lógica DOUBLE MATCH com produtos
   - [ ] Aceitar produtos sem "TOTVS" explícito
   - [ ] Testar com casos reais

### FASE 3: MELHORIAS DE UX (Opcional - Fazer depois)
**Tempo estimado:** 2 horas

5. **CICLO 5:** Progresso real no backend
   - [ ] Implementar polling ou SSE
   - [ ] Mostrar evidências encontradas em tempo real
   - [ ] Ajustar barra de progresso

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após cada correção, validar:

### Teste 1: Botão "Atualizar"
- [ ] Clicar em "Atualizar" com relatório salvo
- [ ] Confirmar alerta
- [ ] Verificar que cache foi deletado (logs)
- [ ] Verificar que nova busca foi iniciada
- [ ] Verificar que barra de progresso aparece
- [ ] Verificar que resultado é diferente do anterior

### Teste 2: Busca de Vagas
- [ ] Buscar empresa conhecida (Tradimaq S.A.)
- [ ] Verificar logs de queries enviadas ao Serper
- [ ] Verificar que queries incluem produtos TOTVS
- [ ] Verificar que evidências são encontradas
- [ ] Validar que evidências são válidas (triple/double match)

### Teste 3: Casos Reais
- [ ] Testar com 5 empresas que sabemos que usam TOTVS
- [ ] Verificar que pelo menos 3 encontram evidências
- [ ] Validar que evidências são relevantes

---

## 🚨 AVISOS IMPORTANTES

1. **NÃO IMPLEMENTAR TUDO DE UMA VEZ**
   - Implementar CICLO por CICLO
   - Testar cada ciclo antes de passar para o próximo
   - Fazer deploy incremental

2. **MANTER BACKUP DO CÓDIGO ATUAL**
   - Commit antes de cada mudança
   - Branch separado para correções
   - Documentar o que foi alterado

3. **TESTAR LOCALMENTE ANTES DE DEPLOY**
   - Testar queries manualmente no Google
   - Testar validação com exemplos reais
   - Verificar logs detalhadamente

---

## 📝 PRÓXIMOS PASSOS

1. ✅ **REVISAR ESTE PLANO** - Usuário deve aprovar antes de implementar
2. ⏳ **AGUARDAR APROVAÇÃO** - Não implementar nada até aprovação
3. ⏳ **IMPLEMENTAR FASE 1** - Apenas após aprovação
4. ⏳ **TESTAR E VALIDAR** - Testar cada correção
5. ⏳ **ITERAR** - Ajustar conforme necessário

---

## ❓ DÚVIDAS PARA REVISÃO

1. **Queries de vagas:** Devemos buscar TODOS os produtos TOTVS ou apenas os do setor da empresa?
   - **Recomendação:** Buscar produtos do setor primeiro, se não encontrar nada, buscar todos

2. **Validação:** Aceitar "Protheus" sem "TOTVS" como DOUBLE MATCH ou exigir TRIPLE MATCH?
   - **Recomendação:** DOUBLE MATCH se contexto for válido (ex: vaga de emprego)

3. **Progresso:** Implementar SSE ou usar polling?
   - **Recomendação:** Polling primeiro (mais simples), SSE depois (melhor UX)

---

**STATUS:** ⏸️ AGUARDANDO APROVAÇÃO DO USUÁRIO

**PRÓXIMA AÇÃO:** Revisar plano e aprovar antes de implementar

