/**
 * Edge Function: Escanear Website para Produtos
 * 
 * Usa SERPER para buscar páginas do site e OpenAI para extrair produtos
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScanRequest {
  tenant_id: string;
  website_url: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { tenant_id, website_url } = await req.json() as ScanRequest;

    if (!tenant_id || !website_url) {
      return new Response(
        JSON.stringify({ error: 'tenant_id e website_url são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const serperKey = Deno.env.get('SERPER_API_KEY');

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Extrair domínio
    let domain = website_url;
    try {
      const url = new URL(website_url.startsWith('http') ? website_url : `https://${website_url}`);
      domain = url.hostname;
    } catch {
      domain = website_url.replace(/^https?:\/\//, '').split('/')[0];
    }

    console.log(`[ScanWebsite] Iniciando scan de: ${domain}`);

    let pagesContent: string[] = [];

    // 1. Buscar páginas do site via SERPER
    if (serperKey) {
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `site:${domain} produtos OR serviços OR catálogo OR soluções`,
            num: 10,
            gl: 'br',
            hl: 'pt-br',
          }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          const organicResults = serperData.organic || [];
          
          pagesContent = organicResults.map((r: any) => 
            `Página: ${r.title}\nURL: ${r.link}\nDescrição: ${r.snippet || ''}`
          );

          console.log(`[ScanWebsite] Encontradas ${organicResults.length} páginas`);
        }
      } catch (serperError) {
        console.error('[ScanWebsite] Erro no SERPER:', serperError);
      }
    }

    // 2. Tentar acessar diretamente a página de produtos
    const commonProductPages = [
      '/produtos',
      '/servicos',
      '/solucoes',
      '/catalogo',
      '/products',
      '/services',
    ];

    for (const path of commonProductPages) {
      try {
        const fullUrl = `https://${domain}${path}`;
        const pageResponse = await fetch(fullUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductScanner/1.0)' },
        });
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          // Extrair texto básico (remover tags HTML)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);
          
          pagesContent.push(`URL: ${fullUrl}\nConteúdo: ${textContent}`);
          console.log(`[ScanWebsite] Página encontrada: ${fullUrl}`);
        }
      } catch {
        // Página não existe ou erro de acesso
      }
    }

    if (pagesContent.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhuma página de produtos encontrada',
          products_found: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Usar OpenAI para extrair produtos
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em identificar produtos e serviços em websites corporativos.

Analise o conteúdo das páginas e identifique TODOS os produtos/serviços oferecidos pela empresa.

Para cada produto/serviço encontrado, extraia:
- nome: Nome do produto/serviço
- descricao: Breve descrição
- categoria: Categoria (Ex: Software, Consultoria, Hardware, etc)
- setores_alvo: Setores que podem usar (baseado no contexto)
- diferenciais: Diferenciais mencionados
- confianca: Sua confiança (0.0 a 1.0)

Responda APENAS com JSON válido:
{
  "empresa": "Nome da empresa",
  "produtos": [
    {
      "nome": "...",
      "descricao": "...",
      "categoria": "...",
      "setores_alvo": [],
      "diferenciais": [],
      "confianca": 0.8
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Extraia os produtos das seguintes páginas:\n\n${pagesContent.join('\n\n---\n\n').substring(0, 12000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';

    // Parse do JSON
    let extractedProducts: any[] = [];
    try {
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      extractedProducts = parsed.produtos || [];
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      extractedProducts = [];
    }

    // 4. Inserir produtos no banco
    let productsInserted = 0;
    
    for (const product of extractedProducts) {
      if (!product.nome) continue;

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('tenant_products')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('nome', product.nome)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`[ScanWebsite] Produto já existe: ${product.nome}`);
        continue;
      }

      const { error: insertError } = await supabase
        .from('tenant_products')
        .insert({
          tenant_id,
          nome: product.nome,
          descricao: product.descricao || null,
          categoria: product.categoria || null,
          setores_alvo: product.setores_alvo || null,
          diferenciais: product.diferenciais || null,
          extraido_de: 'website',
          confianca_extracao: product.confianca || 0.7,
          dados_extraidos: { 
            source: domain,
            pages_scanned: pagesContent.length,
            raw: product 
          },
        });

      if (!insertError) {
        productsInserted++;
      } else {
        console.error('[ScanWebsite] Erro ao inserir:', insertError);
      }
    }

    console.log(`[ScanWebsite] Concluído: ${productsInserted} produtos inseridos`);

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        pages_scanned: pagesContent.length,
        products_found: extractedProducts.length,
        products_inserted: productsInserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ScanWebsite] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

