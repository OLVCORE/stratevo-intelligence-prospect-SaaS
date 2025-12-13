# 🔍 EXPLICAÇÃO: product_name vs nome

## ❌ Problema Identificado

**Erro:**
```
null value in column "product_name" of relation "tenant_products" violates not-null constraint
```

**Causa Raiz:**
A tabela `tenant_products` foi criada por múltiplas migrations com estruturas diferentes:

1. **Migration `20250119000002_create_tenant_config_tables.sql`**: Cria com `name` (inglês)
2. **Migration `20250201000001_tenant_products_catalog.sql`**: Cria com `nome` (português)
3. **Script `CRIAR_TUDO_QUE_FALTA_CORRIGIDO.sql`**: Cria com `product_name` (inglês)

**Resultado:**
- A tabela foi criada com `product_name` NOT NULL
- A Edge Function tenta inserir em `nome` (português)
- `product_name` fica NULL → viola constraint NOT NULL

---

## ✅ Solução

### Script: `CORRIGIR_COLUNAS_PRODUCT_NAME_SEGURO.sql`

**O que faz:**
1. ✅ Verifica se `product_name` existe
2. ✅ Se `nome` não existe, cria e copia dados de `product_name`
3. ✅ Remove constraint NOT NULL de `product_name` (se existir)
4. ✅ Garante que `nome` existe e tem NOT NULL
5. ✅ Opcional: Remove `product_name` (comentado, descomente se quiser)

**Garantias:**
- ✅ Não remove dados existentes
- ✅ Copia dados de `product_name` para `nome` se necessário
- ✅ Não quebra funcionalidade existente
- ✅ Pode ser executado múltiplas vezes

---

## 🎯 Próximos Passos

1. **Execute `CORRIGIR_COLUNAS_PRODUCT_NAME_SEGURO.sql`** no Supabase SQL Editor
2. **Verifique o resultado** - deve mostrar que `nome` tem NOT NULL e `product_name` permite NULL
3. **Teste inserção manual novamente** - deve funcionar agora
4. **Teste extração de produtos** - deve inserir produtos corretamente

---

## 📊 Estrutura Esperada Após Correção

| Coluna | Tipo | NOT NULL | Status |
|--------|------|----------|--------|
| `nome` | VARCHAR(255) | ✅ SIM | ✅ Usado pela Edge Function |
| `product_name` | TEXT/VARCHAR | ❌ NÃO | ⚠️ Pode ser removida depois |

---

**Status:** ✅ **PRONTO PARA APLICAÇÃO**

