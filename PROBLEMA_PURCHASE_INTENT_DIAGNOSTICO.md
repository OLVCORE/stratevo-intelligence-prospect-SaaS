# 🔍 DIAGNÓSTICO: Sistema de Purchase Intent Não Funciona

## ❌ PROBLEMA IDENTIFICADO

Quando você clica no botão "Calcular Intenção de Compra", **nada acontece** porque:

### 1. A Função Apenas CALCULA, NÃO DETECTA

A função `calculate_purchase_intent_score` apenas:
- ✅ **LÊ** sinais da tabela `purchase_intent_signals`
- ✅ **CALCULA** um score (0-100) baseado nos sinais
- ❌ **NÃO FAZ** varredura de dados
- ❌ **NÃO CHAMA** APIs externas (Serper, Google News, etc.)
- ❌ **NÃO DETECTA** sinais automaticamente

### 2. Tabela `purchase_intent_signals` Está VAZIA

A função calcula baseado em sinais que já existem na tabela `purchase_intent_signals`, mas:
- A tabela está **vazia** (nenhum sinal foi inserido)
- Não há processo automatizado que popule essa tabela
- Por isso o score sempre retorna **0**

### 3. DESENCONTRO de Tabelas

Existem **DUAS tabelas diferentes** que não estão conectadas:

#### Tabela 1: `intent_signals` (ANTIGA)
- ✅ Populada pela Edge Function `detect-intent-signals`
- ✅ Usa APIs: **Serper API**, Google News
- ✅ Detecta: vagas, notícias, crescimento, LinkedIn
- ❌ **NÃO** é usada pela função `calculate_purchase_intent_score`

#### Tabela 2: `purchase_intent_signals` (NOVA)
- ✅ Usada pela função `calculate_purchase_intent_score`
- ❌ **VAZIA** - nenhum processo popula ela
- ❌ Não está conectada com `detect-intent-signals`

## 📊 COMO DEVERIA FUNCIONAR

### Fluxo Ideal:

```
1. DETECTAR Sinais
   ↓
   Edge Function detecta sinais usando:
   - Serper API (busca Google)
   - Google News API
   - LinkedIn Jobs
   - Análise de notícias
   
2. SALVAR Sinais na tabela purchase_intent_signals
   ↓
   Inserir sinais com:
   - signal_type (expansion, pain, budget, timing, competitor)
   - signal_category (potencial ou real)
   - signal_strength (0-100)
   - signal_source (news, job_postings, funding, etc.)
   
3. CALCULAR Score
   ↓
   Função calculate_purchase_intent_score:
   - Lê sinais da tabela purchase_intent_signals
   - Aplica pesos diferentes por tipo de sinal
   - Calcula score final (0-100)
   
4. ATUALIZAR Prospect
   ↓
   Atualizar coluna purchase_intent_score em qualified_prospects
```

## 🔧 O QUE ESTÁ FALTANDO

### 1. Edge Function para Popular `purchase_intent_signals`

Precisa criar uma Edge Function que:
- ✅ Detecte sinais usando Serper API, Google News, etc.
- ✅ Insira sinais na tabela `purchase_intent_signals` (não em `intent_signals`)
- ✅ Mapeie sinais para os tipos corretos:
  - `expansion` - expansão, crescimento, IPO
  - `pain` - problemas, dificuldades
  - `budget` - investimentos, funding
  - `timing` - timing de compra
  - `competitor` - menções de concorrentes
- ✅ Defina `signal_category` como `potencial` (sinais de mercado)

### 2. Integração com o Botão

O botão precisa:
1. Primeiro chamar a Edge Function para **DETECTAR e SALVAR** sinais
2. Depois chamar a função RPC para **CALCULAR** o score

### 3. Processo Automatizado (Opcional)

Para automatizar:
- Trigger quando prospect é criado
- Job agendado para detectar sinais periodicamente
- Webhook para detectar sinais comportamentais (visitas, downloads)

## ✅ SOLUÇÃO PROPOSTA

### Opção 1: Criar Edge Function Nova (Recomendado)

Criar `detect-purchase-intent-signals` que:
- Detecta sinais usando Serper API
- Salva em `purchase_intent_signals` (não em `intent_signals`)
- Mapeia corretamente os tipos de sinais

### Opção 2: Adaptar Edge Function Existente

Modificar `detect-intent-signals` para também salvar em `purchase_intent_signals`

### Opção 3: Migrar Dados

Migrar sinais de `intent_signals` para `purchase_intent_signals` e adaptar estrutura

## 🎯 PRÓXIMOS PASSOS

1. ✅ Verificar se tabela `purchase_intent_signals` existe
2. ✅ Verificar se função `calculate_purchase_intent_score` funciona
3. ❌ Criar Edge Function para popular `purchase_intent_signals`
4. ❌ Integrar detecção de sinais com botão de cálculo
5. ❌ Testar fluxo completo

## 📝 NOTAS TÉCNICAS

### APIs Necessárias:
- **Serper API** (`SERPER_API_KEY`) - busca Google, notícias
- **Google API** (opcional) - busca customizada
- **LinkedIn API** (opcional) - vagas, atividade

### Critérios de Detecção:

**Sinais Potenciais (Mercado):**
- Expansão: contratações, crescimento, IPO
- Budget: investimentos, funding, orçamento
- Timing: mudanças recentes, eventos
- Competitor: menções de concorrentes
- Pain: problemas, dificuldades (menos comum)

**Sinais Reais (Comportamentais):**
- Visitas ao site
- Downloads de materiais
- Emails abertos
- Demos agendadas
- Engajamento em conteúdo

### Pesos de Cálculo:

**Score Potencial:**
- Expansion: 30%
- Pain: 25%
- Budget: 20%
- Timing: 15%
- Competitor: 10%

**Score Real:**
- Behavioral: 60%
- Expansion: 15%
- Pain: 10%
- Budget: 10%
- Timing: 5%

