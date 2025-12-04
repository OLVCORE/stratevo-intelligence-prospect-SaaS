/**
 * Edge Function: Qualificação de Prospects em Massa
 * 
 * Processa CNPJs em lote:
 * 1. Enriquece via Receita Federal
 * 2. Extrai produtos do website
 * 3. Calcula FIT score com ICP
 * 4. Classifica (A+, A, B, C, D)
 * 5. Salva em qualified_prospects
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface QualificationRequest {
  tenant_id: string;
  job_id: string;
  cnpjs: string[]; // Array de CNPJs (apenas números)
  icp_id?: string; // Opcional - ICP para usar como referência
}

interface ProspectData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cidade: string;
  estado: string;
  capitalSocial: number;
  setor: string;
  cnaePrincipal: string;
  cnaeDescricao?: string;
  produtos?: any[];
  website?: string;
}

interface FitScoreResult {
  fitScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  productSimilarity: number;
  sectorFit: number;
  capitalFit: number;
  geoFit: number;
  maturityScore: number;
  reasons: string[];
  compatibleProducts: any[];
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tenant_id, job_id, cnpjs, icp_id } = await req.json() as QualificationRequest;

    if (!tenant_id || !job_id || !cnpjs?.length) {
      return new Response(
        JSON.stringify({ error: 'tenant_id, job_id e cnpjs são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[QualifyBulk] 🚀 Iniciando qualificação de ${cnpjs.length} CNPJs`);

    // Atualizar job para 'processing'
    await supabase
      .from('prospect_qualification_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', job_id);

    let processedCount = 0;
    let enrichedCount = 0;
    let failedCount = 0;

    // Processar cada CNPJ
    for (const cnpj of cnpjs) {
      try {
        console.log(`[QualifyBulk] 📞 Processando CNPJ: ${cnpj}`);

        // 1. Enriquecer via Receita Federal
        const prospectData = await enrichProspect(cnpj);
        
        if (!prospectData) {
          failedCount++;
          processedCount++;
          continue;
        }

        enrichedCount++;

        // 2. Buscar ICP do tenant (se não foi fornecido)
        let icpData: any = null;
        if (icp_id) {
          const { data: icp } = await supabase
            .from('icp')
            .select('*')
            .eq('id', icp_id)
            .single();
          icpData = icp;
        } else {
          // Buscar ICP mais recente do tenant
          const { data: icp } = await supabase
            .from('icp')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          icpData = icp;
        }

        // 3. Calcular FIT score
        const fitResult = calculateFitScore(prospectData, icpData);

        // 4. Salvar prospect qualificado
        const { error: insertError } = await supabase
          .from('qualified_prospects')
          .insert({
            tenant_id,
            job_id,
            icp_id: icp_id || icpData?.id,
            cnpj: prospectData.cnpj,
            razao_social: prospectData.razaoSocial,
            nome_fantasia: prospectData.nomeFantasia,
            cidade: prospectData.cidade,
            estado: prospectData.estado,
            setor: prospectData.setor,
            capital_social: prospectData.capitalSocial,
            cnae_principal: prospectData.cnaePrincipal,
            cnae_descricao: prospectData.cnaeDescricao,
            website: prospectData.website,
            produtos: prospectData.produtos || [],
            produtos_count: prospectData.produtos?.length || 0,
            fit_score: fitResult.fitScore,
            grade: fitResult.grade,
            product_similarity_score: fitResult.productSimilarity,
            sector_fit_score: fitResult.sectorFit,
            capital_fit_score: fitResult.capitalFit,
            geo_fit_score: fitResult.geoFit,
            maturity_score: fitResult.maturityScore,
            fit_reasons: fitResult.reasons,
            compatible_products: fitResult.compatibleProducts,
            enrichment_data: prospectData,
          });

        if (insertError) {
          console.error(`[QualifyBulk] ❌ Erro ao salvar prospect ${cnpj}:`, insertError);
          failedCount++;
        }

        processedCount++;

        // Delay para não sobrecarregar APIs
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`[QualifyBulk] ❌ Erro ao processar ${cnpj}:`, error);
        failedCount++;
        processedCount++;
      }
    }

    // Atualizar job como concluído
    await supabase
      .from('prospect_qualification_jobs')
      .update({
        status: 'completed',
        processed_count: processedCount,
        enriched_count: enrichedCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        enriched: enrichedCount,
        failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[QualifyBulk] ❌ Erro fatal:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Enriquece um CNPJ via Receita Federal
 */
