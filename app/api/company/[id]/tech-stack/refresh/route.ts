/**
 * API: POST Tech Stack Refresh
 * Detecta tecnologias AGORA (heurística + BuiltWith opcional)
 * BATCH 2: Protegido com db() + assertCompanyInTenantOr404
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';
import { fetchHomepageArtifacts } from '@/lib/providers/html';
import { detectTech } from '@/lib/heuristics/tech';
import { fetchBuiltWith } from '@/lib/providers/builtwith';

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
    // Fetch homepage artifacts
    const art = await fetchHomepageArtifacts(domain);

    // Detectar com heurística
    let items = detectTech({
      html: art.html,
      metas: art.metas,
      scripts: art.scripts,
      links: art.links,
    }).map((it) => ({
      ...it,
      source: 'heuristic',
      latency_ms: art.latency,
      evidence: { pattern: 'heuristic', url: art.finalUrl },
    }));

    // OPCIONAL: BuiltWith (se chave existir)
    const bw = await fetchBuiltWith(domain);
    if (bw && !('error' in bw) && bw.json?.Results?.length) {
      const seen = new Set(items.map((i) => i.tech_name.toLowerCase()));
      const fromBw = (bw.json.Results[0].Result?.Paths || [])
        .flatMap((p: any) => p.Technologies || [])
        .map((t: any) => ({
          tech_name: t.Name,
          category: t.Tag || 'other',
          confidence: 70,
          source: 'builtwith',
          latency_ms: bw.latency,
          evidence: { path: t.Link },
        }));

      // Adicionar apenas tecnologias não detectadas pela heurística
      for (const t of fromBw) {
        if (!seen.has(t.tech_name.toLowerCase())) {
          items.push(t);
        }
      }
    }

    // Inserir sinais (se houver) - tenant_id preenchido automaticamente
    if (items.length) {
      const { insert } = db();
      const payload = items.map((i) => ({ company_id: company.id, ...i }));
      const { error } = await insert('tech_signals', payload);
      if (error) throw error;
    }

    // Log de sucesso (tenant_id automático)
    const { insert } = db();
    await insert('provider_logs', {
      company_id: company.id,
      provider: 'direct_fetch',
      operation: 'tech',
      status: 'ok',
      latency_ms: art.latency,
    });

    return NextResponse.json({ ok: true, count: items.length }, { status: 200 });
  } catch (e: any) {
    // Log de erro (tenant_id automático)
    const { insert } = db();
    await insert('provider_logs', {
      company_id: company.id,
      provider: 'direct_fetch',
      operation: 'tech',
      status: 'error',
      meta: { message: String(e) },
    });

    return NextResponse.json(
      { ok: false, code: 'FETCH_ERROR', message: String(e) },
      { status: 502 }
    );
  }
}

