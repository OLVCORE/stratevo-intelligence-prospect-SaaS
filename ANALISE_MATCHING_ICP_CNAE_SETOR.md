# 📊 ANÁLISE: Matching ICP com CNAE e Setor

## ✅ O QUE ESTÁ SENDO FEITO ATUALMENTE

### 1. **Estrutura do ICP (icp_profiles_metadata)**

A tabela `icp_profiles_metadata` armazena:
- ✅ `setor_foco` (TEXT) - Setor principal do ICP
- ✅ `nicho_foco` (TEXT) - Nicho principal do ICP
- ❌ **NÃO TEM** campos para CNAEs alvo (cnaes_alvo)
- ❌ **NÃO TEM** campos para setores alvo (setores_alvo) como array

**Problema identificado:** O ICP só tem `setor_foco` como texto simples, não tem arrays de CNAEs e setores configurados.

---

### 2. **Estrutura das Empresas (prospecting_candidates)**

A tabela `prospecting_candidates` armazena:
- ✅ `sector` (TEXT) - Setor da empresa
- ✅ `cnpj` (TEXT) - CNPJ da empresa
- ❌ **NÃO TEM** campo `cnae_principal`
- ❌ **NÃO TEM** campo `cnae_secundario`
- ❌ **NÃO TEM** campo `cnaes` (array)

**Problema identificado:** As empresas importadas não têm CNAEs armazenados.

---

### 3. **Estrutura das Empresas Qualificadas (qualified_prospects)**

A tabela `qualified_prospects` armazena:
- ✅ `setor` (TEXT) - Setor da empresa
- ✅ `cnae_principal` (TEXT) - CNAE principal
- ✅ `cnae_descricao` (TEXT) - Descrição do CNAE
- ❌ **NÃO TEM** campo `cnae_secundario`
- ❌ **NÃO TEM** campo `cnaes` (array)

**Problema identificado:** Só tem CNAE principal, não tem secundários.

---

### 4. **Como o Matching Está Sendo Feito Atualmente**

#### Na função `process_qualification_job` (SQL):

```sql
-- 1. Setor match (30%) - se ICP tiver setor_foco
IF v_icp_profile IS NOT NULL AND v_icp_profile.setor_foco IS NOT NULL THEN
  IF v_candidate.sector IS NOT NULL AND 
     LOWER(v_candidate.sector) LIKE '%' || LOWER(v_icp_profile.setor_foco) || '%' THEN
    v_sector_match := true;
    v_sector_score := 30;
    v_fit_score := v_fit_score + 30;
  END IF;
END IF;
```

**O que está sendo feito:**
- ✅ Compara `v_candidate.sector` com `v_icp_profile.setor_foco` usando LIKE (busca parcial)
- ✅ Se match, adiciona 30 pontos ao fit_score
- ❌ **NÃO está verificando CNAE principal**
- ❌ **NÃO está verificando CNAE secundário**
- ❌ **NÃO está verificando múltiplos setores do ICP**

**Problemas:**
1. Matching de setor é muito simples (LIKE parcial)
2. Não verifica CNAE (nem principal, nem secundário)
3. ICP só tem um setor (`setor_foco`), não tem array de setores
4. Empresas em `prospecting_candidates` não têm CNAE

---

### 5. **Outros Engines de Matching (TypeScript)**

Existem outros engines em TypeScript que fazem matching mais completo:

#### `icpQualificationEngine.ts`:
- ✅ Verifica CNAE principal
- ✅ Verifica CNAE secundário (se disponível)
- ✅ Verifica setor
- ✅ Verifica nicho
- ✅ Usa arrays de CNAEs e setores do ICP

**Mas este engine NÃO está sendo usado no fluxo de qualificação atual!**

---

## ❌ O QUE ESTÁ FALTANDO

### 1. **Estrutura do ICP Precisa Ter:**
- ❌ Array de CNAEs alvo (`cnaes_alvo TEXT[]`)
- ❌ Array de setores alvo (`setores_alvo TEXT[]`)
- ❌ Array de nichos alvo (`nichos_alvo TEXT[]`)

### 2. **Estrutura das Empresas Precisa Ter:**
- ❌ CNAE principal em `prospecting_candidates`
- ❌ CNAE secundário em `prospecting_candidates`
- ❌ Array de CNAEs em `prospecting_candidates`

### 3. **Função de Matching Precisa:**
- ❌ Verificar CNAE principal da empresa vs CNAEs alvo do ICP
- ❌ Verificar CNAE secundário da empresa vs CNAEs alvo do ICP
- ❌ Verificar setor da empresa vs setores alvo do ICP
- ❌ Adicionar coluna identificando qual CNAE/setor fez match
- ❌ Classificar melhor as empresas (A+, A, B, C, D) baseado nos matchings

