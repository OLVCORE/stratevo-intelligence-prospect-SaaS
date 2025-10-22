/**
 * API: POST Instantiate Playbook Run
 * Cria run de playbook para um lead
 * Valida bindings e inicia sequência
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

const Schema = z.object({
  playbookId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await req.json();
    const { playbookId } = Schema.parse(body);

    // Verificar se playbook está ativo
    const { data: playbook } = await supabaseAdmin
      .from('playbooks')
      .select('*')
      .eq('id', playbookId)
      .single();

    if (!playbook) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Playbook não encontrado' },
        { status: 404 }
      );
    }

    if (playbook.status !== 'active') {
      return NextResponse.json(
        { ok: false, code: 'INACTIVE_PLAYBOOK', message: 'Playbook não está ativo' },
        { status: 422 }
      );
    }

    // Verificar se lead já tem run ativo deste playbook
    const { data: existingRun } = await supabaseAdmin
      .from('runs')
      .select('id')
      .eq('lead_id', params.leadId)
      .eq('playbook_id', playbookId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingRun) {
      return NextResponse.json(
        { ok: false, code: 'RUN_EXISTS', message: 'Lead já tem run ativo deste playbook', runId: existingRun.id },
        { status: 422 }
      );
    }

    // TODO: Validar bindings (persona, etc.) se necessário

    // Criar run
    const { data: run, error } = await supabaseAdmin
      .from('runs')
      .insert({
        lead_id: params.leadId,
        playbook_id: playbookId,
        step_index: 0,
        status: 'active',
        next_due_at: new Date().toISOString(), // Primeiro passo pode executar imediatamente
        variant_map: {},
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, runId: run.id }, { status: 201 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', fields: e.flatten() },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message },
      { status: 500 }
    );
  }
}

