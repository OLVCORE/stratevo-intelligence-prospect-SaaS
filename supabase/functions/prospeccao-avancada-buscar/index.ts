/**
 * Edge Function: Prospecção Avançada - Buscar Empresas
 * 
 * 🔥 USA TODAS AS APIs REAIS DO PROJETO:
 * - SERPER (busca de empresas na web)
 * - EmpresaQui (busca por segmento/localização)
 * - Apollo (decisores e contatos)
 * - Hunter.io (e-mails)
 * - ReceitaWS/BrasilAPI (dados cadastrais)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ⚠️ TIPOS: Manter sincronizado com src/modules/prospeccao-avancada/types.ts

interface FiltrosBusca {
  segmento?: string;
  porte?: 'micro' | 'pequena' | 'media' | 'grande';
  faturamentoMin?: number;
  faturamentoMax?: number;
  funcionariosMin?: number;
  funcionariosMax?: number;
  localizacao?: string;
  quantidadeDesejada?: number; // default 20, max 100
  page?: number; // default 1
  pageSize?: number; // default 20, max 50
}

interface Decisor {
  nome: string;
  cargo: string;
  linkedin?: string;
  email?: string;
}

interface EmpresaEnriquecida {
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  site?: string;
  linkedin?: string;
  decisores?: Decisor[];
  emails?: string[];
  telefones?: string[];
  faturamento_estimado?: number;
  funcionarios_estimados?: number;
  capital_social?: number;
  segmento?: string;
  porte?: string;
  localizacao?: string;
}

interface DiagnosticsBusca {
  candidates_collected: number;
  candidates_after_filter: number;
  enriched_ok: number;
  enriched_partial: number;
  dropped: number;
}

interface ResponseBusca {
  sucesso: boolean;
  empresas: EmpresaEnriquecida[];
  total: number;
  page: number;
  pageSize: number;
  has_more: boolean;
  diagnostics?: DiagnosticsBusca;
  error_code?: string;
  error?: string;
  detalhes?: string;
}

/**
 * 🧠 FASE 1: Carregar ICP do Tenant
 * Busca dados do ICP ativo do tenant (setores, nichos, CNAEs, critérios)
 */
interface TenantICPData {
  setores: string[];
  nichos: string[];
  cnaes: string[];
  porte: string[];
  regioes: string[];
  faturamento_min: number | null;
  faturamento_max: number | null;
  funcionarios_min: number | null;
  funcionarios_max: number | null;
}

async function loadTenantICP(supabaseClient: any, tenantId: string): Promise<TenantICPData | null> {
  try {
    console.log('[ProspeccaoAvancada] 🧠 FASE 1: Carregando ICP do tenant:', tenantId);
    
    // 1. Buscar ICP principal/ativo
    const { data: icpProfile, error: icpError } = await supabaseClient
      .from('icp_profiles_metadata')
      .select('*')
      .eq('tenant_id', tenantId)
      .or('icp_principal.eq.true,ativo.eq.true')
      .order('icp_principal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (icpError) {
      console.warn('[ProspeccaoAvancada] ⚠️ Erro ao buscar ICP:', icpError);
    }

    if (!icpProfile) {
      console.log('[ProspeccaoAvancada] ℹ️ Nenhum ICP encontrado para o tenant');
      return null;
    }

    console.log('[ProspeccaoAvancada] ✅ ICP encontrado:', icpProfile.id, icpProfile.nome);

    // 2. Buscar dados do onboarding (step2 e step3 contêm setores, nichos, CNAEs, critérios)
    const { data: onboardingData, error: onboardingError } = await supabaseClient
      .from('onboarding_sessions')
      .select('step2_data, step3_data')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (onboardingError) {
      console.warn('[ProspeccaoAvancada] ⚠️ Erro ao buscar onboarding:', onboardingError);
    }

    const step2 = onboardingData?.step2_data || {};
    const step3 = onboardingData?.step3_data || {};

    // 3. Montar dados do ICP
    const icpData: TenantICPData = {
      setores: step3.setoresAlvo || step2.setoresAlvo || [],
      nichos: step3.nichosAlvo || step2.nichosAlvo || [],
      cnaes: step3.cnaesAlvo || step2.cnaesAlvo || [],
      porte: step3.porteAlvo || [],
      regioes: step3.localizacaoAlvo?.regioes || step3.localizacaoAlvo?.estados || [],
      faturamento_min: step3.faturamentoAlvo?.minimo || null,
      faturamento_max: step3.faturamentoAlvo?.maximo || null,
      funcionarios_min: step3.funcionariosAlvo?.minimo || null,
      funcionarios_max: step3.funcionariosAlvo?.maximo || null,
    };

    console.log('[ProspeccaoAvancada] 📊 ICP Data:', {
      setores: icpData.setores.length,
      nichos: icpData.nichos.length,
      cnaes: icpData.cnaes.length,
      porte: icpData.porte.length,
      regioes: icpData.regioes.length,
    });

    return icpData;
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro ao carregar ICP:', error);
    return null;
  }
}

/**
 * 🧠 FASE 2: Combinar Filtros (ICP + Formulário)
 * Prioriza filtros do formulário, usa ICP como fallback
 */
