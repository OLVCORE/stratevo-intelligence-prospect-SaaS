/**
 * Alerts API: Regras
 * CRUD de regras de alerta
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

const Rule = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid().nullable().optional(),
  name: z.string().min(2),
  event: z.enum([
    'company_status_change',
    'news_spike',
    'tech_detected',
    'sdr_reply',
    'delivery_error',
  ]),
  conditions: z.record(z.any()).default({}),
  channels: z
    .array(
      z.object({
        type: z.enum(['email', 'whatsapp']),
        to: z.string().min(3),
      })
    )
    .min(1),
  status: z.enum(['active', 'paused']).default('active'),
});

export async function GET(req: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from('alert_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });
  }

  return Response.json({ ok: true, items: data });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Rule.safeParse(json);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ ok: false, code: 'INVALID_INPUT', issues: parsed.error.format() }),
      { status: 422 }
    );
  }

  const body = parsed.data;

  const { data, error } = body.id
    ? await supabaseAdmin
        .from('alert_rules')
        .update({
          company_id: body.companyId ?? null,
          name: body.name,
          event: body.event,
          conditions: body.conditions,
          channels: body.channels,
          status: body.status,
        })
        .eq('id', body.id)
        .select('*')
        .single()
    : await supabaseAdmin
        .from('alert_rules')
        .insert({
          company_id: body.companyId ?? null,
          name: body.name,
          event: body.event,
          conditions: body.conditions,
          channels: body.channels,
          status: body.status,
        })
        .select('*')
        .single();

  if (error) {
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });
  }

  return Response.json({ ok: true, rule: data });
}

