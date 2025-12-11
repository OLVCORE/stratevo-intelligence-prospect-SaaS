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
    
    // 🔥 CRÍTICO: Verificar se SERVICE_ROLE_KEY está configurada
    if (!supabaseKey || supabaseKey.length < 20) {
      console.error('[ScanWebsite] ❌ SERVICE_ROLE_KEY não configurada ou inválida!');
      throw new Error('SERVICE_ROLE_KEY não configurada - necessário para bypass RLS');
    }
    
    console.log(`[ScanWebsite] ✅ SERVICE_ROLE_KEY configurada (${supabaseKey.substring(0, 10)}...)`);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 🔥 CRÍTICO: Verificar se consegue acessar a tabela (teste de conexão)
    try {
      const { data: testData, error: testError } = await supabase
        .from('tenant_products')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('[ScanWebsite] ❌ ERRO ao acessar tabela tenant_products:', testError);
        console.error('[ScanWebsite] ❌ Código do erro:', testError.code);
        console.error('[ScanWebsite] ❌ Mensagem:', testError.message);
      } else {
        console.log('[ScanWebsite] ✅ Tabela tenant_products acessível via SERVICE_ROLE_KEY');
      }
    } catch (testException: any) {
      console.error('[ScanWebsite] ❌ EXCEÇÃO ao testar acesso à tabela:', testException);
    }

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
    let structuredData: any = {}; // Para schema.org / JSON-LD
    let menuLinks: string[] = []; // Links do menu de navegação
    let imageAltTexts: string[] = []; // Alt text de imagens com produtos
    
    // 🔥 CRÍTICO: SEMPRE acessar a HOMEPAGE primeiro (onde geralmente há produtos em destaque)
    const baseUrl = website_url.startsWith('http') ? website_url : `https://${website_url}`;
    try {
      console.log(`[ScanWebsite] Acessando homepage: ${baseUrl}`);
      const homepageResponse = await fetch(baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(15000), // 15 segundos de timeout
      });
      
      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        console.log(`[ScanWebsite] HTML recebido (${html.length} caracteres)`);
        
        // 🔥 NOVO FASE 1: Extrair Schema.org / JSON-LD
        try {
          const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const match of jsonLdMatches) {
              try {
                const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
                const parsed = JSON.parse(jsonContent);
                if (parsed['@type'] === 'Product' || parsed['@type'] === 'ItemList' || Array.isArray(parsed)) {
                  structuredData = { ...structuredData, ...parsed };
                  console.log(`[ScanWebsite] ✅ Schema.org encontrado: ${parsed['@type'] || 'Array'}`);
                }
              } catch (e) {
                // Ignorar JSON inválido
              }
            }
          }
        } catch (e) {
          console.log(`[ScanWebsite] ⚠️ Erro ao extrair schema.org:`, e);
        }
        
        // 🔥 NOVO FASE 1: Extrair links do menu de navegação
        try {
          // Buscar elementos nav, menu, ou links com palavras-chave de produtos
          const navMatches = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi) || 
                            html.match(/<ul[^>]*class[^>]*menu[^>]*>([\s\S]*?)<\/ul>/gi) ||
                            html.match(/<ul[^>]*class[^>]*nav[^>]*>([\s\S]*?)<\/ul>/gi);
          
          if (navMatches) {
            for (const navMatch of navMatches) {
              // Extrair todos os links href
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
            console.log(`[ScanWebsite] ✅ ${menuLinks.length} links do menu encontrados`);
          }
        } catch (e) {
          console.log(`[ScanWebsite] ⚠️ Erro ao extrair menu:`, e);
        }
        
        // 🔥 NOVO FASE 1: Extrair alt text de imagens (produtos em imagens)
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
                     altText.match(/[A-Z][a-z]+/))) { // Tem capitalização (provavelmente nome próprio)
                  imageAltTexts.push(altText);
                }
              }
            }
            console.log(`[ScanWebsite] ✅ ${imageAltTexts.length} alt texts de produtos encontrados`);
          }
        } catch (e) {
          console.log(`[ScanWebsite] ⚠️ Erro ao extrair alt texts:`, e);
        }
        
        // Extrair texto básico (remover tags HTML) - AUMENTAR LIMITE
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 20000); // Aumentado de 15000 para 20000
        
        // 🔥 NOVO: Adicionar dados estruturados e alt texts ao conteúdo
        let enhancedContent = `URL: ${baseUrl} (Homepage)\nConteúdo: ${textContent}`;
        if (Object.keys(structuredData).length > 0) {
          enhancedContent += `\n\nDados Estruturados (Schema.org): ${JSON.stringify(structuredData).substring(0, 5000)}`;
        }
        if (imageAltTexts.length > 0) {
          enhancedContent += `\n\nProdutos em Imagens (Alt Text): ${imageAltTexts.join(', ')}`;
        }
        
        pagesContent.push(enhancedContent);
        console.log(`[ScanWebsite] ✅ Homepage acessada com sucesso (${textContent.length} caracteres)`);
        console.log(`[ScanWebsite] 📄 Preview do conteúdo (primeiros 500 chars):`, textContent.substring(0, 500));
      } else {
        console.log(`[ScanWebsite] ⚠️ Homepage retornou status ${homepageResponse.status}`);
      }
    } catch (homepageError: any) {
      console.error('[ScanWebsite] ❌ Erro ao acessar homepage:', homepageError);
      if (homepageError.name === 'AbortError') {
        console.error('[ScanWebsite] ⏱️ Timeout ao acessar homepage (15s)');
      }
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

    // 🔥 CRÍTICO: Acessar TODOS os links do menu de navegação encontrados (SEM LIMITE)
    // Processar em lotes para não sobrecarregar, mas garantir 100% de cobertura
    console.log(`[ScanWebsite] 🔍 Processando ${menuLinks.length} links do menu (100% de cobertura)`);
    for (let i = 0; i < menuLinks.length; i++) {
      const menuLink = menuLinks[i];
      try {
        console.log(`[ScanWebsite] 🔍 Acessando link do menu: ${menuLink}`);
        const menuResponse = await fetch(menuLink, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000),
        });
        
        if (menuResponse.ok) {
          const html = await menuResponse.text();
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 12000);
          
          pagesContent.push(`URL: ${menuLink} (Menu)\nConteúdo: ${textContent}`);
          console.log(`[ScanWebsite] ✅ Página do menu acessada (${i + 1}/${menuLinks.length}): ${menuLink}`);
        }
      } catch (e) {
        console.log(`[ScanWebsite] ⚠️ Erro ao acessar link do menu ${menuLink}:`, e);
      }
      // Pequeno delay entre requisições para não sobrecarregar
      if (i < menuLinks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
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
      '/shop', // 🔥 NOVO
      '/loja', // 🔥 NOVO
      '/catalogo-produtos', // 🔥 NOVO
    ];

    for (const path of commonProductPages) {
      try {
        const fullUrl = `https://${domain}${path}`;
        const pageResponse = await fetch(fullUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000),
        });
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 12000); // Aumentado de 10000 para 12000
          
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

