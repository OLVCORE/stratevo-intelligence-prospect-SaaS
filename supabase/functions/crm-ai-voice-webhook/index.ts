import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Webhook do Twilio para status updates
serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const callDuration = formData.get('CallDuration');

    console.log(`[Webhook] CallSid: ${callSid}, Status: ${callStatus}`);

    // Atualizar status da chamada
    const updateData: any = {
      twilio_status: callStatus
    };

    if (callStatus === 'completed') {
      updateData.status = 'completed';
      updateData.ended_at = new Date().toISOString();
      updateData.duration_seconds = parseInt(callDuration as string || '0');
    } else if (callStatus === 'in-progress') {
      updateData.status = 'in_progress';
    } else if (callStatus === 'no-answer') {
      updateData.status = 'no_answer';
    } else if (callStatus === 'busy') {
      updateData.status = 'busy';
    } else if (callStatus === 'failed') {
      updateData.status = 'failed';
    }

    const { error } = await supabase
      .from('ai_voice_calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid);

    if (error) throw error;

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Webhook] Erro:', error);
    return new Response('Error', { status: 500 });
  }
});


