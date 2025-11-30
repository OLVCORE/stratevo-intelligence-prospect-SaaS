# 🛠️ PROPOSTA TÉCNICA: IMPLEMENTAÇÃO DA TRIAGEM

## 📋 RESUMO EXECUTIVO

**Objetivo:** Substituir "Verificação de Uso" por **TRIAGEM - Análise de Intenção de Compra**

**Mudança Fundamental:**
- ❌ **ANTES:** Buscar evidências de uso → NO-GO se encontrar
- ✅ **AGORA:** Analisar Intenção de Compra → Classificar por potencial de compra

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### **1. Nova Tabela: `resultados_analise_triagem`**

```sql
CREATE TABLE IF NOT EXISTS public.resultados_analise_triagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Score de Intenção de Compra (0-100)
  score_intencao_compra INTEGER NOT NULL CHECK (score_intencao_compra >= 0 AND score_intencao_compra <= 100),
  
  -- Classificação por Tier
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('quente', 'morno', 'frio', 'desqualificado')),
  
  -- Fit Estrutural (0-100)
  fit_estrutural JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "fit_setor": 100,
  --   "fit_nicho": 80,
  --   "fit_cnae": 100,
  --   "fit_ncm": 60,
  --   "fit_porte": 100,
  --   "total": 88
  -- }
  
  -- Intenção de Compra (0-100)
  intencao_compra JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "sinais_expansao": 25,
  --   "pontos_dor": 20,
  --   "sinais_budget": 15,
  --   "total": 60
  -- }
  
  -- Análise de Timing
  timing JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "score_recencia": 70,
  --   "momento_ideal": true,
  --   "data_sinal_mais_recente": "2025-01-15"
  -- }
  
  -- Análise de Competição
  competicao JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "usa_concorrente": false,
  --   "usa_legado": true,
  --   "greenfield": false,
  --   "nomes_concorrentes": [],
  --   "score": 30
  -- }
  
  -- Recomendações e Ações
  recomendacoes TEXT[] DEFAULT '{}',
  proximas_acoes TEXT[] DEFAULT '{}',
  
  -- Sinais Encontrados (evidências coletadas)
  sinais JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "tipo": "expansao",
  --     "fonte": "linkedin_jobs",
  --     "titulo": "Vaga: Desenvolvedor...",
  --     "url": "...",
  --     "data": "2025-01-15",
  --     "relevancia": 30
  --   }
  -- ]
  
  -- Metadados
  data_analise TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  versao_analise VARCHAR(20) DEFAULT '1.0',
  tempo_execucao_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint único: uma análise por empresa+tenant
  UNIQUE(company_id, tenant_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_triagem_empresa ON public.resultados_analise_triagem(company_id);
CREATE INDEX IF NOT EXISTS idx_triagem_tenant ON public.resultados_analise_triagem(tenant_id);
CREATE INDEX IF NOT EXISTS idx_triagem_tier ON public.resultados_analise_triagem(tenant_id, tier);
CREATE INDEX IF NOT EXISTS idx_triagem_score ON public.resultados_analise_triagem(tenant_id, score_intencao_compra DESC);
CREATE INDEX IF NOT EXISTS idx_triagem_data ON public.resultados_analise_triagem(data_analise DESC);

-- RLS Policies
ALTER TABLE public.resultados_analise_triagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver resultados de triagem do seu tenant"
  ON public.resultados_analise_triagem
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
  ADD COLUMN IF NOT EXISTS icp_faixa_porte JSONB DEFAULT '{"min_funcionarios": 0, "max_funcionarios": null, "min_receita": 0, "max_receita": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS config_triagem JSONB DEFAULT '{
    "pesos_fit": {
      "setor": 0.30,
      "nicho": 0.20,
      "cnae": 0.15,
      "ncm": 0.15,
      "porte": 0.20
    },
    "pesos_intencao": {
      "expansao": 0.35,
      "pontos_dor": 0.30,
      "budget": 0.20,
      "outros": 0.15
    },
    "peso_timing": 0.20,
    "peso_competicao": 0.15
  }'::jsonb;

-- Índices GIN para arrays
CREATE INDEX IF NOT EXISTS idx_tenants_icp_setores ON public.tenants USING GIN(icp_sectors);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_nichos ON public.tenants USING GIN(icp_niches);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_cnaes ON public.tenants USING GIN(icp_cnaes);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_ncms ON public.tenants USING GIN(icp_ncms);
```

---

## ⚙️ EDGE FUNCTION: `analise-triagem`

### **Estrutura Base**

