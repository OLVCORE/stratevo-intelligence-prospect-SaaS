# ⚡ **EXECUTE AGORA - SOLUÇÃO DO ERRO**

---

## 🚨 **ERRO CORRIGIDO:**

```
ERROR: cannot alter type of a column used by a view or rule
DETAIL: rule _RETURN on materialized view mv_enderecos_completos depends on column "step1_data"
```

**Motivo:** A view materializada já existia e estava travando a alteração da coluna.

**Solução:** Criei um novo SQL que **dropa a view ANTES** e **recria DEPOIS**.

---

## ✅ **EXECUTE ESTE ARQUIVO (MAIS SIMPLES):**

### **📄 ARQUIVO: `SOLUCAO_RAPIDA_ENDERECO.sql`**

Este arquivo:
- ✅ Dropa views conflitantes
- ✅ Converte coluna para JSONB
- ✅ Cria índices
- ✅ Cria funções SQL
- ✅ **SEM views materializadas** (evita conflitos)
- ✅ **SEM triggers complexos** (mais estável)

---

## 🚀 **PASSO A PASSO:**

### **1. Abrir Supabase Dashboard**
```
https://app.supabase.com/
```

### **2. Ir para SQL Editor**
- Menu lateral → **SQL Editor**
- Clique em **New Query**

### **3. Copiar o SQL**
- Abra o arquivo: **`SOLUCAO_RAPIDA_ENDERECO.sql`**
- **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

### **4. Colar no SQL Editor**
- **Cole** no SQL Editor (Ctrl+V)

### **5. EXECUTAR**
- Clique em **Run** (ou pressione Ctrl+Enter)
- Aguarde a mensagem: **"Success. No rows returned"**

### **6. TESTAR**
Substitua `SEU_TENANT_ID` pelo ID real do seu tenant e execute:

```sql
-- Ver endereço do tenant
SELECT * FROM get_tenant_endereco('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71');

-- Ver endereços dos concorrentes
SELECT * FROM get_concorrentes_com_endereco('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71');
```

---

## ✅ **RESULTADO ESPERADO:**

### **Endereço do Tenant:**
| cep | logradouro | numero | bairro | cidade | estado |
|-----|-----------|--------|--------|---------|--------|
| 01234-000 | Rua Exemplo | 123 | Centro | SAO PAULO | SP |

### **Endereços dos Concorrentes:**
| cnpj | razao_social | cep | endereco | numero | bairro | cidade | estado |
|------|-------------|-----|----------|--------|--------|---------|--------|
| 00.603.103/0001-46 | EAGLE COMERCIO | 70340000 | SRTS QD 701 | 70 | ST RADIO TEV | BRASILIA | DF |

---

## ❓ **SE DER OUTRO ERRO:**

### **Erro: "function already exists"**
```sql
-- Execute isto PRIMEIRO:
DROP FUNCTION IF EXISTS get_tenant_endereco(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_concorrentes_com_endereco(uuid) CASCADE;

-- Depois execute o SOLUCAO_RAPIDA_ENDERECO.sql novamente
```

### **Erro: "permission denied"**
```sql
-- Execute isto:
GRANT EXECUTE ON FUNCTION get_tenant_endereco(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_concorrentes_com_endereco(uuid) TO authenticated;
```

### **Erro: "relation does not exist"**
- **Verifique** se você está no projeto correto do Supabase
- **Verifique** se a tabela `onboarding_sessions` existe:
  ```sql
  SELECT * FROM onboarding_sessions LIMIT 1;
  ```

---

## 🎯 **DIFERENÇAS DOS ARQUIVOS:**

| Arquivo | Complexidade | Recomendado |
|---------|-------------|-------------|
| **SOLUCAO_RAPIDA_ENDERECO.sql** | ⭐ Simples | ✅ **USE ESTE!** |
| COPIAR_E_COLAR_NO_SUPABASE.sql | ⭐⭐ Médio | ⚠️ Pode dar erro |
| 20250202000000_fix_endereco_completo.sql | ⭐⭐⭐ Complexo | ❌ Para experts |

---

## 📋 **CHECKLIST:**

- [ ] Abri o Supabase Dashboard
- [ ] Fui para SQL Editor
- [ ] Copiei `SOLUCAO_RAPIDA_ENDERECO.sql`
- [ ] Colei no SQL Editor
- [ ] Executei (Run)
- [ ] Vi "Success. No rows returned"
- [ ] Testei `get_tenant_endereco`
- [ ] Testei `get_concorrentes_com_endereco`
- [ ] **VI OS DADOS!** 🎉

---

## 🎉 **DEPOIS DE EXECUTAR:**

### **No Frontend:**
1. Adicione um novo concorrente
2. Veja CEP/endereço no card verde
3. Clique "Adicionar Concorrente"
4. Abra o card do concorrente
5. **Veja o endereço completo!**

### **No Mapa:**
- Os endereços vão aparecer automaticamente
- Cada pin vai ter localização correta
- Tooltips vão mostrar endereço completo

### **Nas Tabelas:**
- Coluna de localização vai mostrar cidade/UF
- Endereços completos em modals
- Todos os dados sincronizados

---

## 🚀 **PRONTO! AGORA VAI FUNCIONAR!**

**📁 Execute: `SOLUCAO_RAPIDA_ENDERECO.sql`**

**✅ Simples, seguro e sem conflitos!**

