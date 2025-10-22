/**
 * API: List Companies
 * Paginação, ordenação e filtros para listagem de empresas
 * BATCH 1: Usa db() para garantir filtro automático de tenant_id
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SORT_MAP = new Set(['created_at', 'updated_at', 'name', 'capital_social']);
const ORDER_MAP = new Set(['asc', 'desc']);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
  const sort = SORT_MAP.has(url.searchParams.get('sort') || 'updated_at')
    ? (url.searchParams.get('sort')! as 'created_at' | 'updated_at' | 'name' | 'capital_social')
    : 'updated_at';
  const order = ORDER_MAP.has(url.searchParams.get('order') || 'desc')
    ? (url.searchParams.get('order')! as 'asc' | 'desc')
    : 'desc';
  const q = (url.searchParams.get('q') || '').trim();
  const status = (url.searchParams.get('status') || '').trim().toUpperCase();
  const minCapital = url.searchParams.get('minCapital');
  const maxCapital = url.searchParams.get('maxCapital');

  // Usar db().from() para filtro automático de tenant_id
  const { from } = db();
  let query = from('companies').select(
    'id,name,trade_name,cnpj,domain,capital_social,status,updated_at,source',
    {
      count: 'exact',
    }
  );

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,trade_name.ilike.%${q}%,cnpj.ilike.%${q}%,domain.ilike.%${q}%`
    );
  }
  if (status) query = query.eq('status', status);
  if (minCapital) query = query.gte('capital_social', Number(minCapital));
  if (maxCapital) query = query.lte('capital_social', Number(maxCapital));

  // paginação
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // ordenação
  query = query.order(sort as any, { ascending: order === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json(
    {
      ok: true,
      items: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
    },
    { status: 200 }
  );
}

