import { NextRequest } from 'next/server';
import { z } from 'zod';
import { composeReport } from '@/lib/reports/compose';
import Inteligencia360PDF from '@/lib/reports/pdf/Inteligencia360';
import { supabaseAdmin } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';

const Body = z.object({
  companyId: z.string().uuid(),
  sections: z
    .array(z.enum(['inteligencia360', 'maturidade', 'fit', 'decisores', 'digital']))
    .nonempty(),
});

export async function POST(req: NextRequest) {
  const started = performance.now();
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return new Response(
      JSON.stringify({ ok: false, code: 'INVALID_INPUT', issues: parsed.error.format() }),
      { status: 422 }
    );

  const { companyId, sections } = parsed.data;
  const data = await composeReport(companyId, sections);

  const stream = await renderToStream(
    Inteligencia360PDF({ data, sections })
  );

  // audit + provider_logs
  await supabaseAdmin
    .from('audit_log')
    .insert({ action: 'report_create', entity: 'report', entity_id: companyId, meta: { sections } });
  const latency = Math.round(performance.now() - started);
  await supabaseAdmin.from('provider_logs').insert({
    company_id: companyId,
    provider: 'renderer',
    operation: 'report',
    status: 'ok',
    latency_ms: latency,
    meta: { sections },
  });

  return new Response(stream as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="OLV-Inteligencia360-${companyId}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}

