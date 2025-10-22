import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { csvResponse } from '@/lib/exports/csv';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get('companyId');
  if (!companyId)
    return new Response(JSON.stringify({ ok: false, code: 'INVALID_INPUT' }), { status: 422 });

  const { data: runs } = await supabaseAdmin
    .from('runs')
    .select('id,lead_id,playbook_id,step_index,status,created_at')
    .in(
      'lead_id',
      (await supabaseAdmin.from('leads').select('id').eq('company_id', companyId)).data?.map(
        (l: any) => l.id
      ) || []
    )
    .limit(5000);

  const rows: any[] = [];
  for (const r of runs || []) {
    const { data: evs } = await supabaseAdmin
      .from('run_events')
      .select(
        'step_index,variant,action,channel,provider,provider_msg_id,latency_ms,created_at'
      )
      .eq('run_id', r.id)
      .order('created_at', { ascending: true });
    (evs || []).forEach((e: any) =>
      rows.push({
        run_id: r.id,
        lead_id: r.lead_id,
        playbook_id: r.playbook_id,
        run_status: r.status,
        step_index: e.step_index,
        action: e.action,
        variant: e.variant || '',
        channel: e.channel || '',
        provider: e.provider || '',
        provider_msg_id: e.provider_msg_id || '',
        latency_ms: e.latency_ms || '',
        event_at: e.created_at,
        run_created_at: r.created_at,
      })
    );
  }

  await supabaseAdmin
    .from('audit_log')
    .insert({ action: 'csv_export', entity: 'runs', entity_id: companyId });
  return csvResponse(`runs-${companyId}.csv`, rows);
}

