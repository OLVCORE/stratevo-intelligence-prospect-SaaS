/**
 * MC9 V2.2: Serviço de Importação via API Empresas Aqui
 * 
 * Chama Edge Function para buscar empresas via API e importar para prospecting_candidates
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  EmpresasAquiApiFilter,
  EmpresasAquiImportStats,
} from '@/types/prospecting';

/**
 * Importa empresas via API Empresas Aqui
 */
export async function importFromEmpresasAquiApi(params: {
  tenantId: string;
  icpId?: string;
  filters: EmpresasAquiApiFilter;
}): Promise<EmpresasAquiImportStats> {
  const { tenantId, icpId, filters } = params;

  console.log('[MC9-V2.2] 🚀 Chamando Edge Function mc9-empresas-aqui-import...', {
    tenantId,
    icpId,
    filters,
  });

  const { data, error } = await supabase.functions.invoke(
    'mc9-empresas-aqui-import',
    {
      body: {
        tenantId,
        icpId: icpId ?? null,
        filters,
      },
    }
  );

  if (error) {
    console.error('[MC9-V2.2] ❌ Erro ao importar via Empresas Aqui API:', error);
    throw new Error(`Falha ao importar empresas via Empresas Aqui: ${error.message}`);
  }

  if (!data) {
    console.error('[MC9-V2.2] ❌ Resposta inválida da Edge Function:', data);
    throw new Error('Resposta inválida da importação Empresas Aqui.');
  }

  console.log('[MC9-V2.2] ✅ Importação concluída:', data);
  return data as EmpresasAquiImportStats;
}

