/**
 * Aba exclusiva Apollo: só extração e listagem de decisores da Apollo.
 * Sem fallback LinkedIn/Hunter/PhantomBuster.
 */
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Linkedin, Sparkles, Loader2, ExternalLink, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ApolloOrgIdDialog } from '@/components/companies/ApolloOrgIdDialog';
import { enrichCompany } from '@/services/enrichment/EnrichmentOrchestrator';
import type { EnrichmentInput } from '@/types/enrichment';

export interface DecisorsApolloTabProps {
  companyId?: string;
  companyName?: string;
  linkedinUrl?: string;
  domain?: string;
  apolloOrganizationId?: string | null;
  apolloUrl?: string | null;
  savedData?: any;
  onDataChange?: (data: any) => void;
  onWebsiteDiscovered?: (website: string) => void;
}

/** Carrega apenas decisores com origem Apollo (raw_apollo_data ou data_sources contém apollo). */
async function loadApolloDecisors(companyId: string) {
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('raw_data, industry, name')
    .eq('id', companyId)
    .single();
  if (companyError || !companyData) return null;

  const { data: rows } = await supabase
    .from('decision_makers')
    .select('*')
    .eq('company_id', companyId);

  const apolloOnly = (rows || []).filter(
    (d: any) =>
      d.raw_apollo_data != null ||
      (Array.isArray(d.data_sources) && d.data_sources.includes('apollo')) ||
      (typeof d.data_sources === 'object' && d.data_sources && (d.data_sources as string[]).includes?.('apollo'))
  );

  const companyApolloData = companyData?.raw_data?.apollo_organization || companyData?.raw_data?.apollo || {};
  const classify = (title: string, seniority: string) => {
    const t = (title || '').toLowerCase();
    const s = (seniority || '').toLowerCase();
    if (s.includes('c_suite') || s.includes('vp') || t.includes('ceo') || t.includes('cfo') || t.includes('diretor') || t.includes('presidente') || t.includes('sócio')) return 'decision-maker';
    if (t.includes('gerente') || t.includes('coordinator') || t.includes('head of')) return 'influencer';
    return 'user';
  };

  const decisors = apolloOnly.map((d: any) => {
    const raw = d.raw_apollo_data || {};
    const title = d.title || d.position || '';
    const seniority = d.seniority || '';
    const deptList = Array.isArray(d.departments) ? d.departments : [];
    return {
      id: d.id,
      name: d.name || '',
      title,
      email: d.email,
      email_status: d.email_status,
      phone: d.phone,
      linkedin_url: d.linkedin_url,
      department: deptList[0] || null,
      seniority_level: seniority,
      buying_power: classify(title, seniority),
      city: d.city,
      state: d.state,
      country: d.country || 'Brazil',
      photo_url: d.photo_url,
      headline: d.headline,
      apollo_score: d.people_auto_score_value ?? raw.auto_score ?? raw.person_score,
      organization_name: d.company_name || companyApolloData?.name || companyData?.name,
      organization_employees: d.company_employees ?? companyApolloData?.estimated_num_employees,
      organization_industry: (Array.isArray(d.company_industries) && d.company_industries[0]) || companyApolloData?.industry || companyData?.industry,
      organization_keywords: Array.isArray(d.company_keywords) ? d.company_keywords : (companyApolloData?.keywords || []),
      departments: deptList,
      enriched_with: 'apollo',
    };
  });

  return {
    companyApolloOrg: {
      name: companyApolloData?.name || companyData?.name,
      employees: companyApolloData?.estimated_num_employees,
      industry: companyApolloData?.industry || companyData?.industry,
      keywords: companyApolloData?.keywords || [],
    },
    decisors,
    decisorsWithEmails: decisors,
    insights: decisors.length ? [`${decisors.length} decisores Apollo`] : ['Nenhum decisor Apollo. Use "Extrair Decisores (Apollo)" ou informe o Apollo Organization ID.'],
  };
}

