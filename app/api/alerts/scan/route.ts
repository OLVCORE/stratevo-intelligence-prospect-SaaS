/**
 * Alerts API: Scanner
 * Executa regras e cria ocorrências
 */
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-alerts-secret') !== process.env.ALERTS_SCAN_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  let created = 0;

  // 1) company_status_change
  const { data: rules1 } = await supabaseAdmin
    .from('alert_rules')
    .select('*')
    .eq('event', 'company_status_change')
    .eq('status', 'active');

  if (rules1) {
    for (const r of rules1) {
      if (!r.company_id) continue;

      const { data: cs } = await supabaseAdmin
        .from('companies')
        .select('id,status,updated_at')
        .eq('id', r.company_id)
        .maybeSingle();

      const { data: lastOcc } = await supabaseAdmin
        .from('alert_occurrences')
        .select('payload')
        .eq('rule_id', r.id)
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const prev = lastOcc?.payload?.status;
      if (cs && prev !== cs.status) {
        await supabaseAdmin.from('alert_occurrences').insert({
          rule_id: r.id,
          company_id: cs.id,
          payload: { status: cs.status, ts: cs.updated_at },
        });
        created++;
      }
    }
  }

  // 2) delivery_error
  const since = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const { data: rules2 } = await supabaseAdmin
    .from('alert_rules')
    .select('*')
    .eq('event', 'delivery_error')
    .eq('status', 'active');

  if (rules2?.length) {
    const { data: errors } = await supabaseAdmin
      .from('provider_logs')
      .select('company_id,operation,provider,meta,created_at')
      .eq('status', 'error')
      .gte('created_at', since)
      .limit(500);

    for (const r of rules2) {
      const matches = (errors || []).filter((e: any) => !r.company_id || e.company_id === r.company_id);
      if (matches.length) {
        await supabaseAdmin.from('alert_occurrences').insert({
          rule_id: r.id,
          company_id: r.company_id,
          payload: { errors: matches },
        });
        created++;
      }
    }
  }

  // 3) sdr_reply
  const { data: rules3 } = await supabaseAdmin
    .from('alert_rules')
    .select('*')
    .eq('event', 'sdr_reply')
    .eq('status', 'active');

  if (rules3?.length) {
    const { data: replies } = await supabaseAdmin
      .from('run_events')
      .select('run_id,channel,provider,created_at')
      .eq('action', 'reply')
      .gte('created_at', since)
      .limit(500);

    for (const r of rules3) {
      if (replies?.length) {
        await supabaseAdmin.from('alert_occurrences').insert({
          rule_id: r.id,
          company_id: r.company_id,
          payload: { replies },
        });
        created++;
      }
    }
  }

  // 4) tech_detected
  const { data: rules4 } = await supabaseAdmin
    .from('alert_rules')
    .select('*')
    .eq('event', 'tech_detected')
    .eq('status', 'active');

  if (rules4?.length) {
    const { data: ts } = await supabaseAdmin
      .from('tech_signals')
      .select('company_id,tech_name,confidence,source,collected_at')
      .gte('collected_at', since)
      .limit(500);

    for (const r of rules4) {
      const techName = r.conditions?.tech_name;
      const matches = (ts || []).filter(
        (t: any) =>
          (!r.company_id || t.company_id === r.company_id) &&
          (!techName || (t.tech_name || '').toLowerCase() === String(techName).toLowerCase())
      );
      if (matches.length) {
        await supabaseAdmin.from('alert_occurrences').insert({
          rule_id: r.id,
          company_id: r.company_id ?? matches[0].company_id,
          payload: { techs: matches },
        });
        created++;
      }
    }
  }

  // 5) news_spike (placeholder - implementar quando houver coleta de menções)

  return Response.json({ ok: true, created });
}