async function enrichProspect(cnpj: string): Promise<ProspectData | null> {
  try {
    // Chamar API da Receita Federal
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    
    if (!response.ok) {
      console.warn(`[Enrich] ⚠️ CNPJ não encontrado: ${cnpj}`);
      return null;
    }

    const data = await response.json();

    // Extrair setor do CNAE
    const cnaeCode = data.cnae_fiscal?.toString() || '';
    const secao = cnaeCode.substring(0, 1);
    const setores: Record<string, string> = {
      '1': 'Agricultura', '2': 'Indústria', '3': 'Indústria',
      '4': 'Energia', '5': 'Construção', '6': 'Comércio',
      '7': 'Transporte', '8': 'Serviços', '9': 'Serviços'
    };
    const setorExtraido = setores[secao] || 'Outros';

    return {
      cnpj: data.cnpj || cnpj,
      razaoSocial: data.razao_social || data.nome_fantasia || '',
      nomeFantasia: data.nome_fantasia || '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      capitalSocial: parseFloat(data.capital_social || '0'),
      setor: setorExtraido,
      cnaePrincipal: data.cnae_fiscal?.toString() || '',
      cnaeDescricao: data.cnae_fiscal_descricao || '',
      website: '', // TODO: Extrair do site se disponível
      produtos: [], // TODO: Scan do website
    };

  } catch (error) {
    console.error(`[Enrich] ❌ Erro ao enriquecer ${cnpj}:`, error);
    return null;
  }
}

/**
 * Calcula FIT score entre prospect e ICP do tenant
 */
function calculateFitScore(prospect: ProspectData, icp: any): FitScoreResult {
  const reasons: string[] = [];
  const compatibleProducts: any[] = [];
  
  // Default: sem ICP = score neutro
  if (!icp) {
    return {
      fitScore: 50,
      grade: 'C',
      productSimilarity: 50,
      sectorFit: 50,
      capitalFit: 50,
      geoFit: 50,
      maturityScore: 50,
      reasons: ['ICP não configurado - score padrão aplicado'],
      compatibleProducts: [],
    };
  }

  // 1. Similaridade de Produtos (30%)
  const productScore = calculateProductSimilarity(prospect.produtos || [], icp);
  
  // 2. Fit de Setor/CNAE (25%)
  const sectorScore = calculateSectorFit(prospect.setor, prospect.cnaePrincipal, icp);
  
  // 3. Fit de Capital Social (20%)
  const capitalScore = calculateCapitalFit(prospect.capitalSocial, icp);
  
  // 4. Fit Geográfico (15%)
  const geoScore = calculateGeoFit(prospect.cidade, prospect.estado, icp);
  
  // 5. Maturidade (10%)
  const maturityScore = 70; // TODO: Calcular com base em data de abertura

  // Score final ponderado
  const finalScore = (
    productScore * 0.30 +
    sectorScore * 0.25 +
    capitalScore * 0.20 +
    geoScore * 0.15 +
    maturityScore * 0.10
  );

  // Classificação
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  if (finalScore >= 95) grade = 'A+';
  else if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else grade = 'D';

  // Razões do score
  if (productScore > 80) reasons.push(`Produtos altamente compatíveis (${productScore.toFixed(0)}%)`);
  if (sectorScore > 80) reasons.push(`Setor ideal (${sectorScore.toFixed(0)}%)`);
  if (capitalScore > 80) reasons.push(`Capital social adequado (${capitalScore.toFixed(0)}%)`);
  if (geoScore > 80) reasons.push(`Região estratégica (${geoScore.toFixed(0)}%)`);

  return {
    fitScore: parseFloat(finalScore.toFixed(2)),
    grade,
    productSimilarity: parseFloat(productScore.toFixed(2)),
    sectorFit: parseFloat(sectorScore.toFixed(2)),
    capitalFit: parseFloat(capitalScore.toFixed(2)),
    geoFit: parseFloat(geoScore.toFixed(2)),
    maturityScore: parseFloat(maturityScore.toFixed(2)),
    reasons,
    compatibleProducts,
  };
}

function calculateProductSimilarity(products: any[], icp: any): number {
  // TODO: Implementar algoritmo de similaridade de produtos
  // Por enquanto, retorna score baseado em quantidade
  if (!products || products.length === 0) return 30;
  if (products.length < 5) return 50;
  if (products.length < 20) return 70;
  return 85;
}

function calculateSectorFit(setor: string, cnae: string, icp: any): number {
  // TODO: Comparar com setores/CNAEs do ICP
  const setoresAlvo = icp?.setores_alvo || [];
  const cnaesAlvo = icp?.cnaes_alvo || [];
  
  if (setoresAlvo.includes(setor)) return 90;
  if (cnaesAlvo.includes(cnae)) return 95;
  
  return 50; // Neutro
}

function calculateCapitalFit(capital: number, icp: any): number {
  // TODO: Comparar com faixa de capital ideal do ICP
  const minCapital = icp?.capital_min || 0;
  const maxCapital = icp?.capital_max || Infinity;
  
  if (capital >= minCapital && capital <= maxCapital) return 95;
  if (capital >= minCapital * 0.5 && capital <= maxCapital * 1.5) return 70;
  
  return 40;
}

function calculateGeoFit(cidade: string, estado: string, icp: any): number {
  // TODO: Comparar com regiões alvo do ICP
  const estadosAlvo = icp?.estados_alvo || [];
  
  if (estadosAlvo.includes(estado)) return 90;
  
  return 60; // Neutro
}

