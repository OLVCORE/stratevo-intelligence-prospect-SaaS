# 🎯 PROPOSTA: FIT DE PRODUTOS REAL

## 📋 ENTENDIMENTO DO REQUISITO

### **O QUE É FIT DE PRODUTOS?**

O Fit de Produtos deve calcular a **aderência entre os produtos/serviços do tenant** e as **necessidades da empresa prospectada**, baseado em:

1. **Produtos/Serviços do Tenant:**
   - Catálogo de produtos do tenant (`tenant_products`)
   - Diferenciais do tenant (do onboarding/ICP)
   - Serviços oferecidos

2. **Empresa Prospectada:**
   - Website (análise de conteúdo)
   - CNAE (atividade principal)
   - Setor/segmento
   - Necessidades identificadas

3. **Análise com IA:**
   - Conciliar produtos do tenant com necessidades da prospectada
   - Gerar score de fit (0-100%)
   - Sugerir produtos/serviços relevantes
   - Justificar recomendações

### **EXEMPLO PRÁTICO:**

**Tenant:** OLV Internacional
- Produtos: Comércio exterior, importação, exportação, supply chain, consultoria, sistemas

**Prospectada:** Empresa de fabricação
- CNAE: Fabricação
- Necessidades: Logística, importação de matérias-primas, gestão de negócios
- **Fit:** ALTO (80-90%) - Empresa de fabricação precisa exatamente dos serviços oferecidos

**Prospectada:** Empresa de tecnologia
- CNAE: Tecnologia
- **Fit:** BAIXO (5-10%) - Não há aderência entre fabricação de espuma e tecnologia

---

## 🔄 FLUXO PROPOSTO

### **1. Buscar dados do Tenant**
```
tenant_products → Lista de produtos/serviços
tenant ICP → Diferenciais, segmentos-alvo
tenant_search_configs → Configurações de busca
```

### **2. Buscar dados da Empresa Prospectada**
```
companies → CNAE, setor, porte, localização
website → Análise de conteúdo (já temos)
```

### **3. Análise com IA (OpenAI)**
```
Prompt para IA:
- Produtos do tenant: [lista]
- Diferenciais do tenant: [lista]
- Website da prospectada: [análise]
- CNAE da prospectada: [código + descrição]
- Setor da prospectada: [setor]

IA retorna:
- Score de fit geral (0-100%)
- Score por produto (0-100%)
- Produtos recomendados
- Justificativa de cada recomendação
- Pontos fortes (por que faz sentido)
- Pontos fracos (limitações)
```

### **4. Salvar resultado**
```
stc_verification_history.full_report.detection_report = {
  fit_score: 85,
  fit_level: 'high', // high, medium, low
  products_recommendation: [
    {
      product_id: 'uuid',
      product_name: 'Comércio Exterior',
      fit_score: 90,
      recommendation: 'Alta',
      justification: 'Empresa de fabricação precisa importar matérias-primas...',
      strengths: ['Necessidade clara identificada', 'Alinhamento com CNAE'],
      weaknesses: []
    },
    ...
  ],
  analysis: {
    tenant_products_count: 12,
    analyzed_products_count: 12,
    cnae_match: true,
    sector_match: true,
    website_analysis: 'Empresa trabalha com fabricação...',
    overall_justification: 'Alta aderência devido a...'
  },
  metadata: {
    analyzed_at: '2025-01-XX',
    ai_model: 'gpt-4',
    confidence: 'high'
  }
}
```

### **5. Desbloquear outras abas**
```
Após salvar detection_report:
→ setVerificationSaved(true)
→ Desbloqueia todas as outras abas
```

---

## 🗑️ O QUE PRECISA SER REMOVIDO

### **1. Lógica de Verificação de Uso TOTVS**
- ❌ Busca de evidências TOTVS
- ❌ Validação de uso de produtos TOTVS
- ❌ Sistema GO/NO-GO baseado em evidências
- ❌ Busca em 50+ fontes (Serper API) para TOTVS
- ❌ Triple/Double/Single Match de TOTVS

### **2. Edge Function `usage-verification`**
- ❌ Refatorar completamente ou criar nova
- ✅ Nova função: `calculate-product-fit` ou `analyze-product-fit`

### **3. Componente Frontend**
- ❌ Remover lógica de evidências TOTVS
- ✅ Adicionar visualização de fit score
- ✅ Adicionar lista de produtos recomendados
- ✅ Adicionar justificativas

---

## 🛠️ IMPLEMENTAÇÃO PROPOSTA

### **FASE 1: Nova Edge Function `calculate-product-fit`**

