/**
 * Edge Function: Processar sequências de email ativas (CRM).
 * Trigger: Cron (ex.: a cada 5 min).
 * Requer tabelas: crm_sequence_enrollments, crm_sequences, crm_sequence_steps, crm_email_templates
 * (criar migration com essas tabelas para ativar o processamento).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verificar se tabela existe (crm_sequence_enrollments pode não existir ainda)
    const { data: dueEnrollments, error } = await supabase
      .from('crm_sequence_enrollments')
      .select('id, sequence_id, lead_id, current_step_id, current_step_order, next_action_at')
      .eq('status', 'active')
      .lte('next_action_at', new Date().toISOString())
      .limit(50);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Sequence tables not configured. Add crm_sequences, crm_sequence_steps, crm_sequence_enrollments to enable.',
            processed: 0,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    const results = { processed: 0, succeeded: 0, failed: 0, errors: [] as { enrollmentId: string; error: string }[] };

    for (const enrollment of dueEnrollments ?? []) {
      results.processed++;
      try {
        const step = await getStep(supabase, enrollment.current_step_id);
        const lead = await getLead(supabase, enrollment.lead_id);
        if (step && lead) {
          if (step.action_type === 'send_email' && lead.email) {
            await sendSequenceEmail(supabase, step, lead, enrollment);
          } else if (step.action_type === 'create_task') {
            await createTaskForLead(supabase, enrollment.lead_id, lead);
          }
          await logActivity(supabase, enrollment.lead_id, step);
        }
        await moveToNextStep(supabase, enrollment);
        results.succeeded++;
      } catch (stepError: unknown) {
        results.failed++;
        results.errors.push({
          enrollmentId: enrollment.id,
          error: stepError instanceof Error ? stepError.message : String(stepError),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('[crm-process-sequences]', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getStep(supabase: ReturnType<typeof createClient>, stepId: string) {
  const { data } = await supabase.from('crm_sequence_steps').select('*').eq('id', stepId).single();
  return data as { action_type?: string; email_template_id?: string } | null;
}

async function getLead(supabase: ReturnType<typeof createClient>, leadId: string) {
  const { data } = await supabase.from('crm_leads').select('id, lead_name, email, owner_id').eq('id', leadId).single();
  return data as { lead_name?: string; email?: string; owner_id?: string } | null;
}

async function sendSequenceEmail(
  supabase: ReturnType<typeof createClient>,
  step: { email_template_id?: string },
  lead: { lead_name?: string; email?: string },
  enrollment: { lead_id: string; sequence_id: string }
) {
  if (!step.email_template_id || !lead.email) return;

  const { data: template } = await supabase
    .from('crm_email_templates')
    .select('subject, body_html')
    .eq('id', step.email_template_id)
    .single();

  if (!template) return;

  const subject = replaceMergeTags(String(template.subject), lead);
  const bodyHtml = replaceMergeTags(String(template.body_html), lead);

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'vendas@stratevo.com',
        to: lead.email,
        subject,
        html: bodyHtml,
        tags: [{ name: 'sequence_id', value: enrollment.sequence_id }, { name: 'lead_id', value: enrollment.lead_id }],
      }),
    });
    if (!res.ok) throw new Error(`Resend: ${res.statusText}`);
  }

  await supabase.from('crm_activities').insert({
    entity_type: 'lead',
    entity_id: enrollment.lead_id,
    lead_id: enrollment.lead_id,
    activity_type: 'email',
    activity_subtype: 'sent',
    subject,
    description: bodyHtml,
    metadata: { template_id: step.email_template_id, sequence_id: enrollment.sequence_id },
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

async function createTaskForLead(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  lead: { lead_name?: string; owner_id?: string }
) {
  const ownerId = lead.owner_id;
  if (!ownerId) return;

  const due = new Date(Date.now() + 86400000);
  await supabase.from('crm_tasks').insert({
    lead_id: leadId,
    assigned_to: ownerId,
    task_title: `Follow-up: ${lead.lead_name ?? 'Lead'}`,
    task_type: 'follow_up',
    priority: 'medium',
    status: 'pending',
    due_date: due.toISOString().split('T')[0],
  });
}

async function logActivity(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  step: { action_type?: string; step_order?: number }
) {
  await supabase.from('crm_activities').insert({
    entity_type: 'lead',
    entity_id: leadId,
    lead_id: leadId,
    activity_type: 'sequence_action',
    activity_subtype: step.action_type ?? 'wait',
    subject: `Sequência - Step ${step.step_order ?? 0}`,
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

async function moveToNextStep(
  supabase: ReturnType<typeof createClient>,
  enrollment: { id: string; sequence_id: string; current_step_order: number }
) {
  const { data: nextStep } = await supabase
    .from('crm_sequence_steps')
    .select('id, step_order, delay_days, delay_hours')
    .eq('sequence_id', enrollment.sequence_id)
    .eq('step_order', enrollment.current_step_order + 1)
    .single();

  if (!nextStep) {
    await supabase
      .from('crm_sequence_enrollments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
    return;
  }

  const nextAt = new Date();
  nextAt.setDate(nextAt.getDate() + (Number(nextStep.delay_days) || 0));
  nextAt.setHours(nextAt.getHours() + (Number(nextStep.delay_hours) || 0));

  await supabase
    .from('crm_sequence_enrollments')
    .update({
      current_step_id: nextStep.id,
      current_step_order: nextStep.step_order,
      next_action_at: nextAt.toISOString(),
    })
    .eq('id', enrollment.id);
}

function replaceMergeTags(text: string, lead: { lead_name?: string; company_name?: string }) {
  return text
    .replace(/\{\{first_name\}\}/g, lead.lead_name?.split(' ')[0] ?? 'Olá')
    .replace(/\{\{full_name\}\}/g, lead.lead_name ?? 'Prezado(a)')
    .replace(/\{\{company_name\}\}/g, (lead as { company_name?: string }).company_name ?? 'sua empresa');
}
