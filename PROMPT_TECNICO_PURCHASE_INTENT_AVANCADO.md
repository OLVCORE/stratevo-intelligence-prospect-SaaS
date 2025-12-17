# 🤖 PROMPT TÉCNICO: PURCHASE INTENT AVANÇADO
## Implementação Completa com Integração ICP

---

## 📋 1. PROMPT COMPLETO PARA ANÁLISE IA

### 1.1. **System Prompt**

```typescript
const SYSTEM_PROMPT = `Você é um especialista em análise de fit B2B e intenção de compra entre empresas.

Sua tarefa é analisar o fit entre uma empresa TENANT (que vende produtos/serviços) e uma empresa PROSPECT (potencial cliente) considerando:

1. PRODUTOS E SERVIÇOS:
   - Produtos do tenant (extraídos de website, CNAE, documentos)
   - Produtos do prospect (extraídos de website, CNAE)
   - Match por aplicação, uso, fabricação, processo, suporte
   - Match por CNAE (produtos típicos do CNAE)

2. PERFIL DO CLIENTE IDEAL (ICP):
   - Setores, nichos, CNAEs-alvo
   - Porte, faturamento, funcionários
   - Localização
   - Características especiais

3. DIFERENCIAIS E CASOS DE USO:
   - Diferenciais do tenant
   - Casos de uso do tenant
   - Dores do prospect que podem ser resolvidas

4. ANÁLISE COMPETITIVA:
   - Prospect usa concorrente direto?
   - Prospect usa solução legada?
   - Prospect não tem solução?

5. HISTÓRICO DE CLIENTES:
   - Prospect é similar a clientes atuais?
   - Clientes similares compraram quais produtos?

6. CONDIÇÕES DE MERCADO:
   - Época do ano
   - Crescimento do setor
   - Notícias recentes

Sempre retorne JSON válido, sem markdown, sem explicações adicionais.`;
```

### 1.2. **User Prompt Template**

```typescript
const USER_PROMPT_TEMPLATE = `
# ANÁLISE DE FIT E INTENÇÃO DE COMPRA

## TENANT (Empresa que vende)

**Dados Básicos:**
- Razão Social: {tenant_razao_social}
- CNPJ: {tenant_cnpj}
- CNAEs: {tenant_cnaes}
- Setor: {tenant_setor}
- Website: {tenant_website}

**Produtos/Serviços Oferecidos:**
{tenant_products_list}

**Diferenciais Competitivos:**
{tenant_diferenciais}

**Casos de Uso:**
{tenant_casos_uso}

**Concorrentes Diretos:**
{tenant_concorrentes}

---

## PROSPECT (Empresa investigada)

**Dados Básicos:**
- Razão Social: {prospect_razao_social}
- CNPJ: {prospect_cnpj}
- CNAEs: {prospect_cnaes}
- Setor: {prospect_setor}
- Porte: {prospect_porte}
- Faturamento: {prospect_faturamento}
- Funcionários: {prospect_funcionarios}
- Localização: {prospect_localizacao}
- Website: {prospect_website}

**Produtos/Serviços que fabrica/fornece:**
{prospect_products_list}

**Sinais de Compra:**
- Expansão: {sinais_expansao}
- Dor/Pain Points: {sinais_dor}
- Budget: {sinais_budget}
- Timing: {sinais_timing}

---

## ICP DO TENANT (Perfil Cliente Ideal)

**Setores-Alvo:**
{icp_setores_alvo}

**Nichos-Alvo:**
{icp_nichos_alvo}

**CNAEs-Alvo:**
{icp_cnaes_alvo}

**Porte-Alvo:**
{icp_porte_alvo}

**Faturamento-Alvo:**
- Mínimo: {icp_faturamento_min}
- Máximo: {icp_faturamento_max}

**Funcionários-Alvo:**
- Mínimo: {icp_funcionarios_min}
- Máximo: {icp_funcionarios_max}

**Localização-Alvo:**
{icp_localizacao_alvo}

**Características Especiais:**
{icp_caracteristicas_especiais}

---

## CLIENTES ATUAIS DO TENANT

**Clientes Similares ao Prospect:**
{clientes_similares_list}

**Padrões de Compra:**
- Produtos mais comprados: {produtos_mais_comprados}
- Setores que mais compram: {setores_mais_compram}
- Porte que mais compra: {porte_mais_compra}

---

## ANÁLISE COMPETITIVA

