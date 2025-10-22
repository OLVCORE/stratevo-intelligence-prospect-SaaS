/**
 * API: POST Decision Makers Refresh
 * Coleta decisores AGORA usando Apollo/Hunter/Phantom (opcionais)
 * BATCH 3: Protegido com db() + assertCompanyInTenantOr404
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';
import { fetchApollo, type PersonResult } from '@/lib/providers/apollo';
import { enrichHunter } from '@/lib/providers/hunter';
import { enrichPhantom } from '@/lib/providers/phantom';

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

  const providers: any = { apollo: '-', hunter: '-', phantom: '-' };
  let added = 0;
  let updated = 0;

  // 1. Apollo (se disponível)
  let items: PersonResult[] = [];
  if (process.env.APOLLO_API_KEY) {
    const t0 = performance.now();
    try {
      const apolloResults = await fetchApollo(domain);
      if (apolloResults) {
        items = apolloResults;
        providers.apollo = Math.round(performance.now() - t0);
      }
    } catch (e: any) {
      providers.apollo = 'error';
      console.error('Apollo error:', e);
    }
  }

  // 2. Hunter (se disponível e houver items)
  if (items.length && process.env.HUNTER_API_KEY) {
    const t0 = performance.now();
    try {
      items = await enrichHunter(domain, items);
      providers.hunter = Math.round(performance.now() - t0);
    } catch (e: any) {
      providers.hunter = 'error';
      console.error('Hunter error:', e);
    }
  }

  // 3. Phantom (se disponível e houver items)
  if (items.length && process.env.PHANTOM_BUSTER_API_KEY) {
    const t0 = performance.now();
    try {
      items = await enrichPhantom(items);
      providers.phantom = Math.round(performance.now() - t0);
    } catch (e: any) {
      providers.phantom = 'error';
      console.error('Phantom error:', e);
    }
  }

  // 4. Persistência idempotente (evitar duplicatas por full_name + company_id)
  for (const p of items) {
    const { data: existing } = await from('people')
      .select('id')
      .eq('company_id', company.id)
      .ilike('full_name', p.full_name)
      .limit(1)
      .maybeSingle();

    let personId = existing?.id;

    if (!existing) {
      // Inserir nova pessoa
      const { data: ins } = await from('people')
        .insert({
          company_id: company.id,
          full_name: p.full_name,
          title: p.title,
          department: p.department,
          seniority: p.seniority,
          location: p.location,
          source: p.source,
          source_url: p.source_url,
          confidence: p.confidence,
          meta: p.meta,
        })
        .select('id')
        .single();

      personId = ins?.id;
      if (personId) added++;
    } else {
      // Atualizar pessoa existente
      await from('people')
        .update({
          title: p.title,
          department: p.department,
          seniority: p.seniority,
          location: p.location,
          source: p.source,
          source_url: p.source_url,
          confidence: p.confidence,
          meta: p.meta,
        })
        .eq('id', personId);
      updated++;
    }

    // Inserir contatos (evitar duplicatas simples por type + value)
    if (personId && Array.isArray(p.contacts)) {
      for (const c of p.contacts) {
        const { data: ex } = await from('person_contacts')
          .select('id')
          .eq('person_id', personId)
          .eq('type', c.type)
          .eq('value', c.value)
          .maybeSingle();

        if (!ex) {
          const { insert: insertContact } = db();
          await insertContact('person_contacts', {
            person_id: personId,
            type: c.type,
            value: c.value,
            verified: !!c.verified,
            source: c.source,
            source_url: c.source_url,
          });
        }
      }
    }
  }

  // 5. Telemetria (resumo)
  const { insert } = db();
  await insert('provider_logs', {
    company_id: company.id,
    provider: 'decision-makers',
    operation: 'decision-makers',
    status: 'ok',
    latency_ms: 0,
    meta: providers,
  });

  return NextResponse.json({ ok: true, added, updated, providers }, { status: 200 });
}

