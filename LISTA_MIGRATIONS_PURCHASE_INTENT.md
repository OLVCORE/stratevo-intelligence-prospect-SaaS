# 🎯 MIGRATIONS PARA ATIVAR SISTEMA DE PURCHASE INTENT

## ✅ Arquivo SQL Consolidado (RECOMENDADO)

**Arquivo:** `ATIVAR_PURCHASE_INTENT_COMPLETO.sql`

Este arquivo contém **TODAS** as migrations necessárias em um único SQL que você pode executar diretamente no Supabase.

### 📋 Como usar:

1. **Abrir o arquivo:** `ATIVAR_PURCHASE_INTENT_COMPLETO.sql`
2. **Copiar todo o conteúdo**
3. **Acessar Supabase Dashboard:**
   - Vá em: https://app.supabase.com → Seu Projeto
   - Clique em **SQL Editor** (menu lateral)
4. **Colar e executar:**
   - Cole o SQL completo
   - Clique em **RUN** (ou pressione Ctrl+Enter)
5. **Verificar sucesso:**
   - Deve aparecer mensagens de sucesso
   - Se aparecer "already exists", está OK (significa que já foi criado antes)

---

## 📂 Migrations Individuais (Referência)

Se preferir aplicar migrations individuais, aqui estão os arquivos:

### 1. **Adicionar purchase_intent_score**
**Arquivo:** `supabase/migrations/20250213000004_purchase_intent_scoring.sql`
- Adiciona coluna `purchase_intent_score` em `qualified_prospects`
- Cria tabela `purchase_intent_signals`

### 2. **Adicionar purchase_intent_type**
**Arquivo:** `supabase/migrations/20260105000000_add_purchase_intent_type_qualified_prospects.sql`
- Adiciona coluna `purchase_intent_type` em `qualified_prospects`
- Valores permitidos: `'potencial'` ou `'real'`

### 3. **Sistema Híbrido (Potencial vs Real)**
**Arquivo:** `supabase/migrations/20250223000001_purchase_intent_hybrid_system.sql`
- Cria função `calculate_purchase_intent_score`
- Adiciona suporte para tipos 'potencial' e 'real'
- Cria função `mark_purchase_intent_as_real`

### 4. **Wrapper RPC**
**Arquivo:** `supabase/migrations/20251213170000_fix_purchase_intent_rpc_and_companies_columns.sql`
- Cria função `calculate_purchase_intent_for_prospect`
- Wrapper para chamada via RPC do frontend

---

## 🔍 Verificação Pós-Aplicação

Execute este SQL para verificar se tudo foi criado corretamente:

```sql
-- Verificar colunas em qualified_prospects
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'qualified_prospects' 
  AND column_name IN ('purchase_intent_score', 'purchase_intent_type')
ORDER BY column_name;

-- Verificar tabela purchase_intent_signals
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'purchase_intent_signals'
) AS table_exists;

-- Verificar função calculate_purchase_intent_score
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'calculate_purchase_intent_score'
) AS function_exists;

-- Verificar função calculate_purchase_intent_for_prospect
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'calculate_purchase_intent_for_prospect'
) AS wrapper_function_exists;
```

---

## 📊 O que será criado:

1. ✅ Coluna `purchase_intent_score` (INTEGER, DEFAULT 0) em `qualified_prospects`
2. ✅ Coluna `purchase_intent_type` (TEXT, DEFAULT 'potencial') em `qualified_prospects`
3. ✅ Tabela `purchase_intent_signals` (se não existir)
4. ✅ Função `calculate_purchase_intent_score()` 
5. ✅ Função `calculate_purchase_intent_for_prospect()` (wrapper RPC)

---

## ⚠️ IMPORTANTE

- O SQL consolidado (`ATIVAR_PURCHASE_INTENT_COMPLETO.sql`) é **idempotente** - pode ser executado várias vezes sem problemas
- Ele verifica se cada item já existe antes de criar
- Mensagens "already exists" são normais e indicam que o item já estava criado

---

## 🚀 Após Aplicar

O sistema de Purchase Intent estará ativo e você poderá:
- Ver scores de intenção de compra na interface
- Calcular scores via RPC
- Classificar leads como Hot/Warm/Cold baseado no score