```typescript
// supabase/functions/analise-triagem/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnaliseTriagemRequest {
  company_id: string;
  company_name: string;
  cnpj: string;
  tenant_id: string;
  domain?: string;
}

interface AnaliseTriagemResult {
  score_intencao_compra: number;
  tier: 'quente' | 'morno' | 'frio' | 'desqualificado';
  fit_estrutural: {
    fit_setor: number;
    fit_nicho: number;
    fit_cnae: number;
    fit_ncm: number;
    fit_porte: number;
    total: number;
  };
  intencao_compra: {
    sinais_expansao: number;
    pontos_dor: number;
    sinais_budget: number;
    total: number;
  };
  timing: {
    score_recencia: number;
    momento_ideal: boolean;
    data_sinal_mais_recente?: string;
  };
  competicao: {
    usa_concorrente: boolean;
    usa_legado: boolean;
    greenfield: boolean;
    nomes_concorrentes: string[];
    score: number;
  };
  recomendacoes: string[];
  proximas_acoes: string[];
  sinais: Array<{
    tipo: string;
    fonte: string;
    titulo: string;
    url: string;
    data: string;
    relevancia: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, tenant_id, domain } = await req.json() as AnaliseTriagemRequest;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. BUSCAR DADOS DA EMPRESA
    const { data: empresa } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (!empresa) throw new Error('Empresa não encontrada');

    // 2. BUSCAR CONFIGURAÇÃO DO TENANT
    const { data: tenant } = await supabase
      .from('tenants')
      .select('icp_sectors, icp_niches, icp_cnaes, icp_ncms, icp_faixa_porte, config_triagem')
      .eq('id', tenant_id)
      .single();

    if (!tenant) throw new Error('Tenant não encontrado');

    // 3. BUSCAR PRODUTOS DO TENANT
    const { data: produtosTenant } = await supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true);

    // 4. CALCULAR FIT ESTRUTURAL
    const fitEstrutural = await calcularFitEstrutural(empresa, tenant);

    // 5. BUSCAR E ANALISAR SINAIS DE INTENÇÃO
    const intencaoCompra = await analisarIntencaoCompra(empresa, tenant, produtosTenant);

    // 6. ANALISAR TIMING
    const timing = await analisarTiming(intencaoCompra.sinais);

    // 7. ANALISAR COMPETIÇÃO
    const competicao = await analisarCompeticao(empresa, tenant);

    // 8. CALCULAR SCORE DE INTENÇÃO DE COMPRA
    const scoreIntencaoCompra = calcularScoreIntencaoCompra(
      fitEstrutural,
      intencaoCompra,
      timing,
      competicao,
      tenant.config_triagem
    );

    // 9. CLASSIFICAR POR TIER
    const tier = classificarTier(scoreIntencaoCompra);

    // 10. GERAR RECOMENDAÇÕES E AÇÕES
    const { recomendacoes, proximas_acoes } = gerarRecomendacoes(
      fitEstrutural,
      intencaoCompra,
      timing,
      competicao,
      tier
    );

    const resultado: AnaliseTriagemResult = {
      score_intencao_compra: scoreIntencaoCompra,
      tier,
      fit_estrutural: fitEstrutural,
      intencao_compra: intencaoCompra,
      timing,
      competicao,
      recomendacoes,
      proximas_acoes,
      sinais: intencaoCompra.sinais || []
    };

    // 11. SALVAR RESULTADO
    await supabase
      .from('resultados_analise_triagem')
      .upsert({
        company_id,
        tenant_id,
        score_intencao_compra,
        tier,
        fit_estrutural: fitEstrutural,
        intencao_compra: intencaoCompra,
        timing,
        competicao,
        recomendacoes,
        proximas_acoes,
        sinais: intencaoCompra.sinais || [],
        data_analise: new Date().toISOString(),
        versao_analise: '1.0'
      }, {
        onConflict: 'company_id,tenant_id'
      });

    return new Response(JSON.stringify(resultado), {
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

async function calcularFitEstrutural(empresa: any, tenant: any) {
  // Fit Setorial
  const fitSetor = tenant.icp_sectors?.includes(empresa.sector_code) ? 100 : 0;
  
  // Fit por Nicho
  const fitNicho = tenant.icp_niches?.includes(empresa.niche_code) ? 100 : 0;
  
  // Fit por CNAE
  const fitCnae = tenant.icp_cnaes?.some(cnae => 
    empresa.cnae_principal?.startsWith(cnae)
  ) ? 100 : 0;
  
  // Fit por NCM (buscar NCMs da empresa se disponível)
  const fitNcm = 0; // TODO: Implementar busca de NCMs
  
  // Fit por Porte
  const faixaPorte = tenant.icp_faixa_porte || {};
  const funcionarios = empresa.employees || 0;
  const fitPorte = (
    funcionarios >= (faixaPorte.min_funcionarios || 0) &&
    (!faixaPorte.max_funcionarios || funcionarios <= faixaPorte.max_funcionarios)
  ) ? 100 : 0;
  
  // Total ponderado
  const pesos = tenant.config_triagem?.pesos_fit || {
    setor: 0.30,
    nicho: 0.20,
    cnae: 0.15,
    ncm: 0.15,
    porte: 0.20
  };
  
  const total = (
    fitSetor * pesos.setor +
    fitNicho * pesos.nicho +
    fitCnae * pesos.cnae +
    fitNcm * pesos.ncm +
    fitPorte * pesos.porte
  );
  
  return {
    fit_setor: fitSetor,
    fit_nicho: fitNicho,
    fit_cnae: fitCnae,
    fit_ncm: fitNcm,
    fit_porte: fitPorte,
    total: Math.round(total)
  };
}

async function analisarIntencaoCompra(empresa: any, tenant: any, produtos: any[]) {
  const sinais: any[] = [];
  
  // Buscar vagas relacionadas
  const sinaisVagas = await buscarSinaisVagas(empresa, produtos);
  sinais.push(...sinaisVagas);
  
  // Buscar notícias de expansão/investimento
  const sinaisExpansao = await buscarSinaisExpansao(empresa);
  sinais.push(...sinaisExpansao);
  
  // Analisar sinais de dor
  const sinaisDor = await buscarPontosDor(empresa, produtos);
  sinais.push(...sinaisDor);
  
  // Calcular scores
  const scoreExpansao = sinais
    .filter(s => s.tipo === 'expansao')
    .reduce((sum, s) => sum + s.relevancia, 0);
  
  const scoreDor = sinais
    .filter(s => s.tipo === 'ponto_dor')
    .reduce((sum, s) => sum + s.relevancia, 0);
  
  const scoreBudget = sinais
    .filter(s => s.tipo === 'budget')
    .reduce((sum, s) => sum + s.relevancia, 0);
  
  return {
    sinais_expansao: Math.min(scoreExpansao, 30),
    pontos_dor: Math.min(scoreDor, 25),
    sinais_budget: Math.min(scoreBudget, 20),
    total: Math.min(scoreExpansao + scoreDor + scoreBudget, 100),
    sinais
  };
}

async function analisarTiming(sinais: any[]) {
  if (!sinais || sinais.length === 0) {
    return {
      score_recencia: 0,
      momento_ideal: false
    };
  }
  
  const agora = new Date();
  const sinalMaisRecente = sinais
    .map(s => ({ ...s, data: new Date(s.data) }))
    .sort((a, b) => b.data.getTime() - a.data.getTime())[0];
  
  const diasDesde = Math.floor((agora.getTime() - sinalMaisRecente.data.getTime()) / (1000 * 60 * 60 * 24));
  
  let scoreRecencia = 0;
  if (diasDesde < 90) scoreRecencia = 100;
  else if (diasDesde < 180) scoreRecencia = 50;
  else if (diasDesde < 365) scoreRecencia = 20;
  
  return {
    score_recencia: scoreRecencia,
    momento_ideal: diasDesde < 90,
    data_sinal_mais_recente: sinalMaisRecente.data.toISOString()
  };
}

async function analisarCompeticao(empresa: any, tenant: any) {
  // Buscar menções de concorrentes (simplificado)
  // TODO: Implementar busca real de concorrentes
  
  return {
    usa_concorrente: false,
    usa_legado: false,
    greenfield: true,
    nomes_concorrentes: [],
    score: 50 // Greenfield = oportunidade
  };
}

function calcularScoreIntencaoCompra(
  fit: any,
  intencao: any,
  timing: any,
  competicao: any,
  config: any
) {
  const pesos = config || {
    fit_estrutural: 0.30,
    intencao_compra: 0.35,
    timing: 0.20,
    competicao: 0.15
  };
  
  const score = (
    fit.total * pesos.fit_estrutural +
    intencao.total * pesos.intencao_compra +
    timing.score_recencia * pesos.timing +
    competicao.score * pesos.competicao
  );
  
  return Math.round(Math.min(Math.max(score, 0), 100));
}

function classificarTier(score: number): 'quente' | 'morno' | 'frio' | 'desqualificado' {
  if (score >= 80) return 'quente';
  if (score >= 60) return 'morno';
  if (score >= 40) return 'frio';
  return 'desqualificado';
}

function gerarRecomendacoes(
  fit: any,
  intencao: any,
  timing: any,
  competicao: any,
  tier: string
): { recomendacoes: string[]; proximas_acoes: string[] } {
  const recomendacoes: string[] = [];
  const acoes: string[] = [];
  
  if (fit.fit_setor === 100) {
    recomendacoes.push('Fit alto com setor-alvo do tenant');
  }
  
  if (intencao.sinais_expansao > 20) {
    recomendacoes.push('Sinais fortes de expansão indicam momento ideal');
    acoes.push('Abordar com proposta de crescimento');
  }
  
  if (competicao.greenfield) {
    recomendacoes.push('Empresa sem solução similar (oportunidade greenfield)');
    acoes.push('Enfatizar benefícios de primeira implementação');
  }
  
  if (timing.momento_ideal) {
    acoes.push('Agendar reunião imediata (timing ideal)');
  }
  
  return { recomendacoes, proximas_acoes: acoes };
}

// Funções auxiliares de busca (simplificadas)
async function buscarSinaisVagas(empresa: any, produtos: any[]): Promise<any[]> {
  // TODO: Implementar busca real em portais de vagas
  return [];
}

async function buscarSinaisExpansao(empresa: any): Promise<any[]> {
  // TODO: Implementar busca de notícias de expansão
  return [];
}

async function buscarPontosDor(empresa: any, produtos: any[]): Promise<any[]> {
  // TODO: Implementar busca de sinais de dor
  return [];
}
```

