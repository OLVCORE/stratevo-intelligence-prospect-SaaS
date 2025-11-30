import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Configurações de rate limit por endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/chatbot': { maxRequests: 60, windowMs: 60000 }, // 60 req/min
  '/send-contact-email': { maxRequests: 20, windowMs: 60000 }, // 20 req/min
  '/whatsapp-webhook': { maxRequests: 100, windowMs: 60000 }, // 100 req/min
  '/generate-proposal-pdf': { maxRequests: 30, windowMs: 60000 }, // 30 req/min
  '/meta-webhook': { maxRequests: 100, windowMs: 60000 }, // 100 req/min
  default: { maxRequests: 30, windowMs: 60000 } // 30 req/min para outros endpoints
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrair informações do request
    const { endpoint, identifier } = await req.json();
    
    if (!endpoint || !identifier) {
      return new Response(
        JSON.stringify({ error: 'endpoint e identifier são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter configuração de rate limit
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Criar tabela de rate limiting se não existir (usando KV seria melhor em produção)
    // Aqui vamos usar uma abordagem simples com tabela temporária
    
    // Buscar requisições recentes deste identificador neste endpoint
    const { data: recentRequests, error: fetchError } = await supabase
      .from('rate_limit_log')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('timestamp', new Date(windowStart).toISOString())
      .order('timestamp', { ascending: false });

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Ignorar erro se tabela não existe, criar depois
      console.error('Error fetching rate limit log:', fetchError);
    }

    const requestCount = recentRequests?.length || 0;

    // Verificar se excedeu o limite
    if (requestCount >= config.maxRequests) {
      const oldestRequest = recentRequests?.[recentRequests.length - 1];
      const resetTime = oldestRequest ? new Date(oldestRequest.timestamp).getTime() + config.windowMs : now + config.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Você excedeu o limite de ${config.maxRequests} requisições por ${config.windowMs / 1000}s`,
          retryAfter,
          limit: config.maxRequests,
          windowMs: config.windowMs
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    // Registrar esta requisição
    const { error: insertError } = await supabase
      .from('rate_limit_log')
      .insert({
        identifier,
        endpoint,
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error logging rate limit:', insertError);
    }

    const remaining = config.maxRequests - requestCount - 1;

    return new Response(
      JSON.stringify({
        allowed: true,
        limit: config.maxRequests,
        remaining,
        windowMs: config.windowMs
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': (now + config.windowMs).toString()
        }
      }
    );

  } catch (error) {
    console.error('Error in rate limiter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
