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

    // MC10: Buscar ICP uma vez (otimização - não buscar para cada CNPJ)
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

    // MC10: Rate limiting - processar com delay inteligente (3 req/segundo = 333ms entre requisições)
    const RATE_LIMIT_DELAY = 333; // ms entre requisições
    let lastRequestTime = 0;

    // MC10: Processar cada CNPJ (PRESERVAR lógica existente, apenas adicionar retry)
    for (const cnpj of cnpjs) {
      try {
        // MC10: Rate limiting - aguardar se necessário
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
        }
        lastRequestTime = Date.now();

        console.log(`[QualifyBulk] 📞 Processando CNPJ: ${cnpj}`);

        // MC10: Retry automático com backoff exponencial (máximo 3 tentativas)
        let prospectData: ProspectData | null = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!prospectData && retryCount < maxRetries) {
          try {
            // 1. Enriquecer via Receita Federal (🆕 agora busca website automaticamente)
            prospectData = await enrichProspect(cnpj, tenant_id);
            
            if (!prospectData && retryCount < maxRetries - 1) {
              // Backoff exponencial: 1s, 2s, 4s
              const backoffDelay = Math.pow(2, retryCount) * 1000;
              console.log(`[QualifyBulk] ⚠️ Retry ${retryCount + 1}/${maxRetries} para CNPJ ${cnpj} após ${backoffDelay}ms`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
            retryCount++;
          } catch (retryError: any) {
            console.error(`[QualifyBulk] ⚠️ Erro no retry ${retryCount + 1} para ${cnpj}:`, retryError);
            retryCount++;
            if (retryCount < maxRetries) {
              const backoffDelay = Math.pow(2, retryCount) * 1000;
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
          }
        }
        
        if (!prospectData) {
          console.warn(`[QualifyBulk] ⚠️ CNPJ ${cnpj} falhou após ${maxRetries} tentativas`);
          failedCount++;
          processedCount++;
          continue;
        }

        enrichedCount++;

        // 🆕 2. ESCANEAR WEBSITE DA EMPRESA PROSPECTADA (se tiver website)
        let websiteFitScore = 0;
        let websiteProductsMatch: any[] = [];
        let linkedinUrl: string | null = null;
        let qualifiedProspectId: string | null = null;

        if (prospectData.website) {
          try {
            console.log(`[QualifyBulk] 🔍 Escaneando website: ${prospectData.website}`);
            
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const scanResponse = await fetch(`${supabaseUrl}/functions/v1/scan-prospect-website`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tenant_id,
                qualified_prospect_id: 'temp', // Será atualizado após inserção
                website_url: prospectData.website,
                razao_social: prospectData.razaoSocial,
              }),
            });

            if (scanResponse.ok) {
              const scanData = await scanResponse.json();
              if (scanData.success) {
                websiteProductsMatch = scanData.compatible_products_details || [];
                linkedinUrl = scanData.linkedin_url || null;
                
                // Calcular website fit score: +20 pontos se houver produtos compatíveis
                if (scanData.compatible_products > 0) {
                  websiteFitScore = Math.min(20, scanData.compatible_products * 2); // Máximo 20 pontos
                  console.log(`[QualifyBulk] ✅ Website fit score: +${websiteFitScore} pontos`);
                }
              }
            }
          } catch (scanError) {
            console.warn(`[QualifyBulk] ⚠️ Erro ao escanear website (continuando sem website fit):`, scanError);
            // Não falhar a qualificação se o scan falhar
          }
        }

        // 3. Calcular FIT score (🆕 agora inclui website fit score)
        const fitResult = calculateFitScore(prospectData, icpData, websiteFitScore, websiteProductsMatch);

        // 4. Salvar prospect qualificado (🆕 agora inclui website fit score e LinkedIn)
        const { data: insertedProspect, error: insertError } = await supabase
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
            website_encontrado: prospectData.website, // 🆕 Website encontrado automaticamente
            website_fit_score: websiteFitScore, // 🆕 Score de fit do website
            website_products_match: websiteProductsMatch, // 🆕 Produtos compatíveis
            linkedin_url: linkedinUrl, // 🆕 LinkedIn encontrado
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
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[QualifyBulk] ❌ Erro ao salvar prospect ${cnpj}:`, insertError);
          failedCount++;
          processedCount++;
          continue;
        }

        qualifiedProspectId = insertedProspect?.id;

        // 🆕 5. Atualizar produtos extraídos com o ID correto (se escaneou website)
        if (qualifiedProspectId && prospectData.website) {
          try {
            await supabase
              .from('prospect_extracted_products')
              .update({ qualified_prospect_id: qualifiedProspectId })
              .eq('qualified_prospect_id', 'temp')
              .eq('tenant_id', tenant_id);
          } catch (updateError) {
            console.warn(`[QualifyBulk] ⚠️ Erro ao atualizar produtos extraídos:`, updateError);
          }
        }

        if (insertError) {
          console.error(`[QualifyBulk] ❌ Erro ao salvar prospect ${cnpj}:`, insertError);
          failedCount++;
        }

        processedCount++;

        // MC10: Atualizar progresso em tempo real (adicionar, não modificar)
        const progressPercentage = (processedCount / cnpjs.length) * 100;
        await supabase
          .from('prospect_qualification_jobs')
          .update({
            processed_count: processedCount,
            enriched_count: enrichedCount,
            failed_count: failedCount,
            progress_percentage: Math.round(progressPercentage * 100) / 100,
          })
          .eq('id', job_id);

        // Delay para não sobrecarregar APIs (PRESERVAR delay existente)
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
 * 🆕 NOVO: Busca website oficial automaticamente se não estiver na planilha
 */
async function enrichProspect(cnpj: string, tenantId: string): Promise<ProspectData | null> {
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

    const razaoSocial = data.razao_social || data.nome_fantasia || '';
    
    // 🆕 BUSCAR WEBSITE OFICIAL se não estiver nos dados da Receita
    let website = data.website || data.site || '';
    
    if (!website && razaoSocial) {
      try {
        console.log(`[Enrich] 🔍 Buscando website oficial para: ${razaoSocial}`);
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const findWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/find-prospect-website`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razao_social: razaoSocial,
            cnpj: cnpj,
            tenant_id: tenantId,
          }),
        });

        if (findWebsiteResponse.ok) {
          const websiteData = await findWebsiteResponse.json();
          if (websiteData.success && websiteData.website) {
            website = websiteData.website;
            console.log(`[Enrich] ✅ Website encontrado: ${website}`);
          }
        }
      } catch (websiteError) {
        console.warn(`[Enrich] ⚠️ Erro ao buscar website (continuando sem website):`, websiteError);
        // Não falhar o enriquecimento se a busca de website falhar
      }
    }

    return {
      cnpj: data.cnpj || cnpj,
      razaoSocial,
      nomeFantasia: data.nome_fantasia || '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      capitalSocial: parseFloat(data.capital_social || '0'),
      setor: setorExtraido,
      cnaePrincipal: cnaeCode,
      cnaeDescricao: data.cnae_fiscal_descricao || '',
      website, // 🆕 Website encontrado automaticamente
      produtos: [], // Será preenchido pelo scan-prospect-website
    };

  } catch (error) {
    console.error(`[Enrich] ❌ Erro ao enriquecer ${cnpj}:`, error);
    return null;
  }
}

