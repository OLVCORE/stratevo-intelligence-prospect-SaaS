# 🔍 ANÁLISE: Por que Concorrentes Funcionam e Tenant Não?

## 📊 RESULTADOS DA COMPARAÇÃO

### Políticas RLS:
- **tenant_products**: 1 política INSERT que permite SERVICE_ROLE_KEY ✅
- **tenant_competitor_products**: 0 políticas INSERT ❌

**Mas concorrentes FUNCIONAM!** Isso significa que:
- Ou `tenant_competitor_products` tem política FOR ALL (não específica)
- Ou RLS não está habilitado para essa tabela
- Ou há outra política que permite

---

## 🔍 DIFERENÇAS ENCONTRADAS NO CÓDIGO

### 1. **Verificação de Duplicatas**

**scan-competitor-url** (funciona):
```typescript
.eq('tenant_id', tenant_id)
.eq('competitor_cnpj', competitor_cnpj)  // ✅ Filtro extra
.ilike('nome', product.nome.trim())
```

**scan-website-products** (não funciona):
```typescript
.eq('tenant_id', tenant_id)
// ❌ SEM filtro extra
.ilike('nome', product.nome.trim())
```

### 2. **Inserção**

**scan-competitor-url** (funciona):
- Inserção direta simples
- Sem fallback RPC

**scan-website-products** (não funciona):
- Inserção direta com fallback RPC
- Mais complexo

---

## 🎯 POSSÍVEIS CAUSAS

### 1. **Produtos Antigos no Banco**

Se há produtos antigos no banco com nomes similares, a verificação `ilike` pode estar detectando como duplicatas mesmo quando não são.

**Como verificar:**
- Execute `VERIFICAR_PRODUTOS_EXISTENTES_BANCO.sql`
- Veja se há produtos com nomes similares

### 2. **Verificação de Duplicatas Muito Restritiva**

A verificação `ilike` é case-insensitive, então:
- "Produto A" = "produto a" = "PRODUTO A"
- Se houver produto antigo com nome similar, pode estar bloqueando

### 3. **Política RLS de tenant_competitor_products**

Se `tenant_competitor_products` tem política FOR ALL ou RLS desabilitado, pode funcionar mesmo sem política INSERT específica.

---

## ✅ PRÓXIMOS PASSOS

### PASSO 1: Verificar Políticas Exatas

Execute **`VERIFICAR_POLITICAS_EXATAS.sql`** para ver:
- Conteúdo completo das políticas
- Se `tenant_competitor_products` tem política FOR ALL
- Se RLS está habilitado

### PASSO 2: Verificar Produtos no Banco

Execute **`VERIFICAR_PRODUTOS_EXISTENTES_BANCO.sql`** para ver:
- Quantos produtos existem no banco
- Se há produtos com nomes similares
- Se há produtos antigos que podem estar bloqueando

### PASSO 3: Ajustar Verificação de Duplicatas (Se Necessário)

Se houver produtos antigos bloqueando, podemos:
- Ajustar a verificação para ser mais específica
- Limpar produtos antigos de teste
- Usar filtro adicional (como em concorrentes)

---

## ⚠️ IMPORTANTE

**NÃO fazer alterações ainda!** Primeiro precisamos:
1. Ver o conteúdo exato das políticas
2. Ver quais produtos existem no banco
3. Entender por que a verificação está bloqueando

Só então aplicamos a correção mínima necessária.

