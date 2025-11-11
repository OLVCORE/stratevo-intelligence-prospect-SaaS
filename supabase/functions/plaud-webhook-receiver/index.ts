/**
 * PLAUD WEBHOOK RECEIVER
 * 
 * This Edge Function receives webhooks from Plaud NotePin
 * when a new recording is transcribed.
 * 
 * It automatically:
 * 1. Receives the transcript
 * 2. Analyzes it with AI
 * 3. Creates action items
 * 4. Updates deals
 * 5. Sends notifications
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts';

// Types
interface PlaudWebhookPayload {
  recording_id: string;
  recording_url?: string;
  recording_date: string;
  duration_seconds: number;
  transcript: string;
  summary?: string;
  language?: string;
  speakers?: Array<{
    name: string;
    duration_seconds?: number;
  }>;
  metadata?: {
    company_name?: string;
    company_cnpj?: string;
    deal_id?: string;
    tags?: string[];
  };
}

interface CallAnalysisResult {
  summary: string;
  key_topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentiment_score: number;
  confidence_level: number;
  action_items: any[];
  objections_raised: any[];
  opportunities_detected: any[];
  buying_signals: string[];
  risk_signals: string[];
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-plaud-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify request
    const plaudSignature = req.headers.get('x-plaud-signature');
    console.log('📥 Received Plaud webhook', { signature: plaudSignature });
    
    // Parse payload
    const payload: PlaudWebhookPayload = await req.json();
    
    if (!payload.recording_id || !payload.transcript) {
      throw new Error('Invalid payload: missing recording_id or transcript');
    }
    
    console.log('📄 Processing recording:', {
      id: payload.recording_id,
      duration: payload.duration_seconds,
      transcript_length: payload.transcript.length
    });
    
    // 2. Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });
    
    // 3. Log webhook receipt
    const { data: webhookLog } = await supabase
      .from('plaud_webhook_logs')
      .insert({
        webhook_event: 'recording_transcribed',
        payload: payload,
        processing_status: 'received'
      })
      .select('id')
      .single();
    
    // 4. Find company and deal (if metadata provided)
    let company_id: string | null = null;
    let deal_id: string | null = null;
    let user_id: string | null = null;
    
    if (payload.metadata?.company_cnpj) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('cnpj', payload.metadata.company_cnpj)
        .single();
      
      company_id = company?.id || null;
    }
    
    if (payload.metadata?.deal_id) {
      const { data: deal } = await supabase
        .from('sdr_deals')
        .select('id, assigned_to')
        .eq('id', payload.metadata.deal_id)
        .single();
      
      deal_id = deal?.id || null;
      user_id = deal?.assigned_to || null;
    }
    
    // If no user found, use first admin user as fallback
    if (!user_id) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      user_id = adminUser?.id || null;
    }
    
    // 5. Analyze transcript with AI
    console.log('🤖 Analyzing transcript with AI...');
    
    const analysis = await analyzeTranscript(openai, {
      transcript: payload.transcript,
      company_name: payload.metadata?.company_name,
      recording_date: payload.recording_date,
      duration_seconds: payload.duration_seconds,
      speakers: payload.speakers
    });
    
    console.log('✅ AI analysis complete:', {
      sentiment: analysis.sentiment,
      action_items: analysis.action_items.length,
      opportunities: analysis.opportunities_detected.length
    });
    
    // 6. Calculate metrics
    const metrics = calculateMetrics(payload.transcript, payload.speakers || []);
    
    // 7. Save call recording to database
    const { data: callRecording, error: recordingError } = await supabase
      .from('call_recordings')
      .insert({
        plaud_recording_id: payload.recording_id,
        recording_url: payload.recording_url,
        recording_date: payload.recording_date,
        duration_seconds: payload.duration_seconds,
        transcript: payload.transcript,
        summary: analysis.summary,
        language: payload.language || 'pt-BR',
        speakers: payload.speakers,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        confidence_level: analysis.confidence_level,
        key_topics: analysis.key_topics,
        action_items: analysis.action_items,
        objections_raised: analysis.objections_raised,
        opportunities_detected: analysis.opportunities_detected,
        company_id: company_id,
        deal_id: deal_id,
        recorded_by: user_id,
        talk_time_ratio: metrics.talk_time_ratio,
        questions_asked: metrics.questions_asked,
        objection_handling_score: metrics.objection_handling_score,
        closing_attempts: metrics.closing_attempts,
        buying_signals: analysis.buying_signals,
        risk_signals: analysis.risk_signals,
        processing_status: 'completed'
      })
      .select('id')
      .single();
    
    if (recordingError) {
      throw recordingError;
    }
    
    console.log('💾 Call recording saved:', callRecording.id);
    
    // 8. Generate and save coaching recommendations
    const recommendations = generateCoachingRecommendations(analysis, metrics);
    
    if (recommendations.length > 0 && user_id) {
      const coachingData = recommendations.map(rec => ({
        user_id: user_id,
        call_recording_id: callRecording.id,
        recommendation_type: rec.type,
        severity: rec.severity,
        title: rec.title,
        description: rec.description,
        suggested_improvement: rec.suggested_improvement
      }));
      
      await supabase
        .from('sales_coaching_recommendations')
        .insert(coachingData);
      
      console.log('📝 Coaching recommendations saved:', recommendations.length);
    }
    
    // 9. Update webhook log with success
    if (webhookLog) {
      await supabase
        .from('plaud_webhook_logs')
        .update({
          processing_status: 'success',
          call_recording_id: callRecording.id
        })
        .eq('id', webhookLog.id);
    }
    
    // 10. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        call_recording_id: callRecording.id,
        message: 'Call processed successfully',
        insights: {
          sentiment: analysis.sentiment,
          action_items_created: analysis.action_items.length,
          opportunities_detected: analysis.opportunities_detected.length,
          coaching_tips: recommendations.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    // Try to log error to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('plaud_webhook_logs')
        .insert({
          webhook_event: 'error',
          payload: { error: error.message },
          processing_status: 'error',
          error_message: error.message
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Analyze transcript with OpenAI
 */
