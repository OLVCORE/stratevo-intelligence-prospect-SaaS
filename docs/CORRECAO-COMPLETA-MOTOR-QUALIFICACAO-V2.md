# ✅ Correção Completa - Motor de Qualificação v2

**Data:** 08/12/2025

## 🎯 Problemas Identificados

1. ❌ Hook `useTenantIcps` retornava erro 400 (colunas inexistentes)
2. ❌ Função `process_qualification_job` não processava candidatos (0 qualificadas)
3. ❌ UI não mostrava ICP do job
4. ❌ Não havia seletor de ICP visível
5. ❌ Não havia resumo do processo
6. ❌ Job concluído podia ser reprocessado
7. ❌ Contadores não refletiam dados reais

## ✅ Correções Implementadas

### 1. Hook `useTenantIcps` - Corrigido

**Arquivo:** `src/hooks/useTenantIcps.ts`

**Problema:**
- Tentava buscar colunas `name`, `description`, `status` que não existem
- Schema real tem: `nome`, `descricao`, `ativo` (não `status`)

**Solução:**
- ✅ Query ajustada para usar apenas colunas existentes: `id, nome, descricao, icp_principal, ativo, tipo, setor_foco`
- ✅ Filtro por `ativo = true` para mostrar apenas ICPs ativos
- ✅ Normalização de dados (garantir que sempre tenha `nome`)
- ✅ Tratamento de erro retorna array vazio (não quebra a tela)

### 2. Função SQL `process_qualification_job` - Reescrita

**Arquivo:** `supabase/migrations/20250208000002_fix_process_qualification_job_real.sql`

**Problema:**
- Job marcava como concluído mas não processava candidatos
- Não criava registros em `qualified_prospects`
- Retornava 0 qualificadas

**Solução:**
- ✅ Busca candidatos vinculados ao job via `source_batch_id` (armazenado em `source_file_name`)
- ✅ Calcula `fit_score` real baseado em:
  - Setor match (30%)
  - Localização match (25%)
  - Dados completos (20%)
  - Website presente (15%)
  - Contato presente (10%)
- ✅ Determina grade (A+, A, B, C, D) baseado no score
- ✅ **Insere TODAS as empresas em `qualified_prospects`** (MVP: todas entram no pool)
- ✅ Atualiza contadores reais: `processed_count`, `enriched_count`, `grade_a_plus`, etc.
- ✅ Bloqueia reprocessamento de jobs concluídos (retorna contadores existentes)

### 3. UI `QualificationEnginePage` - Melhorada

**Arquivo:** `src/pages/QualificationEnginePage.tsx`

**Melhorias:**
- ✅ Seletor de ICP adicionado (somente leitura, mostra ICP do job)
- ✅ Resumo detalhado do processo mostra:
  - Lote
  - ICP (nome e ID)
  - Total CNPJs
  - Processadas / Qualificadas
  - Progresso
  - Distribuição por grade (A+, A, B, C, D)
  - Regras aplicadas
- ✅ Bloqueio de reprocessamento (botão desabilitado + toast para jobs concluídos)
- ✅ Contadores reais usados nas estatísticas (`processed_count`, `enriched_count`)
- ✅ Coluna "ICP" adicionada na tabela de lotes

## 📋 Arquivos Criados/Modificados

### Novos Arquivos:
1. `supabase/migrations/20250208000002_fix_process_qualification_job_real.sql` - Função SQL corrigida
2. `APLICAR-AGORA-V2.sql` - Script SQL pronto para aplicar no Supabase

### Arquivos Modificados:
1. `src/hooks/useTenantIcps.ts` - Query corrigida
2. `src/pages/QualificationEnginePage.tsx` - UI melhorada

## 🚀 Como Aplicar

### Passo 1: Aplicar Migration SQL

**Opção A: Via Supabase Dashboard (Recomendado)**
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto STRATEVO One
3. Vá em **SQL Editor**
4. Abra: `APLICAR-AGORA-V2.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Execute (Run)

**Opção B: Via CLI**
```bash
cd C:\Projects\stratevo-intelligence-prospect
supabase db push
```

### Passo 2: Testar o Fluxo Completo

1. **Upload CSV:**
   - Ir em **Prospecção → Importação Hunter**
   - Fazer upload da planilha (51 empresas)
   - Verificar: 51 empresas inseridas em `prospecting_candidates`
   - Verificar: Job criado com `icp_id` correto

2. **Motor de Qualificação:**
   - Ir em **Prospecção → 1. Motor de Qualificação**
   - Verificar: ICP aparece no seletor e no resumo
   - Selecionar o job pendente
   - Verificar: Resumo mostra todas as informações
   - Clicar em **Rodar Qualificação**
   - Verificar: Job processa e atualiza métricas
   - Verificar: Contadores mostram valores reais (51 processadas, 51 qualificadas)

3. **Verificar Resultados:**
   - Tabela `qualified_prospects` deve ter 51 registros
   - Métricas A+, A, B, C, D devem ser atualizadas
   - Status do job deve mudar para `completed`
   - Tentar reprocessar: botão deve estar desabilitado

## ✅ Checklist de Validação

- [ ] Hook `useTenantIcps` carrega ICPs sem erro 400
- [ ] Seletor de ICP aparece e mostra o ICP do job
- [ ] Resumo do processo mostra todas as informações
- [ ] Job processa candidatos e cria `qualified_prospects`
- [ ] Contadores mostram valores reais (não zero)
- [ ] Distribuição de grades é atualizada
- [ ] Job concluído não pode ser reprocessado
- [ ] Mensagens de erro são claras

## 📝 Notas Técnicas

### Lógica de Qualificação (MVP)

**Todas as empresas são qualificadas**, independente do score. A diferença está apenas na **grade**:

- **A+**: fit_score >= 95
- **A**: fit_score >= 85
- **B**: fit_score >= 70
- **C**: fit_score >= 60
- **D**: fit_score < 60

**Critérios de Score:**
- Setor match: 30%
- Localização match: 25%
- Dados completos: 20%
- Website presente: 15%
- Contato presente: 10%

### Vinculação Job ↔ Candidatos

Os candidatos são vinculados ao job através de:
- `tenant_id` (mesmo tenant)
- `icp_id` (mesmo ICP)
- `source_batch_id` (mesmo batch de importação)

O `source_batch_id` do job é armazenado em `source_file_name` na tabela `prospect_qualification_jobs`.

## 🎉 Resultado Esperado

Após aplicar todas as correções:

1. ✅ ICPs carregam corretamente
2. ✅ Seletor de ICP aparece e mostra o ICP do job
3. ✅ Resumo detalhado mostra todas as informações
4. ✅ Job realmente processa e qualifica candidatos
5. ✅ Contadores mostram valores reais
6. ✅ Job concluído não pode ser reprocessado
7. ✅ Usuário tem visibilidade completa do processo

**Pronto para testes!** 🚀

