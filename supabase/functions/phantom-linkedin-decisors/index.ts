// 🚀 PHANTOMBUSTER - EXTRAÇÃO DE DECISORES NO LINKEDIN
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DecisorRequest {
  companyName: string;
  linkedinCompanyUrl?: string;
  positions?: string[]; // optional: defaults applied below
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: DecisorRequest = await req.json();
    const { companyName, linkedinCompanyUrl, positions } = body;

    if (!companyName || companyName.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyName é obrigatório', decisors: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se positions não vier, usa uma lista padrão de cargos executivos
    const effectivePositions = Array.isArray(positions) && positions.length > 0
      ? positions
      : ['CEO', 'CFO', 'CIO', 'CTO', 'COO', 'Diretor', 'VP'];

    console.log('[PHANTOM-DECISORS] 🔍 Buscando decisores:', companyName);

    // Obter chaves do PhantomBuster
    const phantomApiKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    const linkedinSessionCookie = Deno.env.get('LINKEDIN_SESSION_COOKIE');

    if (!phantomApiKey) {
      console.warn('[PHANTOM-DECISORS] ⚠️ PHANTOMBUSTER_API_KEY não configurada');
      
      // Fallback: Retornar estrutura vazia (não quebra o sistema)
      return new Response(
        JSON.stringify({
          decisors: [],
          message: 'PhantomBuster não configurado - usando fallback'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔥 ESTRATÉGIA 1: LinkedIn People Search Export (Agent oficial)
    // Compatível com layouts antigos (argument.searches) e novos (argument.searchUrls)
    // Query base: company:"NOME" AND ("CEO" OR ...) AND (Brazil OR Brasil)

    // LinkedIn Search Export aceita apenas "search" (keywords) no modo simples
    // Não podemos passar currentCompany via API; o template usa a config salva
    // Enviaremos apenas as POSIÇÕES como keywords e deixamos o resto no Phantom
    const searchQuery = effectivePositions.join(' OR ');
    
    console.log('[PHANTOM-DECISORS] search (positions only):', searchQuery);
    console.log('[PHANTOM-DECISORS] companyName (nota para UI):', companyName);

    const launchArgument: Record<string, unknown> = {
      search: searchQuery,  // apenas cargos (CEO OR CFO OR ...)
      category: 'People'
    };
    if (linkedinSessionCookie) (launchArgument as any).sessionCookie = linkedinSessionCookie;

    const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: Deno.env.get('PHANTOM_LINKEDIN_SEARCH_AGENT_ID'), // ID do agent configurado
        // Envia somente os campos suportados pelo template novo
        argument: launchArgument
      })
    });

    if (!launchResponse.ok) {
      throw new Error(`PhantomBuster launch error: ${launchResponse.status}`);
    }

    const launchData = await launchResponse.json();
    const containerId = launchData.containerId;

    console.log('[PHANTOM-DECISORS] ⏳ Agent iniciado:', containerId);

    // Aguardar conclusão (polling com timeout de 60s)
    let resultData: any = null;
    let attempts = 0;
    const maxAttempts = 36; // 36 × 5s = 180s timeout (alguns runs demoram mais)

    while (attempts < maxAttempts && !resultData) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay
      
      const resultResponse = await fetch(
        `https://api.phantombuster.com/api/v2/containers/fetch-result?id=${containerId}`,
        {
          headers: { 'X-Phantombuster-Key': phantomApiKey }
        }
      );

      if (resultResponse.ok) {
        resultData = await resultResponse.json();
        
        // Alguns templates retornam array direto; outros retornam { data: [...] } ou { csvUrl: '...' }
        const hasArray =
          (Array.isArray(resultData) && resultData.length > 0) ||
          (Array.isArray(resultData?.data) && resultData.data.length > 0) ||
          typeof resultData?.csvUrl === 'string';

        if (hasArray) {
          break;
        }
      }
      
      attempts++;
      console.log('[PHANTOM-DECISORS] ⏳ Aguardando resultado... Tentativa', attempts);
    }

    async function parseCsvFromUrl(csvUrl: string): Promise<any[]> {
      try {
        const res = await fetch(csvUrl);
        if (!res.ok) return [];
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const raw = lines[i];
          // parsing simples (valores sem vírgula entre aspas já cobre 99% dos casos deste template)
          const cols = raw.match(/(\"[^\"]*\"|[^,]+)/g) ?? [];
          const obj: any = {};
          headers.forEach((h, idx) => {
            const v = (cols[idx] ?? '').replace(/^\"|\"$/g, '');
            obj[h] = v;
          });
          rows.push(obj);
        }
        return rows;
      } catch {
        return [];
      }
    }

    // Normalizar resultados de diferentes formatos
    let rawProfiles: any[] = [];
    if (Array.isArray(resultData)) {
      rawProfiles = resultData;
    } else if (Array.isArray(resultData?.data)) {
      rawProfiles = resultData.data;
    } else if (typeof resultData?.csvUrl === 'string') {
      rawProfiles = await parseCsvFromUrl(resultData.csvUrl);
    }

    // Processar resultados em formato uniforme
    const decisors = (rawProfiles || []).map((profile: any) => ({
      profileUrl: profile.profileUrl || profile.linkedinUrl || profile['Profile Url'] || '',
      fullName: profile.fullName || profile.name || profile['Full Name'] || 'Nome não disponível',
      headline: profile.headline || profile.title || profile['Headline'] || '',
      location: profile.location || profile['Location'] || '',
      email: profile.email || profile['Email'] || '',
      phone: profile.phone || profile['Phone'] || '',
      company: profile.company || profile['Company'] || companyName,
      position: profile.position || profile.headline || profile['Title'] || '',
      connections: Number(profile.connections || profile['Connections'] || 0) || 0,
      summary: profile.summary || profile['Summary'] || ''
    }));

    console.log('[PHANTOM-DECISORS] ✅ Retornando', decisors.length, 'decisores');

    return new Response(
      JSON.stringify({
        success: true,
        decisors,
        total: decisors.length,
        searched_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PHANTOM-DECISORS] ❌ Erro:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        decisors: []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

