/**
 * API: POST Send Message
 * Envia mensagem (email/WA) pela thread
 * SEM MOCKS - usa provedores reais ou erro explícito
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/providers/smtp';
import { sendWhatsApp } from '@/lib/providers/wa';
import { renderTemplate, buildTemplateVariables } from '@/lib/templates';

const Schema = z.object({
  to: z.string(),
  templateId: z.string().uuid().optional(),
  variables: z.record(z.any()).optional(),
  bodyText: z.string().optional(),
  bodyHtml: z.string().optional(),
  subject: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const body = await req.json();
    const { to, templateId, variables, bodyText, bodyHtml, subject } = Schema.parse(body);

    // Buscar thread + lead + company + person
    const { data: thread } = await supabaseAdmin
      .from('threads')
      .select('id,channel,subject,lead_id,leads(company_id,person_id)')
      .eq('id', params.threadId)
      .single();

    if (!thread)
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Thread não encontrada' },
        { status: 404 }
      );

    const leadData: any = Array.isArray(thread.leads) ? thread.leads[0] : thread.leads;
    const companyId = leadData?.company_id;
    const personId = leadData?.person_id;

    // Buscar dados para variáveis do template
    let company = null;
    let person = null;
    if (companyId) {
      const { data } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      company = data;
    }
    if (personId) {
      const { data } = await supabaseAdmin
        .from('people')
        .select('*')
        .eq('id', personId)
        .single();
      person = data;
    }

    // Renderizar template (se templateId fornecido)
    let finalText = bodyText || '';
    let finalHtml = bodyHtml || '';
    let finalSubject = subject || thread.subject || '';

    if (templateId) {
      const { data: template } = await supabaseAdmin
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!template)
        return NextResponse.json(
          { ok: false, code: 'TEMPLATE_NOT_FOUND' },
          { status: 404 }
        );

      const vars = variables || buildTemplateVariables(company, person);
      finalText = renderTemplate(template.body_md, vars);
      finalHtml = `<p>${finalText.replace(/\n/g, '<br>')}</p>`;
      if (template.subject) finalSubject = renderTemplate(template.subject, vars);
    }

    // Verificar se deve armazenar corpo (LGPD)
    const { data: privacyPref } = await supabaseAdmin
      .from('privacy_prefs')
      .select('store_message_body')
      .eq('company_id', companyId)
      .maybeSingle();

    const storeBody = privacyPref?.store_message_body ?? false;

    // Enviar via provider
    let result: any;
    let providerName: string;

    if (thread.channel === 'email') {
      providerName = 'smtp';
      result = await sendEmail({
        to,
        subject: finalSubject,
        text: finalText,
        html: finalHtml,
      });
    } else if (thread.channel === 'whatsapp') {
      providerName = 'twilio';
      result = await sendWhatsApp({
        to,
        content: finalText,
      });
    } else {
      return NextResponse.json(
        { ok: false, code: 'INVALID_CHANNEL' },
        { status: 400 }
      );
    }

    // Salvar mensagem
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        thread_id: params.threadId,
        direction: 'outbound',
        from_addr: thread.channel === 'email' 
          ? (process.env.FROM_EMAIL || process.env.SMTP_USER || '')
          : (process.env.TWILIO_WHATSAPP_FROM || ''),
        to_addr: to,
        body: storeBody ? finalText : null, // LGPD: só armazena se permitido
        provider: providerName,
        provider_msg_id: result.messageId,
        status: 'sent',
        latency_ms: result.latency,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Log em provider_logs
    await supabaseAdmin.from('provider_logs').insert({
      company_id: companyId,
      provider: providerName,
      operation: 'sdr-send',
      status: 'ok',
      latency_ms: result.latency,
      meta: { thread_id: params.threadId, message_id: message.id },
    });

    return NextResponse.json(
      { ok: true, messageId: message.id, providerMessageId: result.messageId },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', fields: e.flatten() },
        { status: 422 }
      );
    }

    // Log de erro
    await supabaseAdmin.from('provider_logs').insert({
      provider: 'sdr',
      operation: 'sdr-send',
      status: 'error',
      meta: { error: e?.message || String(e) },
    });

    return NextResponse.json(
      { ok: false, code: 'SEND_ERROR', message: e?.error || e?.message || String(e) },
      { status: 502 }
    );
  }
}

