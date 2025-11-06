import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Buscar jobs falhados que podem ser retriados
    const { data: failedJobs } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (!failedJobs || failedJobs.length === 0) {
      return new Response(JSON.stringify({ message: 'No jobs to retry' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Reenfileirar jobs
    for (const job of failedJobs) {
      await supabase
        .from('job_queue')
        .update({
          status: 'pending',
          retry_count: job.retry_count + 1,
          error: null,
        })
        .eq('id', job.id);

      // Log evento
      await supabase
        .from('report_events')
        .insert({
          report_id: job.report_id,
          event_type: 'retry',
          event_data: { job_id: job.id, job_type: job.job_type, retry_count: job.retry_count + 1 },
        });

      console.log(`[Retry] Reenfileirado job ${job.id} (tentativa ${job.retry_count + 1})`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        retriedCount: failedJobs.length 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

