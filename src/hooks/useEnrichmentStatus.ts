import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface EnrichmentStatus {
  companyId: string;
  companyName: string;
  hasReceitaWS: boolean;
  hasDecisionMakers: boolean;
  hasDigitalPresence: boolean;
  hasMaturityScore: boolean;
  hasFitScore: boolean;
  hasLegalData: boolean;
  hasInsights: boolean;
  completionPercentage: number;
  isFullyEnriched: boolean;
}

export function useEnrichmentStatus(companyId?: string) {
  return useQuery({
    queryKey: ['enrichment-status', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data: company, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          cnpj,
          raw_data,
          digital_maturity_score
        `)
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const [decisorsCountRes, digitalPresenceRes, insightsRes, legalDataRes] = await Promise.all([
        supabase.from('decision_makers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('digital_presence').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('insights').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('legal_data').select('id').eq('company_id', companyId).maybeSingle(),
      ]);

      // ✅ LÓGICA SIMPLIFICADA: Conta apenas enriquecimentos REAIS e ÚTEIS
      const rawData = (company.raw_data as any) || {};
      
      const status: EnrichmentStatus = {
        companyId: company.id,
        companyName: company.name,
        hasReceitaWS: !!(rawData?.enriched_receita && rawData?.receita),
        hasDecisionMakers: (decisorsCountRes.count || 0) > 0,
        hasDigitalPresence: !!(rawData?.digital_intelligence), // Digital Intelligence tab
        hasMaturityScore: !!company.digital_maturity_score,
        hasFitScore: false,
        hasLegalData: !!(rawData?.totvs_report), // TOTVS 9-tabs report
        hasInsights: (insightsRes.count || 0) > 0,
        completionPercentage: 0,
        isFullyEnriched: false,
      };

      // Calcula percentual de completude (APENAS 4 ITENS CRÍTICOS)
      const checks = [
        status.hasReceitaWS,        // 1. Dados Receita Federal (API Brasil/ReceitaWS)
        status.hasDecisionMakers,   // 2. Decisores Apollo
        status.hasDigitalPresence,  // 3. Digital Intelligence
        status.hasLegalData,        // 4. TOTVS Report (9 tabs)
      ];
      
      status.completionPercentage = Math.round(
        (checks.filter(Boolean).length / checks.length) * 100
      );
      
      status.isFullyEnriched = status.completionPercentage === 100;

      return status;
    },
    enabled: !!companyId,
    refetchInterval: 10000, // ✅ REVALIDA a cada 10 segundos
    staleTime: 5000, // ✅ Considera dados válidos por apenas 5 segundos
    refetchOnWindowFocus: true, // ✅ Revalida ao focar janela
  });
}

export function useAllEnrichmentStatus() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ['all-enrichment-status', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        console.warn('[useAllEnrichmentStatus] ⚠️ Tenant não disponível');
        return [];
      }

      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          cnpj,
          raw_data,
          digital_maturity_score
        `)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Buscar conjuntos de relacionamentos para todas as empresas (filtrando por tenant_id)
      const [decisorsListRes, digitalMaturityListRes, insightsListRes, legalDataListRes] = await Promise.all([
        supabase.from('decision_makers').select('company_id').eq('tenant_id', tenantId),
        supabase.from('digital_presence').select('company_id').eq('tenant_id', tenantId),
        supabase.from('insights').select('company_id').eq('tenant_id', tenantId),
        supabase.from('legal_data').select('company_id').eq('tenant_id', tenantId),
      ]);

      const decisorsSet = new Set((decisorsListRes.data || []).map((r: any) => r.company_id));
      const digitalMaturitySet = new Set((digitalMaturityListRes.data || []).map((r: any) => r.company_id));
      const insightsSet = new Set((insightsListRes.data || []).map((r: any) => r.company_id));
      const legalDataSet = new Set((legalDataListRes.data || []).map((r: any) => r.company_id));

      const statusList: EnrichmentStatus[] = companies.map(company => {
        // ✅ LÓGICA SIMPLIFICADA: Conta apenas enriquecimentos REAIS e ÚTEIS
        const rawData = (company.raw_data as any) || {};
        
        const status: EnrichmentStatus = {
          companyId: company.id,
          companyName: company.name,
          hasReceitaWS: !!(rawData?.enriched_receita && rawData?.receita),
          hasDecisionMakers: decisorsSet.has(company.id),
          hasDigitalPresence: !!(rawData?.digital_intelligence), // Digital Intelligence tab
          hasMaturityScore: !!company.digital_maturity_score,
          hasFitScore: false,
          hasLegalData: !!(rawData?.totvs_report), // TOTVS 9-tabs report
          hasInsights: insightsSet.has(company.id),
          completionPercentage: 0,
          isFullyEnriched: false,
        };

        // Calcula percentual de completude (APENAS 4 ITENS CRÍTICOS)
        const checks = [
          status.hasReceitaWS,        // 1. Dados Receita Federal (API Brasil/ReceitaWS)
          status.hasDecisionMakers,   // 2. Decisores Apollo
          status.hasDigitalPresence,  // 3. Digital Intelligence
          status.hasLegalData,        // 4. TOTVS Report (9 tabs)
        ];
        
        status.completionPercentage = Math.round(
          (checks.filter(Boolean).length / checks.length) * 100
        );
        
        status.isFullyEnriched = status.completionPercentage === 100;

        return status;
      });

      return statusList;
    },
    refetchInterval: false, // Desabilitado - use manual refetch quando necessário
    staleTime: 30000, // Considera dados válidos por 30 segundos
  });
}
