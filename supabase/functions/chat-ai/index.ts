// supabase/functions/chat-ai/index.ts
// Edge Function para processar mensagens do chat e gerar respostas do assistente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const { message, sessionId, mode } = await req.json();

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'message e sessionId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar histórico de mensagens da sessão
    const { data: historyMessages, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20); // Últimas 20 mensagens para contexto

    if (historyError) {
      console.error('Erro ao buscar histórico:', historyError);
    }

    // Preparar contexto para a IA
    const conversationHistory: ChatMessage[] = (historyMessages || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Adicionar mensagem atual
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Buscar informações do tenant/sessão para personalização
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('tenant_id, session_data')
      .eq('id', sessionId)
      .single();

    // 🔥 RAG: Busca semântica antes de gerar resposta
    let ragContext = '';
    try {
      // Gerar embedding da query para busca
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiApiKey) {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: message,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding = embeddingData.data[0].embedding;
          const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`;

          // Buscar na base de conhecimento
          const { data: knowledgeResults } = await supabase.rpc('match_knowledge', {
            query_embedding: queryEmbeddingStr,
            match_threshold: 0.75,
            match_count: 3,
          });

          // Buscar em conversas passadas
          const { data: conversationResults } = await supabase.rpc('match_conversations', {
            query_embedding: queryEmbeddingStr,
            match_threshold: 0.75,
            match_count: 3,
          });

          // Buscar padrões aprendidos
          const { data: patternResults } = await supabase.rpc('match_patterns', {
            query_embedding: queryEmbeddingStr,
            match_threshold: 0.75,
            match_count: 3,
          });

          if (knowledgeResults?.length > 0) {
            ragContext += '\n\n📚 Base de Conhecimento Relevante:\n';
            ragContext += knowledgeResults.map((k: any) => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n');
          }
          
          if (patternResults?.length > 0) {
            ragContext += '\n\n✨ Padrões de Sucesso:\n';
            ragContext += patternResults.map((p: any) => `Padrão: ${p.question_pattern}\nResposta: ${p.best_answer}`).join('\n\n');
          }
          
          if (conversationResults?.length > 0) {
            ragContext += '\n\n💬 Conversas Similares:\n';
            ragContext += conversationResults.map((c: any) => c.content).join('\n\n');
          }
        }
      }
    } catch (ragError) {
      console.warn('[chat-ai] RAG search failed, continuing without context:', ragError);
    }

    // Prompt do sistema personalizado com RAG
    const systemPrompt = `Você é ${session?.session_data?.assistant_name || 'Assistente Virtual da STRATEVO'}, o assistente virtual da STRATEVO.

Sua função é:
1. Receber e qualificar leads de forma amigável e profissional
2. Coletar informações essenciais: nome, telefone, email, tipo de evento, data, número de convidados
3. Ser prestativo e oferecer agendar uma visita ao espaço
4. Responder de forma natural e conversacional em português brasileiro

IMPORTANTE:
- Seja breve e objetivo
- Faça uma pergunta por vez
- Sempre confirme as informações coletadas
- Ofereça agendar uma visita ao final da conversa

Contexto da conversa:
${conversationHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Você'}: ${m.content}`).join('\n')}
${ragContext}

Responda como o assistente virtual:`;

    // Chamar OpenAI (ou outro modelo de IA)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      // Fallback: resposta simples sem IA
      return new Response(
        JSON.stringify({
          response: 'Obrigado pela sua mensagem! Nossa equipe entrará em contato em breve. Você pode me informar seu nome e telefone para agilizarmos?',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo mais barato e rápido
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-10), // Últimas 10 mensagens para contexto
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('Erro na OpenAI:', error);
      
      // Fallback
      return new Response(
        JSON.stringify({
          response: 'Obrigado pela sua mensagem! Nossa equipe entrará em contato em breve.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const assistantResponse = openaiData.choices[0]?.message?.content || 
      'Obrigado pela sua mensagem! Nossa equipe entrará em contato em breve.';

    return new Response(
      JSON.stringify({
        response: assistantResponse,
        sessionId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar mensagem',
        response: 'Desculpe, ocorreu um erro. Nossa equipe entrará em contato em breve!',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

