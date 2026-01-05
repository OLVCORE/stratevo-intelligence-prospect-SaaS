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
  // Novos campos (igual Aba 3 do onboarding)
  cnaesAlvo?: string[]; // CNAEs que o usuário quer buscar (NÃO do tenant!)
  ncmsAlvo?: string[]; // NCMs que o usuário quer buscar
  caracteristicasEspeciais?: string[]; // Características especiais desejadas
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
 * ⚠️ REMOVIDO: loadTenantICP() e combineFilters()
 * 
 * NÃO devemos usar CNAEs do ICP do tenant porque:
 * - O tenant pode buscar empresas de setores diferentes do seu próprio CNAE
 * - Ex: Consultoria busca empresas de logística, manufatura, etc.
 * - Ex: Metal Life busca academias, lojas esportivas (consumidores de produtos de pilates)
 * 
 * A busca deve usar APENAS os filtros do formulário (incluindo CNAEs/NCMs do formulário).
 */

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
 * Buscar CNAEs por Setor/Categoria via Supabase
 * FASE 1: Filtragem inteligente usando tabela cnae_classifications
 */
async function buscarCNAEsPorSetorCategoria(
  supabaseClient: any,
  setor?: string,
  categoria?: string
): Promise<string[]> {
  if (!setor && !categoria) {
    return [];
  }

  try {
    let query = supabaseClient
      .from('cnae_classifications')
      .select('cnae_code');

    if (setor) {
      query = query.eq('setor_industria', setor);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.warn('[ProspeccaoAvancada] ⚠️ Erro ao buscar CNAEs por Setor/Categoria:', error);
      return [];
    }

    const cnaes = (data || []).map((row: any) => row.cnae_code).filter(Boolean);
    console.log('[ProspeccaoAvancada] 🔍 CNAEs encontrados por Setor/Categoria:', cnaes.length);
    return cnaes;
  } catch (error) {
    console.error('[ProspeccaoAvancada] ❌ Erro ao buscar CNAEs:', error);
    return [];
  }
}

/**
 * 🔥 PILAR 1: Buscar via Oportunidados
 * Fonte complementar com alertas de novas empresas e filtros avançados
 * Link: https://oportunidados.com.br/
 * 
 * O que oferece:
 * - Lista de Empresas (20+ filtros avançados)
 * - Alertas de Novas Empresas (leads frescos)
 * - GeoMarketing (inteligência geoespacial)
 * - API de Dados Estratégicos
 * 
 * TODO: Implementar quando API key estiver disponível
 */
async function buscarViaOportunidados(
  filtros: FiltrosBusca,
  metaCandidates: number
): Promise<any[]> {
  const oportunidadosKey = Deno.env.get('OPORTUNIDADOS_API_KEY');
  if (!oportunidadosKey) {
    console.log('[ProspeccaoAvancada] ⏳ Oportunidados: API key não configurada');
    return [];
  }

  // TODO: Implementar chamada real à API Oportunidados
  // Verificar documentação em: https://oportunidados.com.br/
  // Endpoints prováveis:
  // - GET /api/empresas?cnae=...&localizacao=...&porte=...
  // - GET /api/novas-empresas (alertas)
  
  console.log('[ProspeccaoAvancada] ⏳ Oportunidados: API não implementada ainda (aguardando documentação)');
  return [];
}

/**
 * ⚠️ REMOVIDO: BaseCNPJ, Consultar.IO
 * 
 * Motivos:
 * - BaseCNPJ: Redundante (já temos BrasilAPI/ReceitaWS para enriquecimento)
 * - Consultar.IO: Foco em pessoa física, não busca em massa de empresas
 * 
 * FONTES:
 * - EmpresaQui: Fonte principal (já integrada e funcionando)
 * - Oportunidados: Fonte complementar (aguardando implementação)
 */

/**
 * 🔥 PILAR 1: Merge e deduplicação de múltiplas fontes
 * Combina resultados de EmpresaQui + Oportunidados e remove duplicados por CNPJ
 */
function mergeEFiltrarEmpresas(
  resultados: any[][],
  metaCandidates: number
): any[] {
  const seenCNPJs = new Set<string>();
  const empresasUnicas: any[] = [];

  // Processar cada fonte
  for (const fonteResultados of resultados) {
    for (const empresa of fonteResultados) {
      const cnpj = empresa.cnpj ? empresa.cnpj.replace(/\D/g, '') : null;
      
      if (cnpj && cnpj.length === 14 && !seenCNPJs.has(cnpj)) {
        seenCNPJs.add(cnpj);
        empresasUnicas.push(empresa);
        
        if (empresasUnicas.length >= metaCandidates) {
          break;
        }
      }
    }
    
    if (empresasUnicas.length >= metaCandidates) {
      break;
    }
  }

  console.log('[ProspeccaoAvancada] ✅ Merge concluído:', empresasUnicas.length, 'empresas únicas de', resultados.length, 'fontes');
  return empresasUnicas;
}