```typescript
// supabase/functions/calculate-product-fit/index.ts

serve(async (req) => {
  // 1. Buscar produtos do tenant
  const { data: tenantProducts } = await supabase
    .from('tenant_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  // 2. Buscar diferenciais do tenant (ICP)
  const { data: tenantICP } = await supabase
    .from('tenant_icp_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  // 3. Buscar dados da empresa prospectada
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  // 4. Análise de website (se disponível)
  const websiteAnalysis = await analyzeWebsite(company.website);

  // 5. Chamar IA para análise
  const fitAnalysis = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: `Você é um especialista em análise de fit de produtos B2B.
      Analise a aderência entre produtos/serviços do tenant e necessidades da empresa prospectada.
      Retorne JSON com:
      - fit_score: número 0-100
      - products_recommendation: array de {product_id, product_name, fit_score, justification, strengths, weaknesses}
      - overall_justification: texto explicativo`
    }, {
      role: 'user',
      content: `
        TENANT:
        - Produtos: ${JSON.stringify(tenantProducts.map(p => ({ id: p.id, nome: p.nome, descricao: p.descricao })))}
        - Diferenciais: ${tenantICP?.criteria || 'N/A'}
        
        EMPRESA PROSPECTADA:
        - Nome: ${company.razao_social}
        - CNAE: ${company.cnae_principal} (${company.cnae_descricao})
        - Setor: ${company.setor}
        - Website: ${websiteAnalysis || 'N/A'}
        
        Calcule o fit entre produtos do tenant e necessidades da empresa prospectada.
      `
    }]
  });

  // 6. Processar resultado da IA
  const fitResult = JSON.parse(fitAnalysis.choices[0].message.content);

  // 7. Retornar resultado
  return new Response(JSON.stringify({
    status: 'success',
    fit_score: fitResult.fit_score,
    fit_level: fitResult.fit_score >= 70 ? 'high' : fitResult.fit_score >= 40 ? 'medium' : 'low',
    products_recommendation: fitResult.products_recommendation,
    analysis: {
      tenant_products_count: tenantProducts.length,
      analyzed_products_count: fitResult.products_recommendation.length,
      cnae_match: true, // Verificar se CNAE está nos segmentos-alvo
      sector_match: true, // Verificar se setor está nos segmentos-alvo
      website_analysis: websiteAnalysis,
      overall_justification: fitResult.overall_justification
    },
    metadata: {
      analyzed_at: new Date().toISOString(),
      ai_model: 'gpt-4',
      confidence: 'high'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

### **FASE 2: Atualizar Hook `useUsageVerification`**

```typescript
// src/hooks/useProductFit.ts (novo)

export const useProductFit = ({
  companyId,
  tenantId,
  enabled = false,
}: {
  companyId?: string;
  tenantId?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['product-fit', companyId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-product-fit', {
        body: {
          company_id: companyId,
          tenant_id: tenantId,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!companyId && !!tenantId,
  });
};
```

### **FASE 3: Atualizar Componente Frontend**

```typescript
// src/components/totvs/TOTVSCheckCard.tsx

// REMOVER:
// - Lógica de useUsageVerification
// - Lógica de evidências TOTVS
// - Sistema GO/NO-GO

// ADICIONAR:
// - useProductFit hook
// - Visualização de fit score
// - Lista de produtos recomendados
// - Justificativas

const { data: fitData, isLoading } = useProductFit({
  companyId,
  tenantId: tenant?.id,
  enabled: enabled,
});

// Renderizar:
// - Score de fit (0-100%)
// - Badge de nível (Alto/Médio/Baixo)
// - Lista de produtos recomendados com scores
// - Justificativas
```

---

## 📊 ESTRUTURA DE DADOS

### **Tabela: `product_fit_analysis` (se necessário)**

```sql
CREATE TABLE IF NOT EXISTS product_fit_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  
  -- Score geral
  fit_score DECIMAL(5,2) NOT NULL, -- 0.00 a 100.00
  fit_level TEXT NOT NULL, -- 'high', 'medium', 'low'
  
  -- Análise
  overall_justification TEXT,
  cnae_match BOOLEAN,
  sector_match BOOLEAN,
  website_analysis TEXT,
  
  -- Produtos recomendados
  products_recommendation JSONB, -- [{product_id, product_name, fit_score, justification, strengths, weaknesses}]
  
  -- Metadata
  ai_model TEXT,
  confidence TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ PRÓXIMOS PASSOS

1. ✅ **Criar nova Edge Function** `calculate-product-fit`
2. ✅ **Criar novo hook** `useProductFit`
3. ✅ **Atualizar componente** `TOTVSCheckCard`
4. ✅ **Remover lógica TOTVS** antiga
5. ✅ **Testar fluxo completo**

---

## 🎯 RESULTADO ESPERADO

Após implementação, o usuário verá:

1. **Score de Fit** (ex: 85%)
2. **Nível** (Alto/Médio/Baixo)
3. **Produtos Recomendados** com:
   - Nome do produto
   - Score individual (ex: 90%)
   - Justificativa (por que faz sentido)
   - Pontos fortes
   - Pontos fracos
4. **Análise Geral** explicando o fit geral

