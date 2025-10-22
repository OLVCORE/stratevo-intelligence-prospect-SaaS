/**
 * Analytics API: Persona
 * Retorna eficiência por persona (C-level, Compras, TI, etc.)
 */
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('mv_persona_efficiency')
    .select('*')
    .order('meetings', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true, items: data }), {
    status: 200,
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600' },
  });
}

