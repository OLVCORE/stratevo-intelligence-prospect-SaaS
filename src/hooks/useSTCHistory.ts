import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface STCHistoryRecord {
  id: string;
  company_id: string | null;
  company_name: string;
  cnpj: string | null;
  status: string;
  confidence: string;
  triple_matches: number;
  double_matches: number;
  single_matches: number;
  total_score: number;
  evidences: any[];
  sources_consulted: number;
  queries_executed: number;
  verification_duration_ms: number | null;
  full_report: any;
  created_at: string;
}

/**
 * Hook para buscar histórico completo de verificações STC de uma empresa
 */
export function useSTCHistory(companyId?: string, companyName?: string) {
  return useQuery({
    queryKey: ['stc-history', companyId, companyName],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (companyName) {
        query = query.eq('company_name', companyName);
      }

      const { data, error } = await query.limit(10);

      // Se tabela não existir, retornar vazio (não é crítico)
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('[STC History] Tabela stc_verification_history não existe (OK)');
          return [];
        }
        throw error;
      }
      return data as STCHistoryRecord[];
    },
    enabled: !!(companyId || companyName),
  });
}

/**
 * Hook para buscar o último relatório salvo (mais recente)
 */
export function useLatestSTCReport(companyId?: string, companyName?: string) {
  return useQuery({
    queryKey: ['stc-latest', companyId, companyName],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (companyName) {
        query = query.ilike('company_name', companyName);
      }

      const { data, error } = await query.single();

      // Se tabela não existir ou registro não encontrado, retornar null (não é crítico)
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('[STC Latest] Tabela/Registro não existe (OK)');
          return null;
        }
        throw error;
      }
      return data as STCHistoryRecord | null;
    },
    enabled: !!(companyId || companyName),
  });
}