---

## 🎨 COMPONENTE UI: `AnaliseTriagemCard`

```typescript
// src/components/triagem/AnaliseTriagemCard.tsx

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

interface AnaliseTriagemCardProps {
  companyId: string;
  companyName: string;
  cnpj: string;
}

export function AnaliseTriagemCard({ companyId, companyName, cnpj }: AnaliseTriagemCardProps) {
  const { tenant } = useTenant();
  
  const { data: resultadoTriagem, isLoading } = useQuery({
    queryKey: ['analise-triagem', companyId, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      
      // Buscar resultado existente
      const { data: existente } = await supabase
        .from('resultados_analise_triagem')
        .select('*')
        .eq('company_id', companyId)
        .eq('tenant_id', tenant.id)
        .single();
      
      if (existente) return existente;
      
      // Executar nova análise
      const { data, error } = await supabase.functions.invoke('analise-triagem', {
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
  
  if (isLoading) return <Card>Carregando análise de triagem...</Card>;
  if (!resultadoTriagem) return null;
  
  const coresTier = {
    quente: 'bg-red-500',
    morno: 'bg-orange-500',
    frio: 'bg-blue-500',
    desqualificado: 'bg-gray-500'
  };
  
  const labelsTier = {
    quente: 'QUENTE',
    morno: 'MORNO',
    frio: 'FRIO',
    desqualificado: 'DESQUALIFICADO'
  };
  
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Triagem - Intenção de Compra</h3>
          <Badge className={coresTier[resultadoTriagem.tier]}>
            {labelsTier[resultadoTriagem.tier]}
          </Badge>
        </div>
        
        {/* Score de Intenção de Compra */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score de Intenção de Compra</span>
            <span className="text-2xl font-bold">{resultadoTriagem.score_intencao_compra}/100</span>
          </div>
          <Progress value={resultadoTriagem.score_intencao_compra} />
        </div>
        
        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Fit Estrutural</p>
            <p className="text-lg font-semibold">{resultadoTriagem.fit_estrutural.total}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Intenção de Compra</p>
            <p className="text-lg font-semibold">{resultadoTriagem.intencao_compra.total}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Timing</p>
            <p className="text-lg font-semibold">{resultadoTriagem.timing.score_recencia}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Competição</p>
            <p className="text-lg font-semibold">{resultadoTriagem.competicao.score}%</p>
          </div>
        </div>
        
        {/* Recomendações */}
        {resultadoTriagem.recomendacoes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Recomendações</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {resultadoTriagem.recomendacoes.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Próximas Ações */}
        {resultadoTriagem.proximas_acoes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Próximas Ações</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {resultadoTriagem.proximas_acoes.map((acao, i) => (
                <li key={i}>{acao}</li>
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

// Substituir enriquecimento de "Verificação de Uso" por "Análise de Triagem"

const enriquecerTriagemMutation = useMutation({
  mutationFn: async (analysisId: string) => {
    const { data: analysis } = await supabase
      .from('icp_analysis_results')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (!analysis) throw new Error('Empresa não encontrada');

    const { tenant } = useTenant();

    // Executar Análise de Triagem
    const { data, error } = await supabase.functions.invoke('analise-triagem', {
      body: {
        company_id: analysis.company_id,
        company_name: analysis.razao_social,
        cnpj: analysis.cnpj,
        tenant_id: tenant.id
      }
    });

    if (error) throw error;

    // Atualizar quarentena com resultado da triagem
    await supabase
      .from('icp_analysis_results')
      .update({
        score_intencao_compra: data.score_intencao_compra,
        tier_triagem: data.tier,
        analise_triagem: data,
        raw_analysis: {
          ...(analysis.raw_analysis || {}),
          analise_triagem: data
        }
      })
      .eq('id', analysisId);

    return data;
  },
  onSuccess: (data) => {
    const tierLabel = {
      quente: 'QUENTE',
      morno: 'MORNO',
      frio: 'FRIO',
      desqualificado: 'DESQUALIFICADO'
    };
    toast.success(`Triagem concluída! Score: ${data.score_intencao_compra}/100 (${tierLabel[data.tier]})`);
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
  }
});
```

