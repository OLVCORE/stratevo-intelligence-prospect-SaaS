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
    
    // 🔥 CRÍTICO: SEMPRE acessar a HOMEPAGE primeiro (onde geralmente há produtos em destaque)
    const baseUrl = website_url.startsWith('http') ? website_url : `https://${website_url}`;
    try {
      console.log(`[ScanWebsite] Acessando homepage: ${baseUrl}`);
      const homepageResponse = await fetch(baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      });
      
      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        // Extrair texto básico (remover tags HTML) - AUMENTAR LIMITE
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 15000); // Aumentado de 5000 para 15000
        
        pagesContent.push(`URL: ${baseUrl} (Homepage)\nConteúdo: ${textContent}`);
        console.log(`[ScanWebsite] ✅ Homepage acessada com sucesso (${textContent.length} caracteres)`);
      } else {
        console.log(`[ScanWebsite] ⚠️ Homepage retornou status ${homepageResponse.status}`);
      }
    } catch (homepageError) {
      console.error('[ScanWebsite] Erro ao acessar homepage:', homepageError);
    }

    // 1. Buscar páginas do site via SERPER (com mais palavras-chave)
    if (serperKey) {
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `site:${domain} (produtos OR serviços OR catálogo OR soluções OR linha OR equipamentos OR EPI OR luvas OR produtos em destaque)`,
            num: 15, // Aumentado de 10 para 15
            gl: 'br',
            hl: 'pt-br',
          }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          const organicResults = serperData.organic || [];
          
          for (const result of organicResults) {
            // Evitar duplicatas da homepage
            if (!result.link.includes(domain) || result.link === baseUrl || result.link === `${baseUrl}/`) {
              continue;
            }
            pagesContent.push(`Página: ${result.title}\nURL: ${result.link}\nDescrição: ${result.snippet || ''}`);
          }

          console.log(`[ScanWebsite] Encontradas ${organicResults.length} páginas via SERPER`);
        }
      } catch (serperError) {
        console.error('[ScanWebsite] Erro no SERPER:', serperError);
      }
    }

    // 2. Tentar acessar diretamente páginas de produtos (com mais variações)
    const commonProductPages = [
      '/produtos',
      '/servicos',
      '/solucoes',
      '/catalogo',
      '/products',
      '/services',
      '/linha-produtos',
      '/nossos-produtos',
      '/produtos-em-destaque',
    ];

    for (const path of commonProductPages) {
      try {
        const fullUrl = `https://${domain}${path}`;
        const pageResponse = await fetch(fullUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000); // Aumentado de 5000 para 10000
          
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
            content: `Você é um especialista em identificar produtos e serviços em websites corporativos, especialmente produtos industriais, EPIs, equipamentos de proteção, luvas, e produtos físicos.

IMPORTANTE: 
- Procure por NOMES DE PRODUTOS específicos mencionados no site (ex: "Grip Defender", "Total Power", "Max Defender", etc.)
- Procure por CATEGORIAS de produtos (ex: "Alta Temperatura", "Arco Elétrico", "Corte/Perfuração", etc.)
- Procure por PRODUTOS EM DESTAQUE ou seções de produtos
- NÃO ignore produtos mencionados na homepage ou em seções de "Produtos em Destaque"
- Se houver categorias, liste os produtos de cada categoria

Analise o conteúdo das páginas e identifique TODOS os produtos/serviços oferecidos pela empresa.

Para cada produto/serviço encontrado, extraia:
- nome: Nome EXATO do produto/serviço (ex: "Grip Defender Vulca", "Total Power", etc.)
- descricao: Breve descrição do produto
- categoria: Categoria do produto (ex: "Alta Temperatura e Solda", "Arco Elétrico", "Corte/Perfuração", "Proteção Mecânica", "Proteção Química", "EPI", "Luvas", etc.)
- setores_alvo: Setores que podem usar (baseado no contexto, ex: "Indústria", "Construção", "Mineração", etc.)
- diferenciais: Diferenciais mencionados (ex: "Alta performance", "Tecnologia de última geração", etc.)
- confianca: Sua confiança (0.0 a 1.0)

Se encontrar categorias sem produtos específicos, crie produtos genéricos para cada categoria.

Responda APENAS com JSON válido:
{
  "empresa": "Nome da empresa",
  "produtos": [
    {
      "nome": "Nome exato do produto",
      "descricao": "Descrição do produto",
      "categoria": "Categoria do produto",
      "setores_alvo": ["Setor 1", "Setor 2"],
      "diferenciais": ["Diferencial 1", "Diferencial 2"],
      "confianca": 0.9
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Extraia TODOS os produtos e serviços mencionados nas seguintes páginas. Preste atenção especial a:
- Produtos em destaque na homepage
- Nomes de produtos específicos
- Categorias de produtos
- Seções de catálogo ou linha de produtos

Conteúdo das páginas:\n\n${pagesContent.join('\n\n---\n\n').substring(0, 20000)}`
          }
        ],
        temperature: 0.2, // Reduzido para ser mais preciso
        max_tokens: 6000, // Aumentado para extrair mais produtos
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';
    
    console.log('[ScanWebsite] 📥 Resposta da OpenAI recebida (tamanho):', content.length, 'caracteres');
    console.log('[ScanWebsite] 📄 Preview da resposta (primeiros 500 chars):', content.substring(0, 500));

    // Parse do JSON
    let extractedProducts: any[] = [];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('[ScanWebsite] 🧹 Conteúdo limpo (tamanho):', cleanContent.length, 'caracteres');
      
      const parsed = JSON.parse(cleanContent);
      extractedProducts = parsed.produtos || [];
      
      console.log('[ScanWebsite] ✅ Produtos parseados:', extractedProducts.length);
      if (extractedProducts.length > 0) {
        console.log('[ScanWebsite] 📦 Primeiro produto:', JSON.stringify(extractedProducts[0], null, 2));
      } else {
        console.log('[ScanWebsite] ⚠️ NENHUM PRODUTO ENCONTRADO! Resposta completa:', cleanContent.substring(0, 2000));
      }
    } catch (parseError) {
      console.error('[ScanWebsite] ❌ Erro ao parsear resposta da IA:', parseError);
      console.error('[ScanWebsite] 📄 Conteúdo que falhou (primeiros 1000 chars):', content.substring(0, 1000));
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

    console.log(`[ScanWebsite] ✅ Concluído: ${productsInserted} produtos inseridos de ${extractedProducts.length} encontrados`);

    // 🔥 LOG DETALHADO PARA DEBUG
    console.log('[ScanWebsite] 📊 RESUMO FINAL:', {
      domain,
      pages_scanned: pagesContent.length,
      products_found: extractedProducts.length,
      products_inserted: productsInserted,
      products_list: extractedProducts.map(p => ({ nome: p.nome, categoria: p.categoria }))
    });

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        pages_scanned: pagesContent.length,
        products_found: extractedProducts.length,
        products_extracted: extractedProducts.length, // 🔥 ADICIONADO: mesmo nome do concorrente
        products_inserted: productsInserted,
        products: extractedProducts.map(p => ({ // 🔥 ADICIONADO: retornar lista de produtos
          nome: p.nome,
          categoria: p.categoria,
          descricao: p.descricao
        }))
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

