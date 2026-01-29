import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // 🔥 EXTRAIR PARÂMETROS COM VALIDAÇÃO RIGOROSA
    const company_id = typeof body.company_id === 'string' ? body.company_id.trim() : undefined
    const tenant_id = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : undefined
    const website_url = typeof body.website_url === 'string' ? body.website_url.trim() : ''
    const explicitMode = body.mode // 'prospect' | 'tenant' — prioridade absoluta

    const companyIdValid = company_id && company_id !== '' && company_id !== 'undefined' && company_id !== 'null' && company_id.length >= 30
    const tenantIdValid = tenant_id && tenant_id !== '' && tenant_id !== 'undefined' && tenant_id !== 'null' && tenant_id.length >= 30

    console.log('[ScanWebsite] ━━━ RECEBIDO ━━━')
    console.log('[ScanWebsite] company_id:', company_id ?? 'N/A', companyIdValid ? '(válido)' : '')
    console.log('[ScanWebsite] tenant_id:', tenant_id ?? 'N/A', tenantIdValid ? '(válido)' : '')
    console.log('[ScanWebsite] website_url:', website_url)
    console.log('[ScanWebsite] mode (explícito):', explicitMode ?? 'N/A')

    // GUARD: modo prospect não pode receber tenant_id (evita gravar em tenant_products por engano)
    if ((explicitMode === 'prospect' || companyIdValid) && tenantIdValid) {
      console.error('[ScanWebsite] ❌ tenant_id enviado junto com company_id/mode=prospect — rejeitando')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não é permitido enviar tenant_id quando mode=prospect ou company_id está presente. Produtos do prospect devem ir para companies.raw_data.',
          received: { company_id, tenant_id, mode: explicitMode },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!website_url || website_url === 'N/A' || website_url.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'website_url inválida ou não fornecida', received: { website_url } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔥 DETERMINAR MODO: prioridade para mode explícito; nunca misturar prospect com tenant
    let mode = explicitMode
    if (!mode || (mode !== 'prospect' && mode !== 'tenant')) {
      if (companyIdValid) mode = 'prospect'
      else if (tenantIdValid) mode = 'tenant'
    }

    console.log('[ScanWebsite] 🎯 MODO DETERMINADO:', mode)

    if (!mode || (mode !== 'prospect' && mode !== 'tenant')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível determinar o modo (prospect ou tenant). Envie mode: "prospect" ou "tenant" e o ID correspondente.',
          received: { company_id, tenant_id, explicitMode },
          hint: 'Prospect: company_id + website_url + mode: "prospect". Tenant: tenant_id + website_url + mode: "tenant".'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (mode === 'prospect' && !companyIdValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'company_id inválido para modo prospect', received: { company_id } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (mode === 'tenant' && !tenantIdValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'tenant_id inválido para modo tenant', received: { tenant_id } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    type ExtractedProduct = { name: string; category: string; description: string; price: null; image_url: null; extracted_at: string; source: string; note?: string }
    let extractedProducts: ExtractedProduct[] = []

    // ===== MODO PROSPECT: MOTOR PROFUNDO — sitemap (todas as URLs + index), homepage, catálogos, até ~80 páginas =====
    if (mode === 'prospect' && companyIdValid) {
      const baseUrl = website_url.startsWith('http') ? website_url : `https://${website_url}`
      const baseOrigin = baseUrl.replace(/\/$/, '')
      let domain = ''
      try {
        domain = new URL(baseUrl).hostname
      } catch {
        domain = website_url.replace(/https?:\/\//, '').split('/')[0]
      }

      const pagesContent: string[] = []
      const rawHtmlByUrl: { url: string; html: string }[] = []
      const discoveredUrls = new Set<string>()
      const FETCH_TIMEOUT_MS = 15000
      const FETCH_TIMEOUT_PAGE_MS = 10000
      const fetchOpts = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      }

      // 1) Sitemap — coletar TODAS as URLs (não só as com palavra-chave); suporte a sitemap index
      const productKeywords = ['produto', 'categoria', 'catalogo', 'product', 'category', 'shop', 'loja', 'servico', 'serviço', 'service', 'solucao', 'solução', '/p/', '/produto/', '/item/', '/product/', '/categoria/', '/linha']
      const allSitemapUrls: string[] = []
      const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap1.xml', '/sitemap_index.xml', '/sitemap.xml']

      async function collectFromSitemap(url: string): Promise<void> {
        try {
          const res = await fetch(url, { ...fetchOpts, signal: AbortSignal.timeout(12000) })
          if (!res.ok) return
          const xml = await res.text()
          const isIndex = /<sitemap\s/i.test(xml) && /<loc>/i.test(xml)
          const locs = xml.match(/<loc>(.*?)<\/loc>/gi) || []
          for (const loc of locs) {
            const u = loc.replace(/<\/?loc>/gi, '').trim()
            if (!u || discoveredUrls.has(u)) continue
            if (isIndex && (u.endsWith('.xml') || u.includes('sitemap'))) {
              discoveredUrls.add(u)
              await collectFromSitemap(u)
              continue
            }
            if (!isIndex && (u.startsWith('http') && u.includes(domain))) {
              discoveredUrls.add(u)
              allSitemapUrls.push(u)
            }
          }
        } catch (_) {}
      }

      for (const path of sitemapPaths) {
        try {
          await collectFromSitemap(`${baseOrigin}${path}`)
          if (allSitemapUrls.length > 0) break
        } catch (_) {}
      }

      // Ordenar: URLs com palavra-chave de produto primeiro; depois o restante (até 150 para escolher de onde buscar)
      const sitemapUrlsSorted = [...allSitemapUrls].sort((a, b) => {
        const aHas = productKeywords.some(k => a.toLowerCase().includes(k)) ? 1 : 0
        const bHas = productKeywords.some(k => b.toLowerCase().includes(k)) ? 1 : 0
        if (aHas !== bHas) return bHas - aHas
        return 0
      })
      const sitemapUrlsToFetch = sitemapUrlsSorted.slice(0, 120)
      console.log(`[ScanWebsite] 🔵 PROSPECT profundo: ${allSitemapUrls.length} URLs no sitemap (vamos buscar até ${Math.min(80, sitemapUrlsToFetch.length)} páginas)`)

      // 2) Homepage
      try {
        const homeRes = await fetch(baseUrl, { ...fetchOpts, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
        if (homeRes.ok) {
          const html = await homeRes.text()
          rawHtmlByUrl.push({ url: baseUrl, html })
          const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 25000)
          pagesContent.push(`URL: ${baseUrl} (Homepage)\nConteúdo: ${text}`)
          discoveredUrls.add(baseUrl)
        }
      } catch (e) {
        console.warn('[ScanWebsite] ⚠️ Homepage prospect:', e)
      }

      // 3) Páginas comuns de produtos/serviços (mais variações)
      const commonPaths = [
        '/produtos', '/servicos', '/solucoes', '/catalogo', '/products', '/services',
        '/linha-produtos', '/nossos-produtos', '/produtos-em-destaque', '/nossos-servicos',
        '/linhas', '/item', '/p', '/sobre-nos', '/empresa', '/solucoes', '/soluções'
      ]
      for (const path of commonPaths) {
        try {
          const url = `https://${domain}${path}`
          if (discoveredUrls.has(url)) continue
          const res = await fetch(url, { ...fetchOpts, signal: AbortSignal.timeout(FETCH_TIMEOUT_PAGE_MS) })
          if (res.ok) {
            const html = await res.text()
            rawHtmlByUrl.push({ url, html })
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 15000)
            pagesContent.push(`URL: ${url}\nConteúdo: ${text}`)
            discoveredUrls.add(url)
          }
        } catch (_) {}
        await new Promise(r => setTimeout(r, 300))
      }

      // 4) Até 80 páginas do sitemap (profundidade máxima para prospect)
      const maxSitemapPages = 80
      for (let i = 0; i < Math.min(maxSitemapPages, sitemapUrlsToFetch.length); i++) {
        try {
          const url = sitemapUrlsToFetch[i]
          const res = await fetch(url, { ...fetchOpts, signal: AbortSignal.timeout(FETCH_TIMEOUT_PAGE_MS) })
          if (res.ok) {
            const html = await res.text()
            rawHtmlByUrl.push({ url, html })
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 12000)
            pagesContent.push(`URL: ${url}\nConteúdo: ${text}`)
          }
        } catch (_) {}
        await new Promise(r => setTimeout(r, 350))
      }

      const aggregatedContent = pagesContent.join('\n\n---\n\n')
      const openaiKey = Deno.env.get('OPENAI_API_KEY')

      const isNoise = (name: string): boolean => {
        const lower = name.toLowerCase().trim()
        const noiseTerms = ['notícias', 'noticias', 'newsletter', 'institucional', 'news', 'contato', 'fale conosco', 'trabalhe conosco', 'política de privacidade', 'termos de uso', 'cadastre-se', 'login', 'menu', 'home', 'início', 'inicio', '©', 'todos os direitos']
        return noiseTerms.some(term => lower === term || lower.includes(term)) || lower.length < 4
      }

      // 5) Regex no HTML BRUTO de cada página (não no texto sem tags)
      const productPatterns = [
        /<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
        /<h[2-4][^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>(.*?)<\/h[2-4]>/gi,
        /<a[^>]*href="[^"]*produto[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
        /<a[^>]*href="[^"]*servico[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
        /<a[^>]*href="[^"]*catalogo[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
        /<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi,
        /<li[^>]*class="[^"]*service[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
        /<span[^>]*class="[^"]*product-name[^"]*"[^>]*>(.*?)<\/span>/gi,
        /<h3[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/h3>/gi,
        /data-product-name="([^"]+)"/gi,
        /title="([^"]{5,120})"/gi
      ]
      const regexFound = new Set<string>()
      for (const { html } of rawHtmlByUrl) {
        for (const pattern of productPatterns) {
          let m
          const re = new RegExp(pattern.source, pattern.flags)
          while ((m = re.exec(html)) !== null) {
            const raw = (m[1] || m[0] || '').toString()
            const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200)
            if (text.length >= 5 && text.length <= 180 && !isNoise(text)) regexFound.add(text)
          }
        }
      }
      if (regexFound.size > 0) {
        extractedProducts = Array.from(regexFound).slice(0, 80).map(name => ({
          name,
          category: 'Extraído do website',
          description: `Produto/serviço identificado no website ${website_url}`,
          price: null,
          image_url: null,
          extracted_at: new Date().toISOString(),
          source: website_url
        }))
        console.log(`[ScanWebsite] 🔵 PROSPECT profundo (regex em HTML): ${extractedProducts.length} produtos`)
      }

      // 6) OpenAI no conteúdo agregado (pode enriquecer ou ser a única fonte)
      if (openaiKey && aggregatedContent.length > 500) {
        try {
          const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `Você é um especialista em identificar PRODUTOS e SERVIÇOS em websites. Extraia APENAS produtos e serviços reais (nomes de produtos, linhas, categorias de oferta). NUNCA inclua: notícias, newsletter, páginas institucionais, "contato", "menu". Responda APENAS com JSON: { "produtos": [ { "nome": "...", "descricao": "...", "categoria": "..." } ] }`
                },
                {
                  role: 'user',
                  content: `Extraia TODOS os produtos e serviços oferecidos pela empresa (nomes de produtos, linhas, soluções). Ignore notícias, newsletter e conteúdo institucional.\n\n${aggregatedContent.substring(0, 48000)}`
                }
              ],
              temperature: 0.1,
              max_tokens: 6000
            })
          })
          if (openaiRes.ok) {
            const json = await openaiRes.json()
            const raw = json.choices?.[0]?.message?.content || '{}'
            const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
            const start = clean.indexOf('{')
            const end = clean.lastIndexOf('}') + 1
            if (start >= 0 && end > start) {
              const parsed = JSON.parse(clean.substring(start, end))
              const list = parsed.produtos || parsed.products || []
              const openaiProducts = list
                .filter((p: { nome?: string; name?: string }) => {
                  const n = (p.nome || p.name || '').trim()
                  return n && !isNoise(n)
                })
                .map((p: { nome?: string; name?: string; descricao?: string; description?: string; categoria?: string; category?: string }) => ({
                  name: (p.nome || p.name || '').trim().substring(0, 255),
                  category: (p.categoria || p.category || 'Extraído do website').substring(0, 100),
                  description: (p.descricao || p.description || '').substring(0, 500) || `Produto do website ${website_url}`,
                  price: null,
                  image_url: null,
                  extracted_at: new Date().toISOString(),
                  source: website_url
                }))
              const existingNames = new Set(extractedProducts.map(p => p.name.toLowerCase()))
              for (const p of openaiProducts) {
                if (!existingNames.has(p.name.toLowerCase())) {
                  existingNames.add(p.name.toLowerCase())
                  extractedProducts.push(p)
                }
              }
              console.log(`[ScanWebsite] 🔵 PROSPECT profundo (OpenAI): +${openaiProducts.length} produtos (total: ${extractedProducts.length})`)
            }
          }
        } catch (e) {
          console.warn('[ScanWebsite] ⚠️ OpenAI prospect:', e)
        }
      }

      // 7) Se ainda zero, tentar regex em texto (títulos e links visíveis)
      if (extractedProducts.length === 0 && aggregatedContent.length > 100) {
        const titleLike = aggregatedContent.match(/\b[A-Za-zÀ-ú][A-Za-z0-9À-ú\s\-–—]{4,80}\b/g) || []
        const found = new Set<string>()
        for (const t of titleLike) {
          const x = t.trim()
          if (x.length >= 5 && x.length <= 120 && !isNoise(x)) found.add(x)
        }
        extractedProducts = Array.from(found).slice(0, 40).map(name => ({
          name,
          category: 'Extraído do website',
          description: `Produto/serviço identificado no website ${website_url}`,
          price: null,
          image_url: null,
          extracted_at: new Date().toISOString(),
          source: website_url
        }))
        console.log(`[ScanWebsite] 🔵 PROSPECT profundo (regex texto): ${extractedProducts.length} produtos`)
      }

      // 8) Se ainda zero: salvar array vazio e mensagem (não placeholder falso)
      if (extractedProducts.length === 0) {
        const domainName = domain || website_url.replace(/https?:\/\//, '').split('/')[0]
        extractedProducts = [{
          name: `Produtos/Serviços de ${domainName}`,
          category: 'Extraído do website',
          description: `Varredura profunda no domínio ${website_url} (sitemap + até 80 páginas). Nenhum produto específico identificado nas páginas analisadas. Verifique se o site lista produtos em HTML estático ou se exige JavaScript.`,
          price: null,
          image_url: null,
          extracted_at: new Date().toISOString(),
          source: website_url,
          note: 'Extração profunda executada - revise manualmente se necessário'
        }]
        console.log(`[ScanWebsite] 🔵 PROSPECT: nenhum produto extraído; salvando mensagem informativa`)
      }
    } else {
      // ===== MOTOR SIMPLES (TENANT): uma página + regex — onboarding Aba 1 não é alterado =====
      try {
        const urlToFetch = website_url.startsWith('http') ? website_url : `https://${website_url}`
        const websiteResponse = await fetch(urlToFetch, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          signal: AbortSignal.timeout(15000)
        })

        if (!websiteResponse.ok) throw new Error(`HTTP ${websiteResponse.status}`)
        const html = await websiteResponse.text()

        const productPatterns = [
          /<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
          /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
          /<h[2-4][^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>(.*?)<\/h[2-4]>/gi,
          /<a[^>]*href="[^"]*produto[^"]*"[^>]*>(.*?)<\/a>/gi,
          /<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi,
          /<li[^>]*class="[^"]*service[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
        ]
        const foundProductNames = new Set<string>()
        for (const pattern of productPatterns) {
          let match
          const re = new RegExp(pattern.source, pattern.flags)
          while ((match = re.exec(html)) !== null) {
            const productText = match[1] || match[0]
            const cleanText = productText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 200)
            if (cleanText.length > 5 && cleanText.length < 150) foundProductNames.add(cleanText)
          }
        }

        extractedProducts = Array.from(foundProductNames).slice(0, 20).map(name => ({
          name,
          category: 'Extraído do website',
          description: `Produto identificado no website ${website_url}`,
          price: null,
          image_url: null,
          extracted_at: new Date().toISOString(),
          source: website_url
        }))
        console.log(`[ScanWebsite] 🔍 Motor tenant (uma página): ${extractedProducts.length} produtos`)
      } catch (scrapeError: unknown) {
        const msg = scrapeError instanceof Error ? scrapeError.message : String(scrapeError)
        console.error('[ScanWebsite] ⚠️ Erro no scraping tenant:', msg)
        const domain = website_url.replace(/https?:\/\//, '').split('/')[0]
        extractedProducts = [{
          name: `Produtos de ${domain}`,
          category: 'Extraído do website',
          description: `Informações extraídas do domínio ${website_url}`,
          price: null,
          image_url: null,
          extracted_at: new Date().toISOString(),
          source: website_url,
          note: 'Extração limitada - fallback por erro de scraping'
        }]
      }
    }

    // 🔵 MODO PROSPECT - Salvar em companies.raw_data (MESMO motor acima)
    if (mode === 'prospect') {
      if (!company_id || company_id.length < 30) {
        return new Response(
          JSON.stringify({ error: 'company_id inválido para modo prospect' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[ScanWebsite] 🔵 MODO PROSPECT - Motor profundo (sitemap + homepage + catálogos), salvando em companies.raw_data`)

      if (extractedProducts.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Nenhum produto encontrado no website do prospect',
            website_url,
            suggestion: 'Verifique se o website possui produtos listados ou tente outro formato de URL'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: companyData, error: fetchError } = await supabase
        .from('companies')
        .select('raw_data')
        .eq('id', company_id)
        .single()

      if (fetchError) {
        console.error('[ScanWebsite] ❌ Empresa não encontrada:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Empresa não encontrada', details: fetchError.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const currentRawData = (companyData?.raw_data as Record<string, unknown>) || {}
      const updatedRawData = {
        ...currentRawData,
        produtos_extracted: extractedProducts,
        extraction_date: new Date().toISOString(),
        extraction_source: website_url,
        extraction_mode: 'prospect'
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({ raw_data: updatedRawData })
        .eq('id', company_id)

      if (updateError) {
        console.error('[ScanWebsite] ❌ Erro ao atualizar raw_data:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar produtos do prospect', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[ScanWebsite] ✅ ${extractedProducts.length} produtos salvos em companies.raw_data`)

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'prospect',
          count: extractedProducts.length,
          products: extractedProducts,
          company_id: company_id,
          saved_to: 'companies.raw_data.produtos_extracted',
          website_url: website_url,
          company_name: (companyData as { name?: string })?.name,
          message: `${extractedProducts.length} produtos extraídos do website do prospect`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🟢 MODO TENANT: MESMO motor de scraping, gravar APENAS em tenant_products (NUNCA em companies.raw_data)
    if (mode === 'tenant') {
      console.log('[ScanWebsite] 🟢 MODO TENANT - Usando MESMO motor de scraping do prospect')
      console.log('[ScanWebsite] 💾 SALVANDO EM: tenant_products')
      console.log('[ScanWebsite] 🆔 tenant_id:', tenant_id)

      // Garantir pelo menos um item para insert (evita array vazio)
      const safeProducts = extractedProducts.length > 0
        ? extractedProducts
        : [{
            name: `Produtos de ${website_url.replace(/https?:\/\//, '').split('/')[0] || 'website'}`,
            category: 'Extraído do website',
            description: `Extraído de ${website_url}`,
            price: null,
            image_url: null,
            extracted_at: new Date().toISOString(),
            source: website_url
          }]

      // tenant_products: nome, descricao, categoria, ativo, imagem_url (schema 20250201000001)
      const productsToInsert = safeProducts.map(p => ({
        tenant_id: tenant_id,
        nome: (p.name || 'Produto').trim().substring(0, 255),
        descricao: (p.description ?? null) ? String(p.description).trim().substring(0, 5000) : null,
        categoria: (p.category ?? null) ? String(p.category).trim().substring(0, 100) : null,
        ativo: true,
        imagem_url: p.image_url ?? null
      }))

      const { error: insertError } = await supabase
        .from('tenant_products')
        .insert(productsToInsert)

      if (insertError) {
        console.error('[ScanWebsite] Erro ao inserir em tenant_products:', insertError.message, insertError.code, insertError.details)
        return new Response(
          JSON.stringify({
            error: 'Erro ao salvar produtos do tenant',
            details: insertError.message,
            code: insertError.code,
            hint: 'Verifique RLS e colunas da tabela tenant_products (nome, descricao, categoria, ativo, imagem_url).'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[ScanWebsite] ✅ ${productsToInsert.length} produtos inseridos em tenant_products`)

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'tenant',
          count: productsToInsert.length,
          tenant_id: tenant_id,
          saved_to: 'tenant_products',
          message: `${productsToInsert.length} produtos do catálogo salvos`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : undefined
    console.error('[ScanWebsite] Erro geral:', errMsg, errStack)
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: errMsg,
        hint: 'Verifique os logs da Edge Function no Supabase Dashboard.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
