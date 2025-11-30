// supabase/functions/elevenlabs-conversation-v2/index.ts
// Edge Function melhorada para ElevenLabs Conversational AI
// Suporta múltiplas abordagens: Transcrição + Chat ou API unificada

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const { audio, sessionId, transcript } = await req.json();

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar histórico da sessão
    const { data: historyMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = (historyMessages || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    let userTranscript = transcript;

    // Se não tiver transcrição, tentar transcrever o áudio
    if (!userTranscript && audio) {
      // Opção 1: Usar OpenAI Whisper para transcrição
      if (openaiApiKey) {
        try {
          // Converter base64 para buffer
          const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
          const audioBuffer = Uint8Array.from(
            atob(base64Data),
            (c) => c.charCodeAt(0)
          );

          // Criar FormData para Whisper API
          const formData = new FormData();
          const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
          formData.append('file', audioFile);
          formData.append('model', 'whisper-1');
          formData.append('language', 'pt');

          const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: formData,
          });

          if (whisperResponse.ok) {
            const whisperData = await whisperResponse.json();
            userTranscript = whisperData.text;
            console.log('✅ Transcrição via Whisper:', userTranscript);
          } else {
            const errorText = await whisperResponse.text();
            console.error('Erro no Whisper:', errorText);
          }
        } catch (err) {
          console.error('Erro ao transcrever com Whisper:', err);
        }
      }
    }

    if (!userTranscript) {
      return new Response(
        JSON.stringify({
          error: 'Não foi possível transcrever o áudio',
          userTranscript: '',
          assistantResponse: 'Desculpe, não consegui entender o áudio. Tente novamente ou use o modo texto.',
          assistantAudioUrl: '',
          entities: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter resposta do assistente usando chat-ai
    let assistantResponse = '';
    try {
      const chatResponse = await supabase.functions.invoke('chat-ai', {
        body: {
          message: userTranscript,
          sessionId: sessionId,
          mode: 'voice',
        },
      });

      if (chatResponse.data && !chatResponse.error) {
        assistantResponse = chatResponse.data.response || '';
      }
    } catch (err) {
      console.error('Erro ao obter resposta do chat-ai:', err);
      assistantResponse = 'Obrigado pela sua mensagem! Nossa equipe entrará em contato em breve.';
    }

    // Se ElevenLabs estiver configurado, gerar áudio da resposta
    let assistantAudioUrl = '';
    if (elevenlabsApiKey && assistantResponse) {
      try {
        // Usar ElevenLabs Text-to-Speech para gerar áudio da resposta
        const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
          method: 'POST',
          headers: {
            'xi-api-key': elevenlabsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: assistantResponse,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          // Converter para base64 ou URL temporária
          // Por enquanto, retornamos que o áudio foi gerado
          assistantAudioUrl = 'generated'; // Placeholder - pode ser melhorado com storage
          console.log('✅ Áudio gerado com ElevenLabs TTS');
        }
      } catch (err) {
        console.error('Erro ao gerar áudio com ElevenLabs:', err);
      }
    }

    // Extrair entidades da transcrição
    const entities: any = {};
    const emailMatch = userTranscript.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = userTranscript.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/);
    const nameMatch = userTranscript.match(/(?:me chamo|meu nome é|sou)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);

    if (emailMatch) entities.email = emailMatch[0];
    if (phoneMatch) entities.phone = phoneMatch[0].replace(/\D/g, '');
    if (nameMatch) entities.name = nameMatch[1];

    return new Response(
      JSON.stringify({
        userTranscript: userTranscript,
        assistantResponse: assistantResponse,
        assistantAudioUrl: assistantAudioUrl,
        entities: entities,
        duration: 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar áudio',
        userTranscript: '',
        assistantResponse: 'Desculpe, ocorreu um erro. Tente novamente ou use o modo texto.',
        assistantAudioUrl: '',
        entities: {},
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