function combineFilters(formFilters: FiltrosBusca, icpData: TenantICPData | null): FiltrosBusca {
  if (!icpData) {
    console.log('[ProspeccaoAvancada] 🔀 FASE 2: Sem ICP, usando apenas filtros do formulário');
    return formFilters;
  }

  console.log('[ProspeccaoAvancada] 🔀 FASE 2: Combinando filtros (ICP + Formulário)');

  const combined: FiltrosBusca = {
    ...formFilters,
  };

  // Segmento: usar do formulário, se vazio usar setores do ICP
  if (!combined.segmento && icpData.setores.length > 0) {
    // Pegar primeiro setor do ICP (pode melhorar depois para múltiplos)
    combined.segmento = icpData.setores[0];
    console.log('[ProspeccaoAvancada] 📝 Segmento do ICP:', combined.segmento);
  }

  // Porte: usar do formulário, se vazio usar do ICP
  if (!combined.porte && icpData.porte.length > 0) {
    // Mapear porte do ICP para formato do formulário
    const porteMap: Record<string, 'micro' | 'pequena' | 'media' | 'grande'> = {
      'ME': 'micro',
      'EPP': 'pequena',
      'MEDIA': 'media',
      'GRANDE': 'grande',
    };
    const icpPorte = icpData.porte[0];
    combined.porte = porteMap[icpPorte] || icpPorte as any;
    console.log('[ProspeccaoAvancada] 📝 Porte do ICP:', combined.porte);
  }

  // Faturamento: usar do formulário, se vazio usar do ICP
  if (!combined.faturamentoMin && icpData.faturamento_min) {
    combined.faturamentoMin = icpData.faturamento_min;
    console.log('[ProspeccaoAvancada] 📝 Faturamento min do ICP:', combined.faturamentoMin);
  }
  if (!combined.faturamentoMax && icpData.faturamento_max) {
    combined.faturamentoMax = icpData.faturamento_max;
    console.log('[ProspeccaoAvancada] 📝 Faturamento max do ICP:', combined.faturamentoMax);
  }

  // Funcionários: usar do formulário, se vazio usar do ICP
  if (!combined.funcionariosMin && icpData.funcionarios_min) {
    combined.funcionariosMin = icpData.funcionarios_min;
    console.log('[ProspeccaoAvancada] 📝 Funcionários min do ICP:', combined.funcionariosMin);
  }
  if (!combined.funcionariosMax && icpData.funcionarios_max) {
    combined.funcionariosMax = icpData.funcionarios_max;
    console.log('[ProspeccaoAvancada] 📝 Funcionários max do ICP:', combined.funcionariosMax);
  }

  // Localização: usar do formulário, se vazio usar do ICP
  if (!combined.localizacao && icpData.regioes.length > 0) {
    // Pegar primeira região do ICP
    combined.localizacao = icpData.regioes[0];
    console.log('[ProspeccaoAvancada] 📝 Localização do ICP:', combined.localizacao);
  }

  return combined;
}

/**
 * Buscar produtos do tenant
 */
async function buscarProdutosTenant(supabaseClient: any, tenantId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('tenant_products')
      .select('nome')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .limit(20);

    if (error) {
      console.warn('[ProspeccaoAvancada] ⚠️ Erro ao buscar produtos:', error);
      return [];
    }

    const produtos = (data || []).map((p: any) => p.nome).filter(Boolean);
    console.log('[ProspeccaoAvancada] 📦 Produtos do tenant:', produtos.length);
    return produtos;
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro ao buscar produtos:', error);
    return [];
  }
}

/**
 * Buscar empresas via SERPER - APENAS homepages/sobre/contato (NÃO produtos!)
 */