/**
 * Calcula FIT score entre prospect e ICP do tenant
 * 🆕 NOVO: Inclui website fit score (+20 pontos máximo)
 */
function calculateFitScore(
  prospect: ProspectData, 
  icp: any,
  websiteFitScore: number = 0, // 🆕 Score de fit do website (0-20)
  websiteProductsMatch: any[] = [] // 🆕 Produtos compatíveis encontrados no website
): FitScoreResult {
  const reasons: string[] = [];
  const compatibleProducts: any[] = [];
  
  // Default: sem ICP = score neutro
  if (!icp) {
    return {
      fitScore: 50 + websiteFitScore, // 🆕 Adicionar website fit mesmo sem ICP
      grade: 'C',
      productSimilarity: 50,
      sectorFit: 50,
      capitalFit: 50,
      geoFit: 50,
      maturityScore: 50,
      reasons: websiteFitScore > 0 
        ? ['ICP não configurado - score padrão aplicado', `✅ Website fit: +${websiteFitScore} pontos`]
        : ['ICP não configurado - score padrão aplicado'],
      compatibleProducts: websiteProductsMatch, // 🆕 Incluir produtos compatíveis do website
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

  // Score final ponderado + 🆕 Website Fit Score (até +20 pontos)
  const baseScore = (
    productScore * 0.30 +
    sectorScore * 0.25 +
    capitalScore * 0.20 +
    geoScore * 0.15 +
    maturityScore * 0.10
  );
  
  const finalScore = Math.min(100, baseScore + websiteFitScore); // 🆕 Adicionar website fit (máximo 100)
  
  // 🆕 Adicionar razão do website fit
  if (websiteFitScore > 0) {
    reasons.push(`✅ Website fit: +${websiteFitScore} pontos (${websiteProductsMatch.length} produtos compatíveis encontrados)`);
    compatibleProducts.push(...websiteProductsMatch); // 🆕 Incluir produtos compatíveis do website
  }

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

