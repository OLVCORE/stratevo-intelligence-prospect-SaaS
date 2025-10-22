/**
 * API: POST FIT TOTVS Refresh
 * Calcula fit por área AGORA usando sinais existentes
 * SEM MOCKS - se não houver sinais, fit baixo com explicação
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateFitTotvs } from '@/lib/rules/fit-totvs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const t0 = performance.now();

  try {
    // Buscar dados da empresa
    const [companyRes, techRes, digitalRes, peopleRes] = await Promise.all([
      supabaseAdmin.from('companies').select('*').eq('id', params.id).single(),
      supabaseAdmin.from('tech_signals').select('*').eq('company_id', params.id),
      supabaseAdmin.from('digital_signals').select('*').eq('company_id', params.id),
      supabaseAdmin.from('people').select('*').eq('company_id', params.id),
    ]);

    const companyData = {
      company: companyRes.data,
      techSignals: techRes.data || [],
      digitalSignals: digitalRes.data || [],
      people: peopleRes.data || [],
    };

    // Calcular FIT
    const runId = crypto.randomUUID();
    const results = await calculateFitTotvs(companyData);

    // Salvar fit por área
    for (const result of results) {
      await supabaseAdmin.from('fit_totvs').insert({
        company_id: params.id,
        run_id: runId,
        area: result.area,
        fit: result.fit,
        signals: result.signals,
        next_steps: result.next_steps,
      });
    }

    const latency = Math.round(performance.now() - t0);

    // Telemetria
    await supabaseAdmin.from('provider_logs').insert({
      company_id: params.id,
      provider: 'fit-totvs',
      operation: 'fit-totvs',
      status: 'ok',
      latency_ms: latency,
      meta: { run_id: runId, areas: results.map((r) => ({ area: r.area, fit: r.fit })) },
    });

    return NextResponse.json(
      { ok: true, run_id: runId, areas: results.map((r) => ({ area: r.area, fit: r.fit })) },
      { status: 200 }
    );
  } catch (e: any) {
    const latency = Math.round(performance.now() - t0);

    await supabaseAdmin.from('provider_logs').insert({
      company_id: params.id,
      provider: 'fit-totvs',
      operation: 'fit-totvs',
      status: 'error',
      latency_ms: latency,
      meta: { error: e?.message },
    });

    return NextResponse.json(
      { ok: false, code: 'CALC_ERROR', message: e?.message || 'Erro ao calcular FIT' },
      { status: 500 }
    );
  }
}

