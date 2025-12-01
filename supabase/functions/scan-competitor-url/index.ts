/**
 * Edge Function: Escanear URL de Concorrente
 * 
 * Extrai produtos de websites, Instagram, LinkedIn, Facebook
 * e salva em tenant_competitor_products
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
  competitor_cnpj: string;
  competitor_name: string;
  source_url: string;
  source_type?: string; // 'website', 'instagram', 'linkedin', 'facebook'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tenant_id, competitor_cnpj, competitor_name, source_url, source_type } = await req.json() as ScanRequest;

    if (!tenant_id || !competitor_cnpj || !competitor_name || !source_url) {
      return new Response(
        JSON.stringify({ error: 'tenant_id, competitor_cnpj, competitor_name e source_url são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Detectar tipo de URL se não informado
    let detectedType = source_type || 'website';
    if (source_url.includes('instagram.com')) detectedType = 'instagram';
    else if (source_url.includes('linkedin.com')) detectedType = 'linkedin';
    else if (source_url.includes('facebook.com')) detectedType = 'facebook';

    console.log(`[ScanCompetitor] Escaneando ${detectedType}: ${source_url}`);

    let content = '';

    // 1. Buscar conteúdo da URL
    try {
      if (detectedType === 'website') {
        // Scrape website normal
        const response = await fetch(source_url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductScanner/1.0)' },
        });
        
        if (response.ok) {
          const html = await response.text();
          // Extrair texto básico
          content = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000);
        }
      } else if (detectedType === 'instagram') {
        // Para Instagram, usar SERPER ou API específica
        // Por enquanto, simular com contexto
        content = `Instagram da empresa ${competitor_name}. Posts sobre produtos, serviços e soluções.`;
      } else if (detectedType === 'linkedin') {
        // Para LinkedIn, usar SERPER
        const serperKey = Deno.env.get('SERPER_API_KEY');
        if (serperKey) {
          try {
            const serperResponse = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                q: `site:linkedin.com/company ${competitor_name} produtos serviços`,
                num: 5,
                gl: 'br',
                hl: 'pt-br',
              }),
            });

            if (serperResponse.ok) {
              const serperData = await serperResponse.json();
              const results = serperData.organic || [];
              content = results.map((r: any) => `${r.title}\n${r.snippet || ''}`).join('\n\n');
            }
          } catch (serperError) {
            console.error('[ScanCompetitor] Erro no SERPER:', serperError);
          }
        }
        if (!content) {
          content = `LinkedIn da empresa ${competitor_name}. Informações sobre produtos e serviços.`;
        }
      } else {
        content = `Página da empresa ${competitor_name}. Informações sobre produtos e serviços.`;
      }
    } catch (fetchError) {
      console.error('[ScanCompetitor] Erro ao buscar URL:', fetchError);
      content = `Empresa: ${competitor_name}\nURL: ${source_url}`;
    }

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair conteúdo da URL', products_extracted: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Usar OpenAI para extrair produtos
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
            content: `Você é um especialista em identificar produtos e serviços em páginas web e redes sociais.

Analise o conteúdo fornecido e identifique TODOS os produtos/serviços mencionados.

Para cada produto/serviço encontrado, extraia:
- nome: Nome do produto/serviço
- descricao: Breve descrição
- categoria: Categoria (Ex: Software, Consultoria, Hardware, EPI, etc)
- confianca: Sua confiança (0.0 a 1.0)

Responda APENAS com JSON válido:
{
  "produtos": [
    {
      "nome": "...",
      "descricao": "...",
      "categoria": "...",
      "confianca": 0.8
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Extraia os produtos do seguinte conteúdo:\n\n${content.substring(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';

    // Parse do JSON
    let extractedProducts: any[] = [];
    try {
      const parsed = JSON.parse(aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      extractedProducts = parsed.produtos || [];
    } catch (parseError) {
      console.error('[ScanCompetitor] Erro ao parsear resposta da IA:', parseError);
      extractedProducts = [];
    }

    // 3. Inserir produtos no banco
    let productsInserted = 0;
    
    for (const product of extractedProducts) {
      if (!product.nome) continue;

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('tenant_competitor_products')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('competitor_cnpj', competitor_cnpj)
        .eq('nome', product.nome)
        .limit(1);

      if (existing && existing.length > 0) {
        continue;
      }

      const { error: insertError } = await supabase
        .from('tenant_competitor_products')
        .insert({
          tenant_id,
          competitor_cnpj,
          competitor_name,
          nome: product.nome,
          descricao: product.descricao || null,
          categoria: product.categoria || null,
          source_url,
          source_type: detectedType,
          extraido_de: `${detectedType}_scan`,
          confianca_extracao: product.confianca || 0.7,
          dados_extraidos: { raw: product, content_preview: content.substring(0, 500) },
        });

      if (!insertError) {
        productsInserted++;
      }
    }

    console.log(`[ScanCompetitor] Concluído: ${productsInserted} produtos inseridos`);

    return new Response(
      JSON.stringify({
        success: true,
        source_type: detectedType,
        products_extracted: extractedProducts.length,
        products_inserted: productsInserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ScanCompetitor] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

