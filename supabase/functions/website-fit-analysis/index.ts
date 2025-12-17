// ✅ Edge Function para análise de Website Fit com OpenAI
// 🔥 BUG 4 FIX: Chave da API OpenAI não exposta no frontend
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantProds, prospectProds, compatibleProducts, websiteFitScore } = await req.json();

    if (!tenantProds || !prospectProds) {
      return new Response(
        JSON.stringify({ error: 'tenantProds e prospectProds são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔥 BUG 4 FIX: Buscar chave da API do ambiente do servidor (não exposta no frontend)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[website-fit-analysis] OPENAI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada no servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[website-fit-analysis] Gerando recomendação IA', {
      tenantProdsCount: tenantProds.length,
      prospectProdsCount: prospectProds.length,
      compatibleCount: compatibleProducts.length,
      websiteFitScore
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise estratégica de fit entre empresas. Analise produtos e forneça recomendações objetivas e acionáveis.'
          },
          {
            role: 'user',
            content: `Analise o fit entre duas empresas:

PRODUTOS DO TENANT (${tenantProds.length}):
${tenantProds.slice(0, 10).map((p: any) => `- ${p.nome} (${p.categoria || 'Sem categoria'})`).join('\n')}

PRODUTOS DO PROSPECT (${prospectProds.length}):
${prospectProds.slice(0, 10).map((p: any) => `- ${p.nome} (${p.categoria || 'Sem categoria'})`).join('\n')}

PRODUTOS COMPATÍVEIS: ${compatibleProducts.length}
WEBSITE FIT SCORE: ${websiteFitScore}/20

Forneça uma recomendação estratégica objetiva em 2-3 parágrafos sobre:
1. Oportunidades de fit identificadas
2. Pontos de atenção
3. Próximos passos recomendados`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[website-fit-analysis] Erro na API OpenAI:', errorText);
      throw new Error(`Erro na API OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices[0]?.message?.content || 'Não foi possível gerar recomendação.';

    return new Response(
      JSON.stringify({ recommendation }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[website-fit-analysis] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar recomendação' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


