// supabase/functions/elevenlabs-conversation/index.ts
// Edge Function para processar conversas de voz com ElevenLabs Conversational AI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, sessionId, action = 'conversation' } = await req.json();

    if (!audio || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'audio e sessionId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      return new Response(
        JSON.stringify({ error: 'ELEVENLABS_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Preparar contexto
    const conversationHistory = (historyMessages || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Converter base64 para buffer
    const audioBuffer = Uint8Array.from(
      atob(audio.split(',')[1] || audio),
      (c) => c.charCodeAt(0)
    );

    // Chamar ElevenLabs Conversational AI
    // Nota: A API do ElevenLabs pode variar. Ajuste conforme a documentação oficial.
    // Opção 1: Usar endpoint de transcrição + chat separados
    // Opção 2: Usar endpoint unificado (se disponível)
    
    // Primeiro, transcrever o áudio
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'audio.webm');
    
    // Transcrição (usando Whisper ou serviço similar)
    // Por enquanto, vamos usar uma abordagem simplificada
    // que envia o áudio para processamento
    
    const elevenlabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversation',
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsApiKey,
        },
        body: formData,
      }
    );

    if (!elevenlabsResponse.ok) {
      const error = await elevenlabsResponse.text();
      console.error('Erro na ElevenLabs:', error);
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error('Erro na ElevenLabs:', errorText);
      
      // Fallback: retornar estrutura básica para não quebrar o frontend
      return new Response(
        JSON.stringify({
          userTranscript: 'Transcrição não disponível',
          assistantResponse: 'Desculpe, não consegui processar o áudio. Tente novamente ou use o modo texto.',
          assistantAudioUrl: '',
          entities: {},
          duration: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elevenlabsData = await elevenlabsResponse.json();

    // Extrair entidades do texto transcrito (se disponível)
    const entities = elevenlabsData.entities || {};

    return new Response(
      JSON.stringify({
        userTranscript: elevenlabsData.user_transcript || elevenlabsData.transcript || '',
        assistantResponse: elevenlabsData.assistant_response || elevenlabsData.response || '',
        assistantAudioUrl: elevenlabsData.audio_url || elevenlabsData.audioUrl || '',
        entities: entities,
        duration: elevenlabsData.duration || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar áudio',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

