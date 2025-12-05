import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Webhook do Twilio para quando gravação está pronta
serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const recordingUrl = formData.get('RecordingUrl');
    const recordingDuration = formData.get('RecordingDuration');

    console.log(`[Recording] CallSid: ${callSid}, URL: ${recordingUrl}`);

    // Adicionar .mp3 à URL (Twilio retorna sem extensão)
    const fullRecordingUrl = recordingUrl + '.mp3';

    // Atualizar chamada com URL da gravação
    const { error: updateError } = await supabase
      .from('ai_voice_calls')
      .update({
        recording_url: fullRecordingUrl,
        recording_duration_seconds: parseInt(recordingDuration as string || '0')
      })
      .eq('twilio_call_sid', callSid);

    if (updateError) throw updateError;

    // Iniciar transcrição automática (se habilitado)
    const { data: call } = await supabase
      .from('ai_voice_calls')
      .select('*, ai_voice_agents(*)')
      .eq('twilio_call_sid', callSid)
      .single();

    if (call && call.ai_voice_agents.auto_transcribe) {
      console.log('[Recording] Iniciando transcrição automática...');
      
      // Chamar função de transcrição
      await supabase.functions.invoke('crm-transcribe-call', {
        body: {
          call_id: call.id,
          recording_url: fullRecordingUrl
        }
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Recording] Erro:', error);
    return new Response('Error', { status: 500 });
  }
});