**Concorrentes do Tenant:**
{concorrentes_tenant_list}

**Prospect usa concorrente?**
- Usa concorrente direto: {usa_concorrente_direto}
- Nome do concorrente: {nome_concorrente}
- Usa solução legada: {usa_solucao_legada}
- Não tem solução: {nao_tem_solucao}

---

## CONDIÇÕES DE MERCADO

**Época:**
- Mês: {mes_atual}
- Trimestre: {trimestre_atual}
- Época favorável para compra: {epoca_favoravel}

**Crescimento do Setor:**
- Setor: {setor_prospect}
- Crescimento: {crescimento_setor}
- Tendência: {tendencia_setor}

**Notícias Recentes:**
{noticias_recentes_list}

---

## TAREFA

Analise o fit entre o tenant e o prospect considerando TODOS os fatores acima.

Calcule scores parciais e score final.

Identifique matches de produtos, matches com ICP, matches com diferenciais, análise competitiva e timing de mercado.

Retorne APENAS JSON válido no formato especificado.`;
```

### 1.3. **Response Format**

```typescript
interface PurchaseIntentAnalysis {
  overall_fit_score: number; // 0-100
  product_fit_score: number; // 0-100
  icp_fit_score: number; // 0-100
  differential_fit_score: number; // 0-100
  competitive_score: number; // 0-100
  market_timing_score: number; // 0-100
  similarity_to_customers_score: number; // 0-100
  
  product_matches: Array<{
    prospect_product: string;
    tenant_product: string;
    match_type: 'aplicacao' | 'uso' | 'fabricacao' | 'processo' | 'suporte' | 'cnae';
    confidence: number; // 0.0-1.0
    reason: string;
  }>;
  
  icp_matches: {
    setor: boolean;
    nicho: boolean;
    cnae: boolean;
    porte: boolean;
    faturamento: boolean;
    funcionarios: boolean;
    localizacao: boolean;
    caracteristicas_especiais: boolean;
  };
  
  differential_matches: Array<{
    diferencial: string;
    prospect_pain: string;
    confidence: number; // 0.0-1.0
    reason: string;
  }>;
  
  competitive_analysis: {
    uses_competitor: boolean;
    competitor_name: string | null;
    uses_legacy: boolean;
    has_solution: boolean;
    migration_opportunity: boolean;
    greenfield_opportunity: boolean;
  };
  
  market_timing: {
    favorable_period: boolean;
    sector_growth: 'alto' | 'medio' | 'baixo';
    urgency_signals: string[];
    recommended_approach_timing: string;
  };
  
  similarity_to_customers: {
    similar_customers_count: number;
    similar_customers: Array<{
      customer_name: string;
      similarity_score: number; // 0-100
      products_purchased: string[];
    }>;
    average_similarity_score: number; // 0-100
  };
  
  recommended_grade: 'A+' | 'A' | 'B' | 'C';
  key_factors: string[];
  recommendations: string[];
  confidence: number; // 0.0-1.0
}
```

---

## 🔧 2. IMPLEMENTAÇÃO SQL

### 2.1. **Função Principal**

