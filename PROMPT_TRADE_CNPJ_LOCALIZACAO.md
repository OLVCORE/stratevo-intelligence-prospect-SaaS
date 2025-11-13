# 🎯 SUBSTITUIR COLUNA CNPJ POR CIDADE/PAÍS - TRADE INTELLIGENCE

## 🚨 PROTOCOLO DE SEGURANÇA - LEIA ANTES DE EXECUTAR

**IMPORTANTE:**
- ❌ NÃO refatore outros códigos
- ❌ NÃO "melhore" coisas que não foram pedidas
- ❌ NÃO crie arquivos novos
- ✅ APENAS modifique os arquivos listados abaixo
- ✅ MOSTRE o código ANTES e DEPOIS de cada mudança
- ✅ Execute `npm run build` ao final

---

## 🎯 OBJETIVO

**Substituir a coluna "CNPJ" por "Cidade/País" nas tabelas de empresas.**

**Por quê?**
- Empresas internacionais (dealers B2B) NÃO têm CNPJ brasileiro
- Mostrar localização é mais útil que "N/A"

---

## 📂 ARQUIVOS A MODIFICAR

Identifique e modifique APENAS estes arquivos (se existirem):

1. `src/pages/ExportDealersPage.tsx` (se existir)
2. `src/pages/CompaniesManagementPage.tsx` (ou similar)
3. `src/pages/DealerDiscoveryPage.tsx` (ou similar)
4. Qualquer página que mostre tabela de empresas/dealers

---

## 🔧 MUDANÇAS A FAZER

### **ETAPA 1: ADICIONAR IMPORT DO ÍCONE**

**ANTES:**
```typescript
import { Building2, Search, Edit, ... } from 'lucide-react';
```

**DEPOIS:**
```typescript
import { Building2, Search, Edit, ..., MapPin } from 'lucide-react';
```

---

### **ETAPA 2: MODIFICAR HEADER DA TABELA**

**PROCURE POR:**
```typescript
<TableHead>
  <Button onClick={() => handleSort('cnpj')}>
    CNPJ
    <ArrowUpDown />
  </Button>
</TableHead>
```

**SUBSTITUA POR:**
```typescript
<TableHead>
  <Button onClick={() => handleSort('city')}>
    📍 Localização
    <ArrowUpDown />
  </Button>
</TableHead>
```

---

### **ETAPA 3: MODIFICAR CÉLULA DA TABELA**

**PROCURE POR:**
```typescript
<TableCell>
  {company.cnpj || 'N/A'}
</TableCell>
```

**SUBSTITUA POR:**
```typescript
<TableCell>
  {(() => {
    const city = company.city || company.location?.city;
    const state = company.state || company.location?.state;
    const country = company.country || 'USA'; // default para dealers internacionais
    
    let location = '';
    if (city && state) {
      location = `${city}, ${state}`;
    } else if (city && country) {
      location = `${city}, ${country}`;
    } else if (country) {
      location = country;
    } else {
      location = 'N/A';
    }
    
    return location !== 'N/A' ? (
      <div className="flex items-center gap-1">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs">{location}</span>
      </div>
    ) : (
      <span className="text-xs text-muted-foreground">N/A</span>
    );
  })()}
</TableCell>
```

---

## ✅ PROTOCOLO DE VALIDAÇÃO

Após fazer as mudanças:

### **1. LISTE OS ARQUIVOS MODIFICADOS:**
```bash
git status --short
```

### **2. EXECUTE BUILD:**
```bash
npm run build
```

**Deve passar sem erros!**

### **3. TESTE LOCALMENTE:**
```bash
npm run dev
```

Acesse a página de empresas/dealers e confirme:
- ✅ Coluna mostra "📍 Localização"
- ✅ Empresas brasileiras: "São Paulo, SP"
- ✅ Empresas internacionais: "New York, USA" ou "USA"

---

## 🚫 O QUE NÃO FAZER

❌ **NÃO modifique:**
- Lógica de busca Apollo
- Fluxo de salvamento
- Outros componentes
- Edge Functions

❌ **NÃO adicione:**
- Validações extras
- Novos filtros
- Novas colunas

---

## 📊 FORMATO ESPERADO

### **Tabela ANTES:**
```
| Empresa                    | CNPJ | Origem  |
|----------------------------|------|---------|
| Fitness Equipment OEM      | N/A  | Legacy  |
| Amazon Wholesale           | N/A  | Apollo  |
```

### **Tabela DEPOIS:**
```
| Empresa                    | 📍 Localização | Origem  |
|----------------------------|----------------|---------|
| Fitness Equipment OEM      | 📍 USA        | Legacy  |
| Amazon Wholesale           | 📍 Seattle,USA| Apollo  |
```

---

## 🎯 CONFIRMAÇÃO FINAL

Após executar, me mostre:
1. Screenshot da tabela com nova coluna
2. Resultado de `npm run build`
3. Arquivos modificados (`git status`)

---

## ⚠️ SE DER ERRO

**SE o build falhar:**
- Mostre APENAS a mensagem de erro
- NÃO tente corrigir sozinho
- Aguarde instruções

**SE não encontrar os arquivos:**
- Liste TODOS os arquivos em `src/pages/` que contenham "dealer" ou "company"
- Aguarde confirmação de quais modificar

---

## 🚀 EXECUTE AGORA

**COMECE AQUI:**

1. Liste os arquivos em `src/pages/` relacionados a empresas/dealers
2. Mostre o conteúdo do header da tabela (TableHead)
3. Confirme que entendeu o que deve fazer
4. Execute as mudanças
5. Valide com build

**AGUARDO SUA CONFIRMAÇÃO ANTES DE PROSSEGUIR.**

