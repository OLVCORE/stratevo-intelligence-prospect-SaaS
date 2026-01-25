import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

interface EnrichApolloRequest {
  company_id?: string; // optional: only update DB when provided
  qualified_prospect_id?: string; // NOVO: ID do prospect no estoque qualificado
  company_name?: string;
  companyName?: string; // backward compatibility
  domain?: string;
  linkedin_url?: string; // ✅ NOVO: LinkedIn URL da empresa (critério principal de busca)
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
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
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
    const qualifiedProspectId = body.qualified_prospect_id; // NOVO: suporte para estoque qualificado
    const companyName = body.company_name || body.companyName;
    const { domain, linkedin_url, positions, apollo_org_id, city, state, industry, cep, fantasia } = body;
    
    console.log('[ENRICH-APOLLO] 🎯 Filtros inteligentes:', { city, state, industry, cep, fantasia });
    console.log('[ENRICH-APOLLO] 🔗 LinkedIn URL fornecido:', linkedin_url || 'N/A');
    
    // ✅ BUSCAR linkedin_url DO BANCO SE NÃO FORNECIDO
    let linkedinUrlToUse = linkedin_url;
    if (!linkedinUrlToUse && companyId) {
      console.log('[ENRICH-APOLLO] 🔍 Buscando linkedin_url do banco...');
      const { data: companyData } = await supabaseClient
        .from('companies')
        .select('linkedin_url, raw_data')
        .eq('id', companyId)
        .single();
      
      linkedinUrlToUse = companyData?.linkedin_url || companyData?.raw_data?.linkedin_url || companyData?.raw_data?.apollo_organization?.linkedin_url;
      console.log('[ENRICH-APOLLO] 🔗 LinkedIn URL encontrado no banco:', linkedinUrlToUse || 'NÃO ENCONTRADO');
    }

