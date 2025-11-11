/**
 * PLAUD ANALYZER - AI-Powered Call Analysis
 * 
 * This service uses OpenAI GPT-4 to analyze sales call transcripts
 * and extract valuable insights, action items, sentiment, and coaching tips.
 */

import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

// Types
export interface CallTranscript {
  id?: string;
  plaud_recording_id?: string;
  transcript: string;
  recording_date?: string;
  duration_seconds?: number;
  speakers?: Speaker[];
  company_name?: string;
  company_id?: string;
  deal_id?: string;
}

export interface Speaker {
  name: string;
  duration_seconds?: number;
  speech_segments?: string[];
}

export interface CallAnalysisResult {
  // Summary
  summary: string;
  key_topics: string[];
  
  // Sentiment Analysis
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentiment_score: number; // -1.0 to 1.0
  confidence_level: number; // 0.0 to 1.0
  
  // Action Items
  action_items: ActionItem[];
  
  // Objections
  objections_raised: Objection[];
  
  // Opportunities
  opportunities_detected: Opportunity[];
  
  // Coaching Metrics
  talk_time_ratio: number;
  questions_asked: number;
  objection_handling_score: number;
  closing_attempts: number;
  
  // Win/Loss Signals
  buying_signals: string[];
  risk_signals: string[];
  
  // Coaching Recommendations
  coaching_recommendations: CoachingRecommendation[];
}

export interface ActionItem {
  task: string;
  assignee?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: string;
}

export interface Objection {
  objection: string;
  response?: string;
  resolved: boolean;
  timestamp?: number;
  severity: 'minor' | 'moderate' | 'major';
}

export interface Opportunity {
  type: 'upsell' | 'cross_sell' | 'renewal' | 'expansion';
  product?: string;
  confidence: number;
  reasoning: string;
}

export interface CoachingRecommendation {
  type: 'talk_time' | 'discovery_questions' | 'objection_handling' | 
        'closing_technique' | 'active_listening' | 'value_proposition';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggested_improvement: string;
  timestamp_in_call?: number;
  transcript_excerpt?: string;
}

/**
 * Main Analyzer Class
 */
export class PlaudAnalyzer {
  private openai: OpenAI;
  
  constructor(apiKey?: string) {
    const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  
  /**
   * Analyze a call transcript and extract all insights
   */
  async analyzeCall(callData: CallTranscript): Promise<CallAnalysisResult> {
    console.log('🎙️ Starting call analysis...', { id: callData.id });
    
    try {
      // Step 1: Get comprehensive analysis from GPT-4
      const analysis = await this.getAIAnalysis(callData);
      
      // Step 2: Calculate metrics from transcript
      const metrics = this.calculateMetrics(callData);
      
      // Step 3: Generate coaching recommendations
      const coaching = this.generateCoachingRecommendations(analysis, metrics);
      
      // Combine results
      const result: CallAnalysisResult = {
        ...analysis,
        ...metrics,
        coaching_recommendations: coaching
      };
      
      console.log('✅ Call analysis complete', { 
        sentiment: result.sentiment,
        action_items: result.action_items.length,
        opportunities: result.opportunities_detected.length
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error analyzing call:', error);
      throw error;
    }
  }
  
  /**
   * Use GPT-4 to analyze the transcript
   */
  private async getAIAnalysis(callData: CallTranscript): Promise<Partial<CallAnalysisResult>> {
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

COMPANY: ${callData.company_name || 'Unknown'}
DATE: ${callData.recording_date || 'Unknown'}
DURATION: ${callData.duration_seconds ? Math.round(callData.duration_seconds / 60) : 'Unknown'} minutes

SPEAKERS:
${callData.speakers?.map(s => `- ${s.name}`).join('\n') || 'Unknown'}

TRANSCRIPT:
${callData.transcript}

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
      "resolved": true|false,
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

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Rápido e barato: ~3-5 segundos
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, // Mais consistente e rápido
      max_tokens: 1500, // Limita resposta = mais rápido
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    return JSON.parse(content);
  }
  
  /**
   * Calculate coaching metrics from transcript
   */
  private calculateMetrics(callData: CallTranscript) {
    const transcript = callData.transcript.toLowerCase();
    const speakers = callData.speakers || [];
    
    // Calculate talk time ratio (seller vs buyer)
    let sellerTime = 0;
    let buyerTime = 0;
    
    if (speakers.length >= 2) {
      sellerTime = speakers[0]?.duration_seconds || 0;
      buyerTime = speakers.slice(1).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    }
    
    const totalTime = sellerTime + buyerTime;
    const talk_time_ratio = totalTime > 0 ? parseFloat((sellerTime / totalTime).toFixed(2)) : 0.5;
    
    // Count discovery questions
    const questionPatterns = [
      /\bcomo\b.*\?/g,
      /\bqual\b.*\?/g,
      /\bquando\b.*\?/g,
      /\bonde\b.*\?/g,
      /\bpor que\b.*\?/g,
      /\bquem\b.*\?/g,
      /\bvocê poderia\b.*\?/g,
      /\bme conte\b.*\?/g,
    ];
    
    const questions_asked = questionPatterns.reduce((count, pattern) => {
      const matches = transcript.match(pattern);
      return count + (matches?.length || 0);
    }, 0);
    
    // Estimate objection handling score (simplified)
    const objectionKeywords = ['mas', 'porém', 'contudo', 'caro', 'preço', 'não sei'];
    const responseKeywords = ['entendo', 'compreendo', 'faz sentido', 'veja bem', 'por exemplo'];
    
    const objectionCount = objectionKeywords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return count + (transcript.match(regex)?.length || 0);
    }, 0);
    
    const responseCount = responseKeywords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return count + (transcript.match(regex)?.length || 0);
    }, 0);
    