async function buscarViaSerper(
  filtros: FiltrosBusca, 
  produtos: string[],
  maxResults: number = 20
): Promise<any[]> {
  const serperKey = Deno.env.get('SERPER_API_KEY');
  if (!serperKey) {
    console.warn('[ProspeccaoAvancada] ⚠️ SERPER_API_KEY não configurada');
    return [];
  }

  try {
    const queries: string[] = [];
    
    // 🔥 ESTRATÉGIA CORRIGIDA: Buscar empresas por SEGMENTO/LOCALIZAÇÃO, não por produtos!
    // Produtos do tenant são usados apenas como contexto, não como busca direta
    
    if (filtros.segmento && filtros.segmento.trim()) {
      // Busca por segmento (ex: "Manufatura", "Tecnologia", etc.)
      const segmento = filtros.segmento.trim();
      // Buscar sites oficiais de empresas do segmento
      const baseQuery = `"${segmento}" site oficial`;
      
      const exclusions = [
        '-produto', '-catálogo', '-loja', '-e-commerce', '-venda', '-comprar',
        '-blog', '-notícia', '-artigo', '-"como fazer"', '-tutorial', '-dicas', '-guia',
        '-mercadolivre', '-aliexpress', '-amazon', '-olx', '-shopee', '-magalu',
        '-youtube', '-facebook', '-instagram', '-linkedin', '-twitter',
        '-gov.br', '-sebrae', '-senai', '-sesi', '-fiesp', '-apexbrasil',
        '-vaga', '-"trabalhe conosco"', '-pdf', '-download',
        '-"lista de"', '-"melhores empresas"', '-"top empresas"', '-ranking',
        '-forum', '-fórum', '-vagas', '-oportunidade', '-"empresas de"'
      ].join(' ');
      
      const domainFilter = '(site:.com.br OR site:.com OR site:.net.br OR site:.net)';
      const locationFilter = filtros.localizacao && filtros.localizacao !== 'Brasil' 
        ? filtros.localizacao 
        : '';
      
      const finalQuery = `${baseQuery} ${exclusions} ${domainFilter} ${locationFilter}`.trim().replace(/\s+/g, ' ');
      queries.push(finalQuery);
      
      console.log('[ProspeccaoAvancada] 🔍 Query SERPER (segmento):', finalQuery);
    } else if (filtros.localizacao && filtros.localizacao !== 'Brasil') {
      // Busca por localização apenas - buscar sites oficiais
      const locationQuery = `site oficial ${filtros.localizacao} Brasil -lista -ranking -vagas -fórum`;
      
      const exclusions = [
        '-produto', '-catálogo', '-loja', '-e-commerce', '-venda', '-comprar',
        '-blog', '-notícia', '-artigo', '-vaga', '-"trabalhe conosco"',
        '-mercadolivre', '-amazon', '-olx', '-shopee', '-magalu',
        '-"lista de"', '-"melhores empresas"', '-"top empresas"', '-ranking',
        '-forum', '-fórum', '-vagas', '-oportunidade'
      ].join(' ');
      
      const domainFilter = '(site:.com.br OR site:.com OR site:.net.br OR site:.net)';
      const query = `${locationQuery} ${exclusions} ${domainFilter}`.trim().replace(/\s+/g, ' ');
      queries.push(query);
      
      console.log('[ProspeccaoAvancada] 🔍 Query SERPER (localização):', query);
    } else {
      // Busca genérica: empresas ativas no Brasil - sites oficiais
      const genericQuery = 'site oficial empresa Brasil -lista -ranking -vagas -fórum -produto -catálogo -loja -e-commerce site:.com.br OR site:.com';
      queries.push(genericQuery);
      
      console.log('[ProspeccaoAvancada] 🔍 Query SERPER (genérica):', genericQuery);
    }

    if (queries.length === 0) {
      console.warn('[ProspeccaoAvancada] ⚠️ Nenhuma query gerada');
      return [];
    }

    const allResults: any[] = [];
    const seenDomains = new Set<string>();

    // Executar todas as queries
    for (const query of queries) {
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            gl: 'br',
            hl: 'pt',
            num: Math.min(maxResults * 2, 50),
          }),
        });

        if (!serperResponse.ok) {
          console.warn('[ProspeccaoAvancada] ⚠️ Erro SERPER:', serperResponse.status);
          continue;
        }

        const serperData = await serperResponse.json();
        const results = serperData.organic || [];

        // 🔥 CRÍTICO: Filtrar apenas homepages/sobre/contato (NÃO produtos!)
        for (const result of results) {
          try {
            const url = new URL(result.link);
            const domain = url.hostname.replace('www.', '');
            const pathname = url.pathname.toLowerCase();
            
            // 🔥 FILTROS RIGOROSOS: Rejeitar listas, fóruns, vagas, produtos
            const titleLower = result.title.toLowerCase();
            const snippetLower = (result.snippet || '').toLowerCase();
            const urlLower = result.link.toLowerCase();
            
            // Rejeitar: listas, rankings, fóruns, vagas
            const isListOrRanking = (
              titleLower.includes('lista de') ||
              titleLower.includes('melhores empresas') ||
              titleLower.includes('top empresas') ||
              titleLower.includes('ranking') ||
              titleLower.includes('empresas de') && (titleLower.includes('em ') || titleLower.includes('no ')) ||
              titleLower.includes('vagas') ||
              titleLower.includes('vaga de') ||
              titleLower.includes('oportunidade') ||
              titleLower.includes('trabalhe conosco') ||
              titleLower.includes('forum') ||
              titleLower.includes('fórum') ||
              urlLower.includes('/vagas') ||
              urlLower.includes('/forum') ||
              urlLower.includes('/fórum') ||
              urlLower.includes('/lista') ||
              urlLower.includes('/ranking') ||
              snippetLower.includes('vagas') ||
              snippetLower.includes('oportunidades de emprego')
            );
            
            if (isListOrRanking) {
              console.log('[ProspeccaoAvancada] ❌ Filtrado (lista/vaga/fórum):', result.title.substring(0, 60));
              continue;
            }
            
            // Rejeitar: produtos específicos, catálogos, lojas online
            const isProductPage = (
              pathname.includes('/produto/') || 
              pathname.includes('/p/') ||
              pathname.includes('/product/') ||
              pathname.includes('/item/') ||
              pathname.includes('/catalogo') ||
              pathname.includes('/loja') ||
              pathname.includes('/shop/') ||
              pathname.includes('/store/') ||
              (titleLower.includes('produto') && 
               (titleLower.includes('armário') || 
                titleLower.includes('bancada') ||
                titleLower.includes('gaveta'))) ||
              snippetLower.includes('comprar') ||
              snippetLower.includes('preço') ||
              snippetLower.includes('r$')
            );
            
            if (isProductPage) {
              console.log('[ProspeccaoAvancada] ❌ Filtrado (página de produto):', result.title.substring(0, 50));
              continue;
            }
            
            // Aceitar apenas: homepages, sobre, contato, empresa (páginas institucionais)
            const isCompanyPage = (
              pathname === '/' || 
              pathname === '/index.html' || 
              pathname === '/index.php' ||
              pathname.includes('/sobre') || 
              pathname.includes('/contato') ||
              pathname.includes('/empresa') ||
              pathname.includes('/quem-somos') ||
              pathname.includes('/home') ||
              pathname.includes('/institucional') ||
              pathname.includes('/nossa-empresa')
            );
            
            // Se não for página institucional conhecida, rejeitar
            if (!isCompanyPage) {
              console.log('[ProspeccaoAvancada] ⚠️ Ignorando (não é página institucional):', result.link);
              continue;
            }
            
            if (!seenDomains.has(domain)) {
              seenDomains.add(domain);
              allResults.push(result);
            }
          } catch {
            continue;
          }
        }
      } catch (error) {
        console.error('[ProspeccaoAvancada] ❌ Erro na query SERPER:', error);
        continue;
      }
    }

    console.log('[ProspeccaoAvancada] ✅ SERPER encontrou', allResults.length, 'empresas únicas');
    
    if (allResults.length === 0) {
      console.warn('[ProspeccaoAvancada] ⚠️ SERPER não retornou resultados. Tentando busca mais genérica...');
      
      // Fallback: busca mais genérica sem filtros de URL
      try {
        const fallbackQuery = filtros.segmento 
          ? `empresas ${filtros.segmento} ${filtros.localizacao || 'Brasil'}`
          : `empresas ${filtros.localizacao || 'Brasil'}`;
        
        const fallbackResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: fallbackQuery,
            gl: 'br',
            hl: 'pt',
            num: 20,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackResults = fallbackData.organic || [];
          
          // Adicionar resultados do fallback (com filtro mais permissivo)
          for (const result of fallbackResults) {
            try {
              const url = new URL(result.link);
              const domain = url.hostname.replace('www.', '');
              const pathname = url.pathname.toLowerCase();
              
              // Apenas rejeitar se for claramente produto
              if (pathname.includes('/produto/') || pathname.includes('/p/') || pathname.includes('/product/')) {
                continue;
              }
              
              if (!seenDomains.has(domain)) {
                seenDomains.add(domain);
                allResults.push(result);
              }
            } catch {
              continue;
            }
          }
          
          console.log('[ProspeccaoAvancada] ✅ Fallback retornou', allResults.length, 'resultados');
        }
      } catch (error) {
        console.error('[ProspeccaoAvancada] ❌ Erro no fallback:', error);
      }
    }
    
    return allResults;
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro SERPER:', error);
    return [];
  }
}

/**
 * Mapear segmento para CNAEs correspondentes
 */
