# 🔍 DIAGNÓSTICO: Por que a Extração de Produtos Parou de Funcionar

## ❌ PROBLEMA IDENTIFICADO

### O que estava funcionando:
- ✅ Extração de produtos do **tenant** (via `scan-website-products`)
- ✅ Extração de produtos de **concorrentes** (via `scan-competitor-url`)
- ✅ Edge Functions encontravam produtos corretamente
- ✅ Edge Functions **inseriam** produtos no banco (usando `SERVICE_ROLE_KEY`)

### O que quebrou:
- ❌ **Frontend não consegue LER** os produtos inseridos
- ❌ Políticas RLS (Row Level Security) dependem da tabela `users`
- ❌ Tabela `users` está retornando **erro 500**
- ❌ Resultado: Produtos são inseridos mas **não aparecem na interface**

---

## 🔬 CAUSA RAIZ

### Política RLS Original (QUEBRADA):
```sql
CREATE POLICY "tenant_products_policy" ON tenant_products
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()  -- ❌ ERRO 500 AQUI
  ));
```

### Por que quebra:
1. **Edge Function** usa `SERVICE_ROLE_KEY` → **Bypassa RLS** → ✅ **Consegue inserir**
2. **Frontend** usa token do usuário → **Precisa passar pela RLS** → ❌ **Falha ao ler** (tabela `users` retorna 500)

### Evidência nos logs:
```
[Step1] ✅ Resposta da Edge Function: {products_found: 12, products_inserted: 0}
[Step1] ✅ Produtos encontrados em tenant_products: 0  ← ❌ NÃO CONSEGUE LER!
```

**Nota:** `products_inserted: 0` pode ser porque:
- Todos os produtos já existem (verificação de duplicata)
- OU há erro silencioso na inserção (precisa verificar logs da Edge Function)

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Migration: `20250215000001_fix_tenant_products_rls.sql`

Esta migration corrige **AMBAS** as tabelas:
1. ✅ `tenant_products` (produtos do tenant)
2. ✅ `tenant_competitor_products` (produtos de concorrentes)

### O que a migration faz:

1. **Remove políticas antigas** que dependem da tabela `users`
2. **Cria função segura** `get_user_tenant_ids()` com tratamento de erro
3. **Cria novas políticas RLS** usando a função RPC (não depende diretamente da tabela `users`)

### Nova Política (CORRIGIDA):
```sql
CREATE POLICY "tenant_products_policy" ON tenant_products
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()  -- ✅ Função segura
    )
  );
```

---

## 🚀 COMO APLICAR A CORREÇÃO

### Passo 1: Aplicar Migration no Supabase

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo: `supabase/migrations/20250215000001_fix_tenant_products_rls.sql`
4. Clique em **Run**

### Passo 2: Verificar se funcionou

Após aplicar a migration, teste novamente:
1. Extrair produtos do website do tenant
2. Verificar se os produtos aparecem na interface
3. Verificar se não há mais erros 500 ao buscar produtos

---

## 📊 TABELAS CORRIGIDAS

A migration corrige as seguintes tabelas:

| Tabela | Política | Status |
|--------|----------|--------|
| `tenant_products` | `tenant_products_policy` | ✅ Corrigida |
| `tenant_competitor_products` | `tenant_competitor_products_policy` | ✅ Corrigida |
| `tenant_product_documents` | `tenant_product_documents_policy` | ✅ Corrigida |
| `tenant_fit_config` | `tenant_fit_config_policy` | ✅ Corrigida |
| `product_fit_analysis` | `product_fit_analysis_policy` | ✅ Corrigida |

---

## 🔍 VERIFICAÇÃO ADICIONAL

Se após aplicar a migration ainda houver problemas:

1. **Verificar logs da Edge Function:**
   - Supabase Dashboard → Edge Functions → `scan-website-products` → Logs
   - Procurar por: `[ScanWebsite] ❌ Erro ao inserir produto`

2. **Verificar se produtos estão sendo inseridos:**
   ```sql
   SELECT COUNT(*) FROM tenant_products WHERE tenant_id = 'SEU_TENANT_ID';
   ```

3. **Verificar se a política RLS foi aplicada:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tenant_products';
   ```

---

## 📝 RESUMO

**Problema:** Políticas RLS dependem da tabela `users` (erro 500) → Frontend não consegue ler produtos

**Solução:** Migration que cria políticas RLS usando função RPC segura (não depende diretamente da tabela `users`)

**Status:** ✅ Migration criada e pronta para aplicar

**Próximo passo:** Aplicar a migration no Supabase SQL Editor

