/**
 * Analytics API: Heatmap
 * Retorna heatmap de horário × dia útil
 */
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('mv_heatmap').select('*');

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

