// supabase/functions/linkedin-scraper/index.ts
// Extrair leads de URL de busca do LinkedIn (API Voyager + PhantomBuster fallback)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  linkedin_account_id: string;
  search_url: string;
  campaign_id?: string;
  max_results?: number;
  use_phantombuster?: boolean; // Fallback para PhantomBuster se API falhar
}

interface LinkedInSearchResult {
  profileId: string;
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  profilePicture?: string;
  companyName?: string;
  connectionDegree: string;
  sharedConnections: number;
}

// Tentar extrair via API Voyager primeiro
async function extractViaVoyagerAPI(
  liAt: string,
  searchUrl: string,
  maxResults: number = 100
): Promise<LinkedInSearchResult[]> {
  const results: LinkedInSearchResult[] = [];
  let start = 0;
  const count = 25;

  try {
    const url = new URL(searchUrl);
    const keywords = url.searchParams.get('keywords') || '';
    const network = url.searchParams.get('network') || '["S","O"]';

    while (results.length < maxResults) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      const searchParams = new URLSearchParams({
        decorationId: 'com.linkedin.voyager.dash.deco.search.SearchClusterCollection-174',
        count: count.toString(),
        origin: 'FACETED_SEARCH',
        q: 'all',
        query: `(keywords:${encodeURIComponent(keywords)},flagshipSearchIntent:SEARCH_SRP,queryParameters:(network:List(${network}),resultType:List(PEOPLE)))`,
        start: start.toString(),
      });

      const response = await fetch(
        `https://www.linkedin.com/voyager/api/search/dash/clusters?${searchParams}`,
        {
          headers: {
            'Cookie': `li_at=${liAt}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.linkedin.normalized+json+2.1',
            'X-Li-Lang': 'pt_BR',
            'X-RestLi-Protocol-Version': '2.0.0',
            'Csrf-Token': 'ajax:0',
          },
        }
      );

      if (!response.ok) {
        console.error('Search failed:', response.status);
        break;
      }

      const data = await response.json();
      const profiles = data.included?.filter((item: any) => 
        item.$type === 'com.linkedin.voyager.dash.search.EntityResultViewModel' &&
        item.entityResult?.template === 'UNIVERSAL'
      ) || [];

      if (profiles.length === 0) break;

      for (const profile of profiles) {
        const entity = profile.entityResult;
        if (!entity) continue;

        const miniProfile = data.included?.find((item: any) =>
          item.$type === 'com.linkedin.voyager.identity.shared.MiniProfile' &&
          entity.navigationContext?.url?.includes(item.publicIdentifier)
        );

        if (miniProfile) {
          results.push({
            profileId: miniProfile.entityUrn?.split(':').pop() || '',
            publicIdentifier: miniProfile.publicIdentifier || '',
            firstName: miniProfile.firstName || '',
            lastName: miniProfile.lastName || '',
            headline: miniProfile.occupation || entity.primarySubtitle?.text || '',
            location: entity.secondarySubtitle?.text || '',
            profilePicture: miniProfile.picture?.rootUrl 
              ? `${miniProfile.picture.rootUrl}${miniProfile.picture.artifacts?.[0]?.fileIdentifyingUrlPathSegment || ''}`
              : undefined,
            companyName: entity.primarySubtitle?.text?.split(' at ')?.[1] || '',
            connectionDegree: entity.badgeData?.text || '2nd',
            sharedConnections: parseInt(entity.insightsResolutionResult?.text?.match(/\d+/)?.[0] || '0'),
          });
        }
      }

      start += count;
      if (start >= 1000) break;
    }
  } catch (error) {
    console.error('Error in Voyager API:', error);
  }

  return results.slice(0, maxResults);
}

// Fallback para PhantomBuster (reutiliza lógica do collect-linkedin-leads)
async function extractViaPhantomBuster(
  searchUrl: string,
  maxResults: number
): Promise<LinkedInSearchResult[]> {
  const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
  const phantomSessionCookie = Deno.env.get('PHANTOMBUSTER_SESSION_COOKIE');
  const phantomSearchAgentId = Deno.env.get('PHANTOM_LINKEDIN_SEARCH_AGENT_ID') || 
                                Deno.env.get('PHANTOMBUSTER_LINKEDIN_SEARCH_AGENT_ID');

  if (!phantomBusterKey || !phantomSessionCookie || !phantomSearchAgentId) {
    throw new Error('PhantomBuster não configurado');
  }

  // Lançar agent do PhantomBuster
  const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Phantombuster-Key': phantomBusterKey,
    },
    body: JSON.stringify({
      id: phantomSearchAgentId,
      argument: {
        sessionCookie: phantomSessionCookie,
        searchUrl: searchUrl,
        numberOfProfiles: maxResults,
      },
    }),
  });

  if (!launchResponse.ok) {
    throw new Error('Erro ao lançar PhantomBuster agent');
  }

  const launchData = await launchResponse.json();
  const containerId = launchData.containerId;

  // Polling para resultados (timeout 3 minutos)
  const startTime = Date.now();
  const timeout = 180000;

  while (Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const outputResponse = await fetch(
      `https://api.phantombuster.com/api/v2/containers/fetch-output?id=${containerId}`,
      {
        headers: {
          'X-Phantombuster-Key': phantomBusterKey,
        },
      }
    );

    const outputData = await outputResponse.json();
    
    if (outputData.output && outputData.output.length > 0) {
      // Converter formato PhantomBuster para formato padrão
      return outputData.output.map((profile: any) => ({
        profileId: profile.profileId || profile.entityUrn?.split(':').pop() || '',
        publicIdentifier: profile.publicIdentifier || profile.vanityName || '',
        firstName: profile.firstName || profile.first_name || '',
        lastName: profile.lastName || profile.last_name || '',
        headline: profile.headline || profile.occupation || '',
        location: profile.location || '',
        profilePicture: profile.profilePicture || profile.avatarUrl,
        companyName: profile.companyName || profile.company,
        connectionDegree: profile.connectionDegree || '2nd',
        sharedConnections: profile.sharedConnections || 0,
      }));
    }

    if (outputData.status === 'finished' && !outputData.output) {
      break;
    }
  }

  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ScrapeRequest = await req.json();
    const { linkedin_account_id, search_url, campaign_id, max_results = 100, use_phantombuster = false } = body;

    // Buscar conta LinkedIn
    const { data: account, error: accountError } = await supabaseClient
      .from('linkedin_accounts')
      .select('*')
      .eq('id', linkedin_account_id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Conta LinkedIn não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (account.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Conta LinkedIn não está ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let searchResults: LinkedInSearchResult[] = [];

    // Tentar API Voyager primeiro (se não forçado PhantomBuster)
    if (!use_phantombuster && account.li_at_cookie) {
      try {
        console.log('Tentando extrair via API Voyager...');
        searchResults = await extractViaVoyagerAPI(account.li_at_cookie, search_url, max_results);
      } catch (error) {
        console.error('Erro na API Voyager, tentando PhantomBuster...', error);
        use_phantombuster = true; // Fallback automático
      }
    }

    // Fallback para PhantomBuster
    if (use_phantombuster || searchResults.length === 0) {
      try {
        console.log('Extraindo via PhantomBuster...');
        searchResults = await extractViaPhantomBuster(search_url, max_results);
      } catch (error: any) {
        console.error('Erro no PhantomBuster:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao extrair leads',
            message: error.message,
            success: false,
            total_found: 0,
            imported: 0,
            skipped: 0
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Found ${searchResults.length} results`);

    // Salvar leads no banco
    let imported = 0;
    let skipped = 0;

    for (const result of searchResults) {
      try {
        const { error } = await supabaseClient
          .from('linkedin_leads')
          .upsert({
            tenant_id: account.tenant_id,
            campaign_id: campaign_id,
            linkedin_profile_id: result.profileId,
            linkedin_profile_url: `https://www.linkedin.com/in/${result.publicIdentifier}`,
            linkedin_public_id: result.publicIdentifier,
            first_name: result.firstName,
            last_name: result.lastName,
            full_name: `${result.firstName} ${result.lastName}`.trim(),
            headline: result.headline,
            location: result.location,
            avatar_url: result.profilePicture,
            company_name: result.companyName,
            connection_degree: result.connectionDegree,
            shared_connections: result.sharedConnections,
            invite_status: 'pending',
            raw_data: result,
          }, {
            onConflict: 'tenant_id,linkedin_profile_id',
            ignoreDuplicates: false,
          });

        if (!error) {
          imported++;
        } else {
          skipped++;
        }
      } catch (e) {
        console.error('Error inserting lead:', e);
        skipped++;
      }
    }

    // Atualizar estatísticas da campanha
    if (campaign_id) {
      await supabaseClient
        .from('linkedin_campaigns')
        .update({
          total_leads_imported: imported,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign_id);
    }

    // Atualizar última atividade da conta
    await supabaseClient
      .from('linkedin_accounts')
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', linkedin_account_id);

    return new Response(
      JSON.stringify({
        success: true,
        total_found: searchResults.length,
        imported,
        skipped,
        method: use_phantombuster ? 'phantombuster' : 'voyager_api',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in linkedin-scraper:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