export function DecisorsApolloTab({
  companyId,
  companyName,
  domain,
  apolloOrganizationId,
  apolloUrl,
  savedData,
  onDataChange,
}: DecisorsApolloTabProps) {
  const [data, setData] = useState<any>(() => savedData?.apollo ?? null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const result = await loadApolloDecisors(companyId);
      if (result) {
        setData(result);
        onDataChange?.({ ...savedData, apollo: result });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  const handleRefresh = async () => {
    if (!companyId) return;
    setRefreshing(true);
    await load();
    setRefreshing(false);
    sonnerToast.success('Dados Apollo recarregados');
  };

  const runApolloExtraction = async (apolloOrgId?: string) => {
    if (!companyId || !companyName) {
      sonnerToast.error('company_id e company_name são obrigatórios');
      return;
    }
    setExtracting(true);
    try {
      const input: EnrichmentInput = {
        company_id: companyId,
        company_name: companyName,
        domain: domain || undefined,
        apollo_org_id: apolloOrgId || (apolloOrganizationId ?? undefined),
        apollo_url: apolloUrl ?? undefined,
        force_refresh: !!apolloOrgId,
        modes: ['people', 'company'],
      };
      const result = await enrichCompany(supabase, input);
      if (result.reasonEmpty) {
        const msg: Record<string, string> = {
          org_not_found: 'Organização não encontrada no Apollo. Informe o Apollo Organization ID.',
          no_people_in_apollo: 'Organização encontrada, mas nenhuma pessoa listada.',
          apollo_key_missing: 'APOLLO_API_KEY não configurada no Supabase.',
        };
        sonnerToast.warning(msg[result.reasonEmpty] || result.message || 'Nenhum decisor retornado.');
      } else if (result.success) {
        sonnerToast.success(result.message ?? `${result.decisionMakersInserted ?? 0} decisores Apollo salvos`);
        await new Promise((r) => setTimeout(r, 1500));
        await load();
      } else {
        sonnerToast.error(result.error || 'Erro ao buscar decisores Apollo');
      }
    } catch (e: any) {
      sonnerToast.error(e?.message || 'Erro ao extrair decisores Apollo');
    } finally {
      setExtracting(false);
    }
  };

  const decisors = data?.decisors ?? [];
  const withEmail = decisors.filter((d: any) => d.email).length;
  const dmCount = decisors.filter((d: any) => d.buying_power === 'decision-maker').length;
  const infCount = decisors.filter((d: any) => d.buying_power === 'influencer').length;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">A</span>
            <div>
              <h4 className="font-semibold">Decisores Apollo</h4>
              <p className="text-xs text-muted-foreground">Apenas dados da Apollo.io — sem fallback</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
            <ApolloOrgIdDialog onEnrich={runApolloExtraction} disabled={extracting} />
            <Button onClick={() => runApolloExtraction()} disabled={extracting}>
              {extracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Extrair Decisores (Apollo)
            </Button>
          </div>
        </div>
      </Card>

      {extracting && (
        <Card className="p-6 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Buscando decisores na Apollo...</p>
        </Card>
      )}

      {!extracting && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase"> <Users className="h-4 w-4" /> Decisores </div>
              <div className="text-xl font-bold mt-1">{decisors.length}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase"> <Target className="h-4 w-4" /> Decision Makers </div>
              <div className="text-xl font-bold mt-1">{dmCount}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase"> <TrendingUp className="h-4 w-4" /> Influencers </div>
              <div className="text-xl font-bold mt-1">{infCount}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase"> <Mail className="h-4 w-4" /> Emails </div>
              <div className="text-xl font-bold mt-1">{withEmail}</div>
            </Card>
          </div>

          {decisors.length === 0 && !loading && (
            <Card className="p-8 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum decisor Apollo ainda.</p>
              <p className="text-sm mt-1">Clique em &quot;Extrair Decisores (Apollo)&quot; ou informe o Apollo Organization ID.</p>
            </Card>
          )}

          {decisors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Lista (Apollo)</h4>
              <div className="grid gap-2">
                {decisors.slice(0, 50).map((d: any) => (
                  <Card key={d.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {d.photo_url ? <img src={d.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="h-5 w-5 text-muted-foreground" /></div>}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{d.title}</p>
                        {(d.email || d.phone) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            {d.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {d.email}</span>}
                            {d.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {d.phone}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={d.buying_power === 'decision-maker' ? 'default' : 'secondary'}>{d.buying_power === 'decision-maker' ? 'DM' : d.buying_power === 'influencer' ? 'Inf' : 'User'}</Badge>
                      {d.linkedin_url && (
                        <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              {decisors.length > 50 && <p className="text-sm text-muted-foreground">Mostrando 50 de {decisors.length}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