    const objection_handling_score = objectionCount > 0 
      ? parseFloat(Math.min(responseCount / objectionCount, 1.0).toFixed(2))
      : 1.0;
    
    // Count closing attempts
    const closingPhrases = [
      'podemos seguir',
      'vamos fechar',
      'que tal começarmos',
      'posso enviar o contrato',
      'próximo passo',
      'quando podemos iniciar'
    ];
    
    const closing_attempts = closingPhrases.reduce((count, phrase) => {
      const regex = new RegExp(phrase, 'gi');
      return count + (transcript.match(regex)?.length || 0);
    }, 0);
    
    return {
      talk_time_ratio,
      questions_asked,
      objection_handling_score,
      closing_attempts
    };
  }
  
  /**
   * Generate coaching recommendations based on analysis
   */
  private generateCoachingRecommendations(
    analysis: Partial<CallAnalysisResult>,
    metrics: ReturnType<typeof this.calculateMetrics>
  ): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // 1. Talk Time Ratio
    if (metrics.talk_time_ratio > 0.6) {
      recommendations.push({
        type: 'talk_time',
        severity: 'warning',
        title: 'Você está falando demais',
        description: `Você falou ${Math.round(metrics.talk_time_ratio * 100)}% do tempo. O ideal é 30-40% para dar espaço ao cliente.`,
        suggested_improvement: 'Faça mais perguntas abertas e pratique escuta ativa. Deixe o cliente falar mais sobre suas necessidades.'
      });
    } else if (metrics.talk_time_ratio < 0.25) {
      recommendations.push({
        type: 'talk_time',
        severity: 'info',
        title: 'Você pode falar um pouco mais',
        description: `Você falou apenas ${Math.round(metrics.talk_time_ratio * 100)}% do tempo. É importante também apresentar valor.`,
        suggested_improvement: 'Balance perguntas com apresentação de soluções. Mostre como você pode resolver os problemas mencionados.'
      });
    }
    
    // 2. Discovery Questions
    if (metrics.questions_asked < 5) {
      recommendations.push({
        type: 'discovery_questions',
        severity: 'critical',
        title: 'Poucas perguntas de descoberta',
        description: `Você fez apenas ${metrics.questions_asked} perguntas. Para entender bem o cliente, faça 10-15 perguntas.`,
        suggested_improvement: 'Use a metodologia SPIN Selling: Situação, Problema, Implicação, Necessidade-Solução.'
      });
    }
    
    // 3. Objection Handling
    if (metrics.objection_handling_score < 0.5) {
      recommendations.push({
        type: 'objection_handling',
        severity: 'warning',
        title: 'Melhore o tratamento de objeções',
        description: 'Algumas objeções não foram bem respondidas.',
        suggested_improvement: 'Use a técnica LAER: Listen, Acknowledge, Explore, Respond. Sempre valide a preocupação antes de responder.'
      });
    }
    
    // 4. Closing Attempts
    if (metrics.closing_attempts === 0) {
      recommendations.push({
        type: 'closing_technique',
        severity: 'critical',
        title: 'Nenhuma tentativa de fechamento',
        description: 'Você não tentou avançar o deal durante a call.',
        suggested_improvement: 'Sempre termine com um próximo passo claro. Pergunte: "Qual seria o próximo passo ideal para você?"'
      });
    }
    
    // 5. Sentiment-based recommendations
    if (analysis.sentiment === 'negative') {
      recommendations.push({
        type: 'active_listening',
        severity: 'warning',
        title: 'Cliente demonstrou insatisfação',
        description: 'O sentimento geral da call foi negativo.',
        suggested_improvement: 'Faça um follow-up rápido. Pergunte o que pode ser melhorado e demonstre genuíno interesse em resolver.'
      });
    }
    
    // 6. Opportunity-based
    if (analysis.opportunities_detected && analysis.opportunities_detected.length > 0) {
      recommendations.push({
        type: 'value_proposition',
        severity: 'info',
        title: 'Oportunidades detectadas',
        description: `${analysis.opportunities_detected.length} oportunidade(s) de cross-sell/upsell identificada(s).`,
        suggested_improvement: 'Prepare uma proposta específica para essas oportunidades e agende um follow-up.'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Save analysis to database
   */
  async saveAnalysis(
    callData: CallTranscript,
    analysis: CallAnalysisResult,
    userId: string
  ): Promise<{ id: string }> {
    try {
      // 1. Insert call recording
      const { data: recording, error: recordingError } = await supabase
        .from('call_recordings')
        .insert({
          plaud_recording_id: callData.plaud_recording_id,
          recording_date: callData.recording_date,
          duration_seconds: callData.duration_seconds,
          transcript: callData.transcript,
          summary: analysis.summary,
          speakers: callData.speakers,
          sentiment: analysis.sentiment,
          sentiment_score: analysis.sentiment_score,
          confidence_level: analysis.confidence_level,
          key_topics: analysis.key_topics,
          action_items: analysis.action_items,
          objections_raised: analysis.objections_raised,
          opportunities_detected: analysis.opportunities_detected,
          company_id: callData.company_id,
          deal_id: callData.deal_id,
          recorded_by: userId,
          talk_time_ratio: analysis.talk_time_ratio,
          questions_asked: analysis.questions_asked,
          objection_handling_score: analysis.objection_handling_score,
          closing_attempts: analysis.closing_attempts,
          buying_signals: analysis.buying_signals,
          risk_signals: analysis.risk_signals,
          processing_status: 'completed'
        })
        .select('id')
        .single();
      
      if (recordingError) throw recordingError;
      if (!recording) throw new Error('Failed to create call recording');
      
      // 2. Insert coaching recommendations
      if (analysis.coaching_recommendations.length > 0) {
        const recommendations = analysis.coaching_recommendations.map(rec => ({
          user_id: userId,
          call_recording_id: recording.id,
          recommendation_type: rec.type,
          severity: rec.severity,
          title: rec.title,
          description: rec.description,
          suggested_improvement: rec.suggested_improvement,
          timestamp_in_call: rec.timestamp_in_call,
          transcript_excerpt: rec.transcript_excerpt
        }));
        
        const { error: coachingError } = await supabase
          .from('sales_coaching_recommendations')
          .insert(recommendations);
        
        if (coachingError) console.error('Failed to save coaching recommendations:', coachingError);
      }
      
      // 3. Create activity in deal timeline
      if (callData.deal_id) {
        await supabase
          .from('sales_deal_activities')
          .insert({
            deal_id: callData.deal_id,
            activity_type: 'call',
            description: analysis.summary,
            new_value: {
              call_recording_id: recording.id,
              sentiment: analysis.sentiment,
              duration_minutes: Math.round((callData.duration_seconds || 0) / 60),
              key_topics: analysis.key_topics
            }
          });
      }
      
      console.log('✅ Analysis saved to database', { id: recording.id });
      
      return { id: recording.id };
      
    } catch (error) {
      console.error('❌ Error saving analysis:', error);
      throw error;
    }
  }
}

/**
 * Export singleton instance
 */
export const plaudAnalyzer = new PlaudAnalyzer();

/**
 * Helper: Analyze and save in one call
 */
export async function analyzeAndSaveCall(
  callData: CallTranscript,
  userId: string
): Promise<{ id: string; analysis: CallAnalysisResult }> {
  const analyzer = new PlaudAnalyzer();
  const analysis = await analyzer.analyzeCall(callData);
  const { id } = await analyzer.saveAnalysis(callData, analysis, userId);
  return { id, analysis };
}

