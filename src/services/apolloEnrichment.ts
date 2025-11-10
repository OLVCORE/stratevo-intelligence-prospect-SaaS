// 🔥 APOLLO ENRICHMENT DIRETO (sem Edge Function, evita CORS 401)
import { supabase } from '@/integrations/supabase/client';

interface ApolloOrganizationData {
  id: string;
  name: string;
  industry?: string;
  keywords?: string[];
  estimated_num_employees?: number;
  founded_year?: number;
  short_description?: string;
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  technologies?: string[];
  phone?: string;
  sic_codes?: string[];
  naics_codes?: string[];
}

interface ApolloPersonData {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  headline?: string;
  email?: string | null;
  email_status?: string | null;
  photo_url?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization_name?: string;
  departments?: string[];
  seniority?: string;
  person_score?: number;
  phone_numbers?: any[];
}

export async function enrichCompanyWithApollo(
  companyId: string,
  companyName: string,
  domain?: string
): Promise<{ success: boolean; decisores?: any[]; error?: string }> {
  try {
    const apolloKey = import.meta.env.VITE_APOLLO_API_KEY;
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    console.log('[APOLLO-DIRECT] 🚀 Iniciando enrichment para:', companyName);

    // PASSO 1: Buscar Organization ID
    let organizationId: string | null = null;
    
    const words = companyName.split(/\s+/);
    const searchName = words.slice(0, 2).join(' ');
    
    console.log('[APOLLO-DIRECT] 🔍 Buscando org por nome:', searchName);
    
    const orgSearchResponse = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify({
        q_organization_name: searchName,
        per_page: 1,
      }),
    });

    if (orgSearchResponse.ok) {
      const orgSearchData = await orgSearchResponse.json();
      if (orgSearchData.organizations && orgSearchData.organizations.length > 0) {
        organizationId = orgSearchData.organizations[0].id;
        console.log('[APOLLO-DIRECT] ✅ Organization ID encontrado:', organizationId);
      }
    }

    if (!organizationId) {
      console.warn('[APOLLO-DIRECT] ⚠️ Organization ID não encontrado');
      return { success: false, error: 'Organization não encontrada no Apollo' };
    }

    // PASSO 2: Buscar dados da organização
    const orgResponse = await fetch(`https://api.apollo.io/v1/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloKey,
      },
    });

    let organizationData: ApolloOrganizationData | null = null;
    
    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      organizationData = orgData.organization;
      
      console.log('[APOLLO-DIRECT] ✅ Dados da organização:', {
        name: organizationData?.name,
        industry: organizationData?.industry,
        keywords: organizationData?.keywords?.slice(0, 3),
        employees: organizationData?.estimated_num_employees,
        founded_year: organizationData?.founded_year
      });
    }

    // PASSO 3: Buscar pessoas da organização
    const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify({
        organization_ids: [organizationId],
        per_page: 100,
        page: 1,
      }),
    });

    const decisores: any[] = [];

    if (peopleResponse.ok) {
      const peopleData = await peopleResponse.json();
      const people = peopleData.people || [];
      
      console.log('[APOLLO-DIRECT] ✅', people.length, 'pessoas encontradas');

      // Salvar cada decisor
      for (const person of people) {
        const decisor = {
          company_id: companyId,
          full_name: person.name,
          name: person.name,
          position: person.title,
          title: person.title,
          headline: person.headline,
          email: null, // ❌ NUNCA salvar email automaticamente
          email_status: null,
          phone: null,
          linkedin_url: person.linkedin_url,
          city: person.city,
          state: person.state,
          country: person.country || 'Brazil',
          photo_url: person.photo_url,
          department: person.departments?.[0] || null,
          seniority_level: person.seniority,
          buying_power: 'user',
          raw_data: {
            apollo_id: person.id,
            organization_name: person.organization_name || organizationData?.name,
            headline: person.headline,
            apollo_score: person.person_score,
            departments: person.departments || [],
            phone_numbers: person.phone_numbers || [],
            email_status: person.email_status,
            sic_codes: person.organization?.sic_codes || [],
            naics_codes: person.organization?.naics_codes || [],
          },
        };

        decisores.push(decisor);

        // Inserir ou atualizar
        await supabase
          .from('decision_makers')
          .upsert(decisor, {
            onConflict: 'company_id,full_name',
          });
      }
    }

    // PASSO 4: Salvar dados da organização na tabela companies
    if (organizationData && companyId) {
      const { data: currentCompany } = await supabase
        .from('companies')
        .select('raw_data')
        .eq('id', companyId)
        .single();

      const existingRawData = currentCompany?.raw_data || {};

      const updateData: any = {
        raw_data: {
          ...existingRawData,
          enriched_apollo: true,
          apollo_decisores_count: decisores.length,
          apollo_organization: {
            id: organizationData.id,
            name: organizationData.name,
            industry: organizationData.industry,
            keywords: organizationData.keywords || [],
            estimated_num_employees: organizationData.estimated_num_employees,
            founded_year: organizationData.founded_year,
            short_description: organizationData.short_description,
            website_url: organizationData.website_url,
            linkedin_url: organizationData.linkedin_url,
            twitter_url: organizationData.twitter_url,
            facebook_url: organizationData.facebook_url,
            technologies: organizationData.technologies || [],
            phone: organizationData.phone,
            sic_codes: organizationData.sic_codes || [],
            naics_codes: organizationData.naics_codes || [],
          },
        },
      };

      if (organizationData.industry) {
        updateData.industry = organizationData.industry;
      }

      await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      console.log('[APOLLO-DIRECT] ✅ Dados da organização salvos em companies');
    }

    return {
      success: true,
      decisores,
    };
  } catch (error: any) {
    console.error('[APOLLO-DIRECT] ❌ Erro:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

