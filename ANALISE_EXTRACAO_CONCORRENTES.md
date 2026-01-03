# 📊 ANÁLISE: Extração de Produtos para Concorrentes

## 🔍 SITUAÇÃO ATUAL

### **Extração Individual (Concorrentes)**
- **Edge Function:** `scan-competitor-url`
- **Status:** ⚠️ BÁSICA - Limitada
- **Uso:** Botão "Extrair Produtos" individual para cada concorrente

### **Extração em Massa (Concorrentes)**
- **Edge Function:** `scan-competitor-url` (mesma função, processada em lotes de 5)
- **Status:** ⚠️ MUITO MOROSA - Processa sequencialmente
- **Uso:** Botão "Extrair Produtos em Massa" (tenant + todos concorrentes)

---

## 📋 COMPARAÇÃO: `scan-competitor-url` vs `scan-website-products`

### ✅ **scan-website-products** (MELHORADA - para tenants)

| Recurso | Implementação |
|---------|---------------|
| **Sitemap.xml** | ✅ Busca em 3 caminhos (`/sitemap.xml`, `/sitemap_index.xml`, `/sitemap1.xml`) |
| **Limite Sitemap** | ✅ Até **200 URLs** do sitemap processadas |
| **SERPER Queries** | ✅ **6 queries** diferentes para máxima cobertura |
| **SERPER num** | ✅ **50 resultados** por query (máximo do SERPER) |
| **Schema.org/JSON-LD** | ✅ Extrai dados estruturados (Product, ItemList) |
| **Menu Links** | ✅ Extrai links do menu de navegação |
| **Image Alt Text** | ✅ Extrai alt text de imagens com produtos |
| **Paginação** | ✅ Detecta e processa até **10 páginas** de paginação |
| **Homepage Content** | ✅ Até **20.000 caracteres** (era 15.000) |
| **OpenAI max_tokens** | ✅ **8.000 tokens** (era 6.000) |
| **Páginas Comuns** | ✅ 8+ caminhos comuns (`/produtos`, `/servicos`, etc.) |

### ❌ **scan-competitor-url** (ATUAL - para concorrentes)

| Recurso | Implementação |
|---------|---------------|
| **Sitemap.xml** | ❌ **NÃO IMPLEMENTADO** |
| **Limite Sitemap** | ❌ N/A |
| **SERPER Queries** | ❌ Apenas **1 query** simples |
| **SERPER num** | ❌ Apenas **15 resultados** (muito limitado) |
| **Schema.org/JSON-LD** | ❌ **NÃO IMPLEMENTADO** |
| **Menu Links** | ❌ **NÃO IMPLEMENTADO** |
| **Image Alt Text** | ❌ **NÃO IMPLEMENTADO** |
| **Paginação** | ❌ **NÃO IMPLEMENTADO** |
| **Homepage Content** | ⚠️ Apenas **15.000 caracteres** |
| **OpenAI max_tokens** | ⚠️ Apenas **6.000 tokens** |
| **Páginas Comuns** | ⚠️ 8 caminhos (similar ao tenant) |

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 1. **Extração Individual (Lenta e Limitada)**
- ❌ Não busca sitemap (perde muitas URLs de produtos)
- ❌ Apenas 1 query SERPER com 15 resultados (muito pouco)
- ❌ Não detecta paginação (perde produtos em páginas 2, 3, etc.)
- ❌ Não extrai Schema.org (perde dados estruturados)
- ❌ Não extrai links do menu (perde categorias)
- ❌ Não extrai alt text de imagens (perde nomes de produtos)

### 2. **Extração em Massa (MUITO MOROSA)**
- ❌ Processa em lotes de 5 (sequencial)
- ❌ Cada concorrente leva muito tempo (falta de recursos acima)
- ❌ Não há paralelização eficiente
- ❌ Timeout de 15s por homepage pode ser insuficiente para sites grandes

---

## 🚀 MELHORIAS PROPOSTAS

### **FASE 1: Alinhar `scan-competitor-url` com `scan-website-products`**

#### 1.1. **Adicionar Busca de Sitemap**
```typescript
// Buscar sitemap.xml (igual ao tenant)
- Buscar em 3 caminhos: /sitemap.xml, /sitemap_index.xml, /sitemap1.xml
- Processar até 200 URLs do sitemap (igual ao tenant)
- Filtrar URLs de produtos (produto, categoria, catálogo, etc.)
```

#### 1.2. **Melhorar SERPER**
```typescript
// Múltiplas queries SERPER (igual ao tenant)
- 6 queries diferentes para máxima cobertura
- num: 50 (máximo do SERPER, era 15)
- Queries: produtos, serviços, catálogo, linha, equipamentos, EPI
```

