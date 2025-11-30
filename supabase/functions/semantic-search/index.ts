// supabase/functions/semantic-search/index.ts
// Edge Function para busca semântica usando embeddings

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
    const { query, limit = 5, threshold = 0.7 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      console.warn('[semantic-search] OPENAI_API_KEY not set, returning empty results');
      return new Response(
        JSON.stringify({
          success: true,
          results: {
            knowledge: [],
            conversations: [],
            patterns: [],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[semantic-search] Performing semantic search for query:', query);

    // Gerar embedding da query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error('[semantic-search] Embedding generation failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate query embedding' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`;

    console.log('[semantic-search] Query embedding generated, searching knowledge base');

    // Buscar na base de conhecimento
    const { data: knowledgeResults, error: kbError } = await supabase.rpc(
      'match_knowledge',
      {
        query_embedding: queryEmbeddingStr,
        match_threshold: threshold,
        match_count: limit,
      }
    );

    if (kbError) {
      console.error('[semantic-search] Knowledge base search error:', kbError);
    }

    // Buscar em conversas passadas
    const { data: conversationResults, error: convError } = await supabase.rpc(
      'match_conversations',
      {
        query_embedding: queryEmbeddingStr,
        match_threshold: threshold,
        match_count: limit,
      }
    );

    if (convError) {
      console.error('[semantic-search] Conversation search error:', convError);
    }

    // Buscar padrões aprendidos
    const { data: patternResults, error: patternError } = await supabase.rpc(
      'match_patterns',
      {
        query_embedding: queryEmbeddingStr,
        match_threshold: threshold,
        match_count: limit,
      }
    );

    if (patternError) {
      console.error('[semantic-search] Pattern search error:', patternError);
    }

    console.log('[semantic-search] Search completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          knowledge: knowledgeResults || [],
          conversations: conversationResults || [],
          patterns: patternResults || [],
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[semantic-search] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


