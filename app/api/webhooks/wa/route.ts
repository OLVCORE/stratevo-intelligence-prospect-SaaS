/**
 * API: POST WhatsApp Webhook
 * Recebe mensagens inbound do WhatsApp (Twilio)
 * Valida assinatura e cria mensagem inbound
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyTwilioSignature } from '@/lib/providers/wa-verify';

export async function POST(req: NextRequest) {
  try {
    // Parse do body (Twilio envia como form-urlencoded)
    const formData = await req.formData();
    const params: Record<string, any> = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    // Validar assinatura Twilio
    const signature = req.headers.get('x-twilio-signature');
    const url = req.url;

    if (signature && !verifyTwilioSignature(url, params, signature)) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Assinatura Twilio inválida' },
        { status: 401 }
      );
    }

    const { From, To, Body, MessageSid } = params;

    if (!From || !To || !Body) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PAYLOAD' },
        { status: 422 }
      );
    }

    // Tentar encontrar thread por From (número do lead)
    // Formato Twilio: whatsapp:+5511999999999
    const fromNumber = From.replace('whatsapp:', '');

    // Buscar thread existente (simplificado - melhorar com mapping de números)
    const { data: threads } = await supabaseAdmin
      .from('threads')
      .select('id,lead_id')
      .eq('channel', 'whatsapp')
      .limit(10);

    // Por simplicidade, pegar primeira thread WA
    // Em produção, mapear número → lead_id via person_contacts
    const thread = threads?.[0];

    if (!thread) {
      console.warn('WhatsApp inbound sem thread conhecida:', { From, Body });
      return NextResponse.json(
        { ok: true, message: 'WhatsApp recebido mas thread não identificada' },
        { status: 200 }
      );
    }

    // Buscar company_id para privacy prefs
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('company_id')
      .eq('id', thread.lead_id)
      .single();

    const { data: privacyPref } = await supabaseAdmin
      .from('privacy_prefs')
      .select('store_message_body')
      .eq('company_id', lead?.company_id)
      .maybeSingle();

    const storeBody = privacyPref?.store_message_body ?? false;

    // Criar mensagem inbound
    const { error } = await supabaseAdmin.from('messages').insert({
      thread_id: thread.id,
      direction: 'inbound',
      from_addr: fromNumber,
      to_addr: To.replace('whatsapp:', ''),
      body: storeBody ? Body : null,
      provider: 'twilio',
      provider_msg_id: MessageSid,
      status: 'received',
    });

    if (error) throw error;

    // Log
    await supabaseAdmin.from('provider_logs').insert({
      company_id: lead?.company_id,
      provider: 'twilio',
      operation: 'sdr-inbound',
      status: 'ok',
      meta: { from: fromNumber, messageSid: MessageSid },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message || 'Erro inesperado' },
      { status: 500 }
    );
  }
}

