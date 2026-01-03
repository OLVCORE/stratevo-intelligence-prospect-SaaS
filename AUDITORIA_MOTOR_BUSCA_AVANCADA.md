# 🔍 AUDITORIA TÉCNICA - MOTOR DE BUSCA AVANÇADA

**Data:** 2026-01-03  
**Objetivo:** Identificar gaps e problemas que impedem o funcionamento

---

## ✅ O QUE EXISTE

### **Arquivos Encontrados:**
1. ✅ `supabase/functions/prospeccao-avancada-buscar/index.ts` (910 linhas)
2. ✅ `src/modules/prospeccao-avancada/services/enrichmentService.ts` (164 linhas)
3. ✅ `src/modules/prospeccao-avancada/pages/ProspeccaoAvancadaPage.tsx` (225 linhas)
4. ✅ `src/modules/prospeccao-avancada/components/BuscaEmpresasForm.tsx` (193 linhas)
5. ✅ `src/modules/prospeccao-avancada/components/ResultadoEmpresasTable.tsx` (210 linhas)
6. ✅ `src/modules/prospeccao-avancada/components/BotaoEnviarQualificacao.tsx`
7. ✅ `supabase/migrations/20250225000009_create_prospeccao_avancada_tables.sql`

---

## ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS

### **1. VALIDAÇÃO DE SECRETS (CRÍTICO)**
**Problema:** Edge Function não valida `EMPRESAQUI_API_KEY` no início
- **Linha 402:** Só retorna `[]` se não tiver key, mas não retorna erro claro
- **Impacto:** Sistema retorna zero resultados sem explicar o motivo
- **Solução:** Validar no início e retornar `{sucesso:false, error_code:"MISSING_EMPRESAQUI_API_KEY"}`

### **2. FALTAM CAMPOS NO CONTRATO (CRÍTICO)**
**Problema:** Não existe `quantidadeDesejada`, `page`, `pageSize` em nenhum lugar
- **FiltrosBusca (frontend):** Não tem esses campos
- **FiltrosBusca (Edge Function):** Não tem esses campos
- **Impacto:** Não é possível controlar quantas empresas buscar ou paginar
- **Solução:** Adicionar campos e implementar lógica de paginação

### **3. TIPOS NÃO ALINHADOS (CRÍTICO)**
**Problema:** Tipos duplicados e não sincronizados
- **Frontend:** `FiltrosBusca` e `EmpresaEnriquecida` em `enrichmentService.ts`
- **Edge Function:** Mesmos tipos definidos inline
- **Impacto:** Risco de incompatibilidade entre frontend e backend
- **Solução:** Criar `src/modules/prospeccao-avancada/types.ts` único

### **4. NÃO TEM DIAGNOSTICS (MÉDIO)**
**Problema:** Edge Function não retorna informações de debug
- **Linha 870:** Retorna apenas `{sucesso, empresas, total}`
- **Falta:** `diagnostics` com `candidates_collected`, `candidates_after_filter`, etc.
- **Impacto:** Impossível debugar quando retorna zero resultados
- **Solução:** Adicionar objeto `diagnostics` na resposta

### **5. NÃO TEM UPSERT/DEDUPE (MÉDIO)**
**Problema:** `salvarEmpresasBrutas` sempre faz INSERT, pode duplicar
- **Linha 136:** `insert(empresasParaSalvar)` sem verificar duplicatas
- **Impacto:** Mesma empresa pode ser salva múltiplas vezes
- **Solução:** Implementar upsert baseado em CNPJ + tenant_id

### **6. FILTRO DE FATURAMENTO/FUNCIONÁRIOS NÃO APLICADO (MÉDIO)**
**Problema:** Edge Function recebe `faturamentoMin/Max` e `funcionariosMin/Max` mas não filtra
- **Linha 838:** Filtro só verifica CNPJ/nome/site
- **Impacto:** Retorna empresas fora dos critérios do usuário
- **Solução:** Aplicar filtros numéricos antes de retornar

### **7. NÃO TEM PAGINAÇÃO NO FRONTEND (BAIXO)**
**Problema:** Frontend não tem controles de paginação
- **ResultadoEmpresasTable:** Mostra todas as empresas de uma vez
- **Impacto:** Performance ruim com muitas empresas
- **Solução:** Adicionar paginação com botões Próxima/Anterior

### **8. NÃO TEM QUANTIDADE_DESEJADA NO FORM (BAIXO)**
**Problema:** Formulário não tem campo para quantidade desejada
- **BuscaEmpresasForm:** Não tem input para `quantidadeDesejada`
- **Impacto:** Usuário não pode controlar quantas empresas buscar
- **Solução:** Adicionar campo numérico com validação (1-100)

---

## 🔧 GAPS DE IMPLEMENTAÇÃO

### **Edge Function (`prospeccao-avancada-buscar/index.ts`):**

1. ❌ **Validação inicial de secrets:**
   - Não valida `EMPRESAQUI_API_KEY` no início
   - Não retorna erro claro se faltar

2. ❌ **Normalização de filtros:**
   - Não tem função para normalizar `localizacao` (cidade/UF)
   - Não tem defaults para `quantidadeDesejada`, `page`, `pageSize`
   - Não tem limites máximos

