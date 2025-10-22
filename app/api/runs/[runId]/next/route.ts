/**
 * API: POST Execute Next Step
 * Executa próximo passo da sequência
 * Integra com CICLO 5 (envio de mensagens)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { selectVariant, shouldExecuteStep } from '@/lib/sequencer/engine';
import { sendEmail } from '@/lib/providers/smtp';
import { sendWhatsApp } from '@/lib/providers/wa';
import { renderTemplate, buildTemplateVariables } from '@/lib/templates';

export async function POST(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const t0 = performance.now();

  try {
    // Buscar run
    const { data: run } = await supabaseAdmin
      .from('runs')
      .select('*,leads(company_id,person_id),playbooks(*)')
      .eq('id', params.runId)
      .single();

    if (!run) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Run não encontrado' },
        { status: 404 }
      );
    }

    if (run.status !== 'active') {
      return NextResponse.json(
        { ok: false, code: 'RUN_NOT_ACTIVE', message: `Run está ${run.status}` },
        { status: 422 }
      );
    }

    // Buscar próximo step
    const { data: steps } = await supabaseAdmin
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', run.playbook_id)
      .order('order_index', { ascending: true });

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { ok: false, code: 'NO_STEPS', message: 'Playbook sem passos' },
        { status: 422 }
      );
    }

    const currentStep = steps[run.step_index];
    if (!currentStep) {
      // Sequência finalizada
      await supabaseAdmin
        .from('runs')
        .update({ status: 'finished' })
        .eq('id', params.runId);

      return NextResponse.json(
        { ok: true, message: 'Sequência finalizada', finished: true },
        { status: 200 }
      );
    }

    // Buscar variantes do step
    const { data: variants } = await supabaseAdmin
      .from('playbook_variants')
      .select('*')
      .eq('step_id', currentStep.id);

    // Selecionar variante (A/B)
    let selectedVariant: any = null;
    let templateId = currentStep.template_id;

    if (variants && variants.length > 0) {
      selectedVariant = selectVariant(variants, params.runId, run.step_index);
      templateId = selectedVariant.template_id || templateId;
    }

    // Buscar dados para template
    const leadData: any = Array.isArray(run.leads) ? run.leads[0] : run.leads;
    const companyId = leadData?.company_id;
    const personId = leadData?.person_id;

    let company = null;
    let person = null;
    if (companyId) {
      const { data } = await supabaseAdmin.from('companies').select('*').eq('id', companyId).single();
      company = data;
    }
    if (personId) {
      const { data } = await supabaseAdmin.from('people').select('*,person_contacts(*)').eq('id', personId).single();
      person = data;
    }

    // Buscar template
    const { data: template } = await supabaseAdmin
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json(
        { ok: false, code: 'TEMPLATE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Renderizar template
    const vars = buildTemplateVariables(company, person);
    const bodyText = renderTemplate(template.body_md, vars);
    const subject = template.subject ? renderTemplate(template.subject, vars) : undefined;

    // Determinar destinatário (primeiro contato do canal)
    const contacts = person?.person_contacts || [];
    const toContact =
      currentStep.channel === 'email'
        ? contacts.find((c: any) => c.type === 'email')
        : contacts.find((c: any) => c.type === 'whatsapp' || c.type === 'phone');

    if (!toContact) {
      // Registrar erro
      await supabaseAdmin.from('run_events').insert({
        run_id: params.runId,
        step_index: run.step_index,
        variant: selectedVariant?.name,
        action: 'error',
        channel: currentStep.channel,
        meta: { error: `Sem contato ${currentStep.channel} disponível` },
      });

      return NextResponse.json(
        { ok: false, code: 'NO_CONTACT', message: `Sem contato ${currentStep.channel} disponível para este decisor` },
        { status: 422 }
      );
    }

    // Enviar mensagem
    let result: any;
    if (currentStep.channel === 'email') {
      result = await sendEmail({
        to: toContact.value,
        subject: subject || 'Contato',
        text: bodyText,
        html: `<p>${bodyText.replace(/\n/g, '<br>')}</p>`,
      });
    } else {
      result = await sendWhatsApp({
        to: toContact.value,
        content: bodyText,
      });
    }

    const latency = Math.round(performance.now() - t0);

    // Registrar evento
    await supabaseAdmin.from('run_events').insert({
      run_id: params.runId,
      step_index: run.step_index,
      variant: selectedVariant?.name || 'default',
      action: 'send',
      channel: currentStep.channel,
      provider: result.provider,
      provider_msg_id: result.messageId,
      latency_ms: latency,
    });

    // Atualizar ab_results
    const variantName = selectedVariant?.name || 'default';
    await supabaseAdmin
      .from('ab_results')
      .upsert(
        {
          playbook_id: run.playbook_id,
          step_index: run.step_index,
          variant: variantName,
          sends: 1, // Será incrementado pelo SQL
        },
        {
          onConflict: 'playbook_id,step_index,variant',
          ignoreDuplicates: false,
        }
      );

    // Incrementar sends (raw SQL seria melhor, mas usando update)
    const { data: abCurrent } = await supabaseAdmin
      .from('ab_results')
      .select('sends')
      .eq('playbook_id', run.playbook_id)
      .eq('step_index', run.step_index)
      .eq('variant', variantName)
      .maybeSingle();

    if (abCurrent) {
      await supabaseAdmin
        .from('ab_results')
        .update({ sends: (abCurrent.sends || 0) + 1 })
        .eq('playbook_id', run.playbook_id)
        .eq('step_index', run.step_index)
        .eq('variant', variantName);
    }

    // Avançar para próximo step
    const nextStepIndex = run.step_index + 1;
    const nextStep = steps[nextStepIndex];
    const nextDue = nextStep
      ? new Date(Date.now() + nextStep.delay_days * 24 * 60 * 60 * 1000)
      : null;

    await supabaseAdmin
      .from('runs')
      .update({
        step_index: nextStepIndex,
        next_due_at: nextDue ? nextDue.toISOString() : null,
        variant_map: {
          ...run.variant_map,
          [`step_${run.step_index}`]: variantName,
        },
      })
      .eq('id', params.runId);

    return NextResponse.json(
      {
        ok: true,
        executed: true,
        nextStep: nextStep ? nextStepIndex : null,
        finished: !nextStep,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'EXEC_ERROR', message: e?.message || e?.error },
      { status: 500 }
    );
  }
}

