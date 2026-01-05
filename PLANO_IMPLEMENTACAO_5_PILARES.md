# 🚀 Plano de Implementação: 5 Pilares da Prospecção Avançada

## 📋 Visão Geral

Implementação completa dos 5 pilares estratégicos para aumentar em **2-3x** o número de empresas encontradas e melhorar a qualidade dos resultados.

---

## 🎯 PILAR 1: Multi-Source Intelligence

### Objetivo
Reduzir dependência de uma única fonte (EmpresaQui) e aumentar cobertura para **2-3x mais empresas**.

### Fontes a Integrar

#### ⚠️ CORREÇÃO: APIs Removidas
- ❌ **BaseCNPJ** - Removido (redundante com BrasilAPI/ReceitaWS)
- ❌ **Consultar.IO** - Removido (foco em pessoa física, não busca em massa)
- ❌ **Oportunidados** - Removido (API não existe)

#### ✅ Fonte Principal: EmpresaQui
- **Já integrada e funcionando** ✅
- **Busca por CNAE, localização, porte** ✅
- **Dados cadastrais e financeiros** ✅
- **API completa para prospecção** ✅

#### 🔄 Fontes de Enriquecimento (já integradas):
- ✅ **BrasilAPI** - Dados cadastrais (CNPJ, CEP, NCM)
- ✅ **Apollo.io** - Decisores e contatos
- ✅ **Hunter.io** - E-mails
- ✅ **PhantomBuster** - LinkedIn

### Implementação

**Arquivo:** `supabase/functions/prospeccao-avancada-buscar/index.ts`

**Estrutura:**
```typescript
// Função principal: buscarViaEmpresaQui()
// 1. EmpresaQui (fonte principal - busca inicial)
// 2. BrasilAPI (enriquecimento cadastral)
// 3. Apollo.io (enriquecimento de decisores)
// 4. Hunter.io (enriquecimento de e-mails)
// 5. PhantomBuster (enriquecimento LinkedIn)
```

**Ordem de Prioridade:**
1. EmpresaQui (busca inicial - CNAE, localização, porte)
2. BrasilAPI (enriquecimento cadastral - já integrado)
3. Apollo.io (decisores - já integrado)
4. Hunter.io + PhantomBuster (contatos - já integrado)

---

## 🎯 PILAR 2: Scoring Inteligente

### Objetivo
Priorizar empresas mais relevantes e com melhor qualidade de dados.

### Score de Relevância (0-100)

#### Dados Básicos (30 pts)
- CNPJ válido e ativo: +15pts
- Razão social completa: +5pts
- Endereço completo (logradouro + cidade + UF): +10pts

#### Enriquecimento (40 pts)
- Site ativo: +10pts
- LinkedIn encontrado: +10pts
- Decisores encontrados: +15pts
- E-mails válidos: +5pts

#### Match com Filtros (30 pts)
- CNAE corresponde: +15pts
- Localização corresponde: +10pts
- Porte corresponde: +5pts

### Score de Qualidade (0-100)

#### Completude (40 pts)
- Todos os campos básicos: +20pts
- Dados de contato: +10pts
- Dados financeiros: +10pts

#### Atualização (30 pts)
- Dados recentes (<6 meses): +15pts
- Site atualizado: +10pts
- LinkedIn ativo: +5pts

#### Confiabilidade (30 pts)
- Múltiplas fontes confirmam: +15pts
- Dados validados: +10pts
- Sem inconsistências: +5pts

### Implementação

**Arquivo:** `supabase/functions/prospeccao-avancada-buscar/index.ts`

**Funções:**
- `calculateRelevanciaScore()` - Score de relevância (0-100)
- `calculateQualidadeScore()` - Score de qualidade (0-100)
- `calculateScoreTotal()` - Combinação dos dois scores

**Ordenação:**
- Ordenar por `score_total` DESC
- Empresas com score >70 aparecem primeiro

