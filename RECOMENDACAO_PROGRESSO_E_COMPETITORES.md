# 📊 RECOMENDAÇÃO: Barra de Progresso e Competidores

## 🎯 OBJETIVO

1. **Barra de Progresso TOTVS**: Mostrar as 70 fontes organizadas por categoria
2. **Competidores**: Aplicar mesma metodologia de matching com queries melhoradas

---

## 📋 ANÁLISE ATUAL

### BARRA DE PROGRESSO TOTVS (VerificationProgressBar.tsx)

**Estado Atual:**
- 8 fases hardcoded com contagens fixas
- Fases: job_portals (30), tech_news (26), premium_sources (47), etc.
- Não reflete as 70 fontes reais configuradas

**Problema:**
- Contagens não correspondem às fontes reais
- Não mostra evidências encontradas em tempo real
- Fases não correspondem exatamente às categorias de fontes

**Fases Reais no Backend (simple-totvs-check/index.ts):**
1. FASE 1: Portais de Vagas (4 portais: LinkedIn, Indeed, Gupy, LinkedIn Posts)
2. FASE 2: Cases Oficiais TOTVS (3 fontes: totvs.com/blog, totvs.com/cases, totvs.com/noticias)
3. FASE 3: Fontes Oficiais (10 fontes: CVM, B3, TJSP, etc.)
4. FASE 4: Notícias Premium (29 fontes: Valor, Exame, etc.)
5. FASE 4.5: Portais Tech (7 fontes: Baguete, CIO, etc.)
6. FASE 5: Vídeos (2 fontes: YouTube, Vimeo)
7. FASE 6: Redes Sociais (3 fontes: Instagram, Facebook, LinkedIn Posts)
8. FASE 7: Parceiros TOTVS (1 fonte: Fusion)
9. FASE 8: Google News (1 fonte)

**Total:** ~60 fontes (não 70, mas próximo)

---

### COMPETIDORES (discover-all-technologies/index.ts)

**Estado Atual:**
- 8 fases similares ao TOTVS Check
- Query atual: `site:${portal} "${companyName}" "${competitorName}"`
- **PROBLEMA:** Não inclui produtos do concorrente na query

**Fases Atuais:**
1. FASE 1: Portais de Vagas (4 portais)
2. FASE 2: Cases Oficiais do Concorrente (5 portais: Omie, Senior, Conta Azul, Bling, Sankhya)
3. FASE 3: Fontes Oficiais (10 fontes)
4. FASE 4: Notícias Premium (27 fontes)
5. FASE 4.5: Portais Tech (7 fontes)
6. FASE 5: Vídeos (2 fontes)
7. FASE 6: Redes Sociais (3 fontes)
8. FASE 8: Google News (1 fonte)

**15+ Concorrentes da COMPETITORS_MATRIX:**
- Omie, Senior, Conta Azul, Bling, Sankhya, vhsys, Tiny, GestãoClick, WebMais, Linx, RD Station, RD CRM, Pipedrive, Salesforce, HubSpot, etc.

---

## ✅ RECOMENDAÇÕES

### RECOMENDAÇÃO 1: Atualizar Barra de Progresso TOTVS

**Ação:**
1. Atualizar `VerificationProgressBar.tsx` para usar fases reais do backend
2. Adicionar contagem de evidências encontradas por fase
3. Sincronizar com as fases reais executadas no backend

**Fases Corretas:**
```typescript
const PHASES_TOTVS = [
  { id: 'job_portals', name: 'Portais de Vagas', count: 4, estimatedTime: 15 },
  { id: 'totvs_cases', name: 'Cases Oficiais TOTVS', count: 3, estimatedTime: 8 },
  { id: 'official_sources', name: 'Fontes Oficiais', count: 10, estimatedTime: 10 },
  { id: 'premium_news', name: 'Notícias Premium', count: 29, estimatedTime: 12 },
  { id: 'tech_portals', name: 'Portais Tech', count: 7, estimatedTime: 8 },
  { id: 'video_content', name: 'Vídeos', count: 2, estimatedTime: 5 },
  { id: 'social_media', name: 'Redes Sociais', count: 3, estimatedTime: 5 },
  { id: 'totvs_partners', name: 'Parceiros TOTVS', count: 1, estimatedTime: 3 },
  { id: 'google_news', name: 'Google News', count: 1, estimatedTime: 5 },
];
```

**Melhorias:**
- Mostrar evidências encontradas: "Portais de Vagas (4 fontes) - 3 evidências encontradas"
- Adicionar contador de evidências em tempo real (se backend enviar)