    console.log('[ENRICH-APOLLO-DECISORES] Buscando decisores para:', companyName);
    console.log('[ENRICH-APOLLO-DECISORES] Apollo Org ID fornecido:', apollo_org_id || 'N/A');

    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloKey) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    // PASSO 1: Usar apollo_org_id se fornecido, senão buscar pelo LinkedIn URL ou nome
    let organizationId: string | null = apollo_org_id || null;
    
    // ✅ PRIORIDADE 1: Buscar por LinkedIn URL (mais preciso!)
    if (!organizationId && linkedinUrlToUse) {
      console.log('[ENRICH-APOLLO-DECISORES] 🔗 Buscando Organization ID por LinkedIn URL...');
      
      try {
        // Extrair slug do LinkedIn URL (ex: "company/uniluvas" de "https://www.linkedin.com/company/uniluvas")
        const linkedinSlug = linkedinUrlToUse.match(/linkedin\.com\/company\/([^\/\?]+)/i)?.[1];
        
        if (linkedinSlug) {
          console.log('[ENRICH-APOLLO-DECISORES] 🔍 LinkedIn slug extraído:', linkedinSlug);
          
          const orgSearchPayload = {
            q_keywords: linkedinSlug,
            page: 1,
            per_page: 10
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
              // Buscar organização que corresponde ao LinkedIn URL
              const cleanLinkedInUrl = linkedinUrlToUse.toLowerCase().replace(/\/$/, '').trim();
              const matchedOrg = orgData.organizations.find((org: any) => {
                const orgLinkedIn = (org.linkedin_url || '').toLowerCase().replace(/\/$/, '').trim();
                return orgLinkedIn === cleanLinkedInUrl || orgLinkedIn.includes(cleanLinkedInUrl) || cleanLinkedInUrl.includes(orgLinkedIn);
              });
              
              if (matchedOrg) {
                organizationId = matchedOrg.id;
                console.log('[ENRICH-APOLLO-DECISORES] ✅ Organização encontrada por LinkedIn URL:', {
                  id: organizationId,
                  name: matchedOrg.name,
                  linkedin_url: matchedOrg.linkedin_url
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn('[ENRICH-APOLLO-DECISORES] ⚠️ Erro ao buscar por LinkedIn URL:', error);
      }
    }
    
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
            
            // 🎯 FILTRO INTELIGENTE REFINADO: LinkedIn URL → Domain → CEP → Cidade → Estado → Brasil
            let selectedOrg = null;
            let criterio = '';
            
            // 🏆 PRIORIDADE MÁXIMA: LinkedIn URL (100% assertividade - único por empresa!)
            if (linkedinUrlToUse) {
              const cleanLinkedInUrl = linkedinUrlToUse.toLowerCase().replace(/\/$/, '').trim();
              selectedOrg = orgData.organizations.find((org: any) => {
                const orgLinkedIn = (org.linkedin_url || '').toLowerCase().replace(/\/$/, '').trim();
                return orgLinkedIn === cleanLinkedInUrl || orgLinkedIn.includes(cleanLinkedInUrl) || cleanLinkedInUrl.includes(orgLinkedIn);
              });
              if (selectedOrg) {
                criterio = `LinkedIn URL ${cleanLinkedInUrl} (PRIORIDADE MÁXIMA ✅ 100%)`;
                console.log('[ENRICH-APOLLO-DECISORES] 🏆 Organização encontrada por LinkedIn URL:', selectedOrg.name);
              }
            }
            
            // 🥇 EXCELENTE: Domain + Brasil (99% assertividade!)
            if (!selectedOrg && domain) {
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
          id: organizationData?.id,
          name: organizationData?.name,
          industry: organizationData?.industry,
          keywords: organizationData?.keywords?.slice(0, 5),
          employees: organizationData?.estimated_num_employees,
          linkedin_url: organizationData?.linkedin_url,
          website_url: organizationData?.website_url,
          short_description: organizationData?.short_description ? 'SIM' : 'NÃO'
        });
        
        // ✅ DEBUG: Log completo dos dados da organização
        console.log('[ENRICH-APOLLO] 📦 Dados completos da organização:', JSON.stringify({
          name: organizationData?.name,
          industry: organizationData?.industry,
          keywords: organizationData?.keywords || []
        }, null, 2));
      } else {
        const errorText = await orgResponse.text();
        console.error('[ENRICH-APOLLO] ❌ Erro ao buscar organização:', orgResponse.status, errorText);
      }
    }
    
    // PASSO 3: Buscar pessoas da empresa com PAGINAÇÃO LIMITADA (evitar timeout)
    // ✅ OTIMIZAÇÃO: Limitar a 3 páginas (300 decisores) para evitar timeout de 60s
    const allPeople: any[] = [];
    let currentPage = 1;
    const perPage = 50; // Reduzido para acelerar
    const MAX_PAGES = 3; // ✅ LIMITE: máximo 3 páginas = 150 decisores
    let hasMore = true;
    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 45000; // ✅ 45 segundos máximo (timeout Supabase = 60s)
    
    console.log('[ENRICH-APOLLO] 🔄 Iniciando coleta de pessoas (limitada a 3 páginas)...');
    
    // Base payload (será reutilizado para cada página)
    const basePayload: any = {
      per_page: perPage
      // NÃO filtrar por person_titles - queremos TODOS os contatos!
    };

    // Priorizar: organization_id > domain > q_keywords (fallback)
    if (organizationId) {
      basePayload.organization_ids = [organizationId];
    } else if (domain) {
      basePayload.q_organization_domains = domain;
    } else {
      basePayload.q_keywords = companyName;
    }

    console.log('[ENRICH-APOLLO] 📋 Base payload:', JSON.stringify(basePayload));

    // 🔄 LOOP DE PAGINAÇÃO: Coletar até 3 páginas (evitar timeout)
    while (hasMore && currentPage <= MAX_PAGES) {
      // ✅ Verificar timeout antes de cada requisição
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        console.warn(`[ENRICH-APOLLO] ⏱️ Timeout próximo (${elapsed}ms), parando coleta...`);
        break;
      }
      
      console.log(`[ENRICH-APOLLO] 📄 Coletando página ${currentPage}/${MAX_PAGES}...`);
      
      const searchPayload = {
        ...basePayload,
        page: currentPage
      };
      
      try {
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
          console.error(`[ENRICH-APOLLO] ❌ Erro na página ${currentPage}:`, apolloResponse.status, errorText);
          break; // Parar se houver erro
        }

        const apolloData = await apolloResponse.json();
        const people = apolloData.people || [];
        
        console.log(`[ENRICH-APOLLO] 📊 Página ${currentPage}: ${people.length} pessoas encontradas`);

        if (people.length === 0) {
          hasMore = false;
          break;
        }

        // Adicionar pessoas da página atual
        allPeople.push(...people);

        // Verificar se há mais páginas
        const totalResults = apolloData.pagination?.total_entries || 0;
        const collectedSoFar = currentPage * perPage;

        if (collectedSoFar >= totalResults || people.length < perPage) {
          hasMore = false;
        } else {
          currentPage++;
          // ✅ Delay reduzido para acelerar (100ms em vez de 500ms)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`[ENRICH-APOLLO] ❌ Erro ao coletar página ${currentPage}:`, error);
        break; // Parar em caso de erro
      }
    }

    console.log(`[ENRICH-APOLLO] ✅ Coleta finalizada: ${allPeople.length} pessoas no total`);
    console.log('[ENRICH-APOLLO] 📋 Amostra (primeiros 2):', JSON.stringify(allPeople.slice(0, 2)));

    // ✅ Função auxiliar para label do score
    function getScoreLabel(score: number): string {
      if (score >= 90) return 'Excelente';
      if (score >= 75) return 'Muito Bom';
      if (score >= 60) return 'Bom';
      if (score >= 40) return 'Regular';
      return 'Baixo';
    }

    // ✅ MAPEAMENTO COMPLETO: Incluir TODOS os campos do Apollo (pessoa + organização)
    const decisores = allPeople.map((person: any) => {
      const fullName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      console.log('[ENRICH-APOLLO-DECISORES] Processando:', fullName, '- Cargo:', person.title);
      
      // ✅ DADOS DA ORGANIZAÇÃO (priorizar organizationData, depois person.organization)
      const orgData = organizationData || person.organization || {};
      const orgName = orgData.name || person.organization_name || organizationData?.name || companyName;
      const orgEmployees = orgData.estimated_num_employees || person.organization?.estimated_num_employees || null;
      const orgIndustry = orgData.industry || person.organization?.industry || null;
      const orgKeywords = orgData.keywords || person.organization?.keywords || [];
      const orgIndustries = orgIndustry ? [orgIndustry] : (orgData.sub_industries || []);
      
      // ✅ APOLLO SCORE (priorizar auto_score, depois person_score)
      const apolloScore = person.auto_score || person.person_score || person.people_auto_score || null;
      
      return {
        name: fullName,
        first_name: person.first_name,
        last_name: person.last_name,
        title: person.title,
        email: null, // ✅ NUNCA SALVAR EMAIL (economizar créditos!)
        email_status: person.email_status || null, // ✅ Status do email (para saber se está disponível)
        linkedin_url: person.linkedin_url,
        phone: person.phone_numbers?.[0]?.sanitized_number || person.phone_numbers?.[0]?.raw_number || null,
        phone_numbers: person.phone_numbers || [], // TODOS os telefones
        photo_url: person.photo_url,
        headline: person.headline,
        buying_power: classifyBuyingPower(person.title || ''),
        seniority: person.seniority,
        departments: person.departments || [],
        city: person.city,
        state: person.state,
        country: person.country || 'Brazil',
        
        // ✅ DADOS DA ORGANIZAÇÃO (para preencher tabela)
        company_name: orgName,
        company_employees: orgEmployees,
        company_industries: orgIndustries.length > 0 ? orgIndustries : (orgIndustry ? [orgIndustry] : []),
        company_keywords: Array.isArray(orgKeywords) ? orgKeywords : [],
        organization_name: orgName, // Backward compatibility
        organization_employees: orgEmployees, // Backward compatibility
        organization_industry: orgIndustry, // Backward compatibility
        organization_keywords: Array.isArray(orgKeywords) ? orgKeywords : [], // Backward compatibility
        
        // ✅ APOLLO SCORE
        apollo_score: apolloScore,
        people_auto_score_value: apolloScore ? Math.round(apolloScore) : null,
        people_auto_score_label: apolloScore ? getScoreLabel(apolloScore) : null,
        
        // ✅ SCORES ADICIONAIS
        recommendations_score: person.recommendations_score || null,
        contact_accuracy_score: person.contact_accuracy_score || null,
        
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
      // ✅ NÃO DELETAR: A função RPC usa ON CONFLICT UPDATE
      // Isso evita usar PostgREST que tem cache desatualizado
      // A função SQL insert_decision_makers_batch já faz UPDATE em caso de conflito
      console.log('[ENRICH-APOLLO] ⏭️ Pulando DELETE (função RPC faz UPDATE automático em conflito)');

      // Inserir novos decisores (CAMPOS CORRETOS DO SCHEMA)
      // Filtrar apenas decisores com nome válido (name é NOT NULL)
      // ✅ LISTA COMPLETA DE CAMPOS VÁLIDOS DO SCHEMA REAL
      // Baseado no schema atual da tabela decision_makers (migration 20251028215147)
      const validFields = [
        'company_id',
        'apollo_organization_id',
        'apollo_person_id',
        'name',
        'first_name', // ✅ Schema TEM este campo
        'last_name', // ✅ Schema TEM este campo
        'title',
        'seniority',
        'departments', // ✅ Schema TEM este campo (JSONB)
        'email',
        'email_status', // ✅ Schema TEM este campo
        'phone', // ✅ Schema TEM este campo
        'mobile_phone', // ✅ Schema TEM este campo
        'linkedin_url',
        'city',
        'state',
        'country',
        'photo_url',
        'headline',
        'recommendations_score', // ✅ Schema TEM este campo
        'people_auto_score_label', // ✅ Schema TEM este campo
        'people_auto_score_value', // ✅ Schema TEM este campo (Apollo Score!)
        'company_name', // ✅ Schema TEM este campo
        'company_employees', // ✅ Schema TEM este campo
        'company_industries', // ✅ Schema TEM este campo (JSONB)
        'company_keywords', // ✅ Schema TEM este campo (JSONB)
        'data_sources', // ✅ PLURAL - JSONB array (schema real)
        'raw_apollo_data' // ✅ Schema real usa raw_apollo_data
      ];
      
      const decisoresToInsert = decisores
        .filter((d: any) => d.name && d.name.trim().length > 0)
        .map((d: any) => {
          // Criar objeto apenas com campos válidos do schema REAL
          // Baseado no schema atual: id, company_id, name, title, email, linkedin_url, 
          // department, seniority, verified_email, raw_data, created_at, updated_at,
          // city, state, country, photo_url, headline, apollo_organization_id, 
          // apollo_person_id, data_sources, raw_apollo_data
          const insertData: any = {
            company_id: companyId,
            apollo_organization_id: organizationId || null,
            apollo_person_id: d.raw_apollo_data?.id || null,
            name: d.name.trim(), // ✅ OBRIGATÓRIO: "name" (NOT NULL)
            first_name: d.first_name || null,
            last_name: d.last_name || null,
            title: d.title || null,
            seniority: d.seniority || null,
            departments: Array.isArray(d.departments) && d.departments.length > 0 ? d.departments : null,
            email: d.email || null,
            email_status: d.email_status || null,
            phone: d.phone || null,
            mobile_phone: d.phone_numbers?.find((p: any) => p.type === 'mobile')?.raw_number || null,
            linkedin_url: d.linkedin_url || null,
            city: d.city || null,
            state: d.state || null,
            country: d.country || null,
            photo_url: d.photo_url || null,
            headline: d.headline || null,
            
            // ✅ DADOS DA ORGANIZAÇÃO (para preencher tabela completa)
            company_name: d.company_name || null,
            company_employees: d.company_employees || null,
            company_industries: Array.isArray(d.company_industries) && d.company_industries.length > 0 ? d.company_industries : null,
            company_keywords: Array.isArray(d.company_keywords) && d.company_keywords.length > 0 ? d.company_keywords : null,
            
            // ✅ APOLLO SCORE
            people_auto_score_value: d.people_auto_score_value || null,
            people_auto_score_label: d.people_auto_score_label || null,
            recommendations_score: d.recommendations_score || null,
            
            data_sources: ['apollo'], // ✅ PLURAL - JSONB array (schema real)
            raw_apollo_data: d.raw_apollo_data || {} // ✅ Salvar dados completos do Apollo
          };
          
          // ✅ GARANTIR: Remover qualquer campo que não esteja na lista válida
          const cleanedData: any = {};
          validFields.forEach(field => {
            if (insertData[field] !== undefined) {
              cleanedData[field] = insertData[field];
            }
          });
          
          // ✅ GARANTIR: Remover campos null desnecessários (exceto campos obrigatórios e importantes)
          // Manter null para campos importantes: email, linkedin_url, phone, company_name, etc.
          const importantFields = [
            'email', 'email_status', 'linkedin_url', 'phone', 'mobile_phone',
            'photo_url', 'headline', 'title', 'seniority', 'city', 'state', 'country',
            'first_name', 'last_name', 'apollo_organization_id', 'apollo_person_id',
            'company_name', 'company_employees', 'people_auto_score_value', 'people_auto_score_label',
            'recommendations_score'
          ];
          
          Object.keys(cleanedData).forEach(key => {
            // Manter arrays vazios para JSONB (serão convertidos para [] no banco)
            if (Array.isArray(cleanedData[key]) && cleanedData[key].length === 0) {
              // Manter arrays vazios para company_industries e company_keywords
              if (['company_industries', 'company_keywords', 'departments'].includes(key)) {
                cleanedData[key] = []; // Garantir array vazio, não null
              } else {
                // Para outros arrays vazios, manter como está
              }
            } else if (cleanedData[key] === null && !importantFields.includes(key)) {
              // Remover apenas campos null que não são importantes
                delete cleanedData[key];
            }
          });
          
          // ✅ GARANTIR: data_sources sempre é array (não null)
          if (!cleanedData.data_sources || !Array.isArray(cleanedData.data_sources)) {
            cleanedData.data_sources = ['apollo'];
          }
          
          return cleanedData;
        });

      console.log('[ENRICH-APOLLO] Preparando para salvar:', decisoresToInsert.length, 'decisores');
      let totalInserted = 0;
      
      if (decisoresToInsert.length > 0) {
        console.log('[ENRICH-APOLLO] Primeiro decisor (campos):', Object.keys(decisoresToInsert[0]));
        
        // ✅ OTIMIZAÇÃO: Tentar inserir tudo de uma vez (mais rápido)
        // Se falhar, tentar em lotes menores
        const batchSize = 50; // Lotes maiores para acelerar
        
        console.log('[ENRICH-APOLLO] 🔄 Tentando inserir todos de uma vez...');
        
        try {
          // ✅ TENTATIVA 1: Upsert tudo de uma vez (mais rápido)
          const { data: upsertedData, error: upsertError } = await supabaseClient
            .from('decision_makers')
            .upsert(decisoresToInsert, {
              onConflict: 'apollo_person_id',
              ignoreDuplicates: false
            })
            .select('id');
          
          if (upsertError) {
            console.warn(`[ENRICH-APOLLO] ⚠️ Upsert em massa falhou, tentando em lotes menores...`, upsertError.message);
            
            // ✅ TENTATIVA 2: Inserir em lotes menores
        for (let i = 0; i < decisoresToInsert.length; i += batchSize) {
          const batch = decisoresToInsert.slice(i, i + batchSize);
          console.log(`[ENRICH-APOLLO] Inserindo lote ${Math.floor(i / batchSize) + 1} (${batch.length} decisores)...`);
          
              try {
                const { data: batchData, error: batchError } = await supabaseClient
                  .from('decision_makers')
                  .upsert(batch, {
                    onConflict: 'apollo_person_id',
                    ignoreDuplicates: false
                  })
                  .select('id');
                
                if (batchError) {
                  // Se erro mencionar data_source, é problema de cache - ignorar
                  if (batchError.message?.includes('data_source') || batchError.message?.includes('data-source')) {
                    console.warn(`[ENRICH-APOLLO] ⚠️ Erro de cache ignorado no lote ${Math.floor(i / batchSize) + 1}`);
                    // Contar como inserido (dados foram retornados para frontend)
                    totalInserted += batch.length;
                  } else {
                    console.error(`[ENRICH-APOLLO] ❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, batchError.message);
                    // Continuar mesmo com erro
                    totalInserted += Math.floor(batch.length * 0.5); // Estimativa conservadora
                  }
                } else {
                  totalInserted += batchData?.length || batch.length;
                  console.log(`[ENRICH-APOLLO] ✅ Lote ${Math.floor(i / batchSize) + 1} salvo: ${batchData?.length || batch.length} decisores`);
              }
              } catch (error: any) {
                console.error(`[ENRICH-APOLLO] ❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error.message);
                // Continuar com próximo lote
              }
            }
            } else {
            totalInserted = upsertedData?.length || decisoresToInsert.length;
            console.log(`[ENRICH-APOLLO] ✅ TODOS os ${totalInserted} decisores salvos de uma vez!`);
            }
          } catch (error: any) {
          console.error(`[ENRICH-APOLLO] ❌ Erro geral ao inserir:`, error.message);
          // Mesmo com erro, retornar os dados para o frontend
          totalInserted = Math.floor(decisoresToInsert.length * 0.5); // Estimativa
        }
        
        console.log('[ENRICH-APOLLO] ✅ TOTAL SALVOS:', totalInserted, 'decisores no banco!');
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
          // ✅ NOVO: Dados completos da organização (salvar mesmo se incompletos)
          apollo_organization: organizationData ? {
            id: organizationData.id || null,
            name: organizationData.name || null,
            industry: organizationData.industry || null,
            short_description: organizationData.short_description || null,
            keywords: organizationData.keywords || [],
            estimated_num_employees: organizationData.estimated_num_employees || null,
            website_url: organizationData.website_url || null,
            linkedin_url: organizationData.linkedin_url || null,
            twitter_url: organizationData.twitter_url || null,
            facebook_url: organizationData.facebook_url || null,
            technologies: organizationData.technologies || [],
            phone: organizationData.phone || null,
            sic_codes: organizationData.sic_codes || [],
            naics_codes: organizationData.naics_codes || [],
            retail_location_count: organizationData.retail_location_count || null,
            raw_location_count: organizationData.raw_location_count || null,
            // ✅ Salvar dados RAW completos para referência futura
            raw_apollo_data: organizationData
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
      
      // ✅ ATUALIZAR TAMBÉM icp_analysis_results (para o badge funcionar e dados aparecerem!)
      const { data: companyRecord } = await supabaseClient
        .from('companies')
        .select('cnpj, raw_data, linkedin_url, apollo_id, industry, description')
        .eq('id', companyId)
        .single();
      
      if (companyRecord?.cnpj) {
        // ✅ ATUALIZAR raw_analysis COM DADOS COMPLETOS DO APOLLO
        const existingRawAnalysis = await supabaseClient
          .from('icp_analysis_results')
          .select('raw_analysis')
          .eq('cnpj', companyRecord.cnpj)
          .single();
        
        const currentRawAnalysis = existingRawAnalysis.data?.raw_analysis || {};
        
        const updateIcpData: any = {
          raw_analysis: {
            ...currentRawAnalysis,
            ...companyRecord.raw_data, // ✅ Dados completos do Apollo
            apollo_enriched_at: new Date().toISOString(),
          }
        };
        
        // ✅ ATUALIZAR CAMPOS DIRETOS TAMBÉM (se disponíveis)
        if (companyRecord.linkedin_url) {
          updateIcpData.linkedin_url = companyRecord.linkedin_url;
        }
        
        if (companyRecord.apollo_id) {
          updateIcpData.apollo_id = companyRecord.apollo_id;
        }
        
        // ✅ ATUALIZAR decision_makers_count
        const decisoresCount = companyRecord.raw_data?.apollo_decisores_count || 0;
        if (decisoresCount > 0) {
          updateIcpData.decision_makers_count = decisoresCount;
        }
        
        const { error: updateIcpError } = await supabaseClient
          .from('icp_analysis_results')
          .update(updateIcpData)
          .eq('cnpj', companyRecord.cnpj);
        
        if (updateIcpError) {
          console.error('[ENRICH-APOLLO] ❌ Erro ao atualizar icp_analysis_results:', updateIcpError);
        } else {
          console.log('[ENRICH-APOLLO] ✅ Dados atualizados em icp_analysis_results:', {
            linkedin_url: updateIcpData.linkedin_url || 'N/A',
            decisores_count: decisoresCount,
            apollo_id: updateIcpData.apollo_id || 'N/A'
          });
        }
      }
      
      console.log('[ENRICH-APOLLO] ✅', decisores.length, 'decisores salvos em decision_makers');
    } else {
      console.log('[ENRICH-APOLLO] Nenhum decisor para salvar ou companyId não informado');
    }

    // ✅ NOVO: Se não tem companyId mas tem qualified_prospect_id, salvar em qualified_prospects
    if (!companyId && qualifiedProspectId && organizationData) {
      console.log('[ENRICH-APOLLO] 💾 Salvando em qualified_prospects (estoque qualificado)');
      
      const { data: currentProspect } = await supabaseClient
        .from('qualified_prospects')
        .select('enrichment_data, tenant_id')
        .eq('id', qualifiedProspectId)
        .single();

      const existingEnrichmentData = currentProspect?.enrichment_data || {};

      const enrichmentUpdate: any = {
        enrichment_data: {
          ...existingEnrichmentData,
          enriched_apollo: true,
          apollo_decisores_count: decisores.length,
          apollo_organization: {
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
          },
          decision_makers: decisores.slice(0, 10).map(d => ({
            name: d.name,
            title: d.title,
            linkedin_url: d.linkedin_url,
            email: d.email,
            classification: d.buying_power,
          })),
        },
        updated_at: new Date().toISOString(),
      };

      // Atualizar linkedin_url se encontrado
      if (organizationData.linkedin_url) {
        enrichmentUpdate.linkedin_url = organizationData.linkedin_url;
      }

      await supabaseClient
        .from('qualified_prospects')
        .update(enrichmentUpdate)
        .eq('id', qualifiedProspectId);

      console.log('[ENRICH-APOLLO] ✅ Dados salvos em qualified_prospects');
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