---

## 🎯 PILAR 3: Validação e Filtragem Avançada

### Objetivo
Garantir apenas empresas reais, ativas e relevantes.

### Validações

#### 1. Situação Cadastral
- ✅ Apenas empresas com situação 'ATIVA' ou 'ATIVO'
- ✅ Código situação = '2' (ATIVA na Receita Federal)
- ❌ Rejeitar: BAIXADA, SUSPENSA, INAPTA

#### 2. Atividade Real
- ✅ Site ativo (HTTP 200, tempo resposta <5s)
- ✅ LinkedIn atualizado (posts nos últimos 6 meses)
- ✅ E-mail válido (MX records ativos)
- ❌ Rejeitar: Site inacessível, LinkedIn inativo, e-mail inválido

#### 3. Filtragem por CNAE
- ✅ Usar Setor/Categoria da tabela `cnae_classifications`
- ✅ Buscar CNAEs por Setor (ex: "Tecnologia da Informação")
- ✅ Buscar CNAEs por Categoria (ex: "Serviços")
- ✅ Buscar CNAEs por Setor + Categoria

### Implementação

**Arquivo:** `supabase/functions/prospeccao-avancada-buscar/index.ts`

**Funções:**
- `validarSituacaoCadastral()` - Verificar situação na Receita Federal
- `validarAtividadeReal()` - Verificar site, LinkedIn, e-mail
- `filtrarPorCNAE()` - Usar `cnae_classifications` para buscar CNAEs

---

## 🎯 PILAR 4: Enriquecimento Multi-Camada

### Objetivo
Garantir **80%+ de empresas com dados completos**.

### 5 Camadas de Enriquecimento

#### Camada 1: Dados Cadastrais (Obrigatório)
- ✅ CNPJ, Razão Social, Nome Fantasia
- ✅ Endereço completo (logradouro, número, complemento, bairro, cidade, UF, CEP)
- ✅ Situação cadastral
- ✅ Natureza jurídica
- ✅ Data de abertura
- ✅ Capital social
- **Fonte:** BrasilAPI V2, ReceitaWS

#### Camada 2: Dados Digitais
- ✅ Site (URL completa, status, tempo resposta)
- ✅ LinkedIn (URL, seguidores, atividade)
- ✅ E-mails corporativos (validação MX)
- ✅ Redes sociais (Facebook, Instagram, Twitter)
- **Fonte:** PhantomBuster, Hunter.io, Web Scraping

#### Camada 3: Decisores e Contatos
- ✅ Decisores (nome, cargo, LinkedIn, e-mail)
- ✅ Contatos principais (telefone, e-mail)
- ✅ Estrutura organizacional
- **Fonte:** Apollo, PhantomBuster

#### Camada 4: Dados Financeiros
- ✅ Faturamento estimado
- ✅ Número de funcionários
- ✅ Capital social
- ✅ Indicadores financeiros (se disponível)
- **Fonte:** Apollo, EmpresaQui, BrasilAPI

#### Camada 5: Dados Contextuais
- ✅ Tech stack (tecnologias usadas)
- ✅ Marketplaces (onde vende)
- ✅ Certificações
- ✅ Notícias recentes
- **Fonte:** Web Scraping, APIs especializadas

### Implementação

**Arquivo:** `supabase/functions/prospeccao-avancada-buscar/index.ts`

**Estrutura:**
```typescript
async function enriquecerMultiCamada(empresa: any) {
  // Camada 1: Dados Cadastrais (sempre primeiro)
  const camada1 = await buscarDadosCadastrais(empresa.cnpj);
  
  // Camada 2: Dados Digitais (paralelo)
  const camada2 = await Promise.all([
    buscarSite(empresa),
    buscarLinkedIn(empresa),
    buscarEmails(empresa)
  ]);
  
  // Camada 3: Decisores (se tiver site/LinkedIn)
  const camada3 = camada2.site ? await buscarDecisores(empresa) : null;
  
  // Camada 4: Dados Financeiros (paralelo)
  const camada4 = await Promise.all([
    buscarFaturamento(empresa),
    buscarFuncionarios(empresa)
  ]);
  
  // Camada 5: Dados Contextuais (opcional, mais lento)
  const camada5 = await buscarDadosContextuais(empresa);
  
  return mergeCamadas(camada1, camada2, camada3, camada4, camada5);
}
```

