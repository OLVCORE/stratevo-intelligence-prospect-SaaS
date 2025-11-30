# 🛠️ PROPOSTA TÉCNICA: IMPLEMENTAÇÃO DO TRIAGE

## 📋 RESUMO EXECUTIVO

**Objetivo:** Substituir "Verificação de Uso" por **TRIAGE - Purchase Intention Analysis**

**Mudança Fundamental:**
- ❌ **ANTES:** Buscar evidências de uso → NO-GO se encontrar
- ✅ **AGORA:** Analisar Purchase Intention → Classificar por potencial de compra

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### **1. Nova Tabela: `triage_analysis_results`**

```sql
CREATE TABLE IF NOT EXISTS public.triage_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Purchase Intention Score (0-100)
  purchase_intention_score INTEGER NOT NULL CHECK (purchase_intention_score >= 0 AND purchase_intention_score <= 100),
  
  -- Tier Classification
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('hot', 'warm', 'cold', 'disqualified')),
  
  -- Fit Estrutural (0-100)
  fit_structural JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "sector_fit": 100,
  --   "niche_fit": 80,
  --   "cnae_fit": 100,
  --   "ncm_fit": 60,
  --   "size_fit": 100,
  --   "total": 88
  -- }
  
  -- Purchase Intention (0-100)
  purchase_intention JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "expansion_signals": 25,
  --   "pain_points": 20,
  --   "budget_signals": 15,
  --   "total": 60
  -- }
  
  -- Timing Analysis
  timing JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "recency_score": 70,
  --   "ideal_moment": true,
  --   "latest_signal_date": "2025-01-15"
  -- }
  
  -- Competition Analysis
  competition JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "uses_competitor": false,
  --   "uses_legacy": true,
  --   "greenfield": false,
  --   "competitor_names": [],
  --   "score": 30
  -- }
  
  -- Recommendations and Actions
  recommendations TEXT[] DEFAULT '{}',
  next_actions TEXT[] DEFAULT '{}',
  
  -- Signals Found (evidências coletadas)
  signals JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "type": "expansion",
  --     "source": "linkedin_jobs",
  --     "title": "Vaga: Desenvolvedor...",
  --     "url": "...",
  --     "date": "2025-01-15",
  --     "relevance": 30
  --   }
  -- ]
  
  -- Metadata
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_version VARCHAR(20) DEFAULT '1.0',
  execution_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: uma análise por empresa+tenant
  UNIQUE(company_id, tenant_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_triage_company ON public.triage_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_triage_tenant ON public.triage_analysis_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_triage_tier ON public.triage_analysis_results(tenant_id, tier);
CREATE INDEX IF NOT EXISTS idx_triage_score ON public.triage_analysis_results(tenant_id, purchase_intention_score DESC);
CREATE INDEX IF NOT EXISTS idx_triage_date ON public.triage_analysis_results(analysis_date DESC);

-- RLS Policies
ALTER TABLE public.triage_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view triage results of their tenant"
  ON public.triage_analysis_results
  FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));
```

---

### **2. Expandir `tenants` com configuração de ICP**

```sql
-- Adicionar campos de ICP ao tenant (se ainda não existir)
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS icp_sectors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icp_niches TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icp_cnaes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icp_ncms TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icp_size_range JSONB DEFAULT '{"min_employees": 0, "max_employees": null, "min_revenue": 0, "max_revenue": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS triage_config JSONB DEFAULT '{
    "fit_weights": {
      "sector": 0.30,
      "niche": 0.20,
      "cnae": 0.15,
      "ncm": 0.15,
      "size": 0.20
    },
    "intention_weights": {
      "expansion": 0.35,
      "pain_points": 0.30,
      "budget": 0.20,
      "other": 0.15
    },
    "timing_weight": 0.20,
    "competition_weight": 0.15
  }'::jsonb;

-- Índices GIN para arrays
CREATE INDEX IF NOT EXISTS idx_tenants_icp_sectors ON public.tenants USING GIN(icp_sectors);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_niches ON public.tenants USING GIN(icp_niches);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_cnaes ON public.tenants USING GIN(icp_cnaes);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_ncms ON public.tenants USING GIN(icp_ncms);
```