#### 1.3. **Adicionar Extração de Schema.org/JSON-LD**
```typescript
// Extrair dados estruturados (igual ao tenant)
- Buscar <script type="application/ld+json">
- Extrair Product, ItemList, Organization
- Usar dados estruturados no prompt da OpenAI
```

#### 1.4. **Adicionar Extração de Menu Links**
```typescript
// Extrair links do menu (igual ao tenant)
- Buscar <nav>, <ul class="menu">
- Filtrar links de produtos/categorias
- Processar até 20 links do menu
```

#### 1.5. **Adicionar Extração de Alt Text**
```typescript
// Extrair alt text de imagens (igual ao tenant)
- Buscar <img alt="...">
- Filtrar imagens com palavras-chave de produtos
- Usar alt text no prompt da OpenAI
```

#### 1.6. **Adicionar Detecção de Paginação**
```typescript
// Detectar e processar paginação (igual ao tenant)
- Padrões: /page/2, ?page=2, /p/2, etc.
- Processar até 10 páginas (igual ao tenant)
- Evitar loops infinitos
```

#### 1.7. **Aumentar Limites**
```typescript
// Aumentar limites (igual ao tenant)
- Homepage: 20.000 caracteres (era 15.000)
- OpenAI max_tokens: 8.000 (era 6.000)
- Sitemap: 200 URLs (era 0)
```

### **FASE 2: Otimizar Extração em Massa**

#### 2.1. **Paralelização Inteligente**
```typescript
// Processar mais concorrentes em paralelo
- Aumentar batchSize de 5 para 10-15
- Usar Promise.allSettled para não bloquear em erros
- Adicionar retry automático para falhas temporárias
```

#### 2.2. **Progresso em Tempo Real**
```typescript
// Melhorar feedback visual
- Mostrar progresso detalhado (X/Y concluídos)
- Mostrar tempo estimado restante
- Mostrar produtos encontrados por concorrente
```

#### 2.3. **Cache de Resultados**
```typescript
// Evitar re-extração desnecessária
- Verificar se URL já foi extraída recentemente (últimas 24h)
- Pular URLs já processadas
- Permitir forçar re-extração se necessário
```

---

## 📊 IMPACTO ESPERADO

### **Antes (Atual)**
- ⏱️ **Extração Individual:** ~30-60 segundos por concorrente
- ⏱️ **Extração em Massa (15 concorrentes):** ~10-15 minutos
- 📦 **Produtos Encontrados:** 5-20 produtos por concorrente (limitado)

### **Depois (Melhorado)**
- ⏱️ **Extração Individual:** ~60-120 segundos por concorrente (mais completo)
- ⏱️ **Extração em Massa (15 concorrentes):** ~5-8 minutos (paralelizado)
- 📦 **Produtos Encontrados:** 20-100+ produtos por concorrente (muito mais completo)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **scan-competitor-url/index.ts**
- [ ] Adicionar busca de sitemap.xml (3 caminhos)
- [ ] Processar até 200 URLs do sitemap
- [ ] Adicionar 6 queries SERPER (num: 50 cada)
- [ ] Extrair Schema.org/JSON-LD
- [ ] Extrair links do menu de navegação
- [ ] Extrair alt text de imagens
- [ ] Detectar e processar paginação (até 10 páginas)
- [ ] Aumentar homepage content para 20.000 caracteres
- [ ] Aumentar OpenAI max_tokens para 8.000
- [ ] Melhorar prompt da OpenAI (incluir Schema.org, alt text, menu links)

### **Step1DadosBasicos.tsx (Extração em Massa)**
- [ ] Aumentar batchSize de 5 para 10-15
- [ ] Adicionar retry automático para falhas temporárias
- [ ] Melhorar feedback de progresso (tempo estimado, produtos encontrados)
- [ ] Adicionar cache de URLs já processadas (opcional)

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar esta análise** com o usuário
2. **Confirmar melhorias** a serem implementadas
3. **Implementar FASE 1** (alinhar com scan-website-products)
4. **Testar extração individual** melhorada
5. **Implementar FASE 2** (otimizar extração em massa)
6. **Testar extração em massa** otimizada
7. **Deploy e validação** final

---

## 📝 NOTAS TÉCNICAS

- **Compatibilidade:** Manter compatibilidade com Instagram, LinkedIn, Facebook
- **Performance:** Balancear profundidade vs velocidade
- **Custos:** Mais queries SERPER = mais custo (mas melhor cobertura)
- **Rate Limits:** Respeitar rate limits do SERPER e OpenAI

