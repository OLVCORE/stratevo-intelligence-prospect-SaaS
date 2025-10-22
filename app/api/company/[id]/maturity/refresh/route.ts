/**
 * API: POST Maturity Refresh
 * Calcula maturidade AGORA usando sinais existentes
 * SEM MOCKS - se não houver sinais, scores baixos com explicação
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateMaturityScores } from '@/lib/rules/maturity';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const t0 = performance.now();

  try {
    // Buscar sinais da empresa
    const [techRes, digitalRes, peopleRes, leadsRes, messagesRes] = await Promise.all([
      supabaseAdmin.from('tech_signals').select('*').eq('company_id', params.id),
      supabaseAdmin.from('digital_signals').select('*').eq('company_id', params.id),
      supabaseAdmin
        .from('people')
        .select('*,person_contacts(*)')
        .eq('company_id', params.id),
      supabaseAdmin.from('leads').select('*').eq('company_id', params.id),
      supabaseAdmin
        .from('messages')
        .select('*')
        .in(
          'thread_id',
          (
            await supabaseAdmin
              .from('threads')
              .select('id')
              .in(
                'lead_id',
                (await supabaseAdmin.from('leads').select('id').eq('company_id', params.id)).data?.map(
                  (l) => l.id
                ) || []
              )
          ).data?.map((t) => t.id) || []
        ),
    ]);

    const companyData = {
      techSignals: techRes.data || [],
      digitalSignals: digitalRes.data || [],
      people: peopleRes.data || [],
      leads: leadsRes.data || [],
      messages: messagesRes.data || [],
    };

    // Calcular scores
    const runId = crypto.randomUUID();
    const results = await calculateMaturityScores(companyData);

    // Salvar scores
    for (const result of results) {
      await supabaseAdmin.from('maturity_scores').insert({
        company_id: params.id,
        run_id: runId,
        pillar: result.pillar,
        score: result.score,
        evidence: result.evidence,
      });

      // Salvar recomendações
      for (const reco of result.recommendations) {
        await supabaseAdmin.from('maturity_recos').insert({
          company_id: params.id,
          run_id: runId,
          pillar: result.pillar,
          recommendation: reco.recommendation,
          rationale: reco.rationale,
          priority: reco.priority,
          source: 'rule',
        });
      }
    }

    const latency = Math.round(performance.now() - t0);

    // Telemetria
    await supabaseAdmin.from('provider_logs').insert({
      company_id: params.id,
      provider: 'maturity',
      operation: 'maturity',
      status: 'ok',
      latency_ms: latency,
      meta: { run_id: runId, pillars: results.map((r) => ({ pillar: r.pillar, score: r.score })) },
    });

    const scores = results.reduce((acc, r) => ({ ...acc, [r.pillar]: r.score }), {});
    const recosCount = results.reduce((sum, r) => sum + r.recommendations.length, 0);

    return NextResponse.json({ ok: true, run_id: runId, scores, recosCount }, { status: 200 });
  } catch (e: any) {
    const latency = Math.round(performance.now() - t0);

    await supabaseAdmin.from('provider_logs').insert({
      company_id: params.id,
      provider: 'maturity',
      operation: 'maturity',
      status: 'error',
      latency_ms: latency,
      meta: { error: e?.message },
    });

    return NextResponse.json(
      { ok: false, code: 'CALC_ERROR', message: e?.message || 'Erro ao calcular maturidade' },
      { status: 500 }
    );
  }
}

