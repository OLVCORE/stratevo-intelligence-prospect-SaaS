/**
 * API: POST Stop Run
 * Encerra sequência
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    // Registrar evento de stop
    await supabaseAdmin.from('run_events').insert({
      run_id: params.runId,
      step_index: -1,
      action: 'stop',
      meta: { reason: 'Manual stop' },
    });

    // Atualizar status do run
    const { error } = await supabaseAdmin
      .from('runs')
      .update({ status: 'stopped' })
      .eq('id', params.runId);

    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message },
      { status: 500 }
    );
  }
}

