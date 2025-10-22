/**
 * API: Smart Search
 * Busca empresa por CNPJ ou Website e faz UPSERT idempotente
 */
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeCnpj, isValidCnpj } from '@/lib/cnpj';
import { toNumberBRL } from '@/lib/money';
import { fetchReceitaWS } from '@/lib/providers/receitaws';
import { searchGoogleCSEOrSerper } from '@/lib/providers/search';

const Schema = z
  .object({
    cnpj: z.string().optional(),
    website: z.string().optional(),
  })
  .refine((v) => !!(v.cnpj || v.website), { message: 'Informe CNPJ ou Website' });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cnpj: rawCnpj, website: rawWebsite } = Schema.parse(body);

    let cnpj: string | undefined;
    let website: string | undefined;
    let domain: string | undefined;
    let source = 'mixed';
    let name: string | undefined;
    let trade_name: string | undefined;
    let capital_social: number | null = null;
    let status: string | undefined;
    let raw: any = {};
    let location: any;

    // Fluxo CNPJ
    if (rawCnpj) {
      cnpj = normalizeCnpj(rawCnpj);
      if (!isValidCnpj(cnpj)) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_INPUT', fields: { cnpj: 'CNPJ inválido' } },
          { status: 422 }
        );
      }
      try {
        const r = await fetchReceitaWS(cnpj);
        raw.receitaws = r.json;
        source = 'receitaws';
        name = r.json.nome || r.json.razao_social || r.json['RAZAO SOCIAL'];
        trade_name = r.json.fantasia || r.json.nome_fantasia;
        status = (r.json.situacao || r.json.status || '').toString().toUpperCase();
        capital_social = toNumberBRL(r.json.capital_social || r.json.capital) ?? null;
        location = {
          uf: r.json.uf,
          municipio: r.json.municipio || r.json.cidade,
          cep: r.json.cep,
          logradouro: r.json.logradouro,
          numero: r.json.numero,
        };
      } catch (e: any) {
        const code = e?.code === 422 ? 422 : 502;
        return NextResponse.json(
          {
            ok: false,
            code: code === 422 ? 'INVALID_INPUT' : 'PROVIDER_DOWN',
            provider: 'receitaws',
            message: e?.message || 'Erro ReceitaWS',
          },
          { status: code }
        );
      }
      // Website a partir de CSE/Serper (opcional)
      try {
        const s = await searchGoogleCSEOrSerper(`${name || ''} ${cnpj}`);
        raw.search = s;
        website = s.primaryWebsite || undefined;
        domain = s.domain || (website ? new URL(website).hostname.replace(/^www\./, '') : undefined);
        source = website ? 'mixed' : source;
      } catch {}
    }

    // Fluxo Website
    if (!cnpj && rawWebsite) {
      website = rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`;
      try {
        const s = await searchGoogleCSEOrSerper(website);
        raw.search = s;
        domain = s.domain || (website ? new URL(website).hostname.replace(/^www\./, '') : undefined);
        name = s.items?.[0]?.title || name;
        source = s.source;
      } catch (e: any) {
        return NextResponse.json(
          {
            ok: false,
            code: 'PROVIDER_DOWN',
            provider: 'search',
            message: e?.message || 'Erro de busca',
          },
          { status: 502 }
        );
      }
    }

    if (!cnpj && !domain) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: 'Não foi possível resolver empresa por CNPJ/Website',
        },
        { status: 404 }
      );
    }

    // UPSERT idempotente (com tenant_id automático via db())
    const { upsert } = db();
    const { data, error } = await upsert(
      'companies',
      {
        cnpj,
        website,
        domain,
        name,
        trade_name,
        capital_social,
        status,
        source,
        raw,
        location,
      },
      { onConflict: 'cnpj' }
    )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, company: data }, { status: 200 });
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

