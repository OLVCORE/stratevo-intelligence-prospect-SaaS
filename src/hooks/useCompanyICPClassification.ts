// src/hooks/useCompanyICPClassification.ts
// Hook para classificar empresa e calcular match com ICP

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { classifyCompanyByCNAE, classifyCompanyByMultipleCNAEs } from '@/services/companyClassifier';
import { calculateICPMatch } from '@/services/icpMatcher';
import { useTenant } from '@/contexts/TenantContext';

export function useClassifyCompany() {
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (companyId: string) => {
      // Buscar empresa
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, cnpj, company_name, raw_data, cnaes')
        .eq('id', companyId)
        .single();

      if (error || !company) {
        throw new Error('Empresa não encontrada');
      }

      // Extrair CNAEs do raw_data se disponível
      let cnaes: string[] = [];
      if (company.raw_data?.receita?.atividade_principal?.[0]?.code) {
        cnaes.push(company.raw_data.receita.atividade_principal[0].code);
      }
      if (company.raw_data?.receita?.atividades_secundarias) {
        cnaes.push(...company.raw_data.receita.atividades_secundarias.map((a: any) => a.code));
      }
      if (company.cnaes && Array.isArray(company.cnaes)) {
        cnaes = [...new Set([...cnaes, ...company.cnaes])];
      }

      // Classificar empresa
      const classification = await classifyCompanyByMultipleCNAEs(cnaes, company.company_name);

      // Atualizar empresa com classificação
      await supabase
        .from('companies')
        .update({
          sector_code: classification.sector_code,
          sector_name: classification.sector_name,
          niche_code: classification.niche_code,
          niche_name: classification.niche_name,
        })
        .eq('id', companyId);

      // Se tenant tem ICP configurado, calcular match
      if (tenant) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('icp_sectors, icp_niches, icp_cnaes')
          .eq('id', tenant.id)
          .single();

        if (tenantData && (tenantData.icp_sectors?.length > 0 || tenantData.icp_niches?.length > 0)) {
          const matchResult = calculateICPMatch(
            {
              sector_code: classification.sector_code,
              niche_code: classification.niche_code || undefined,
              cnaes: cnaes,
            },
            {
              sectors: tenantData.icp_sectors || [],
              niches: tenantData.icp_niches || [],
              cnaes: tenantData.icp_cnaes || [],
            }
          );

          // Atualizar empresa com score de match
          await supabase
            .from('companies')
            .update({
              icp_match_score: matchResult.score,
              icp_match_tier: matchResult.tier,
              icp_match_reasons: matchResult.reasons,
            })
            .eq('id', companyId);

          return {
            classification,
            matchResult,
          };
        }
      }

      return { classification };
    },
  });
}