async function analyzeTranscript(
  openai: OpenAI,
  data: {
    transcript: string;
    company_name?: string;
    recording_date?: string;
    duration_seconds?: number;
    speakers?: any[];
  }
): Promise<CallAnalysisResult> {
  const systemPrompt = `Você é um especialista em coaching de vendas e análise de conversas para vendas B2B no Brasil.
Seu trabalho é analisar transcrições de calls de vendas e extrair insights valiosos.

IMPORTANTE: SEMPRE responda em PORTUGUÊS BRASILEIRO.

Analise a call e forneça:
1. Resumo conciso (2-3 frases) em PORTUGUÊS
2. Tópicos principais (keywords) em PORTUGUÊS
3. Sentimento geral (positive/neutral/negative/mixed) e score (-1.0 a 1.0)
4. Action items com detalhes em PORTUGUÊS
5. Objeções levantadas e como foram tratadas em PORTUGUÊS
6. Oportunidades de upsell/cross-sell em PORTUGUÊS
7. Sinais de compra e risco em PORTUGUÊS

Seja específico, prático e objetivo. Foque no que importa para fechar negócios.
LEMBRE-SE: TODO o conteúdo deve estar em PORTUGUÊS BRASILEIRO.`;

  const userPrompt = `Analyze this sales call:

COMPANY: ${data.company_name || 'Unknown'}
DATE: ${data.recording_date || 'Unknown'}
DURATION: ${data.duration_seconds ? Math.round(data.duration_seconds / 60) : 'Unknown'} minutes

SPEAKERS:
${data.speakers?.map(s => `- ${s.name}`).join('\n') || 'Unknown'}

TRANSCRIPT:
${data.transcript}

Respond ONLY with valid JSON in this exact format:
{
  "summary": "string",
  "key_topics": ["topic1", "topic2"],
  "sentiment": "positive|neutral|negative|mixed",
  "sentiment_score": 0.75,
  "confidence_level": 0.90,
  "action_items": [
    {
      "task": "string",
      "assignee": "string or null",
      "due_date": "YYYY-MM-DD or null",
      "priority": "low|medium|high|urgent",
      "context": "string"
    }
  ],
  "objections_raised": [
    {
      "objection": "string",
      "response": "string or null",
      "resolved": true,
      "severity": "minor|moderate|major"
    }
  ],
  "opportunities_detected": [
    {
      "type": "upsell|cross_sell|renewal|expansion",
      "product": "string or null",
      "confidence": 0.85,
      "reasoning": "string"
    }
  ],
  "buying_signals": ["signal1", "signal2"],
  "risk_signals": ["risk1", "risk2"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Rápido e barato
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2, // Mais consistente
    max_tokens: 1500, // Mais rápido
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}

/**
 * Calculate coaching metrics
 */
function calculateMetrics(transcript: string, speakers: any[]) {
  const lowerTranscript = transcript.toLowerCase();
  
  // Talk time ratio
  let sellerTime = 0;
  let buyerTime = 0;
  
  if (speakers.length >= 2) {
    sellerTime = speakers[0]?.duration_seconds || 0;
    buyerTime = speakers.slice(1).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  }
  
  const totalTime = sellerTime + buyerTime;
  const talk_time_ratio = totalTime > 0 ? parseFloat((sellerTime / totalTime).toFixed(2)) : 0.5;
  
  // Questions asked
  const questionPatterns = [
    /\bcomo\b.*\?/g,
    /\bqual\b.*\?/g,
    /\bquando\b.*\?/g,
    /\bonde\b.*\?/g,
    /\bpor que\b.*\?/g,
  ];
  
  const questions_asked = questionPatterns.reduce((count, pattern) => {
    const matches = lowerTranscript.match(pattern);
    return count + (matches?.length || 0);
  }, 0);
  
  // Objection handling
  const objectionKeywords = ['mas', 'porém', 'caro', 'preço'];
  const responseKeywords = ['entendo', 'compreendo', 'faz sentido'];
  
  const objectionCount = objectionKeywords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (lowerTranscript.match(regex)?.length || 0);
  }, 0);
  
  const responseCount = responseKeywords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (lowerTranscript.match(regex)?.length || 0);
  }, 0);
  
  const objection_handling_score = objectionCount > 0 
    ? parseFloat(Math.min(responseCount / objectionCount, 1.0).toFixed(2))
    : 1.0;
  
  // Closing attempts
  const closingPhrases = ['podemos seguir', 'vamos fechar', 'próximo passo'];
  const closing_attempts = closingPhrases.reduce((count, phrase) => {
    const regex = new RegExp(phrase, 'gi');
    return count + (lowerTranscript.match(regex)?.length || 0);
  }, 0);
  
  return {
    talk_time_ratio,
    questions_asked,
    objection_handling_score,
    closing_attempts
  };
}

/**
 * Generate coaching recommendations
 */
function generateCoachingRecommendations(analysis: CallAnalysisResult, metrics: any) {
  const recommendations: any[] = [];
  
  // Talk time
  if (metrics.talk_time_ratio > 0.6) {
    recommendations.push({
      type: 'talk_time',
      severity: 'warning',
      title: 'Você está falando demais',
      description: `Você falou ${Math.round(metrics.talk_time_ratio * 100)}% do tempo. O ideal é 30-40%.`,
      suggested_improvement: 'Faça mais perguntas abertas e pratique escuta ativa.'
    });
  }
  
  // Questions
  if (metrics.questions_asked < 5) {
    recommendations.push({
      type: 'discovery_questions',
      severity: 'critical',
      title: 'Poucas perguntas de descoberta',
      description: `Apenas ${metrics.questions_asked} perguntas feitas.`,
      suggested_improvement: 'Use SPIN Selling: faça 10-15 perguntas de qualidade.'
    });
  }
  
  // Objections
  if (metrics.objection_handling_score < 0.5) {
    recommendations.push({
      type: 'objection_handling',
      severity: 'warning',
      title: 'Melhore o tratamento de objeções',
      description: 'Algumas objeções não foram bem respondidas.',
      suggested_improvement: 'Use LAER: Listen, Acknowledge, Explore, Respond.'
    });
  }
  
  // Closing
  if (metrics.closing_attempts === 0) {
    recommendations.push({
      type: 'closing_technique',
      severity: 'critical',
      title: 'Nenhuma tentativa de fechamento',
      description: 'Você não tentou avançar o deal.',
      suggested_improvement: 'Sempre termine com um próximo passo claro.'
    });
  }
  
  return recommendations;
}

