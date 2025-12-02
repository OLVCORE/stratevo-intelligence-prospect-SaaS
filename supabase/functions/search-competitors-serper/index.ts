/**
 * 🔍 Busca de Concorrentes e Fornecedores via SERPER API
 * Edge Function para descobrir concorrentes automaticamente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface SerperResult {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
}

interface CompetitorCandidate {
  nome: string;
  website: string;
  descricao: string;
  relevancia: number;
  fonte: 'serper';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      industry, 
      products = [], 
      location, 
      excludeDomains = [],
      maxResults = 10 
    } = await req.json();

    console.log('[SERPER Search] Iniciando busca:', { industry, products, location, maxResults });

    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    // Construir query de busca inteligente
    const productTerms = products.slice(0, 3).join(' OR ');
    const query = location
      ? `${industry} ${productTerms} fornecedor Brasil ${location}`
      : `${industry} ${productTerms} fornecedor Brasil`;

    console.log('[SERPER Search] Query:', query);

    // Chamar SERPER API
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'br', // Brasil
        hl: 'pt', // Português
        num: maxResults * 2, // Pegar mais resultados para filtrar
      }),
    });

    if (!serperResponse.ok) {
      throw new Error(`Erro na API SERPER: ${serperResponse.status}`);
    }

    const serperData: SerperResult = await serperResponse.json();

    console.log('[SERPER Search] Resultados recebidos:', serperData.organic?.length || 0);

    // Processar e filtrar resultados
    const candidates: CompetitorCandidate[] = [];
    const seenDomains = new Set<string>();

    for (const result of serperData.organic || []) {
      try {
        // Extrair domínio
        const url = new URL(result.link);
        const domain = url.hostname.replace('www.', '');

        // Filtrar domínios excluídos e duplicados
        if (excludeDomains.includes(domain) || seenDomains.has(domain)) {
          continue;
        }

        // Filtrar marketplaces e sites genéricos
        const isMarketplace = [
          'mercadolivre',
          'amazon',
          'alibaba',
          'aliexpress',
          'americanas',
          'magazineluiza',
          'casasbahia',
          'pontofrio',
        ].some(m => domain.includes(m));

        if (isMarketplace) continue;

        seenDomains.add(domain);

        // Calcular relevância baseada em:
        // - Posição no resultado (1-10)
        // - Palavras-chave no título
        // - Palavras-chave no snippet
        let relevancia = 100 - (result.position * 5); // Base: posição

        const titleLower = result.title.toLowerCase();
        const snippetLower = result.snippet.toLowerCase();

        if (titleLower.includes(industry.toLowerCase())) relevancia += 10;
        if (products.some((p: string) => titleLower.includes(p.toLowerCase()))) relevancia += 15;
        if (snippetLower.includes('fabricante') || snippetLower.includes('fornecedor')) relevancia += 10;
        if (location && snippetLower.includes(location.toLowerCase())) relevancia += 10;

        candidates.push({
          nome: result.title,
          website: result.link,
          descricao: result.snippet,
          relevancia: Math.min(100, relevancia),
          fonte: 'serper',
        });

        if (candidates.length >= maxResults) break;
      } catch (error) {
        console.error('[SERPER] Erro ao processar resultado:', error);
        continue;
      }
    }

    // Ordenar por relevância
    candidates.sort((a, b) => b.relevancia - a.relevancia);

    console.log('[SERPER Search] ✅ Candidatos encontrados:', candidates.length);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        candidates: candidates.slice(0, maxResults),
        total: candidates.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[SERPER Search] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

