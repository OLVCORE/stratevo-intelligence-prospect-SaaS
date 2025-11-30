import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Lead Scoring - Analisa leads e prediz probabilidade de fechamento
 * 
 * Funcionalidades:
 * - Calcula score preditivo do lead
 * - Identifica risco de churn
 * - Sugere próximas melhores ações
 * - Prediz data de fechamento
 */

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  status: string;
  priority: string;
  lead_score: number;
  budget: number | null;
  event_date: string | null;
  timeline: string | null;
  decision_maker: boolean;
  last_contact_date: string | null;
  created_at: string;
  source: string;
  notes_count: number;
  tasks_count: number;
  files_count: number;
}

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

    const { leadId, action = 'analyze' } = await req.json();

    if (action === 'analyze') {
      if (!leadId) {
        return new Response(
          JSON.stringify({ error: 'leadId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar dados completos do lead (análise 360º)
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (leadError || !lead) {
        return new Response(
          JSON.stringify({ error: 'Lead não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar contatos adicionais
      const { data: contacts } = await supabase
        .from('lead_contacts')
        .select('*')
        .eq('lead_id', leadId);

      // Buscar histórico de ligações com transcrições
      const { data: calls } = await supabase
        .from('call_history')
        .select(`
          *,
          transcription:call_transcriptions(*)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Buscar mensagens WhatsApp
      const { data: whatsappMessages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Buscar tarefas e atividades
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      // Buscar notas
      const { data: notes } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      // Buscar histórico de emails
      const { data: emails } = await supabase
        .from('email_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: false })
        .limit(10);

      // Buscar arquivos
      const { data: files } = await supabase
        .from('lead_files')
        .select('*')
        .eq('lead_id', leadId);

      // Buscar histórico de mudanças
      const { data: history } = await supabase
        .from('lead_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Buscar análise de sentimento
      const { data: sentiment } = await supabase
        .from('conversation_sentiment')
        .select('*')
        .eq('lead_id', leadId)
        .order('analyzed_at', { ascending: false })
        .limit(5);

      if (leadError || !lead) {
        return new Response(
          JSON.stringify({ error: 'Lead não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Preparar contexto 360º para IA
      const context = `
Analise este lead COMPLETAMENTE (análise 360º) e forneça insights preditivos:

DADOS BÁSICOS DO LEAD:
- Nome: ${lead.name}
- Email: ${lead.email}
- Telefone: ${lead.phone}
- Tipo de evento: ${lead.event_type}
- Status atual: ${lead.status}
- Prioridade: ${lead.priority}
- Score atual: ${lead.lead_score || 0}/100
- Orçamento: ${lead.budget ? `R$ ${lead.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Não informado'}
- Data do evento: ${lead.event_date || 'Não definida'}
- Timeline: ${lead.timeline || 'Não definida'}
- Tomador de decisão: ${lead.decision_maker ? 'Sim' : 'Não'}
- Fonte: ${lead.source}
- Empresa: ${lead.company_name || 'Não informado'}
- Cargo: ${lead.position || 'Não informado'}
- Último contato: ${lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleDateString('pt-BR') : 'Nunca'}
- Criado em: ${new Date(lead.created_at).toLocaleDateString('pt-BR')}
- Mensagem inicial: ${lead.message || 'Nenhuma'}

CONTATOS ADICIONAIS:
${contacts && contacts.length > 0 ? contacts.map(c => 
  `- ${c.name} (${c.position || 'Cargo não informado'})${c.is_primary ? ' [CONTATO PRINCIPAL]' : ''}
   Email: ${c.email || 'N/A'} | Telefone: ${c.phone || 'N/A'}`
).join('\n') : '- Nenhum contato adicional cadastrado'}

HISTÓRICO DE LIGAÇÕES (${calls?.length || 0} ligações):
${calls && calls.length > 0 ? calls.map(call => {
  const transcription = (call as any).transcription?.[0];
  return `- ${new Date(call.created_at!).toLocaleDateString('pt-BR')} - ${call.direction === 'inbound' ? 'Recebida' : 'Realizada'}
   Duração: ${call.duration ? Math.floor(call.duration / 60) + ' min' : 'N/A'} | Status: ${call.status || 'N/A'}
   ${call.notes ? 'Notas: ' + call.notes : ''}
   ${transcription ? `\n   Transcrição (${transcription.sentiment_label || 'N/A'}): ${transcription.transcription_text?.substring(0, 500)}...` : ''}
   ${transcription?.ai_summary ? '\n   Resumo IA: ' + transcription.ai_summary : ''}`;
}).join('\n\n') : '- Nenhuma ligação registrada'}

CONVERSAS WHATSAPP (${whatsappMessages?.length || 0} mensagens recentes):
${whatsappMessages && whatsappMessages.length > 0 ? whatsappMessages.slice(0, 10).map(msg => 
  `[${new Date(msg.created_at).toLocaleDateString('pt-BR')} ${new Date(msg.created_at).toLocaleTimeString('pt-BR')}] ${msg.direction === 'inbound' ? '👤 Cliente' : '🏢 Nós'}: ${msg.message_body?.substring(0, 200)}${msg.message_body && msg.message_body.length > 200 ? '...' : ''}`
).join('\n') : '- Nenhuma conversa no WhatsApp'}

EMAILS (${emails?.length || 0} emails trocados):
${emails && emails.length > 0 ? emails.map(email => 
  `- ${new Date(email.sent_at!).toLocaleDateString('pt-BR')}: ${email.subject}
   ${email.opened_at ? '✓ Aberto em ' + new Date(email.opened_at).toLocaleDateString('pt-BR') : '✗ Não aberto'}
   ${email.clicked_at ? '✓ Clicado' : ''}
   Corpo: ${email.body?.substring(0, 300)}...`
).join('\n\n') : '- Nenhum email trocado'}

TAREFAS E ATIVIDADES (${activities?.length || 0} atividades):
${activities && activities.length > 0 ? activities.map(act => 
  `- [${act.type.toUpperCase()}] ${act.subject}
   Status: ${act.completed ? '✓ Concluída em ' + new Date(act.completed_at!).toLocaleDateString('pt-BR') : '⏳ Pendente'}
   ${act.due_date ? 'Vencimento: ' + new Date(act.due_date).toLocaleDateString('pt-BR') : ''}
   ${act.description ? 'Descrição: ' + act.description : ''}`
).join('\n\n') : '- Nenhuma atividade registrada'}

NOTAS (${notes?.length || 0} notas):
${notes && notes.length > 0 ? notes.slice(0, 5).map((note: any) => 
  `[${new Date(note.created_at).toLocaleDateString('pt-BR')}] ${note.content?.substring(0, 200)}${note.content && note.content.length > 200 ? '...' : ''}`
).join('\n') : '- Nenhuma nota registrada'}

ARQUIVOS ANEXADOS (${files?.length || 0} arquivos):
${files && files.length > 0 ? files.map(file => 
  `- ${file.file_name} (${file.file_type || 'tipo desconhecido'}) - ${file.file_size ? (file.file_size / 1024).toFixed(2) + ' KB' : 'tamanho desconhecido'}`
).join('\n') : '- Nenhum arquivo anexado'}

HISTÓRICO DE MUDANÇAS (últimas 10):
${history && history.length > 0 ? history.slice(0, 10).map(h => 
  `- ${new Date(h.created_at!).toLocaleDateString('pt-BR')}: ${h.action} - ${h.description || 'Sem descrição'}
   ${h.field_name ? `Campo: ${h.field_name} | De: ${h.old_value || 'N/A'} → Para: ${h.new_value || 'N/A'}` : ''}`
).join('\n') : '- Nenhuma mudança registrada'}

ANÁLISE DE SENTIMENTO (últimas conversas):
${sentiment && sentiment.length > 0 ? sentiment.map(s => 
  `- ${s.conversation_type}: ${s.sentiment_label} (score: ${s.sentiment_score})
   ${s.urgency_level ? 'Urgência: ' + s.urgency_level : ''}
   ${s.customer_satisfaction ? 'Satisfação: ' + s.customer_satisfaction + '/10' : ''}`
).join('\n') : '- Nenhuma análise de sentimento disponível'}

Com base em TODOS esses dados detalhados (análise 360º completa), forneça uma análise estruturada e precisa.
`;

      // Chamar OpenAI GPT-4o-mini
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
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
              content: 'Você é um especialista em análise de vendas e predição de fechamento de leads. Você realiza análises 360º completas, considerando TODOS os dados disponíveis: conversas, emails, ligações, WhatsApp, tarefas, notas, arquivos, histórico e sentimento. Analise os dados fornecidos profundamente e retorne insights acionáveis e precisos baseados em TODA a informação disponível.'
            },
            { role: 'user', content: context }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'lead_analysis',
                description: 'Retorna análise estruturada do lead',
                parameters: {
                  type: 'object',
                  properties: {
                    predicted_probability: {
                      type: 'number',
                      description: 'Probabilidade de fechamento (0-100)'
                    },
                    predicted_close_date: {
                      type: 'string',
                      description: 'Data prevista de fechamento (YYYY-MM-DD)'
                    },
                    churn_risk: {
                      type: 'string',
                      enum: ['low', 'medium', 'high'],
                      description: 'Risco de perda do lead'
                    },
                    confidence_level: {
                      type: 'number',
                      description: 'Nível de confiança da análise (0-100)'
                    },
                    recommended_actions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          action: { type: 'string' },
                          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                          reason: { type: 'string' }
                        }
                      },
                      description: 'Ações recomendadas'
                    },
                    key_insights: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Principais insights'
                    }
                  },
                  required: ['predicted_probability', 'churn_risk', 'confidence_level', 'recommended_actions', 'key_insights'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'lead_analysis' } }
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        throw new Error('Erro ao analisar lead com IA');
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      
      if (!toolCall) {
        throw new Error('Resposta da IA inválida');
      }

      const analysis = JSON.parse(toolCall.function.arguments);

      // Garantir que a data prevista de fechamento nunca seja retroativa
      let predictedCloseDate = analysis.predicted_close_date as string | undefined;
      if (predictedCloseDate) {
        const today = new Date();
        const leadCreatedAt = new Date(lead.created_at);
        const minDate = new Date(Math.max(today.getTime(), leadCreatedAt.getTime()));
        const parsedPredicted = new Date(predictedCloseDate);

        if (isNaN(parsedPredicted.getTime()) || parsedPredicted < minDate) {
          // Se a IA sugeriu uma data inválida ou no passado, ajustamos:
          // 1) Se houver data de evento futura, usamos ela como base
          // 2) Caso contrário, usamos a maior data entre hoje e criação do lead + 30 dias
          let baseDate = minDate;
          if (lead.event_date) {
            const eventDate = new Date(lead.event_date);
            if (!isNaN(eventDate.getTime()) && eventDate > minDate) {
              baseDate = eventDate;
            }
          }

          const adjusted = new Date(baseDate);
          adjusted.setDate(adjusted.getDate() + 30);
          analysis.predicted_close_date = adjusted.toISOString().slice(0, 10);
        }
      }

      // Salvar análise no banco
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('ai_lead_analysis')
        .insert({
          lead_id: leadId,
          score_version: 'v1.0',
          predicted_probability: analysis.predicted_probability,
          predicted_close_date: analysis.predicted_close_date || null,
          churn_risk: analysis.churn_risk,
          confidence_level: analysis.confidence_level,
          recommended_actions: analysis.recommended_actions,
          analysis_data: {
            key_insights: analysis.key_insights,
            model: 'gpt-4o-mini',
            analyzed_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving analysis:', saveError);
      }

      // Criar insights para o usuário
      if (lead.assigned_to && analysis.recommended_actions.length > 0) {
        const topAction = analysis.recommended_actions[0];
        await supabase
          .from('ai_insights')
          .insert({
            user_id: lead.assigned_to,
            lead_id: leadId,
            insight_type: 'next_action',
            title: `Próxima ação recomendada para ${lead.name}`,
            description: topAction.reason,
            suggested_action: topAction.action,
            priority: topAction.priority,
            confidence: analysis.confidence_level
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            ...analysis,
            analysisId: savedAnalysis?.id
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ANÁLISE EM LOTE
    if (action === 'batch') {
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, assigned_to')
        .eq('status', 'novo')
        .or('status.eq.contato_inicial,status.eq.qualificado')
        .limit(10);

      if (leadsError || !leads) {
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar leads' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];

      for (const lead of leads) {
        try {
          // Recursivamente chamar esta função para cada lead
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-lead-scoring`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leadId: lead.id, action: 'analyze' })
          });

          if (response.ok) {
            const data = await response.json();
            results.push({ leadId: lead.id, leadName: lead.name, success: true, data });
          } else {
            results.push({ leadId: lead.id, leadName: lead.name, success: false });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error analyzing lead ${lead.id}:`, errorMessage);
          results.push({ leadId: lead.id, leadName: lead.name, success: false, error: errorMessage });
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed: results.length, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use: analyze ou batch' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in ai-lead-scoring:', error);
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
