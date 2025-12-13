# 🔍 DIAGNÓSTICO: Por Que `products_inserted: 0`?

## 📊 Situação Atual

- ✅ **Colunas criadas**: Todas as colunas necessárias existem
- ✅ **Produtos encontrados**: 13 produtos detectados pela IA
- ❌ **Produtos inseridos**: 0 produtos inseridos no banco
- ❌ **Produtos na tela**: 0 produtos aparecendo

---

## 🔍 Possíveis Causas

### 1. **Erro de RLS (Row Level Security)**
Mesmo com `SERVICE_ROLE_KEY`, as políticas RLS podem estar bloqueando a inserção.

**Verificar:**
- Logs da Edge Function devem mostrar erro `42501` (permission denied)
- Ou erro `42P17` (infinite recursion)

### 2. **Produtos Marcados como Duplicados**
A verificação de duplicatas pode estar marcando todos os produtos como já existentes incorretamente.

**Verificar:**
- Logs devem mostrar `⏭️ Produto já existe` para cada produto
- Query de verificação pode estar retornando resultados incorretos

### 3. **Erro na Inserção (Constraint Violation)**
Algum constraint (NOT NULL, CHECK, etc.) pode estar falhando.

**Verificar:**
- Logs devem mostrar erro `23514` (check constraint violation)
- Ou erro `23502` (not null violation)

### 4. **Erro na Verificação de Duplicatas**
A query de verificação pode estar falhando e impedindo a inserção.

**Verificar:**
- Logs devem mostrar `⚠️ Erro ao verificar produto existente`

---

## 🛠️ Ações Necessárias

### PASSO 1: Verificar Logs da Edge Function

Acesse o Supabase Dashboard → Edge Functions → `scan-website-products` → Logs

**Procure por:**
1. `❌ ERRO AO INSERIR PRODUTO` - mostra o erro específico
2. `⏭️ Produto já existe` - indica que está sendo marcado como duplicado
3. `⚠️ Erro ao verificar produto existente` - indica problema na verificação
4. `🔒 ERRO DE PERMISSÃO RLS` - indica problema de RLS

### PASSO 2: Verificar Se Há Produtos no Banco

Execute este SQL:

```sql
-- Verificar produtos do tenant Uniluvas
SELECT 
  id,
  nome,
  categoria,
  created_at
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
ORDER BY created_at DESC;
```

**Se retornar 0 linhas:**
- Produtos realmente não foram inseridos
- Verificar logs da Edge Function para erro específico

**Se retornar linhas:**
- Produtos foram inseridos, mas não estão aparecendo na tela
- Problema é no frontend, não no backend

### PASSO 3: Testar Inserção Manual

Execute este SQL para testar se a inserção funciona:

```sql
-- Teste de inserção manual
INSERT INTO tenant_products (
  tenant_id,
  nome,
  categoria,
  extraido_de,
  confianca_extracao
) VALUES (
  '4a542a72-b8d9-4b05-a96d-dba7e2da4761',
  'TESTE PRODUTO MANUAL',
  'TESTE',
  'manual',
  0.9
)
RETURNING id, nome;
```

**Se funcionar:**
- RLS está OK, problema é na Edge Function
- Verificar logs da Edge Function

**Se falhar:**
- RLS está bloqueando
- Verificar políticas RLS

---

## 📋 Checklist de Diagnóstico

- [ ] Verificar logs da Edge Function
- [ ] Verificar se há produtos no banco (SQL acima)
- [ ] Testar inserção manual (SQL acima)
- [ ] Verificar políticas RLS
- [ ] Verificar se `SERVICE_ROLE_KEY` está configurada

---

## 🎯 Próximos Passos

Após executar os passos acima, me envie:
1. **Logs da Edge Function** (especialmente erros)
2. **Resultado da query de verificação** (quantos produtos no banco)
3. **Resultado do teste de inserção manual** (funcionou ou falhou)

Com essas informações, posso identificar o problema exato e corrigir.

