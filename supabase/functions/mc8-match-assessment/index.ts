import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Tratar OPTIONS primeiro
  if (req.method === 'OPTIONS') {
    return new Response('', { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { tenantId, icpReportId, empresa, onboarding, relatorioICP, configTenant, features } = await req.json();

    console.log('[MC8-V2] 🚀 Iniciando avaliação MC8 V2 (Laser Precision)...', { 
      tenantId, 
      icpReportId,
      features: features || 'não fornecido (fallback para V1)'
    });

    // Obter chave OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada no Supabase Secrets');
    }

    // MC8 V2: Construir prompt refinado com features numéricas
    const hasFeatures = features && typeof features === 'object';
    const featureVector = hasFeatures ? features : null;
    
    // Calcular média ponderada das features (se disponível)
    let averageFeatureScore = 0.5;
    if (featureVector) {
      const weights = {
        segmentFit: 0.25,
        sizeFit: 0.20,
        regionFit: 0.15,
        stackFit: 0.15,
        digitalMaturity: 0.10,
        historySignal: 0.05,
        dataCompleteness: 0.10, // Usado para ajustar confidence
      };
      
      averageFeatureScore = 
        (featureVector.segmentFit || 0) * weights.segmentFit +
        (featureVector.sizeFit || 0) * weights.sizeFit +
        (featureVector.regionFit || 0) * weights.regionFit +
        (featureVector.stackFit || 0) * weights.stackFit +
        (featureVector.digitalMaturity || 0) * weights.digitalMaturity +
        (featureVector.historySignal || 0) * weights.historySignal;
    }
    
    const systemPrompt = `Você é um Analista Sênior de Inteligência Comercial B2B, especializado em avaliar o fit estratégico de empresas para carteiras de clientes.

**RESPONSABILIDADE (MC8 V2 - Laser Precision):**
Avaliar se uma empresa (ICP analisado) faz sentido para a carteira atual do tenant, usando uma combinação de:
1. Dados estruturados da empresa (CNAE, porte, região, etc.)
2. Configuração do ICP desejado (setores, nichos, ticket alvo, etc.)
3. **Vetor de features numéricas (0-1)** que já sintetiza o quão bom é o ajuste em dimensões específicas:
   - segmentFit: Match entre CNAE/setor e setores prioritários
   - sizeFit: Porte/faturamento vs. ticket alvo
   - regionFit: UF/região vs. regiões prioritárias
   - stackFit: Uso de stack principal (cross-sell/upsell ou desqualificação)
   - digitalMaturity: Presença digital (site, LinkedIn, sinais de tecnologia)
   - historySignal: Histórico de interação
   - dataCompleteness: Proporção de campos críticos preenchidos

**FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):**
{
  "level": "ALTA" | "MEDIA" | "BAIXA" | "DESCARTAR",
  "confidence": 0.0 a 1.0,
  "rationale": "Texto explicativo de 4-6 linhas explicando a decisão, citando dados específicos e features",
  "bestAngles": ["ângulo 1", "ângulo 2", "ângulo 3"],
  "recommendedNextStep": "Ação recomendada (ex: 'Sequência ativa', 'Nurturing', 'Aguardar mais informações')",
  "risks": ["risco 1", "risco 2"],
  "updatedAt": "ISO timestamp"
}

**REGRAS DE DECISÃO (MC8 V2):**
Use o vetor de features como base numérica para uma avaliação **consistente e repetível**:

- **ALTA**: Média ponderada das features ≥ 0.75 E dataCompleteness ≥ 0.6
  → Alinhamento forte em múltiplas dimensões (setor, porte, região, maturidade)
  
- **MEDIA**: Média ponderada entre 0.55 e 0.75 OU features mistas (algumas altas, outras baixas)
  → Alinhamento parcial, mas com potencial claro
  
- **BAIXA**: Média ponderada entre 0.35 e 0.55 OU dataCompleteness < 0.4
  → Pouco alinhamento, mas não necessariamente descartável (pode melhorar com mais dados)
  
- **DESCARTAR**: Média ponderada < 0.35 E dataCompleteness ≥ 0.5
  → Não faz sentido para a carteira atual (dados suficientes para descartar)

**IMPORTANTE:**
- Se dataCompleteness < 0.4, reduza a confidence proporcionalmente
- Se muitos dados faltarem, mencione isso explicitamente no rationale
- Mantenha coerência: se o vetor de features indica fit alto, o level deve ser ALTA ou MEDIA
- Seja específico: cite features e dados reais (ex: "segmentFit 0.8 indica match forte no setor")
- Não invente dados: se informação não existir, mencione "informação não disponível"
- Use o vetor de features para fundamentar sua decisão, não apenas os dados brutos`;

    const userPrompt = `Avalie o fit estratégico desta empresa para a carteira atual usando o vetor de features numéricas:

**EMPRESA:**
${JSON.stringify(empresa, null, 2)}

**ONBOARDING (ICP Desejado):**
${JSON.stringify(onboarding, null, 2)}

**RELATÓRIO ICP EXISTENTE:**
${JSON.stringify(relatorioICP, null, 2)}

**CONFIGURAÇÃO DO TENANT:**
${JSON.stringify(configTenant, null, 2)}

${hasFeatures ? `**VETOR DE FEATURES (MC8 V2):**
${JSON.stringify(featureVector, null, 2)}

**MÉDIA PONDERADA SUGERIDA:** ${averageFeatureScore.toFixed(2)}

Use este vetor como base numérica para sua avaliação. Se a média estiver alta (≥0.75), tenda para ALTA; se estiver baixa (<0.35), considere BAIXA ou DESCARTAR.` : `**NOTA:** Vetor de features não disponível. Use os dados brutos acima para avaliar.`}

Responda APENAS com JSON válido, sem markdown, sem explicações adicionais.`;

    // Chamar OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[MC8] ❌ Erro OpenAI:', openaiResponse.status, errorText);
      throw new Error(`Erro ao chamar OpenAI (${openaiResponse.status}): ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const assessment = JSON.parse(openaiData.choices[0].message.content);

    // Validar assessment
    if (!assessment.level || !['ALTA', 'MEDIA', 'BAIXA', 'DESCARTAR'].includes(assessment.level)) {
      throw new Error('Nível de fit inválido retornado pela IA');
    }

    if (typeof assessment.confidence !== 'number' || assessment.confidence < 0 || assessment.confidence > 1) {
      assessment.confidence = Math.max(0, Math.min(1, assessment.confidence || 0.5));
    }

    // Garantir campos obrigatórios
    const validatedAssessment = {
      level: assessment.level,
      confidence: assessment.confidence,
      rationale: assessment.rationale || 'Avaliação realizada com base nos dados disponíveis',
      bestAngles: Array.isArray(assessment.bestAngles) ? assessment.bestAngles : [],
      recommendedNextStep: assessment.recommendedNextStep || 'Aguardar mais informações',
      risks: Array.isArray(assessment.risks) ? assessment.risks : [],
      updatedAt: assessment.updatedAt || new Date().toISOString(),
    };

    // MC8 V2: Ajustar confidence baseado em dataCompleteness se features disponíveis
    if (featureVector && featureVector.dataCompleteness < 0.4) {
      validatedAssessment.confidence = Math.max(0.3, validatedAssessment.confidence * featureVector.dataCompleteness);
    }
    
    console.log('[MC8-V2] ✅ Avaliação concluída:', {
      level: validatedAssessment.level,
      confidence: validatedAssessment.confidence,
      averageFeatureScore: hasFeatures ? averageFeatureScore.toFixed(2) : 'N/A',
      dataCompleteness: featureVector?.dataCompleteness?.toFixed(2) || 'N/A',
    });

    return new Response(
      JSON.stringify({ assessment: validatedAssessment }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[MC8] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