3. ❌ **Coleta de candidatas:**
   - Não implementa "collector" que busca mais do que necessário
   - Não calcula `metaCandidates = max(quantidadeDesejada*3, 60)`

4. ❌ **Filtragem antes de enriquecer:**
   - Não filtra por `faturamentoMin/Max` e `funcionariosMin/Max`
   - Não valida CNPJ com 14 dígitos após limpeza

5. ❌ **Enriquecimento com limites:**
   - Não tem `concurrency limit` (ex.: 5 em paralelo)
   - Não tem `timeout` por chamada (ex.: 8s)
   - Não tem retry leve (1 retry apenas em 429/5xx)

6. ❌ **Garantir quantidade_desejada:**
   - Não corta para `quantidadeDesejada` após enriquecer
   - Não implementa paginação lógica

7. ❌ **Persistência:**
   - Não faz upsert (sempre INSERT)
   - Não dedupe por CNPJ + tenant_id

8. ❌ **Response format:**
   - Não retorna `diagnostics`
   - Não retorna `has_more`
   - Não retorna `page` e `pageSize`

### **Frontend (`enrichmentService.ts`):**

1. ❌ **Tipos:**
   - Tipos duplicados (devem estar em `types.ts`)
   - `FiltrosBusca` não tem `quantidadeDesejada`, `page`, `pageSize`

2. ❌ **Invoke:**
   - Não passa `quantidadeDesejada`, `page`, `pageSize` para Edge Function

3. ❌ **Tratamento de erros:**
   - Não exibe `error_code` do backend
   - Não mostra mensagem amigável para `MISSING_EMPRESAQUI_API_KEY`

### **Frontend (`BuscaEmpresasForm.tsx`):**

1. ❌ **Campos faltando:**
   - Não tem input para `quantidadeDesejada`
   - Não tem input para `pageSize`

2. ❌ **Validação:**
   - Não valida min/max de `quantidadeDesejada` (1-100)
   - Não valida min/max de `pageSize` (1-50)

### **Frontend (`ResultadoEmpresasTable.tsx`):**

1. ❌ **Paginação:**
   - Não tem botões Próxima/Anterior
   - Não mostra `has_more`
   - Não desabilita botões quando apropriado

---

## 📋 CHECKLIST DE CORREÇÕES NECESSÁRIAS

### **TAREFA 1: Auditoria** ✅
- [x] Localizar arquivos existentes
- [x] Identificar gaps
- [x] Documentar problemas

### **TAREFA 2: Secrets/Headers** ⏳
- [ ] Validar `EMPRESAQUI_API_KEY` no início da Edge Function
- [ ] Retornar erro claro se faltar
- [ ] Verificar se secrets estão no Supabase Dashboard

### **TAREFA 3: Types.ts** ⏳
- [ ] Criar `src/modules/prospeccao-avancada/types.ts`
- [ ] Mover `FiltrosBusca` e `EmpresaEnriquecida` para lá
- [ ] Adicionar `quantidadeDesejada`, `page`, `pageSize`
- [ ] Adicionar `EmpresaEnriquecidaComId` (com `id` do banco)
- [ ] Adicionar `ResponseBusca` com `diagnostics`

### **TAREFA 4: Edge Function** ⏳
- [ ] Validar secrets no início
- [ ] Normalizar filtros (localizacao, defaults, limites)
- [ ] Implementar collector (metaCandidates)
- [ ] Filtrar antes de enriquecer (faturamento/funcionários)
- [ ] Enriquecer com concurrency limit e timeout
- [ ] Garantir quantidade_desejada
- [ ] Implementar upsert/dedupe
- [ ] Retornar diagnostics e paginação

### **TAREFA 5: Frontend** ⏳
- [ ] Atualizar `FiltrosBusca` com novos campos
- [ ] Adicionar campos no formulário
- [ ] Passar novos campos para Edge Function
- [ ] Tratar `error_code` e exibir mensagens amigáveis
- [ ] Implementar paginação na tabela
- [ ] Usar tipos de `types.ts`

### **TAREFA 6: Teste** ⏳
- [ ] Testar busca com `quantidadeDesejada=10`
- [ ] Verificar logs da Edge Function
- [ ] Validar upsert (não duplicar)
- [ ] Testar paginação

---

## 🎯 PRIORIZAÇÃO

### **CRÍTICO (Fazer primeiro):**
1. Validar `EMPRESAQUI_API_KEY` e retornar erro claro
2. Adicionar `quantidadeDesejada`, `page`, `pageSize` nos tipos
3. Implementar collector e garantir quantidade_desejada
4. Filtrar por faturamento/funcionários

### **IMPORTANTE (Fazer em seguida):**
5. Criar `types.ts` único
6. Implementar upsert/dedupe
7. Adicionar diagnostics na resposta
8. Adicionar campos no formulário

### **DESEJÁVEL (Fazer depois):**
9. Implementar paginação no frontend
10. Adicionar concurrency limit e timeout
11. Melhorar tratamento de erros no frontend

---

## 📝 PRÓXIMOS PASSOS

1. **Criar `types.ts`** com todos os tipos alinhados
2. **Corrigir Edge Function** com validações e lógica completa
3. **Atualizar frontend** com novos campos e tratamento de erros
4. **Testar** end-to-end

