# 📋 ENTENDIMENTO COMPLETO DAS SOLICITAÇÕES

## ✅ PONTO 1: CNPJ Clicável com Preview Completo

### **O QUE O USUÁRIO QUER:**
- Ao clicar no CNPJ na tabela de **"Empresas Qualificadas"**, deve abrir o mesmo preview completo que existe em:
  - Gerenciar Empresas
  - Quarentena ICP
  - Leads Aprovados

### **STATUS ATUAL:**
- ✅ Existe função `handleShowFullPreview()` em `QualifiedProspectsStock.tsx` (linha ~700)
- ✅ Existe modal de preview (`Dialog` com dados completos)
- ❌ **PROBLEMA:** CNPJ não está clicável na tabela (linha 1352-1354)

### **O QUE PRECISA SER FEITO:**
1. Tornar CNPJ clicável (adicionar `onClick` e estilo `cursor-pointer`)
2. Chamar `handleShowFullPreview(prospect.cnpj)` ao clicar
3. Garantir que o preview seja idêntico ao das outras tabelas

### **CÓDIGO ATUAL (linha 1352):**
```typescript
<TableCell className="font-mono text-sm">
  {prospect.cnpj}
</TableCell>
```

### **CÓDIGO NECESSÁRIO:**
```typescript
<TableCell className="font-mono text-sm">
  <Badge 
    variant="outline" 
    className="font-mono text-xs cursor-pointer hover:bg-primary/10 transition-colors"
    onClick={() => handleShowFullPreview(prospect.cnpj)}
  >
    {prospect.cnpj}
  </Badge>
</TableCell>
```

---

## ✅ PONTO 2: Coluna "Origem" (Source) na Tabela

### **O QUE O USUÁRIO QUER:**
- Adicionar coluna **"Origem"** na tabela de Empresas Qualificadas
- Mostrar:
  - Nome do arquivo CSV
  - Nome do Google Sheet
  - Nome da API (Empresas Aqui)
- **Igual ao que existe em "Gerenciar Empresas"**

### **STATUS ATUAL:**
- ✅ Existe coluna "Origem" em `CompaniesManagementPage.tsx` (linha 2019-2031)
- ✅ Existe campo `source_name` em `qualified_prospects` (via migration)
- ❌ **PROBLEMA:** Coluna "Origem" não está sendo exibida na tabela de Empresas Qualificadas

### **O QUE PRECISA SER FEITO:**
1. Adicionar coluna "Origem" no `TableHeader`
2. Adicionar `TableCell` mostrando `prospect.source_name` ou `prospect.job?.source_file_name`
3. Adicionar filtro de "Origem" (igual ao de Gerenciar Empresas)

### **CÓDIGO DE REFERÊNCIA (CompaniesManagementPage.tsx linha 2019):**
```typescript
<TableCell>
  {(company as any).source_name ? (
    <Badge 
      variant="secondary" 
      className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs"
    >
      {(company as any).source_name}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Legacy
    </Badge>
  )}
</TableCell>
```

### **FILTRO DE ORIGEM (CompaniesManagementPage.tsx linha 80, 110-113):**
```typescript
const [filterOrigin, setFilterOrigin] = useState<string[]>([]);

// No useMemo:
if (filterOrigin.length > 0) {
  filtered = filtered.filter(c => filterOrigin.includes(c.source_name || ''));
}
```

---

## ✅ PONTO 3: Filtros Idênticos a "Gerenciar Empresas"

### **O QUE O USUÁRIO QUER:**
- Tabela de "Empresas Qualificadas" deve ter **EXATAMENTE** os mesmos filtros que "Gerenciar Empresas":
  - ✅ Filtro de **Origem** (já mencionado acima)
  - ✅ Filtro de **Status CNPJ** (ATIVA, SUSPENSA, INAPTA, BAIXADA, NULA)
  - ✅ Filtro de **Setor**
- **SEM PERDER** nenhuma funcionalidade existente

### **STATUS ATUAL:**
- ✅ Existe filtro de Grade em `QualifiedProspectsStock.tsx` (linha 140, 181)
- ✅ Existe filtro de Setor (linha 142, 184)
- ✅ Existe filtro de Estado (linha 143, 186)
- ❌ **FALTA:** Filtro de Origem
- ❌ **FALTA:** Filtro de Status CNPJ

### **FILTROS EM "GERENCIAR EMPRESAS" (CompaniesManagementPage.tsx):**
```typescript
// Estados dos filtros (linha 80-85)
const [filterOrigin, setFilterOrigin] = useState<string[]>([]);
const [filterStatus, setFilterStatus] = useState<string[]>([]);
const [filterSector, setFilterSector] = useState<string[]>([]);
const [filterRegion, setFilterRegion] = useState<string[]>([]);

// Aplicação dos filtros (linha 110-158)
if (filterOrigin.length > 0) {
  filtered = filtered.filter(c => filterOrigin.includes(c.source_name || ''));
}
if (filterStatus.length > 0) {
  // Normalizar status CNPJ e filtrar
}
if (filterSector.length > 0) {
  filtered = filtered.filter(c => {
    const sector = c.industry || ...;
    return filterSector.includes(sector);
  });
}
```

