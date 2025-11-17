/**
 * ✅ SERVIÇO DE BUSCA POR SÓCIO
 * Busca empresas através do nome ou CPF do sócio
 * Usa dados já cadastrados na base (QSA - Quadro Societário)
 */

import { supabase } from '@/integrations/supabase/client';
import { consultarReceitaFederal } from './receitaFederal';
import { toast } from 'sonner';

export interface PartnerSearchParams {
  partnerName?: string;
  cpf?: string;
  searchType: 'exato' | 'semelhante';
  entityType: 'fisica' | 'juridica';
  qualification?: string;
  situation?: string;
  uf?: string;
}

export interface CompanyResult {
  cnpj: string;
  company_name: string;
  fantasy_name?: string;
  city?: string;
  state?: string;
  cnae?: string;
  phone?: string;
  email?: string;
  debts?: string;
  regime?: string;
  porte?: string;
  situation?: string;
  partner_name: string;
  partner_qualification: string;
  raw_data?: any;
}

/**
 * Busca empresas por sócio na nossa base de dados
 */
export async function searchCompaniesByPartner(params: PartnerSearchParams): Promise<{
  success: boolean;
  companies: CompanyResult[];
  error?: string;
}> {
  try {
    const { partnerName, cpf, searchType, qualification, situation, uf } = params;

    if (!partnerName && !cpf) {
      return {
        success: false,
        companies: [],
        error: 'Preencha pelo menos o nome ou CPF do sócio'
      };
    }

    // ✅ BUSCAR NA NOSSA BASE DE DADOS (QSA já cadastrado)
    // Buscar todas as empresas que têm raw_data e depois filtrar no código
    // (mais eficiente do que tentar buscar diretamente no JSONB complexo)
    let query = supabase
      .from('companies')
      .select('id, cnpj, company_name, fantasy_name, city, state, raw_data, industry')
      .not('raw_data', 'is', null)
      .limit(1000); // Limite maior para ter mais resultados

    // Se tiver nome, buscar por texto parcial no JSONB (mais simples)
    if (partnerName) {
      // Busca parcial usando ilike no texto do JSONB
      query = query.ilike('raw_data::text', `%${partnerName.trim()}%`);
    }

    const { data: companies, error } = await query;

    if (error) {
      console.error('[PartnerSearch] Erro ao buscar na base:', error);
      return {
        success: false,
        companies: [],
        error: error.message
      };
    }

    if (!companies || companies.length === 0) {
      return {
        success: true,
        companies: []
      };
    }

    // ✅ FILTRAR E PROCESSAR RESULTADOS
    const results: CompanyResult[] = [];

    for (const company of companies) {
      const rawData = company.raw_data || {};
      const receitaFederal = rawData.receita_federal || {};
      const qsa = receitaFederal.qsa || receitaFederal.socios_administradores || rawData.qsa || [];

      // Processar QSA (pode ser array ou objeto)
      const partners = Array.isArray(qsa) ? qsa : Object.values(qsa);
      
      for (const partner of partners) {
        const partnerObj = typeof partner === 'string' 
          ? { nome: partner, qual: '' }
          : partner;
        
        const partnerNome = partnerObj.nome || partnerObj.name || '';
        const partnerQual = partnerObj.qual || partnerObj.qualification || partnerObj.qualificacao || '';

        // Verificar match no nome
        let nameMatch = false;
        if (partnerName) {
          if (searchType === 'exato') {
            nameMatch = partnerNome.trim().toLowerCase() === partnerName.trim().toLowerCase();
          } else {
            nameMatch = partnerNome.toLowerCase().includes(partnerName.trim().toLowerCase());
          }
        }

        // Verificar CPF parcial (6 dígitos do meio)
        let cpfMatch = true;
        if (cpf) {
          const partnerCpf = partnerObj.cpf || '';
          cpfMatch = partnerCpf.includes(cpf.replace(/[^\d]/g, ''));
        }

        // Aplicar filtros
        let qualificationMatch = true;
        if (qualification && qualification !== 'TODAS') {
          qualificationMatch = partnerQual.toUpperCase().includes(qualification.toUpperCase());
        }

        let situationMatch = true;
        if (situation && situation !== 'TODAS') {
          const companySituation = receitaFederal.situacao || receitaFederal.status || '';
          if (situation === 'ATIVAS') {
            situationMatch = companySituation?.toUpperCase().includes('ATIVA');
          } else if (situation === 'BAIXADAS') {
            situationMatch = companySituation?.toUpperCase().includes('BAIXA');
          } else if (situation === 'SUSPENSAS') {
            situationMatch = companySituation?.toUpperCase().includes('SUSPENSA');
          }
        }

        let ufMatch = true;
        if (uf && uf !== 'TODOS') {
          const companyUf = receitaFederal.uf || company.state || '';
          ufMatch = companyUf.toUpperCase() === uf.toUpperCase();
        }

        // Se todos os critérios passaram, adicionar resultado
        if ((partnerName ? nameMatch : true) && cpfMatch && qualificationMatch && situationMatch && ufMatch) {
          results.push({
            cnpj: company.cnpj || '',
            company_name: company.company_name || company.fantasy_name || '',
            fantasy_name: company.fantasy_name || receitaFederal.fantasia || '',
            city: receitaFederal.municipio || company.city || '',
            state: receitaFederal.uf || company.state || '',
            cnae: receitaFederal.atividade_principal?.[0]?.text || '',
            phone: receitaFederal.telefone || '',
            email: receitaFederal.email || '',
            debts: rawData.debts || '',
            regime: rawData.regime || receitaFederal.regime || '',
            porte: receitaFederal.porte || rawData.porte || '',
            situation: receitaFederal.situacao || receitaFederal.status || '',
            partner_name: partnerNome,
            partner_qualification: partnerQual,
            raw_data: {
              ...rawData,
              receita_federal: receitaFederal
            }
          });

          // Evitar duplicatas (mesmo CNPJ + mesmo sócio)
          break;
        }
      }
    }

    // Remover duplicatas baseado em CNPJ
    const uniqueResults = results.filter((company, index, self) =>
      index === self.findIndex((c) => c.cnpj === company.cnpj)
    );

    return {
      success: true,
      companies: uniqueResults
    };

  } catch (error: any) {
    console.error('[PartnerSearch] Erro:', error);
    return {
      success: false,
      companies: [],
      error: error.message || 'Erro ao buscar empresas por sócio'
    };
  }
}

/**
 * Busca empresas por sócio usando Edge Function (para APIs externas futuras)
 */
export async function searchCompaniesByPartnerExternal(params: PartnerSearchParams): Promise<{
  success: boolean;
  companies: CompanyResult[];
  error?: string;
}> {
  try {
    // ✅ CHAMAR EDGE FUNCTION (se implementada no futuro)
    const { data, error } = await supabase.functions.invoke('search-companies-by-partner', {
      body: params
    });

    if (error) throw error;

    return {
      success: true,
      companies: data?.companies || []
    };

  } catch (error: any) {
    console.error('[PartnerSearch] Erro na busca externa:', error);
    return {
      success: false,
      companies: [],
      error: error.message || 'Erro ao buscar empresas externamente'
    };
  }
}

