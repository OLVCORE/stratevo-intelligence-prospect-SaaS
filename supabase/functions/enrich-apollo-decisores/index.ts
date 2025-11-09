import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichApolloRequest {
  company_id?: string; // optional: only update DB when provided
  company_name?: string;
  companyName?: string; // backward compatibility
  domain?: string;
  apollo_org_id?: string; // NOVO: Apollo Organization ID manual
  positions?: string[]; // optional: custom positions list
  modes?: string[]; // ['people', 'company']
}

// Classificar poder de decisão baseado no título
function classifyBuyingPower(title: string): 'decision-maker' | 'influencer' | 'user' {
  const titleLower = title.toLowerCase();
  
  // Decision makers (CEO, CFO, CIO, Diretores)
  if (
    titleLower.includes('ceo') ||
    titleLower.includes('cfo') ||
    titleLower.includes('cio') ||
    titleLower.includes('cto') ||
    titleLower.includes('presidente') ||
    titleLower.includes('diretor') ||
    titleLower.includes('sócio') ||
    titleLower.includes('owner') ||
    titleLower.includes('founder')
  ) {
    return 'decision-maker';
  }
  
  // Influencers (Gerentes, Coordenadores)
  if (
    titleLower.includes('gerente') ||
    titleLower.includes('coordenador') ||
    titleLower.includes('supervisor') ||
    titleLower.includes('manager') ||
    titleLower.includes('head')
  ) {
    return 'influencer';
  }
  
  // Users (demais)
  return 'user';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: EnrichApolloRequest = await req.json();
    const companyId = body.company_id || body.companyId;
    const companyName = body.company_name || body.companyName;
    const { domain, positions, apollo_org_id } = body;

    console.log('[ENRICH-APOLLO-DECISORES] Buscando decisores para:', companyName);
    console.log('[ENRICH-APOLLO-DECISORES] Apollo Org ID fornecido:', apollo_org_id || 'N/A');

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // PASSO 1: Usar apollo_org_id se fornecido, senão buscar pelo nome
    let organizationId: string | null = apollo_org_id || null;
    
    if (!organizationId && !domain) {
      console.log('[ENRICH-APOLLO-DECISORES] Buscando Organization ID por nome...');
      
      // Apollo funciona melhor com "Primeira + Segunda palavra"
      const words = (companyName || '').split(/\s+/);
      const firstTwo = words.slice(0, 2).join(' ');
      const firstOne = words[0];
      
      const namesToTry = [firstTwo, firstOne, companyName];
      
      console.log('[ENRICH-APOLLO-DECISORES] Tentando nomes:', namesToTry);
      
      for (const name of namesToTry) {
        if (!name) continue;
        
        const orgSearchPayload = {
          q_organization_name: name,
          page: 1,
          per_page: 5
        };
        
        const orgResponse = await fetch(
          'https://api.apollo.io/v1/organizations/search',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apolloKey
            },
            body: JSON.stringify(orgSearchPayload)
          }
        );
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          if (orgData.organizations && orgData.organizations.length > 0) {
            organizationId = orgData.organizations[0].id;
            console.log('[ENRICH-APOLLO-DECISORES] ✅ Organização encontrada:', organizationId, 'com nome:', name);
            break;
          }
        }
      }
      
      if (!organizationId) {
        console.warn('[ENRICH-APOLLO-DECISORES] ⚠️ Organização não encontrada pelo nome');
      }
    } else if (apollo_org_id) {
      console.log('[ENRICH-APOLLO-DECISORES] ✅ Usando Apollo Org ID fornecido:', apollo_org_id);
    }
    
    // PASSO 2: Buscar TODAS as pessoas da empresa (não filtrar por cargo)
    const searchPayload: any = {
      page: 1,
      per_page: 100
      // NÃO filtrar por person_titles - queremos TODOS os 24 decisores!
    };

    // Priorizar: organization_id > domain > q_keywords (fallback)
    if (organizationId) {
      searchPayload.organization_ids = [organizationId];
    } else if (domain) {
      searchPayload.q_organization_domains = domain;
    } else {
      searchPayload.q_keywords = companyName;
    }

    console.log('[ENRICH-APOLLO] Payload pessoas:', JSON.stringify(searchPayload));

    const apolloResponse = await fetch(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify(searchPayload)
      }
    );

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('[ENRICH-APOLLO] Apollo API error:', errorText);
      throw new Error(`Apollo API falhou: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();

    console.log('[ENRICH-APOLLO] ✅ Apollo retornou:', apolloData.people?.length || 0, 'pessoas');
    console.log('[ENRICH-APOLLO] Dados brutos:', JSON.stringify(apolloData.people?.slice(0, 2)));

    const decisores = (apolloData.people || []).map((person: any) => {
      const fullName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      console.log('[ENRICH-APOLLO-DECISORES] Processando:', fullName, '- Cargo:', person.title);
      
      return {
        name: fullName,
        first_name: person.first_name,
        last_name: person.last_name,
        title: person.title,
        email: person.email,
        email_status: person.email_status, // verified, guessed, unavailable
        linkedin_url: person.linkedin_url,
        phone: person.phone_numbers?.[0]?.sanitized_number || null,
        phone_numbers: person.phone_numbers || [], // TODOS os telefones
        photo_url: person.photo_url,
        headline: person.headline,
        buying_power: classifyBuyingPower(person.title || ''),
        seniority: person.seniority,
        departments: person.departments || [],
        city: person.city,
        state: person.state,
        country: person.country,
        organization_name: person.organization_name,
        raw_apollo_data: person // SALVAR TUDO do Apollo
      };
    });
    
    console.log('[ENRICH-APOLLO] Total mapeados:', decisores.length);

    // Separar por poder de decisão
    const decisionMakers = decisores.filter(d => d.buying_power === 'decision-maker');
    const influencers = decisores.filter(d => d.buying_power === 'influencer');
    const users = decisores.filter(d => d.buying_power === 'user');

    console.log('[ENRICH-APOLLO] Decision makers:', decisionMakers.length);
    console.log('[ENRICH-APOLLO] Influencers:', influencers.length);
    console.log('[ENRICH-APOLLO] Users:', users.length);

    // Identificar decision maker principal (CEO/CFO/CIO)
    const mainDecisionMaker = decisionMakers.find(d => 
      d.title?.toLowerCase().includes('ceo') ||
      d.title?.toLowerCase().includes('cfo') ||
      d.title?.toLowerCase().includes('cio')
    );

    // Salvar decisores na tabela decision_makers
    if (companyId && decisores.length > 0) {
      // Deletar decisores antigos do Apollo
      await supabaseClient
        .from('decision_makers')
        .delete()
        .eq('company_id', companyId)
        .eq('data_source', 'apollo');

      // Inserir novos decisores (CAMPOS CORRETOS DO SCHEMA)
      // Filtrar apenas decisores com nome válido (full_name é NOT NULL)
      const decisoresToInsert = decisores
        .filter((d: any) => d.name && d.name.trim().length > 0)
        .map((d: any) => ({
          company_id: companyId,
          full_name: d.name.trim(),
          position: d.title || null,
          email: d.email || null,
          phone: d.phone || null,
          linkedin_url: d.linkedin_url || null,
          seniority_level: d.seniority || null,
          data_source: 'apollo',
          // 100% DOS CAMPOS APOLLO
          photo_url: d.photo_url || null,
          city: d.city || null,
          state: d.state || null,
          country: d.country || null,
          email_status: d.email_status || null,
          headline: d.headline || null,
          raw_data: {
            apollo_id: d.raw_apollo_data?.id,
            employment_history: d.raw_apollo_data?.employment_history || [],
            phone_numbers: d.phone_numbers || [],
            departments: d.departments || [],
            subdepartments: d.raw_apollo_data?.subdepartments || [],
            email_status: d.email_status,
            organization_name: d.organization_name,
            organization_data: d.raw_apollo_data?.organization || {},
            linkedin_uid: d.raw_apollo_data?.organization?.linkedin_uid,
            sic_codes: d.raw_apollo_data?.organization?.sic_codes || [],
            naics_codes: d.raw_apollo_data?.organization?.naics_codes || []
          }
        }));

      console.log('[ENRICH-APOLLO] Preparando para salvar:', decisoresToInsert.length, 'decisores');
      console.log('[ENRICH-APOLLO] Primeiro decisor:', JSON.stringify(decisoresToInsert[0]));
      
      if (decisoresToInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabaseClient
          .from('decision_makers')
          .insert(decisoresToInsert)
          .select();

        if (insertError) {
          console.error('[ENRICH-APOLLO] ❌ Erro ao salvar decisores:', JSON.stringify(insertError));
          throw insertError;
        }
        
        console.log('[ENRICH-APOLLO] ✅ SALVOS:', inserted?.length || 0, 'decisores no banco!');
      } else {
        console.warn('[ENRICH-APOLLO] ⚠️ Nenhum decisor válido para salvar (todos sem nome)');
      }

      // Atualizar flag na empresa
      const { data: currentCompany } = await supabaseClient
        .from('companies')
        .select('raw_data')
        .eq('id', companyId)
        .single();

      const existingRawData = currentCompany?.raw_data || {};

      await supabaseClient
        .from('companies')
        .update({
          raw_data: {
            ...existingRawData,
            enriched_apollo: true,
            apollo_decisores_count: decisores.length
          }
        })
        .eq('id', companyId);
      
      console.log('[ENRICH-APOLLO] ✅', decisores.length, 'decisores salvos em decision_makers');
    } else {
      console.log('[ENRICH-APOLLO] Nenhum decisor para salvar ou companyId não informado');
    }

    return new Response(
      JSON.stringify({
        success: true,
        decisores,
        statistics: {
          total: decisores.length,
          decision_makers: decisionMakers.length,
          influencers: influencers.length,
          users: users.length
        },
        main_decision_maker: mainDecisionMaker || null,
        message: `${decisores.length} decisores encontrados`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[ENRICH-APOLLO] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao buscar decisores no Apollo'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

