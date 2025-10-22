/**
 * API: POST Digital Refresh
 * Coleta sinais digitais (homepage) AGORA
 * BATCH 2: Protegido com db() + assertCompanyInTenantOr404
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';
import { fetchHomepageArtifacts } from '@/lib/providers/html';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Validar que company pertence ao tenant ativo
  const guard = await assertCompanyInTenantOr404(params.id);
  if (guard) return guard;

  // Buscar empresa
  const { from } = db();
  const { data: company } = await from('companies')
    .select('id,domain,website')
    .eq('id', params.id)
    .single();

  if (!company)
    return NextResponse.json(
      { ok: false, code: 'NOT_FOUND', message: 'Empresa não encontrada' },
      { status: 404 }
    );

  // Extrair domínio
  const domain =
    company.domain ||
    (company.website ? new URL(company.website).hostname.replace(/^www\./, '') : undefined);

  if (!domain)
    return NextResponse.json(
      { ok: false, code: 'NO_DOMAIN', message: 'Empresa sem domínio/website definido' },
      { status: 404 }
    );

  try {
    // Fetch homepage
    const { title, latency, finalUrl } = await fetchHomepageArtifacts(domain);

    // Inserir sinal (tenant_id preenchido automaticamente via db())
    const { insert } = db();
    const { error } = await insert('digital_signals', {
      company_id: company.id,
      url: finalUrl || `https://${domain}`,
      title,
      snippet: null,
      type: 'homepage',
      source: 'direct_fetch',
      latency_ms: latency,
      confidence: 80,
    });

    if (error) throw error;

    // Log de sucesso (tenant_id automático)
    await insert('provider_logs', {
      company_id: company.id,
      provider: 'direct_fetch',
      operation: 'digital',
      status: 'ok',
      latency_ms: latency,
      meta: { url: finalUrl || domain },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    // Log de erro (tenant_id automático)
    const { insert } = db();
    await insert('provider_logs', {
      company_id: company.id,
      provider: 'direct_fetch',
      operation: 'digital',
      status: 'error',
      meta: { message: String(e) },
    });

    return NextResponse.json(
      { ok: false, code: 'FETCH_ERROR', message: String(e) },
      { status: 502 }
    );
  }
}