function mapearSegmentoParaCNAEs(segmento: string): string[] {
  const segmentoLower = segmento.toLowerCase().trim();
  
  // Manufatura/Indústria: CNAEs 25-33 (exceto 29)
  if (segmentoLower.includes('manufatura') || segmentoLower.includes('indústria') || segmentoLower.includes('industria')) {
    return ['25', '26', '27', '28', '30', '31', '32', '33']; // CNAEs de manufatura
  }
  
  // Tecnologia: CNAEs 62-63
  if (segmentoLower.includes('tecnologia') || segmentoLower.includes('ti') || segmentoLower.includes('software')) {
    return ['62', '63'];
  }
  
  // Construção: CNAEs 41-43
  if (segmentoLower.includes('construção') || segmentoLower.includes('construcao')) {
    return ['41', '42', '43'];
  }
  
  // Varejo: CNAE 47
  if (segmentoLower.includes('varejo') || segmentoLower.includes('comércio') || segmentoLower.includes('comercio')) {
    return ['47'];
  }
  
  // Logística: CNAE 49
  if (segmentoLower.includes('logística') || segmentoLower.includes('logistica') || segmentoLower.includes('transporte')) {
    return ['49'];
  }
  
  // Saúde: CNAEs 86-87
  if (segmentoLower.includes('saúde') || segmentoLower.includes('saude') || segmentoLower.includes('hospital')) {
    return ['86', '87'];
  }
  
  // Educação: CNAE 85
  if (segmentoLower.includes('educação') || segmentoLower.includes('educacao') || segmentoLower.includes('escola')) {
    return ['85'];
  }
  
  // Agronegócio: CNAEs 01-03
  if (segmentoLower.includes('agro') || segmentoLower.includes('agricultura') || segmentoLower.includes('pecuária') || segmentoLower.includes('pecuaria')) {
    return ['01', '02', '03'];
  }
  
  // Se não mapear, retornar vazio (buscará por localização apenas)
  return [];
}

/**
 * 🧠 FASE 3: Buscar empresas via EmpresaQui usando ICP
 * Busca otimizada usando CNAEs do ICP quando disponível
 */
async function buscarViaEmpresaQui(
  filtros: FiltrosBusca, 
  metaCandidates: number,
  icpData: TenantICPData | null = null
): Promise<any[]> {
  // Nota: O secret no Supabase está como EMPRESASAQUI_API_KEY (com "S")
  const empresaQuiKey = Deno.env.get('EMPRESASAQUI_API_KEY') || Deno.env.get('EMPRESAQUI_API_KEY');
  if (!empresaQuiKey) {
    // Já validado no início, mas manter para segurança
    return [];
  }

  try {
    const resultados: any[] = [];
    const seenCNPJs = new Set<string>();

    // 🧠 ESTRATÉGIA INTELIGENTE: Priorizar CNAEs do ICP, depois segmento, depois localização
    let cnaes: string[] = [];
    
    // Prioridade 1: CNAEs do ICP (mais preciso)
    if (icpData && icpData.cnaes.length > 0) {
      cnaes = icpData.cnaes;
      console.log('[ProspeccaoAvancada] 🎯 Usando CNAEs do ICP:', cnaes.length, 'CNAEs');
    } 
    // Prioridade 2: Mapear segmento para CNAEs
    else if (filtros.segmento) {
      cnaes = mapearSegmentoParaCNAEs(filtros.segmento);
      console.log('[ProspeccaoAvancada] 📝 Mapeando segmento para CNAEs:', cnaes.length, 'CNAEs');
    }
    const [cidade, uf] = filtros.localizacao && filtros.localizacao !== 'Brasil' 
      ? filtros.localizacao.split(',').map(s => s.trim())
      : [null, null];

    // Busca 1: Por CNAE + Localização (mais preciso)
    if (cnaes.length > 0) {
      for (const cnae of cnaes.slice(0, 3)) {
        if (resultados.length >= metaCandidates) break;
        
        const params = new URLSearchParams();
        params.append('cnae', cnae);
        params.append('situacao', 'ATIVA');
        params.append('limit', '20');
        
        if (cidade) params.append('cidade', cidade);
        if (uf) params.append('uf', uf);

        try {
          const url = `https://api.empresaqui.com.br/v1/empresas/busca?${params}`;
          console.log('[ProspeccaoAvancada] 🔍 EmpresaQui busca por CNAE:', cnae, cidade || 'Brasil');
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${empresaQuiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const empresas = data.empresas || data.data || [];
            console.log('[ProspeccaoAvancada] ✅ CNAE', cnae, 'retornou:', empresas.length, 'empresas');
            
            for (const emp of empresas) {
              if (emp.cnpj && emp.cnpj.length >= 14 && !seenCNPJs.has(emp.cnpj)) {
                seenCNPJs.add(emp.cnpj);
                resultados.push(emp);
              }
            }
          } else {
            const errorText = await response.text();
            console.warn('[ProspeccaoAvancada] ⚠️ Erro busca CNAE:', response.status, errorText.substring(0, 200));
          }
        } catch (error) {
          console.error('[ProspeccaoAvancada] ❌ Erro busca CNAE:', error);
        }
      }
    }

    // Busca 2: Por localização apenas (se não tiver CNAE ou se não retornou suficiente)
    if (resultados.length < metaCandidates && cidade) {
      const params = new URLSearchParams();
      if (cidade) params.append('cidade', cidade);
      if (uf) params.append('uf', uf);
      params.append('situacao', 'ATIVA');
      params.append('limit', '30');

      try {
        const url = `https://api.empresaqui.com.br/v1/empresas/busca?${params}`;
        console.log('[ProspeccaoAvancada] 🔍 EmpresaQui busca por localização:', cidade, uf);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${empresaQuiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const empresas = data.empresas || data.data || [];
          console.log('[ProspeccaoAvancada] ✅ Busca por localização retornou:', empresas.length);
          
          for (const emp of empresas) {
            if (emp.cnpj && emp.cnpj.length >= 14 && !seenCNPJs.has(emp.cnpj) && resultados.length < metaCandidates) {
              seenCNPJs.add(emp.cnpj);
              resultados.push(emp);
            }
          }
        }
      } catch (error) {
        console.error('[ProspeccaoAvancada] ❌ Erro busca localização:', error);
      }
    }

    // Busca 3: Por porte (se especificado)
    if (resultados.length < metaCandidates && filtros.porte) {
      const porteMap: Record<string, string> = {
        'micro': 'ME',
        'pequena': 'EPP',
        'media': 'MEDIA',
        'grande': 'GRANDE'
      };
      
      const porteEQ = porteMap[filtros.porte.toLowerCase()];
      if (porteEQ) {
        const params = new URLSearchParams();
        params.append('porte', porteEQ);
        params.append('situacao', 'ATIVA');
        params.append('limit', '20');
        
        if (cidade) params.append('cidade', cidade);
        if (uf) params.append('uf', uf);

        try {
          const url = `https://api.empresaqui.com.br/v1/empresas/busca?${params}`;
          console.log('[ProspeccaoAvancada] 🔍 EmpresaQui busca por porte:', porteEQ);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${empresaQuiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const empresas = data.empresas || data.data || [];
            console.log('[ProspeccaoAvancada] ✅ Busca por porte retornou:', empresas.length);
            
            for (const emp of empresas) {
              if (emp.cnpj && emp.cnpj.length >= 14 && !seenCNPJs.has(emp.cnpj) && resultados.length < metaCandidates) {
                seenCNPJs.add(emp.cnpj);
                resultados.push(emp);
              }
            }
          }
        } catch (error) {
          console.error('[ProspeccaoAvancada] ❌ Erro busca porte:', error);
        }
      }
    }

    console.log('[ProspeccaoAvancada] ✅ EmpresaQui total consolidado:', resultados.length, 'empresas únicas com CNPJ');
    
    if (resultados.length > 0) {
      console.log('[ProspeccaoAvancada] 📋 Primeiras empresas EmpresaQui:', resultados.slice(0, 3).map((e: any) => ({
        razao_social: e.razao_social || e.nome,
        cnpj: e.cnpj,
        cidade: e.municipio || e.cidade,
        uf: e.uf
      })));
    }
    
    return resultados;
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro EmpresaQui:', error);
    return [];
  }
}

