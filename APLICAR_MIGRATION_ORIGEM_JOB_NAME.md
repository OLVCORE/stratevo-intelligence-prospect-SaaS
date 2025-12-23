# 🚨 MIGRATION CRÍTICA: Permitir job_name na coluna origem

## Problema
A coluna `origem` em `icp_analysis_results` e `companies` tem um CHECK constraint que só permite valores fixos (`'upload_massa', 'icp_individual', 'icp_massa'`), mas precisamos mostrar o **nome do arquivo** (job_name) como "Plastico - 50 - 51 empresas" ao invés de apenas "upload_massa".

## Solução
A migration `20250225000005_fix_origem_column_allow_job_name.sql` remove o CHECK constraint e permite qualquer texto na coluna `origem`.

## Como Aplicar

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/20250225000005_fix_origem_column_allow_job_name.sql`
4. Execute o script

### Opção 2: Via CLI
```bash
supabase migration up
```

## Verificação
Após aplicar, verifique se o constraint foi removido:
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'icp_analysis_results' 
AND constraint_name LIKE '%origem%';
```

**Resultado esperado:** Nenhum constraint relacionado a `origem` deve aparecer.

## Impacto
- ✅ Coluna `origem` agora pode mostrar o nome do arquivo (job_name)
- ✅ Compatibilidade mantida com valores antigos
- ✅ Todas as tabelas (companies, icp_analysis_results) agora mostram o nome do arquivo na coluna origem
