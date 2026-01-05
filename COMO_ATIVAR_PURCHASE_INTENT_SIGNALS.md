# 🚀 COMO ATIVAR A TABELA purchase_intent_signals

## ✅ O QUE FOI FEITO

Adicionei a função `insert_purchase_intent_signal` ao SQL consolidado `ATIVAR_PURCHASE_INTENT_COMPLETO.sql`.

## 📋 O QUE É A FUNÇÃO `insert_purchase_intent_signal`

Esta função **INSERE sinais** na tabela `purchase_intent_signals`. Ela é o **mecanismo que POPULA a tabela**.

### Parâmetros:
- `p_tenant_id` - ID do tenant
- `p_cnpj` - CNPJ da empresa
- `p_company_id` - ID da empresa (opcional)
- `p_signal_type` - Tipo de sinal: 'expansion', 'pain', 'budget', 'timing', 'competitor'
- `p_signal_source` - Fonte: 'news', 'job_postings', 'funding', 'website', 'social'
- `p_signal_description` - Descrição do sinal
- `p_signal_strength` - Força do sinal (0-100)
- `p_signal_date` - Data do sinal
- `p_raw_data` - Dados brutos (JSONB)
- `p_signal_category` - Categoria: 'potencial' ou 'real' (padrão: 'potencial')

### O que ela faz:
1. ✅ **Insere** o sinal na tabela `purchase_intent_signals`
2. ✅ **Dispara o trigger** `trg_update_purchase_intent_score`
3. ✅ **Atualiza automaticamente** os scores nas tabelas relacionadas

## 🔧 ONDE ELA É ATIVADA

### 1. NO BANCO DE DADOS (Já está ativa após executar o SQL)

A função **já existe** no banco após executar `ATIVAR_PURCHASE_INTENT_COMPLETO.sql`.

### 2. PRECISA SER CHAMADA POR EDGE FUNCTIONS

A função **NÃO é automática**. Ela precisa ser **CHAMADA** por:

#### Opção A: Edge Function Existente (Precisa Adaptar)

As Edge Functions existentes (`detect-intent-signals`, `detect-intent-signals-v2`, `detect-intent-signals-v3`) detectam sinais mas **salvam em outras tabelas** (`intent_signals`, `intent_signals_detection`).

**Solução:** Adaptar essas Edge Functions para também chamar `insert_purchase_intent_signal` e salvar em `purchase_intent_signals`.

#### Opção B: Nova Edge Function (Recomendado)

Criar uma nova Edge Function `detect-purchase-intent-signals` que:
1. Detecta sinais usando Serper API, Google News, etc.
2. Chama `insert_purchase_intent_signal` para cada sinal detectado
3. Salva todos os sinais em `purchase_intent_signals`

#### Opção C: Processo Manual (Teste)

Você pode chamar a função manualmente via SQL para teste:

```sql
-- Exemplo: Inserir sinal de expansão
SELECT insert_purchase_intent_signal(
  p_tenant_id := 'seu-tenant-id',
  p_cnpj := '12345678000190',
  p_company_id := NULL,
  p_signal_type := 'expansion',
  p_signal_source := 'news',
  p_signal_description := 'Empresa anunciou expansão',
  p_signal_strength := 70,
  p_signal_date := CURRENT_DATE,
  p_raw_data := '{"source": "Google News"}'::jsonb,
  p_signal_category := 'potencial'
);
```

## 📍 ONDE A TABELA É POPULADA

A tabela `purchase_intent_signals` é populada quando:

1. ✅ **Edge Functions chamam `insert_purchase_intent_signal`**
   - Detectam sinais usando APIs (Serper, Google News, etc.)
   - Chamam a função para inserir cada sinal
   - A função insere na tabela
   - O trigger atualiza scores automaticamente

2. ✅ **Processo Manual**
   - Você chama a função via SQL diretamente
   - Útil para testes ou inserções pontuais

3. ❌ **NÃO é automática**
   - Não há processo automático que detecta sinais
   - Precisa criar Edge Function ou chamar manualmente

## 🔄 FLUXO COMPLETO

```
1. EDGE FUNCTION detecta sinais
   ↓
   (Serper API, Google News, LinkedIn, etc.)
   
2. Para cada sinal detectado:
   ↓
   Chamar insert_purchase_intent_signal(...)
   
3. Função insere na tabela purchase_intent_signals
   ↓
   INSERT INTO purchase_intent_signals (...)
   
4. Trigger dispara automaticamente
   ↓
   trg_update_purchase_intent_score
   
5. Score é atualizado
   ↓
   calculate_purchase_intent_score é chamado
   
6. Tabelas são atualizadas
   ↓
   qualified_prospects.purchase_intent_score
   companies.purchase_intent_score
   icp_analysis_results.purchase_intent_score
```

## ✅ PRÓXIMOS PASSOS

### 1. Executar SQL Consolidado (Se ainda não executou)
```sql
-- Copiar e executar ATIVAR_PURCHASE_INTENT_COMPLETO.sql no Supabase SQL Editor
```

### 2. Criar/Adaptar Edge Function
- Opção A: Adaptar `detect-intent-signals` existente
- Opção B: Criar nova `detect-purchase-intent-signals`
- Opção C: Testar manualmente via SQL

### 3. Testar
- Chamar Edge Function
- Verificar se sinais foram inseridos em `purchase_intent_signals`
- Verificar se scores foram atualizados

## 🎯 RESUMO

**O QUE ATIVA A TABELA:**
- ✅ Função `insert_purchase_intent_signal` (já no SQL consolidado)
- ✅ Trigger `trg_update_purchase_intent_score` (já no SQL consolidado)
- ❌ Edge Function para detectar sinais (PRECISA CRIAR/ADAPTAR)

**ONDE ELA É ATIVADA:**
- ✅ No banco de dados (função e trigger já existem)
- ❌ Precisa ser chamada por Edge Functions (não está conectada ainda)

