import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { csvResponse } from '@/lib/exports/csv';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || '';
  const sort = url.searchParams.get('sort') || 'updated_at';
  const order = (url.searchParams.get('order') || 'desc') as 'asc' | 'desc';

  let query = supabaseAdmin.from('companies').select('*', { count: 'exact' });
  if (q)
    query = query.or(
      `name.ilike.%${q}%,trade_name.ilike.%${q}%,cnpj.ilike.%${q}%,domain.ilike.%${q}%`
    );
  if (status) query = query.eq('status', status);
  query = query.order(sort, { ascending: order === 'asc' }).limit(5000);

  const { data, error } = await query;
  if (error)
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });

  const rows = (data || []).map((c: any) => ({
    name: c.name || c.trade_name || '',
    cnpj: c.cnpj || '',
    domain: c.domain || '',
    capital_social: c.capital_social ?? '',
    status: c.status || '',
    source: c.source || '',
    updated_at: c.updated_at || '',
  }));

  await supabaseAdmin
    .from('audit_log')
    .insert({ action: 'csv_export', entity: 'companies', meta: { q, status, sort, order } });
  return csvResponse('companies.csv', rows);
}

