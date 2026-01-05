// 🔍 ESCANEAR WEBSITE DA EMPRESA PROSPECTADA + LINKEDIN
// Extrai produtos/serviços e compara com produtos do tenant
// NÃO modifica scan-website-products ou scan-competitor-url

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

interface ScanProspectRequest {
  tenant_id: string;
  qualified_prospect_id?: string; // Opcional: pode vir de company_id
  company_id?: string; // NOVO: aceita company_id como alternativa
  website_url: string;
  razao_social?: string;
  cnpj?: string; // NOVO: para buscar qualified_prospect_id se necessário
}

serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO (ANTES DE QUALQUER COISA - SEM TRY/CATCH)
  // ⚠️ IMPORTANTE: O navegador faz preflight OPTIONS antes de POST
  // ⚠️ CRÍTICO: Status 200 é obrigatório para passar no check do navegador
  if (req.method === 'OPTIONS') {
    console.log('[SCAN-PROSPECT-WEBSITE] ✅ OPTIONS preflight recebido');
    return new Response('', { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { tenant_id, qualified_prospect_id, company_id, website_url, razao_social, cnpj } = await req.json() as ScanProspectRequest;

    if (!tenant_id || !website_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'tenant_id e website_url são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar qualified_prospect_id se não fornecido
    let prospectId = qualified_prospect_id;
    
    if (!prospectId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Tentar buscar por company_id
      if (company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('id, cnpj')
          .eq('id', company_id)
          .single();
        
        if (company?.cnpj) {
          const { data: prospect } = await supabase
            .from('qualified_prospects')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('cnpj', company.cnpj)
            .single();
          
          if (prospect) prospectId = prospect.id;
        }
      }
      
      // Tentar buscar por CNPJ diretamente
      if (!prospectId && cnpj) {
        const { data: prospect } = await supabase
          .from('qualified_prospects')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('cnpj', cnpj)
          .single();
        
        if (prospect) prospectId = prospect.id;
      }

      if (!prospectId) {
        return new Response(
          JSON.stringify({ success: false, error: 'qualified_prospect_id não encontrado. Empresa precisa estar no estoque qualificado.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[ScanProspect] 🔍 Escaneando website:', website_url);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');

    if (!supabaseKey) {
      throw new Error('SERVICE_ROLE_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Usar prospectId encontrado
    const qualified_prospect_id = prospectId;

    // 1. Buscar produtos do tenant para comparação
    const { data: tenantProducts, error: tenantError } = await supabase
      .from('tenant_products')
      .select('nome, categoria, descricao')
      .eq('tenant_id', tenant_id);

    if (tenantError) {
      console.warn('[ScanProspect] ⚠️ Erro ao buscar produtos do tenant:', tenantError);
    }

    const tenantProductsList = tenantProducts || [];
    console.log(`[ScanProspect] 📦 Produtos do tenant para comparação: ${tenantProductsList.length}`);

    console.log('[ScanProspect] ✅ Usando qualified_prospect_id:', qualified_prospect_id);

    // 2. Extrair domínio do website
    const domain = website_url.replace(/^https?:\/\//, '').split('/')[0];
    const baseUrl = website_url.startsWith('http') ? website_url : `https://${website_url}`;

    // 3. Coletar conteúdo do website
    const pagesContent: string[] = [];

    // 3.1. Acessar homepage
    try {
      const homepageResponse = await fetch(baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(15000),
      });

      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        
        // ✅ NOVO: Extrair LinkedIn diretamente do HTML (rodapé, header, etc.)
        const linkedinPatterns = [
          /linkedin\.com\/company\/([a-zA-Z0-9\-]+)/gi,
          /linkedin\.com\/company\/([a-zA-Z0-9\-]+)\/?/gi,
          /href=["']([^"']*linkedin\.com\/company\/[^"']*)["']/gi,
        ];
        
        for (const pattern of linkedinPatterns) {
          const matches = html.match(pattern);
          if (matches && matches.length > 0) {
            for (const match of matches) {
              let linkedinMatch = match;
              if (match.includes('href=')) {
                linkedinMatch = match.match(/linkedin\.com\/company\/[a-zA-Z0-9\-]+/)?.[0] || '';
              }
              if (linkedinMatch && !linkedinMatch.startsWith('http')) {
                linkedinMatch = `https://www.${linkedinMatch}`;
              }
              if (linkedinMatch && linkedinMatch.includes('linkedin.com/company/')) {
                console.log('[ScanProspect] ✅ LinkedIn encontrado no HTML do site:', linkedinMatch);
                // Será usado mais tarde na seção de LinkedIn
                html.match(/linkedin\.com\/company\/[a-zA-Z0-9\-]+/)?.[0];
              }
            }
            break; // Encontrou, não precisa continuar
          }
        }
        
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 20000);

        pagesContent.push(`URL: ${baseUrl} (Homepage)\nConteúdo: ${textContent}`);
        console.log('[ScanProspect] ✅ Homepage acessada');
      }
    } catch (error) {
      console.warn('[ScanProspect] ⚠️ Erro ao acessar homepage:', error);
    }

    // 3.2. Buscar páginas via SERPER (se disponível)
    if (serperKey) {
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `site:${domain} (produtos OR serviços OR soluções OR catálogo)`,
            num: 10,
            gl: 'br',
            hl: 'pt-br',
          }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          const organicResults = serperData.organic || [];

          for (const result of organicResults.slice(0, 5)) {
            if (result.link && result.link !== baseUrl) {
              pagesContent.push(`Página: ${result.title}\nURL: ${result.link}\nDescrição: ${result.snippet || ''}`);
            }
          }
        }
      } catch (error) {
        console.warn('[ScanProspect] ⚠️ Erro no SERPER:', error);
      }
    }

    if (pagesContent.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum conteúdo encontrado no website',
          products_found: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Usar OpenAI para extrair produtos
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 8000,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extrair produtos e serviços de websites corporativos. 
Extraia TODOS os produtos/serviços mencionados, com nome, descrição, categoria e subcategoria.
Retorne APENAS um JSON array válido, sem markdown, sem explicações.`,
          },
          {
            role: 'user',
            content: `Extraia todos os produtos e serviços deste website:\n\n${pagesContent.join('\n\n---\n\n')}\n\nRetorne JSON array: [{"nome": "...", "descricao": "...", "categoria": "...", "subcategoria": "..."}]`,
          },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('Erro na API OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content || '[]';

    // Parse produtos extraídos
    let extractedProducts: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedProducts = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[ScanProspect] ❌ Erro ao parsear produtos:', error);
    }

    console.log(`[ScanProspect] 📦 Produtos extraídos: ${extractedProducts.length}`);

    // 5. Inserir produtos na tabela prospect_extracted_products
    let insertedCount = 0;
    for (const product of extractedProducts) {
      if (!product.nome || product.nome.trim().length === 0) continue;

      const { error: insertError } = await supabase
        .from('prospect_extracted_products')
        .insert({
          qualified_prospect_id,
          tenant_id,
          nome: product.nome.trim(),
          descricao: product.descricao?.trim() || null,
          categoria: product.categoria?.trim() || null,
          subcategoria: product.subcategoria?.trim() || null,
          fonte: 'website',
          url_origem: baseUrl,
          confianca_extracao: 0.7,
          dados_brutos: product,
        })
        .select();

      if (!insertError) {
        insertedCount++;
      } else {
        console.warn(`[ScanProspect] ⚠️ Erro ao inserir produto "${product.nome}":`, insertError);
      }
    }

    // 6. Buscar LinkedIn com múltiplas estratégias
    let linkedinUrl: string | null = null;
    
    // ✅ ESTRATÉGIA 1: Extrair do HTML do website (mais rápido e confiável)
    try {
      const homepageResponse = await fetch(baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      });
      
      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        
        // Padrões para encontrar LinkedIn no HTML
        const linkedinPatterns = [
          /https?:\/\/[^"'\s]*linkedin\.com\/company\/[a-zA-Z0-9\-]+/gi,
          /linkedin\.com\/company\/([a-zA-Z0-9\-]+)/gi,
          /href=["']([^"']*linkedin\.com\/company\/[^"']*)["']/gi,
        ];
        
        for (const pattern of linkedinPatterns) {
          const matches = html.match(pattern);
          if (matches && matches.length > 0) {
            for (const match of matches) {
              let url = match;
              // Se encontrou em href, extrair apenas a URL
              if (url.includes('href=')) {
                const urlMatch = url.match(/https?:\/\/[^"'\s]*linkedin\.com\/company\/[a-zA-Z0-9\-]+/i);
                if (urlMatch) url = urlMatch[0];
                else {
                  const companyMatch = url.match(/linkedin\.com\/company\/([a-zA-Z0-9\-]+)/i);
                  if (companyMatch) url = `https://www.linkedin.com/company/${companyMatch[1]}`;
                }
              } else if (!url.startsWith('http')) {
                url = `https://www.${url}`;
              }
              
              if (url && url.includes('linkedin.com/company/') && !url.includes('/in/') && !url.includes('/pub/')) {
                linkedinUrl = url.split('?')[0].split('#')[0]; // Remover query params e hash
                console.log('[ScanProspect] ✅ LinkedIn extraído do HTML do site:', linkedinUrl);
                break;
              }
            }
            if (linkedinUrl) break;
          }
        }
      }
    } catch (error) {
      console.warn('[ScanProspect] ⚠️ Erro ao extrair LinkedIn do HTML:', error);
    }
    
    // ✅ ESTRATÉGIA 2: Buscar via SERPER (se não encontrou no HTML)
    if (!linkedinUrl && serperKey) {
      // ✅ Buscar prospect no banco para ter mais dados
      let prospectData: any = null;
      try {
        const { data: prospect } = await supabase
          .from('qualified_prospects')
          .select('razao_social, nome_fantasia, cnpj')
          .eq('id', qualified_prospect_id)
          .eq('tenant_id', tenant_id)
          .single();
        prospectData = prospect;
      } catch (err) {
        console.warn('[ScanProspect] ⚠️ Erro ao buscar dados do prospect:', err);
      }

      const companyName = razao_social || prospectData?.razao_social || '';
      const nomeFantasia = prospectData?.nome_fantasia || '';
      
      if (!companyName && !nomeFantasia) {
        console.log('[ScanProspect] ⚠️ Sem nome da empresa para buscar LinkedIn');
      } else {
        // ✅ ESTRATÉGIA 2: Buscar por razão social via SERPER
        const queries = [];
        if (companyName) {
          queries.push(`"${companyName}" site:linkedin.com/company`);
          queries.push(`${companyName} linkedin company brasil`);
        }
        if (nomeFantasia && nomeFantasia !== companyName) {
          queries.push(`"${nomeFantasia}" site:linkedin.com/company`);
          queries.push(`${nomeFantasia} linkedin company brasil`);
        }

        console.log('[ScanProspect] 🔍 Buscando LinkedIn via SERPER com queries:', queries);

        // ✅ Tentar todas as queries até encontrar
        for (const linkedinQuery of queries) {
          if (linkedinUrl) break; // Já encontrou, parar

          try {
            const linkedinResponse = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                q: linkedinQuery,
                num: 5, // ✅ Aumentar para 5 resultados
                gl: 'br',
                hl: 'pt-br',
              }),
            });

            if (linkedinResponse.ok) {
              const linkedinData = await linkedinResponse.json();
              const organicResults = linkedinData.organic || [];
              console.log('[ScanProspect] 🔍 Resultados SERPER LinkedIn:', {
                query: linkedinQuery,
                total_results: organicResults.length,
                results: organicResults.map((r: any) => ({
                  link: r.link,
                  title: r.title,
                })),
              });
              
              // ✅ Buscar em todos os resultados
              for (const result of organicResults) {
                if (result?.link) {
                  const link = result.link.toLowerCase();
                  // ✅ Aceitar qualquer URL do LinkedIn que seja de empresa
                  if (link.includes('linkedin.com/company') || 
                      link.includes('linkedin.com/company/') ||
                      (link.includes('linkedin.com') && !link.includes('/in/') && !link.includes('/pub/'))) {
                    linkedinUrl = result.link;
                    console.log('[ScanProspect] ✅ LinkedIn encontrado:', {
                      url: linkedinUrl,
                      query_usada: linkedinQuery,
                      title: result.title,
                    });
                    break;
                  }
                }
              }
            } else {
              const errorText = await linkedinResponse.text();
              console.warn('[ScanProspect] ⚠️ Erro na busca SERPER LinkedIn:', {
                status: linkedinResponse.status,
                query: linkedinQuery,
                error: errorText,
              });
            }
          } catch (error) {
            console.warn('[ScanProspect] ⚠️ Erro ao buscar LinkedIn:', {
              query: linkedinQuery,
              error: error.message || error,
            });
          }
        }
        
        if (!linkedinUrl) {
          console.log('[ScanProspect] ⚠️ LinkedIn não encontrado após tentar todas as queries SERPER');
        } else {
          console.log('[ScanProspect] ✅ LinkedIn encontrado via SERPER:', linkedinUrl);
        }
      }
    } else if (!linkedinUrl) {
      console.log('[ScanProspect] ⚠️ SERPER_API_KEY não configurada, pulando busca LinkedIn');
    }

    // 7. ✅ ANÁLISE INTELIGENTE COM IA: Comparar produtos usando contexto e aplicação
    const compatibleProducts: any[] = [];
    let websiteFitScore = 0; // ✅ Declarar variável antes de usar
    
    console.log(`[ScanProspect] 🔍 Condições para análise IA:`, {
      extractedProducts: extractedProducts.length,
      tenantProducts: tenantProductsList.length,
      hasOpenAIKey: !!openaiKey,
    });
    
    if (extractedProducts.length > 0 && tenantProductsList.length > 0 && openaiKey) {
      console.log('[ScanProspect] 🤖 Usando IA para análise contextual de fit...');
      
      try {
        // Preparar contexto para análise IA
        const prospectContext = {
          razao_social: razao_social || '',
          produtos: extractedProducts.slice(0, 20).map(p => ({
            nome: p.nome || '',
            categoria: p.categoria || '',
            descricao: p.descricao || ''
          })),
          setor: extractedProducts[0]?.categoria || 'Não especificado'
        };

        const tenantContext = {
          produtos: tenantProductsList.slice(0, 20).map(p => ({
            nome: p.nome || '',
            categoria: p.categoria || '',
            descricao: p.descricao || ''
          }))
        };

        // Chamar OpenAI para análise contextual
        const aiAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `Você é um especialista em análise de fit entre empresas B2B. Analise se os produtos/serviços do tenant podem ser aplicados/usados nos processos de fabricação, operação ou negócio da empresa prospect.

IMPORTANTE: Considere:
- Produtos de FABRICAÇÃO do prospect podem usar produtos de AUTOMAÇÃO, SOFTWARE, EQUIPAMENTOS do tenant
- Produtos de SERVIÇOS do prospect podem usar produtos de TECNOLOGIA, CONSULTORIA, FERRAMENTAS do tenant
- Produtos de COMÉRCIO do prospect podem usar produtos de GESTÃO, LOGÍSTICA, MARKETING do tenant
- Analise APLICAÇÃO e USABILIDADE, não apenas nomes similares

Retorne APENAS um JSON válido com este formato:
{
  "matches": [
    {
      "prospect_product": "nome do produto do prospect",
      "tenant_product": "nome do produto do tenant",
      "match_type": "aplicacao" | "uso" | "fabricacao" | "processo" | "suporte",
      "confidence": 0.0-1.0,
      "reason": "explicação curta do porquê há fit"
    }
  ],
  "overall_fit_score": 0-20,
  "analysis": "análise geral do fit em 2-3 frases"
}`
              },
              {
                role: 'user',
                content: `Analise o fit entre:

EMPRESA PROSPECT (${razao_social || 'Empresa'}):
Produtos/Serviços que fabrica/fornece:
${prospectContext.produtos.map((p, i) => `${i + 1}. ${p.nome}${p.categoria ? ` (${p.categoria})` : ''}${p.descricao ? ` - ${p.descricao}` : ''}`).join('\n')}

PRODUTOS/SERVIÇOS DO TENANT (ofertas):
${tenantContext.produtos.map((p, i) => `${i + 1}. ${p.nome}${p.categoria ? ` (${p.categoria})` : ''}${p.descricao ? ` - ${p.descricao}` : ''}`).join('\n')}

Identifique quais produtos do tenant podem ser APLICADOS ou USADOS nos processos de fabricação, operação ou negócio da empresa prospect. Considere contexto, não apenas nomes similares.`
              }
            ],
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: 'json_object' }
          }),
        });

        if (aiAnalysisResponse.ok) {
          const aiData = await aiAnalysisResponse.json();
          const aiContent = aiData.choices[0]?.message?.content;
          
          if (aiContent) {
            try {
              const aiResult = JSON.parse(aiContent);
              
              if (aiResult.matches && Array.isArray(aiResult.matches)) {
                compatibleProducts.push(...aiResult.matches.map((match: any) => ({
                  prospect_product: match.prospect_product,
                  tenant_product: match.tenant_product,
                  match_type: match.match_type || 'aplicacao',
                  confidence: match.confidence || 0.5,
                  reason: match.reason || '',
                })));
                
                // Usar score da IA se disponível, senão calcular
                websiteFitScore = aiResult.overall_fit_score || 
                  Math.min(20, Math.round((compatibleProducts.length / extractedProducts.length) * 20));
                
                console.log(`[ScanProspect] ✅ IA encontrou ${compatibleProducts.length} matches com score ${websiteFitScore}/20`);
              }
            } catch (parseError) {
              console.warn('[ScanProspect] ⚠️ Erro ao parsear resposta IA, usando fallback:', parseError);
            }
          }
        } else {
          const errorText = await aiAnalysisResponse.text();
          console.warn('[ScanProspect] ⚠️ Erro na API OpenAI:', aiAnalysisResponse.status, errorText);
          console.warn('[ScanProspect] ⚠️ Usando fallback simples...');
        }
      } catch (aiError) {
        console.warn('[ScanProspect] ⚠️ Erro ao chamar IA, usando fallback:', aiError);
      }
    } else {
      console.log('[ScanProspect] ⚠️ Análise IA não executada:', {
        reason: !extractedProducts.length ? 'Sem produtos extraídos' : 
                !tenantProductsList.length ? 'Sem produtos do tenant' : 
                !openaiKey ? 'Sem chave OpenAI' : 'Desconhecido'
      });
    }

    // ✅ FALLBACK: Comparação simples se IA não funcionar ou não houver produtos suficientes
    if (compatibleProducts.length === 0 && extractedProducts.length > 0 && tenantProductsList.length > 0) {
      console.log('[ScanProspect] 🔄 Usando fallback de comparação simples...');
      
      for (const extracted of extractedProducts) {
        for (const tenant of tenantProductsList) {
          const extractedLower = extracted.nome?.toLowerCase() || '';
          const tenantLower = tenant.nome?.toLowerCase() || '';
          
          // Match por categoria
          if (extracted.categoria && tenant.categoria && 
              extracted.categoria.toLowerCase() === tenant.categoria.toLowerCase()) {
            compatibleProducts.push({
              prospect_product: extracted.nome,
              tenant_product: tenant.nome,
              match_type: 'categoria',
              confidence: 0.6,
            });
            break;
          }
          
          // Match por palavras-chave
          const extractedWords = extractedLower.split(/\s+/);
          const tenantWords = tenantLower.split(/\s+/);
          const commonWords = extractedWords.filter(w => w.length > 3 && tenantWords.includes(w));
          
          if (commonWords.length >= 2) {
            compatibleProducts.push({
              prospect_product: extracted.nome,
              tenant_product: tenant.nome,
              match_type: 'keywords',
              confidence: 0.4,
            });
            break;
          }
        }
      }
      
      // Calcular score baseado em matches encontrados
      if (compatibleProducts.length > 0) {
        const matchRatio = compatibleProducts.length / extractedProducts.length;
        websiteFitScore = Math.min(20, Math.round(matchRatio * 20));
      }
    }

    console.log(`[ScanProspect] ✅ Produtos compatíveis encontrados: ${compatibleProducts.length}`);
    console.log(`[ScanProspect] ✅ Website Fit Score: ${websiteFitScore}/20 pontos`);

    // ✅ Formatar produtos compatíveis no formato esperado
    const formattedCompatibleProducts = compatibleProducts.map((comp: any) => ({
      prospect_product: comp.prospect_product || comp.extracted || '',
      tenant_product: comp.tenant_product || comp.tenant || '',
      match_type: comp.match_type || 'category_match',
      confidence: comp.confidence || 0.5,
      reason: comp.reason || '',
    }));

    console.log(`[ScanProspect] ✅ Website Fit Score calculado: ${websiteFitScore}/20 pontos`);

    // ✅ CRÍTICO: Atualizar qualified_prospects com os dados calculados
    if (qualified_prospect_id) {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };

      // ✅ SEMPRE atualizar website_encontrado com o website_url fornecido
      if (website_url && website_url.trim()) {
        updatePayload.website_encontrado = website_url.trim();
        console.log('[ScanProspect] ✅ website_encontrado será atualizado:', updatePayload.website_encontrado);
      } else {
        console.warn('[ScanProspect] ⚠️ website_url vazio ou inválido:', website_url);
      }

      // ✅ SEMPRE atualizar website_fit_score (mesmo se for 0)
      updatePayload.website_fit_score = websiteFitScore || 0;
      console.log('[ScanProspect] ✅ website_fit_score será atualizado:', updatePayload.website_fit_score);

      // ✅ SEMPRE atualizar website_products_match (mesmo se for array vazio)
      updatePayload.website_products_match = formattedCompatibleProducts || [];
      console.log('[ScanProspect] ✅ website_products_match será atualizado:', updatePayload.website_products_match.length, 'produtos');

      // ✅ SEMPRE atualizar linkedin_url se foi encontrado
      if (linkedinUrl && linkedinUrl.trim()) {
        updatePayload.linkedin_url = linkedinUrl.trim();
        console.log('[ScanProspect] ✅ linkedin_url será atualizado:', updatePayload.linkedin_url);
      } else {
        console.log('[ScanProspect] ⚠️ linkedin_url não encontrado ou vazio');
      }

      console.log('[ScanProspect] 📦 Payload completo para atualização:', JSON.stringify(updatePayload, null, 2));

      const { error: updateError, data: updateData } = await supabase
        .from('qualified_prospects')
        .update(updatePayload)
        .eq('id', qualified_prospect_id)
        .eq('tenant_id', tenant_id)
        .select('id, website_encontrado, linkedin_url, website_fit_score, website_products_match, company_id, cnpj');

      if (updateError) {
        console.error('[ScanProspect] ❌ ERRO ao atualizar qualified_prospects:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          qualified_prospect_id,
          tenant_id,
          payload: updatePayload,
        });
        // Não falhar a requisição se a atualização falhar, mas logar o erro detalhadamente
      } else {
        console.log('[ScanProspect] ✅ qualified_prospects atualizado com sucesso:', {
          id: updateData?.[0]?.id,
          website_encontrado: updateData?.[0]?.website_encontrado,
          linkedin_url: updateData?.[0]?.linkedin_url,
          website_fit_score: updateData?.[0]?.website_fit_score,
          products_match_count: Array.isArray(updateData?.[0]?.website_products_match) ? updateData[0].website_products_match.length : 0,
        });
        
        // ✅ Verificar se os dados foram realmente salvos
        if (!updateData || updateData.length === 0) {
          console.warn('[ScanProspect] ⚠️ Atualização retornou sem dados - pode indicar que o registro não existe ou RLS bloqueou');
        } else {
          // ✅ SINCRONIZAR COM companies SE HOUVER company_id
          const prospectData = updateData[0];
          const companyIdToSync = prospectData.company_id || company_id;
          
          if (companyIdToSync) {
            console.log('[ScanProspect] 🔄 Sincronizando com companies (company_id:', companyIdToSync, ')');
            
            const companiesUpdatePayload: any = {
              updated_at: new Date().toISOString(),
            };
            
            // Sincronizar website
            if (updatePayload.website_encontrado) {
              companiesUpdatePayload.website = updatePayload.website_encontrado;
              companiesUpdatePayload.domain = updatePayload.website_encontrado.replace(/^https?:\/\//, '').split('/')[0];
            }
            
            // Sincronizar LinkedIn
            if (updatePayload.linkedin_url) {
              companiesUpdatePayload.linkedin_url = updatePayload.linkedin_url;
            }
            
            // Atualizar raw_data também para manter consistência
            const { data: currentCompany } = await supabase
              .from('companies')
              .select('raw_data')
              .eq('id', companyIdToSync)
              .single();
            
            if (currentCompany) {
              const existingRawData = (currentCompany.raw_data && typeof currentCompany.raw_data === 'object' && !Array.isArray(currentCompany.raw_data))
                ? currentCompany.raw_data as Record<string, any>
                : {};
              
              companiesUpdatePayload.raw_data = {
                ...existingRawData,
                website_enrichment: {
                  website_encontrado: updatePayload.website_encontrado,
                  website_fit_score: updatePayload.website_fit_score,
                  website_products_match: updatePayload.website_products_match,
                  linkedin_url: updatePayload.linkedin_url,
                  enriched_at: new Date().toISOString(),
                }
              };
            }
            
            const { error: companiesUpdateError } = await supabase
              .from('companies')
              .update(companiesUpdatePayload)
              .eq('id', companyIdToSync);
            
            if (companiesUpdateError) {
              console.warn('[ScanProspect] ⚠️ Erro ao sincronizar com companies:', companiesUpdateError);
            } else {
              console.log('[ScanProspect] ✅ companies sincronizado com sucesso:', {
                company_id: companyIdToSync,
                website: companiesUpdatePayload.website || 'N/A',
                linkedin_url: companiesUpdatePayload.linkedin_url || 'N/A',
              });
            }
          } else {
            // ✅ TENTAR ENCONTRAR company_id PELO CNPJ (se não tiver company_id direto)
            const prospectCnpj = prospectData.cnpj;
            if (prospectCnpj) {
              const normalizedCnpj = prospectCnpj.replace(/\D/g, '');
              const { data: matchingCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('cnpj', normalizedCnpj)
                .eq('tenant_id', tenant_id)
                .maybeSingle();
              
              if (matchingCompany?.id) {
                console.log('[ScanProspect] 🔍 Encontrado company_id pelo CNPJ:', matchingCompany.id);
                
                // Atualizar companies
                const companiesUpdatePayload: any = {
                  updated_at: new Date().toISOString(),
                };
                
                if (updatePayload.website_encontrado) {
                  companiesUpdatePayload.website = updatePayload.website_encontrado;
                  companiesUpdatePayload.domain = updatePayload.website_encontrado.replace(/^https?:\/\//, '').split('/')[0];
                }
                
                if (updatePayload.linkedin_url) {
                  companiesUpdatePayload.linkedin_url = updatePayload.linkedin_url;
                }
                
                // Atualizar raw_data
                const { data: currentCompany } = await supabase
                  .from('companies')
                  .select('raw_data')
                  .eq('id', matchingCompany.id)
                  .single();
                
                if (currentCompany) {
                  const existingRawData = (currentCompany.raw_data && typeof currentCompany.raw_data === 'object' && !Array.isArray(currentCompany.raw_data))
                    ? currentCompany.raw_data as Record<string, any>
                    : {};
                  
                  companiesUpdatePayload.raw_data = {
                    ...existingRawData,
                    website_enrichment: {
                      website_encontrado: updatePayload.website_encontrado,
                      website_fit_score: updatePayload.website_fit_score,
                      website_products_match: updatePayload.website_products_match,
                      linkedin_url: updatePayload.linkedin_url,
                      enriched_at: new Date().toISOString(),
                    }
                  };
                }
                
                const { error: companiesUpdateError } = await supabase
                  .from('companies')
                  .update(companiesUpdatePayload)
                  .eq('id', matchingCompany.id);
                
                if (companiesUpdateError) {
                  console.warn('[ScanProspect] ⚠️ Erro ao sincronizar companies pelo CNPJ:', companiesUpdateError);
                } else {
                  console.log('[ScanProspect] ✅ companies sincronizado pelo CNPJ:', matchingCompany.id);
                  
                  // Atualizar company_id em qualified_prospects para próxima vez
                  await supabase
                    .from('qualified_prospects')
                    .update({ company_id: matchingCompany.id })
                    .eq('id', qualified_prospect_id);
                }
              }
            }
          }
        }
      }
    } else {
      console.warn('[ScanProspect] ⚠️ qualified_prospect_id não encontrado, não é possível atualizar qualified_prospects');
    }

    console.log('[ScanProspect] 📤 Retornando resposta final:', {
      success: true,
      products_found: extractedProducts.length,
      website_fit_score: websiteFitScore,
      linkedin_url: linkedinUrl,
      linkedin_found: !!linkedinUrl,
    });

    return new Response(
      JSON.stringify({
        success: true,
        products_found: extractedProducts.length,
        products_inserted: insertedCount,
        compatible_products: compatibleProducts.length,
        website_fit_score: websiteFitScore, // ✅ ADICIONADO
        website_products_match: formattedCompatibleProducts, // ✅ FORMATADO
        linkedin_url: linkedinUrl, // ✅ CRÍTICO: Retornar LinkedIn na resposta
        compatible_products_details: compatibleProducts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ScanProspect] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

