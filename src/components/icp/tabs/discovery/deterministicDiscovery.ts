// Discovery determinístico: Razão Social + CNPJ + mapeamento completo de redes sociais
// Prioriza domínio raiz .com.br e perfis oficiais com match exato

export type DiscoveryInputs = {
  cnpj: string;              // "00.000.000/0000-00" ou apenas dígitos
  razaoSocial: string;       // nome oficial cadastrado
  companyName?: string;      // fantasia (opcional)
  country?: string;          // 'BR' default
  state?: string;            // UF
};

export type DiscoveryResult = {
  discoveredDomain: string;      // domínio raiz (ex.: "xpto.com.br")
  domainUrl: string;             // "https://xpto.com.br"
  confidence: number;            // 0..100
  sources: Array<{ title: string; url: string; position: number }>;
  socialProfiles: {
    linkedin?: string[];
    instagram?: string[];
    twitter?: string[]; // x.com / twitter.com
    facebook?: string[];
    youtube?: string[];
    tiktok?: string[];
    github?: string[];
    glassdoor?: string[];
    crunchbase?: string[];
    other?: string[];
  };
  notes?: string[];
};

// -------------------- helpers --------------------

const stripCnpjDigits = (cnpj: string) => (cnpj || '').replace(/\D/g, '');

