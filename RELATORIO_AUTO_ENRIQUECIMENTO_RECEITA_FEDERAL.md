# 📊 RELATÓRIO: AUTO-ENRIQUECIMENTO RECEITA FEDERAL

## 🎯 **OBJETIVO:**

Implementar auto-enriquecimento **APENAS da Receita Federal** (GRÁTIS) ao importar empresas, extraindo MÁXIMO de informações dos 87 campos.

---

## 📋 **ANÁLISE ATUAL:**

### **✅ JÁ IMPLEMENTADO:**

1. **Função:** `consultarReceitaFederal()` em `src/services/receitaFederal.ts`
2. **APIs com fallback:**
   - 1️⃣ ReceitaWS (primeiro)
   - 2️⃣ BrasilAPI (fallback)
3. **Merge automático:** Combina dados das 2 APIs

---

### **📊 CAMPOS QUE JÁ SÃO EXTRAÍDOS:**

| Campo | ReceitaWS | BrasilAPI | Status |
|-------|-----------|-----------|--------|
| Nome/Razão Social | ✅ `nome` | ✅ `razao_social` | ✅ OK |
| Nome Fantasia | ✅ `fantasia` | ✅ `nome_fantasia` | ✅ OK |
| Situação | ✅ `situacao` | ✅ `descricao_situacao_cadastral` | ✅ OK |
| Porte | ✅ `porte` | ✅ `porte` | ✅ OK |
| Natureza Jurídica | ✅ `natureza_juridica` | ✅ `natureza_juridica` | ✅ OK |
| UF | ✅ `uf` | ✅ `uf` | ✅ OK |
| Município | ✅ `municipio` | ✅ `municipio` | ✅ OK |
| Bairro | ✅ `bairro` | ✅ `bairro` | ✅ OK |
| Logradouro | ✅ `logradouro` | ✅ `logradouro` | ✅ OK |
| Número | ✅ `numero` | ✅ `numero` | ✅ OK |
| Complemento | ✅ `complemento` | ✅ `complemento` | ✅ OK |
| CEP | ✅ `cep` | ✅ `cep` | ✅ OK |
| CNAE Principal | ✅ `atividade_principal[]` | ✅ `cnae_fiscal` | ✅ OK |
| CNAEs Secundários | ✅ `atividades_secundarias[]` | ✅ `cnaes_secundarios[]` | ✅ OK |
| QSA (Sócios) | ✅ `qsa[]` | ✅ `qsa[]` | ✅ OK |

---

### **❌ CAMPOS QUE ESTÃO FALTANDO:**

| Campo | ReceitaWS | BrasilAPI | Por que falta? |
|-------|-----------|-----------|----------------|
| **Capital Social** | ❌ Não tem | ✅ `capital_social` | NÃO está no merge! |
| **Data Abertura** | ❌ Não tem | ✅ `data_inicio_atividade` | NÃO está no merge! |
| **Email** | ❌ Não tem | ✅ `email` | NÃO está no merge! |
| **Telefone** | ✅ `telefone` | ✅ `ddd_telefone_1` | NÃO está no merge! |
| **Matriz/Filial** | ❌ Não tem | ✅ `identificador_matriz_filial` | NÃO está no merge! |
| **Data Situação** | ❌ Não tem | ✅ `data_situacao_cadastral` | NÃO está no merge! |

---

## 🔧 **CORREÇÃO NECESSÁRIA:**

### **Atualizar `receitaFederal.ts` (linha 90-119):**

**ADICIONAR no merge:**

```typescript
const merged: ReceitaWSResponse = {
  // ... campos existentes ...
  
  // 🆕 CAMPOS ADICIONAIS DO BRASILAPI:
  capital_social: brasilAPIData?.capital_social || receitaWSData?.capital_social || null,
  abertura: brasilAPIData?.data_inicio_atividade || receitaWSData?.abertura || null,
  email: brasilAPIData?.email || receitaWSData?.email || null,
  telefone: receitaWSData?.telefone || brasilAPIData?.ddd_telefone_1 || null,
  data_situacao: brasilAPIData?.data_situacao_cadastral || null,
  motivo_situacao: brasilAPIData?.motivo_situacao_cadastral || null,
  tipo: brasilAPIData?.identificador_matriz_filial || 'MATRIZ',
};
```

---

## 🤖 **AUTO-ENRIQUECIMENTO:**

### **ONDE IMPLEMENTAR:**

**1. Ao criar empresa via CSV/Manual:**

