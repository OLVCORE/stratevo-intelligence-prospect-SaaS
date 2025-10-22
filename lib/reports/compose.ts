/**
 * Report Data Composer
 * Carrega e normaliza dados da empresa para relatórios
 * SEM MOCKS - arrays vazios quando não houver dados
 */
import { supabaseAdmin } from '@/lib/supabase/server';

export type ReportData = {
  company: any;
  maturity?: {
    pillars: Array<{ name: string; score: number; evidence: any[] }>;
    recos: Array<{ pillar: string; recommendation: string; priority: string }>;
  };
  fit?: Array<{ area: string; fit: number; signals: any; next_steps: string }>;
  decisionMakers?: Array<{ name: string; title?: string; contacts: any[]; source: string }>;
  digital?: { homepage?: any[]; tech?: any[] };
  generatedAt: string;
};

export async function composeReport(
  companyId: string,
  sections: string[]
): Promise<ReportData> {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id,name,trade_name,cnpj,website,domain,capital_social,status,updated_at,source')
    .eq('id', companyId)
    .single();

  const out: ReportData = { company, generatedAt: new Date().toISOString() };

  if (sections.includes('maturidade')) {
    const { data: ms } = await supabaseAdmin
      .from('maturity_scores')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    const { data: recos } = await supabaseAdmin
      .from('maturity_recos')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    const latestRun = ms?.[0]?.run_id;
    out.maturity = {
      pillars: (ms || [])
        .filter((x: any) => x.run_id === latestRun)
        .map((x: any) => ({ name: x.pillar, score: x.score, evidence: x.evidence || [] })),
      recos: (recos || [])
        .filter((x: any) => x.run_id === latestRun)
        .map((x: any) => ({ pillar: x.pillar, recommendation: x.recommendation, priority: x.priority })),
    };
  }

  if (sections.includes('fit')) {
    const { data: fits } = await supabaseAdmin
      .from('fit_totvs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    const latestRun = fits?.[0]?.run_id;
    out.fit = (fits || [])
      .filter((x: any) => x.run_id === latestRun)
      .map((x: any) => ({ area: x.area, fit: x.fit, signals: x.signals, next_steps: x.next_steps }));
  }

  if (sections.includes('decisores')) {
    const { data: people } = await supabaseAdmin
      .from('people')
      .select(
        'id,full_name,title,department,seniority,source,person_contacts(value,type,verified,source)'
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200);
    out.decisionMakers = (people || []).map((p: any) => ({
      name: p.full_name,
      title: p.title,
      source: p.source,
      contacts: p.person_contacts || [],
    }));
  }

  if (sections.includes('digital')) {
    const { data: ds } = await supabaseAdmin
      .from('digital_signals')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200);
    const { data: ts } = await supabaseAdmin
      .from('tech_signals')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200);
    out.digital = { homepage: ds || [], tech: ts || [] };
  }

  return out;
}

