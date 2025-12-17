import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedPurchaseIntentAnalysis {
  overall_fit_score: number;
  product_fit_score: number;
  icp_fit_score: number;
  differential_fit_score: number;
  competitive_score: number;
  market_timing_score: number;
  similarity_to_customers_score: number;
  product_matches: Array<{
    prospect_product: string;
    tenant_product: string;
    match_type: string;
    confidence: number;
    reason: string;
  }>;
  icp_matches: {
    setor: boolean;
    nicho: boolean;
    cnae: boolean;
    porte: boolean;
    faturamento: boolean;
    funcionarios: boolean;
    localizacao: boolean;
  };
  differential_matches: Array<{
    diferencial: string;
    prospect_pain: string;
    confidence: number;
    reason: string;
  }>;
  competitive_analysis: {
    uses_competitor: boolean;
    competitor_name: string | null;
    uses_legacy: boolean;
    has_solution: boolean;
    migration_opportunity: boolean;
    greenfield_opportunity: boolean;
  };
  market_timing: {
    favorable_period: boolean;
    sector_growth: string;
    urgency_signals: string[];
    recommended_approach_timing: string;
  };
  similarity_to_customers: {
    similar_customers_count: number;
    average_similarity_score: number;
    similar_customers: Array<{
      customer_name: string;
      similarity_score: number;
      products_purchased: string[];
    }>;
  };
  recommended_grade: 'A+' | 'A' | 'B' | 'C';
  key_factors: string[];
  recommendations: string[];
  confidence: number;
}

interface EnhancedPurchaseIntentResponse {
  success: boolean;
  analysis: EnhancedPurchaseIntentAnalysis;
  context_data?: any;
  error?: string;
}

export function useEnhancedPurchaseIntent(
  prospectId: string | null | undefined,
  icpId?: string | null
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['enhanced-purchase-intent', prospectId, icpId],
    queryFn: async (): Promise<EnhancedPurchaseIntentAnalysis | null> => {
      if (!prospectId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar tenant_id do prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('qualified_prospects')
        .select('tenant_id, purchase_intent_analysis')
        .eq('id', prospectId)
        .single();

      if (prospectError || !prospect) {
        throw new Error('Prospect não encontrado');
      }

      // Se já tem análise recente (menos de 1 hora), retornar ela
      if (prospect.purchase_intent_analysis) {
        const analysis = prospect.purchase_intent_analysis as EnhancedPurchaseIntentAnalysis;
        return analysis;
      }

      // Se não tem análise, chamar Edge Function
      const { data, error } = await supabase.functions.invoke(
        'calculate-enhanced-purchase-intent',
        {
          body: {
            tenant_id: prospect.tenant_id,
            prospect_id: prospectId,
            icp_id: icpId || null
          }
        }
      );

      if (error) throw error;

      const response = data as EnhancedPurchaseIntentResponse;
      if (!response.success || !response.analysis) {
        throw new Error(response.error || 'Erro ao calcular Purchase Intent');
      }

      return response.analysis;
    },
    enabled: !!prospectId,
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
}

export function useRecalculatePurchaseIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      prospectId, 
      icpId 
    }: { 
      prospectId: string; 
      icpId?: string | null 
    }): Promise<EnhancedPurchaseIntentAnalysis> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar tenant_id do prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('qualified_prospects')
        .select('tenant_id')
        .eq('id', prospectId)
        .single();

      if (prospectError || !prospect) {
        throw new Error('Prospect não encontrado');
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke(
        'calculate-enhanced-purchase-intent',
        {
          body: {
            tenant_id: prospect.tenant_id,
            prospect_id: prospectId,
            icp_id: icpId || null
          }
        }
      );

      if (error) throw error;

      const response = data as EnhancedPurchaseIntentResponse;
      if (!response.success || !response.analysis) {
        throw new Error(response.error || 'Erro ao recalcular Purchase Intent');
      }

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['enhanced-purchase-intent', prospectId] });
      queryClient.invalidateQueries({ queryKey: ['qualified-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['approved-leads'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });

      return response.analysis;
    },
    onSuccess: () => {
      toast.success('Purchase Intent recalculado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao recalcular Purchase Intent: ${error.message}`);
    }
  });
}

