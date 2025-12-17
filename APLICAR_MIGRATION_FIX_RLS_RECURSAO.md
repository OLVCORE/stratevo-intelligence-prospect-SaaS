# 🚨 URGENTE: Aplicar Migration para Corrigir Recursão RLS

## ⚠️ PROBLEMA
Erro: `infinite recursion detected in policy for relation "tenant_users"`

Isso impede que os jobs de qualificação sejam carregados no Motor de Qualificação.

## ✅ SOLUÇÃO
Aplicar a migration **`20250225000002_fix_rls_recursion_completo.sql`** manualmente no Supabase.

**⚠️ IMPORTANTE:** Esta é a versão COMPLETA e ROBUSTA que corrige TODAS as políticas recursivas.

---

## 📋 PASSO A PASSO

### 1. Acessar Supabase Dashboard
1. Vá para: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new**
2. Você verá o SQL Editor do Supabase

### 2. Copiar e Executar a Migration
1. Abra o arquivo: **`supabase/migrations/20250225000002_fix_rls_recursion_completo.sql`**
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione **Ctrl+Enter**
5. Aguarde a execução (pode levar 10-15 segundos)

### 3. Verificar Sucesso
Você deve ver:
- ✅ **Mensagem**: `Success. No rows returned`
- ✅ **Nenhum erro vermelho**
- ✅ **Notices** no console indicando que as políticas foram corrigidas

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:
1. **Recarregue a página** do Motor de Qualificação
2. **Os jobs devem aparecer** (não mais erro 500)
3. **No console do browser**, não deve mais aparecer:
   - ❌ `infinite recursion detected in policy for relation "tenant_users"`
   - ✅ Deve aparecer os jobs normalmente

---

## 📊 O QUE A MIGRATION FAZ

1. ✅ **Cria função `get_user_tenant_ids()`** com `SECURITY DEFINER` para bypassar RLS completamente
2. ✅ **Remove TODAS as políticas problemáticas** de `tenant_users` que causam recursão
3. ✅ **Recria políticas de `tenant_users`** usando a função (sem recursão)
4. ✅ **Remove TODAS as políticas** de `prospect_qualification_jobs` que causam recursão
5. ✅ **Recria políticas de `prospect_qualification_jobs`** usando a função (sem recursão)
6. ✅ **Corrige políticas de `legal_data` e `purchase_intent_signals`** que também usam `tenant_users`

---

## ⚠️ IMPORTANTE

- ✅ Esta migration é **idempotente** (pode ser executada múltiplas vezes)
- ✅ Não afeta dados existentes
- ✅ Apenas corrige políticas RLS
- ✅ Resolve o problema de upload de empresas no Motor de Qualificação

---

**🚀 Após aplicar, os jobs de qualificação devem aparecer normalmente!**
