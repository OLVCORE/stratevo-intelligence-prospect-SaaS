// =====================================================
// EDGE FUNCTION: Process Discovery
// Backend worker para descoberta de presença digital
// Inspirado em: Salesforce/HubSpot architecture
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const serperApiKey = Deno.env.get('SERPER_API_KEY')!;
const hunterApiKey = Deno.env.get('HUNTER_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Blocklist de agregadores
const BLOCKLIST_HOSTS = [
  'econodata.com.br',
  'cnpj.biz',
  'cnpj.ws',
  'cnpja.com',
  'cnpjbrasil.com',
  'cnpjtotal.com.br',
  'empresascnpj.com',
  'portaldastransportadoras.com.br',
  'guiadeindustrias.com.br',
  'serasa.com.br',
  'escavador.com',
  'telelistas.net',
];

function isBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKLIST_HOSTS.some(b => host.includes(b));
  } catch {
    return false;
  }
}

function isLikelySocial(url: string): boolean {
  return /(linkedin\.com|instagram\.com|facebook\.com|x\.com|twitter\.com|youtube\.com)/i.test(url);
}

async function callSerper(query: string, reportId: string, jobId: string): Promise<any[]> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();
    
    // Log da chamada
    await supabase.rpc('log_api_call', {
      p_report_id: reportId,
      p_job_id: jobId,
      p_provider: 'serper',
      p_endpoint: '/search',
      p_status_code: response.status,
      p_cost_usd: 0.001, // $1 per 1000 searches
      p_duration_ms: duration,
      p_success: response.ok,
      p_request_body: { q: query },
      p_response_body: { organic: data.organic?.slice(0, 3) }, // só primeiros 3
    });

    return data.organic || [];
  } catch (error) {
    console.error('[Serper] Error:', error);
    
    await supabase.rpc('log_api_call', {
      p_report_id: reportId,
      p_job_id: jobId,
      p_provider: 'serper',
      p_endpoint: '/search',
      p_status_code: 0,
      p_cost_usd: 0,
      p_duration_ms: Date.now() - startTime,
      p_success: false,
      p_error_message: error.message,
    });

    return [];
  }
}

async function validateDomain(domain: string, reportId: string, jobId: string): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}`
    );

    const duration = Date.now() - startTime;
    const data = await response.json();
    
    await supabase.rpc('log_api_call', {
      p_report_id: reportId,
      p_job_id: jobId,
      p_provider: 'hunter',
      p_endpoint: '/domain-search',
      p_status_code: response.status,
      p_cost_usd: 0.005, // estimativa
      p_duration_ms: duration,
      p_success: response.ok,
      p_request_body: { domain },
      p_response_body: { emails: data.data?.emails?.length || 0 },
    });

    return response.ok && data.data?.emails?.length > 0;
  } catch (error) {
    console.error('[Hunter] Error:', error);
    return false;
  }
}

async function runDiscovery(companyName: string, cnpj: string, reportId: string, jobId: string) {
  console.log(`[Discovery] Starting for: ${companyName}`);
  
  // Queries otimizadas (sem CNPJ)
  const queries = [
    `"${companyName}" "site oficial"`,
    `"${companyName}" site:*.com.br`,
    `"${companyName}" (site:linkedin.com OR site:instagram.com OR site:facebook.com)`,
  ];

  // Executar queries em paralelo
  const results = await Promise.all(
    queries.map(q => callSerper(q, reportId, jobId))
  );

  const allResults = results.flat();
  
  // Filtrar e ranquear
  const filtered = allResults
    .filter(r => r?.link && !isBlocked(r.link))
    .map(r => ({
      url: r.link,
      title: r.title || '',
      snippet: r.snippet || '',
      isSocial: isLikelySocial(r.link),
    }));

  // Separar website oficial vs redes sociais
  const website = filtered.find(r => !r.isSocial);
  const socials = filtered.filter(r => r.isSocial).slice(0, 8);

  // Validar domínio principal com Hunter
  let validatedDomain = null;
  if (website) {
    try {
      const host = new URL(website.url).hostname.replace(/^www\./, '');
      const isValid = await validateDomain(host, reportId, jobId);
      if (isValid) validatedDomain = host;
    } catch {}
  }

  // Calcular confiança
  const confidence = validatedDomain ? 85 : (website ? 60 : (socials.length > 0 ? 40 : 0));

  return {
    discoveredDomain: validatedDomain || (website ? new URL(website.url).hostname.replace(/^www\./, '') : ''),
    domainUrl: website?.url || '',
    confidence,
    sources: filtered.slice(0, 10),
    socialProfiles: {
      linkedin: socials.filter(s => s.url.includes('linkedin')).map(s => s.url),
      instagram: socials.filter(s => s.url.includes('instagram')).map(s => s.url),
      facebook: socials.filter(s => s.url.includes('facebook')).map(s => s.url),
      twitter: socials.filter(s => s.url.match(/x\.com|twitter\.com/)).map(s => s.url),
    },
  };
}

serve(async (req) => {
  try {
    const { reportId } = await req.json();

    if (!reportId) {
      return new Response(JSON.stringify({ error: 'reportId required' }), { status: 400 });
    }

    console.log(`[Worker] Processing discovery for report: ${reportId}`);

    // 1. Buscar relatório
    const { data: report, error: reportError } = await supabase
      .from('stc_verification_history')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    // 2. Criar job
    const { data: job } = await supabase.rpc('enqueue_job', {
      p_report_id: reportId,
      p_job_type: 'discovery',
      p_input_data: {
        company_name: report.company_name,
        cnpj: report.cnpj,
      },
    });

    const jobId = job;

    // 3. Atualizar status para "running"
    await supabase
      .from('job_queue')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId);

    await supabase
      .from('report_state')
      .update({ 
        status: 'processing', 
        current_step: 'discovery',
        started_at: new Date().toISOString(),
      })
      .eq('report_id', reportId);

    // 4. Executar discovery
    const result = await runDiscovery(report.company_name, report.cnpj, reportId, jobId);

    // 5. Salvar resultado
    const { data: currentReport } = await supabase
      .from('stc_verification_history')
      .select('full_report')
      .eq('id', reportId)
      .single();

    const updatedReport = {
      ...currentReport.full_report,
      keywords: result,
      __status: {
        ...currentReport.full_report.__status,
        keywords: { status: 'completed', updated_at: new Date().toISOString() },
      },
    };

    await supabase
      .from('stc_verification_history')
      .update({ 
        full_report: updatedReport,
        confidence: `${result.confidence}%`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    // 6. Marcar job como completado
    const duration = Date.now();
    await supabase
      .from('job_queue')
      .update({ 
        status: 'completed', 
        output_data: result,
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      })
      .eq('id', jobId);

    // 7. Atualizar progresso
    await supabase.rpc('update_report_progress', { p_report_id: reportId });

    // 8. Logar evento
    await supabase
      .from('report_events')
      .insert({
        report_id: reportId,
        event_type: 'step_completed',
        event_data: { step: 'discovery', confidence: result.confidence },
      });

    console.log(`[Worker] Discovery completed for ${reportId}`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Worker] Error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