```typescript
// src/pages/CompaniesManagementPage.tsx
// Após salvar empresa no banco:

const { data: newCompany } = await supabase
  .from('companies')
  .insert({ name, cnpj, ... })
  .select()
  .single();

// 🤖 AUTO-ENRIQUECER RECEITA FEDERAL
if (newCompany.cnpj) {
  const receita = await consultarReceitaFederal(newCompany.cnpj);
  if (receita.success) {
    await supabase
      .from('companies')
      .update({
        raw_data: {
          receita_federal: receita.data,
          receita_source: receita.source
        }
      })
      .eq('id', newCompany.id);
  }
}
```

**2. Ao aprovar da Quarentena:**

```typescript
// Ao mover de icp_analysis_results → companies
// Auto-enriquecer Receita Federal imediatamente
```

---

## 📊 **DOS 87 CAMPOS, QUANTOS VÊM DA RECEITA FEDERAL?**

### **CAMPOS DA RECEITA FEDERAL (Grátis):** ~25-30 campos

1. Identificação (5): Nome, Fantasia, CNPJ, Situação, Porte
2. Localização (8): CEP, Logradouro, Número, Complemento, Bairro, Município, UF, País
3. Atividade (4): CNAE Principal, CNAEs Secundários, Natureza Jurídica, Setor
4. Estrutura (3): Capital Social, Data Abertura, Tipo (Matriz/Filial)
5. Contatos (2): Email, Telefone
6. Sócios (QSA): Array completo
7. Datas (2): Data Situação, Data Início Atividade

**TOTAL:** ~25 campos GRÁTIS da Receita Federal

---

### **CAMPOS QUE VÊM DE OUTRAS FONTES (PAGOS/MANUAL):** ~60 campos

- Apollo: Decisores, LinkedIn, Descrição, Tecnologias, Keywords
- Econodata: Faturamento, Funcionários, Importação/Exportação
- PhantomBuster: Emails decisores, LinkedIn posts
- Google: Presença digital
- Hunter.io: Emails validados
- Serasa: Dívidas, Score crédito

---

## ✅ **PLANO DE EXECUÇÃO:**

### **FASE 1: Corrigir campos faltantes** (5 minutos)
1. Adicionar `capital_social` no merge
2. Adicionar `abertura` / `data_inicio_atividade` no merge
3. Adicionar `email` e `telefone` no merge

### **FASE 2: Implementar auto-enriquecimento** (15 minutos)
1. Criar hook `useAutoEnrichReceitaFederal()`
2. Disparar ao salvar empresa nova (CSV, manual, aprovação)
3. Salvar em `raw_data.receita_federal`

### **FASE 3: Atualizar UI** (5 minutos)
1. Corrigir leitura de `abertura` (linha 847)
2. Corrigir leitura de `funcionários` (linha 861)

---

## 🚀 **RESULTADO ESPERADO:**

**APÓS IMPLEMENTAÇÃO:**

```
IMPORTAR EMPRESA (CSV)
  ↓
Salva: nome, cnpj
  ↓
🤖 AUTO-ENRIQUECE (2-3 segundos):
  ├─ BrasilAPI/ReceitaWS (fallback)
  ├─ Extrai ~25 campos
  └─ Salva em raw_data.receita_federal
  ↓
UI ATUALIZA AUTOMATICAMENTE:
  ✅ Nome Fantasia
  ✅ Capital Social
  ✅ Data Abertura
  ✅ Porte
  ✅ Sócios (QSA)
  ✅ Endereço completo
  ✅ CNAEs
  ✅ Email/Telefone
  ↓
Decisores/Apollo: MANUAL (economiza créditos)
```

---

## 💰 **ECONOMIA DE CRÉDITOS:**

| Fonte | Custo | Auto? | Quando usar |
|-------|-------|-------|-------------|
| **Receita Federal** | 💚 GRÁTIS | ✅ AUTO | Sempre |
| **Apollo** | 💰 $$$$ | ❌ MANUAL | Só empresas qualificadas |
| **PhantomBuster** | 💰 $$$ | ❌ MANUAL | Só empresas qualificadas |
| **Hunter.io** | 💰 $$ | ❌ MANUAL | Só para emails validados |

---

## ✅ **CONFIRMAÇÃO:**

**ENTENDI CORRETO?**

1. ✅ AUTO: Receita Federal (25 campos grátis)
2. ❌ MANUAL: Apollo/LinkedIn (após qualificar empresa)
3. ✅ Fallback: ReceitaWS → BrasilAPI
4. ✅ Extrair máximo de informações possível

**POSSO EXECUTAR AS 3 FASES?** 🚀

