/**
 * API: POST Create Lead
 * Cria lead a partir de empresa + pessoa (decisor)
 * BATCH 3: Protegido com db() + assertCompanyInTenantOr404
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';

const Schema = z.object({
  companyId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  owner: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, personId, owner, source, notes } = Schema.parse(body);

    // Validar que company pertence ao tenant ativo
    const guard = await assertCompanyInTenantOr404(companyId);
    if (guard) return guard;

    // Inserir lead (tenant_id preenchido automaticamente)
    const { insert } = db();
    const { data, error } = await insert('leads', {
      company_id: companyId,
      person_id: personId || null,
      stage: 'new',
      owner,
      source,
      notes,
    })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, leadId: data.id }, { status: 201 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', fields: e.flatten() },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message || 'Erro inesperado' },
      { status: 500 }
    );
  }
}