/**
 * Buscar dados cadastrais (ReceitaWS/BrasilAPI)
 */
async function buscarDadosCadastrais(cnpj: string): Promise<any> {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Tentar BrasilAPI primeiro (gratuita, oficial)
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    if (response.ok) {
      const data = await response.json();
      console.log('[ProspeccaoAvancada] ✅ BrasilAPI:', data.razao_social);
      return data;
    }
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ BrasilAPI falhou, tentando ReceitaWS...');
  }

  // Fallback: ReceitaWS
  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status !== 'ERROR') {
        console.log('[ProspeccaoAvancada] ✅ ReceitaWS:', data.nome);
        return data;
      }
    }
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ ReceitaWS falhou');
  }

  return null;
}

/**
 * Buscar decisores via Apollo
 */
async function buscarDecisoresApollo(companyName: string, domain?: string): Promise<any[]> {
  const apolloKey = Deno.env.get('APOLLO_API_KEY');
  if (!apolloKey || !companyName) {
    return [];
  }

  try {
    // Buscar organização
    const orgResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        ...(domain && { q_organization_domains: domain }),
        person_titles: ['CEO', 'Diretor', 'Gerente', 'Presidente', 'CFO', 'CTO'],
        page: 1,
        per_page: 10,
      }),
    });

    if (!orgResponse.ok) {
      console.warn('[ProspeccaoAvancada] ⚠️ Apollo falhou:', orgResponse.status);
      return [];
    }

    const orgData = await orgResponse.json();
    const people = orgData.people || [];

    return people.map((p: any) => ({
      nome: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name,
      cargo: p.title || '',
      linkedin: p.linkedin_url || '',
      email: p.email || '',
    }));
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro Apollo:', error);
    return [];
  }
}

/**
 * Buscar e-mails via Hunter.io
 */
async function buscarEmailsHunter(domain: string): Promise<string[]> {
  const hunterKey = Deno.env.get('HUNTER_API_KEY');
  if (!hunterKey || !domain) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      domain,
      limit: '10',
      api_key: hunterKey,
    });

    const response = await fetch(`https://api.hunter.io/v2/domain-search?${params}`);
    
    if (!response.ok) {
      console.warn('[ProspeccaoAvancada] ⚠️ Hunter falhou:', response.status);
      return [];
    }

    const data = await response.json();
    const emails = (data.data?.emails || []).map((e: any) => e.value);
    
    console.log('[ProspeccaoAvancada] ✅ Hunter encontrou', emails.length, 'emails');
    return emails;
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro Hunter:', error);
    return [];
  }
}

/**
 * Extrair domínio de URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Normalizar filtros (valores padrão, limites, parse localização)
 */
function normalizarFiltros(filtros: any): FiltrosBusca {
  if (!filtros || typeof filtros !== 'object') {
    filtros = {};
  }
  
  const quantidadeDesejada = Math.min(Math.max(
    typeof filtros.quantidadeDesejada === 'number' ? filtros.quantidadeDesejada : 20, 
    1
  ), 100);
  const page = Math.max(typeof filtros.page === 'number' ? filtros.page : 1, 1);
  const pageSize = Math.min(Math.max(
    typeof filtros.pageSize === 'number' ? filtros.pageSize : 20, 
    1
  ), 50);
  
  return {
    segmento: typeof filtros.segmento === 'string' ? filtros.segmento.trim() || undefined : undefined,
    porte: typeof filtros.porte === 'string' ? filtros.porte : undefined,
    faturamentoMin: typeof filtros.faturamentoMin === 'number' && filtros.faturamentoMin >= 0 ? filtros.faturamentoMin : undefined,
    faturamentoMax: typeof filtros.faturamentoMax === 'number' && filtros.faturamentoMax >= 0 ? filtros.faturamentoMax : undefined,
    funcionariosMin: typeof filtros.funcionariosMin === 'number' && filtros.funcionariosMin >= 0 ? filtros.funcionariosMin : undefined,
    funcionariosMax: typeof filtros.funcionariosMax === 'number' && filtros.funcionariosMax >= 0 ? filtros.funcionariosMax : undefined,
    localizacao: typeof filtros.localizacao === 'string' ? filtros.localizacao.trim() || undefined : undefined,
    quantidadeDesejada,
    page,
    pageSize,
  };
}

/**
 * Parse localização em cidade/UF
 */
