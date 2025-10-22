/**
 * API: GET Maturity Scores
 * Retorna último run de maturidade
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
        .from('maturity_scores')
        .select('run_id')
        .eq('company_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastRun) {
        return NextResponse.json(
          { ok: true, scores: [], recommendations: [], run_id: null },
          { status: 200 }
        );
      }

      targetRunId = lastRun.run_id;
    }

    // Buscar scores e recomendações do run
    const [scoresRes, recosRes] = await Promise.all([
      supabaseAdmin
        .from('maturity_scores')
        .select('*')
        .eq('company_id', params.id)
        .eq('run_id', targetRunId),
      supabaseAdmin
        .from('maturity_recos')
        .select('*')
        .eq('company_id', params.id)
        .eq('run_id', targetRunId),
    ]);

    return NextResponse.json(
      {
        ok: true,
        run_id: targetRunId,
        scores: scoresRes.data || [],
        recommendations: recosRes.data || [],
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

