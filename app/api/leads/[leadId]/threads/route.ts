/**
 * API: POST Create Thread
 * Cria (ou reaproveita) uma thread para o lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

const Schema = z.object({
  channel: z.enum(['email', 'whatsapp']),
  subject: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await req.json();
    const { channel, subject } = Schema.parse(body);

    // Verificar se lead existe
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('id', params.leadId)
      .single();

    if (!lead)
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Lead não encontrado' },
        { status: 404 }
      );

    // Verificar se já existe thread para esse canal
    const { data: existing } = await supabaseAdmin
      .from('threads')
      .select('id')
      .eq('lead_id', params.leadId)
      .eq('channel', channel)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, threadId: existing.id }, { status: 200 });
    }

    // Criar nova thread
    const { data, error } = await supabaseAdmin
      .from('threads')
      .insert({
        lead_id: params.leadId,
        channel,
        subject: channel === 'email' ? subject : null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, threadId: data.id }, { status: 201 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', fields: e.flatten() },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message || 'Erro inesperado' },
      { status: 500 }
    );
  }
}

