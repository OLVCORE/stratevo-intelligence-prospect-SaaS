import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// 🔥 TIPOS DE ROLE DO BANCO (app_role enum)
export type UserRole = 
  | 'admin' 
  | 'moderator' 
  | 'user'
  | 'sdr'
  | 'vendedor'
  | 'sales'
  | 'gerencia'
  | 'gestor'
  | 'direcao'
  | 'viewer';

export function useUserRole() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      if (error) {
        console.warn('[useUserRole] Erro ao buscar roles:', error);
        return []; // Retorna vazio em caso de erro (modo developer)
      }
      return data?.map(r => r.role as UserRole) || [];
    },
    enabled: !!session?.user?.id,
  });

  const isAdmin = roles?.includes('admin') || false;
  const isModerator = roles?.includes('moderator') || false;
  const isViewer = roles?.includes('viewer') || false;
  
  // 🔥 ROLES HIERÁRQUICOS (para relatórios ICP)
  const isSDR = roles?.some(r => r === 'sdr') || false;
  const isVendedor = roles?.some(r => r === 'vendedor' || r === 'sales') || false;
  const isGerente = roles?.some(r => r === 'gerencia' || r === 'gestor') || false;
  const isDirecao = roles?.some(r => r === 'direcao') || false;
  
  return {
    roles: roles || [],
    isAdmin,
    isModerator,
    isViewer,
    isSDR,
    isVendedor,
    isGerente,
    isDirecao,
    isLoading,
    userId: session?.user?.id,
  };
}
