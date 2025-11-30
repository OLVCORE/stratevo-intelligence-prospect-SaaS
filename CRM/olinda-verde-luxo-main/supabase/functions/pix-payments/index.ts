import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * PIX Payments - Gerencia pagamentos via PIX
 * 
 * Funcionalidades:
 * - Gera QR Code PIX estático
 * - Gera código PIX Copia e Cola
 * - Webhook para confirmação de pagamento (via provedor)
 * 
 * Endpoints:
 * - POST /generate - Gera código PIX
 * - POST /webhook - Webhook de confirmação
 * - GET /status/:transactionId - Consulta status do pagamento
 */

interface PIXPayload {
  amount: number;
  description: string;
  eventId?: string;
  proposalId?: string;
  leadId?: string;
  metadata?: Record<string, any>;
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
    const path = url.pathname.replace('/pix-payments', '');

    // WEBHOOK - Confirmação de pagamento
    if (path === '/webhook' && req.method === 'POST') {
      const { transactionId, status, paidAt } = await req.json();

      if (!transactionId) {
        return new Response(
          JSON.stringify({ error: 'transactionId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Atualizar status da transação
      const { error } = await supabase
        .from('payment_transactions')
        .update({
          status: status === 'paid' ? 'completed' : 'failed',
          paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        throw error;
      }

      // Se pagamento confirmado, atualizar evento/proposta
      if (status === 'paid') {
        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('event_id, proposal_id, amount')
          .eq('id', transactionId)
          .single();

        if (transaction?.event_id) {
          // Buscar valores atuais
          const { data: eventData } = await supabase
            .from('confirmed_events')
            .select('amount_paid, total_value')
            .eq('id', transaction.event_id)
            .single();

          if (eventData) {
            const newAmountPaid = (eventData.amount_paid || 0) + transaction.amount;
            const newBalanceDue = eventData.total_value - newAmountPaid;
            const newStatus = newAmountPaid >= eventData.total_value ? 'pago' : 'parcial';

            await supabase
              .from('confirmed_events')
              .update({
                amount_paid: newAmountPaid,
                balance_due: newBalanceDue,
                payment_status: newStatus
              })
              .eq('id', transaction.event_id);
          }
        }

        if (transaction?.proposal_id) {
          await supabase
            .from('proposals')
            .update({ status: 'aceita' })
            .eq('id', transaction.proposal_id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar autenticação para demais endpoints
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GERAR PIX
    if (path === '/generate' && req.method === 'POST') {
      const payload: PIXPayload = await req.json();

      if (!payload.amount || !payload.description) {
        return new Response(
          JSON.stringify({ error: 'amount e description são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Gerar PIX Copia e Cola (EMV Code)
      const pixKey = Deno.env.get('PIX_KEY') || ''; // Chave PIX configurada
      const merchantName = 'ESPACO LINDA';
      const merchantCity = 'SAO PAULO';
      const txid = crypto.randomUUID().replace(/-/g, '').substring(0, 25);

      // Formato PIX estático simplificado
      const pixCode = generateStaticPIX(pixKey, merchantName, merchantCity, payload.amount, payload.description, txid);

      // Calcular data de expiração (24 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Salvar transação no banco
      const { data: transaction, error: dbError } = await supabase
        .from('payment_transactions')
        .insert({
          event_id: payload.eventId,
          proposal_id: payload.proposalId,
          lead_id: payload.leadId,
          payment_method: 'pix',
          amount: payload.amount,
          currency: 'BRL',
          status: 'pending',
          pix_code: pixCode,
          pix_qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`,
          pix_expires_at: expiresAt.toISOString(),
          metadata: {
            description: payload.description,
            txid,
            ...payload.metadata
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar transação:', dbError);
        throw dbError;
      }

      return new Response(
        JSON.stringify({
          transactionId: transaction.id,
          pixCode,
          pixQrCode: transaction.pix_qr_code,
          expiresAt: transaction.pix_expires_at,
          amount: payload.amount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CONSULTAR STATUS
    if (path.startsWith('/status/') && req.method === 'GET') {
      const transactionId = path.replace('/status/', '');

      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        return new Response(
          JSON.stringify({ error: 'Transação não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ transaction }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in pix-payments:', error);
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

/**
 * Gera código PIX estático (EMV Code)
 * Formato simplificado para demonstração
 */
function generateStaticPIX(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  description: string,
  txid: string
): string {
  // Formato EMV simplificado
  // ID 00: Payload Format Indicator
  const payloadFormatIndicator = '000201';
  
  // ID 26: Merchant Account Information (PIX)
  const merchantAccountInfo = `26${(pixKey.length + 22).toString().padStart(2, '0')}0014br.gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
  
  // ID 52: Merchant Category Code
  const merchantCategoryCode = '52040000';
  
  // ID 53: Transaction Currency (986 = BRL)
  const transactionCurrency = '5303986';
  
  // ID 54: Transaction Amount
  const amountStr = amount.toFixed(2);
  const transactionAmount = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // ID 58: Country Code
  const countryCode = '5802BR';
  
  // ID 59: Merchant Name
  const merchantNameField = `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;
  
  // ID 60: Merchant City
  const merchantCityField = `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`;
  
  // ID 62: Additional Data Field Template (txid)
  const additionalData = `62${(txid.length + 8).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}`;
  
  // Concatenar todos os campos
  const payload = payloadFormatIndicator +
                  merchantAccountInfo +
                  merchantCategoryCode +
                  transactionCurrency +
                  transactionAmount +
                  countryCode +
                  merchantNameField +
                  merchantCityField +
                  additionalData;
  
  // ID 63: CRC16 (simplificado - em produção usar algoritmo CRC16 real)
  const crc = '6304'; // Placeholder - em produção calcular CRC16 real
  
  return payload + crc + 'XXXX'; // XXXX = CRC16 calculado
}
