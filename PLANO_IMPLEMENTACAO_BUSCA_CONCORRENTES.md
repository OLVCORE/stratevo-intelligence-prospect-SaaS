# 🚀 PLANO DE IMPLEMENTAÇÃO: BUSCA DE CONCORRENTES
## Baseado nas Melhores Práticas: SEMrush, SimilarWeb, Ahrefs

---

## 📋 ANÁLISE DO ESTADO ATUAL

### ✅ **O que já temos:**
1. ✅ Edge Function `search-competitors-serper` usando SERPER API
2. ✅ Cálculo de similaridade semântica baseado em produtos
3. ✅ Filtros para excluir marketplaces, PDFs, reportagens
4. ✅ Classificação de tipo de negócio (empresa, vaga, artigo, etc.)
5. ✅ Rankeamento por produtos específicos encontrados
6. ✅ Edge Function `semantic-search` com embeddings (já existe!)

### ⚠️ **O que precisa melhorar:**
1. ❌ Não usa embeddings semânticos (OpenAI) para similaridade
2. ❌ Rankeamento baseado apenas em produtos (falta outros critérios)
3. ❌ Não classifica automaticamente por indústria
4. ❌ Queries muito específicas (AND) limitam resultados
5. ❌ Não considera autoridade/ranqueamento do site
6. ❌ Não há paginação/variação de resultados

---

## 🎯 FASE 1: MELHORIAS IMEDIATAS (Implementar Agora)

### **1.1. Adicionar Embeddings Semânticos**

**Objetivo:** Usar OpenAI Embeddings para calcular similaridade semântica real entre produtos e empresas.

**Implementação:**
```typescript
// 1. Gerar embedding dos produtos do tenant
const tenantProductsText = products.join(', ');
const tenantEmbedding = await generateEmbedding(tenantProductsText);

// 2. Para cada candidato encontrado, gerar embedding
const candidateText = `${result.title} ${result.snippet}`;
const candidateEmbedding = await generateEmbedding(candidateText);

// 3. Calcular similaridade de cosseno
const cosineSimilarity = calculateCosineSimilarity(tenantEmbedding, candidateEmbedding);

// 4. Usar no rankeamento (peso: 30%)
relevancia += cosineSimilarity * 30;
```

**Arquivo:** `supabase/functions/search-competitors-serper/index.ts`

---

### **1.2. Múltiplos Critérios de Rankeamento**

**Objetivo:** Combinar múltiplos sinais, não apenas produtos.

**Pesos Propostos (baseado em SEMrush/SimilarWeb):**
```typescript
const weights = {
  productMatches: 0.40,      // 40% - Produtos específicos encontrados
  semanticSimilarity: 0.30,   // 30% - Similaridade semântica (embeddings)
  industryMatch: 0.15,       // 15% - Classificação por indústria
  geographicMatch: 0.10,     // 10% - Localização geográfica
  domainAuthority: 0.05      // 5% - Autoridade/ranqueamento do site
};
```

**Implementação:**
- Adicionar função `calculateIndustryMatch()`
- Adicionar função `calculateGeographicMatch()`
- Adicionar função `calculateDomainAuthority()`
- Combinar todos os scores com pesos

---

### **1.3. Classificação Automática de Indústria**

**Objetivo:** Classificar empresas automaticamente por indústria usando OpenAI.

**Implementação:**
```typescript
async function classifyIndustry(title: string, snippet: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Classifique a empresa por indústria. Retorne JSON: {"industries": ["indústria1", "indústria2"]}'
      }, {
        role: 'user',
        content: `Título: ${title}\nDescrição: ${snippet}`
      }],
      temperature: 0.1
    })
  });
  // ... parse response
}
```

---

### **1.4. Queries Mais Inteligentes**

**Objetivo:** Usar OR em vez de AND para mais cobertura, mas manter qualidade.

**Estratégia:**
- Query 1: Produtos específicos com OR (cobertura ampla)
- Query 2: Indústria + produtos (combinação)
- Query 3: Produtos + termos de negócio (ex: "fornecedor", "soluções")
- Query 4: Variações de produtos (sinônimos)
- Query 5: Fallback genérico (se não houver produtos específicos)

---

### **1.5. Paginação e Variação de Resultados**

**Objetivo:** Permitir "Nova Busca" trazer resultados diferentes.

**Implementação:**
```typescript
// Adicionar parâmetro `page` na requisição
const page = body.page || 1;
const offset = (page - 1) * maxResults;

// Variação de queries baseada na página
const queryVariations = [
  `${products[0]} OR ${products[1]} OR ${products[2]}`,
  `${industry} ${products[0]} OR ${products[1]}`,
  `${products[0]} fornecedor OR soluções`,
  // ... mais variações
];

const query = queryVariations[(page - 1) % queryVariations.length];
```

---

## 🚀 FASE 2: MELHORIAS AVANÇADAS (Próximos Passos)

### **2.1. Análise de Conteúdo Estruturado**

- Extrair Schema.org dos sites
- Analisar meta tags e descrições
- Identificar palavras-chave principais

### **2.2. Machine Learning para Otimização**

- Treinar modelo para otimizar pesos
- Aprender com feedback dos usuários
- Ajustar automaticamente critérios

### **2.3. Cache Inteligente**

- Cachear resultados por 24h
- Invalidar cache quando produtos mudarem
- Permitir forçar refresh

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Implementar embeddings semânticos** (Fase 1.1)
2. ✅ **Adicionar múltiplos critérios** (Fase 1.2)
3. ✅ **Classificação automática de indústria** (Fase 1.3)
4. ✅ **Melhorar queries** (Fase 1.4)
5. ✅ **Implementar paginação** (Fase 1.5)

---

## 🎯 RESULTADO ESPERADO

Após implementar as melhorias:
- ✅ Mais empresas encontradas (queries mais amplas)
- ✅ Melhor qualidade (embeddings semânticos)
- ✅ Mais relevância (múltiplos critérios)
- ✅ Melhor classificação (indústria automática)
- ✅ Paginação funcional (resultados variados)