---

## 🎯 PILAR 5: Otimização de Performance

### Objetivo
Busca **3x mais rápida** com melhor uso de recursos.

### Estratégias

#### 1. Batching
- Processar empresas em lotes de 10-20
- Usar `Promise.allSettled()` para paralelismo
- Limite de concorrência: 5 requisições simultâneas

#### 2. Cache
- Cache de 7 dias para dados cadastrais (CNPJ)
- Cache de 1 dia para dados digitais (site, LinkedIn)
- Cache de 30 dias para dados financeiros (faturamento)
- **Tabela:** `prospects_cache` no Supabase

#### 3. Priorização de Fontes
- Tentar fontes mais rápidas primeiro
- Ordem: BrasilAPI → EmpresaQui → BaseCNPJ → Consultar.IO
- Timeout de 5s por fonte
- Se uma fonte falhar, tentar próxima

### Implementação

**Arquivo:** `supabase/functions/prospeccao-avancada-buscar/index.ts`

**Funções:**
- `processarEmLotes()` - Batching de empresas
- `buscarComCache()` - Cache inteligente
- `buscarComPriorizacao()` - Tentar fontes mais rápidas primeiro

**Tabela de Cache:**
```sql
CREATE TABLE prospects_cache (
  id UUID PRIMARY KEY,
  cnpj TEXT UNIQUE,
  data_cadastral JSONB,
  data_digital JSONB,
  data_financeiro JSONB,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

---

## 📅 Cronograma de Implementação

### Fase 1: Fundação (JÁ FEITO ✅)
- ✅ Expandir BrasilAPI (CNPJ V2, CEP V2, NCM)
- ✅ Implementar scoring básico
- ✅ Validação de situação cadastral
- ✅ Filtragem por CNAE usando Setor/Categoria

### Fase 2: Multi-Source (PRÓXIMO)
- ⏳ Integrar BaseCNPJ/PesquisaEmpresas
- ⏳ Integrar Consultar.IO
- ⏳ Integrar Oportunidados
- ⏳ Sistema de merge e deduplicação

### Fase 3: Scoring Avançado
- ⏳ Score de Relevância completo
- ⏳ Score de Qualidade completo
- ⏳ Ordenação por score total

### Fase 4: Enriquecimento Multi-Camada
- ⏳ Implementar 5 camadas
- ⏳ Processamento paralelo
- ⏳ Merge inteligente de dados

### Fase 5: Performance
- ⏳ Sistema de cache
- ⏳ Batching otimizado
- ⏳ Priorização de fontes

---

## 🎯 Resultados Esperados

### Antes (Situação Atual)
- **Fonte única:** EmpresaQui
- **Empresas encontradas:** 0-50 por busca
- **Dados completos:** 30-40%
- **Tempo médio:** 30-60s

### Depois (Com 5 Pilares)
- **Múltiplas fontes:** 4 fontes combinadas
- **Empresas encontradas:** 100-200 por busca (2-3x mais)
- **Dados completos:** 80%+
- **Tempo médio:** 20-40s (mais rápido mesmo com mais dados)

---

## 📝 Notas de Implementação

1. **Manter compatibilidade:** Não quebrar funcionalidades existentes
2. **Logs detalhados:** Facilitar diagnóstico
3. **Tratamento de erros:** Graceful degradation (se uma fonte falhar, continuar com outras)
4. **Testes incrementais:** Testar cada pilar separadamente antes de integrar

