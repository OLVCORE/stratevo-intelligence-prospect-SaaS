/**
 * API: GET Tech Stack
 * Lista tecnologias detectadas para uma empresa
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

  const { from } = db();
  const { data, error } = await from('tech_signals')
    .select('*')
    .eq('company_id', params.id)
    .order('collected_at', { ascending: false });

  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, items: data || [] }, { status: 200 });
}

