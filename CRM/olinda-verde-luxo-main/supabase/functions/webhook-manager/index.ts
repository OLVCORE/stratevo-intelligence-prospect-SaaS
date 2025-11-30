import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Webhook Manager - Gerencia webhooks bidirecionais
 * 
 * Funcionalidades:
 * 1. Registrar webhooks de clientes (para receber eventos do CRM)
 * 2. Disparar webhooks quando eventos acontecem
 * 3. Retry automático em caso de falha
 * 4. Log de tentativas e status
 */

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'trigger';

    // REGISTRAR novo webhook
    if (action === 'register' && req.method === 'POST') {
      const { url: webhookUrl, events, secret } = await req.json();

      if (!webhookUrl || !events || !Array.isArray(events)) {
        return new Response(
          JSON.stringify({ error: 'url, events (array) e secret são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .insert({
          url: webhookUrl,
          events,
          secret,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, webhook: data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LISTAR webhooks registrados
    if (action === 'list' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      return new Response(
        JSON.stringify({ webhooks: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DISPARAR webhook para evento específico
    if (action === 'trigger' && req.method === 'POST') {
      const { event, data: eventData } = await req.json();

      if (!event || !eventData) {
        return new Response(
          JSON.stringify({ error: 'event e data são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar webhooks inscritos neste evento
      const { data: webhooks, error: fetchError } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('is_active', true)
        .contains('events', [event]);

      if (fetchError) throw fetchError;

      if (!webhooks || webhooks.length === 0) {
        return new Response(
          JSON.stringify({ message: 'Nenhum webhook inscrito para este evento' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload: WebhookPayload = {
        event,
        data: eventData,
        timestamp: new Date().toISOString()
      };

      // Disparar para todos os webhooks inscritos
      const results = await Promise.allSettled(
        webhooks.map(async (webhook) => {
          return sendWebhook(webhook.url, payload, webhook.secret, webhook.id, supabase);
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      return new Response(
        JSON.stringify({
          success: true,
          triggered: webhooks.length,
          successful: successCount,
          failed: failCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETAR webhook
    if (action === 'delete' && req.method === 'DELETE') {
      const { webhook_id } = await req.json();

      if (!webhook_id) {
        return new Response(
          JSON.stringify({ error: 'webhook_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({ is_active: false })
        .eq('id', webhook_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Webhook desativado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use: register, list, trigger ou delete' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in webhook manager:', error);
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

async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string | null,
  webhookId: string,
  supabase: any
): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'EspacoLinda-Webhook/1.0'
      };

      // Adicionar assinatura HMAC se secret fornecido
      if (secret) {
        const signature = await generateHmacSignature(JSON.stringify(payload), secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Sucesso - registrar log
      await supabase.from('webhook_logs').insert({
        webhook_id: webhookId,
        event: payload.event,
        status: 'success',
        http_status: response.status,
        attempt: attempt + 1,
        sent_at: new Date().toISOString()
      });

      console.log(`✅ Webhook sent successfully to ${url}`);
      return;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;
      console.error(`❌ Webhook attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  // Todas tentativas falharam - registrar log de falha
  await supabase.from('webhook_logs').insert({
    webhook_id: webhookId,
    event: payload.event,
    status: 'failed',
    error_message: lastError?.message || 'Unknown error',
    attempt: maxRetries,
    sent_at: new Date().toISOString()
  });

  throw new Error(`Failed to send webhook after ${maxRetries} attempts: ${lastError?.message}`);
}

async function generateHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
