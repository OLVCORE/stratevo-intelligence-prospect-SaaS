# 🔒 RESUMO DAS MIGRATIONS DE SEGURANÇA E CORREÇÕES

## 📋 Ordem de Execução das Migrations

Execute as migrations na seguinte ordem:

### 1️⃣ **20250224000006_fix_icp_analysis_results_origem_constraint.sql**
**Prioridade: ALTA** ⚠️

**O que faz:**
- Remove o CHECK constraint restritivo da coluna `origem` em `icp_analysis_results`
- Permite que valores como nomes de arquivos sejam armazenados

**Por que é necessário:**
- O CHECK constraint antigo só permitia 3 valores: `'upload_massa'`, `'icp_individual'`, `'icp_massa'`
- Estamos tentando inserir valores como "Estoque", "Legacy", nomes de arquivos CSV/XLSX, etc.
- Isso causava erro: `ERROR: 23514: new row violates check constraint "icp_analysis_results_origem_check"`

**Execute PRIMEIRO antes de qualquer outra migration que atualize `icp_analysis_results`**

---

### 2️⃣ **20250224000005_update_existing_companies_origem.sql**
**Prioridade: ALTA** ⚠️

**O que faz:**
- Adiciona colunas `origem` e `source_name` em `companies` e `icp_analysis_results` (se não existirem)
- Atualiza empresas existentes com origem correta (nome do arquivo, API, Legacy, etc.)
- Preserva origem em `raw_data` e `raw_analysis` para histórico completo

**Por que é necessário:**
- Empresas existentes não têm origem definida corretamente
- A origem deve ser o nome do arquivo CSV/XLSX/Google Sheets, API, ou "Legacy"
- Essas informações devem migrar entre todas as etapas do pipeline

**Execute DEPOIS da migration 20250224000006**

---

### 3️⃣ **20250224000007_enable_rls_on_public_tables.sql**
**Prioridade: MÉDIA** 🔒

**O que faz:**
- Habilita RLS (Row Level Security) em todas as tabelas públicas que estavam sem RLS
- Cria políticas básicas de tenant isolation para tabelas sem políticas
- Mantém políticas existentes intactas

**Tabelas corrigidas:**
- ✅ `coaching_cards` - RLS habilitado (já tinha políticas)
- ✅ `conversation_analyses` - RLS habilitado (já tinha políticas)
- ✅ `conversation_transcriptions` - RLS habilitado (já tinha políticas)
- ✅ `objection_patterns` - RLS habilitado (já tinha políticas)
- ✅ `qualified_prospects` - RLS habilitado (já tinha políticas)
- ✅ `competitor_stc_matches` - RLS habilitado + políticas criadas
- ✅ `legal_data` - RLS habilitado + políticas criadas
- ✅ `purchase_intent_signals` - RLS habilitado + políticas criadas
- ✅ `prospect_qualification_jobs` - RLS habilitado + políticas criadas
- ✅ `step_registry` - RLS habilitado + políticas criadas

**Por que é necessário:**
- O linter do Supabase detectou que essas tabelas públicas não tinham RLS habilitado
- Isso é um risco de segurança - dados podem ser acessados por qualquer usuário autenticado
- As políticas garantem isolamento por tenant

**Execute a qualquer momento (não depende das outras)**

---

## 🔍 Problemas Resolvidos

### ✅ CHECK Constraint em `icp_analysis_results.origem`
- **Problema:** Constraint restritivo impedia inserção de valores como nomes de arquivos
- **Solução:** Removido o constraint, origem real preservada em `raw_analysis.origem_original`

### ✅ Origem de Empresas Existentes
- **Problema:** Empresas antigas não tinham origem definida
- **Solução:** Migration atualiza todas as empresas com origem correta baseada em `qualified_prospects` e `prospect_qualification_jobs`

### ✅ RLS Desabilitado em Tabelas Públicas
- **Problema:** 10 tabelas públicas sem RLS habilitado (risco de segurança)
- **Solução:** RLS habilitado + políticas de tenant isolation criadas

---

## 📝 Notas Importantes

### Sobre a Origem
- **Campo direto `origem`:** Usa valores permitidos pelo CHECK constraint (`'upload_massa'`, `'icp_individual'`, `'icp_massa'`)
- **`raw_analysis.origem_original`:** Preserva a origem REAL (nome do arquivo, "Estoque", "Legacy", etc.)
- **`raw_analysis.source_name`:** Também preserva o nome do arquivo/API para exibição

### Sobre as Políticas RLS
- Todas as políticas usam `user_tenants` para verificar acesso por tenant
- Políticas de SELECT permitem ver apenas dados do próprio tenant
- Políticas de INSERT/UPDATE/DELETE garantem que só é possível modificar dados do próprio tenant

### Views com SECURITY DEFINER
- ✅ **Opcional:** Migration `20250224000008` corrige as views `report_dashboard` e `unified_deals`
- Views recriadas com `security_invoker = true` para respeitar RLS do usuário
- Se as views funcionam corretamente com `SECURITY DEFINER`, pode manter como está

---

## 🚀 Como Executar

### Via Supabase Dashboard:
1. Vá para **SQL Editor**
2. Execute cada migration na ordem:
   - `20250224000006_fix_icp_analysis_results_origem_constraint.sql` ⚠️ **OBRIGATÓRIA**
   - `20250224000005_update_existing_companies_origem.sql` ⚠️ **OBRIGATÓRIA**
   - `20250224000007_enable_rls_on_public_tables.sql` 🔒 **RECOMENDADA**
   - `20250224000008_fix_security_definer_views.sql` ℹ️ **OPCIONAL**

### Via CLI:
```bash
supabase migration up
```

---

## ✅ Verificação Pós-Execução

Após executar as migrations, verifique:

1. **CHECK Constraint removido:**
   ```sql
   SELECT constraint_name 
   FROM information_schema.table_constraints 
   WHERE table_name = 'icp_analysis_results' 
     AND constraint_name LIKE '%origem%';
   ```
   (Deve retornar vazio ou constraint mais flexível)

2. **RLS habilitado:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename IN (
       'coaching_cards', 'conversation_analyses', 
       'conversation_transcriptions', 'objection_patterns',
       'qualified_prospects', 'competitor_stc_matches',
       'legal_data', 'purchase_intent_signals',
       'prospect_qualification_jobs', 'step_registry'
     );
   ```
   (Todos devem ter `rowsecurity = true`)

3. **Origem atualizada:**
   ```sql
   SELECT COUNT(*) as total, 
          COUNT(origem) as com_origem,
          COUNT(DISTINCT origem) as tipos_origem
   FROM public.companies;
   ```
   (Deve mostrar empresas com origem definida)

---

## 🎯 Resultado Esperado

Após executar todas as migrations:

✅ **Sem erros de CHECK constraint** ao inserir empresas na quarentena ICP  
✅ **Origem preservada** em todas as etapas do pipeline  
✅ **RLS habilitado** em todas as tabelas públicas  
✅ **Isolamento por tenant** garantido por políticas RLS  
✅ **Dados históricos preservados** em `raw_data` e `raw_analysis`

---

**Data de criação:** 2025-02-24  
**Última atualização:** 2025-02-24

