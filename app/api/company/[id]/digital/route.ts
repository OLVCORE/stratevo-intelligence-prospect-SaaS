/**
 * API: GET Digital Signals
 * Lista sinais digitais coletados para uma empresa
 * BATCH 2: Protegido com db() + assertCompanyInTenantOr404
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Validar que company pertence ao tenant ativo
  const guard = await assertCompanyInTenantOr404(params.id);
  if (guard) return guard;

  const url = new URL(req.url);
  const limit = Math.min(50, Number(url.searchParams.get('limit') || '8'));
  const type = url.searchParams.get('type') || undefined;

  const { from } = db();
  let q = from('digital_signals')
    .select('*')
    .eq('company_id', params.id)
    .order('collected_at', { ascending: false })
    .limit(limit);

  if (type) q = q.eq('type', type);

  const { data, error } = await q;
  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, items: data || [] }, { status: 200 });
}

