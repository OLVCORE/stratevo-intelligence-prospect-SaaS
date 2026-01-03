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
    let structuredData: any = {}; // 🔥 NOVO: Para schema.org / JSON-LD
    let menuLinks: string[] = []; // 🔥 NOVO: Links do menu de navegação
    let imageAltTexts: string[] = []; // 🔥 NOVO: Alt text de imagens com produtos
    let discoveredUrls = new Set<string>(); // 🔥 NOVO: Rastrear URLs já descobertas para evitar duplicatas
    
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

        const baseUrl = source_url.startsWith('http') ? source_url : `https://${source_url}`;

        // 🔥 FASE 1: Buscar sitemap.xml para descobrir TODAS as URLs de produtos
        const sitemapUrls: string[] = [];
        try {
          console.log(`[ScanCompetitor] 🔍 Buscando sitemap.xml...`);
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
                console.log(`[ScanCompetitor] ✅ Sitemap encontrado: ${sitemapPath}`);
                
                // Extrair URLs do sitemap (suporta sitemap_index e sitemap normal)
                const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/gi);
                if (urlMatches) {
                  for (const match of urlMatches) {
                    const url = match.replace(/<\/?loc>/gi, '').trim();
                    // Filtrar URLs de produtos de forma mais abrangente
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
                      url.toLowerCase().includes('/item/') ||
                      url.toLowerCase().includes('/product/')
                    )) {
                      if (!discoveredUrls.has(url)) {
                        sitemapUrls.push(url);
                        discoveredUrls.add(url);
                      }
                    }
                  }
                  console.log(`[ScanCompetitor] ✅ ${sitemapUrls.length} URLs de produtos encontradas no sitemap`);
                  break; // Se encontrou um sitemap válido, não precisa tentar os outros
                }
              }
            } catch (sitemapError) {
              // Sitemap não existe ou erro de acesso, continuar
              console.log(`[ScanCompetitor] ⚠️ Sitemap ${sitemapPath} não encontrado ou erro de acesso`);
            }
          }
        } catch (sitemapException) {
          console.log(`[ScanCompetitor] ⚠️ Erro ao buscar sitemap:`, sitemapException);
        }

        // 🔥 CRÍTICO: SEMPRE acessar a HOMEPAGE primeiro
        try {
          console.log(`[ScanCompetitor] Acessando homepage: ${baseUrl}`);
          const homepageResponse = await fetch(baseUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(15000), // 15 segundos de timeout
          });
          
          if (homepageResponse.ok) {
            const html = await homepageResponse.text();
            console.log(`[ScanCompetitor] HTML recebido (${html.length} caracteres)`);
            
            // 🔥 NOVO: Extrair Schema.org / JSON-LD
            try {
              const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
              if (jsonLdMatches) {
                for (const match of jsonLdMatches) {
                  try {
                    const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
                    const parsed = JSON.parse(jsonContent);
                    if (parsed['@type'] === 'Product' || parsed['@type'] === 'ItemList' || Array.isArray(parsed)) {
                      structuredData = { ...structuredData, ...parsed };
                      console.log(`[ScanCompetitor] ✅ Schema.org encontrado: ${parsed['@type'] || 'Array'}`);
                    }
                  } catch (e) {
                    // Ignorar JSON inválido
                  }
                }
              }
            } catch (e) {
              console.log(`[ScanCompetitor] ⚠️ Erro ao extrair schema.org:`, e);
            }
            
            // 🔥 NOVO: Extrair links do menu de navegação
            try {
              const navMatches = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi) || 
                                html.match(/<ul[^>]*class[^>]*menu[^>]*>([\s\S]*?)<\/ul>/gi) ||
                                html.match(/<ul[^>]*class[^>]*nav[^>]*>([\s\S]*?)<\/ul>/gi);
              
              if (navMatches) {
                for (const navMatch of navMatches) {
                  const linkMatches = navMatch.match(/href=["']([^"']+)["']/gi);
                  if (linkMatches) {
                    for (const linkMatch of linkMatches) {
                      const href = linkMatch.replace(/href=["']/, '').replace(/["']/, '');
                      // Filtrar links relevantes (produtos, categorias, catálogo)
                      if (href && (
                        href.toLowerCase().includes('produto') ||
                        href.toLowerCase().includes('categoria') ||
                        href.toLowerCase().includes('catalogo') ||
                        href.toLowerCase().includes('linha') ||
                        href.toLowerCase().includes('product') ||
                        href.toLowerCase().includes('category') ||
                        href.toLowerCase().includes('shop')
                      )) {
                        const fullUrl = href.startsWith('http') ? href : 
                                       href.startsWith('/') ? `https://${domain}${href}` : 
                                       `https://${domain}/${href}`;
                        if (!menuLinks.includes(fullUrl) && fullUrl.includes(domain)) {
                          menuLinks.push(fullUrl);
                        }
                      }
                    }
                  }
                }
                console.log(`[ScanCompetitor] ✅ ${menuLinks.length} links do menu encontrados`);
              }
            } catch (e) {
              console.log(`[ScanCompetitor] ⚠️ Erro ao extrair menu:`, e);
            }
            
            // 🔥 NOVO: Extrair alt text de imagens (produtos em imagens)
            try {
              const imgMatches = html.match(/<img[^>]*alt=["']([^"']+)["'][^>]*>/gi);
              if (imgMatches) {
                for (const imgMatch of imgMatches) {
                  const altMatch = imgMatch.match(/alt=["']([^"']+)["']/);
                  if (altMatch && altMatch[1]) {
                    const altText = altMatch[1].trim();
                    // Filtrar apenas alt texts que parecem nomes de produtos
                    if (altText.length > 3 && 
                        (altText.toLowerCase().includes('produto') ||
                         altText.toLowerCase().includes('modelo') ||
                         altText.toLowerCase().includes('ref') ||
                         altText.match(/[A-Z][a-z]+/))) {
                      imageAltTexts.push(altText);
                    }
                  }
                }
                console.log(`[ScanCompetitor] ✅ ${imageAltTexts.length} alt texts de produtos encontrados`);
              }
            } catch (e) {
              console.log(`[ScanCompetitor] ⚠️ Erro ao extrair alt texts:`, e);
            }
            
            // Extrair texto básico (remover tags HTML) - AUMENTAR LIMITE
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 20000); // 🔥 AUMENTADO: De 15000 para 20000
            
            // 🔥 NOVO: Adicionar dados estruturados e alt texts ao conteúdo
            let enhancedContent = `URL: ${baseUrl} (Homepage)\nConteúdo: ${textContent}`;
            if (Object.keys(structuredData).length > 0) {
              enhancedContent += `\n\nDados Estruturados (Schema.org): ${JSON.stringify(structuredData).substring(0, 5000)}`;
            }
            if (imageAltTexts.length > 0) {
              enhancedContent += `\n\nProdutos em Imagens (Alt Text): ${imageAltTexts.join(', ')}`;
            }
            
            pagesContent.push(enhancedContent);
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

        // 🔥 MELHORADO: Buscar páginas do site via SERPER (com múltiplas queries para máximo de cobertura)
        const serperKey = Deno.env.get('SERPER_API_KEY');
        if (serperKey) {
          try {
            // 🔥 NOVO: Múltiplas queries SERPER para cobrir mais páginas (até 50 resultados por query)
            const serperQueries = [
              `site:${domain} (produtos OR serviços OR catálogo OR soluções)`,
              `site:${domain} (linha OR equipamentos OR EPI OR luvas)`,
              `site:${domain} (produtos em destaque OR novidades OR lançamentos)`,
              `site:${domain} (categoria OR categorias OR subcategoria)`,
              `site:${domain} (shop OR loja OR e-commerce OR vendas)`,
              `site:${domain} (modelo OR referência OR código OR SKU)`,
            ];
            
            const allSerperResults: any[] = [];
            
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
                    num: 50, // 🔥 AUMENTADO: Máximo do SERPER (era 15)
                    gl: 'br',
                    hl: 'pt-br',
                  }),
                });

                if (serperResponse.ok) {
                  const serperData = await serperResponse.json();
                  const organicResults = serperData.organic || [];
                  
                  for (const result of organicResults) {
                    // Evitar duplicatas da homepage e URLs já descobertas
                    if (result.link && 
                        result.link.includes(domain) && 
                        result.link !== baseUrl && 
                        result.link !== `${baseUrl}/` &&
                        !discoveredUrls.has(result.link)) {
                      allSerperResults.push(result);
                      discoveredUrls.add(result.link);
                    }
                  }
                  
                  console.log(`[ScanCompetitor] ✅ Query "${query.substring(0, 50)}..." retornou ${organicResults.length} resultados`);
                }
                
                // Pequeno delay entre queries para não sobrecarregar API
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (queryError) {
                console.error(`[ScanCompetitor] ⚠️ Erro na query SERPER "${query}":`, queryError);
              }
            }
            
            // Adicionar resultados únicos ao pagesContent
            for (const result of allSerperResults) {
              pagesContent.push(`Página: ${result.title}\nURL: ${result.link}\nDescrição: ${result.snippet || ''}`);
            }

            console.log(`[ScanCompetitor] ✅ Total de ${allSerperResults.length} páginas únicas encontradas via SERPER (múltiplas queries)`);
          } catch (serperError) {
            console.error('[ScanCompetitor] Erro no SERPER:', serperError);
          }
        }

        // 🔥 NOVO: Processar URLs do sitemap encontradas
        console.log(`[ScanCompetitor] 🔍 Processando ${sitemapUrls.length} URLs do sitemap...`);
        const maxSitemapUrls = 200; // 🔥 AUMENTADO: De 0 para 200 para cobrir sites grandes
        for (let i = 0; i < Math.min(sitemapUrls.length, maxSitemapUrls); i++) {
          const sitemapUrl = sitemapUrls[i];
          try {
            const sitemapPageResponse = await fetch(sitemapUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(10000),
            });
            
            if (sitemapPageResponse.ok) {
              const html = await sitemapPageResponse.text();
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 12000);
              
              pagesContent.push(`URL: ${sitemapUrl} (Sitemap)\nConteúdo: ${textContent}`);
              console.log(`[ScanCompetitor] ✅ URL do sitemap processada (${i + 1}/${Math.min(sitemapUrls.length, maxSitemapUrls)}): ${sitemapUrl}`);
            }
          } catch (e) {
            console.log(`[ScanCompetitor] ⚠️ Erro ao acessar URL do sitemap ${sitemapUrl}:`, e);
          }
          if (i < Math.min(sitemapUrls.length, maxSitemapUrls) - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        // 🔥 NOVO: Acessar TODOS os links do menu de navegação encontrados
        console.log(`[ScanCompetitor] 🔍 Processando ${menuLinks.length} links do menu...`);
        for (let i = 0; i < menuLinks.length; i++) {
          const menuLink = menuLinks[i];
          if (discoveredUrls.has(menuLink)) {
            console.log(`[ScanCompetitor] ⏭️ Link do menu já processado: ${menuLink}`);
            continue;
          }
          try {
            console.log(`[ScanCompetitor] 🔍 Acessando link do menu: ${menuLink}`);
            const menuResponse = await fetch(menuLink, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(10000),
            });
            
            if (menuResponse.ok) {
              const html = await menuResponse.text();
              
              // 🔥 NOVO: Detectar paginação na página (ex: /page/2, ?page=2, /p/2)
              const paginationLinks: string[] = [];
              const paginationPatterns = [
                /href=["']([^"']*\/page\/[2-9][0-9]*[^"']*)["']/gi,
                /href=["']([^"']*\?page=[2-9][0-9]*[^"']*)["']/gi,
                /href=["']([^"']*\/p\/[2-9][0-9]*[^"']*)["']/gi,
                /href=["']([^"']*\/pagina\/[2-9][0-9]*[^"']*)["']/gi,
                /href=["']([^"']*\/pag\/[2-9][0-9]*[^"']*)["']/gi,
                /href=["']([^"']*\/offset\/[0-9]+[^"']*)["']/gi,
              ];
              
              for (const pattern of paginationPatterns) {
                const matches = html.matchAll(pattern);
                for (const match of matches) {
                  if (match[1]) {
                    const fullPaginationUrl = match[1].startsWith('http') 
                      ? match[1] 
                      : match[1].startsWith('/') 
                        ? `${baseUrl}${match[1]}` 
                        : `${baseUrl}/${match[1]}`;
                    if (fullPaginationUrl.includes(domain) && !discoveredUrls.has(fullPaginationUrl)) {
                      paginationLinks.push(fullPaginationUrl);
                      discoveredUrls.add(fullPaginationUrl);
                    }
                  }
                }
              }
              
              // 🔥 NOVO: Processar até 10 páginas de paginação
              for (let p = 0; p < Math.min(paginationLinks.length, 10); p++) {
                try {
                  const paginationResponse = await fetch(paginationLinks[p], {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(10000),
                  });
                  if (paginationResponse.ok) {
                    const pagHtml = await paginationResponse.text();
                    const pagText = pagHtml
                      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .substring(0, 12000);
                    pagesContent.push(`URL: ${paginationLinks[p]} (Paginação)\nConteúdo: ${pagText}`);
                    console.log(`[ScanCompetitor] ✅ Página de paginação processada: ${paginationLinks[p]}`);
                  }
                } catch (pagError) {
                  console.log(`[ScanCompetitor] ⚠️ Erro ao processar paginação ${paginationLinks[p]}:`, pagError);
                }
              }
              
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 12000);
              
              pagesContent.push(`URL: ${menuLink} (Menu)\nConteúdo: ${textContent}`);
              discoveredUrls.add(menuLink);
              console.log(`[ScanCompetitor] ✅ Página do menu acessada (${i + 1}/${menuLinks.length}): ${menuLink}`);
            }
          } catch (e) {
            console.log(`[ScanCompetitor] ⚠️ Erro ao acessar link do menu ${menuLink}:`, e);
          }
          // Pequeno delay entre requisições para não sobrecarregar
          if (i < menuLinks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
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
            if (discoveredUrls.has(fullUrl)) continue;
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
                .substring(0, 12000);
              
              pagesContent.push(`URL: ${fullUrl}\nConteúdo: ${textContent}`);
              discoveredUrls.add(fullUrl);
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
                .substring(0, 20000); // 🔥 AUMENTADO: De 15000 para 20000
              
              pagesContent.push(`URL: ${source_url}\nConteúdo: ${textContent}`);
            }
          } catch {
            // Erro ao acessar URL
          }
        }

        // Converter pagesContent em string única para compatibilidade (já está correto)
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

    // 2. Usar OpenAI para extrair produtos (MESMO PROMPT MELHORADO DO TENANT)
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

Conteúdo das páginas:\n\n${content.substring(0, 25000)}`
          }
        ],
        temperature: 0.1, // 🔥 REDUZIDO para máxima precisão (era 0.2)
        max_tokens: 8000, // 🔥 AUMENTADO para extrair mais produtos (era 6000)
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