Conteúdo das páginas:\n\n${pagesContent.join('\n\n---\n\n').substring(0, 25000)}`
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
    const content = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';
    
    console.log('[ScanWebsite] 📥 Resposta da OpenAI recebida (tamanho):', content.length, 'caracteres');
    console.log('[ScanWebsite] 📄 Preview da resposta (primeiros 500 chars):', content.substring(0, 500));

    // Parse do JSON
    let extractedProducts: any[] = [];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('[ScanWebsite] 🧹 Conteúdo limpo (tamanho):', cleanContent.length, 'caracteres');
      
      // Tentar encontrar JSON válido mesmo se houver texto antes/depois
      let jsonStart = cleanContent.indexOf('{');
      let jsonEnd = cleanContent.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonContent = cleanContent.substring(jsonStart, jsonEnd);
        console.log('[ScanWebsite] 🔍 Tentando parsear JSON extraído (tamanho):', jsonContent.length, 'caracteres');
        
        const parsed = JSON.parse(jsonContent);
        extractedProducts = parsed.produtos || parsed.products || [];
        
        console.log('[ScanWebsite] ✅ Produtos parseados:', extractedProducts.length);
        if (extractedProducts.length > 0) {
          console.log('[ScanWebsite] 📦 Primeiro produto:', JSON.stringify(extractedProducts[0], null, 2));
        } else {
          console.log('[ScanWebsite] ⚠️ NENHUM PRODUTO ENCONTRADO! Resposta completa:', cleanContent.substring(0, 2000));
        }
      } else {
        console.error('[ScanWebsite] ❌ Não foi possível encontrar JSON válido na resposta');
        console.error('[ScanWebsite] 📄 Conteúdo completo (primeiros 2000 chars):', cleanContent.substring(0, 2000));
        extractedProducts = [];
      }
    } catch (parseError: any) {
      console.error('[ScanWebsite] ❌ Erro ao parsear resposta da IA:', parseError);
      console.error('[ScanWebsite] 📄 Conteúdo que falhou (primeiros 2000 chars):', content.substring(0, 2000));
      console.error('[ScanWebsite] 🔍 Tentando extrair JSON manualmente...');
      
      // Tentar extrair JSON manualmente usando regex
      try {
        const jsonMatch = content.match(/\{[\s\S]*"produtos"[\s\S]*\}/) || content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedProducts = parsed.produtos || parsed.products || [];
          console.log('[ScanWebsite] ✅ Produtos extraídos manualmente:', extractedProducts.length);
        }
      } catch (manualParseError) {
        console.error('[ScanWebsite] ❌ Falha também no parse manual:', manualParseError);
        extractedProducts = [];
      }
    }

    // 4. Inserir produtos no banco
    let productsInserted = 0;
    let productsSkipped = 0;
    let productsError = 0;
    
    console.log(`[ScanWebsite] 🔄 Tentando inserir ${extractedProducts.length} produtos...`);
    console.log(`[ScanWebsite] 📋 Primeiros 3 produtos para debug:`, extractedProducts.slice(0, 3).map(p => ({
      nome: p.nome,
      categoria: p.categoria,
      has_referencia: !!p.referencia,
      has_descricao: !!p.descricao
    })));
    
    // 🔥 CRÍTICO: Verificar tenant_id antes de inserir
    console.log(`[ScanWebsite] 🔍 Verificando tenant_id: ${tenant_id}`);
    if (!tenant_id || tenant_id.length < 30) {
      console.error('[ScanWebsite] ❌ tenant_id inválido ou muito curto!');
      throw new Error(`tenant_id inválido: ${tenant_id}`);
    }
    
    for (let idx = 0; idx < extractedProducts.length; idx++) {
      const product = extractedProducts[idx];
      console.log(`[ScanWebsite] 🔄 Processando produto ${idx + 1}/${extractedProducts.length}: ${product.nome || 'SEM NOME'}`);
      if (!product.nome) {
        console.log(`[ScanWebsite] ⚠️ Produto sem nome, pulando:`, product);
        continue;
      }

      // 🔥 CRÍTICO: Verificar se já existe (com tratamento robusto de erros)
      let produtoJaExiste = false;
      try {
        const { data: existing, error: checkError } = await supabase
          .from('tenant_products')
          .select('id')
          .eq('tenant_id', tenant_id)
          .ilike('nome', product.nome.trim()) // Usar ilike para comparação case-insensitive
          .limit(1);

        if (checkError) {
          console.error(`[ScanWebsite] ⚠️ Erro ao verificar produto existente (${product.nome}):`, checkError);
          // Se erro for de RLS ou tabela não encontrada, tentar inserir mesmo assim
          if (checkError.code === '42P01' || checkError.message?.includes('permission denied')) {
            console.warn(`[ScanWebsite] ⚠️ Erro de permissão na verificação, tentando inserir mesmo assim: ${product.nome}`);
          } else {
            // Outros erros: continuar sem verificar
            console.warn(`[ScanWebsite] ⚠️ Erro na verificação, tentando inserir: ${product.nome}`);
          }
        } else if (existing && existing.length > 0) {
          produtoJaExiste = true;
          console.log(`[ScanWebsite] ⏭️ Produto já existe: ${product.nome}`);
          productsSkipped++;
        }
      } catch (checkException: any) {
        console.error(`[ScanWebsite] ⚠️ Exceção ao verificar produto (${product.nome}):`, checkException);
        // Continuar e tentar inserir mesmo assim
      }

      if (produtoJaExiste) {
        continue;
      }

      console.log(`[ScanWebsite] ➕ Inserindo produto: ${product.nome}`);
      
      // 🔥 CRÍTICO: Tentar inserir com tratamento robusto de erros
      try {
        // 🔥 NOVO: Incluir referência no nome se disponível
        let nomeCompleto = product.nome.trim();
        if (product.referencia && !nomeCompleto.includes(product.referencia)) {
          nomeCompleto = `${nomeCompleto} (Ref.: ${product.referencia})`;
        }
        
        // 🔥 CRÍTICO: Log detalhado ANTES da inserção
        console.log(`[ScanWebsite] 📝 Dados do produto antes de inserir:`, {
          tenant_id,
          nome: nomeCompleto,
          categoria: product.categoria,
          subcategoria: product.subcategoria,
          codigo_interno: product.referencia,
          has_descricao: !!product.descricao,
          has_setores: !!product.setores_alvo,
          has_diferenciais: !!product.diferenciais
        });
        
        // 🔥 CRÍTICO: Usar RPC para inserir se SERVICE_ROLE_KEY não estiver bypassando RLS
        // Tentar inserção direta primeiro
        let insertData: any = null;
        let insertError: any = null;
        
        try {
          const insertResult = await supabase
            .from('tenant_products')
            .insert({
              tenant_id,
              nome: nomeCompleto, // Nome completo com referência se houver
              descricao: product.descricao?.trim() || null,
              categoria: product.categoria?.trim() || null,
              subcategoria: product.subcategoria?.trim() || null, // 🔥 NOVO: Subcategoria
              codigo_interno: product.referencia?.trim() || null, // 🔥 NOVO: Referência no campo correto
              setores_alvo: product.setores_alvo || null,
              diferenciais: product.diferenciais || null,
              extraido_de: 'website',
              confianca_extracao: product.confianca || 0.7,
              dados_extraidos: { 
                source: domain,
                pages_scanned: pagesContent.length,
                menu_links_found: menuLinks.length, // 🔥 NOVO: Quantos links do menu foram encontrados
                images_found: imageAltTexts.length, // 🔥 NOVO: Quantas imagens com produtos foram encontradas
                structured_data_found: Object.keys(structuredData).length > 0, // 🔥 NOVO: Se schema.org foi encontrado
                raw: product 
              },
            })
            .select('id'); // Retornar ID para confirmar inserção
          
          insertData = insertResult.data;
          insertError = insertResult.error;
        } catch (insertException: any) {
          insertError = insertException;
          console.error(`[ScanWebsite] ❌ Exceção ao inserir (tentativa direta):`, insertException);
          
          // 🔥 FALLBACK: Tentar via RPC se inserção direta falhar
          try {
            console.log(`[ScanWebsite] 🔄 Tentando inserir via RPC como fallback...`);
            const { data: rpcData, error: rpcError } = await supabase.rpc('insert_tenant_product', {
              p_tenant_id: tenant_id,
              p_nome: nomeCompleto,
              p_descricao: product.descricao?.trim() || null,
              p_categoria: product.categoria?.trim() || null,
              p_subcategoria: product.subcategoria?.trim() || null,
              p_codigo_interno: product.referencia?.trim() || null,
              p_setores_alvo: product.setores_alvo ? JSON.stringify(product.setores_alvo) : null,
              p_diferenciais: product.diferenciais ? JSON.stringify(product.diferenciais) : null,
              p_extraido_de: 'website',
              p_confianca_extracao: product.confianca || 0.7,
              p_dados_extraidos: JSON.stringify({ 
                source: domain,
                pages_scanned: pagesContent.length,
                menu_links_found: menuLinks.length,
                images_found: imageAltTexts.length,
                structured_data_found: Object.keys(structuredData).length > 0,
                raw: product 
              })
            });
            
            if (!rpcError && rpcData) {
              insertData = [{ id: rpcData }];
              insertError = null;
              console.log(`[ScanWebsite] ✅ Produto inserido via RPC: ${product.nome} (ID: ${rpcData})`);
            } else {
              insertError = rpcError || insertError;
              console.error(`[ScanWebsite] ❌ RPC também falhou:`, {
                error: rpcError,
                rpcData: rpcData,
                produto: product.nome
              });
            }
          } catch (rpcException: any) {
            console.error(`[ScanWebsite] ❌ Exceção no RPC:`, rpcException);
            insertError = rpcException;
          }
        }

        // 🔥 CRÍTICO: Log detalhado APÓS tentativa de inserção
        if (!insertError && insertData && insertData.length > 0) {
          productsInserted++;
          console.log(`[ScanWebsite] ✅ Produto inserido com sucesso: ${product.nome} (ID: ${insertData[0].id})`);
        } else {
          productsError++;
          // 🔥 CRÍTICO: Log MUITO mais detalhado do erro
          console.error(`[ScanWebsite] ❌ ERRO AO INSERIR PRODUTO:`, {
            produto_nome: product.nome,
            produto_nome_completo: nomeCompleto,
            produto_categoria: product.categoria,
            tenant_id: tenant_id,
            error_code: insertError?.code,
            error_message: insertError?.message,
            error_hint: insertError?.hint,
            error_details: insertError?.details,
            insertData: insertData,
            insertData_length: insertData?.length,
            has_insertError: !!insertError,
            has_insertData: !!insertData
          });
          
          // 🔥 CRÍTICO: Se erro for de constraint ou duplicata, contar como skipped
          if (insertError?.code === '23505' || insertError?.message?.includes('duplicate')) {
            console.log(`[ScanWebsite] 🔄 Produto duplicado detectado (constraint violation): ${product.nome}`);
            productsSkipped++;
            productsError--; // Não contar como erro se for duplicata
          } else if (insertError?.code === '42501' || insertError?.message?.includes('permission denied')) {
            console.error(`[ScanWebsite] 🔒 ERRO DE PERMISSÃO RLS - SERVICE_ROLE_KEY não está bypassando RLS!`);
            console.error(`[ScanWebsite] 🔒 Verificar se SERVICE_ROLE_KEY está configurada corretamente`);
          }
        }
      } catch (insertException: any) {
        productsError++;
        console.error(`[ScanWebsite] ❌ Exceção ao inserir produto (${product.nome}):`, insertException);
        console.error(`[ScanWebsite] 📋 Stack trace:`, insertException.stack);
      }
    }
    
    console.log(`[ScanWebsite] 📊 Resumo da inserção: ${productsInserted} inseridos, ${productsSkipped} já existiam, ${productsError} com erro`);

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

