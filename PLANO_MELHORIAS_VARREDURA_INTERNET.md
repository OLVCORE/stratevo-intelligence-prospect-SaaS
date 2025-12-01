# 🎯 PLANO CIRÚRGICO: MELHORIAS DE VARREDURA NA INTERNET
## Aplicação Universal para TODOS os Tenants e Concorrentes

---

## ✅ CONFIRMAÇÃO INICIAL

**SIM, as métricas estabelecidas servem para:**
- ✅ Qualquer tenant (empresa cliente)
- ✅ Qualquer concorrente
- ✅ Qualquer URL analisada
- ✅ Qualquer busca na internet

**Padrão Universal Aplicado:**
1. **Homepage First**: Sempre acessar homepage primeiro (onde há produtos/serviços em destaque)
2. **SERPER Ampliado**: Busca com palavras-chave expandidas e mais resultados
3. **Subpáginas Inteligentes**: Testar múltiplas variações de URLs comuns
4. **User-Agent Real**: Simular navegador real para evitar bloqueios
5. **Limites Aumentados**: Mais caracteres extraídos (15k homepage, 10k subpáginas)
6. **Prompts Específicos**: IA focada em produtos industriais, EPIs, serviços especializados

---

## 📊 FUNCTIONS IDENTIFICADAS PARA MELHORIA

### 🔴 **CATEGORIA 1: EXTRAÇÃO DE PRODUTOS** (2 functions)
**Status:** ✅ JÁ MELHORADAS
- `scan-website-products` ✅
- `scan-competitor-url` ✅

---

### 🟠 **CATEGORIA 2: BUSCA WEB GENÉRICA** (2 functions)
**Status:** ⚠️ PRECISAM MELHORIAS

#### 2.1. `web-search`
**Problemas Identificados:**
- ❌ Não acessa URLs retornadas (apenas retorna snippets)
- ❌ Não faz varredura de subpáginas
- ❌ Limite padrão muito baixo (10 resultados)
- ❌ Não extrai conteúdo completo das páginas

**Melhorias Propostas:**
1. ✅ Aumentar limite padrão de 10 para 20 resultados
2. ✅ Adicionar opção para acessar homepage dos resultados
3. ✅ Extrair conteúdo completo das top 5 URLs
4. ✅ Adicionar palavras-chave contextuais à query
5. ✅ Melhorar User-Agent

#### 2.2. `serper-search`
**Problemas Identificados:**
- ❌ Apenas retorna resultados do SERPER (sem acesso direto)
- ❌ Não faz varredura de subpáginas
- ❌ Não extrai conteúdo completo

**Melhorias Propostas:**
1. ✅ Adicionar opção para acessar URLs retornadas
2. ✅ Extrair conteúdo completo das top 5 URLs
3. ✅ Adicionar varredura de subpáginas comuns
4. ✅ Melhorar User-Agent

---

### 🟡 **CATEGORIA 3: ANÁLISE PROFUNDA DE URLs** (2 functions)
**Status:** ⚠️ PRECISAM MELHORIAS

#### 3.1. `analyze-urls-deep`
**Problemas Identificados:**
- ⚠️ Limite de 500 caracteres muito baixo (deveria ser 10k-15k)
- ⚠️ User-Agent muito simples ("Mozilla/5.0")
- ⚠️ Não acessa homepage primeiro
- ⚠️ Não faz varredura de subpáginas

**Melhorias Propostas:**
1. ✅ Aumentar limite de extração de 500 para 15.000 caracteres
2. ✅ Melhorar User-Agent para navegador real
3. ✅ Priorizar homepage se URL for domínio raiz
4. ✅ Adicionar varredura de subpáginas comuns
5. ✅ Adicionar retry logic para URLs que falham

#### 3.2. `digital-intelligence-analysis`
**Problemas Identificados:**
- ⚠️ Não detalha como busca URLs (precisa verificar implementação)
- ⚠️ Pode não estar acessando homepage primeiro
- ⚠️ Pode não estar varrendo subpáginas

