import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

const Body = z.object({
  companyId: z.string().uuid(),
  to: z.string().email(),
  template: z.enum(['inteligencia360']),
  when: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return new Response(
      JSON.stringify({ ok: false, code: 'INVALID_INPUT', issues: parsed.error.format() }),
      { status: 422 }
    );

  const { companyId, to, template, when } = parsed.data;
  const { data, error } = await supabaseAdmin
    .from('report_jobs')
    .insert({
      company_id: companyId,
      to_email: to,
      template,
      scheduled_for: when,
      status: 'scheduled',
    })
    .select('id')
    .single();
  if (error)
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });

  await supabaseAdmin
    .from('audit_log')
    .insert({
      action: 'report_schedule',
      entity: 'report',
      entity_id: data?.id,
      meta: { companyId, to, template, when },
    });
  return new Response(JSON.stringify({ ok: true, jobId: data?.id }), { status: 200 });
}

