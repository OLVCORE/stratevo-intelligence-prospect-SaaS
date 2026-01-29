/**
 * Aba "Decisores" do dossiê: 3 fontes separadas (Apollo | LinkedIn | Lusha).
 * Um único botão "Extrair automaticamente" usa domínio + localização já cadastrados — sem colar URL/ID.
 */
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { enrichCompany } from '@/services/enrichment/EnrichmentOrchestrator';
import type { EnrichmentInput } from '@/types/enrichment';
import { DecisorsApolloTab } from './DecisorsApolloTab';
import { DecisorsLinkedInTab } from './DecisorsLinkedInTab';
import { DecisorsLushaTab } from './DecisorsLushaTab';

export interface DecisorsSectionTabProps {
  companyId?: string;
  companyName?: string;
  linkedinUrl?: string;
  domain?: string;
  apolloOrganizationId?: string | null;
  apolloUrl?: string | null;
  /** Cidade/estado/CEP/fantasia já cadastrados (usados na extração automática) */
  city?: string;
  state?: string;
  cep?: string;
  fantasia?: string;
  industry?: string;
  savedData?: any;
  stcHistoryId?: string;
  onDataChange?: (data: any) => void;
  onWebsiteDiscovered?: (website: string) => void;
}

const sharedProps = (p: DecisorsSectionTabProps) => ({
  companyId: p.companyId,
  companyName: p.companyName,
  linkedinUrl: p.linkedinUrl,
  domain: p.domain,
  apolloOrganizationId: p.apolloOrganizationId,
  apolloUrl: p.apolloUrl,
  savedData: p.savedData,
  onDataChange: p.onDataChange,
  onWebsiteDiscovered: p.onWebsiteDiscovered,
});

export function DecisorsSectionTab(props: DecisorsSectionTabProps) {
  const [extracting, setExtracting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [companyMeta, setCompanyMeta] = useState<{ city?: string; state?: string; cep?: string; fantasia?: string; industry?: string }>({});

  useEffect(() => {
    if (!props.companyId) return;
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('raw_data')
        .eq('id', props.companyId)
        .single();
      const raw = (data as any)?.raw_data;
      if (!raw) return;
      const addr = raw.address || raw.endereco || {};
      setCompanyMeta({
        city: raw.city || addr.city || addr.cidade || raw.municipio,
        state: raw.state || addr.state || raw.uf || addr.uf,
        cep: raw.cep || addr.cep,
        fantasia: raw.fantasia || raw.nome_fantasia,
        industry: raw.industry || raw.setor || raw.setor_amigavel,
      });
    })();
  }, [props.companyId]);

  const city = props.city ?? companyMeta.city;
  const state = props.state ?? companyMeta.state;
  const cep = props.cep ?? companyMeta.cep;
  const fantasia = props.fantasia ?? companyMeta.fantasia;
  const industry = props.industry ?? companyMeta.industry;

  const handleExtractAll = async () => {
    if (!props.companyId || !props.companyName) {
      toast.error('Faltam dados da empresa (ID ou nome).');
      return;
    }
    const domain = props.domain?.trim();
    if (!domain) {
      toast.error('Cadastre o site/domínio da empresa para extração automática.');
      return;
    }
    setExtracting(true);
    try {
      const input: EnrichmentInput = {
        company_id: props.companyId,
        company_name: props.companyName,
        domain,
        linkedin_url: props.linkedinUrl || undefined,
        city: city || undefined,
        state: state || undefined,
        cep: cep || undefined,
        fantasia: fantasia || undefined,
        industry: industry || undefined,
        force_refresh: forceRefresh,
      };
      const result = await enrichCompany(supabase, input);
      if (result.reasonEmpty) {
        const msg: Record<string, string> = {
          org_not_found: 'Organização não encontrada (domínio + localização). Verifique site e endereço da empresa.',
          no_people_in_apollo: 'Organização encontrada, mas nenhuma pessoa listada no Apollo.',
          apollo_key_missing: 'APOLLO_API_KEY não configurada no Supabase.',
          idempotency_skip: 'Já existem decisores salvos. Marque "Forçar nova extração" para buscar de novo.',
        };
        toast.warning(msg[result.reasonEmpty] || result.message || 'Nenhum decisor retornado.');
      } else if (result.success) {
        toast.success(result.message ?? `${result.decisionMakersInserted ?? 0} decisores salvos (Apollo + Lusha).`);
        // Pequeno atraso para a Edge Function persistir no banco antes de remontar as abas
        await new Promise((r) => setTimeout(r, 1500));
        setRefreshKey((k) => k + 1);
      } else {
        toast.error(result.error || 'Erro na extração.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao extrair decisores.');
    } finally {
      setExtracting(false);
    }
  };

  const domainOrWebsite = (props.domain || '').trim();

  return (
    <div className="space-y-4">
      {/* Um único botão: usa domínio + localização já cadastrados — sem colar URL/ID */}
      <Card className="p-4 border-primary/30 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Extrair decisores automaticamente</h3>
              <p className="text-sm text-muted-foreground">
                Usa o <strong>domínio</strong> e a <strong>localização</strong> já cadastrados (cidade, estado, CEP, fantasia) para buscar em Apollo e complementar com Lusha. Nada de colar URL ou ID.
              </p>
              {domainOrWebsite && (
                <p className="text-xs text-muted-foreground mt-1">
                  Domínio: <span className="font-mono">{domainOrWebsite}</span>
                  {city && state && (
                    <> · {city}/{state}</>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
              <Checkbox
                checked={forceRefresh}
                onCheckedChange={(v) => setForceRefresh(v === true)}
              />
              Forçar nova extração
            </label>
            <Button
              size="lg"
              onClick={handleExtractAll}
              disabled={extracting || !domainOrWebsite}
              className="gap-2"
            >
              {extracting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {extracting ? 'Buscando Apollo + Lusha...' : 'Extrair decisores'}
            </Button>
          </div>
        </div>
        {forceRefresh && (
          <p className="text-xs text-muted-foreground mt-2">
            Nova extração irá buscar novamente no Apollo mesmo que já existam decisores salvos.
          </p>
        )}
        {!domainOrWebsite && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            Cadastre o site/domínio da empresa no cadastro ou na aba Fit Produtos para habilitar a extração.
          </p>
        )}
      </Card>

      <Card className="p-4 bg-muted/30 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Decisores por fonte</h3>
            <p className="text-sm text-muted-foreground">
              Apollo · LinkedIn · Lusha — cada aba mostra apenas os contatos da respectiva fonte.
            </p>
          </div>
        </div>

        <Tabs defaultValue="apollo" className="w-full" key={refreshKey}>
          <TabsList className="grid w-full grid-cols-3 bg-background/80">
            <TabsTrigger value="apollo" className="gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">A</span>
              Decisores Apollo
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#0A66C2]/20 text-[#0A66C2]">in</span>
              Decisores LinkedIn
            </TabsTrigger>
            <TabsTrigger value="lusha" className="gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">L</span>
              Decisores Lusha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apollo" className="mt-4">
            <DecisorsApolloTab {...sharedProps(props)} />
          </TabsContent>
          <TabsContent value="linkedin" className="mt-4">
            <DecisorsLinkedInTab {...sharedProps(props)} />
          </TabsContent>
          <TabsContent value="lusha" className="mt-4">
            <DecisorsLushaTab {...sharedProps(props)} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
