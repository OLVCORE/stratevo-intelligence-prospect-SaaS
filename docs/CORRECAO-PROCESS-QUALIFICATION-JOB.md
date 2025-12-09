# 🔧 Correção: Ambiguidade de `processed_count` em `process_qualification_job`

**Data:** 08/12/2025  
**Problema:** `column reference "processed_count" is ambiguous` (código 42702)

## ✅ Correções Implementadas

### 1. Problema Identificado

Na função `process_qualification_job`, havia referências ambíguas a colunas da tabela `prospect_qualification_jobs`:

- **Linha 187 (original):** `processed_count = processed_count + v_processed`
  - PostgreSQL não sabia se `processed_count` era a coluna da tabela ou uma variável local
- **Linha 179 (original):** `failed_count = failed_count + 1`
  - Mesmo problema de ambiguidade

### 2. Solução Aplicada

**2.1. Qualificação de Colunas com Alias de Tabela**

Todos os UPDATEs agora usam alias `qj` e qualificam todas as colunas:

```sql
-- ANTES (ambíguo):
UPDATE public.prospect_qualification_jobs
SET processed_count = processed_count + v_processed
WHERE id = p_job_id;

-- DEPOIS (corrigido):
UPDATE public.prospect_qualification_jobs qj
SET qj.processed_count = COALESCE(qj.processed_count, 0) + v_processed
WHERE qj.id = p_job_id;
```

**2.2. Variáveis Locais Já Estavam Corretas**

As variáveis locais já usavam prefixo `v_`:
- `v_processed` ✅
- `v_qualified` ✅
- `v_fit_score` ✅
- `v_grade` ✅

**2.3. Uso de COALESCE para Segurança**

Adicionado `COALESCE(qj.processed_count, 0)` para evitar NULLs:

```sql
SET qj.processed_count = COALESCE(qj.processed_count, 0) + v_processed
```

### 3. Arquivo de Migração Criado

**Arquivo:** `supabase/migrations/20250208000001_fix_process_qualification_job_ambiguous.sql`

**Conteúdo:**
- Função `process_qualification_job` completamente reescrita
- Todos os UPDATEs qualificados com alias `qj`
- Todas as colunas referenciadas com `qj.` prefix
- Mantida a mesma assinatura e lógica de negócio

### 4. Verificação da Chamada no Frontend

**Arquivo:** `src/pages/QualificationEnginePage.tsx`

**Chamada RPC (linhas 131-134):**
```typescript
const { data, error } = await supabase.rpc('process_qualification_job', {
  p_job_id: selectedJobId,
  p_tenant_id: tenantId,
});
```

✅ **Status:** Correto - parâmetros batem com a assinatura da função SQL

### 5. Checklist de Teste

Após aplicar a migration:

1. **Aplicar Migration no Supabase:**
   - [ ] Executar `supabase/migrations/20250208000001_fix_process_qualification_job_ambiguous.sql` no Supabase Dashboard
   - [ ] Ou usar CLI: `supabase db push`

2. **Testar no STRATEVO One:**
   - [ ] Ir em **Motor de Qualificação**
   - [ ] Selecionar job "Importação 07/12/2025 - 51 empresas"
   - [ ] Clicar em **Rodar Qualificação**
   - [ ] **NÃO** deve aparecer erro `42702` no console
   - [ ] Job deve mudar de `pending` → `processing` → `completed`
   - [ ] Métricas devem ser atualizadas:
     - Processadas: 51 (ou número real)
     - Qualificadas: número de empresas com fit >= 60
     - Grades A+, A, B, C, D devem ser atualizadas

3. **Verificar no Banco:**
   - [ ] Tabela `qualified_prospects` deve ter registros inseridos
   - [ ] Tabela `prospect_qualification_jobs` deve ter `processed_count` atualizado
   - [ ] Tabela `prospecting_candidates` deve ter status `processed` ou `failed`

### 6. Resultado Esperado

**Antes (com erro):**
```
POST /rest/v1/rpc/process_qualification_job 400 (Bad Request)
Erro: column reference "processed_count" is ambiguous
```

**Depois (corrigido):**
```
✅ Qualificação concluída!
51 processados, X qualificados
```

### 7. Notas Técnicas

- **Assinatura da função:** Mantida exatamente igual (não quebra compatibilidade)
- **Lógica de negócio:** Não alterada (apenas correção de ambiguidade)
- **Performance:** Sem impacto (apenas qualificação de nomes)
- **RLS:** Não afetado (função usa `SECURITY DEFINER`)

## ✅ Status

- [x] Função corrigida com alias `qj` em todos os UPDATEs
- [x] Todas as colunas qualificadas com `qj.` prefix
- [x] `COALESCE` adicionado para segurança
- [x] Migration criada e pronta para deploy
- [x] Frontend verificado (chamada correta)

**Pronto para teste!** 🚀

