import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Transcribe & Analyze - Transcreve e analisa chamadas
 * 
 * Funcionalidades:
 * - Transcrição de áudio usando Whisper
 * - Análise de sentimento
 * - Extração de palavras-chave
 * - Identificação de ações
 * - Resumo automático
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { callId, audioUrl, text } = await req.json();

    let transcriptionText = text;

    // Se tiver áudio, transcrever usando Whisper
    if (audioUrl && !transcriptionText) {
      console.log('Transcrevendo áudio...');
      
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OPENAI_API_KEY não configurada para transcrição' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Baixar áudio
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error('Erro ao baixar áudio');
      }

      const audioBlob = await audioResponse.blob();
      
      // Criar FormData para Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      // Transcrever com Whisper
      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text();
        console.error('Whisper error:', whisperResponse.status, errorText);
        throw new Error('Erro ao transcrever áudio');
      }

      const whisperData = await whisperResponse.json();
      transcriptionText = whisperData.text;
      console.log('Transcrição completa:', transcriptionText.substring(0, 100) + '...');
    }

    if (!transcriptionText) {
      return new Response(
        JSON.stringify({ error: 'Texto ou URL de áudio é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar informações da chamada se callId fornecido
    let leadId: string | null = null;
    if (callId) {
      const { data: callData } = await supabase
        .from('call_history')
        .select('lead_id')
        .eq('id', callId)
        .single();
      
      leadId = callData?.lead_id || null;
    }

    // Analisar com IA usando OpenAI GPT-4o-mini
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const analysisPrompt = `
Analise esta transcrição de chamada de vendas e extraia insights:

TRANSCRIÇÃO:
${transcriptionText}

Forneça uma análise completa.
`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de conversas de vendas. Analise a transcrição e extraia insights acionáveis sobre sentimento, palavras-chave, ações e oportunidades.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'conversation_analysis',
              description: 'Retorna análise estruturada da conversa',
              parameters: {
                type: 'object',
                properties: {
                  sentiment_score: {
                    type: 'number',
                    description: 'Score de sentimento (-100 a 100, negativo a positivo)'
                  },
                  sentiment_label: {
                    type: 'string',
                    enum: ['positive', 'neutral', 'negative'],
                    description: 'Classificação do sentimento'
                  },
                  key_phrases: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Frases-chave mencionadas'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Palavras-chave importantes'
                  },
                  action_items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        action: { type: 'string' },
                        responsible: { type: 'string' },
                        deadline: { type: 'string' }
                      }
                    },
                    description: 'Ações identificadas'
                  },
                  summary: {
                    type: 'string',
                    description: 'Resumo da conversa em 2-3 frases'
                  },
                  customer_concerns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Preocupações do cliente'
                  },
                  opportunities: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Oportunidades identificadas'
                  }
                },
                required: ['sentiment_score', 'sentiment_label', 'key_phrases', 'keywords', 'action_items', 'summary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'conversation_analysis' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error('Erro ao analisar transcrição');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('Resposta da IA inválida');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Salvar transcrição e análise
    const { data: savedTranscription, error: saveError } = await supabase
      .from('call_transcriptions')
      .insert({
        call_id: callId || null,
        lead_id: leadId,
        transcription_text: transcriptionText,
        language: 'pt-BR',
        confidence: 95,
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        key_phrases: analysis.key_phrases,
        keywords: analysis.keywords,
        ai_summary: analysis.summary,
        action_items: analysis.action_items,
        entities: {
          concerns: analysis.customer_concerns || [],
          opportunities: analysis.opportunities || []
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving transcription:', saveError);
    }

    // Salvar sentimento da conversa
    if (leadId) {
      await supabase
        .from('conversation_sentiment')
        .insert({
          lead_id: leadId,
          conversation_type: 'call',
          reference_id: callId || null,
          sentiment_score: analysis.sentiment_score,
          sentiment_label: analysis.sentiment_label === 'positive' ? 'positive' :
                          analysis.sentiment_label === 'negative' ? 'negative' : 'neutral',
          customer_satisfaction: analysis.sentiment_score > 50 ? 5 :
                                 analysis.sentiment_score > 20 ? 4 :
                                 analysis.sentiment_score > -20 ? 3 :
                                 analysis.sentiment_score > -50 ? 2 : 1,
          urgency_level: analysis.action_items.length > 3 ? 'high' :
                        analysis.action_items.length > 1 ? 'medium' : 'low'
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcription: savedTranscription,
        analysis
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in ai-transcribe-analyze:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
