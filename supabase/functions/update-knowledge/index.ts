// supabase/functions/update-knowledge/index.ts
// Edge Function para atualizar base de conhecimento baseado em feedback

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { sessionId, feedbackScore, wasHelpful } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[update-knowledge] Updating knowledge based on feedback for session:', sessionId);

    // Buscar mensagens da sessão
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[update-knowledge] Error fetching messages:', messagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar feedback_score nos embeddings
    const { error: updateError } = await supabase
      .from('conversation_embeddings')
      .update({ feedback_score: feedbackScore || 0 })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('[update-knowledge] Error updating embeddings:', updateError);
    }

    // Se feedback foi positivo e há mensagens, analisar para aprendizado
    if (wasHelpful && feedbackScore >= 4 && messages && messages.length > 0) {
      console.log('[update-knowledge] Analyzing positive feedback conversation for learning');

      if (!openaiKey) {
        console.warn('[update-knowledge] OPENAI_API_KEY not set, skipping pattern learning');
        return new Response(
          JSON.stringify({ success: true, message: 'Feedback updated, but pattern learning skipped (no API key)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      // Analisar conversa para extrair padrões
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Modelo mais barato para análise
          messages: [
            {
              role: 'system',
              content: 'Analyze this conversation and extract: 1) The main question pattern, 2) The best answer that worked, 3) Context/keywords. Return ONLY valid JSON with fields: questionPattern (string), bestAnswer (string), context (array of strings).'
            },
            {
              role: 'user',
              content: conversationText
            }
          ],
          temperature: 0.3,
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        let analysis;
        
        try {
          analysis = JSON.parse(analysisData.choices[0].message.content);
        } catch (e) {
          // Tentar extrair JSON do texto se não for JSON puro
          const jsonMatch = analysisData.choices[0].message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse analysis response');
          }
        }

        // Gerar embedding do padrão de pergunta
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: analysis.questionPattern || conversationText.substring(0, 500),
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;
          const embeddingStr = `[${embedding.join(',')}]`;

          // Buscar padrões similares
          const { data: similarPatterns } = await supabase.rpc('match_patterns', {
            query_embedding: embeddingStr,
            match_threshold: 0.85,
            match_count: 1,
          });

          if (similarPatterns && similarPatterns.length > 0) {
            // Atualizar padrão existente
            const existingPattern = similarPatterns[0];
            await supabase
              .from('learning_patterns')
              .update({
                usage_count: existingPattern.usage_count + 1,
                success_rate: ((existingPattern.success_rate * existingPattern.usage_count) + 1) / (existingPattern.usage_count + 1),
                last_used_at: new Date().toISOString(),
              })
              .eq('id', existingPattern.id);
            
            console.log('[update-knowledge] Updated existing pattern');
          } else {
            // Criar novo padrão
            await supabase
              .from('learning_patterns')
              .insert({
                pattern_type: 'successful_answer',
                question_pattern: analysis.questionPattern || conversationText.substring(0, 200),
                best_answer: analysis.bestAnswer || messages.find(m => m.role === 'assistant')?.content || '',
                context: { keywords: analysis.context || [] },
                success_rate: 1.0,
                usage_count: 1,
                last_used_at: new Date().toISOString(),
              });
            
            console.log('[update-knowledge] Created new learning pattern');
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[update-knowledge] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