---

## ⚙️ EDGE FUNCTION: `triage-analysis`

### **Estrutura Base**

```typescript
// supabase/functions/triage-analysis/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriageAnalysisRequest {
  company_id: string;
  company_name: string;
  cnpj: string;
  tenant_id: string;
  domain?: string;
}

interface TriageAnalysisResult {
  purchase_intention_score: number;
  tier: 'hot' | 'warm' | 'cold' | 'disqualified';
  fit_structural: {
    sector_fit: number;
    niche_fit: number;
    cnae_fit: number;
    ncm_fit: number;
    size_fit: number;
    total: number;
  };
  purchase_intention: {
    expansion_signals: number;
    pain_points: number;
    budget_signals: number;
    total: number;
  };
  timing: {
    recency_score: number;
    ideal_moment: boolean;
    latest_signal_date?: string;
  };
  competition: {
    uses_competitor: boolean;
    uses_legacy: boolean;
    greenfield: boolean;
    competitor_names: string[];
    score: number;
  };
  recommendations: string[];
  next_actions: string[];
  signals: Array<{
    type: string;
    source: string;
    title: string;
    url: string;
    date: string;
    relevance: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, tenant_id, domain } = await req.json() as TriageAnalysisRequest;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. BUSCAR DADOS DA EMPRESA
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (!company) throw new Error('Empresa não encontrada');

    // 2. BUSCAR CONFIGURAÇÃO DO TENANT
    const { data: tenant } = await supabase
      .from('tenants')
      .select('icp_sectors, icp_niches, icp_cnaes, icp_ncms, icp_size_range, triage_config')
      .eq('id', tenant_id)
      .single();

    if (!tenant) throw new Error('Tenant não encontrado');

    // 3. BUSCAR PRODUTOS DO TENANT
    const { data: tenantProducts } = await supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true);

    // 4. CALCULAR FIT ESTRUTURAL
    const fitStructural = await calculateFitStructural(company, tenant);

    // 5. BUSCAR E ANALISAR SINAIS DE INTENÇÃO
    const purchaseIntention = await analyzePurchaseIntention(company, tenant, tenantProducts);

    // 6. ANALISAR TIMING
    const timing = await analyzeTiming(purchaseIntention.signals);

    // 7. ANALISAR COMPETIÇÃO
    const competition = await analyzeCompetition(company, tenant);

    // 8. CALCULAR PURCHASE INTENTION SCORE
    const purchaseIntentionScore = calculatePurchaseIntentionScore(
      fitStructural,
      purchaseIntention,
      timing,
      competition,
      tenant.triage_config
    );

    // 9. CLASSIFICAR POR TIER
    const tier = classifyTier(purchaseIntentionScore);

    // 10. GERAR RECOMENDAÇÕES E AÇÕES
    const { recommendations, next_actions } = generateRecommendations(
      fitStructural,
      purchaseIntention,
      timing,
      competition,
      tier
    );

    const result: TriageAnalysisResult = {
      purchase_intention_score: purchaseIntentionScore,
      tier,
      fit_structural: fitStructural,
      purchase_intention: purchaseIntention,
      timing,
      competition,
      recommendations,
      next_actions,
      signals: purchaseIntention.signals || []
    };

    // 11. SALVAR RESULTADO
    await supabase
      .from('triage_analysis_results')
      .upsert({
        company_id,
        tenant_id,
        purchase_intention_score,
        tier,
        fit_structural: fitStructural,
        purchase_intention: purchaseIntention,
        timing,
        competition,
        recommendations,
        next_actions,
        signals: purchaseIntention.signals || [],
        analysis_date: new Date().toISOString(),
        analysis_version: '1.0'
      }, {
        onConflict: 'company_id,tenant_id'
      });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

async function calculateFitStructural(company: any, tenant: any) {
  // Fit Setorial
  const sectorFit = tenant.icp_sectors?.includes(company.sector_code) ? 100 : 0;
  
  // Fit por Nicho
  const nicheFit = tenant.icp_niches?.includes(company.niche_code) ? 100 : 0;
  
  // Fit por CNAE
  const cnaeFit = tenant.icp_cnaes?.some(cnae => 
    company.cnae_principal?.startsWith(cnae)
  ) ? 100 : 0;
  
  // Fit por NCM (buscar NCMs da empresa se disponível)
  const ncmFit = 0; // TODO: Implementar busca de NCMs
  
  // Fit por Porte
  const sizeRange = tenant.icp_size_range || {};
  const employees = company.employees || 0;
  const sizeFit = (
    employees >= (sizeRange.min_employees || 0) &&
    (!sizeRange.max_employees || employees <= sizeRange.max_employees)
  ) ? 100 : 0;
  
  // Total ponderado
  const weights = tenant.triage_config?.fit_weights || {
    sector: 0.30,
    niche: 0.20,
    cnae: 0.15,
    ncm: 0.15,
    size: 0.20
  };
  
  const total = (
    sectorFit * weights.sector +
    nicheFit * weights.niche +
    cnaeFit * weights.cnae +
    ncmFit * weights.ncm +
    sizeFit * weights.size
  );
  
  return {
    sector_fit: sectorFit,
    niche_fit: nicheFit,
    cnae_fit: cnaeFit,
    ncm_fit: ncmFit,
    size_fit: sizeFit,
    total: Math.round(total)
  };
}

async function analyzePurchaseIntention(company: any, tenant: any, products: any[]) {
  const signals: any[] = [];
  
  // Buscar vagas relacionadas
  const jobSignals = await searchJobSignals(company, products);
  signals.push(...jobSignals);
  
  // Buscar notícias de expansão/investimento
  const expansionSignals = await searchExpansionSignals(company);
  signals.push(...expansionSignals);
  
  // Analisar sinais de dor
  const painSignals = await searchPainPoints(company, products);
  signals.push(...painSignals);
  
  // Calcular scores
  const expansionScore = signals
    .filter(s => s.type === 'expansion')
    .reduce((sum, s) => sum + s.relevance, 0);
  
  const painScore = signals
    .filter(s => s.type === 'pain_point')
    .reduce((sum, s) => sum + s.relevance, 0);
  
  const budgetScore = signals
    .filter(s => s.type === 'budget')
    .reduce((sum, s) => sum + s.relevance, 0);
  
  return {
    expansion_signals: Math.min(expansionScore, 30),
    pain_points: Math.min(painScore, 25),
    budget_signals: Math.min(budgetScore, 20),
    total: Math.min(expansionScore + painScore + budgetScore, 100),
    signals
  };
}

async function analyzeTiming(signals: any[]) {
  if (!signals || signals.length === 0) {
    return {
      recency_score: 0,
      ideal_moment: false
    };
  }
  
  const now = new Date();
  const latestSignal = signals
    .map(s => ({ ...s, date: new Date(s.date) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  
  const daysSince = Math.floor((now.getTime() - latestSignal.date.getTime()) / (1000 * 60 * 60 * 24));
  
  let recencyScore = 0;
  if (daysSince < 90) recencyScore = 100;
  else if (daysSince < 180) recencyScore = 50;
  else if (daysSince < 365) recencyScore = 20;
  
  return {
    recency_score: recencyScore,
    ideal_moment: daysSince < 90,
    latest_signal_date: latestSignal.date.toISOString()
  };
}

async function analyzeCompetition(company: any, tenant: any) {
  // Buscar menções de concorrentes (simplificado)
  // TODO: Implementar busca real de concorrentes
  
  return {
    uses_competitor: false,
    uses_legacy: false,
    greenfield: true,
    competitor_names: [],
    score: 50 // Greenfield = oportunidade
  };
}

function calculatePurchaseIntentionScore(
  fit: any,
  intention: any,
  timing: any,
  competition: any,
  config: any
) {
  const weights = config || {
    fit_structural: 0.30,
    purchase_intention: 0.35,
    timing: 0.20,
    competition: 0.15
  };
  
  const score = (
    fit.total * weights.fit_structural +
    intention.total * weights.purchase_intention +
    timing.recency_score * weights.timing +
    competition.score * weights.competition
  );
  
  return Math.round(Math.min(Math.max(score, 0), 100));
}

function classifyTier(score: number): 'hot' | 'warm' | 'cold' | 'disqualified' {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 40) return 'cold';
  return 'disqualified';
}

function generateRecommendations(
  fit: any,
  intention: any,
  timing: any,
  competition: any,
  tier: string
): { recommendations: string[]; next_actions: string[] } {
  const recommendations: string[] = [];
  const actions: string[] = [];
  
  if (fit.sector_fit === 100) {
    recommendations.push('Fit alto com setor-alvo do tenant');
  }
  
  if (intention.expansion_signals > 20) {
    recommendations.push('Sinais fortes de expansão indicam momento ideal');
    actions.push('Abordar com proposta de crescimento');
  }
  
  if (competition.greenfield) {
    recommendations.push('Empresa sem solução similar (oportunidade greenfield)');
    actions.push('Enfatizar benefícios de primeira implementação');
  }
  
  if (timing.ideal_moment) {
    actions.push('Agendar reunião imediata (timing ideal)');
  }
  
  return { recommendations, next_actions: actions };
}

// Funções auxiliares de busca (simplificadas)
async function searchJobSignals(company: any, products: any[]): Promise<any[]> {
  // TODO: Implementar busca real em portais de vagas
  return [];
}

async function searchExpansionSignals(company: any): Promise<any[]> {
  // TODO: Implementar busca de notícias de expansão
  return [];
}

async function searchPainPoints(company: any, products: any[]): Promise<any[]> {
  // TODO: Implementar busca de sinais de dor
  return [];
}
```

