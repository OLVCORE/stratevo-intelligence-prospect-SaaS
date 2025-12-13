// 🔍 BUSCA WEBSITE OFICIAL DA EMPRESA PROSPECTADA
// Usa SERPER para encontrar website baseado em razão social + CNPJ
// NÃO modifica funcionalidades existentes - apenas adiciona nova capacidade

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { razao_social, cnpj, tenant_id } = await req.json();

    if (!razao_social) {
      return new Response(
        JSON.stringify({ success: false, error: 'razao_social é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[FindWebsite] 🔍 Buscando website para:', { razao_social, cnpj });

    const serperKey = Deno.env.get('SERPER_API_KEY');
    if (!serperKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'SERPER_API_KEY não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 🎯 QUERIES INTELIGENTES (múltiplas tentativas)
    const queries = [
      `website oficial "${razao_social}"`,
      `site oficial ${razao_social}`,
      `${razao_social} empresa website`,
      `${razao_social} contato`,
    ];

    // Se tiver CNPJ, adicionar query específica
    if (cnpj) {
      queries.push(`"${razao_social}" CNPJ ${cnpj.replace(/\D/g, '')}`);
    }

    let bestResult: { url: string; confidence: number; title: string; snippet: string } | null = null;

    // Tentar cada query até encontrar resultado válido
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
            num: 10,
            gl: 'br',
            hl: 'pt-br',
          }),
        });

        if (!serperResponse.ok) continue;

        const serperData = await serperResponse.json();
        const organic = serperData.organic || [];

        // 🚫 DOMÍNIOS INVÁLIDOS (backlinks, redes sociais, etc.)
        const invalidDomains = [
          'cnpj.net', 'cnpj.biz', 'cnpj.ws',
          'empresasaqui.com.br', 'econodata.com.br',
          'jusbrasil.com.br', 'guiamais.com.br',
          'linkedin.com', 'facebook.com', 'instagram.com',
          'twitter.com', 'youtube.com',
          'reclameaqui.com.br', 'glassdoor.com',
        ];

        for (const result of organic) {
          const url = result.link || '';
          const domain = url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();

          // Verificar se é domínio inválido
          if (invalidDomains.some(invalid => domain.includes(invalid))) {
            continue;
          }

          // ✅ BONIFICAR domínios .com.br, .ind.br, .net.br
          let confidence = 70;
          if (domain.includes('.com.br') || domain.includes('.ind.br') || domain.includes('.net.br')) {
            confidence += 20;
          }

          // ✅ BONIFICAR se nome da empresa está no domínio
          const primeirasPalavras = razao_social.toLowerCase().split(' ').slice(0, 2);
          for (const palavra of primeirasPalavras) {
            if (palavra.length > 4 && domain.includes(palavra)) {
              confidence += 15;
              break;
            }
          }

          // ✅ BONIFICAR se tem "site oficial" ou similar no snippet
          const snippet = (result.snippet || '').toLowerCase();
          if (snippet.includes('site oficial') || snippet.includes('website oficial')) {
            confidence += 10;
          }

          // Se encontrou resultado melhor, atualizar
          if (!bestResult || confidence > bestResult.confidence) {
            bestResult = {
              url,
              confidence: Math.min(100, confidence),
              title: result.title || '',
              snippet: result.snippet || '',
            };
          }
        }

        // Se encontrou resultado com alta confiança, parar busca
        if (bestResult && bestResult.confidence >= 85) {
          break;
        }
      } catch (error) {
        console.warn(`[FindWebsite] ⚠️ Erro na query "${query}":`, error);
        continue;
      }
    }

    if (!bestResult) {
      return new Response(
        JSON.stringify({
          success: false,
          website: null,
          message: 'Website não encontrado',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[FindWebsite] ✅ Website encontrado:', bestResult.url, `(confiança: ${bestResult.confidence}%)`);

    return new Response(
      JSON.stringify({
        success: true,
        website: bestResult.url,
        confidence: bestResult.confidence,
        title: bestResult.title,
        snippet: bestResult.snippet,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FindWebsite] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

