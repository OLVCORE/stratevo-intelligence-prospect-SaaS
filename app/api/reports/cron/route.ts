import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { composeReport } from '@/lib/reports/compose';
import Inteligencia360PDF from '@/lib/reports/pdf/Inteligencia360';
import { renderToBuffer } from '@react-pdf/renderer';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }
  const now = new Date().toISOString();
  const { data: jobs } = await supabaseAdmin
    .from('report_jobs')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .limit(10);

  let sent = 0,
    failed = 0;
  for (const job of jobs || []) {
    try {
      await supabaseAdmin
        .from('report_jobs')
        .update({ status: 'running', last_run_at: new Date().toISOString() })
        .eq('id', job.id);

      const data = await composeReport(job.company_id, [
        'maturidade',
        'fit',
        'decisores',
        'digital',
      ]);
      const pdf = await renderToBuffer(
        Inteligencia360PDF({ data, sections: ['maturidade', 'fit', 'decisores', 'digital'] })
      );

      const tx = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await tx.sendMail({
        from: process.env.FROM_EMAIL,
        to: job.to_email,
        subject: 'Relatório OLV Intelligence 360°',
        text: 'Segue em anexo o relatório.',
        attachments: [
          {
            filename: `OLV-Inteligencia360-${job.company_id}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });

      await supabaseAdmin.from('report_jobs').update({ status: 'sent' }).eq('id', job.id);
      await supabaseAdmin
        .from('audit_log')
        .insert({ action: 'report_send', entity: 'report', entity_id: job.id, meta: { to: job.to_email } });
      await supabaseAdmin.from('provider_logs').insert({
        company_id: job.company_id,
        provider: 'smtp',
        operation: 'report-schedule',
        status: 'ok',
        latency_ms: 0,
        meta: { jobId: job.id },
      });
      sent++;
    } catch (e: any) {
      await supabaseAdmin
        .from('report_jobs')
        .update({ status: 'failed', last_error: e?.message || String(e) })
        .eq('id', job.id);
      await supabaseAdmin.from('provider_logs').insert({
        company_id: job.company_id,
        provider: 'smtp',
        operation: 'report-schedule',
        status: 'error',
        latency_ms: 0,
        meta: { jobId: job.id, error: e?.message || String(e) },
      });
      failed++;
    }
  }
  return new Response(JSON.stringify({ ok: true, sent, failed }), { status: 200 });
}

