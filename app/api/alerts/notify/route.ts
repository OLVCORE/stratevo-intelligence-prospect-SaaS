/**
 * Alerts API: Notificação
 * Envia alertas não notificados e marca como enviados
 */
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

async function sendEmail(to: string, subject: string, text: string) {
  const tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await tx.sendMail({ from: process.env.FROM_EMAIL, to, subject, text });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-alerts-secret') !== process.env.ALERTS_SCAN_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  const { data: occs } = await supabaseAdmin
    .from('alert_occurrences')
    .select('id,rule_id,company_id,payload,detected_at,alert_rules(channels,name,event)')
    .is('notified', false)
    .order('detected_at', { ascending: true })
    .limit(50);

  let sent = 0;
  for (const o of (occs || []) as any[]) {
    const channels = (o.alert_rules?.channels as any) || [];
    const title = `Alerta: ${o.alert_rules?.name} (${o.alert_rules?.event})`;
    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const body = `Empresa: ${o.company_id}
Quando: ${o.detected_at}
Resumo: ${JSON.stringify(o.payload).slice(0, 1000)}

Abrir no contexto:
${appUrl}/companies/${o.company_id}
`;

    for (const ch of channels) {
      if (ch.type === 'email') {
        try {
          await sendEmail(ch.to, title, body);
        } catch (e: any) {
          console.error('Erro ao enviar email:', e.message);
        }
      }
      // WhatsApp: reusar provider do Ciclo 5 se necessário
    }

    await (supabaseAdmin.from('alert_occurrences') as any).update({ notified: true }).eq('id', o.id);
    sent++;
  }

  return Response.json({ ok: true, sent });
}

