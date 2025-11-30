import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Assistant - Assistente virtual inteligente
 * 
 * Funcionalidades:
 * - Sugestões de resposta contextuais
 * - Resumo de conversas
 * - Identificação de oportunidades
 * - Alertas proativos
 * - Análise de tendências
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, leadId, conversationContext, message } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    // SUGESTÃO DE RESPOSTA
    if (action === 'suggest_response') {
      if (!conversationContext || !message) {
        return new Response(
          JSON.stringify({ error: 'conversationContext e message são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const prompt = `
Você é um assistente de vendas especializado em eventos. Analise o contexto da conversa e sugira 3 respostas apropriadas.

CONTEXTO DA CONVERSA:
${conversationContext}

MENSAGEM DO CLIENTE:
${message}

Forneça sugestões de resposta.
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
              content: 'Você é um assistente especializado em vendas de eventos. Suas respostas devem ser profissionais, empáticas e focadas em fechar vendas.'
            },
            { role: 'user', content: prompt }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'response_suggestions',
                description: 'Retorna sugestões de resposta',
                parameters: {
                  type: 'object',
                  properties: {
                    suggestions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          text: { type: 'string' },
                          tone: { type: 'string', enum: ['formal', 'casual', 'empathetic', 'enthusiastic'] },
                          objective: { type: 'string' }
                        }
                      },
                      minItems: 3,
                      maxItems: 3
                    }
                  },
                  required: ['suggestions'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'response_suggestions' } }
        })
      });

      if (!aiResponse.ok) {
        throw new Error('Erro ao gerar sugestões');
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      const suggestions = JSON.parse(toolCall.function.arguments);

      // Salvar insight
      if (leadId) {
        await supabase
          .from('ai_insights')
          .insert({
            user_id: user.id,
            lead_id: leadId,
            insight_type: 'response_suggestion',
            title: 'Sugestões de resposta',
            description: 'Respostas geradas pela IA para facilitar comunicação',
            suggested_action: suggestions.suggestions[0].text,
            priority: 'medium',
            metadata: { suggestions: suggestions.suggestions }
          });
      }

      return new Response(
        JSON.stringify({ success: true, suggestions: suggestions.suggestions }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RESUMO DE CONVERSA
    if (action === 'summarize_conversation') {
      if (!leadId) {
        return new Response(
          JSON.stringify({ error: 'leadId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar histórico de interações
      const { data: emails } = await supabase
        .from('email_history')
        .select('subject, body, sent_at')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: false })
        .limit(10);

      const { data: whatsapp } = await supabase
        .from('whatsapp_messages')
        .select('message, direction, sent_at')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: false })
        .limit(10);

      const { data: notes } = await supabase
        .from('activities')
        .select('subject, description, created_at')
        .eq('lead_id', leadId)
        .eq('type', 'note')
        .order('created_at', { ascending: false })
        .limit(5);

      const conversationHistory = `
EMAILS:
${emails?.map(e => `[${new Date(e.sent_at).toLocaleString('pt-BR')}] ${e.subject}: ${e.body.substring(0, 200)}...`).join('\n') || 'Nenhum email'}

WHATSAPP:
${whatsapp?.map(w => `[${w.direction}] ${w.message}`).join('\n') || 'Nenhuma mensagem'}

NOTAS:
${notes?.map(n => `${n.subject}: ${n.description}`).join('\n') || 'Nenhuma nota'}
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
              content: 'Você cria resumos concisos e acionáveis de conversas de vendas.'
            },
            { 
              role: 'user', 
              content: `Resuma esta conversa de vendas identificando: pontos principais, preocupações do cliente, status atual e próximos passos recomendados.\n\n${conversationHistory}`
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'conversation_summary',
                description: 'Retorna resumo estruturado da conversa',
                parameters: {
                  type: 'object',
                  properties: {
                    summary: { type: 'string', description: 'Resumo conciso em 2-3 frases' },
                    key_points: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Pontos principais discutidos'
                    },
                    client_concerns: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Preocupações do cliente'
                    },
                    status: { type: 'string', description: 'Status atual da negociação' },
                    next_steps: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Próximos passos recomendados'
                    }
                  },
                  required: ['summary', 'key_points', 'client_concerns', 'status', 'next_steps'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'conversation_summary' } }
        })
      });

      if (!aiResponse.ok) {
        throw new Error('Erro ao resumir conversa');
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      const summary = JSON.parse(toolCall.function.arguments);

      // Salvar insight
      await supabase
        .from('ai_insights')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          insight_type: 'conversation_summary',
          title: 'Resumo da conversa',
          description: summary.summary,
          suggested_action: summary.next_steps[0],
          priority: 'medium',
          metadata: summary
        });

      return new Response(
        JSON.stringify({ success: true, summary }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GERAR INSIGHTS DIÁRIOS
    if (action === 'daily_insights') {
      // Buscar leads do usuário
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status, priority, next_followup_date, last_contact_date')
        .eq('assigned_to', user.id)
        .or('status.eq.novo,status.eq.contato_inicial,status.eq.qualificado')
        .limit(20);

      if (!leads || leads.length === 0) {
        return new Response(
          JSON.stringify({ success: true, insights: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const insights = [];

      // Identificar leads sem follow-up
      const leadsWithoutFollowup = leads.filter(l => {
        if (!l.last_contact_date) return true;
        const daysSince = Math.floor((Date.now() - new Date(l.last_contact_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 3;
      });

      if (leadsWithoutFollowup.length > 0) {
        for (const lead of leadsWithoutFollowup.slice(0, 3)) {
          insights.push({
            user_id: user.id,
            lead_id: lead.id,
            insight_type: 'warning',
            title: `Follow-up pendente: ${lead.name}`,
            description: 'Este lead está sem contato há mais de 3 dias',
            suggested_action: 'Envie uma mensagem de acompanhamento',
            priority: 'high',
            confidence: 100
          });
        }
      }

      // Identificar leads prioritários próximos ao follow-up
      const leadsNearFollowup = leads.filter(l => {
        if (!l.next_followup_date) return false;
        const daysUntil = Math.floor((new Date(l.next_followup_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 1 && daysUntil >= 0;
      });

      if (leadsNearFollowup.length > 0) {
        for (const lead of leadsNearFollowup) {
          insights.push({
            user_id: user.id,
            lead_id: lead.id,
            insight_type: 'next_action',
            title: `Follow-up agendado: ${lead.name}`,
            description: 'Follow-up agendado para hoje ou amanhã',
            suggested_action: 'Prepare-se para o contato agendado',
            priority: lead.priority === 'urgent' ? 'urgent' : 'high',
            confidence: 100
          });
        }
      }

      // Salvar insights
      if (insights.length > 0) {
        await supabase.from('ai_insights').insert(insights);
      }

      return new Response(
        JSON.stringify({ success: true, insights }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use: suggest_response, summarize_conversation ou daily_insights' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in ai-assistant:', error);
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
