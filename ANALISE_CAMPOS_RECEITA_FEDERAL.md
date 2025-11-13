# 🔍 ANÁLISE COMPLETA - CAMPOS RECEITA FEDERAL

## ✅ **CAMPOS QUE JÁ ESTÃO CONECTADOS:**

| Campo UI | Localização | Lê de onde | Status |
|----------|-------------|------------|--------|
| **CNPJ** | Card principal (linha 789) | `company.cnpj` | ✅ **OK** |
| **SITUAÇÃO** | Card principal (linha 821) | `receitaData.situacao` | ✅ **OK** |
| **PORTE** | Card principal (linha 836) | `receitaData.porte` | ✅ **OK** |
| **ABERTURA** | Card principal (linha 847) | `receitaData.data_inicio_atividade` | ⚠️ **INCOMPLETO** |
| **FUNCIONÁRIOS** | Card principal (linha 861) | `raw_data.apollo.employee_count` | ⚠️ **INCOMPLETO** |
| **SÓCIOS** | Card principal (linha 875) | `receitaData.qsa.length` | ✅ **OK** |
| **WEBSITE** | Card principal (linha 886) | `company.website` | ✅ **OK** |
| **Nome Fantasia** | Identificação Cadastral (linha 915) | `receitaData.fantasia` | ✅ **OK** |
| **Capital Social** | Informações Financeiras (linha 1227) | `receitaData.capital_social` | ✅ **OK** |

---

## 🔧 **CAMPOS QUE PRECISAM SER CORRIGIDOS:**

### **1️⃣ DATA DE ABERTURA** (linha 847-849)

**ATUAL:**
```typescript
{receitaData?.data_inicio_atividade 
  ? new Date(receitaData.data_inicio_atividade).toLocaleDateString('pt-BR')
  : rawData?.data_abertura || 'N/A'}
```

**PROBLEMA:** Receita Federal retorna `abertura`, não `data_inicio_atividade`

**CORREÇÃO:**
```typescript
{receitaData?.abertura || receitaData?.data_inicio_atividade
  ? new Date(receitaData?.abertura || receitaData?.data_inicio_atividade).toLocaleDateString('pt-BR')
  : rawData?.data_abertura || 'N/A'}
```

---

### **2️⃣ FUNCIONÁRIOS** (linha 861-863)

**ATUAL:**
```typescript
{(company as any)?.raw_data?.apollo?.employee_count || 
 rawData?.funcionarios_presumido_matriz_cnpj || 
 company.employees || 'N/A'}
```

**PROBLEMA:** Não busca de `receita_federal.qsa_qtd` ou estimated_num_employees do Apollo

**CORREÇÃO:**
```typescript
{rawData?.apollo_organization?.estimated_num_employees ||
 (company as any)?.raw_data?.apollo?.employee_count || 
 rawData?.funcionarios_presumido_matriz_cnpj || 
 company.employees || 
 company.employee_count ||
 receitaData?.qsa?.length || 'N/A'}
```

---

### **3️⃣ CAPITAL SOCIAL** (linha 1227-1228)

**ATUAL:**
```typescript
{receitaData?.capital_social || rawData.capital_social
  ? `R$ ${parseFloat(receitaData?.capital_social || rawData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  : 'N/A'}
```

**STATUS:** ✅ **JÁ ESTÁ CORRETO!**

---

### **4️⃣ NOME FANTASIA** (linha 915)

**ATUAL:**
```typescript
{receitaData?.fantasia || rawData.nome_fantasia || 'N/A'}
```

**STATUS:** ✅ **JÁ ESTÁ CORRETO!**

---

## 🎯 **RESUMO:**

**APENAS 2 CAMPOS PRECISAM SER CORRIGIDOS:**
1. ⚠️ **DATA DE ABERTURA** - adicionar `receita.abertura`
2. ⚠️ **FUNCIONÁRIOS** - adicionar `apollo_organization.estimated_num_employees`

**TODOS OS OUTROS JÁ ESTÃO CONECTADOS!**

---

## 📊 **PROBLEMA REAL:**

O problema NÃO é a conexão dos campos, mas sim:

**❌ Os DADOS não estão chegando porque:**
1. `receitaData` está vazio ou NULL
2. O enrichment da Receita Federal não está salvando corretamente
3. O normalizador não está funcionando

---

## 🔍 **PRÓXIMO PASSO:**

Verificar no banco se a empresa OLV INTERNACIONAL tem dados da Receita Federal:

```sql
SELECT 
  name,
  cnpj,
  raw_data->'receita_federal' as receita,
  raw_data->'receita' as receita_alt
FROM companies
WHERE name LIKE '%OLV INTERNACIONAL%'
LIMIT 1;
```

**Me envie o resultado** e vou saber se o problema é:
- A) Dados não estão no banco → Corrigir enrichment
- B) Dados estão no banco → Corrigir leitura no componente