### **O QUE PRECISA SER FEITO:**
1. Adicionar estados de filtro: `filterOrigin`, `filterStatusCNPJ`
2. Adicionar lógica de filtro no `useMemo` de `prospects`
3. Adicionar componentes de filtro no header da tabela (igual ao de Gerenciar Empresas)

---

## ✅ PONTO 4: Colunas Idênticas a "Gerenciar Empresas"

### **O QUE O USUÁRIO QUER:**
- Comparar colunas entre as duas tabelas
- Adicionar colunas faltantes em "Empresas Qualificadas"
- **SEM PERDER** fórmulas e códigos existentes

### **COLUNAS EM "GERENCIAR EMPRESAS":**
1. Checkbox
2. Empresa (nome)
3. CNPJ (clicável)
4. **Origem** (source_name)
5. **Status CNPJ** (ATIVA, SUSPENSA, etc.)
6. **Setor** (industry/setor)
7. UF/Cidade
8. Score ICP
9. Status Análise
10. TOTVS Check
11. Website
12. Ações

### **COLUNAS EM "EMPRESAS QUALIFICADAS" (atual):**
1. Checkbox
2. CNPJ (não clicável)
3. Razão Social
4. Nome Fantasia
5. Cidade/UF
6. Setor
7. ICP
8. Fit Score
9. Grade
10. Origem (não exibida, mas existe nos dados)
11. Ações

### **COLUNAS FALTANTES:**
- ❌ **Status CNPJ** (badge com status da Receita Federal)
- ❌ **Origem** (já existe nos dados, só precisa exibir)

### **COLUNAS ESPECÍFICAS DE QUALIFICAÇÃO (MANTER):**
- ✅ Fit Score (com tooltip)
- ✅ Grade (com tooltip)
- ✅ ICP

---

## ✅ PONTO 5: Setor Baseado em IBGE

### **O QUE O USUÁRIO QUER:**
- Confirmar que setor está sendo classificado usando API do IBGE
- Garantir que está sendo aplicado em todas as tabelas

### **STATUS:**
- ✅ Integração IBGE existe (`brasilApiComplete.ts`)
- ⚠️ **PENDENTE:** Integração no fluxo de qualificação (já identificado na análise anterior)

---

## ✅ PONTO 6: Cross-Matching de CNAEs (FUTURO)

### **O QUE O USUÁRIO PERGUNTA:**
- É possível usar IA para fazer matching entre CNAEs complementares?
- Exemplo: Fabricante de peças automotivas + Distribuidor de alimentos
- Identificar oportunidades de negócio baseado em CNAEs relacionados

### **RESPOSTA CONCEITUAL:**
✅ **SIM, É POSSÍVEL!** Mas requer:
1. Base de conhecimento de relacionamentos CNAE (ex: fabricante → distribuidor)
2. IA para identificar padrões de complementaridade
3. Sistema de scoring de "match de negócio" (diferente de Fit Score ICP)

### **IMPLEMENTAÇÃO FUTURA:**
- Criar tabela de relacionamentos CNAE
- Usar embeddings para similaridade semântica
- Calcular "Business Match Score" baseado em cadeia de valor

---

## 📋 RESUMO DO QUE PRECISA SER IMPLEMENTADO

### **PRIORIDADE ALTA (Imediato):**

1. **CNPJ Clicável:**
   - Adicionar `onClick` no CNPJ
   - Chamar `handleShowFullPreview()`
   - Estilo igual às outras tabelas

2. **Coluna Origem:**
   - Adicionar no `TableHeader`
   - Adicionar no `TableCell`
   - Mostrar `source_name` ou `job.source_file_name`

3. **Filtro de Origem:**
   - Adicionar estado `filterOrigin`
   - Adicionar lógica de filtro
   - Adicionar componente de filtro no header

4. **Filtro de Status CNPJ:**
   - Adicionar estado `filterStatusCNPJ`
   - Adicionar lógica de filtro (normalizar status)
   - Adicionar componente de filtro no header
   - Adicionar coluna "Status CNPJ" na tabela

### **PRIORIDADE MÉDIA:**
5. Comparar todas as colunas e adicionar as faltantes
6. Garantir que setor use IBGE (já identificado na análise anterior)

### **PRIORIDADE BAIXA (Futuro):**
7. Cross-matching de CNAEs (requer análise e planejamento)

---

## 🎯 PRÓXIMOS PASSOS

1. **Confirmar entendimento** com o usuário
2. **Implementar em micro ciclos:**
   - CICLO 1: CNPJ clicável + Preview
   - CICLO 2: Coluna Origem + Filtro Origem
   - CICLO 3: Filtro Status CNPJ + Coluna Status CNPJ
   - CICLO 4: Comparação completa de colunas

---

**Status:** ✅ Análise completa - Aguardando confirmação do usuário

