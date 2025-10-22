/**
 * Analytics API: Refresh
 * Atualiza materialized views (protegido por token)
 */
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  if (req.headers.get('x-analytics-secret') !== process.env.ANALYTICS_REFRESH_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  const { error } = await (supabaseAdmin as any).rpc('refresh_ciclo9_materialized');

  if (error) {
    return new Response(
      JSON.stringify({ ok: false, code: 'REFRESH_ERROR', message: error.message }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

