# 📋 INSTRUÇÕES FINAIS - CORREÇÃO DE POLÍTICAS DUPLICADAS

## 🔍 PROBLEMA IDENTIFICADO

Há **políticas duplicadas** para INSERT, SELECT e UPDATE:
- `tenant_products_insert` + `tenant_products_insert_policy`
- `tenant_products_read` + `tenant_products_select_policy`
- `tenant_products_update` + `tenant_products_update_policy`

**Isso pode causar conflito** e bloquear inserção mesmo com SERVICE_ROLE_KEY.

---

## ✅ SOLUÇÃO (PASSO A PASSO)

### PASSO 1: Verificar conteúdo das políticas

Execute **`VERIFICAR_CONTEUDO_POLITICAS.sql`** no Supabase SQL Editor.

**O que verificar:**
- Qual política INSERT **NÃO permite** SERVICE_ROLE_KEY?
- Qual política SELECT **NÃO permite** SERVICE_ROLE_KEY?
- Qual política UPDATE **NÃO permite** SERVICE_ROLE_KEY?

**Resultado esperado:**
- Políticas com sufixo `_policy` devem permitir SERVICE_ROLE_KEY ✅
- Políticas sem sufixo podem NÃO permitir ❌

### PASSO 2: Remover políticas antigas problemáticas

**APENAS se o PASSO 1 mostrar que políticas antigas não permitem SERVICE_ROLE_KEY:**

Execute **`REMOVER_POLITICAS_ANTIGAS_SEGURO.sql`**.

**O que faz:**
- Remove **APENAS** políticas antigas que NÃO permitem SERVICE_ROLE_KEY
- **Mantém** políticas novas (`_policy`) que funcionam
- **NÃO remove** nada que permite SERVICE_ROLE_KEY

### PASSO 3: Verificar resultado

O script mostra no final:
- Quantas políticas restam para cada operação
- Se ainda há duplicatas

**Resultado esperado:**
- ✅ Apenas uma política por operação
- ✅ Todas permitem SERVICE_ROLE_KEY

### PASSO 4: Testar

1. Volte para a plataforma
2. Clique em "Extrair Produtos"
3. Verifique se `products_inserted > 0`
4. Verifique se produtos aparecem em tela

---

## ⚠️ GARANTIAS DE SEGURANÇA

✅ **NÃO remove políticas que permitem SERVICE_ROLE_KEY**
✅ **NÃO remove políticas novas (`_policy`)**
✅ **NÃO altera estrutura da tabela**
✅ **Pode ser revertido** (recriar políticas se necessário)

---

## 🔄 COMO REVERTER (SE ALGO DER ERRADO)

Se precisar reverter, recrie as políticas removidas executando novamente a migration `20250220000001_fix_tenant_products_insert_rls.sql`.

---

## 📞 SE ALGO DER ERRADO

1. **NÃO entre em pânico**
2. Me envie:
   - Resultado do `VERIFICAR_CONTEUDO_POLITICAS.sql`
   - Resultado do `REMOVER_POLITICAS_ANTIGAS_SEGURO.sql`
   - Mensagem de erro (se houver)

