# 🚨 URGENTE: Aplicar Migration para Corrigir RLS de Companies

## ⚠️ PROBLEMA
Erro ao criar empresas a partir de prospects qualificados: `❌ Erro inesperado ao processar prospect Object`

Isso impede que empresas sejam criadas no Banco de Empresas a partir do estoque de qualificadas.

## ✅ SOLUÇÃO
Aplicar a migration **`20250225000003_fix_companies_rls.sql`** manualmente no Supabase.

**⚠️ IMPORTANTE:** Esta migration corrige as políticas RLS da tabela `companies` para usar a função `get_user_tenant_ids()`.

---

## 📋 PASSO A PASSO

### 1. Acessar Supabase Dashboard
1. Vá para: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new**
2. Você verá o SQL Editor do Supabase

### 2. Copiar e Executar a Migration
1. Abra o arquivo: **`supabase/migrations/20250225000003_fix_companies_rls.sql`**
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione **Ctrl+Enter**
5. Aguarde a execução (pode levar 5-10 segundos)

### 3. Verificar Sucesso
Você deve ver:
- ✅ **Mensagem**: `Success. No rows returned`
- ✅ **Nenhum erro vermelho**
- ✅ **Notices** no console indicando que as políticas foram corrigidas

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:
1. **Recarregue a página** de Prospects Qualificados
2. **Tente criar empresas** a partir de prospects qualificados
3. **No console do browser**, deve aparecer:
   - ✅ `[Qualified → Companies] ✅ Empresa criada em companies`
   - ❌ Não deve mais aparecer `❌ Erro inesperado ao processar prospect Object`

---

## 📊 O QUE A MIGRATION FAZ

1. ✅ **Remove TODAS as políticas antigas** de `companies` que podem estar bloqueando inserções
2. ✅ **Cria políticas corretas** usando função `get_user_tenant_ids()` (SECURITY DEFINER):
   - **SELECT**: Usuários podem ver empresas dos seus tenants
   - **INSERT**: Usuários podem criar empresas nos seus tenants
   - **UPDATE**: Usuários podem atualizar empresas dos seus tenants
   - **DELETE**: Usuários podem deletar empresas dos seus tenants
3. ✅ **Garante que inserções funcionem** quando o `tenant_id` está correto

---

## ⚠️ IMPORTANTE

- ✅ Esta migration é **idempotente** (pode ser executada múltiplas vezes)
- ✅ Não afeta dados existentes
- ✅ Apenas corrige políticas RLS
- ✅ Resolve o problema de criação de empresas a partir de prospects qualificados

---

**🚀 Após aplicar, a criação de empresas a partir de prospects qualificados deve funcionar normalmente!**