function parseLocalizacao(localizacao?: string): { cidade?: string; uf?: string } {
  if (!localizacao || localizacao === 'Brasil') {
    return {};
  }
  
  // Formato esperado: "São Paulo, SP" ou "São Paulo"
  const parts = localizacao.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return { cidade: parts[0], uf: parts[1] };
  }
  
  return { cidade: parts[0] };
}

/**
 * Limpar CNPJ para 14 dígitos
 */
function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Validar CNPJ (14 dígitos)
 */
function validarCNPJ(cnpj: string): boolean {
  const clean = limparCNPJ(cnpj);
  return clean.length === 14;
}

/**
 * 🧠 FASE 4: Calcular ICP Match Score (0-100)
 * Baseado em setores, nichos, CNAEs do ICP
 */
function calculateICPMatchScore(empresa: EmpresaEnriquecida, icpData: TenantICPData | null): number {
  if (!icpData) {
    return 0; // Sem ICP, sem score
  }

  let score = 0;
  const reasons: string[] = [];

  // TODO: Extrair setor/nicho da empresa (precisa classificar por CNAE)
  // Por enquanto, vamos usar uma lógica simplificada baseada em segmento
  
  // 1. Match de Segmento (+30 pontos)
  if (empresa.segmento && icpData.setores.length > 0) {
    // Verificar se segmento da empresa está nos setores do ICP
    const segmentoMatch = icpData.setores.some(s => 
      s.toLowerCase().includes(empresa.segmento!.toLowerCase()) ||
      empresa.segmento!.toLowerCase().includes(s.toLowerCase())
    );
    if (segmentoMatch) {
      score += 30;
      reasons.push('Setor match (+30)');
    }
  }

  // 2. Match de CNAE (+20 pontos) - se tivermos CNAE da empresa
  // TODO: Extrair CNAE da empresa e comparar com icpData.cnaes

  // 3. Match de Porte (+10 pontos)
  if (empresa.porte && icpData.porte.length > 0) {
    const porteMatch = icpData.porte.some(p => 
      p.toLowerCase() === empresa.porte!.toLowerCase()
    );
    if (porteMatch) {
      score += 10;
      reasons.push('Porte match (+10)');
    }
  }

  // 4. Match de Localização (+10 pontos)
  if (empresa.localizacao && icpData.regioes.length > 0) {
    const localizacaoMatch = icpData.regioes.some(r => 
      empresa.localizacao!.toLowerCase().includes(r.toLowerCase()) ||
      r.toLowerCase().includes(empresa.localizacao!.toLowerCase())
    );
    if (localizacaoMatch) {
      score += 10;
      reasons.push('Localização match (+10)');
    }
  }

  // 5. Match de Faturamento (+10 pontos)
  if (empresa.faturamento_estimado && icpData.faturamento_min && icpData.faturamento_max) {
    if (empresa.faturamento_estimado >= icpData.faturamento_min && 
        empresa.faturamento_estimado <= icpData.faturamento_max) {
      score += 10;
      reasons.push('Faturamento match (+10)');
    }
  }

  // 6. Match de Funcionários (+10 pontos)
  if (empresa.funcionarios_estimados && icpData.funcionarios_min && icpData.funcionarios_max) {
    if (empresa.funcionarios_estimados >= icpData.funcionarios_min && 
        empresa.funcionarios_estimados <= icpData.funcionarios_max) {
      score += 10;
      reasons.push('Funcionários match (+10)');
    }
  }

  return Math.min(100, score);
}

/**
 * 🧠 FASE 4: Calcular Relevância Score (0-65)
 * Baseado em completude de dados
 */
