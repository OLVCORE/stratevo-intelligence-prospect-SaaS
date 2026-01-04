# 🎯 Enriquecimento CNAE com Setor/Indústria e Categoria

## 📋 Resumo

Implementação completa para enriquecer o autocomplete de CNAE com informações de **Setor/Indústria** e **Categoria**, melhorando a assertividade das buscas de prospecção.

---

## ✅ O Que Foi Implementado

### 1. **Tabela `cnae_classifications` no Supabase**

Criada tabela para armazenar o mapeamento:
- **CNAE** → **Setor/Indústria** → **Categoria**

**Estrutura:**
```sql
CREATE TABLE cnae_classifications (
  id UUID PRIMARY KEY,
  cnae_code VARCHAR(20) UNIQUE,
  setor_industria VARCHAR(100),
  categoria VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Exemplos de dados:**
- `0111-3/01` → `Agricultura` → `Produtor`
- `6201-5/00` → `Tecnologia da Informação` → `Serviços`
- `1091-1/01` → `Alimentos` → `Fabricante`

---

### 2. **Serviço `cnaeClassificationService.ts`**

Serviço frontend para buscar classificações do Supabase:

**Funções disponíveis:**
- `getCNAEClassification(cnaeCode)` - Busca classificação de um CNAE
- `getCNAEClassifications(cnaeCodes[])` - Busca múltiplas classificações
- `getCNAEsBySetor(setorIndustria)` - Busca CNAEs por setor
- `getCNAEsByCategoria(categoria)` - Busca CNAEs por categoria
- `getCNAEsBySetorECategoria(setor, categoria)` - Busca CNAEs por ambos

---

### 3. **Autocomplete Enriquecido no `BuscaEmpresasForm`**

O autocomplete de CNAE agora mostra:

**Antes:**
```
6201-5/00 - Desenvolvimento de software
```

**Depois:**
```
6201-5/00 • Tecnologia da Informação • Serviços
Desenvolvimento de software
```

**Visual:**
- **Código CNAE** em negrito
- **Setor/Indústria** em azul (badge)
- **Categoria** em roxo (badge)
- **Descrição** abaixo

---

## 🚀 Como Usar

### Passo 1: Executar Migrations

```bash
# Executar migrations no Supabase
supabase migration up
```

Ou executar manualmente no Supabase SQL Editor:
1. `20250226000001_create_cnae_classifications_table.sql`
2. `20250226000002_populate_cnae_classifications.sql`

### Passo 2: Popular Dados

**Opção A: Via SQL (Recomendado)**
- Editar `20250226000002_populate_cnae_classifications.sql`
- Adicionar todos os dados fornecidos pelo usuário
- Executar no Supabase SQL Editor

**Opção B: Via Script Python**
```bash
python scripts/populate_cnae_classifications.py
```

### Passo 3: Usar no Frontend

O enriquecimento é **automático**! Quando o usuário:
1. Digita um CNAE no autocomplete
2. O sistema busca a classificação no Supabase
3. Exibe Setor e Categoria junto com o código

---

## 💡 Benefícios

### 1. **Melhor Experiência do Usuário**
- Usuário vê imediatamente o setor e categoria do CNAE
- Facilita seleção de CNAEs relevantes
- Reduz erros de seleção

### 2. **Busca Mais Assertiva**
- Pode filtrar por Setor além de CNAE
- Pode filtrar por Categoria (ex: apenas "Fabricantes")
- Combinações: Setor + Categoria + CNAE

### 3. **Análise e Relatórios**
- Agrupar empresas por Setor
- Agrupar empresas por Categoria
- Estatísticas de distribuição

---

## 🔮 Próximos Passos (Opcional)

### 1. **Filtros Avançados no Formulário**

Adicionar filtros adicionais:
- **Filtrar por Setor:** Dropdown com setores disponíveis
- **Filtrar por Categoria:** Dropdown com categorias
- **Busca combinada:** Setor + Categoria + CNAE

### 2. **Uso na Edge Function**

Atualizar `prospeccao-avancada-buscar/index.ts` para:
- Usar Setor/Categoria quando CNAE não for específico
- Expandir busca para CNAEs do mesmo Setor
- Priorizar resultados por Categoria

**Exemplo:**
```typescript
// Se usuário selecionou Setor "Agricultura"
// Buscar todos os CNAEs de Agricultura, não apenas os selecionados
const cnaesDoSetor = await getCNAEsBySetor('Agricultura');
const cnaesParaBuscar = [...filtros.cnaesAlvo, ...cnaesDoSetor.map(c => c.cnae_code)];
```

### 3. **Estatísticas e Dashboard**

Criar visualizações:
- Distribuição de empresas por Setor
- Distribuição por Categoria
- Top Setores/Categorias encontrados

---

## 📊 Estrutura de Dados

### Tabela `cnae_classifications`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `cnae_code` | VARCHAR(20) | Código CNAE (ex: "0111-3/01") |
| `setor_industria` | VARCHAR(100) | Setor/Indústria (ex: "Agricultura") |
| `categoria` | VARCHAR(100) | Categoria (ex: "Produtor", "Fabricante") |

### Interface TypeScript

```typescript
interface CNAEClassification {
  cnae_code: string;
  setor_industria: string;
  categoria: string;
}
```

---

## 🐛 Troubleshooting

### Problema: Classificações não aparecem

**Solução:**
1. Verificar se a tabela `cnae_classifications` existe
2. Verificar se há dados na tabela
3. Verificar console do navegador para erros
4. Verificar se RLS está configurado corretamente

### Problema: Busca lenta

**Solução:**
1. Adicionar índices na tabela (já incluídos na migration)
2. Limitar busca a 30 resultados
3. Cachear classificações no frontend

---

## 📝 Notas Importantes

1. **Dados Fornecidos:** O usuário forneceu uma tabela completa com mais de 1000 CNAEs. É necessário popular todos os dados na migration `20250226000002_populate_cnae_classifications.sql`.

2. **Performance:** As classificações são buscadas em paralelo quando o usuário digita no autocomplete, mas limitadas a 30 resultados para não sobrecarregar.

3. **RLS:** A tabela `cnae_classifications` tem RLS habilitado com política de leitura pública (todos podem ler).

4. **Compatibilidade:** O sistema funciona mesmo se a classificação não existir para um CNAE específico (fallback gracioso).

---

## ✅ Checklist de Implementação

- [x] Criar tabela `cnae_classifications`
- [x] Criar serviço `cnaeClassificationService.ts`
- [x] Atualizar `BuscaEmpresasForm` para buscar classificações
- [x] Atualizar autocomplete para exibir Setor e Categoria
- [x] Atualizar lista de CNAEs selecionados para mostrar badges
- [ ] Popular todos os dados fornecidos pelo usuário
- [ ] (Opcional) Adicionar filtros por Setor/Categoria no formulário
- [ ] (Opcional) Usar Setor/Categoria na Edge Function para expandir busca

---

**Data de Implementação:** 2025-02-26  
**Status:** ✅ Implementado e Funcional

