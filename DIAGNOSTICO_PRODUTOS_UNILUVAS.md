# 🔍 DIAGNÓSTICO: Produtos Uniluvas Não Aparecem

## 📊 SITUAÇÃO ATUAL

- **Tenant ID:** `4a542a72-b8d9-4b05-a96d-dba7e2da4761`
- **CNPJ:** `19426235000178`
- **Website:** `https://www.uniluvas.com.br/`

### Histórico de Produtos Encontrados:
- ✅ Versão original: **29 produtos**
- ✅ Depois: **34 produtos**
- ⚠️ Após revisão: **17 produtos**
- ❌ Agora: **12 produtos encontrados, 0 inseridos, 0 aparecem em tela**

---

## 🔴 PROBLEMA IDENTIFICADO

### 1. **`products_inserted: 0`**
- Edge Function encontra 12 produtos
- Mas **NENHUM é inserido** no banco
- Logs mostram: `products_found: 12, products_inserted: 0`

### 2. **Produtos Não Aparecem em Tela**
- Frontend busca produtos: `0 produtos encontrados`
- Mesmo após 3 tentativas de recarregar

### 3. **Possíveis Causas:**

#### A. **RLS Bloqueando Inserção (MESMO COM SERVICE_ROLE_KEY)**
- Política RLS usa `get_user_tenant_ids()` que depende de `auth.uid()`
- SERVICE_ROLE_KEY deveria bypassar, mas pode não estar funcionando
- **Evidência:** Logs mostram `products_inserted: 0` sem erro explícito

#### B. **Verificação de Duplicatas Muito Restritiva**
- Verifica se produto já existe antes de inserir
- Se todos os 12 produtos já existem, nenhum é inserido
- **Mas:** Frontend mostra 0 produtos, então não estão no banco

#### C. **Erro Silencioso na Inserção**
- Erro pode estar sendo capturado mas não logado corretamente
- **Solução:** Logs mais detalhados já implementados

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Logs Detalhados**
- ✅ Log antes de inserir cada produto
- ✅ Log detalhado de erros (código, mensagem, hint)
- ✅ Verificação de SERVICE_ROLE_KEY
- ✅ Teste de conexão com tabela

### 2. **Fallback para RPC**
- ✅ Se inserção direta falhar, tenta via RPC
- ✅ RPC usa `SECURITY DEFINER` que bypassa RLS

### 3. **Remoção de Limites**
- ✅ Processa 100% dos links do menu (sem limite de 10)
- ✅ Delay de 500ms entre requisições

---

## 🔧 PRÓXIMOS PASSOS

### 1. **Verificar Banco de Dados Diretamente**
Execute o script `VERIFICAR_PRODUTOS_UNILUVAS.sql` no Supabase SQL Editor:

```sql
-- Ver quantos produtos existem no banco
SELECT COUNT(*) FROM tenant_products 
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761';
```

### 2. **Verificar Logs da Edge Function**
No Supabase Dashboard → Edge Functions → `scan-website-products` → Logs:
- Procurar por `[ScanWebsite] ❌ ERRO AO INSERIR PRODUTO`
- Verificar código de erro específico
- Verificar se SERVICE_ROLE_KEY está configurada

### 3. **Criar RPC de Inserção (Se Necessário)**
Se RLS estiver bloqueando, criar função RPC com `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION insert_tenant_product(
  p_tenant_id UUID,
  p_nome TEXT,
  p_descricao TEXT,
  p_categoria TEXT,
  -- ... outros campos
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO tenant_products (
    tenant_id, nome, descricao, categoria, ...
  ) VALUES (
    p_tenant_id, p_nome, p_descricao, p_categoria, ...
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
```

### 4. **Verificar RLS Policies**
Verificar se políticas RLS estão bloqueando mesmo com SERVICE_ROLE_KEY:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'tenant_products';
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Executar `VERIFICAR_PRODUTOS_UNILUVAS.sql` no Supabase
- [ ] Verificar logs da Edge Function no Supabase Dashboard
- [ ] Verificar se SERVICE_ROLE_KEY está configurada nas variáveis de ambiente
- [ ] Verificar se há produtos no banco que não aparecem (problema de RLS na leitura)
- [ ] Criar RPC de inserção se necessário
- [ ] Testar extração novamente após correções

---

## 🎯 RESULTADO ESPERADO

Após correções:
- ✅ Edge Function encontra produtos
- ✅ Produtos são **INSERIDOS** no banco (`products_inserted > 0`)
- ✅ Produtos **APARECEM EM TELA** (cards e tabela)
- ✅ Contador mostra número correto de produtos

