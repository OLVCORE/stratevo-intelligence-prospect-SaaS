// 🔍 HUNTER.IO - DOMAIN SEARCH
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainSearchRequest {
  domain: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: DomainSearchRequest = await req.json();
    const { domain, limit = 50 } = body;

    console.log('[HUNTER-DOMAIN] 🔍 Buscando emails de:', domain);

    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');

    if (!hunterApiKey) {
      console.warn('[HUNTER-DOMAIN] ⚠️ HUNTER_API_KEY não configurada');
      
      return new Response(
        JSON.stringify({
          domain,
          emails: [],
          total: 0,
          message: 'Hunter.io não configurado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar Hunter.io Domain Search
    const params = new URLSearchParams({
      domain,
      limit: limit.toString(),
      api_key: hunterApiKey
    });

    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?${params}`
    );

    if (!response.ok) {
      throw new Error(`Hunter API error: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data;

    console.log('[HUNTER-DOMAIN] ✅ Emails encontrados:', data.emails?.length || 0);
    console.log('[HUNTER-DOMAIN] 📐 Pattern:', data.pattern);

    // Processar emails
    const emails = (data.emails || []).map((email: any) => ({
      email: email.value,
      firstName: email.first_name,
      lastName: email.last_name,
      position: email.position,
      confidence: email.confidence || 0,
      type: email.type || 'personal',
      verified: (email.confidence || 0) > 70,
      source: 'hunter'
    }));

    // Separar decisores
    const decisorTitles = [
      'ceo', 'cfo', 'cio', 'cto', 'coo',
      'diretor', 'director', 'gerente', 'manager',
      'vp', 'vice president', 'presidente', 'president'
    ];

    const decisors = emails.filter((e: any) => 
      e.position && decisorTitles.some(title => 
        e.position.toLowerCase().includes(title)
      )
    );

    console.log('[HUNTER-DOMAIN] 🎯 Decisores identificados:', decisors.length);

    return new Response(
      JSON.stringify({
        domain,
        organization: data.organization || domain,
        emails,
        total: data.emails?.length || 0,
        pattern: data.pattern || '',
        decisors,
        searched_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HUNTER-DOMAIN] ❌ Erro:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        domain: '',
        emails: [],
        total: 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

