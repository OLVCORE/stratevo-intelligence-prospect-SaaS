// 📧 HUNTER.IO - EMAIL FINDER
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinderRequest {
  firstName: string;
  lastName: string;
  domain: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: FinderRequest = await req.json();
    const { firstName, lastName, domain } = body;

    console.log('[HUNTER-FINDER] 📧 Buscando email:', firstName, lastName, '@', domain);

    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');

    if (!hunterApiKey) {
      console.warn('[HUNTER-FINDER] ⚠️ HUNTER_API_KEY não configurada');
      
      return new Response(
        JSON.stringify({
          email: null,
          confidence: 0,
          message: 'Hunter.io não configurado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar Hunter.io Email Finder
    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: hunterApiKey
    });

    const response = await fetch(
      `https://api.hunter.io/v2/email-finder?${params}`
    );

    if (!response.ok) {
      throw new Error(`Hunter API error: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data;

    if (!data || !data.email) {
      console.log('[HUNTER-FINDER] ❌ Email não encontrado');
      
      return new Response(
        JSON.stringify({
          email: null,
          confidence: 0,
          message: 'Email não encontrado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[HUNTER-FINDER] ✅ Email encontrado:', data.email, '(', data.score, '%)');

    return new Response(
      JSON.stringify({
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        position: data.position,
        confidence: data.score || 0,
        type: data.type || 'personal',
        source: data.sources?.[0]?.domain || 'hunter',
        verified: data.score > 70
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HUNTER-FINDER] ❌ Erro:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        email: null,
        confidence: 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

