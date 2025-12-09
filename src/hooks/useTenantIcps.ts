import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface TenantIcp {
  id: string;
  nome: string;
  descricao?: string;
  icp_principal?: boolean;
  ativo?: boolean;
  tipo?: string;
  setor_foco?: string;
  created_at?: string;
  updated_at?: string;
}

export function useTenantIcps() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  const [icps, setIcps] = useState<TenantIcp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      setIcps([]);
      return;
    }

    const loadIcps = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Schema real: id, tenant_id, nome, descricao, tipo, setor_foco, ativo, icp_principal, prioridade, created_at, updated_at
        const { data, error: fetchError } = await supabase
          .from('icp_profiles_metadata' as any)
          .select('id, nome, descricao, icp_principal, ativo, tipo, setor_foco, created_at, updated_at')
          .eq('tenant_id', tenantId)
          .eq('ativo', true) // Apenas ICPs ativos
          .order('icp_principal', { ascending: false })
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error('[useTenantIcps] Erro ao carregar ICPs:', fetchError);
          throw fetchError;
        }

        // Normalizar dados (garantir que sempre tenha nome)
        const normalized = (data || []).map((row: any) => ({
          id: row.id,
          nome: row.nome || 'ICP sem nome',
          descricao: row.descricao || null,
          icp_principal: row.icp_principal === true,
          ativo: row.ativo !== false,
          tipo: row.tipo || 'core',
          setor_foco: row.setor_foco || null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        setIcps(normalized);
      } catch (err: any) {
        console.error('[useTenantIcps] Erro ao carregar ICPs:', err);
        setError(err);
        setIcps([]); // Retornar array vazio para não quebrar a tela
      } finally {
        setLoading(false);
      }
    };

    loadIcps();
  }, [tenantId]);

  return { icps, loading, error };
}