**Melhorias Propostas:**
1. ✅ Garantir acesso à homepage primeiro
2. ✅ Adicionar varredura de subpáginas comuns
3. ✅ Aumentar limite de caracteres extraídos
4. ✅ Melhorar User-Agent

---

### 🟢 **CATEGORIA 4: BUSCA DE CONCORRENTES** (1 function)
**Status:** ⚠️ PRECISA MELHORIAS

#### 4.1. `search-competitors-web`
**Problemas Identificados:**
- ⚠️ Busca apenas em portais de comparação
- ⚠️ Não acessa websites dos concorrentes diretamente
- ⚠️ Não extrai produtos/serviços dos concorrentes
- ⚠️ Limite de 10 resultados por query

**Melhorias Propostas:**
1. ✅ Adicionar busca direta nos websites dos concorrentes
2. ✅ Acessar homepage de cada concorrente encontrado
3. ✅ Extrair produtos/serviços usando mesmo padrão de `scan-competitor-url`
4. ✅ Aumentar limite de resultados
5. ✅ Adicionar varredura de subpáginas

---

### 🔵 **CATEGORIA 5: ENRIQUECIMENTO 360°** (1 function)
**Status:** ⚠️ PRECISA MELHORIAS

#### 5.1. `enrich-company-360`
**Problemas Identificados:**
- ⚠️ Função muito grande (1000+ linhas)
- ⚠️ Pode não estar acessando homepage primeiro
- ⚠️ Pode não estar varrendo subpáginas
- ⚠️ Preciso verificar implementação de web scraping

**Melhorias Propostas:**
1. ✅ Verificar se acessa homepage primeiro
2. ✅ Adicionar varredura de subpáginas se não tiver
3. ✅ Aumentar limites de extração
4. ✅ Melhorar User-Agent

---

### 🟣 **CATEGORIA 6: GERAÇÃO DE RELATÓRIOS ICP** (2 functions)
**Status:** ⚠️ PRECISAM MELHORIAS

#### 6.1. `generate-icp-report`
**Problemas Identificados:**
- ⚠️ Usa SERPER mas não acessa URLs retornadas
- ⚠️ Não extrai conteúdo completo
- ⚠️ Não varre subpáginas do website do tenant

**Melhorias Propostas:**
1. ✅ Acessar homepage do tenant se tiver website
2. ✅ Extrair conteúdo completo (15k caracteres)
3. ✅ Varrer subpáginas comuns do tenant
4. ✅ Melhorar User-Agent

#### 6.2. `analyze-onboarding-icp`
**Problemas Identificados:**
- ⚠️ Usa SERPER mas não acessa URLs retornadas
- ⚠️ Não extrai conteúdo completo
- ⚠️ Não varre subpáginas

**Melhorias Propostas:**
1. ✅ Acessar URLs retornadas pelo SERPER
2. ✅ Extrair conteúdo completo (15k caracteres)
3. ✅ Adicionar varredura de subpáginas
4. ✅ Melhorar User-Agent

---

## 🛠️ PADRÃO DE MELHORIAS UNIVERSAL

### **Template de Melhorias para TODAS as Functions:**

```typescript
// 1. SEMPRE ACESSAR HOMEPAGE PRIMEIRO
const baseUrl = url.startsWith('http') ? url : `https://${url}`;
const homepageResponse = await fetch(baseUrl, {
  headers: { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
  },
});

// 2. EXTRAIR CONTEÚDO COMPLETO (15k caracteres)
const textContent = html
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .substring(0, 15000);

// 3. VARRER SUBPÁGINAS COMUNS
const commonPages = [
  '/produtos', '/servicos', '/solucoes', '/catalogo',
  '/products', '/services', '/linha-produtos', '/nossos-produtos'
];

// 4. SERPER COM PALAVRAS-CHAVE EXPANDIDAS
q: `site:${domain} (produtos OR serviços OR catálogo OR soluções OR linha OR equipamentos OR EPI OR produtos em destaque)`

