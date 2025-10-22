/**
 * API: GET Run Status
 * Retorna status + timeline do run
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { data: run } = await supabaseAdmin
      .from('runs')
      .select('*,playbooks(name,persona,goal)')
      .eq('id', params.runId)
      .single();

    if (!run) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Buscar events
    const { data: events } = await supabaseAdmin
      .from('run_events')
      .select('*')
      .eq('run_id', params.runId)
      .order('created_at', { ascending: true });

    // Buscar steps do playbook
    const { data: steps } = await supabaseAdmin
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', run.playbook_id)
      .order('order_index', { ascending: true });

    return NextResponse.json(
      {
        ok: true,
        run,
        events: events || [],
        steps: steps || [],
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: e?.message },
      { status: 500 }
    );
  }
}

