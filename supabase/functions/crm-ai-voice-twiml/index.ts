import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const speechResult = formData.get('SpeechResult');
    const confidence = formData.get('Confidence');

    console.log(`[TwiML] CallSid: ${callSid}, Status: ${callStatus}`);

    // Buscar call e agente no banco
    const { data: call } = await supabase
      .from('ai_voice_calls')
      .select('*, ai_voice_agents(*)')
      .eq('twilio_call_sid', callSid)
      .single();

    if (!call) {
      console.error('[TwiML] Call não encontrada:', callSid);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const agent = call.ai_voice_agents;

    // Atualizar status da chamada
    await supabase
      .from('ai_voice_calls')
      .update({
        status: callStatus === 'completed' ? 'completed' : 'in_progress',
        twilio_status: callStatus
      })
      .eq('id', call.id);

    // Se há resposta do usuário, analisar
    if (speechResult) {
      console.log(`[TwiML] Resposta do usuário: ${speechResult}`);
      
      // Análise de sentimento com OpenAI
      const sentimentAnalysis = await analyzeSentiment(speechResult);
      
      // Atualizar transcrição e sentimento
      const currentTranscript = call.transcript || '';
      await supabase
        .from('ai_voice_calls')
        .update({
          transcript: currentTranscript + '\nUsuário: ' + speechResult,
          sentiment_score: sentimentAnalysis.score,
          sentiment_label: sentimentAnalysis.label
        })
        .eq('id', call.id);
    }

    // Gerar áudio de resposta com ElevenLabs
    const responseText = agent.greeting_script; // Simplificado - em produção, usar IA para gerar resposta
    const audioUrl = await generateElevenLabsAudio(responseText, agent.voice_id);

    // TwiML de resposta
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" timeout="10" language="pt-BR" 
          action="https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/functions/v1/crm-ai-voice-twiml">
    <Pause length="2"/>
  </Gather>
  <Say voice="Polly.Vitoria-Neural" language="pt-BR">
    ${agent.closing_script || 'Obrigado e até breve!'}
  </Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('[TwiML] Erro:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Desculpe, ocorreu um erro.</Say><Hangup/></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
});

// Função: Gerar áudio com ElevenLabs
async function generateElevenLabsAudio(text: string, voiceId: string): Promise<string> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') ?? '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const fileName = `voice-${Date.now()}.mp3`;

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(`public/${fileName}`, audioBlob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Obter URL público
    const { data } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(`public/${fileName}`);

    return data.publicUrl;
  } catch (error) {
    console.error('[ElevenLabs] Erro:', error);
    // Fallback: usar voz Polly da AWS (built-in do Twilio)
    return '';
  }
}

// Função: Analisar sentimento com OpenAI
async function analyzeSentiment(text: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analise o sentimento desta frase e retorne apenas um JSON com formato: {"score": -1.0 a 1.0, "label": "positive/neutral/negative"}\n\nFrase: "${text}"`
        }],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('[Sentiment] Erro:', error);
    return { score: 0, label: 'neutral' };
  }
}


