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
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
    let pagesContent: string[] = []; // Inicializar para todos os tipos
    
    try {
      if (detectedType === 'website') {
        // Extrair domínio
        let domain = source_url;
        try {
          const url = new URL(source_url.startsWith('http') ? source_url : `https://${source_url}`);
          domain = url.hostname;
        } catch {
          domain = source_url.replace(/^https?:\/\//, '').split('/')[0];
        }

        console.log(`[ScanCompetitor] Escaneando website: ${domain}`);

        // 🔥 CRÍTICO: SEMPRE acessar a HOMEPAGE primeiro
        const baseUrl = source_url.startsWith('http') ? source_url : `https://${source_url}`;
        try {
          console.log(`[ScanCompetitor] Acessando homepage: ${baseUrl}`);
          const homepageResponse = await fetch(baseUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(15000), // 15 segundos de timeout
          });
          
          if (homepageResponse.ok) {
            const html = await homepageResponse.text();
            console.log(`[ScanCompetitor] HTML recebido (${html.length} caracteres)`);
            
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 15000);
            
            pagesContent.push(`URL: ${baseUrl} (Homepage)\nConteúdo: ${textContent}`);
            console.log(`[ScanCompetitor] ✅ Homepage acessada com sucesso (${textContent.length} caracteres)`);
            console.log(`[ScanCompetitor] 📄 Preview do conteúdo (primeiros 500 chars):`, textContent.substring(0, 500));
          } else {
            console.log(`[ScanCompetitor] ⚠️ Homepage retornou status ${homepageResponse.status}`);
          }
        } catch (homepageError: any) {
          console.error('[ScanCompetitor] ❌ Erro ao acessar homepage:', homepageError);
          if (homepageError.name === 'AbortError') {
            console.error('[ScanCompetitor] ⏱️ Timeout ao acessar homepage (15s)');
          }
        }

        // 1.1. Buscar páginas do site via SERPER (MESMO DO TENANT) - com mais palavras-chave
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
                q: `site:${domain} (produtos OR serviços OR catálogo OR soluções OR linha OR equipamentos OR EPI OR luvas OR produtos em destaque)`,
                num: 15,
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

              console.log(`[ScanCompetitor] Encontradas ${organicResults.length} páginas via SERPER`);
            }
          } catch (serperError) {
            console.error('[ScanCompetitor] Erro no SERPER:', serperError);
          }
        }

        // 1.2. Tentar acessar diretamente páginas comuns (MESMO DO TENANT) - com mais variações
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
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductScanner/1.0)' },
            });
            
            if (pageResponse.ok) {
              const html = await pageResponse.text();
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 10000);
              
              pagesContent.push(`URL: ${fullUrl}\nConteúdo: ${textContent}`);
              console.log(`[ScanCompetitor] Página encontrada: ${fullUrl}`);
            }
          } catch {
            // Página não existe ou erro de acesso
          }
        }

        // Se não encontrou nada, tentar a URL original
        if (pagesContent.length === 0) {
          try {
            const response = await fetch(source_url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductScanner/1.0)' },
            });
            
            if (response.ok) {
              const html = await response.text();
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 15000);
              
              pagesContent.push(`URL: ${source_url}\nConteúdo: ${textContent}`);
            }
          } catch {
            // Erro ao acessar URL
          }
        }

        // Converter pagesContent em string única para compatibilidade
        content = pagesContent.join('\n\n---\n\n');
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

    // Se for website e não encontrou conteúdo, retornar erro
    if (detectedType === 'website' && (!content || pagesContent.length === 0)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhuma página de produtos encontrada',
          products_extracted: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair conteúdo da URL', products_extracted: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Usar OpenAI para extrair produtos (MESMO PROMPT DO TENANT)
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
            content: `Você é um especialista em identificar produtos e serviços em websites corporativos e redes sociais, especialmente produtos industriais, EPIs, equipamentos de proteção, luvas, e produtos físicos.

IMPORTANTE: 
- Procure por NOMES DE PRODUTOS específicos mencionados
- Procure por CATEGORIAS de produtos
- Procure por PRODUTOS EM DESTAQUE
- NÃO ignore produtos mencionados na homepage

Analise o conteúdo fornecido e identifique TODOS os produtos/serviços oferecidos pela empresa.

Para cada produto/serviço encontrado, extraia:
- nome: Nome EXATO do produto/serviço
- descricao: Breve descrição
- categoria: Categoria do produto (ex: "Alta Temperatura", "Arco Elétrico", "EPI", "Luvas", etc.)
- setores_alvo: Setores que podem usar (baseado no contexto)
- diferenciais: Diferenciais mencionados
- confianca: Sua confiança (0.0 a 1.0)

Responda APENAS com JSON válido:
{
  "empresa": "Nome da empresa",
  "produtos": [
    {
      "nome": "Nome exato do produto",
      "descricao": "Descrição do produto",
      "categoria": "Categoria do produto",
      "setores_alvo": ["Setor 1", "Setor 2"],
      "diferenciais": ["Diferencial 1"],
      "confianca": 0.9
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Extraia TODOS os produtos e serviços mencionados. Preste atenção especial a produtos em destaque, nomes específicos e categorias.

Conteúdo:\n\n${content.substring(0, 20000)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 6000,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';

    // Parse do JSON (MESMO DO TENANT)
    let extractedProducts: any[] = [];
    try {
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('[ScanCompetitor] 🧹 Conteúdo limpo (tamanho):', cleanContent.length, 'caracteres');
      
      // Tentar encontrar JSON válido mesmo se houver texto antes/depois
      let jsonStart = cleanContent.indexOf('{');
      let jsonEnd = cleanContent.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonContent = cleanContent.substring(jsonStart, jsonEnd);
        console.log('[ScanCompetitor] 🔍 Tentando parsear JSON extraído (tamanho):', jsonContent.length, 'caracteres');
        
        const parsed = JSON.parse(jsonContent);
        extractedProducts = parsed.produtos || parsed.products || [];
        
        console.log('[ScanCompetitor] ✅ Produtos parseados:', extractedProducts.length);
        if (extractedProducts.length > 0) {
          console.log('[ScanCompetitor] 📦 Primeiro produto:', JSON.stringify(extractedProducts[0], null, 2));
        } else {
          console.log('[ScanCompetitor] ⚠️ NENHUM PRODUTO ENCONTRADO! Resposta completa:', cleanContent.substring(0, 2000));
        }
      } else {
        console.error('[ScanCompetitor] ❌ Não foi possível encontrar JSON válido na resposta');
        console.error('[ScanCompetitor] 📄 Conteúdo completo (primeiros 2000 chars):', cleanContent.substring(0, 2000));
        extractedProducts = [];
      }
    } catch (parseError: any) {
      console.error('[ScanCompetitor] ❌ Erro ao parsear resposta da IA:', parseError);
      console.error('[ScanCompetitor] 📄 Conteúdo que falhou (primeiros 2000 chars):', aiContent.substring(0, 2000));
      console.error('[ScanCompetitor] 🔍 Tentando extrair JSON manualmente...');
      
      // Tentar extrair JSON manualmente usando regex
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*"produtos"[\s\S]*\}/) || aiContent.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedProducts = parsed.produtos || parsed.products || [];
          console.log('[ScanCompetitor] ✅ Produtos extraídos manualmente:', extractedProducts.length);
        }
      } catch (manualParseError) {
        console.error('[ScanCompetitor] ❌ Falha também no parse manual:', manualParseError);
        extractedProducts = [];
      }
    }

    // 3. Inserir produtos no banco
    let productsInserted = 0;
    let productsSkipped = 0;
    let productsError = 0;
    
    console.log(`[ScanCompetitor] 🔄 Tentando inserir ${extractedProducts.length} produtos...`);
    
    for (const product of extractedProducts) {
      if (!product.nome) {
        console.log(`[ScanCompetitor] ⚠️ Produto sem nome, pulando`);
        continue;
      }

      // 🔥 CRÍTICO: Verificar se já existe (com tratamento robusto de erros)
      let produtoJaExiste = false;
      try {
        const { data: existing, error: checkError } = await supabase
          .from('tenant_competitor_products')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('competitor_cnpj', competitor_cnpj)
          .ilike('nome', product.nome.trim()) // Usar ilike para comparação case-insensitive
          .limit(1);

        if (checkError) {
          console.error(`[ScanCompetitor] ⚠️ Erro ao verificar produto existente (${product.nome}):`, checkError);
          // Se erro for de RLS ou tabela não encontrada, tentar inserir mesmo assim
          if (checkError.code === '42P01' || checkError.message?.includes('permission denied')) {
            console.warn(`[ScanCompetitor] ⚠️ Erro de permissão na verificação, tentando inserir mesmo assim: ${product.nome}`);
          }
        } else if (existing && existing.length > 0) {
          produtoJaExiste = true;
          console.log(`[ScanCompetitor] ⏭️ Produto já existe: ${product.nome}`);
          productsSkipped++;
        }
      } catch (checkException: any) {
        console.error(`[ScanCompetitor] ⚠️ Exceção ao verificar produto (${product.nome}):`, checkException);
        // Continuar e tentar inserir mesmo assim
      }

      if (produtoJaExiste) {
        continue;
      }

      console.log(`[ScanCompetitor] ➕ Inserindo produto: ${product.nome}`);
      
      // 🔥 CRÍTICO: Tentar inserir com tratamento robusto de erros
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('tenant_competitor_products')
          .insert({
            tenant_id,
            competitor_cnpj,
            competitor_name,
            nome: product.nome.trim(), // Remover espaços
            descricao: product.descricao?.trim() || null,
            categoria: product.categoria?.trim() || null,
            source_url,
            source_type: detectedType,
            extraido_de: `${detectedType}_scan`,
            confianca_extracao: product.confianca || 0.7,
            dados_extraidos: { raw: product, content_preview: content.substring(0, 500) },
          })
          .select('id'); // Retornar ID para confirmar inserção

        if (!insertError && insertData && insertData.length > 0) {
          productsInserted++;
          console.log(`[ScanCompetitor] ✅ Produto inserido com sucesso: ${product.nome} (ID: ${insertData[0].id})`);
        } else {
          productsError++;
          console.error(`[ScanCompetitor] ❌ Erro ao inserir produto (${product.nome}):`, insertError);
          console.error(`[ScanCompetitor] 📋 Dados do produto que falhou:`, {
            nome: product.nome,
            categoria: product.categoria,
            tenant_id,
            competitor_cnpj,
            error_code: insertError?.code,
            error_message: insertError?.message,
            error_hint: insertError?.hint
          });
          
          // 🔥 CRÍTICO: Se erro for de constraint ou duplicata, contar como skipped
          if (insertError?.code === '23505' || insertError?.message?.includes('duplicate')) {
            console.log(`[ScanCompetitor] 🔄 Produto duplicado detectado: ${product.nome}`);
            productsSkipped++;
            productsError--; // Não contar como erro se for duplicata
          }
        }
      } catch (insertException: any) {
        productsError++;
        console.error(`[ScanCompetitor] ❌ Exceção ao inserir produto (${product.nome}):`, insertException);
        console.error(`[ScanCompetitor] 📋 Stack trace:`, insertException.stack);
      }
    }
    
    console.log(`[ScanCompetitor] 📊 Resumo da inserção: ${productsInserted} inseridos, ${productsSkipped} já existiam, ${productsError} com erro`);

    console.log(`[ScanCompetitor] ✅ Concluído: ${productsInserted} produtos inseridos de ${extractedProducts.length} encontrados`);

    // 🔥 LOG DETALHADO PARA DEBUG
    console.log('[ScanCompetitor] 📊 RESUMO FINAL:', {
      competitor_name: competitor_name,
      source_type: detectedType,
      source_url: source_url,
      products_found: extractedProducts.length,
      products_inserted: productsInserted,
      products_list: extractedProducts.map(p => ({ nome: p.nome, categoria: p.categoria }))
    });

    return new Response(
      JSON.stringify({
        success: true,
        source_type: detectedType,
        products_extracted: extractedProducts.length,
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
    console.error('[ScanCompetitor] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

