# 📋 INSTRUÇÕES SEGURAS - PASSO A PASSO

## ⚠️ IMPORTANTE: Siga na ordem exata

### PASSO 1: DIAGNÓSTICO (SEM ALTERAÇÕES)

1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Execute o arquivo **`DIAGNOSTICO_SEGURO_RLS.sql`**
3. **Anote os resultados:**
   - Quais políticas existem?
   - A função `get_user_tenant_ids()` existe?
   - Qual é a estrutura da tabela?

### PASSO 2: ANÁLISE

1. Leia o arquivo **`ANALISE_PROBLEMA_RLS.md`**
2. Entenda o problema identificado
3. Veja as opções de solução

### PASSO 3: APLICAR CORREÇÃO (SE NECESSÁRIO)

**APENAS se o diagnóstico mostrar que falta a política INSERT:**

1. Execute o arquivo **`CORRECAO_CIRURGICA_SEGURA.sql`**
2. **Verifique a mensagem:**
   - Se mostrar "✅ Política criada" → OK
   - Se mostrar "⚠️ Política já existe" → Não precisa fazer nada

### PASSO 4: TESTAR

1. Volte para a plataforma
2. Clique em "Extrair Produtos"
3. Verifique se `products_inserted > 0`
4. Verifique se produtos aparecem em tela

---

## 🔄 COMO REVERTER (SE ALGO DER ERRADO)

Se precisar reverter a correção:

```sql
DROP POLICY IF EXISTS "tenant_products_insert_policy" ON tenant_products;
```

Isso **NÃO afeta** as outras políticas existentes.

---

## ⚠️ ALERTAS

1. **NÃO execute múltiplas vezes** - o script verifica se já existe
2. **NÃO modifique o script** - ele foi feito para ser seguro
3. **Execute na ordem** - diagnóstico primeiro, correção depois
4. **Teste após aplicar** - verifique se funcionou

---

## 📞 SE ALGO DER ERRADO

1. **NÃO entre em pânico**
2. Execute o script de reversão acima
3. Me envie:
   - Resultado do `DIAGNOSTICO_SEGURO_RLS.sql`
   - Mensagem de erro (se houver)
   - O que estava funcionando antes

