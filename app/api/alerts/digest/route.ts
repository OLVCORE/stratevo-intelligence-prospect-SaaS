/**
 * Alerts API: Digest
 * Processa digests diários/semanais
 */
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-alerts-secret') !== process.env.ALERTS_SCAN_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  const now = new Date().toISOString();
  const { data: jobs } = await supabaseAdmin
    .from('digest_jobs')
    .select('*')
    .lte('next_run_at', now)
    .eq('status', 'scheduled')
    .limit(10);

  let sent = 0;
  for (const j of jobs || []) {
    const since =
      j.cadence === 'weekly'
        ? new Date(Date.now() - 7 * 864e5).toISOString()
        : new Date(Date.now() - 864e5).toISOString();

    const { data: occs } = await supabaseAdmin
      .from('alert_occurrences')
      .select('id,rule_id,company_id,detected_at,payload,alert_rules(name,event)')
      .gte('detected_at', since)
      .order('detected_at', { ascending: false })
      .limit(200);

    const lines =
      (occs || [])
        .map(
          (o: any) =>
            `• ${o.detected_at} | ${o.alert_rules?.event} | ${o.alert_rules?.name} | company=${o.company_id}`
        )
        .join('\n') || 'Sem alertas no período.';

    if (j.to_email) {
      try {
        const tx = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || 'false') === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await tx.sendMail({
          from: process.env.FROM_EMAIL,
          to: j.to_email,
          subject: `Digest ${j.cadence.toUpperCase()} — OLV Alerts`,
          text: lines,
        });
      } catch (e: any) {
        console.error('Erro ao enviar digest:', e.message);
      }
    }

    await supabaseAdmin.rpc('digest_reschedule', {
      job_id: j.id,
      minutes: j.cadence === 'weekly' ? 7 * 24 * 60 : 24 * 60,
    });
    sent++;
  }

  return Response.json({ ok: true, sent });
}