// 5. LIMITES AUMENTADOS
num: 15, // Aumentado de 10 para 15
max_tokens: 6000, // Aumentado de 4000 para 6000
temperature: 0.2, // Reduzido de 0.3 para 0.2 (mais preciso)
```

---

## 📋 PLANO DE EXECUÇÃO POR PRIORIDADE

### **FASE 1: CRÍTICO** (Impacto Alto, Esforço Baixo)
1. ✅ `scan-website-products` - **CONCLUÍDO**
2. ✅ `scan-competitor-url` - **CONCLUÍDO**
3. 🔄 `web-search` - Adicionar acesso a URLs e extração completa
4. 🔄 `serper-search` - Adicionar acesso a URLs e extração completa

### **FASE 2: ALTA PRIORIDADE** (Impacto Alto, Esforço Médio)
5. 🔄 `analyze-urls-deep` - Aumentar limites e melhorar varredura
6. 🔄 `digital-intelligence-analysis` - Garantir homepage first e subpáginas
7. 🔄 `search-competitors-web` - Adicionar acesso direto a websites

### **FASE 3: MÉDIA PRIORIDADE** (Impacto Médio, Esforço Médio)
8. 🔄 `generate-icp-report` - Melhorar extração de conteúdo
9. 🔄 `analyze-onboarding-icp` - Melhorar extração de conteúdo
10. 🔄 `enrich-company-360` - Verificar e melhorar web scraping

---

## 🎯 MÉTRICAS DE SUCESSO

**Antes das Melhorias:**
- ❌ Homepage não acessada: 0% de cobertura
- ❌ Subpáginas não varridas: 0% de cobertura
- ❌ Limite de caracteres: 500-5.000
- ❌ Produtos encontrados: 0-2 por site

**Depois das Melhorias:**
- ✅ Homepage sempre acessada: 100% de cobertura
- ✅ Subpáginas varridas: 8-10 páginas comuns testadas
- ✅ Limite de caracteres: 15.000 (homepage) + 10.000 (subpáginas)
- ✅ Produtos encontrados: 5-20+ por site (dependendo do site)

---

## ⚠️ RISCOS E MITIGAÇÕES

**Risco 1: Rate Limiting**
- **Mitigação:** Adicionar delays entre requisições (500ms-1s)
- **Mitigação:** Implementar retry logic com backoff exponencial

**Risco 2: Timeout em URLs Lentas**
- **Mitigação:** Timeout de 10s por URL
- **Mitigação:** Processar em paralelo com limite de 5-10 simultâneas

**Risco 3: Bloqueio por User-Agent**
- **Mitigação:** User-Agent real e rotativo
- **Mitigação:** Adicionar headers adicionais (Accept, Accept-Language)

**Risco 4: Custo de API (OpenAI/SERPER)**
- **Mitigação:** Cache de resultados por 24h
- **Mitigação:** Processar apenas top 5-10 URLs mais relevantes

---

## ✅ CHECKLIST DE VALIDAÇÃO

Para cada function melhorada, validar:
- [ ] Homepage é acessada primeiro
- [ ] Subpáginas comuns são varridas (8-10 páginas)
- [ ] Limite de caracteres é 15k (homepage) e 10k (subpáginas)
- [ ] User-Agent é real e completo
- [ ] SERPER usa palavras-chave expandidas
- [ ] Limites de resultados aumentados (15+)
- [ ] Retry logic implementado
- [ ] Timeout configurado (10s)
- [ ] Erros são tratados graciosamente

---

## 🚀 PRÓXIMOS PASSOS

1. **Aprovação do Plano** - Aguardar confirmação do usuário
2. **Implementação Fase 1** - Começar pelas functions críticas
3. **Testes** - Validar com sites reais (ex: uniluvas.com.br)
4. **Deploy** - Fazer deploy gradual por function
5. **Monitoramento** - Acompanhar métricas de sucesso

---

**Data de Criação:** 2025-01-30
**Última Atualização:** 2025-01-30
**Status:** ⏳ Aguardando Aprovação

