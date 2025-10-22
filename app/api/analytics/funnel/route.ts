/**
 * Analytics API: Funil
 * Retorna métricas de funil por empresa e janela temporal
 */
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get('companyId');
  const days = Number(url.searchParams.get('days') || 30);

  if (!companyId) {
    return new Response(JSON.stringify({ ok: false, code: 'INVALID_INPUT' }), { status: 422 });
  }

  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data, error } = await supabaseAdmin
    .from('mv_funnel_daily')
    .select('*')
    .eq('company_id', companyId)
    .gte('d', since)
    .order('d', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true, items: data }), {
    status: 200,
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
  });
}