---

## 🎨 COMPONENTE UI: `TriageAnalysisCard`

```typescript
// src/components/triage/TriageAnalysisCard.tsx

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

interface TriageAnalysisCardProps {
  companyId: string;
  companyName: string;
  cnpj: string;
}

export function TriageAnalysisCard({ companyId, companyName, cnpj }: TriageAnalysisCardProps) {
  const { tenant } = useTenant();
  
  const { data: triageResult, isLoading } = useQuery({
    queryKey: ['triage-analysis', companyId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      
      // Buscar resultado existente
      const { data: existing } = await supabase
        .from('triage_analysis_results')
        .select('*')
        .eq('company_id', companyId)
        .eq('tenant_id', tenant.id)
        .single();
      
      if (existing) return existing;
      
      // Executar nova análise
      const { data, error } = await supabase.functions.invoke('triage-analysis', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          tenant_id: tenant.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id && !!companyId
  });
  
  if (isLoading) return <Card>Carregando análise de triage...</Card>;
  if (!triageResult) return null;
  
  const tierColors = {
    hot: 'bg-red-500',
    warm: 'bg-orange-500',
    cold: 'bg-blue-500',
    disqualified: 'bg-gray-500'
  };
  
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Triage - Purchase Intention</h3>
          <Badge className={tierColors[triageResult.tier]}>
            {triageResult.tier.toUpperCase()}
          </Badge>
        </div>
        
        {/* Purchase Intention Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Purchase Intention Score</span>
            <span className="text-2xl font-bold">{triageResult.purchase_intention_score}/100</span>
          </div>
          <Progress value={triageResult.purchase_intention_score} />
        </div>
        
        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Fit Estrutural</p>
            <p className="text-lg font-semibold">{triageResult.fit_structural.total}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Intenção de Compra</p>
            <p className="text-lg font-semibold">{triageResult.purchase_intention.total}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Timing</p>
            <p className="text-lg font-semibold">{triageResult.timing.recency_score}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Competição</p>
            <p className="text-lg font-semibold">{triageResult.competition.score}%</p>
          </div>
        </div>
        
        {/* Recommendations */}
        {triageResult.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Recomendações</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {triageResult.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Next Actions */}
        {triageResult.next_actions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Próximas Ações</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {triageResult.next_actions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## 🔄 INTEGRAÇÃO COM QUARENTENA ICP

```typescript
// src/pages/Leads/ICPQuarantine.tsx