---

## 🎯 O QUE PRECISA SER IMPLEMENTADO

### FASE 1: Estrutura de Dados

1. **Adicionar campos ao ICP (`icp_profiles_metadata`):**
   ```sql
   ALTER TABLE icp_profiles_metadata 
   ADD COLUMN IF NOT EXISTS cnaes_alvo TEXT[],
   ADD COLUMN IF NOT EXISTS setores_alvo TEXT[],
   ADD COLUMN IF NOT EXISTS nichos_alvo TEXT[];
   ```

2. **Adicionar campos às empresas (`prospecting_candidates`):**
   ```sql
   ALTER TABLE prospecting_candidates
   ADD COLUMN IF NOT EXISTS cnae_principal TEXT,
   ADD COLUMN IF NOT EXISTS cnae_secundario TEXT,
   ADD COLUMN IF NOT EXISTS cnaes TEXT[];
   ```

3. **Adicionar campos às empresas qualificadas (`qualified_prospects`):**
   ```sql
   ALTER TABLE qualified_prospects
   ADD COLUMN IF NOT EXISTS cnae_secundario TEXT,
   ADD COLUMN IF NOT EXISTS cnaes TEXT[],
   ADD COLUMN IF NOT EXISTS cnae_match_principal BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS cnae_match_secundario BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS setor_match BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS cnae_match_codigo TEXT, -- CNAE que fez match
   ADD COLUMN IF NOT EXISTS setor_match_codigo TEXT; -- Setor que fez match
   ```

### FASE 2: Lógica de Matching

1. **Atualizar função `process_qualification_job`:**
   - Buscar `cnaes_alvo` e `setores_alvo` do ICP
   - Verificar CNAE principal da empresa vs `cnaes_alvo`
   - Verificar CNAE secundário da empresa vs `cnaes_alvo`
   - Verificar setor da empresa vs `setores_alvo`
   - Calcular score baseado nos matchings
   - Armazenar quais CNAEs/setores fizeram match

2. **Pesos sugeridos:**
   - CNAE principal match: 40 pontos
   - CNAE secundário match: 20 pontos
   - Setor match: 30 pontos
   - Localização: 10 pontos

### FASE 3: Classificação (A+, A, B, C, D)

- **A+**: CNAE principal + setor match (score >= 90)
- **A**: CNAE principal OU setor match (score >= 75)
- **B**: CNAE secundário OU setor relacionado (score >= 60)
- **C**: Algum match parcial (score >= 40)
- **D**: Sem match significativo (score < 40)

---

## 📋 RESUMO DO ENTENDIMENTO

### O que você quer:

1. **ICP tem configuração de:**
   - CNAEs alvo (principal e secundários)
   - Setores alvo (manufatura, serviços, agronegócio, indústria, etc.)
   - Nichos alvo

2. **Quando empresas são carregadas:**
   - Sistema deve verificar se CNAE principal da empresa está nos CNAEs alvo do ICP
   - Sistema deve verificar se CNAE secundário da empresa está nos CNAEs alvo do ICP
   - Sistema deve verificar se setor da empresa está nos setores alvo do ICP

3. **Resultado:**
   - Adicionar colunas identificando qual CNAE/setor fez match
   - Classificar empresas em A+, A, B, C, D baseado nos matchings
   - Empresas que não fazem match com o ICP não devem ser qualificadas (ou ter score baixo)

### O que está faltando:

1. ❌ ICP não tem arrays de CNAEs e setores (só tem `setor_foco` texto)
2. ❌ Empresas em `prospecting_candidates` não têm CNAE
3. ❌ Função de matching não verifica CNAE
4. ❌ Não há colunas identificando qual CNAE/setor fez match
5. ❌ Classificação (A+, A, B, C, D) não considera match de CNAE/setor

---

## ✅ CONFIRMAÇÃO

**Entendi corretamente?** Você quer que:

1. O ICP armazene arrays de CNAEs e setores alvo
2. As empresas armazenem CNAE principal e secundário
3. O sistema verifique se os CNAEs da empresa estão nos CNAEs alvo do ICP
4. O sistema verifique se o setor da empresa está nos setores alvo do ICP
5. Adicionar colunas mostrando qual CNAE/setor fez match
6. Classificar empresas baseado nesses matchings (A+, A, B, C, D)

**Aguardo sua confirmação antes de executar qualquer alteração!** 🚀