---

## 📊 EXEMPLO DE RESULTADO

```json
{
  "score_intencao_compra": 78,
  "tier": "morno",
  "fit_estrutural": {
    "fit_setor": 100,
    "fit_nicho": 80,
    "fit_cnae": 100,
    "fit_ncm": 60,
    "fit_porte": 100,
    "total": 88
  },
  "intencao_compra": {
    "sinais_expansao": 25,
    "pontos_dor": 20,
    "sinais_budget": 15,
    "total": 60,
    "sinais": [
      {
        "tipo": "expansao",
        "fonte": "linkedin_jobs",
        "titulo": "Vaga: Desenvolvedor de Sistemas",
        "url": "https://linkedin.com/jobs/...",
        "data": "2025-01-15",
        "relevancia": 25
      }
    ]
  },
  "timing": {
    "score_recencia": 70,
    "momento_ideal": true,
    "data_sinal_mais_recente": "2025-01-15"
  },
  "competicao": {
    "usa_concorrente": false,
    "usa_legado": true,
    "greenfield": false,
    "nomes_concorrentes": [],
    "score": 30
  },
  "recomendacoes": [
    "Fit alto com setor-alvo do tenant",
    "Sinais fortes de expansão indicam momento ideal",
    "Empresa usa solução legada (oportunidade de migração)"
  ],
  "proximas_acoes": [
    "Abordar com proposta de migração de solução legada",
    "Enfatizar casos de sucesso no setor",
    "Agendar reunião imediata (timing ideal)"
  ]
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1: Banco de Dados**
- [ ] Criar tabela `resultados_analise_triagem`
- [ ] Adicionar campos de ICP ao `tenants` (se necessário)
- [ ] Criar índices e RLS policies
- [ ] Criar migration SQL

### **FASE 2: Edge Function**
- [ ] Criar `supabase/functions/analise-triagem/index.ts`
- [ ] Implementar `calcularFitEstrutural()`
- [ ] Implementar `analisarIntencaoCompra()`
- [ ] Implementar `analisarTiming()`
- [ ] Implementar `analisarCompeticao()`
- [ ] Implementar `calcularScoreIntencaoCompra()`
- [ ] Implementar `classificarTier()`
- [ ] Implementar `gerarRecomendacoes()`

### **FASE 3: Busca de Sinais**
- [ ] Implementar `buscarSinaisVagas()` (portais de vagas)
- [ ] Implementar `buscarSinaisExpansao()` (notícias)
- [ ] Implementar `buscarPontosDor()` (análise de dor)
- [ ] Integrar com APIs existentes (web-search, etc.)

### **FASE 4: UI Components**
- [ ] Criar `AnaliseTriagemCard.tsx`
- [ ] Criar `BadgeTierTriagem.tsx`
- [ ] Criar `BreakdownTriagem.tsx`
- [ ] Integrar com Quarentena ICP

### **FASE 5: Integração**
- [ ] Substituir "Verificação de Uso" por "Triagem - Intenção de Compra"
- [ ] Atualizar Quarentena ICP
- [ ] Atualizar Leads Aprovados
- [ ] Adicionar filtros por Tier

---

**Última atualização:** 2025-01-19  
**Versão:** 1.0 (Proposta Técnica em Português)

