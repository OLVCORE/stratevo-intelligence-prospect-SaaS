// 🚀 PHANTOMBUSTER - SCRAPING COMPLETO DE EMPRESA NO LINKEDIN
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyRequest {
  linkedinCompanyUrl: string;
  includeEmployees?: boolean;
  includePosts?: boolean;
  maxPosts?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: CompanyRequest = await req.json();
    const { linkedinCompanyUrl, includeEmployees = true, includePosts = true, maxPosts = 20 } = body;

    console.log('[PHANTOM-COMPANY] 🏢 Scraping:', linkedinCompanyUrl);

    const phantomApiKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    const linkedinSessionCookie = Deno.env.get('LINKEDIN_SESSION_COOKIE');

    if (!phantomApiKey) {
      console.warn('[PHANTOM-COMPANY] ⚠️ PHANTOMBUSTER_API_KEY não configurada');
      
      return new Response(
        JSON.stringify({
          name: 'Empresa não disponível',
          message: 'PhantomBuster não configurado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔥 Usar LinkedIn Company Scraper do PhantomBuster
    const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: Deno.env.get('PHANTOM_LINKEDIN_COMPANY_AGENT_ID'),
        argument: {
          sessionCookie: linkedinSessionCookie,
          companyUrls: [linkedinCompanyUrl],
          numberOfPosts: maxPosts,
          includeEmployees: includeEmployees
        }
      })
    });

    if (!launchResponse.ok) {
      throw new Error(`PhantomBuster launch error: ${launchResponse.status}`);
    }

    const launchData = await launchResponse.json();
    const containerId = launchData.containerId;

    console.log('[PHANTOM-COMPANY] ⏳ Agent iniciado:', containerId);

    // Polling para resultado (60s timeout)
    let resultData: any = null;
    let attempts = 0;

    while (attempts < 12 && !resultData) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const resultResponse = await fetch(
        `https://api.phantombuster.com/api/v2/containers/fetch-result?id=${containerId}`,
        { headers: { 'X-Phantombuster-Key': phantomApiKey } }
      );

      if (resultResponse.ok) {
        resultData = await resultResponse.json();
        if (resultData && resultData.length > 0) break;
      }
      
      attempts++;
      console.log('[PHANTOM-COMPANY] ⏳ Aguardando... Tentativa', attempts);
    }

    const companyInfo = resultData?.[0] || {};

    // Detectar menções de concorrentes/produtos nos posts
    const competitorKeywords = ['SAP', 'Oracle', 'Microsoft', 'Dynamics', 'Salesforce', 'TOTVS', 'Protheus'];
    const competitorMentions: string[] = [];
    const productMentions: string[] = [];

    if (companyInfo.posts) {
      companyInfo.posts.forEach((post: any) => {
        const text = post.text || '';
        competitorKeywords.forEach(keyword => {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            if (keyword === 'TOTVS' || keyword === 'Protheus') {
              productMentions.push(keyword);
            } else {
              competitorMentions.push(keyword);
            }
          }
        });
      });
    }

    const result = {
      companyUrl: linkedinCompanyUrl,
      name: companyInfo.name || 'Empresa não encontrada',
      description: companyInfo.description || '',
      website: companyInfo.website || '',
      industry: companyInfo.industry || '',
      companySize: companyInfo.companySize || '',
      headquarters: companyInfo.headquarters || '',
      founded: companyInfo.founded || '',
      followers: companyInfo.followers || 0,
      employees: companyInfo.employeesOnLinkedIn || 0,
      specialties: companyInfo.specialties || [],
      recentPosts: (companyInfo.posts || []).map((post: any) => ({
        text: post.text || '',
        date: post.date || '',
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        engagement: ((post.likes + post.comments * 2 + post.shares * 3) / (companyInfo.followers || 1)) * 100
      })),
      employees_list: (companyInfo.employees || []).slice(0, 20).map((emp: any) => ({
        name: emp.name || '',
        position: emp.position || '',
        profileUrl: emp.profileUrl || ''
      })),
      competitorMentions: [...new Set(competitorMentions)],
      productMentions: [...new Set(productMentions)]
    };

    console.log('[PHANTOM-COMPANY] ✅ Dados extraídos:', result.name);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PHANTOM-COMPANY] ❌ Erro:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        name: 'Erro ao extrair dados'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