```sql
CREATE OR REPLACE FUNCTION calculate_enhanced_purchase_intent(
  p_tenant_id UUID,
  p_prospect_id UUID,
  p_icp_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_prospect_data JSONB;
  v_tenant_data JSONB;
  v_icp_data JSONB;
  v_products_tenant JSONB;
  v_products_prospect JSONB;
  v_customers_similar JSONB;
  v_competitive_data JSONB;
  v_market_data JSONB;
BEGIN
  -- 1. Buscar dados do prospect
  SELECT row_to_json(p.*)::JSONB
  INTO v_prospect_data
  FROM qualified_prospects p
  WHERE p.id = p_prospect_id
    AND p.tenant_id = p_tenant_id;
  
  -- 2. Buscar dados do tenant
  SELECT row_to_json(t.*)::JSONB
  INTO v_tenant_data
  FROM tenants t
  WHERE t.id = p_tenant_id;
  
  -- 3. Buscar produtos do tenant (website + CNAE + documentos)
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'categoria', categoria,
      'descricao', descricao,
      'cnaes_alvo', cnaes_alvo,
      'setores_alvo', setores_alvo,
      'fonte', extraido_de
    )
  )
  INTO v_products_tenant
  FROM tenant_products
  WHERE tenant_id = p_tenant_id
    AND ativo = true;
  
  -- 4. Buscar produtos do prospect (website + CNAE)
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'categoria', categoria,
      'descricao', descricao,
      'fonte', fonte
    )
  )
  INTO v_products_prospect
  FROM prospect_extracted_products
  WHERE qualified_prospect_id = p_prospect_id;
  
  -- 5. Buscar dados do ICP (6 etapas)
  IF p_icp_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'setores_alvo', target_sectors,
      'nichos_alvo', target_niches,
      'cnaes_alvo', target_cnaes,
      'porte_alvo', target_size,
      'faturamento_alvo', target_revenue,
      'funcionarios_alvo', target_employees,
      'localizacao_alvo', target_location
    )
    INTO v_icp_data
    FROM icp_profiles_metadata
    WHERE id = p_icp_id
      AND tenant_id = p_tenant_id;
  END IF;
  
  -- 6. Buscar clientes similares
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'cnpj', cnpj,
      'setor', setor,
      'porte', porte,
      'similarity_score', 0 -- Calcular depois
    )
  )
  INTO v_customers_similar
  FROM (
    SELECT DISTINCT
      c.razao_social AS nome,
      c.cnpj,
      c.setor,
      c.porte
    FROM companies c
    WHERE c.tenant_id = p_tenant_id
      AND c.is_customer = true
      AND (
        c.setor = (SELECT setor FROM qualified_prospects WHERE id = p_prospect_id)
        OR c.porte = (SELECT porte FROM qualified_prospects WHERE id = p_prospect_id)
      )
    LIMIT 10
  ) sub;
  
  -- 7. Buscar análise competitiva
  SELECT jsonb_build_object(
    'concorrentes', jsonb_agg(
      jsonb_build_object(
        'nome', competitor_name,
        'produtos', jsonb_agg(DISTINCT nome)
      )
    )
  )
  INTO v_competitive_data
  FROM tenant_competitor_products
  WHERE tenant_id = p_tenant_id
  GROUP BY competitor_name;
  
  -- 8. Montar resultado
  v_result := jsonb_build_object(
    'prospect_data', v_prospect_data,
    'tenant_data', v_tenant_data,
    'icp_data', v_icp_data,
    'products_tenant', v_products_tenant,
    'products_prospect', v_products_prospect,
    'customers_similar', v_customers_similar,
    'competitive_data', v_competitive_data,
    'market_data', v_market_data,
    'calculated_at', now()
  );
  
  RETURN v_result;
END;
$$;
```

### 2.2. **Função de Inferência de Produtos por CNAE**

```sql
CREATE OR REPLACE FUNCTION infer_products_from_cnae(
  p_cnae_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_products JSONB;
BEGIN
  -- Buscar produtos típicos para o CNAE
  -- (pode usar tabela de mapeamento CNAE -> produtos ou IA)
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'categoria', categoria,
      'tipo', 'inferred_from_cnae'
    )
  )
  INTO v_products
  FROM cnae_product_mapping
  WHERE cnae_code = p_cnae_code;
  
  RETURN COALESCE(v_products, '[]'::JSONB);
END;
$$;
```

### 2.3. **Função de Similaridade com Clientes**

```sql
CREATE OR REPLACE FUNCTION calculate_similarity_to_customers(
  p_tenant_id UUID,
  p_prospect_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'similar_customers_count', COUNT(*),
    'average_similarity_score', AVG(similarity_score),
    'similar_customers', jsonb_agg(
      jsonb_build_object(
        'customer_name', customer_name,
        'similarity_score', similarity_score,
        'products_purchased', products_purchased
      )
    )
  )
  INTO v_result
  FROM (
    SELECT
      c.razao_social AS customer_name,
      CASE
        WHEN c.setor = p.setor THEN 30 ELSE 0 END +
      CASE
        WHEN c.porte = p.porte THEN 25 ELSE 0 END +
      CASE
        WHEN c.cnae_principal = p.cnae_principal THEN 20 ELSE 0 END +
      CASE
        WHEN ABS(c.faturamento - p.faturamento) / NULLIF(p.faturamento, 0) < 0.3 THEN 15 ELSE 0 END +
      CASE
        WHEN ABS(c.funcionarios - p.funcionarios) / NULLIF(p.funcionarios, 0) < 0.3 THEN 10 ELSE 0 END
      AS similarity_score,
      ARRAY[]::TEXT[] AS products_purchased -- Buscar depois
    FROM companies c
    CROSS JOIN qualified_prospects p
    WHERE c.tenant_id = p_tenant_id
      AND c.is_customer = true
      AND p.id = p_prospect_id
      AND p.tenant_id = p_tenant_id
  ) sub
  WHERE similarity_score > 50
  ORDER BY similarity_score DESC
  LIMIT 10;
  
  RETURN COALESCE(v_result, '{"similar_customers_count": 0}'::JSONB);
END;
$$;
```