// Substituir enriquecimento de "Verificação de Uso" por "Triage Analysis"

const enrichTriageMutation = useMutation({
  mutationFn: async (analysisId: string) => {
    const { data: analysis } = await supabase
      .from('icp_analysis_results')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (!analysis) throw new Error('Empresa não encontrada');

    const { tenant } = useTenant();

    // Executar Triage Analysis
    const { data, error } = await supabase.functions.invoke('triage-analysis', {
      body: {
        company_id: analysis.company_id,
        company_name: analysis.razao_social,
        cnpj: analysis.cnpj,
        tenant_id: tenant.id
      }
    });

    if (error) throw error;

    // Atualizar quarentena com resultado do triage
    await supabase
      .from('icp_analysis_results')
      .update({
        purchase_intention_score: data.purchase_intention_score,
        triage_tier: data.tier,
        triage_analysis: data,
        raw_analysis: {
          ...(analysis.raw_analysis || {}),
          triage_analysis: data
        }
      })
      .eq('id', analysisId);

    return data;
  },
  onSuccess: (data) => {
    toast.success(`Triage concluído! Score: ${data.purchase_intention_score}/100 (${data.tier.toUpperCase()})`);
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
  }
});
```

---

## 📊 EXEMPLO DE RESULTADO

```json
{
  "purchase_intention_score": 78,
  "tier": "warm",
  "fit_structural": {
    "sector_fit": 100,
    "niche_fit": 80,
    "cnae_fit": 100,
    "ncm_fit": 60,
    "size_fit": 100,
    "total": 88
  },
  "purchase_intention": {
    "expansion_signals": 25,
    "pain_points": 20,
    "budget_signals": 15,
    "total": 60,
    "signals": [
      {
        "type": "expansion",
        "source": "linkedin_jobs",
        "title": "Vaga: Desenvolvedor de Sistemas",
        "url": "https://linkedin.com/jobs/...",
        "date": "2025-01-15",
        "relevance": 25
      }
    ]
  },
  "timing": {
    "recency_score": 70,
    "ideal_moment": true,
    "latest_signal_date": "2025-01-15"
  },
  "competition": {
    "uses_competitor": false,
    "uses_legacy": true,
    "greenfield": false,
    "competitor_names": [],
    "score": 30
  },
  "recommendations": [
    "Fit alto com setor-alvo do tenant",
    "Sinais fortes de expansão indicam momento ideal",
    "Empresa usa solução legada (oportunidade de migração)"
  ],
  "next_actions": [
    "Abordar com proposta de migração de solução legada",
    "Enfatizar casos de sucesso no setor",
    "Agendar reunião imediata (timing ideal)"
  ]
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1: Banco de Dados**
- [ ] Criar tabela `triage_analysis_results`
- [ ] Adicionar campos de ICP ao `tenants` (se necessário)
- [ ] Criar índices e RLS policies
- [ ] Criar migration SQL

### **FASE 2: Edge Function**
- [ ] Criar `supabase/functions/triage-analysis/index.ts`
- [ ] Implementar `calculateFitStructural()`
- [ ] Implementar `analyzePurchaseIntention()`
- [ ] Implementar `analyzeTiming()`
- [ ] Implementar `analyzeCompetition()`
- [ ] Implementar `calculatePurchaseIntentionScore()`
- [ ] Implementar `classifyTier()`
- [ ] Implementar `generateRecommendations()`

### **FASE 3: Busca de Sinais**
- [ ] Implementar `searchJobSignals()` (portais de vagas)
- [ ] Implementar `searchExpansionSignals()` (notícias)
- [ ] Implementar `searchPainPoints()` (análise de dor)
- [ ] Integrar com APIs existentes (web-search, etc.)

### **FASE 4: UI Components**
- [ ] Criar `TriageAnalysisCard.tsx`
- [ ] Criar `TriageScoreBadge.tsx`
- [ ] Criar `TriageBreakdown.tsx`
- [ ] Integrar com Quarentena ICP

### **FASE 5: Integração**
- [ ] Substituir "Verificação de Uso" por "Triage Analysis"
- [ ] Atualizar Quarentena ICP
- [ ] Atualizar Leads Aprovados
- [ ] Adicionar filtros por Tier

---

**Última atualização:** 2025-01-19  
**Versão:** 1.0 (Proposta Técnica)

