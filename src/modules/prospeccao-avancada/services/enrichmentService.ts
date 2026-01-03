/**
 * Serviço de Enriquecimento de Empresas
 * 
 * Integra múltiplas APIs para enriquecer dados de empresas:
 * - EmpresaQui (fonte primária - empresas com CNPJ)
 * - ReceitaWS/BrasilAPI (dados cadastrais)
 * - Apollo (decisores)
 * - Hunter.io (e-mails)
 */

import { supabase } from '@/integrations/supabase/client';
import type { FiltrosBusca, EmpresaEnriquecida, ResponseBusca } from '../types';

// Re-exportar tipos para compatibilidade
export type { FiltrosBusca, EmpresaEnriquecida } from '../types';

/**
 * Busca e enriquece empresas baseado nos filtros
 */
export async function buscarDadosEmpresas(
  filtros: FiltrosBusca,
  tenantId: string
): Promise<ResponseBusca> {
  try {
    console.log('[EnrichmentService] 🚀 Chamando Edge Function com:', { filtros, tenantId });
    
    // Chamar Edge Function para buscar empresas
    const { data, error } = await supabase.functions.invoke('prospeccao-avancada-buscar', {
      body: {
        filtros,
        tenant_id: tenantId
      }
    });

    console.log('[EnrichmentService] 📥 Resposta da Edge Function:', { data, error });

    if (error) {
      console.error('[EnrichmentService] ❌ Erro ao buscar empresas:', error);
      throw error;
    }

    if (!data) {
      console.warn('[EnrichmentService] ⚠️ Resposta vazia da Edge Function');
      return {
        sucesso: false,
        empresas: [],
        total: 0,
        page: filtros.page || 1,
        pageSize: filtros.pageSize || 20,
        has_more: false,
        error: 'Resposta vazia da Edge Function',
      };
    }

    // Verificar se houve erro na resposta
    if (data.error_code) {
      console.error('[EnrichmentService] ❌ Edge Function retornou error_code:', data.error_code);
      
      // Mensagens amigáveis por error_code
      let mensagem = 'Erro desconhecido na busca';
      if (data.error_code === 'MISSING_EMPRESAQUI_API_KEY') {
        mensagem = 'EMPRESAQUI_API_KEY não configurada. Configure no Supabase Dashboard → Settings → Edge Functions → Secrets';
      }
      
      throw new Error(mensagem);
    }

    if (data.sucesso === false) {
      console.error('[EnrichmentService] ❌ Edge Function retornou sucesso=false:', data);
      throw new Error(data.error || data.detalhes || 'Busca falhou');
    }

    const response: ResponseBusca = {
      sucesso: data.sucesso ?? true,
      empresas: data.empresas || [],
      total: data.total || 0,
      page: data.page || filtros.page || 1,
      pageSize: data.pageSize || filtros.pageSize || 20,
      has_more: data.has_more || false,
      diagnostics: data.diagnostics,
    };
    
    console.log('[EnrichmentService] ✅ Empresas encontradas:', response.empresas.length, '| Total:', response.total);
    
    if (response.empresas.length === 0) {
      console.warn('[EnrichmentService] ⚠️ Nenhuma empresa retornada pela Edge Function');
      if (response.diagnostics) {
        console.warn('[EnrichmentService] 📊 Diagnostics:', response.diagnostics);
      }
    }
    
    return response;
  } catch (error) {
    console.error('[EnrichmentService] ❌ Erro ao buscar empresas:', error);
    throw error;
  }
}

/**
 * Salva empresas brutas no Supabase (com upsert/dedupe por CNPJ)
 */
export async function salvarEmpresasBrutas(
  empresas: EmpresaEnriquecida[],
  tenantId: string
): Promise<number[]> {
  try {
    const idsSalvos: number[] = [];
    
    // Processar em lotes para evitar timeout
    const BATCH_SIZE = 10;
    for (let i = 0; i < empresas.length; i += BATCH_SIZE) {
      const batch = empresas.slice(i, i + BATCH_SIZE);
      
      const empresasParaSalvar = batch.map(empresa => ({
        tenant_id: tenantId,
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
        cnpj: empresa.cnpj,
        endereco: empresa.endereco,
        cidade: empresa.cidade,
        uf: empresa.uf,
        cep: empresa.cep,
        site: empresa.site,
        linkedin: empresa.linkedin,
        decisores: empresa.decisores || [],
        emails: empresa.emails || [],
        telefones: empresa.telefones || [],
        faturamento_estimado: empresa.faturamento_estimado,
        funcionarios_estimados: empresa.funcionarios_estimados,
        capital_social: empresa.capital_social,
        segmento: empresa.segmento,
        porte: empresa.porte,
        localizacao: empresa.localizacao,
        status: 'raw'
      }));

      // Upsert: se já existir CNPJ para este tenant, atualizar; senão, inserir
      for (const empresa of empresasParaSalvar) {
        if (!empresa.cnpj) {
          // Sem CNPJ: sempre inserir
          const { data, error } = await supabase
            .from('prospects_raw')
            .insert(empresa)
            .select('id')
            .single();
          
          if (error && !error.message.includes('duplicate')) {
            console.error('[EnrichmentService] Erro ao salvar empresa:', error);
          } else if (data) {
            idsSalvos.push(data.id);
          }
        } else {
          // Com CNPJ: upsert
          const { data, error } = await supabase
            .from('prospects_raw')
            .upsert(empresa, {
              onConflict: 'tenant_id,cnpj',
              ignoreDuplicates: false,
            })
            .select('id')
            .single();
          
          if (error) {
            console.error('[EnrichmentService] Erro ao upsert empresa:', error);
          } else if (data) {
            idsSalvos.push(data.id);
          }
        }
      }
    }

    console.log('[EnrichmentService] ✅ Empresas salvas:', idsSalvos.length, '/', empresas.length);
    return idsSalvos;
  } catch (error) {
    console.error('[EnrichmentService] Erro ao salvar empresas:', error);
    throw error;
  }
}

/**
 * Filtra empresas sem fit (sem site, sem LinkedIn, sem decisores)
 */
export function filtrarEmpresasSemFit(empresas: EmpresaEnriquecida[]): EmpresaEnriquecida[] {
  return empresas.filter(empresa => {
    // Deve ter pelo menos: site OU LinkedIn OU decisores
    const temSite = !!empresa.site;
    const temLinkedIn = !!empresa.linkedin;
    const temDecisores = empresa.decisores && empresa.decisores.length > 0;

    return temSite || temLinkedIn || temDecisores;
  });
}