---

### RECOMENDAÇÃO 2: Aplicar Queries Melhoradas para Competidores

**Problema Atual:**
```typescript
// ❌ ATUAL (ERRADO):
const query = `site:${portal} "${companyName}" "${competitorName}"`;
```

**Solução:**
Criar função `generateQueryBySourceTypeForCompetitor()` similar à do TOTVS:

```typescript
function generateQueryBySourceTypeForCompetitor(
  sourceType: string,
  portal: string,
  companyName: string,
  competitorName: string,
  competitorProducts: string[] // Array de produtos do concorrente
): string {
  const produtosQuery = competitorProducts.join(' OR ');
  
  switch (sourceType) {
    case 'job_portals':
      // Buscar empresa + concorrente OU empresa + produtos do concorrente
      return `site:${portal} "${companyName}" ("${competitorName}" OR ${produtosQuery})`;
    
    case 'competitor_cases':
      // Buscar por "case" ou "cliente" no site do concorrente
      return `site:${portal} ("case" OR "cliente" OR "depoimento") "${companyName}"`;
    
    case 'premium_news':
      return `site:${portal} "${companyName}" ("${competitorName}" OR ${produtosQuery} OR "implementação" OR "migração")`;
    
    // ... outras categorias
  }
}
```

**Exemplo Real:**
- **Antes:** `site:linkedin.com/jobs "Tradimaq" "Omie"`
- **Depois:** `site:linkedin.com/jobs "Tradimaq" ("Omie" OR "Omie ERP" OR "Omie Flow")`

---

### RECOMENDAÇÃO 3: Atualizar Barra de Progresso Competidores

**Ação:**
1. Criar fases específicas para competidores
2. Mostrar progresso por concorrente (15+ concorrentes)
3. Mostrar evidências encontradas por concorrente

**Estrutura Proposta:**
```typescript
// Fases gerais (mesmas 8 do TOTVS)
const PHASES_COMPETITORS = [
  { id: 'job_portals', name: 'Portais de Vagas', count: 4 },
  { id: 'competitor_cases', name: 'Cases Concorrentes', count: 5 },
  { id: 'official_sources', name: 'Fontes Oficiais', count: 10 },
  { id: 'premium_news', name: 'Notícias Premium', count: 27 },
  { id: 'tech_portals', name: 'Portais Tech', count: 7 },
  { id: 'video_content', name: 'Vídeos', count: 2 },
  { id: 'social_media', name: 'Redes Sociais', count: 3 },
  { id: 'google_news', name: 'Google News', count: 1 },
];

// Progresso por concorrente (15+ concorrentes)
// Exibir: "Processando: Omie (1/15 concorrentes)"
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Atualizar Barra de Progresso TOTVS
**Tempo:** 1 hora

1. Atualizar `VerificationProgressBar.tsx` com fases reais
2. Sincronizar contagens com backend
3. Adicionar campo opcional para evidências encontradas

### FASE 2: Melhorar Queries de Competidores
**Tempo:** 2 horas

1. Criar `generateQueryBySourceTypeForCompetitor()`
2. Atualizar `searchMultiplePortalsForCompetitor()` para usar nova função
3. Passar produtos do concorrente nas chamadas
4. Testar com Omie, Senior, etc.

### FASE 3: Atualizar Barra de Progresso Competidores
**Tempo:** 1 hora

1. Atualizar `GenericProgressBar` na aba Competidores
2. Adicionar contador de concorrentes processados
3. Mostrar evidências encontradas por concorrente

---

## ❓ DECISÕES NECESSÁRIAS

1. **Barra de Progresso TOTVS:**
   - Mostrar evidências encontradas em tempo real? (requer backend enviar updates)
   - Ou apenas mostrar fases e contagens de fontes?

2. **Competidores:**
   - Processar todos os 15+ concorrentes em paralelo ou sequencial?
   - Mostrar progresso individual por concorrente ou apenas geral?

3. **Queries Competidores:**
   - Incluir TODOS os produtos do concorrente na query?
   - Ou apenas produtos principais?

---

## 📝 PRÓXIMOS PASSOS

**Aguardando aprovação para:**
1. ✅ Atualizar barra de progresso TOTVS com fases reais
2. ✅ Implementar queries melhoradas para competidores
3. ✅ Atualizar barra de progresso competidores

**Após aprovação, implementar na ordem:**
1. FASE 1 → FASE 2 → FASE 3

---

**STATUS:** ⏸️ AGUARDANDO APROVAÇÃO

