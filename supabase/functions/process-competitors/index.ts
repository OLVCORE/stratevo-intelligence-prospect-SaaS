import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const serperApiKey = Deno.env.get('SERPER_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processCompetitors(companyName: string, domain: string, reportId: string, jobId: string) {
  const startTime = Date.now();
  
  // Buscar competidores via Serper
  const query = `"${companyName}" competitors OR "similar companies"`;
  
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 20 }),
  });

  const data = await response.json();
  const duration = Date.now() - startTime;

  // Log da chamada
  await supabase.rpc('log_api_call', {
    p_report_id: reportId,
    p_job_id: jobId,
    p_provider: 'serper',
    p_endpoint: '/search',
    p_status_code: response.status,
    p_cost_usd: 0.001,
    p_duration_ms: duration,
    p_success: response.ok,
  });

  const competitors = (data.organic || []).slice(0, 10).map((r: any) => ({
    name: r.title,
    url: r.link,
    snippet: r.snippet,
  }));

  return { competitors, count: competitors.length };
}

serve(async (req) => {
  try {
    const { reportId } = await req.json();
    
    const { data: report } = await supabase
      .from('stc_verification_history')
      .select('*')
      .eq('id', reportId)
      .single();

    const { data: job } = await supabase.rpc('enqueue_job', {
      p_report_id: reportId,
      p_job_type: 'competitors',
    });

    const jobId = job;

    await supabase.from('job_queue').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', jobId);

    const result = await processCompetitors(report.company_name, report.full_report?.keywords?.discoveredDomain || '', reportId, jobId);

    const { data: currentReport } = await supabase.from('stc_verification_history').select('full_report').eq('id', reportId).single();

    await supabase.from('stc_verification_history').update({ 
      full_report: {
        ...currentReport.full_report,
        competitors: result,
        __status: {
          ...currentReport.full_report.__status,
          competitors: { status: 'completed', updated_at: new Date().toISOString() },
        },
      },
    }).eq('id', reportId);

    await supabase.from('job_queue').update({ status: 'completed', output_data: result, completed_at: new Date().toISOString() }).eq('id', jobId);
    await supabase.rpc('update_report_progress', { p_report_id: reportId });

    return new Response(JSON.stringify({ success: true, result }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

