import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useICPFlowMetrics() {
  const { session } = useAuth();
  const [data, setData] = useState({ quarentena: 0, pool: 0, ativas: 0, total: 0 });

  useEffect(() => {
    // ✅ Só buscar dados se houver sessão ativa
    if (!session?.user) {
      setData({ quarentena: 0, pool: 0, ativas: 0, total: 0 });
      return;
    }

    let mounted = true;
    
    const fetchMetrics = async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          supabase.from('icp_analysis_results').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
          supabase.from('leads_pool').select('id', { count: 'exact', head: true }),
          supabase.from('companies').select('id', { count: 'exact', head: true })
        ]);

        if (!mounted) return;

        // ✅ Silenciar erros relacionados a sessão/auth
        const errors = [r1.error, r2.error, r3.error].filter(Boolean);
        const hasAuthError = errors.some(e => 
          e?.message?.includes('JWT') || 
          e?.message?.includes('session') || 
          e?.message?.includes('auth')
        );

        if (hasAuthError) {
          return; // Silenciar erros de autenticação
        }

        const q = r1.count || 0;
        const p = r2.count || 0;
        const a = r3.count || 0;
        setData({ quarentena: q, pool: p, ativas: a, total: q + p + a });
      } catch (error: any) {
        // ✅ Silenciar erros quando não há sessão
        if (error?.message?.includes('JWT') || error?.message?.includes('session') || error?.message?.includes('auth')) {
          return;
        }
        console.error('[ICPFlowMetrics] Error:', error);
      }
    };

    fetchMetrics();

    return () => { mounted = false; };
  }, [session]);

  return { data };
}
