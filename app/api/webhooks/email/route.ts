/**
 * API: POST Email Webhook
 * Recebe e-mails inbound (reply)
 * Valida webhook secret e cria mensagem inbound
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyWebhookSecret } from '@/lib/providers/wa-verify';

export async function POST(req: NextRequest) {
  try {
    // Validar webhook secret
    const secret = req.headers.get('x-webhook-secret');
    if (!secret || !verifyWebhookSecret(secret)) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Webhook secret inválido' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Formato esperado (adapte conforme seu provedor):
    // { from, to, subject, text, html, messageId, inReplyTo, references }
    const { from, to, subject, text, html, messageId, inReplyTo, references } = body;

    if (!from || !to) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PAYLOAD' },
        { status: 422 }
      );
    }

    // Tentar encontrar thread por external_id ou In-Reply-To
    let thread = null;

    if (inReplyTo || references) {
      const ids = [inReplyTo, ...(references || '').split(' ')].filter(Boolean);
      for (const extId of ids) {
        const { data } = await supabaseAdmin
          .from('threads')
          .select('id,lead_id')
          .eq('channel', 'email')
          .eq('external_id', extId)
          .maybeSingle();
        if (data) {
          thread = data;
          break;
        }
      }
    }

    // Se não encontrou, tentar por subject similarity ou criar nova
    if (!thread) {
      // Por simplicidade, vamos logar mas não criar thread automática
      console.warn('E-mail inbound sem thread conhecida:', { from, subject });
      return NextResponse.json(
        { ok: true, message: 'E-mail recebido mas thread não identificada' },
        { status: 200 }
      );
    }

    // Verificar se deve armazenar corpo
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
      from_addr: from,
      to_addr: to,
      body: storeBody ? (text || html) : null,
      provider: 'smtp',
      provider_msg_id: messageId,
      status: 'received',
    });

    if (error) throw error;

    // Log
    await supabaseAdmin.from('provider_logs').insert({
      company_id: lead?.company_id,
      provider: 'smtp',
      operation: 'sdr-inbound',
      status: 'ok',
      meta: { from, messageId },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message || 'Erro inesperado' },
      { status: 500 }
    );
  }
}

