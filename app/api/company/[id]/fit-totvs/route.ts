/**
 * API: GET FIT TOTVS
 * Retorna último run de FIT por área
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const runId = url.searchParams.get('run_id');

  try {
    // Buscar último run_id se não especificado
    let targetRunId = runId;

    if (!targetRunId) {
      const { data: lastRun } = await supabaseAdmin
        .from('fit_totvs')
        .select('run_id')
        .eq('company_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastRun) {
        return NextResponse.json({ ok: true, areas: [], run_id: null }, { status: 200 });
      }

      targetRunId = lastRun.run_id;
    }

    // Buscar fit por área
    const { data, error } = await supabaseAdmin
      .from('fit_totvs')
      .select('*')
      .eq('company_id', params.id)
      .eq('run_id', targetRunId);

    if (error) throw error;

    return NextResponse.json({ ok: true, run_id: targetRunId, areas: data || [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: e?.message },
      { status: 500 }
    );
  }
}

