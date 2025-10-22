/**
 * API: GET Decision Makers
 * Lista decisores persistidos para uma empresa
 * SEM MOCKS - se vazio, retorna array vazio
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
  const q = (url.searchParams.get('q') || '').trim();
  const dept = (url.searchParams.get('department') || '').trim();
  const seniority = (url.searchParams.get('seniority') || '').trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from('people')
    .select(
      'id,full_name,title,department,seniority,source,source_url,confidence,created_at,person_contacts(id,value,type,verified,source,source_url)',
      { count: 'exact' }
    )
    .eq('company_id', params.id);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,title.ilike.%${q}%`);
  }
  if (dept) query = query.eq('department', dept);
  if (seniority) query = query.eq('seniority', seniority);

  query = query.order('created_at', { ascending: false }).range(from, to);
  const { data, error, count } = await query;

  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json(
    { ok: true, items: data ?? [], page, pageSize, total: count ?? 0 },
    { status: 200 }
  );
}