---

## 🚀 3. IMPLEMENTAÇÃO EDGE FUNCTION

### 3.1. **Estrutura da Function**

```typescript
// supabase/functions/calculate-enhanced-purchase-intent/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EnhancedPurchaseIntentRequest {
  tenant_id: string;
  prospect_id: string;
  icp_id?: string;
}

serve(async (req) => {
  const { tenant_id, prospect_id, icp_id } = await req.json() as EnhancedPurchaseIntentRequest;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // 1. Buscar dados via RPC
  const { data: contextData, error } = await supabase.rpc(
    'calculate_enhanced_purchase_intent',
    {
      p_tenant_id: tenant_id,
      p_prospect_id: prospect_id,
      p_icp_id: icp_id || null
    }
  );
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  
  // 2. Preparar prompt para IA
  const prompt = buildPrompt(contextData);
  
  // 3. Chamar OpenAI
  const analysis = await callOpenAI(prompt);
  
  // 4. Atualizar qualified_prospects
  await supabase
    .from('qualified_prospects')
    .update({
      purchase_intent_score: analysis.overall_fit_score,
      purchase_intent_analysis: analysis,
      purchase_intent_calculated_at: new Date().toISOString()
    })
    .eq('id', prospect_id);
  
  return new Response(JSON.stringify(analysis), {
    headers: { 'Content-Type': 'application/json' }
  });
});

function buildPrompt(contextData: any): string {
  // Montar prompt usando template
  return USER_PROMPT_TEMPLATE
    .replace('{tenant_razao_social}', contextData.tenant_data.razao_social)
    .replace('{tenant_products_list}', formatProducts(contextData.products_tenant))
    // ... outros replaces
    ;
}

async function callOpenAI(prompt: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

## 📊 4. INTEGRAÇÃO NO FRONTEND

### 4.1. **Hook React**

```typescript
// src/hooks/useEnhancedPurchaseIntent.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEnhancedPurchaseIntent(
  prospectId: string,
  icpId?: string
) {
  return useQuery({
    queryKey: ['enhanced-purchase-intent', prospectId, icpId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'calculate-enhanced-purchase-intent',
        {
          body: {
            tenant_id: (await supabase.auth.getUser()).data.user?.id,
            prospect_id: prospectId,
            icp_id: icpId
          }
        }
      );
      
      if (error) throw error;
      return data;
    },
    enabled: !!prospectId,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}

export function useRecalculatePurchaseIntent() {
  return useMutation({
    mutationFn: async ({ prospectId, icpId }: { prospectId: string; icpId?: string }) => {
      const { data, error } = await supabase.functions.invoke(
        'calculate-enhanced-purchase-intent',
        {
          body: {
            tenant_id: (await supabase.auth.getUser()).data.user?.id,
            prospect_id: prospectId,
            icp_id: icpId
          }
        }
      );
      
      if (error) throw error;
      return data;
    }
  });
}
```

---

## ✅ 5. CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Backend**
- [ ] Criar função `infer_products_from_cnae()`
- [ ] Criar função `calculate_similarity_to_customers()`
- [ ] Criar função `calculate_enhanced_purchase_intent()`
- [ ] Criar Edge Function `calculate-enhanced-purchase-intent`
- [ ] Testar funções SQL

### **Fase 2: Integração**
- [ ] Integrar com `calculate_purchase_intent_score()`
- [ ] Criar triggers automáticos
- [ ] Criar botão manual de recálculo
- [ ] Testar em todas as fases do funil

### **Fase 3: Frontend**
- [ ] Criar hook `useEnhancedPurchaseIntent()`
- [ ] Adicionar botão de recálculo nas páginas
- [ ] Exibir análise detalhada no modal
- [ ] Testar UI/UX

### **Fase 4: Otimização**
- [ ] Cachear resultados
- [ ] Otimizar queries
- [ ] Monitorar performance
- [ ] Ajustar pesos e fórmulas

---

**Documento criado em:** 2025-01-22  
**Status:** ✅ Pronto para implementação

