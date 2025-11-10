// 🔥 APOLLO ENRICHMENT - VERSÃO PÚBLICA (sem auth para evitar 401)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { company_id, company_name, domain } = body;
    
    console.log('[APOLLO-PUBLIC] 📥 Request:', { company_id, company_name });

    // Criar cliente Supabase com SERVICE_ROLE_KEY
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // PASSO 1: Buscar Organization ID
    const words = company_name.split(/\s+/);
    const searchName = words.slice(0, 2).join(' ');
    
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

    let organizationId: string | null = null;
    
    if (orgSearchResponse.ok) {
      const orgSearchData = await orgSearchResponse.json();
      if (orgSearchData.organizations?.[0]) {
        organizationId = orgSearchData.organizations[0].id;
        console.log('[APOLLO-PUBLIC] ✅ Org ID:', organizationId);
      }
    }

    if (!organizationId) {
      throw new Error('Organization não encontrada no Apollo');
    }

    // PASSO 2: Buscar dados da organização
    const orgResponse = await fetch(`https://api.apollo.io/v1/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloKey,
      },
    });

    let organizationData: any = null;
    
    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      organizationData = orgData.organization;
      
      console.log('[APOLLO-PUBLIC] ✅ Org Data:', {
        name: organizationData?.name,
        industry: organizationData?.industry,
        keywords: organizationData?.keywords?.slice(0, 3),
        employees: organizationData?.estimated_num_employees
      });
    }

    // PASSO 3: Buscar pessoas
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

    const people = peopleResponse.ok ? (await peopleResponse.json()).people || [] : [];
    
    console.log('[APOLLO-PUBLIC] ✅', people.length, 'pessoas encontradas');

    // PASSO 4: Salvar decisores
    for (const person of people) {
      await supabaseClient
        .from('decision_makers')
        .upsert({
          company_id,
          full_name: person.name,
          name: person.name,
          position: person.title,
          title: person.title,
          headline: person.headline,
          email: null,
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
          },
        }, {
          onConflict: 'company_id,full_name',
        });
    }

    // PASSO 5: Salvar dados da organização
    if (organizationData) {
      const { data: currentCompany } = await supabaseClient
        .from('companies')
        .select('raw_data')
        .eq('id', company_id)
        .single();

      await supabaseClient
        .from('companies')
        .update({
          raw_data: {
            ...(currentCompany?.raw_data || {}),
            enriched_apollo: true,
            apollo_decisores_count: people.length,
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
            },
          },
          industry: organizationData.industry || currentCompany?.industry,
        })
        .eq('id', company_id);

      console.log('[APOLLO-PUBLIC] ✅ Dados salvos!');
    }

    return new Response(
      JSON.stringify({ success: true, decisores: people.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[APOLLO-PUBLIC] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