/**
 * Buscar empresas via EmpresaQui
 * Usa APENAS os filtros do formulário (incluindo CNAEs/NCMs do formulário)
 * ⚠️ NÃO usa CNAEs do ICP do tenant!
 * FASE 1: Adicionada filtragem inteligente por Setor/Categoria
 */
async function buscarViaEmpresaQui(
  filtros: FiltrosBusca, 
  metaCandidates: number,
  supabaseClient?: any
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

    // 🎯 ESTRATÉGIA: Priorizar CNAEs do FORMULÁRIO, depois Setor/Categoria, depois segmento, depois localização
    let cnaes: string[] = [];
    
    // Prioridade 1: CNAEs do FORMULÁRIO (mais preciso - o usuário escolheu!)
    if (filtros.cnaesAlvo && filtros.cnaesAlvo.length > 0) {
      cnaes = filtros.cnaesAlvo;
      console.log('[ProspeccaoAvancada] 🎯 Usando CNAEs do FORMULÁRIO:', cnaes.length, 'CNAEs');
    } 
    // Prioridade 2: 🔥 FASE 1 - Buscar CNAEs por Setor/Categoria (se especificado no segmento)
    else if (filtros.segmento && supabaseClient) {
      // Tentar mapear segmento para Setor/Categoria e buscar CNAEs relacionados
      // Ex: "Tecnologia" → Setor "Tecnologia da Informação" → CNAEs relacionados
      const segmentoLower = filtros.segmento.toLowerCase();
      
      // Mapear segmentos comuns para Setores
      let setorMapeado: string | undefined;
      if (segmentoLower.includes('tecnologia') || segmentoLower.includes('ti') || segmentoLower.includes('software')) {
        setorMapeado = 'Tecnologia da Informação';
      } else if (segmentoLower.includes('manufatura') || segmentoLower.includes('indústria') || segmentoLower.includes('industria')) {
        setorMapeado = 'Indústria';
      } else if (segmentoLower.includes('comércio') || segmentoLower.includes('comercio') || segmentoLower.includes('varejo')) {
        setorMapeado = 'Comércio';
      } else if (segmentoLower.includes('serviços') || segmentoLower.includes('servicos')) {
        setorMapeado = 'Serviços';
      }
      
      if (setorMapeado) {
        const cnaesPorSetor = await buscarCNAEsPorSetorCategoria(supabaseClient, setorMapeado);
        if (cnaesPorSetor.length > 0) {
          cnaes = cnaesPorSetor.slice(0, 10); // Limitar a 10 CNAEs principais
          console.log('[ProspeccaoAvancada] 🔍 CNAEs encontrados por Setor:', cnaes.length, 'Setor:', setorMapeado);
        }
      }
      
      // Se não encontrou por Setor, usar mapeamento tradicional
      if (cnaes.length === 0) {
        cnaes = mapearSegmentoParaCNAEs(filtros.segmento);
        console.log('[ProspeccaoAvancada] 📝 Mapeando segmento para CNAEs (fallback):', cnaes.length, 'CNAEs');
      }
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
          console.log('[ProspeccaoAvancada] 🔗 URL completa:', url);
          console.log('[ProspeccaoAvancada] 🔑 API Key (preview):', empresaQuiKey.substring(0, 10) + '...');
          
          // Retry com backoff para resolver problemas de DNS/conectividade
          let response: Response | null = null;
          let lastError: Error | null = null;
          
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              if (attempt > 0) {
                const delay = attempt * 1000; // 1s, 2s
                console.log(`[ProspeccaoAvancada] 🔄 Retry ${attempt + 1}/3 após ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              
              response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${empresaQuiKey}`,
                  'Content-Type': 'application/json',
                },
                // Timeout de 10 segundos
                signal: AbortSignal.timeout(10000),
              });
              
              if (response.ok) {
                break; // Sucesso, sair do loop
              }
            } catch (error: any) {
              lastError = error;
              const errorMsg = error?.message || String(error);
              
              // Se for erro DNS, tentar novamente
              if (errorMsg.includes('dns error') || errorMsg.includes('failed to lookup')) {
                console.warn(`[ProspeccaoAvancada] ⚠️ Erro DNS na tentativa ${attempt + 1}/3:`, errorMsg);
                if (attempt === 2) {
                  // Última tentativa falhou
                  console.error('[ProspeccaoAvancada] ❌ Erro DNS persistente após 3 tentativas');
                }
                continue; // Tentar novamente
              } else {
                // Outro tipo de erro, não tentar novamente
                throw error;
              }
            }
          }
          
          if (!response) {
            throw lastError || new Error('Falha ao conectar com API EmpresaQui após 3 tentativas');
          }

          if (response.ok) {
            const data = await response.json();
            const empresas = data.empresas || data.data || [];
            console.log('[ProspeccaoAvancada] ✅ CNAE', cnae, 'retornou:', empresas.length, 'empresas');
            console.log('[ProspeccaoAvancada] 📋 Estrutura resposta EmpresaQui:', {
              hasEmpresas: !!data.empresas,
              hasData: !!data.data,
              empresasLength: empresas.length,
              primeiraEmpresa: empresas[0] ? {
                cnpj: empresas[0].cnpj,
                razao_social: empresas[0].razao_social || empresas[0].nome,
                temCNPJ: !!empresas[0].cnpj
              } : null
            });
            
            for (const emp of empresas) {
              if (emp.cnpj && emp.cnpj.length >= 14 && !seenCNPJs.has(emp.cnpj)) {
                seenCNPJs.add(emp.cnpj);
                resultados.push(emp);
              } else if (!emp.cnpj) {
                console.warn('[ProspeccaoAvancada] ⚠️ Empresa sem CNPJ válido:', emp.razao_social || emp.nome);
              }
            }
          } else {
            const errorText = await response.text();
            console.error('[ProspeccaoAvancada] ❌ Erro busca CNAE:', response.status, errorText.substring(0, 500));
            console.error('[ProspeccaoAvancada] ❌ URL chamada:', url);
            console.error('[ProspeccaoAvancada] ❌ Headers:', {
              hasAuth: !!empresaQuiKey,
              authLength: empresaQuiKey?.length || 0
            });
          }
        } catch (error: any) {
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes('dns error') || errorMsg.includes('failed to lookup')) {
            console.error('[ProspeccaoAvancada] ❌ Erro DNS ao buscar CNAE:', errorMsg);
            console.error('[ProspeccaoAvancada] ⚠️ Problema de conectividade com api.empresaqui.com.br');
          } else {
            console.error('[ProspeccaoAvancada] ❌ Erro busca CNAE:', error);
          }
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
        
        // Retry com backoff para resolver problemas de DNS/conectividade
        let response: Response | null = null;
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (attempt > 0) {
              const delay = attempt * 1000;
              console.log(`[ProspeccaoAvancada] 🔄 Retry localização ${attempt + 1}/3 após ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${empresaQuiKey}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(10000),
            });
            
            if (response.ok) {
              break;
            }
          } catch (error: any) {
            lastError = error;
            const errorMsg = error?.message || String(error);
            if (errorMsg.includes('dns error') || errorMsg.includes('failed to lookup')) {
              console.warn(`[ProspeccaoAvancada] ⚠️ Erro DNS localização tentativa ${attempt + 1}/3`);
              if (attempt === 2) {
                console.error('[ProspeccaoAvancada] ❌ Erro DNS persistente após 3 tentativas');
              }
              continue;
            } else {
              throw error;
            }
          }
        }
        
        if (!response) {
          throw lastError || new Error('Falha ao conectar com API EmpresaQui após 3 tentativas');
        }

        if (response.ok) {
          const data = await response.json();
          const empresas = data.empresas || data.data || [];
          console.log('[ProspeccaoAvancada] ✅ Busca por localização retornou:', empresas.length);
          console.log('[ProspeccaoAvancada] 📋 Estrutura resposta localização:', {
            hasEmpresas: !!data.empresas,
            hasData: !!data.data,
            empresasLength: empresas.length,
            primeiraEmpresa: empresas[0] ? {
              cnpj: empresas[0].cnpj,
              razao_social: empresas[0].razao_social || empresas[0].nome,
              temCNPJ: !!empresas[0].cnpj
            } : null
          });
          
          for (const emp of empresas) {
            if (emp.cnpj && emp.cnpj.length >= 14 && !seenCNPJs.has(emp.cnpj) && resultados.length < metaCandidates) {
              seenCNPJs.add(emp.cnpj);
              resultados.push(emp);
            } else if (!emp.cnpj) {
              console.warn('[ProspeccaoAvancada] ⚠️ Empresa sem CNPJ válido (localização):', emp.razao_social || emp.nome);
            }
          }
        } else {
          const errorText = await response.text();
          console.error('[ProspeccaoAvancada] ❌ Erro busca localização:', response.status, errorText.substring(0, 500));
          console.error('[ProspeccaoAvancada] ❌ URL chamada:', url);
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes('dns error') || errorMsg.includes('failed to lookup')) {
          console.error('[ProspeccaoAvancada] ❌ Erro DNS ao buscar localização:', errorMsg);
          console.error('[ProspeccaoAvancada] ⚠️ Problema de conectividade com api.empresaqui.com.br');
        } else {
          console.error('[ProspeccaoAvancada] ❌ Erro busca localização:', error);
        }
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
        } catch (error: any) {
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes('dns error') || errorMsg.includes('failed to lookup')) {
            console.error('[ProspeccaoAvancada] ❌ Erro DNS ao buscar porte:', errorMsg);
            console.error('[ProspeccaoAvancada] ⚠️ Problema de conectividade com api.empresaqui.com.br');
          } else {
            console.error('[ProspeccaoAvancada] ❌ Erro busca porte:', error);
          }
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
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('dns error') || errorMsg.includes('failed to lookup')) {
      console.error('[ProspeccaoAvancada] ❌ Erro DNS crítico no EmpresaQui:', errorMsg);
      console.error('[ProspeccaoAvancada] ⚠️ Não foi possível resolver DNS de api.empresaqui.com.br');
      console.error('[ProspeccaoAvancada] 💡 Verifique: 1) URL da API está correta? 2) API está online? 3) Problema temporário de rede?');
    } else {
      console.error('[ProspeccaoAvancada] ❌ Erro EmpresaQui:', error);
    }
    return [];
  }
}

/**
 * Buscar dados cadastrais (BrasilAPI V2 → V1 → ReceitaWS)
 * FASE 1: Atualizado para usar BrasilAPI V2 (mais completo e rápido)
 */
async function buscarDadosCadastrais(cnpj: string): Promise<any> {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // 🔥 FASE 1: Tentar BrasilAPI V2 primeiro (mais completo, mais rápido)
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v2/${cleanCNPJ}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      console.log('[ProspeccaoAvancada] ✅ BrasilAPI V2:', data.razao_social || data.nome);
      return data;
    }
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ BrasilAPI V2 falhou, tentando V1...');
  }

  // Fallback 1: BrasilAPI V1
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    if (response.ok) {
      const data = await response.json();
      console.log('[ProspeccaoAvancada] ✅ BrasilAPI V1:', data.razao_social);
      return data;
    }
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ BrasilAPI V1 falhou, tentando ReceitaWS...');
  }

  // Fallback 2: ReceitaWS
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
 * Buscar CEP via BrasilAPI V2
 * FASE 1: Adicionado para enriquecer endereços
 */
async function buscarCEP(cep: string): Promise<any> {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      console.log('[ProspeccaoAvancada] ✅ CEP V2 encontrado:', data.city);
      return data;
    }
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ CEP V2 falhou');
  }

  return null;
}

/**
 * Buscar NCM via BrasilAPI
 * FASE 1: Adicionado para validação de NCMs do formulário
 */
async function buscarNCM(ncmCode: string): Promise<any> {
  const cleanNCM = ncmCode.replace(/\D/g, '').substring(0, 8);
  if (cleanNCM.length < 4) {
    return null;
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/ncm/v1/${cleanNCM}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      console.log('[ProspeccaoAvancada] ✅ NCM encontrado:', data.descricao);
      return data;
    }
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ NCM falhou');
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
 * Buscar LinkedIn via PhantomBuster
 * FASE 2: Integração completa do PhantomBuster para scraping de LinkedIn
 */
async function buscarLinkedInPhantomBuster(domain: string, companyName: string): Promise<any> {
  const phantomKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
  const phantomAgentId = Deno.env.get('PHANTOM_LINKEDIN_COMPANY_AGENT_ID');
  const linkedinSessionCookie = Deno.env.get('LINKEDIN_SESSION_COOKIE');
  
  if (!phantomKey || !phantomAgentId || !linkedinSessionCookie) {
    // PhantomBuster não configurado - não é crítico, continuar sem
    return null;
  }

  try {
    // Buscar URL do LinkedIn da empresa via busca
    // Nota: PhantomBuster precisa da URL completa do LinkedIn, não apenas do domínio
    // Por enquanto, retornamos null e deixamos o Apollo buscar o LinkedIn
    // (O Apollo já retorna LinkedIn URLs nos decisores)
    
    // TODO: Implementar busca de LinkedIn URL via PhantomBuster Company Search
    // Por enquanto, retornamos null para não bloquear o processo
    return null;
  } catch (error) {
    console.warn('[ProspeccaoAvancada] ⚠️ PhantomBuster falhou (não crítico):', error);
    return null;
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
    // Novos campos (CNAEs, NCMs, Características)
    cnaesAlvo: Array.isArray(filtros.cnaesAlvo) ? filtros.cnaesAlvo.filter((c: any) => typeof c === 'string' && c.trim().length > 0).slice(0, 10) : undefined,
    ncmsAlvo: Array.isArray(filtros.ncmsAlvo) ? filtros.ncmsAlvo.filter((n: any) => typeof n === 'string' && n.trim().length > 0).slice(0, 10) : undefined,
    caracteristicasEspeciais: Array.isArray(filtros.caracteristicasEspeciais) ? filtros.caracteristicasEspeciais.filter((c: any) => typeof c === 'string' && c.trim().length > 0) : undefined,
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
 * 🔥 PILAR 2: Score de Qualidade (0-100)
 * Mede completude, atualização e confiabilidade dos dados
 */
function calculateQualidadeScore(empresa: EmpresaEnriquecida): number {
  let score = 0;

  // ==========================================
  // COMPLETUDE (0-40 pontos)
  // ==========================================
  
  // Todos os campos básicos: +20
  if (empresa.cnpj && empresa.razao_social && empresa.endereco && empresa.cidade && empresa.uf && empresa.cep) {
    score += 20;
  } else if (empresa.cnpj && empresa.razao_social && empresa.cidade && empresa.uf) {
    score += 12; // Parcial
  } else if (empresa.cnpj && empresa.razao_social) {
    score += 6; // Mínimo
  }

  // Dados de contato: +10
  if (empresa.telefones && empresa.telefones.length > 0 && empresa.emails && empresa.emails.length > 0) {
    score += 10;
  } else if (empresa.telefones?.length > 0 || empresa.emails?.length > 0) {
    score += 5; // Parcial
  }

  // Dados financeiros: +10
  if (empresa.faturamento_estimado && empresa.funcionarios_estimados && empresa.capital_social) {
    score += 10;
  } else if (empresa.faturamento_estimado || empresa.funcionarios_estimados || empresa.capital_social) {
    score += 5; // Parcial
  }

  // ==========================================
  // ATUALIZAÇÃO (0-30 pontos)
  // ==========================================
  
  // Site ativo (assumimos que se está no resultado, está ativo): +15
  if (empresa.site) {
    score += 15;
  }

  // LinkedIn ativo: +10
  if (empresa.linkedin) {
    score += 10;
  }

  // Decisores recentes: +5
  if (empresa.decisores && empresa.decisores.length > 0) {
    score += 5;
  }

  // ==========================================
  // CONFIABILIDADE (0-30 pontos)
  // ==========================================
  
  // CNPJ válido (14 dígitos): +10
  if (empresa.cnpj && empresa.cnpj.length === 14) {
    score += 10;
  }

  // Múltiplas fontes confirmam (site + LinkedIn + decisores): +15
  const fontesConfirmadas = [
    empresa.site ? 1 : 0,
    empresa.linkedin ? 1 : 0,
    empresa.decisores && empresa.decisores.length > 0 ? 1 : 0,
    empresa.emails && empresa.emails.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);
  
  if (fontesConfirmadas >= 3) {
    score += 15;
  } else if (fontesConfirmadas >= 2) {
    score += 10; // Parcial
  } else if (fontesConfirmadas >= 1) {
    score += 5; // Mínimo
  }

  // Dados consistentes (nome + endereço + cidade/UF): +5
  if (empresa.razao_social && empresa.cidade && empresa.uf) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * 🔥 PILAR 2: Score de Relevância (0-100)
 * Mede match com filtros do usuário + qualidade de dados
 * FASE 1: Melhorado para incluir qualidade e completude
 * Baseado em completude de dados + qualidade dos dados
 * ⚠️ NÃO usa ICP do tenant - estamos buscando empresas distintas!
 */
function calculateRelevanciaScore(empresa: EmpresaEnriquecida, filtros?: FiltrosBusca): number {
  let score = 0;

  // ==========================================
  // COMPLETUDE DE DADOS (0-50 pontos)
  // ==========================================
  
  // Dados cadastrais básicos completos: +15
  if (empresa.cnpj && empresa.razao_social && empresa.cidade && empresa.uf) {
    score += 15;
  } else if (empresa.cnpj && empresa.razao_social) {
    score += 10; // Parcial
  }

  // Endereço completo: +10
  if (empresa.endereco && empresa.cep) {
    score += 10;
  } else if (empresa.endereco || empresa.cep) {
    score += 5; // Parcial
  }

  // Contato completo: +10
  if (empresa.telefones && empresa.telefones.length > 0) {
    score += 5;
  }
  if (empresa.emails && empresa.emails.length > 0) {
    score += 5;
  }

  // Dados financeiros: +10
  if (empresa.faturamento_estimado || empresa.capital_social) {
    score += 10;
  }

  // ==========================================
  // QUALIDADE DOS DADOS (0-30 pontos)
  // ==========================================
  
  // Presença digital (site + LinkedIn): +15
  if (empresa.site && empresa.linkedin) {
    score += 15;
  } else if (empresa.site || empresa.linkedin) {
    score += 8; // Parcial
  }

  // Decisores encontrados: +15
  if (empresa.decisores && empresa.decisores.length > 0) {
    const decisoresComEmail = empresa.decisores.filter(d => d.email).length;
    const decisoresComLinkedIn = empresa.decisores.filter(d => d.linkedin).length;
    
    // Bonus por decisores com contato completo
    if (decisoresComEmail > 0 && decisoresComLinkedIn > 0) {
      score += 15;
    } else if (decisoresComEmail > 0 || decisoresComLinkedIn > 0) {
      score += 10; // Parcial
    } else {
      score += 5; // Apenas nome/cargo
    }
  }

  // ==========================================
  // VALIDAÇÃO E CONFIABILIDADE (0-20 pontos)
  // ==========================================
  
  // CNPJ válido e situação ATIVA: +20
  if (empresa.cnpj && empresa.cnpj.length === 14) {
    score += 10; // CNPJ válido
    // Situação cadastral será validada no filtro, mas aqui damos bonus se tiver
  }

  // Dados consistentes (nome + endereço + cidade/UF): +10
  if (empresa.razao_social && empresa.cidade && empresa.uf) {
    score += 10;
  }

  return Math.min(100, score);
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
    
    // Log parcial da API key para verificação (primeiros 10 caracteres)
    if (empresaQuiKey) {
      const keyPreview = empresaQuiKey.substring(0, 10) + '...';
      console.log('[ProspeccaoAvancada] 🔑 API Key detectada (preview):', keyPreview, '| Tamanho:', empresaQuiKey.length);
      
      // Verificar se começa com a8725d0dbe (chave fornecida pelo usuário)
      if (empresaQuiKey.startsWith('a8725d0dbe')) {
        console.log('[ProspeccaoAvancada] ✅ API Key confirmada: começa com a8725d0dbe');
      } else {
        console.warn('[ProspeccaoAvancada] ⚠️ API Key diferente da esperada. Esperado: a8725d0dbe..., Recebido:', keyPreview);
      }
    }
    
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

    // Normalizar filtros
    const filtros = normalizarFiltros(filtrosRaw || {});
    
    // ⚠️ IMPORTANTE: NÃO usar ICP do tenant!
    // O tenant pode buscar empresas de setores diferentes do seu próprio CNAE.
    // Usamos APENAS os filtros do formulário (incluindo CNAEs/NCMs do formulário).
    
    const { cidade, uf } = parseLocalizacao(filtros.localizacao);
    
    console.log('[ProspeccaoAvancada] 📥 Request recebido:', { 
      filtros,
      cnaesAlvo: filtros.cnaesAlvo?.length || 0,
      ncmsAlvo: filtros.ncmsAlvo?.length || 0,
      caracteristicasEspeciais: filtros.caracteristicasEspeciais?.length || 0,
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

    // 🔥 PILAR 1: Buscar candidatas em múltiplas fontes (EmpresaQui + Oportunidados)
    // EmpresaQui: Fonte principal (busca por CNAE/localização/porte)
    // Oportunidados: Fonte complementar (filtros avançados, novas empresas)
    console.log('[ProspeccaoAvancada] 🔍 Buscando candidatas em múltiplas fontes...');
    
    const filtrosComLocalizacao = {
      ...filtros,
      localizacao: cidade && uf ? `${cidade}, ${uf}` : filtros.localizacao,
    };
    
    // Buscar em paralelo: EmpresaQui (principal) + Oportunidados (complementar)
    const [empresaQuiResult, oportunidadosResult] = await Promise.allSettled([
      buscarViaEmpresaQui(filtrosComLocalizacao, metaCandidates, supabaseClient),
      buscarViaOportunidados(filtrosComLocalizacao, metaCandidates),
    ]);

    // Extrair resultados
    const resultadosPorFonte: any[][] = [];
    
    if (empresaQuiResult.status === 'fulfilled') {
      resultadosPorFonte.push(empresaQuiResult.value);
      console.log('[ProspeccaoAvancada] ✅ EmpresaQui:', empresaQuiResult.value.length, 'empresas');
    } else {
      console.error('[ProspeccaoAvancada] ❌ EmpresaQui falhou:', empresaQuiResult.reason);
      resultadosPorFonte.push([]);
    }
    
    if (oportunidadosResult.status === 'fulfilled') {
      resultadosPorFonte.push(oportunidadosResult.value);
      console.log('[ProspeccaoAvancada] ✅ Oportunidados:', oportunidadosResult.value.length, 'empresas');
    } else {
      console.warn('[ProspeccaoAvancada] ⚠️ Oportunidados falhou ou não implementado:', oportunidadosResult.reason?.message || 'N/A');
      resultadosPorFonte.push([]);
    }

    // Merge e deduplicação por CNPJ
    const empresaQuiCompanies = mergeEFiltrarEmpresas(resultadosPorFonte, metaCandidates);
    
    diagnostics.candidates_collected = empresaQuiCompanies.length;
    console.log('[ProspeccaoAvancada] 📊 Candidatas coletadas (após merge):', diagnostics.candidates_collected);
    
    if (empresaQuiCompanies.length === 0) {
      console.warn('[ProspeccaoAvancada] ⚠️ NENHUMA candidata encontrada após merge de todas as fontes!');
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

    // 🔥 PILAR 3: Validação e Filtragem Avançada (ANTES de enriquecer)
    // - Situação cadastral (apenas ATIVAS)
    // - Atividade real (site, LinkedIn, e-mail)
    // - Filtragem por CNAE usando Setor/Categoria
    console.log('[ProspeccaoAvancada] 🔍 Validando e filtrando candidatas...');
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
      
      // 🔥 FASE 1: Validação rigorosa de situação cadastral
      // Aceitar apenas: ATIVA, ATIVO, ou vazio (será validado no enriquecimento)
      const situacao = empresa.situacao_cadastral || empresa.situacao || empresa.descricao_situacao_cadastral || '';
      const situacaoUpper = situacao.toUpperCase().trim();
      
      // Rejeitar explicitamente: BAIXADA, CANCELADA, INAPTA, SUSPENSA, etc.
      const situacoesInvalidas = [
        'BAIXADA', 'CANCELADA', 'INAPTA', 'SUSPENSA', 'INAPTA POR OMISSÃO',
        'CANCELADA POR OMISSÃO', 'EXTINTA', 'INEXISTENTE', 'NULA'
      ];
      
      if (situacaoUpper && situacoesInvalidas.some(inv => situacaoUpper.includes(inv))) {
        console.log('[ProspeccaoAvancada] ⚠️ Empresa rejeitada por situação:', situacaoUpper, empresa.razao_social);
        diagnostics.dropped++;
        return false;
      }
      
      // Aceitar apenas ATIVA/ATIVO ou vazio (será validado depois)
      if (situacaoUpper && !situacaoUpper.includes('ATIVA') && !situacaoUpper.includes('ATIVO')) {
        // Se tiver situação mas não for ATIVA, rejeitar
        console.log('[ProspeccaoAvancada] ⚠️ Empresa rejeitada por situação não-ATIVA:', situacaoUpper, empresa.razao_social);
        diagnostics.dropped++;
        return false;
      }
      
      return true;
    });
    
    diagnostics.candidates_after_filter = candidatasValidadas.length;
    console.log('[ProspeccaoAvancada] ✅ Candidatas validadas:', diagnostics.candidates_after_filter);

    // 🔥 PILAR 4: Enriquecimento Multi-Camada (COM LIMITES E TIMEOUT)
    // 🔥 PILAR 5: Batching otimizado (5 empresas em paralelo)
    console.log('[ProspeccaoAvancada] 🔄 Enriquecendo candidatas (multi-camada)...');
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
              
              // 🔥 PILAR 4: Camada 1 - Buscar dados cadastrais (com cache de 7 dias)
              const receitaData = empresa.cnpj ? await buscarDadosCadastraisComCache(empresa.cnpj, supabaseClient) : null;
              
              // 🔥 FASE 1: Validar situação cadastral APÓS buscar dados cadastrais
              if (receitaData) {
                const situacao = receitaData.situacao_cadastral || receitaData.descricao_situacao_cadastral || receitaData.codigo_situacao_cadastral || '';
                const situacaoUpper = situacao.toUpperCase().trim();
                
                // Rejeitar se não for ATIVA
                if (situacaoUpper && !situacaoUpper.includes('ATIVA') && !situacaoUpper.includes('ATIVO') && situacaoUpper !== '2') {
                  // Código 2 = ATIVA na Receita Federal
                  console.log('[ProspeccaoAvancada] ⚠️ Empresa rejeitada após enriquecimento (situação):', situacaoUpper, empresa.razao_social);
                  diagnostics.dropped++;
                  return null;
                }
              }
              
              // 🔥 FASE 1: Enriquecer CEP via BrasilAPI V2 (se tiver CEP)
              let cepData = null;
              if (receitaData?.cep || empresa.cep) {
                const cepToSearch = receitaData?.cep || empresa.cep;
                cepData = await buscarCEP(cepToSearch);
              }
              
              // Extrair domínio
              const domain = extractDomain(empresa.website || receitaData?.website || '');
              if (domain && seenDomains.has(domain)) return null;
              if (domain) seenDomains.add(domain);
              
              // 🔥 PILAR 4: Enriquecimento Multi-Camada (5 camadas)
              // Camada 2: Dados Digitais (site, LinkedIn, e-mails) - paralelo
              // Camada 3: Decisores e Contatos (Apollo + PhantomBuster) - paralelo
              // Camada 4: Dados Financeiros (já buscado na Camada 1 via ReceitaWS)
              // Camada 5: Dados Contextuais (opcional, mais lento - não implementado ainda)
              
              const [decisores, emails, linkedinData] = await Promise.all([
                // Camada 3: Decisores (Apollo)
                buscarDecisoresApollo(
                  empresa.razao_social || receitaData?.razao_social || receitaData?.nome || '',
                  domain || undefined
                ),
                // Camada 2: E-mails (Hunter.io)
                domain ? buscarEmailsHunter(domain) : Promise.resolve([]),
                // Camada 2: LinkedIn (PhantomBuster)
                domain ? buscarLinkedInPhantomBuster(domain, empresa.razao_social || receitaData?.razao_social || '') : Promise.resolve(null),
              ]);
              
              // Camada 4: Dados Financeiros (já obtidos via ReceitaWS/BrasilAPI na Camada 1)
              // faturamento_estimado, funcionarios_estimados, capital_social já estão em receitaData
              
              const empresaEnriquecida: EmpresaEnriquecida = {
                razao_social: empresa.razao_social || receitaData?.razao_social || receitaData?.nome || 'N/A',
                nome_fantasia: empresa.nome_fantasia || receitaData?.fantasia || receitaData?.nome_fantasia,
                cnpj: empresa.cnpj,
                endereco: receitaData?.logradouro 
                  ? `${receitaData.logradouro}, ${receitaData.numero || ''} ${receitaData.complemento || ''}`.trim()
                  : (empresa.logradouro ? `${empresa.logradouro}, ${empresa.numero || ''}`.trim() : undefined),
                cidade: cepData?.city || receitaData?.municipio || receitaData?.cidade || empresa.municipio || empresa.cidade,
                uf: cepData?.state || receitaData?.uf || receitaData?.estado || empresa.uf,
                cep: receitaData?.cep || empresa.cep || cepData?.cep,
                site: empresa.website || receitaData?.website,
                linkedin: linkedinData?.linkedinUrl || linkedinData?.companyUrl || (decisores.length > 0 && decisores[0]?.linkedin ? decisores[0].linkedin : undefined),
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

    // 🔥 PILAR 2: Classificar e Scorear empresas (Relevância + Qualidade)
    console.log('[ProspeccaoAvancada] 📊 Calculando scores (Relevância + Qualidade)...');
    const empresasComScore = empresasFiltradas.map((emp) => {
      // Score de Relevância (match com filtros + dados básicos + enriquecimento)
      const relevanciaScore = calculateRelevanciaScore(emp, filtros);
      
      // Score de Qualidade (completude + atualização + confiabilidade)
      const qualidadeScore = calculateQualidadeScore(emp);
      
      // Score Total = média ponderada (60% relevância + 40% qualidade)
      const scoreTotal = Math.round((relevanciaScore * 0.6) + (qualidadeScore * 0.4));
      
      return {
        ...emp,
        _relevancia_score: relevanciaScore,
        _qualidade_score: qualidadeScore,
        _score_total: scoreTotal,
      };
    });

    // Ordenar por Score Total (DESC)
    empresasComScore.sort((a, b) => {
      // Ordenar por: Score Total (Relevância)
      return b._score_total - a._score_total;
    });

    // Remover campos internos de score antes de retornar
    const empresasOrdenadas = empresasComScore.map(({ _relevancia_score, _qualidade_score, _score_total, ...emp }) => emp);

    console.log('[ProspeccaoAvancada] ✅ Empresas ordenadas por score:', empresasOrdenadas.length);
    if (empresasOrdenadas.length > 0) {
      console.log('[ProspeccaoAvancada] 📊 Top 3 scores:', empresasComScore.slice(0, 3).map((e, i) => ({
        rank: i + 1,
        empresa: e.razao_social,
        relevancia_score: e._relevancia_score,
        qualidade_score: e._qualidade_score,
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