function calculateRelevanciaScore(empresa: EmpresaEnriquecida): number {
  let score = 0;

  // Dados completos: +20
  if (empresa.cnpj && empresa.razao_social && empresa.endereco && empresa.cidade && empresa.uf) {
    score += 20;
  }

  // Tem site: +10
  if (empresa.site) {
    score += 10;
  }

  // Tem LinkedIn: +10
  if (empresa.linkedin) {
    score += 10;
  }

  // Tem decisores: +15
  if (empresa.decisores && empresa.decisores.length > 0) {
    score += 15;
  }

  // Tem e-mails: +10
  if (empresa.emails && empresa.emails.length > 0) {
    score += 10;
  }

  return Math.min(65, score);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // 🔥 VALIDAÇÃO 1: EMPRESASAQUI_API_KEY (OBRIGATÓRIA)
    // Nota: O secret no Supabase está como EMPRESASAQUI_API_KEY (com "S")
    const empresaQuiKey = Deno.env.get('EMPRESASAQUI_API_KEY') || Deno.env.get('EMPRESAQUI_API_KEY');
    if (!empresaQuiKey) {
      console.error('[ProspeccaoAvancada] ❌ EMPRESASAQUI_API_KEY não configurada');
      return new Response(
        JSON.stringify({
          sucesso: false,
          error_code: 'MISSING_EMPRESASAQUI_API_KEY',
          error: 'EMPRESASAQUI_API_KEY não configurada',
          detalhes: 'Configure a variável EMPRESASAQUI_API_KEY no Supabase Dashboard → Settings → Edge Functions → Secrets',
          empresas: [],
          total: 0,
          page: 1,
          pageSize: 20,
          has_more: false,
        } as ResponseBusca),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestText = await req.text();
    let body: any;
    try {
      body = JSON.parse(requestText);
    } catch (parseError) {
      console.error('[ProspeccaoAvancada] ❌ Erro ao parsear JSON:', parseError);
      return new Response(
        JSON.stringify({
          sucesso: false,
          error: 'JSON inválido',
          detalhes: parseError instanceof Error ? parseError.message : 'Erro desconhecido',
          empresas: [],
          total: 0,
          page: 1,
          pageSize: 20,
          has_more: false,
        } as ResponseBusca),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { filtros: filtrosRaw, tenant_id } = body;

    if (!tenant_id) {
      console.error('[ProspeccaoAvancada] ❌ tenant_id não fornecido');
      return new Response(
        JSON.stringify({
          sucesso: false,
          error: 'tenant_id é obrigatório',
          empresas: [],
          total: 0,
          page: 1,
          pageSize: 20,
          has_more: false,
        } as ResponseBusca),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // 🧠 FASE 1: Carregar ICP do Tenant
    const icpData = await loadTenantICP(supabaseClient, tenant_id);
    
    // Normalizar filtros
    const filtrosRawNormalized = normalizarFiltros(filtrosRaw || {});
    
    // 🧠 FASE 2: Combinar Filtros (ICP + Formulário)
    const filtros = combineFilters(filtrosRawNormalized, icpData);
    
    const { cidade, uf } = parseLocalizacao(filtros.localizacao);
    
    console.log('[ProspeccaoAvancada] 📥 Request recebido:', { 
      filtrosOriginais: filtrosRawNormalized,
      filtrosCombinados: filtros,
      icpData: icpData ? 'disponível' : 'não disponível',
      tenant_id, 
      cidade, 
      uf 
    });

    console.log('[ProspeccaoAvancada] 🚀 Iniciando busca:', {
      quantidadeDesejada: filtros.quantidadeDesejada,
      page: filtros.page,
      pageSize: filtros.pageSize,
      segmento: filtros.segmento,
      localizacao: filtros.localizacao,
    });

    // Inicializar diagnostics
    const diagnostics: DiagnosticsBusca = {
      candidates_collected: 0,
      candidates_after_filter: 0,
      enriched_ok: 0,
      enriched_partial: 0,
      dropped: 0,
    };

    // 🔥 PASSO A: Calcular metaCandidates (buscar mais do que necessário para compensar filtros)
    const metaCandidates = Math.max(filtros.quantidadeDesejada * 3, 60);
    console.log('[ProspeccaoAvancada] 🎯 Meta candidatas:', metaCandidates, '(quantidade desejada:', filtros.quantidadeDesejada, ')');

    // 🧠 FASE 3: Buscar candidatas no EmpresaQui (usando ICP)
    console.log('[ProspeccaoAvancada] 🔍 Buscando candidatas no EmpresaQui...');
    const empresaQuiCompanies = await buscarViaEmpresaQui(
      {
        ...filtros,
        localizacao: cidade && uf ? `${cidade}, ${uf}` : filtros.localizacao,
      },
      metaCandidates,
      icpData // Passar dados do ICP para busca otimizada
    );
    
    diagnostics.candidates_collected = empresaQuiCompanies.length;
    console.log('[ProspeccaoAvancada] 📊 Candidatas coletadas:', diagnostics.candidates_collected);
    
    if (empresaQuiCompanies.length === 0) {
      console.warn('[ProspeccaoAvancada] ⚠️ NENHUMA candidata encontrada no EmpresaQui!');
      return new Response(
        JSON.stringify({
          sucesso: true,
          empresas: [],
          total: 0,
          page: filtros.page,
          pageSize: filtros.pageSize,
          has_more: false,
          diagnostics,
        } as ResponseBusca),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔥 PASSO C: Validar e filtrar candidatas (ANTES de enriquecer)
    console.log('[ProspeccaoAvancada] 🔍 Validando candidatas...');
    const candidatasValidadas = empresaQuiCompanies.filter((empresa) => {
      // Validar CNPJ (14 dígitos após limpeza)
      if (empresa.cnpj) {
        const cnpjClean = limparCNPJ(empresa.cnpj);
        if (!validarCNPJ(cnpjClean)) {
          diagnostics.dropped++;
          return false;
        }
        empresa.cnpj = cnpjClean; // Normalizar para 14 dígitos
      }
      
      // Validar razão social (>= 3 caracteres)
      if (!empresa.razao_social || empresa.razao_social.trim().length < 3) {
        diagnostics.dropped++;
        return false;
      }
      
      // Filtrar por situação (se disponível)
      if (empresa.situacao_cadastral && empresa.situacao_cadastral !== 'ATIVA') {
        diagnostics.dropped++;
        return false;
      }
      
      return true;
    });
    
    diagnostics.candidates_after_filter = candidatasValidadas.length;
    console.log('[ProspeccaoAvancada] ✅ Candidatas validadas:', diagnostics.candidates_after_filter);

    // 🔥 PASSO D: Enriquecer candidatas (COM LIMITES E TIMEOUT)
    console.log('[ProspeccaoAvancada] 🔄 Enriquecendo candidatas...');
    const empresasProcessadas: EmpresaEnriquecida[] = [];
    const seenCNPJs = new Set<string>();
    const seenDomains = new Set<string>();
    
    // Concurrency limit: processar 5 em paralelo
    const CONCURRENCY_LIMIT = 5;
    const TIMEOUT_MS = 8000; // 8 segundos por empresa
    
    for (let i = 0; i < candidatasValidadas.length && empresasProcessadas.length < filtros.quantidadeDesejada + 10; i += CONCURRENCY_LIMIT) {
      const batch = candidatasValidadas.slice(i, i + CONCURRENCY_LIMIT);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (empresa) => {
          try {
            // Timeout wrapper
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
            );
            
            const processPromise = (async () => {
              // Dedupe por CNPJ
              if (empresa.cnpj && seenCNPJs.has(empresa.cnpj)) {
                return null;
              }
              if (empresa.cnpj) seenCNPJs.add(empresa.cnpj);
              
              // Buscar dados cadastrais
              const receitaData = empresa.cnpj ? await buscarDadosCadastrais(empresa.cnpj) : null;
              
              // Extrair domínio
              const domain = extractDomain(empresa.website || receitaData?.website || '');
              if (domain && seenDomains.has(domain)) return null;
              if (domain) seenDomains.add(domain);
              
              // Buscar decisores e e-mails (paralelo)
              const [decisores, emails] = await Promise.all([
                buscarDecisoresApollo(
                  empresa.razao_social || receitaData?.razao_social || receitaData?.nome || '',
                  domain || undefined
                ),
                domain ? buscarEmailsHunter(domain) : Promise.resolve([]),
              ]);
              
              const empresaEnriquecida: EmpresaEnriquecida = {
                razao_social: empresa.razao_social || receitaData?.razao_social || receitaData?.nome || 'N/A',
                nome_fantasia: empresa.nome_fantasia || receitaData?.fantasia || receitaData?.nome_fantasia,
                cnpj: empresa.cnpj,
                endereco: receitaData?.logradouro 
                  ? `${receitaData.logradouro}, ${receitaData.numero || ''} ${receitaData.complemento || ''}`.trim()
                  : (empresa.logradouro ? `${empresa.logradouro}, ${empresa.numero || ''}`.trim() : undefined),
                cidade: receitaData?.municipio || receitaData?.cidade || empresa.municipio || empresa.cidade,
                uf: receitaData?.uf || receitaData?.estado || empresa.uf,
                cep: receitaData?.cep || empresa.cep,
                site: empresa.website || receitaData?.website,
                linkedin: undefined,
                decisores: decisores.length > 0 ? decisores : undefined,
                emails: (emails.length > 0 ? emails : empresa.emails || []) || undefined,
                telefones: empresa.telefones || undefined,
                faturamento_estimado: empresa.faturamento_presumido || receitaData?.faturamento_presumido,
                funcionarios_estimados: empresa.funcionarios_presumido || (receitaData?.qsa?.length ? receitaData.qsa.length * 10 : undefined),
                capital_social: empresa.capital_social ? parseFloat(empresa.capital_social.toString()) : (receitaData?.capital_social ? parseFloat(receitaData.capital_social) : undefined),
                segmento: filtros.segmento,
                porte: filtros.porte || empresa.porte || receitaData?.porte,
                localizacao: filtros.localizacao,
              };
              
              // Contar enriquecimento
              if (decisores.length > 0 && emails.length > 0) {
                diagnostics.enriched_ok++;
              } else {
                diagnostics.enriched_partial++;
              }
              
              return empresaEnriquecida;
            })();
            
            return await Promise.race([processPromise, timeoutPromise]);
          } catch (error) {
            console.error('[ProspeccaoAvancada] ⚠️ Erro ao enriquecer:', error);
            diagnostics.dropped++;
            return null;
          }
        })
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          empresasProcessadas.push(result.value);
        }
      }
      
      console.log('[ProspeccaoAvancada] 📊 Progresso:', empresasProcessadas.length, '/', filtros.quantidadeDesejada);
    }

    // 🔥 PASSO E: Filtrar por faturamento/funcionários (se especificado)
    let empresasFiltradas = empresasProcessadas;
    
    if (filtros.faturamentoMin !== undefined || filtros.faturamentoMax !== undefined) {
      empresasFiltradas = empresasFiltradas.filter((emp) => {
        if (!emp.faturamento_estimado) return false;
        if (filtros.faturamentoMin !== undefined && emp.faturamento_estimado < filtros.faturamentoMin) return false;
        if (filtros.faturamentoMax !== undefined && emp.faturamento_estimado > filtros.faturamentoMax) return false;
        return true;
      });
    }
    
    if (filtros.funcionariosMin !== undefined || filtros.funcionariosMax !== undefined) {
      empresasFiltradas = empresasFiltradas.filter((emp) => {
        if (!emp.funcionarios_estimados) return false;
        if (filtros.funcionariosMin !== undefined && emp.funcionarios_estimados < filtros.funcionariosMin) return false;
        if (filtros.funcionariosMax !== undefined && emp.funcionarios_estimados > filtros.funcionariosMax) return false;
        return true;
      });
    }

    // 🧠 FASE 4: Classificar e Scorear empresas (ICP Match + Relevância)
    console.log('[ProspeccaoAvancada] 📊 Calculando scores ICP...');
    const empresasComScore = empresasFiltradas.map((emp) => {
      const icpScore = calculateICPMatchScore(emp, icpData);
      const relevanciaScore = calculateRelevanciaScore(emp);
      const scoreTotal = icpScore + relevanciaScore;
      
      return {
        ...emp,
        _icp_score: icpScore,
        _relevancia_score: relevanciaScore,
        _score_total: scoreTotal,
      };
    });

    // 🧠 FASE 5: Ordenar por Score Total (DESC)
    empresasComScore.sort((a, b) => {
      // Ordenar por: Score Total → ICP Score → Relevância
      if (b._score_total !== a._score_total) {
        return b._score_total - a._score_total;
      }
      if (b._icp_score !== a._icp_score) {
        return b._icp_score - a._icp_score;
      }
      return b._relevancia_score - a._relevancia_score;
    });

    // Remover campos internos de score antes de retornar
    const empresasOrdenadas = empresasComScore.map(({ _icp_score, _relevancia_score, _score_total, ...emp }) => emp);

    console.log('[ProspeccaoAvancada] ✅ Empresas ordenadas por score:', empresasOrdenadas.length);
    if (empresasOrdenadas.length > 0) {
      console.log('[ProspeccaoAvancada] 📊 Top 3 scores:', empresasComScore.slice(0, 3).map((e, i) => ({
        rank: i + 1,
        empresa: e.razao_social,
        icp_score: e._icp_score,
        relevancia_score: e._relevancia_score,
        total: e._score_total,
      })));
    }

    // 🧠 FASE 6: Paginação
    const startIndex = (filtros.page - 1) * filtros.pageSize;
    const endIndex = startIndex + filtros.pageSize;
    const empresasPaginadas = empresasOrdenadas.slice(startIndex, endIndex);
    
    console.log('[ProspeccaoAvancada] ✅ Total final:', empresasOrdenadas.length, '| Página:', filtros.page, '| Mostrando:', empresasPaginadas.length);

    // 🔥 PASSO G: Calcular has_more (se há mais candidatas disponíveis)
    const has_more = empresasOrdenadas.length > endIndex;

    // 🔥 PASSO H: Persistência (opcional - será feito no frontend)
    // Nota: Frontend salvará em prospects_raw após receber resposta

    // Montar resposta final
    const resposta: ResponseBusca = {
      sucesso: true,
      empresas: empresasPaginadas,
      total: empresasOrdenadas.length,
      page: filtros.page,
      pageSize: filtros.pageSize,
      has_more,
      diagnostics,
    };
    
    console.log('[ProspeccaoAvancada] 📤 Retornando resposta:', {
      sucesso: resposta.sucesso,
      total: resposta.total,
      has_more: resposta.has_more,
      diagnostics: resposta.diagnostics,
    });

    return new Response(
      JSON.stringify(resposta),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro:', error);
    return new Response(
      JSON.stringify({
        sucesso: false,
        error: 'Erro ao buscar empresas',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
        empresas: [],
        total: 0,
        page: 1,
        pageSize: 20,
        has_more: false,
      } as ResponseBusca),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
