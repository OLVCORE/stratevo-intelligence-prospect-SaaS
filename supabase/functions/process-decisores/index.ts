import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apolloApiKey = Deno.env.get('APOLLO_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processDecisores(companyName: string, domain: string, reportId: string, jobId: string) {
  // Chamar Apollo.io para buscar decisores
  const response = await fetch('https://api.apollo.io/v1/organizations/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloApiKey },
    body: JSON.stringify({ domain }),
  });

  const data = await response.json();

  await supabase.rpc('log_api_call', {
    p_report_id: reportId,
    p_job_id: jobId,
    p_provider: 'apollo',
    p_endpoint: '/v1/organizations/enrich',
    p_status_code: response.status,
    p_cost_usd: 0.05,
    p_duration_ms: 0,
    p_success: response.ok,
  });

  return { 
    decisores: data.organization?.people || [],
    count: data.organization?.people?.length || 0,
  };
}

serve(async (req) => {
  try {
    const { reportId } = await req.json();
    const { data: report } = await supabase.from('stc_verification_history').select('*').eq('id', reportId).single();
    const { data: job } = await supabase.rpc('enqueue_job', { p_report_id: reportId, p_job_type: 'decisores' });
    const jobId = job;

    await supabase.from('job_queue').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', jobId);

    const result = await processDecisores(report.company_name, report.full_report?.keywords?.discoveredDomain || '', reportId, jobId);

    const { data: currentReport } = await supabase.from('stc_verification_history').select('full_report').eq('id', reportId).single();

    await supabase.from('stc_verification_history').update({ 
      full_report: {
        ...currentReport.full_report,
        decisores: result,
        __status: { ...currentReport.full_report.__status, decisores: { status: 'completed', updated_at: new Date().toISOString() } },
      },
    }).eq('id', reportId);

    await supabase.from('job_queue').update({ status: 'completed', output_data: result, completed_at: new Date().toISOString() }).eq('id', jobId);
    await supabase.rpc('update_report_progress', { p_report_id: reportId });

    return new Response(JSON.stringify({ success: true, result }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

