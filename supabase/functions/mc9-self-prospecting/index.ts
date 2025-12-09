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
    const { icpId, tenantId } = await req.json();

    console.log('[MC9] 🚀 Self-prospecting iniciado...', { tenantId, icpId });

    if (!icpId || !tenantId) {
      throw new Error('icpId e tenantId são obrigatórios');
    }

    // Obter chave OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada no Supabase Secrets');
    }

    // Criar cliente Supabase server-side
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar todos os icp_reports deste ICP/tenant
    const { data: reports, error: reportsError } = await supabase
      .from('icp_reports')
      .select('*')
      .eq('icp_profile_metadata_id', icpId)
      .eq('tenant_id', tenantId)
      .order('generated_at', { ascending: false });

    if (reportsError) {
      console.error('[MC9] ❌ Erro ao buscar relatórios:', reportsError);
      throw new Error(`Erro ao buscar relatórios: ${reportsError.message}`);
    }

    const totalReports = reports?.length || 0;
    console.log(`[MC9] 📊 Total de relatórios encontrados: ${totalReports}`);

    if (totalReports === 0) {
      // Retornar resultado vazio mas válido
      return new Response(
        JSON.stringify({
          result: {
            decision: 'NAO',
            confidence: 0.0,
            rationale: 'Nenhum relatório ICP encontrado para este ICP. Execute análises ICP primeiro antes de rodar o MC9.',
            summary: {
              totalCompanies: 0,
              byLevel: { ALTA: 0, MEDIA: 0, BAIXA: 0, DESCARTAR: 0 },
              mainSectors: [],
              mainRegions: [],
            },
            topTargets: [],
            scripts: {
              highFitScript: 'Execute análises ICP primeiro para gerar scripts de abordagem.',
              mediumFitScript: 'Execute análises ICP primeiro para gerar scripts de abordagem.',
            },
            generatedAt: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Processar relatórios e extrair dados MC8
    const portfolioData: any[] = [];
    const byLevel = { ALTA: 0, MEDIA: 0, BAIXA: 0, DESCARTAR: 0 };
    const sectorsMap = new Map<string, number>();
    const regionsMap = new Map<string, number>();
    const topTargets: any[] = [];

    for (const report of reports || []) {
      const reportData = report.report_data || {};
      const mc8Assessment = reportData.mc8Assessment;

      if (!mc8Assessment) {
        // Se não tem MC8, tratar como BAIXA com confidence baixa
        byLevel.BAIXA++;
        continue;
      }

      const level = mc8Assessment.level || 'BAIXA';
      const confidence = mc8Assessment.confidence || 0;

      byLevel[level as keyof typeof byLevel]++;

      // Extrair dados da empresa do report_data
      const empresa = reportData.icp_metadata || reportData.onboarding_data?.step1_DadosBasicos || {};
      const companyId = empresa.companyId || report.id; // Fallback para report.id se não houver companyId
      const companyName = empresa.companyName || empresa.razaoSocial || 'Empresa não identificada';
      const cnpj = empresa.cnpj || '';
      const uf = empresa.uf || reportData.onboarding_data?.step1_DadosBasicos?.endereco?.estado || null;
      const sector = empresa.setorAtual || reportData.onboarding_data?.step2_SetoresNichos?.sectorAtual || null;

      // Contar setores e regiões
      if (sector) {
        sectorsMap.set(sector, (sectorsMap.get(sector) || 0) + 1);
      }
      if (uf) {
        regionsMap.set(uf, (regionsMap.get(uf) || 0) + 1);
      }

      // Adicionar aos top targets (priorizar ALTA depois MEDIA)
      if (level === 'ALTA' || level === 'MEDIA') {
        topTargets.push({
          companyId,
          companyName,
          cnpj,
          mc8Level: level,
          mc8Confidence: confidence,
          uf,
          sector,
        });
      }

      portfolioData.push({
        companyId,
        companyName,
        level,
        confidence,
        sector,
        uf,
      });
    }

    // Ordenar top targets: ALTA primeiro, depois por confidence
    topTargets.sort((a, b) => {
      if (a.mc8Level === 'ALTA' && b.mc8Level !== 'ALTA') return -1;
      if (a.mc8Level !== 'ALTA' && b.mc8Level === 'ALTA') return 1;
      return b.mc8Confidence - a.mc8Confidence;
    });

    // Top 20 alvos
    const finalTopTargets = topTargets.slice(0, 20);

    // Calcular setores e regiões predominantes (top 5)
    const mainSectors = Array.from(sectorsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sector]) => sector);

    const mainRegions = Array.from(regionsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uf]) => uf);

    // 3. Buscar dados do ICP para contexto
    const { data: icpMetadata } = await supabase
      .from('icp_profiles_metadata')
      .select('*')
      .eq('id', icpId)
      .eq('tenant_id', tenantId)
      .single();

    // 4. Montar payload para IA
    const portfolio = {
      totalCompanies: totalReports,
      byLevel,
      sectors: mainSectors,
      regions: mainRegions,
      sampleHighFit: portfolioData.filter(p => p.level === 'ALTA').slice(0, 5),
      sampleMediumFit: portfolioData.filter(p => p.level === 'MEDIA').slice(0, 5),
    };

    const icp = icpMetadata ? {
      nome: icpMetadata.nome,
      descricao: icpMetadata.descricao,
      tipo: icpMetadata.tipo,
      setor_foco: icpMetadata.setor_foco,
      nicho_foco: icpMetadata.nicho_foco,
    } : null;

    // 5. Construir prompt para IA
    const systemPrompt = `Você é um estrategista de prospecção B2B.

Recebe a distribuição de empresas em uma carteira, classificadas por nível de fit (ALTA/MEDIA/BAIXA/DESCARTAR) a partir de uma análise anterior (MC8).

Seu objetivo é dizer se vale a pena perseguir este ICP como prioridade, gerar uma decisão global (SIM, PARCIAL ou NAO), explicar por quê, indicar onde estão as melhores oportunidades (setores/regiões) e propor um script de abordagem inicial para empresas de fit ALTO e MÉDIO.

Sempre responda APENAS com JSON válido no formato especificado, sem texto fora do JSON.

**REGRAS DE DECISÃO:**
- SIM: Se houver uma proporção significativa de empresas com fit ALTA (≥30% do total) OU se a soma de ALTA+MEDIA for ≥50% do total
- PARCIAL: Se houver empresas com fit ALTA/MEDIA mas em proporção menor, ou se houver potencial mas com restrições claras
- NAO: Se a maioria for BAIXA/DESCARTAR (≥60% do total) ou se não houver dados suficientes

**FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):**
{
  "decision": "SIM | NAO | PARCIAL",
  "confidence": 0.0 a 1.0,
  "rationale": "explicação em texto corrido, sem bullets, de 4-6 linhas",
  "summary": {
    "totalCompanies": 0,
    "byLevel": {
      "ALTA": 0,
      "MEDIA": 0,
      "BAIXA": 0,
      "DESCARTAR": 0
    },
    "mainSectors": ["..."],
    "mainRegions": ["..."]
  },
  "topTargets": [...lista de alvos já fornecida, você pode validar/ordenar mas não alterar IDs...],
  "scripts": {
    "highFitScript": "texto do script para empresas de Fit ALTO, 3-4 parágrafos, tom profissional mas direto",
    "mediumFitScript": "texto do script para empresas de Fit MÉDIO, 3-4 parágrafos, tom profissional mas direto"
  },
  "generatedAt": "ISO timestamp"
}`;

    const userPrompt = `Avalie se vale a pena perseguir este ICP como prioridade:

**ICP:**
${JSON.stringify(icp, null, 2)}

**PORTFÓLIO ANALISADO:**
${JSON.stringify(portfolio, null, 2)}

**TOP ALVOS RECOMENDADOS (já ordenados por fit e confidence):**
${JSON.stringify(finalTopTargets, null, 2)}

Use os dados acima para:
1. Decidir se vale a pena perseguir (SIM/PARCIAL/NAO)
2. Explicar o porquê da decisão
3. Validar/confirmar a lista de top alvos (não alterar IDs, apenas validar se faz sentido)
4. Gerar scripts de abordagem específicos para fit ALTO e fit MÉDIO

Responda APENAS com JSON válido, sem markdown, sem explicações adicionais.`;

    // 6. Chamar OpenAI
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
      console.error('[MC9] ❌ Erro OpenAI:', openaiResponse.status, errorText);
      throw new Error(`Erro ao chamar OpenAI (${openaiResponse.status}): ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResult = JSON.parse(openaiData.choices[0].message.content);

    // 7. Validar e mesclar resultado da IA com top targets calculados
    const validatedResult = {
      decision: aiResult.decision || 'PARCIAL',
      confidence: Math.max(0, Math.min(1, aiResult.confidence || 0.5)),
      rationale: aiResult.rationale || 'Avaliação realizada com base nos dados disponíveis',
      summary: {
        totalCompanies: portfolio.totalCompanies,
        byLevel: portfolio.byLevel,
        mainSectors: aiResult.summary?.mainSectors || mainSectors,
        mainRegions: aiResult.summary?.mainRegions || mainRegions,
      },
      // Usar top targets calculados (não os da IA, para garantir IDs corretos)
      topTargets: finalTopTargets,
      scripts: {
        highFitScript: aiResult.scripts?.highFitScript || 'Script não disponível',
        mediumFitScript: aiResult.scripts?.mediumFitScript || 'Script não disponível',
      },
      generatedAt: aiResult.generatedAt || new Date().toISOString(),
    };

    console.log('[MC9] ✅ Self-prospecting concluído:', {
      decision: validatedResult.decision,
      confidence: validatedResult.confidence,
      totalTargets: validatedResult.topTargets.length,
    });

    return new Response(
      JSON.stringify({ result: validatedResult }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[MC9] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

