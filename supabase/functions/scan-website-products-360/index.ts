/**
 * Edge Function: Escanear Website para Produtos 360º
 * 
 * Motor completo de extração com processamento em etapas
 * Usa sistema de jobs para rastreamento e continuidade
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface Scan360Request {
  tenant_id: string;
  website_url: string;
  job_id?: string; // Opcional: continuar job existente
  batch_size?: number; // Tamanho do lote (padrão: 25 páginas)
}

const BATCH_SIZE = 25; // Páginas por lote
const MAX_PAGES = 500; // 🔥 AUMENTADO: De 200 para 500 páginas para sites grandes (era 200)

serve(async (req) => {
  // ✅ CRÍTICO: Tratar CORS preflight explicitamente (ANTES DE QUALQUER COISA)
  // ⚠️ IMPORTANTE: O navegador faz preflight OPTIONS antes de POST
  // ⚠️ CRÍTICO: Status 200 é obrigatório para passar no check do navegador
  if (req.method === 'OPTIONS') {
    console.log('[Scan360] ✅ OPTIONS preflight recebido');
    return new Response('', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { tenant_id, website_url, job_id, batch_size = BATCH_SIZE } = await req.json() as Scan360Request;

    if (!tenant_id || !website_url) {
      return new Response(
        JSON.stringify({ error: 'tenant_id e website_url são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const serperKey = Deno.env.get('SERPER_API_KEY');

    if (!supabaseKey || !openaiKey) {
      throw new Error('SERVICE_ROLE_KEY e OPENAI_API_KEY são obrigatórias');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair domínio
    let domain = website_url;
    try {
      const url = new URL(website_url.startsWith('http') ? website_url : `https://${website_url}`);
      domain = url.hostname;
    } catch {
      domain = website_url.replace(/^https?:\/\//, '').split('/')[0];
    }

    const baseUrl = website_url.startsWith('http') ? website_url : `https://${website_url}`;

    let job: any = null;
    let isNewJob = false;

    // Buscar ou criar job
    if (job_id) {
      const { data: existingJob, error: jobError } = await supabase
        .from('website_scan_jobs')
        .select('*')
        .eq('id', job_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (jobError || !existingJob) {
        return new Response(
          JSON.stringify({ error: 'Job não encontrado', job_id }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      job = existingJob;
      console.log(`[Scan360] Continuando job existente: ${job_id}, status: ${job.status}`);
    } else {
      // Criar novo job
      const { data: newJob, error: createError } = await supabase
        .from('website_scan_jobs')
        .insert({
          tenant_id,
          website_url,
          status: 'scanning',
          pages_discovered: [],
          pages_scanned: [],
        })
        .select()
        .single();

      if (createError || !newJob) {
        throw new Error(`Erro ao criar job: ${createError?.message}`);
      }

      job = newJob;
      isNewJob = true;
      console.log(`[Scan360] Novo job criado: ${job.id}`);
    }

    // Se job já está completo, retornar resultado
    if (job.status === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          job_id: job.id,
          status: 'completed',
          products_found: job.products_found,
          products_inserted: job.products_inserted,
          pages_scanned: (job.pages_scanned as string[]).length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FASE 1: Descoberta de URLs (apenas se for novo job ou se ainda não descobriu)
    let discoveredUrls: string[] = [];
    if (isNewJob || (job.pages_discovered as string[]).length === 0) {
      console.log(`[Scan360] FASE 1: Descobrindo URLs...`);
      
      const urlsSet = new Set<string>();
      
      // 1.1 Buscar sitemap.xml
      const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap1.xml'];
      for (const sitemapPath of sitemapPaths) {
        try {
          const sitemapUrl = `${baseUrl}${sitemapPath}`;
          const sitemapResponse = await fetch(sitemapUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(10000),
          });
          
          if (sitemapResponse.ok) {
            const sitemapXml = await sitemapResponse.text();
            const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/gi);
            if (urlMatches) {
              for (const match of urlMatches) {
                const url = match.replace(/<\/?loc>/gi, '').trim();
                // 🔥 MELHORADO: Filtrar URLs de produtos de forma mais abrangente
                if (url && (
                  url.toLowerCase().includes('produto') || 
                  url.toLowerCase().includes('categoria') || 
                  url.toLowerCase().includes('catalogo') || 
                  url.toLowerCase().includes('product') || 
                  url.toLowerCase().includes('category') ||
                  url.toLowerCase().includes('shop') ||
                  url.toLowerCase().includes('loja') ||
                  url.toLowerCase().includes('/p/') ||
                  url.toLowerCase().includes('/produto/') ||
                  url.toLowerCase().includes('/item/')
                )) {
                  urlsSet.add(url);
                }
              }
              console.log(`[Scan360] ✅ Sitemap encontrado: ${urlsSet.size} URLs`);
              break;
            }
          }
        } catch (e) {
          // Continuar
        }
      }

      // 1.2 SERPER com múltiplas queries
      // 🔥 MELHORADO: Mais queries para descobrir mais páginas
      if (serperKey) {
        const serperQueries = [
          `site:${domain} (produtos OR serviços OR catálogo)`,
          `site:${domain} (linha OR equipamentos OR categoria)`,
          `site:${domain} (produtos em destaque OR novidades OR lançamentos)`,
          `site:${domain} (categoria OR categorias OR subcategoria)`,
          `site:${domain} (shop OR loja OR e-commerce)`,
        ];
        
        for (const query of serperQueries) {
          try {
            const serperResponse = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                q: query,
                num: 50,
                gl: 'br',
                hl: 'pt-br',
              }),
            });

            if (serperResponse.ok) {
              const serperData = await serperResponse.json();
              const organicResults = serperData.organic || [];
              for (const result of organicResults) {
                if (result.link && result.link.includes(domain)) {
                  urlsSet.add(result.link);
                }
              }
            }
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (e) {
            // Continuar
          }
        }
      }

      // 1.3 Homepage e páginas comuns
      urlsSet.add(baseUrl);
      const commonPaths = ['/produtos', '/servicos', '/catalogo', '/products', '/services'];
      for (const path of commonPaths) {
        urlsSet.add(`${baseUrl}${path}`);
      }

      discoveredUrls = Array.from(urlsSet).slice(0, MAX_PAGES);
      
      // Atualizar job com URLs descobertas
      await supabase
        .from('website_scan_jobs')
        .update({
          pages_discovered: discoveredUrls,
          total_batches: Math.ceil(discoveredUrls.length / batch_size),
          metadata: { sitemap_found: urlsSet.size > 0 },
        })
        .eq('id', job.id);

      console.log(`[Scan360] ✅ ${discoveredUrls.length} URLs descobertas`);
    } else {
      discoveredUrls = job.pages_discovered as string[];
      console.log(`[Scan360] Usando ${discoveredUrls.length} URLs já descobertas`);
    }

    // FASE 2: Processar lote atual
    const pagesScanned = job.pages_scanned as string[];
    const pagesToScan = discoveredUrls
      .filter(url => !pagesScanned.includes(url))
      .slice(0, batch_size);

    if (pagesToScan.length === 0) {
      // Todas as páginas foram processadas
      await supabase
        .from('website_scan_jobs')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({
          success: true,
          job_id: job.id,
          status: 'completed',
          products_found: job.products_found,
          products_inserted: job.products_inserted,
          pages_scanned: pagesScanned.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Scan360] Processando lote ${job.current_batch + 1}/${Math.ceil(discoveredUrls.length / batch_size)}: ${pagesToScan.length} páginas`);

    // Coletar conteúdo das páginas
    const pagesContent: string[] = [];
    for (const url of pagesToScan) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000),
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
          
          pagesContent.push(`URL: ${url}\nConteúdo: ${textContent}`);
        }
      } catch (e) {
        console.log(`[Scan360] ⚠️ Erro ao acessar ${url}:`, e);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (pagesContent.length === 0) {
      // Marcar páginas como processadas mesmo sem conteúdo
      const updatedScanned = [...pagesScanned, ...pagesToScan];
      await supabase
        .from('website_scan_jobs')
        .update({
          pages_scanned: updatedScanned,
          current_batch: job.current_batch + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({
          success: true,
          job_id: job.id,
          status: 'scanning',
          has_more: updatedScanned.length < discoveredUrls.length,
          current_batch: job.current_batch + 1,
          total_batches: Math.ceil(discoveredUrls.length / batch_size),
          pages_scanned: updatedScanned.length,
          pages_total: discoveredUrls.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FASE 3: Extrair produtos com OpenAI (🔥 MESMA INTELIGÊNCIA DO SCAN-WEBSITE-PRODUCTS)
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

🔥 CRÍTICO - EXTRAÇÃO DE PRIMEIRO MUNDO:
- Procure por NOMES DE PRODUTOS específicos mencionados no site (ex: "Grip Defender", "Total Power", "Max Defender", etc.)
- Procure por CATEGORIAS de produtos (ex: "Alta Temperatura", "Arco Elétrico", "Corte/Perfuração", etc.)
- Procure por PRODUTOS EM DESTAQUE ou seções de produtos
- NÃO ignore produtos mencionados na homepage ou em seções de "Produtos em Destaque"
- Se houver categorias, liste os produtos de cada categoria
- 🔥 NOVO: Identifique REFERÊNCIAS/CÓDIGOS de produtos (ex: "Ref.: 50T18", "Código: ABC123", "SKU: XYZ", "Modelo: 123")
- 🔥 NOVO: Use dados estruturados (Schema.org) se disponíveis
- 🔥 NOVO: Use alt text de imagens para identificar produtos
- 🔥 NOVO: Identifique HIERARQUIA de categorias (categoria principal → subcategoria → produto)

Analise o conteúdo das páginas e identifique TODOS os produtos/serviços oferecidos pela empresa.

Para cada produto/serviço encontrado, extraia:
- nome: Nome EXATO do produto/serviço INCLUINDO referência se houver (ex: "Tênis linha New Prime (Ref.: 50T18 CO ELETRICISTA)", "Grip Defender Vulca", etc.)
- descricao: Breve descrição do produto
- categoria: Categoria do produto (ex: "Alta Temperatura e Solda", "Arco Elétrico", "Corte/Perfuração", "Proteção Mecânica", "Proteção Química", "EPI", "Luvas", "Calçados", etc.)
- subcategoria: Subcategoria se houver (ex: "Linha New Prime", "Linha Composite", etc.)
- referencia: Código/referência do produto se mencionado (ex: "50T18 CO ELETRICISTA", "72B29-TXT-E-BP-LR")
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
      "subcategoria": "Subcategoria se houver",
      "referencia": "Código/referência se houver",
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
- Nomes de produtos específicos COM suas referências/códigos
- Categorias e subcategorias de produtos
- Seções de catálogo ou linha de produtos
- Dados estruturados (Schema.org) se disponíveis
- Alt text de imagens que mencionam produtos
- Links do menu de navegação que podem ter mais produtos

IMPORTANTE: Se encontrar um produto com referência (ex: "Ref.: 50T18"), inclua a referência no nome do produto para garantir unicidade.

Conteúdo das páginas:\n\n${pagesContent.join('\n\n---\n\n').substring(0, 30000)}`
          }
        ],
        temperature: 0.1, // 🔥 MESMA PRECISÃO do scan-website-products
        max_tokens: 15000, // 🔥 AUMENTADO para processar mais produtos por lote (era 12000)
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('Erro na API OpenAI');
    }

    const aiResult = await openaiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';
    
    console.log('[Scan360] 📥 Resposta da OpenAI recebida (tamanho):', content.length, 'caracteres');
    console.log('[Scan360] 📄 Preview da resposta (primeiros 500 chars):', content.substring(0, 500));
    
    // 🔥 MELHORADO: Parsing robusto igual ao scan-website-products
    let extractedProducts: any[] = [];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('[Scan360] 🧹 Conteúdo limpo (tamanho):', cleanContent.length, 'caracteres');
      
      // Tentar encontrar JSON válido mesmo se houver texto antes/depois
      let jsonStart = cleanContent.indexOf('{');
      let jsonEnd = cleanContent.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonContent = cleanContent.substring(jsonStart, jsonEnd);
        console.log('[Scan360] 🔍 Tentando parsear JSON extraído (tamanho):', jsonContent.length, 'caracteres');
        
        const parsed = JSON.parse(jsonContent);
        extractedProducts = parsed.produtos || parsed.products || [];
        
        console.log('[Scan360] ✅ Produtos parseados:', extractedProducts.length);
        if (extractedProducts.length > 0) {
          console.log('[Scan360] 📦 Primeiro produto:', JSON.stringify(extractedProducts[0], null, 2));
        } else {
          console.log('[Scan360] ⚠️ NENHUM PRODUTO ENCONTRADO! Resposta completa:', cleanContent.substring(0, 2000));
        }
      } else {
        console.error('[Scan360] ❌ Não foi possível encontrar JSON válido na resposta');
        console.error('[Scan360] 📄 Conteúdo completo (primeiros 2000 chars):', cleanContent.substring(0, 2000));
        extractedProducts = [];
      }
    } catch (parseError: any) {
      console.error('[Scan360] ❌ Erro ao parsear resposta da IA:', parseError);
      console.error('[Scan360] 📄 Conteúdo que falhou (primeiros 2000 chars):', content.substring(0, 2000));
      console.error('[Scan360] 🔍 Tentando extrair JSON manualmente...');
      
      // Tentar extrair JSON manualmente usando regex
      try {
        const jsonMatch = content.match(/\{[\s\S]*"produtos"[\s\S]*\}/) || content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedProducts = parsed.produtos || parsed.products || [];
          console.log('[Scan360] ✅ Produtos extraídos manualmente:', extractedProducts.length);
        }
      } catch (manualParseError) {
        console.error('[Scan360] ❌ Falha também no parse manual:', manualParseError);
        extractedProducts = [];
      }
    }

    // FASE 4: Inserir produtos
    let insertedCount = 0;
    const normalizeForComparison = (str: string): string => {
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').trim();
    };

    for (const product of extractedProducts) {
      if (!product.nome) continue;

      // Verificar duplicata
      const { data: existing } = await supabase
        .from('tenant_products')
        .select('id, nome')
        .eq('tenant_id', tenant_id)
        .limit(50);

      let isDuplicate = false;
      if (existing) {
        const normalizedNew = normalizeForComparison(product.nome);
        for (const existingProduct of existing) {
          const normalizedExisting = normalizeForComparison(existingProduct.nome || '');
          if (normalizedNew === normalizedExisting || 
              (normalizedNew.length > 10 && normalizedExisting.includes(normalizedNew.substring(0, Math.floor(normalizedNew.length * 0.9))))) {
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        // 🔥 MELHORADO: Inserir com todos os campos extraídos (mesma estrutura do scan-website-products)
        const { error: insertError } = await supabase
          .from('tenant_products')
          .insert({
            tenant_id,
            nome: product.nome.trim(),
            descricao: product.descricao?.trim() || null,
            categoria: product.categoria?.trim() || null,
            subcategoria: product.subcategoria?.trim() || null,
            codigo_interno: product.referencia?.trim() || null,
            extraido_de: 'website',
            confianca_extracao: product.confianca || 0.8, // Usar confiança da IA se disponível
            // 🔥 NOVO: Campos adicionais se disponíveis
            setores_alvo: product.setores_alvo?.join(', ') || null,
            diferenciais: product.diferenciais?.join(', ') || null,
          });

        if (!insertError) {
          insertedCount++;
        }
      }
    }

    // Atualizar job
    const updatedScanned = [...pagesScanned, ...pagesToScan];
    const hasMore = updatedScanned.length < discoveredUrls.length;
    
    await supabase
      .from('website_scan_jobs')
      .update({
        pages_scanned: updatedScanned,
        products_found: (job.products_found || 0) + extractedProducts.length,
        products_inserted: (job.products_inserted || 0) + insertedCount,
        current_batch: job.current_batch + 1,
        status: hasMore ? 'scanning' : 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`[Scan360] ✅ Lote processado: ${insertedCount} produtos inseridos`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        status: hasMore ? 'scanning' : 'completed',
        has_more: hasMore,
        current_batch: job.current_batch + 1,
        total_batches: Math.ceil(discoveredUrls.length / batch_size),
        products_found: (job.products_found || 0) + extractedProducts.length,
        products_inserted: (job.products_inserted || 0) + insertedCount,
        pages_scanned: updatedScanned.length,
        pages_total: discoveredUrls.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Scan360] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
