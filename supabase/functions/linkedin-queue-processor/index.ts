// supabase/functions/linkedin-queue-processor/index.ts
// Processar fila de ações automatizadas do LinkedIn (CRON Job)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Esta função deve ser chamada via cron job ou scheduler
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Buscar próximo item pendente da fila
    const { data: queueItem, error } = await supabaseClient
      .from('linkedin_queue')
      .select(`
        *,
        linkedin_accounts!inner(*),
        linkedin_leads!inner(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .single();

    if (error || !queueItem) {
      return new Response(
        JSON.stringify({ message: 'Nenhum item na fila' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Marcar como processando
    await supabaseClient
      .from('linkedin_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);

    // Verificar se conta pode enviar
    const { data: canSend } = await supabaseClient
      .rpc('can_send_linkedin_invite', { 
        p_account_id: queueItem.linkedin_account_id 
      });

    if (!canSend) {
      // Reagendar para depois
      await supabaseClient
        .from('linkedin_queue')
        .update({ 
          status: 'pending',
          scheduled_for: new Date(Date.now() + 3600000).toISOString(), // +1 hora
        })
        .eq('id', queueItem.id);

      return new Response(
        JSON.stringify({ message: 'Conta fora do horário ou limite atingido' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Processar ação
    if (queueItem.action_type === 'invite') {
      // Chamar Edge Function de convite
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const response = await fetch(
        `${supabaseUrl}/functions/v1/linkedin-inviter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkedin_account_id: queueItem.linkedin_account_id,
            linkedin_lead_id: queueItem.linkedin_lead_id,
            message: queueItem.payload?.message,
          }),
        }
      );

      const result = await response.json();

      // Atualizar status do item na fila
      await supabaseClient
        .from('linkedin_queue')
        .update({
          status: result.success ? 'completed' : 'failed',
          executed_at: new Date().toISOString(),
          result,
          error_message: result.error,
          retry_count: result.success ? queueItem.retry_count : queueItem.retry_count + 1,
        })
        .eq('id', queueItem.id);

      // Se falhou e ainda pode tentar novamente
      if (!result.success && queueItem.retry_count < queueItem.max_retries) {
        await supabaseClient
          .from('linkedin_queue')
          .update({
            status: 'pending',
            scheduled_for: new Date(Date.now() + 300000).toISOString(), // +5 min
          })
          .eq('id', queueItem.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: queueItem.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Queue processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

