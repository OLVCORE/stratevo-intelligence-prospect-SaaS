/**
 * API: POST Skip Step
 * Pula passo atual da sequência
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { data: run } = await supabaseAdmin
      .from('runs')
      .select('*')
      .eq('id', params.runId)
      .single();

    if (!run) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Registrar evento de skip
    await supabaseAdmin.from('run_events').insert({
      run_id: params.runId,
      step_index: run.step_index,
      action: 'skip',
      meta: { reason: 'Manual skip' },
    });

    // Avançar para próximo step
    const nextStepIndex = run.step_index + 1;
    await supabaseAdmin
      .from('runs')
      .update({ step_index: nextStepIndex })
      .eq('id', params.runId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message },
      { status: 500 }
    );
  }
}