const norm = (s: string) => (s || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

function extractRootDomain(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    
    // Heurística simples para TLD duplo (.com.br)
    const parts = host.split('.').filter(Boolean);
    if (parts.length <= 2) return host;
    
    // Manter TLD duplo (.com.br, .ind.br, etc)
    const tld = parts.slice(-2).join('.');
    if (['com.br', 'ind.br', 'net.br', 'org.br'].includes(tld) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

function isPdfOrNews(url: string) {
  if (/\.pdf($|\?)/i.test(url)) return true;
  if (/news|noticias|g1\.|oglobo\.|uol\.|estadao\.|folha\./i.test(url)) return true;
  return false;
}

function isGovOrRegistry(url: string) {
  return /\.gov\.br/i.test(url) || 
    /receita\.fazenda|jucesp|jusbrasil|cvm\.gov|escavador|serasa|reclameaqui/i.test(url);
}

function isCdnOrAsset(url: string) {
  // Penalizar CDNs, assets, imagens, wordpress internals
  return /\/img\/|\/image\/|\/wp-content\/|\/assets\/|\/static\/|imgcache|cloudflare|cloudfront|akamai/i.test(url);
}

function isInternalPage(url: string) {
  // Penalizar páginas internas (produto, categoria, etc)
  return /\/produto\/|\/product\/|\/categoria\/|\/category\/|\/blog\/|\/artigo\//i.test(url);
}

function scoreResult(params: {
  title: string;
  snippet: string;
  url: string;
  pos: number;
  razao: string;
  cnpjDigits: string;
  preferBr: boolean;
}) {
  const { title, snippet, url, pos, razao, cnpjDigits, preferBr } = params;
  const titleN = norm(title);
  const snipN = norm(snippet);
  const razN = norm(razao);

  let s = 0;
  
  // Base por posição (top1 = +50, top2 = +45, decrescendo)
  s += Math.max(0, 55 - pos * 5);

  // Match de razão social
  if (titleN.includes(razN)) s += 25;
  if (snipN.includes(razN)) s += 15;

  // CNPJ na página/snippet
  if (cnpjDigits && (title.includes(cnpjDigits) || snippet.includes(cnpjDigits))) {
    s += 25;
  }

  // .com.br preferencial
  if (preferBr && /\.com\.br($|\/)/i.test(url)) {
    s += 15;
  }

  // Penalizações
  if (isPdfOrNews(url)) s -= 40;
  if (isGovOrRegistry(url)) s -= 30;
  if (isCdnOrAsset(url)) s -= 35;
  if (isInternalPage(url)) s -= 20;

  // Bonificação extra para domínio raiz limpo (sem path ou path = '/')
  try {
    const u = new URL(url);
    if (u.pathname === '/' || u.pathname === '') {
      s += 10; // Bônus para homepage/raiz
    }
  } catch {
    // URL inválida, ignorar
  }

  return s;
}

const SOCIAL_HOSTS = [
  'linkedin.com',
  'instagram.com',
  'facebook.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'tiktok.com',
  'github.com',
  'glassdoor.com',
  'crunchbase.com',
];

function classifySocial(url: string): {
  key: keyof DiscoveryResult['socialProfiles'] | 'other';
  normalized?: string;
} {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = u.pathname.replace(/\/+$/, '');

    if (h.includes('linkedin.com')) {
      return { key: 'linkedin', normalized: `https://www.linkedin.com${pathname}` };
    }
    if (h.includes('instagram.com')) {
      return { key: 'instagram', normalized: `https://www.instagram.com${pathname}` };
    }
    if (h.includes('x.com') || h.includes('twitter.com')) {
      return { key: 'twitter', normalized: `https://x.com${pathname}` };
    }
    if (h.includes('facebook.com')) {
      return { key: 'facebook', normalized: `https://www.facebook.com${pathname}` };
    }
    if (h.includes('youtube.com')) {
      return { key: 'youtube', normalized: `https://www.youtube.com${pathname}` };
    }
    if (h.includes('tiktok.com')) {
      return { key: 'tiktok', normalized: `https://www.tiktok.com${pathname}` };
    }
    if (h.includes('github.com')) {
      return { key: 'github', normalized: `https://github.com${pathname}` };
    }
    if (h.includes('glassdoor.com')) {
      return { key: 'glassdoor', normalized: `https://www.glassdoor.com${pathname}` };
    }
    if (h.includes('crunchbase.com')) {
      return { key: 'crunchbase', normalized: `https://www.crunchbase.com${pathname}` };
    }
    
    return { key: 'other', normalized: url };
  } catch {
    return { key: 'other' };
  }
}

// -------------------- queries determinísticas --------------------

function buildQueries(input: DiscoveryInputs) {
  const raz = (input.razaoSocial || '').trim();
  const cnpjDigits = stripCnpjDigits(input.cnpj);
  
  // Query principal (assertiva) - Razão Social + CNPJ
  const q1 = `"${raz}" ${cnpjDigits}`;
  
  // Socials focadas (uma consulta ampla com ORs)
  const q2 = `"${raz}" (${[
    'site:linkedin.com',
    'site:instagram.com',
    'site:facebook.com',
    'site:x.com',
    'site:twitter.com',
    'site:youtube.com',
    'site:tiktok.com',
    'site:github.com',
    'site:glassdoor.com',
    'site:crunchbase.com',
  ].join(' OR ')})`;
  
  // Foco Brasil
  const q3 = `"${raz}" site:*.com.br`;
  
  return [q1, q2, q3];
}

// -------------------- integração com Serper --------------------

async function serperSearchOnce(query: string): Promise<any> {
  console.log('[SERPER] 🔍 Executando query:', query);
  
  const serperKey = import.meta.env.VITE_SERPER_API_KEY;
  if (!serperKey) {
    throw new Error('SERPER_API_KEY não configurada');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: 'br',
      hl: 'pt-br',
      num: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[SERPER] ✅ Resultados obtidos:', data.organic?.length || 0);
  
  return data;
}

// -------------------- validação de domínio (Hunter.io) --------------------

async function validateDomainWithHunter(domain: string): Promise<{
  valid: boolean;
  confidence: number;
  pattern?: string;
}> {
  console.log('[HUNTER] 🔍 Validando domínio:', domain);
  
  const hunterKey = import.meta.env.VITE_HUNTER_API_KEY;
  if (!hunterKey) {
    console.warn('[HUNTER] ⚠️ API Key não configurada, pulando validação');
    return { valid: false, confidence: 0 };
  }

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${hunterKey}&limit=1`
    );

    if (!response.ok) {
      console.warn('[HUNTER] ⚠️ Erro na API:', response.status);
      return { valid: false, confidence: 0 };
    }

    const data = await response.json();
    
    if (data.data?.emails?.length > 0 || data.data?.pattern) {
      console.log('[HUNTER] ✅ Domínio validado:', {
        emails: data.data.emails?.length || 0,
        pattern: data.data.pattern,
      });
      
      return {
        valid: true,
        confidence: 20, // Bônus de +20 pontos por validação Hunter
        pattern: data.data.pattern,
      };
    }

    console.log('[HUNTER] ℹ️ Nenhum email encontrado para este domínio');
    return { valid: false, confidence: -10 }; // Penalização leve se Hunter não encontrou nada
  } catch (error) {
    console.error('[HUNTER] ❌ Erro ao validar domínio:', error);
    return { valid: false, confidence: 0 }; // Sem penalização se API falhou
  }
}

// -------------------- pipeline principal --------------------

export async function deterministicDiscovery(input: DiscoveryInputs): Promise<DiscoveryResult> {
  console.log('[DISCOVERY] 🎯 Iniciando discovery determinístico...', {
    razaoSocial: input.razaoSocial,
    cnpj: input.cnpj,
  });

  const queries = buildQueries(input);
  const preferBr = (input.country ?? 'BR').toUpperCase() === 'BR';
  const cnpjDigits = stripCnpjDigits(input.cnpj);
  const razao = input.razaoSocial;

  const notes: string[] = [];
  const results: Array<{ title: string; url: string; snippet: string; position: number }> = [];

  // 1) Executa queries e acumula top10 de cada
  for (const q of queries) {
    try {
      const resp = await serperSearchOnce(q);
      const organic: any[] = resp?.organic ?? [];
      
      organic.slice(0, 10).forEach((r, idx) => {
        results.push({
          title: r.title ?? '',
          url: r.link ?? r.url ?? '',
          snippet: r.snippet ?? '',
          position: idx + 1,
        });
      });
    } catch (error) {
      console.error('[DISCOVERY] ❌ Erro na query:', q, error);
      notes.push(`Erro na query: ${q}`);
    }
  }

  console.log('[DISCOVERY] 📊 Total de resultados brutos:', results.length);

  // 2) Rankear resultados para site oficial
  const ranked = results
    .filter(r => !!r.url)
    .map(r => ({
      ...r,
      score: scoreResult({
        title: r.title,
        snippet: r.snippet,
        url: r.url,
        pos: r.position,
        razao,
        cnpjDigits,
        preferBr,
      }),
    }))
    // Tirar PDF/News/Gov/CDN antes de ordenar
    .filter(r => 
      !isPdfOrNews(r.url) && 
      !isGovOrRegistry(r.url) && 
      !isCdnOrAsset(r.url)
    )
    .sort((a, b) => b.score - a.score);

  console.log('[DISCOVERY] 🏆 Resultados ranqueados:', ranked.length);

  // 2.5) Validar top 3 candidatos com Hunter.io (bônus de confiança)
  const topCandidates = ranked.slice(0, 3);
  for (const candidate of topCandidates) {
    const domain = extractRootDomain(candidate.url);
    if (domain) {
      const validation = await validateDomainWithHunter(domain);
      candidate.score += validation.confidence;
      
      if (validation.valid) {
        console.log('[DISCOVERY] ✅ Domínio validado pelo Hunter:', domain, `+${validation.confidence} pontos`);
      }
    }
  }

  // Re-ordenar após validação Hunter
  ranked.sort((a, b) => b.score - a.score);

  // 3) Escolher domínio raiz mais provável
  let domainUrl = '';
  let discoveredDomain = '';
  let confidence = 0;

  if (ranked.length) {
    domainUrl = ranked[0].url;
    discoveredDomain = extractRootDomain(domainUrl);
    confidence = Math.min(100, Math.max(0, ranked[0].score));
    
    console.log('[DISCOVERY] ✅ Website oficial encontrado:', {
      domain: discoveredDomain,
      url: domainUrl,
      confidence: confidence + '%',
    });
    
    if (!discoveredDomain) {
      notes.push('Não foi possível extrair domínio raiz do top1; verificação manual recomendada.');
    }
  } else {
    notes.push('Nenhum candidato forte encontrado; verificação manual recomendada.');
    console.log('[DISCOVERY] ⚠️ Nenhum website oficial encontrado');
  }

  // 4) Filtrar e normalizar redes sociais oficiais
  const socialProfiles: DiscoveryResult['socialProfiles'] = {};
  const socialCandidates = results.filter(r => {
    try {
      const host = new URL(r.url).hostname.toLowerCase();
      return SOCIAL_HOSTS.some(h => host.includes(h));
    } catch {
      return false;
    }
  });

  console.log('[DISCOVERY] 📱 Candidatos de redes sociais:', socialCandidates.length);

  for (const cand of socialCandidates) {
    const { key, normalized } = classifySocial(cand.url);
    if (!key) continue;

    socialProfiles[key] ??= [];

    if (normalized && !socialProfiles[key]!.includes(normalized)) {
      // Reforço: manter apenas URLs com match estrito do nome
      const titleN = norm(cand.title);
      const snipN = norm(cand.snippet);
      const razN = norm(razao);
      const strict = titleN.includes(razN) || snipN.includes(razN);

      if (strict) {
        socialProfiles[key]!.push(normalized);
        console.log('[DISCOVERY] ✅ Rede social encontrada:', key, normalized);
      }
    }
  }

  // 5) Montar sources (top 10 únicos)
  const topSources = Array.from(
    new Map(results.map(r => [r.url, r])).values()
  )
    .slice(0, 10)
    .map(r => ({ title: r.title, url: r.url, position: r.position }));

  const socialCount = Object.values(socialProfiles).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  
  console.log('[DISCOVERY] 🎉 Discovery concluído:', {
    domain: discoveredDomain,
    confidence: confidence + '%',
    socialProfiles: socialCount,
    notes: notes.length,
  });

  return {
    discoveredDomain,
    domainUrl,
    confidence,
    sources: topSources,
    socialProfiles,
    notes,
  };
}

// Helper para construir cache_key determinística
export function buildDiscoveryCacheKey(inputs: {
  cnpj?: string;
  razaoSocial?: string;
  country?: string;
  state?: string;
}) {
  const cnpjDigits = stripCnpjDigits(inputs?.cnpj ?? '');
  const raz = norm(inputs?.razaoSocial ?? '');
  const country = (inputs?.country ?? 'BR').toUpperCase();
  const state = (inputs?.state ?? '').toUpperCase();
  
  return `DISCOVERY|${cnpjDigits}|${raz}|${state}|${country}`;
}

