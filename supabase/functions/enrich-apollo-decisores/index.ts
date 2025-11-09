import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichApolloRequest {
  companyId?: string; // optional: only update DB when provided
  companyName: string;
  domain?: string;
  positions?: string[]; // optional: custom positions list
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
    const { companyId, companyName, domain, positions } = body;

    console.log('[ENRICH-APOLLO] Buscando decisores para:', companyName);

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // PASSO 1: Buscar a empresa pelo nome para obter o organization_id
    let organizationId: string | null = null;
    
    if (!domain) {
      // Apollo funciona melhor com "Primeira + Segunda palavra" (ex: "Ceramfix Indústria")
      const words = companyName.split(/\s+/);
      const firstTwo = words.slice(0, 2).join(' ');
      const firstOne = words[0];
      
      const namesToTry = [firstTwo, firstOne, companyName];
      
      console.log('[ENRICH-APOLLO] Tentando nomes:', namesToTry);
      
      for (const name of namesToTry) {
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
            console.log('[ENRICH-APOLLO] ✅ Organização encontrada:', organizationId, 'com nome:', name);
            break;
          }
        }
      }
      
      if (!organizationId) {
        console.warn('[ENRICH-APOLLO] ⚠️ Organização não encontrada, usando busca genérica');
      }
    }
    
    // PASSO 2: Buscar pessoas (decisores) na empresa
    const defaultPositions = [
      'CEO','CFO','CIO','CTO','COO','Diretor','Gerente','VP','Head','Presidente','Sócio','Owner','Coordenador'
    ];
    
    const searchPayload: any = {
      page: 1,
      per_page: 100,
      person_titles: positions && positions.length > 0 ? positions : defaultPositions
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

    console.log('[ENRICH-APOLLO] Pessoas encontradas:', apolloData.people?.length || 0);

    const decisores = (apolloData.people || []).map((person: any) => ({
      name: person.name || `${person.first_name} ${person.last_name}`,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      email: person.email,
      linkedin_url: person.linkedin_url,
      phone: person.phone_numbers?.[0]?.sanitized_number || null,
      buying_power: classifyBuyingPower(person.title || ''),
      seniority: person.seniority,
      departments: person.departments || [],
      city: person.city,
      state: person.state,
      country: person.country
    }));

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
      const decisoresToInsert = decisores.map((d: any) => ({
        company_id: companyId,
        full_name: d.name,
        position: d.title,
        email: d.email,
        phone: d.phone,
        linkedin_url: d.linkedin_url,
        seniority_level: d.seniority,
        data_source: 'apollo',
        department: d.departments?.[0] || null
      }));

      const { error: insertError } = await supabaseClient
        .from('decision_makers')
        .insert(decisoresToInsert);

      if (insertError) {
        console.error('[ENRICH-APOLLO] Erro ao salvar decisores:', insertError);
        throw insertError;
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

