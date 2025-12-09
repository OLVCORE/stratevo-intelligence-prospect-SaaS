import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Interface para perfil de ICP
 */
export interface ICPProfile {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  setor_foco: string | null;
  nicho_foco: string | null;
  ativo: boolean;
  icp_principal: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

/**
 * Hook para buscar biblioteca completa de ICPs do tenant
 * MC1[data]: Somente leitura - lista todos os ICPs do tenant
 */
export function useICPLibrary() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ['icp-library', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        console.warn('MC1[data]: tenantId não disponível para biblioteca');
        return {
          data: [],
          activeICP: null,
        };
      }

      console.log(`MC1[data]: carregando biblioteca de ICPs para tenant ${tenantId}`);

      const { data, error } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('icp_principal', { ascending: false })
        .order('ativo', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('MC1[data]: erro ao carregar biblioteca de ICPs:', error);
        throw error;
      }

      const profiles: ICPProfile[] = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        tipo: p.tipo,
        setor_foco: p.setor_foco,
        nicho_foco: p.nicho_foco,
        ativo: p.ativo,
        icp_principal: p.icp_principal || p.is_main_icp || false,
        created_at: p.created_at,
        updated_at: p.updated_at,
        tenant_id: p.tenant_id,
      }));

      const activeICP = profiles.find(p => p.icp_principal || p.ativo) || profiles[0] || null;

      console.log(`MC1[data]: biblioteca carregada - ${profiles.length} ICPs encontrados, ICP ativo: ${activeICP?.nome || 'nenhum'}`);

      return {
        data: profiles,
        activeICP,
      };
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

