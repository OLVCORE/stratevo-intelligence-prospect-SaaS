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
  city?: string; // 🎯 FILTRO INTELIGENTE: cidade da empresa
  state?: string; // 🎯 FILTRO INTELIGENTE: estado da empresa
  industry?: string; // 🎯 FILTRO INTELIGENTE: setor/CNAE
  cep?: string; // 🎯 FILTRO CEP: 98% precisão (único por empresa no Brasil!)
  fantasia?: string; // 🎯 FILTRO NOME FANTASIA: aumenta assertividade busca
}

// 🇧🇷 Classificar poder de decisão - HIERARQUIA BRASILEIRA
function classifyBuyingPower(title: string): 'decision-maker' | 'influencer' | 'user' {
  const titleLower = title.toLowerCase();
  
  // 1️⃣ DECISION MAKERS (Alta hierarquia - quem decide compras)
  if (
    // Presidência
    titleLower.includes('presidente') ||
    titleLower.includes('president') ||
    titleLower.includes('ceo') ||
    
    // Sócios e Proprietários
    titleLower.includes('sócio') ||
    titleLower.includes('socio') ||
    titleLower.includes('proprietário') ||
    titleLower.includes('dono') ||
    titleLower.includes('owner') ||
    titleLower.includes('founder') ||
    titleLower.includes('fundador') ||
    
    // Diretoria (TODOS os diretores são decision-makers no Brasil!)
    titleLower.includes('diretor') ||
    titleLower.includes('director') ||
    
    // Superintendência
    titleLower.includes('superintendente') ||
    titleLower.includes('superintendent') ||
    
    // C-Level (internacional)
    titleLower.includes('cfo') ||
    titleLower.includes('cto') ||
    titleLower.includes('coo') ||
    titleLower.includes('cmo') ||
    titleLower.includes('chief')
  ) {
    return 'decision-maker';
  }
  
  // 2️⃣ INFLUENCERS (Influenciam decisões)
  if (
    // Gerentes (especialmente Senior)
    titleLower.includes('gerente') ||
    titleLower.includes('manager') ||
    
    // VP
    titleLower.includes('vice') ||
    titleLower.includes('vp') ||
    
    // Coordenadores
    titleLower.includes('coordenador') ||
    titleLower.includes('coordinator') ||
    
    // Head Of
    titleLower.includes('head of') ||
    titleLower.includes('head ') ||
    titleLower.includes('líder')
  ) {
    return 'influencer';
  }
  
  // 3️⃣ USERS (Demais - Supervisores, Analistas, Assistentes)
  return 'user';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: EnrichApolloRequest = await req.json();
    
    console.log('[ENRICH-APOLLO] 📥 Request recebido:', {
      company_id: body.company_id,
      company_name: body.company_name,
      modes: body.modes
    });
    
    // 🔥 CRIAR CLIENTE SUPABASE (SEMPRE usar SERVICE_ROLE_KEY para evitar 401)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('[ENRICH-APOLLO] ❌ SERVICE_ROLE_KEY não configurada!');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration', details: 'SERVICE_ROLE_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[ENRICH-APOLLO] 🔑 Usando SERVICE_ROLE_KEY (evita 401)');
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    console.log('[ENRICH-APOLLO] ✅ Cliente Supabase inicializado');
    const companyId = body.company_id || body.companyId;
    const companyName = body.company_name || body.companyName;
    const { domain, positions, apollo_org_id, city, state, industry, cep, fantasia } = body;
    
    console.log('[ENRICH-APOLLO] 🎯 Filtros inteligentes:', { city, state, industry, cep, fantasia });

    console.log('[ENRICH-APOLLO-DECISORES] Buscando decisores para:', companyName);
    console.log('[ENRICH-APOLLO-DECISORES] Apollo Org ID fornecido:', apollo_org_id || 'N/A');

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // PASSO 1: Usar apollo_org_id se fornecido, senão buscar pelo nome
    let organizationId: string | null = apollo_org_id || null;
    
    if (!organizationId) {
      console.log('[ENRICH-APOLLO-DECISORES] Buscando Organization ID por nome...');
      
      // 🎯 ESTRATÉGIA REFINADA: Primeira palavra → Segunda palavra → Nome completo
      const words = (companyName || '').split(/\s+/).filter(w => w.length > 2);
      const firstWord = words[0];
      const secondWord = words[1];
      
      const namesToTry = [
        firstWord,           // ✅ PRIORIDADE 1: "CARBON13"
        secondWord,          // ✅ PRIORIDADE 2: "INDUSTRIA"
        companyName          // ✅ PRIORIDADE 3: Nome completo
      ].filter(Boolean);
      
      console.log('[ENRICH-APOLLO-DECISORES] 🎯 Estratégia de busca:', {
        original: companyName,
        tentativas: namesToTry,
        filtros: { city, state, domain, country: 'Brazil' }
      });
      
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
            console.log('[ENRICH-APOLLO-DECISORES] 🔍 Encontradas', orgData.organizations.length, 'empresas com nome', name);
            
            // 🎯 FILTRO INTELIGENTE REFINADO: Domain → Cidade → Estado → Brasil
            let selectedOrg = null;
            let criterio = '';
            
            // 🥇 EXCELENTE: Domain + Brasil (99% assertividade!)
            if (domain) {
              const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
              selectedOrg = orgData.organizations.find((org: any) => {
                const orgDomain = (org.primary_domain || org.website_url || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                return orgDomain === cleanDomain && (org.country === 'Brazil' || org.country === 'Brasil');
              });
              if (selectedOrg) criterio = `Domain ${cleanDomain} + Brasil (EXCELENTE ✅)`;
            }
            
            // 🥇+ EXCELENTE: CEP (98% assertividade - único no Brasil!)
            if (!selectedOrg && cep) {
              const cleanCEP = cep.replace(/\D/g, '');
              selectedOrg = orgData.organizations.find((org: any) => {
                const orgCEP = (org.postal_code || '').replace(/\D/g, '');
                return orgCEP === cleanCEP && (org.country === 'Brazil' || org.country === 'Brasil');
              });
              if (selectedOrg) criterio = `CEP ${cep} + Brasil (EXCELENTE ✅ 98%)`;
            }
            
            // 🥈+ MUITO BOM: Nome Fantasia + Cidade + Estado (97% assertividade)
            if (!selectedOrg && fantasia && city && state) {
              selectedOrg = orgData.organizations.find((org: any) => 
                org.name?.toLowerCase().includes(fantasia.toLowerCase()) &&
                org.city?.toLowerCase().includes(city.toLowerCase()) &&
                org.state?.toLowerCase() === state.toLowerCase() &&
                (org.country === 'Brazil' || org.country === 'Brasil')
              );
              if (selectedOrg) criterio = `Fantasia "${fantasia}" + ${city}/${state} + Brasil (MUITO BOM ✅ 97%)`;
            }
            
            // 🥈 MUITO BOM: Cidade + Estado + Brasil (95% assertividade)
            if (!selectedOrg && city && state) {
              selectedOrg = orgData.organizations.find((org: any) => 
                (org.country === 'Brazil' || org.country === 'Brasil') &&
                org.city?.toLowerCase().includes(city.toLowerCase()) &&
                org.state?.toLowerCase() === state.toLowerCase()
              );
              if (selectedOrg) criterio = `${city}/${state} + Brasil (MUITO BOM ✅)`;
            }
            
            // 🥉 BOM: Apenas Cidade + Brasil (80% assertividade)
            if (!selectedOrg && city) {
              selectedOrg = orgData.organizations.find((org: any) => 
                (org.country === 'Brazil' || org.country === 'Brasil') &&
                org.city?.toLowerCase().includes(city.toLowerCase())
              );
              if (selectedOrg) criterio = `Cidade ${city} + Brasil (BOM ✅)`;
            }
            
            // 🏅 RAZOÁVEL: Estado + Brasil (60% assertividade)
            if (!selectedOrg && state) {
              selectedOrg = orgData.organizations.find((org: any) => 
                (org.country === 'Brazil' || org.country === 'Brasil') &&
                org.state?.toLowerCase() === state.toLowerCase()
              );
              if (selectedOrg) criterio = `Estado ${state} + Brasil (RAZOÁVEL ⚠️)`;
            }
            
            // ⚠️ ARRISCADO: Qualquer do Brasil (.br domain)
            if (!selectedOrg) {
              selectedOrg = orgData.organizations.find((org: any) => 
                org.country === 'Brazil' || 
                org.country === 'Brasil' ||
                org.primary_domain?.includes('.br') ||
                org.website_url?.includes('.br')
              );
              if (selectedOrg) criterio = 'Brasil genérico (.br) (ARRISCADO ⚠️)';
            }
            
            // ❌ FALLBACK: Primeira da lista (pode estar errado!)
            if (!selectedOrg) {
              selectedOrg = orgData.organizations[0];
              criterio = 'Primeira da lista (FALLBACK - pode estar ERRADO! ❌)';
            }
            
            organizationId = selectedOrg.id;
            
            console.log('[ENRICH-APOLLO-DECISORES] ✅ Organização selecionada:', {
              id: organizationId,
              nome: selectedOrg.name,
              country: selectedOrg.country,
              city: selectedOrg.city,
              state: selectedOrg.state,
              employees: selectedOrg.estimated_num_employees,
              criterio
            });
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
    
    // PASSO 2: Buscar dados da ORGANIZAÇÃO primeiro (NOVO!)
    let organizationData: any = null;
    
    if (organizationId) {
      console.log('[ENRICH-APOLLO] 🏢 Buscando dados da organização...');
      
      const orgResponse = await fetch(
        `https://api.apollo.io/v1/organizations/${organizationId}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': apolloKey
          }
        }
      );

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        organizationData = orgData.organization;
        
        console.log('[ENRICH-APOLLO] ✅ Organização encontrada:', {
          name: organizationData?.name,
          industry: organizationData?.industry,
          keywords: organizationData?.keywords?.slice(0, 5),
          employees: organizationData?.estimated_num_employees
        });
      }
    }
    
    // PASSO 3: Buscar TODAS as pessoas da empresa (não filtrar por cargo)
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
        email: null, // ✅ NUNCA SALVAR EMAIL (economizar créditos!)
        email_status: null, // ✅ Email só via Reveal manual
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
          phone: d.phone || null, // ✅ CORRETO: "phone" (não "phone_number")
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

      // ✅ SALVAR DADOS DA ORGANIZAÇÃO + DECISORES
      const updateData: any = {
        raw_data: {
          ...existingRawData,
          enriched_apollo: true,
          apollo_decisores_count: decisores.length,
          // ✅ Lista simplificada de decisores para o componente acessar
          decision_makers: decisores.slice(0, 10).map(d => ({
            name: d.name,
            title: d.title,
            linkedin_url: d.linkedin_url,
            email: d.email,
            classification: d.buying_power,
            priority: d.buying_power === 'decision-maker' ? 1 : d.buying_power === 'influencer' ? 2 : 3
          })),
          // ✅ NOVO: Dados completos da organização
          apollo_organization: organizationData ? {
            id: organizationData.id,
            name: organizationData.name,
            industry: organizationData.industry,
            short_description: organizationData.short_description,
            keywords: organizationData.keywords || [],
            estimated_num_employees: organizationData.estimated_num_employees,
            website_url: organizationData.website_url,
            linkedin_url: organizationData.linkedin_url,
            twitter_url: organizationData.twitter_url,
            facebook_url: organizationData.facebook_url,
            technologies: organizationData.technologies || [],
            phone: organizationData.phone,
            sic_codes: organizationData.sic_codes || [],
            naics_codes: organizationData.naics_codes || [],
            retail_location_count: organizationData.retail_location_count,
            raw_location_count: organizationData.raw_location_count,
          } : null
        }
      };
      
      // ✅ ATUALIZAR CAMPOS DIRETOS (para aparecer no componente sem precisar acessar raw_data)
      if (organizationData?.industry) {
        updateData.industry = organizationData.industry;
      }
      
      if (organizationData?.linkedin_url) {
        updateData.linkedin_url = organizationData.linkedin_url;
      }
      
      if (organizationData?.short_description) {
        updateData.description = organizationData.short_description;
      }
      
      if (organizationData?.id) {
        updateData.apollo_id = organizationData.id;
      }
      
      // ✅ MARCAR COMO ENRIQUECIDO MANUALMENTE
      updateData.enrichment_source = 'manual';
      updateData.enriched_at = new Date().toISOString();

      console.log('[ENRICH-APOLLO] 💾 Salvando em companies:', {
        linkedin_url: updateData.linkedin_url || 'N/A',
        description: updateData.description ? 'SIM' : 'NÃO',
        apollo_id: updateData.apollo_id || 'N/A',
        decision_makers_count: updateData.raw_data.decision_makers?.length || 0
      });

      await supabaseClient
        .from('companies')
        .update(updateData)
        .eq('id', companyId);
      
      // ✅ ATUALIZAR TAMBÉM icp_analysis_results.raw_analysis (para o badge funcionar!)
      const { data: companyRecord } = await supabaseClient
        .from('companies')
        .select('cnpj, raw_data')
        .eq('id', companyId)
        .single();
      
      if (companyRecord?.cnpj) {
        await supabaseClient
          .from('icp_analysis_results')
          .update({
            raw_analysis: companyRecord.raw_data
          })
          .eq('cnpj', companyRecord.cnpj);
        
        console.log('[ENRICH-APOLLO] ✅ Badge atualizado em icp_analysis_results');
      }
      
      console.log('[ENRICH-APOLLO] ✅', decisores.length, 'decisores salvos em decision_makers');
    } else {
      console.log('[ENRICH-APOLLO] Nenhum decisor para salvar ou companyId não informado');
    }

    return new Response(
      JSON.stringify({
        success: true,
        decisores,
        decisores_salvos: decisores.length,
        organization: organizationData ? {
          name: organizationData.name,
          linkedin_url: organizationData.linkedin_url,
          description: organizationData.short_description,
          apollo_id: organizationData.id
        } : null,
        statistics: {
          total: decisores.length,
          decision_makers: decisionMakers.length,
          influencers: influencers.length,
          users: users.length
        },
        main_decision_maker: mainDecisionMaker || null,
        message: `${decisores.length} decisores encontrados e salvos`
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

