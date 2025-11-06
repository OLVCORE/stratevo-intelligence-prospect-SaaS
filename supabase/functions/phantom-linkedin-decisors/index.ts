// 🚀 PHANTOMBUSTER - EXTRAÇÃO DE DECISORES NO LINKEDIN
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DecisorRequest {
  companyName: string;
  linkedinCompanyUrl?: string;
  positions: string[]; // ['CEO', 'CFO', 'CIO', etc.]
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
    // Busca por: "Company: [NOME]" + "Title: CEO OR CFO OR CIO"
    
    const searchQuery = effectivePositions.map(pos => `"${pos}"`).join(' OR ');
    
    const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: Deno.env.get('PHANTOM_LINKEDIN_SEARCH_AGENT_ID'), // ID do agent configurado
        argument: {
          sessionCookie: linkedinSessionCookie,
          searches: [`company:"${companyName}" AND (${searchQuery})`],
          numberOfProfiles: 10
        }
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
    const maxAttempts = 12; // 12 × 5s = 60s timeout

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
        
        if (resultData && resultData.length > 0) {
          break;
        }
      }
      
      attempts++;
      console.log('[PHANTOM-DECISORS] ⏳ Aguardando resultado... Tentativa', attempts);
    }

    // Processar resultados
    const decisors = (resultData || []).map((profile: any) => ({
      profileUrl: profile.profileUrl || profile.linkedinUrl || '',
      fullName: profile.fullName || profile.name || 'Nome não disponível',
      headline: profile.headline || profile.title || '',
      location: profile.location || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || companyName,
      position: profile.headline || '',
      connections: profile.connections || 0,
      summary: profile.summary || ''
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

