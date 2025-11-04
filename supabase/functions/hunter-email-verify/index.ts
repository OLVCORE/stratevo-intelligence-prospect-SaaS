// ✅ HUNTER.IO - EMAIL VERIFICATION
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: VerifyRequest = await req.json();
    const { email } = body;

    console.log('[HUNTER-VERIFY] ✅ Verificando:', email);

    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');

    if (!hunterApiKey) {
      console.warn('[HUNTER-VERIFY] ⚠️ HUNTER_API_KEY não configurada');
      
      return new Response(
        JSON.stringify({
          email,
          status: 'unknown',
          score: 0,
          deliverable: false,
          message: 'Hunter.io não configurado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar Hunter.io Email Verifier
    const params = new URLSearchParams({
      email,
      api_key: hunterApiKey
    });

    const response = await fetch(
      `https://api.hunter.io/v2/email-verifier?${params}`
    );

    if (!response.ok) {
      throw new Error(`Hunter API error: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data;

    console.log('[HUNTER-VERIFY] ✅ Status:', data.status, '| Score:', data.score);

    return new Response(
      JSON.stringify({
        email: data.email,
        status: data.status, // 'valid', 'invalid', 'risky', 'unknown'
        score: data.score || 0, // 0-100
        deliverable: data.result === 'deliverable',
        acceptAll: data.accept_all || false,
        disposable: data.disposable || false,
        webmail: data.webmail || false,
        mx_records: data.mx_records || false,
        smtp_server: data.smtp_server || false,
        smtp_check: data.smtp_check || false,
        blocked: data.blocked || false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HUNTER-VERIFY] ❌ Erro:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        email: '',
        status: 'unknown',
        score: 0,
        deliverable: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

