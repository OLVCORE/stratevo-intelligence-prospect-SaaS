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

    console.log('[MC9-V2] 🎯 Hunter planner iniciado...', { tenantId, icpId });

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
      console.error('[MC9-V2] ❌ Erro ao buscar relatórios:', reportsError);
      throw new Error(`Erro ao buscar relatórios: ${reportsError.message}`);
    }

    const totalReports = reports?.length || 0;
    console.log(`[MC9-V2] 📊 Total de relatórios encontrados: ${totalReports}`);

    // 2. Processar relatórios e calcular distribuição (mesma lógica do MC9 V1)
    const byLevel = { ALTA: 0, MEDIA: 0, BAIXA: 0, DESCARTAR: 0 };
    const sectorsMap = new Map<string, number>();
    const regionsMap = new Map<string, number>();
    const examplesHighFit: any[] = [];
    const examplesMediumFit: any[] = [];

    for (const report of reports || []) {
      const reportData = report.report_data || {};
      const mc8Assessment = reportData.mc8Assessment;

      if (!mc8Assessment) {
        byLevel.BAIXA++;
        continue;
      }

      const level = mc8Assessment.level || 'BAIXA';
      byLevel[level as keyof typeof byLevel]++;

      // Extrair dados da empresa
      const empresa = reportData.icp_metadata || reportData.onboarding_data?.step1_DadosBasicos || {};
      const companyName = empresa.companyName || empresa.razaoSocial || 'Empresa não identificada';
      const sector = empresa.setorAtual || reportData.onboarding_data?.step2_SetoresNichos?.sectorAtual || null;
      const uf = empresa.uf || reportData.onboarding_data?.step1_DadosBasicos?.endereco?.estado || null;

      if (sector) {
        sectorsMap.set(sector, (sectorsMap.get(sector) || 0) + 1);
      }
      if (uf) {
        regionsMap.set(uf, (regionsMap.get(uf) || 0) + 1);
      }

      // Coletar exemplos
      if (level === 'ALTA' && examplesHighFit.length < 5) {
        examplesHighFit.push({ companyName, sector, uf });
      } else if (level === 'MEDIA' && examplesMediumFit.length < 5) {
        examplesMediumFit.push({ companyName, sector, uf });
      }
    }

    // Calcular setores e regiões predominantes
    const mainSectors = Array.from(sectorsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sector]) => sector);

    const mainRegions = Array.from(regionsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uf]) => uf);

    // 3. Calcular decisão MC9 (mesma lógica do MC9 V1)
    const total = byLevel.ALTA + byLevel.MEDIA + byLevel.BAIXA + byLevel.DESCARTAR;
    const altaPercent = total > 0 ? (byLevel.ALTA / total) * 100 : 0;
    const altaMediaPercent = total > 0 ? ((byLevel.ALTA + byLevel.MEDIA) / total) * 100 : 0;
    const baixaDescartarPercent = total > 0 ? ((byLevel.BAIXA + byLevel.DESCARTAR) / total) * 100 : 0;

    let mc9GlobalDecision: 'SIM' | 'NAO' | 'PARCIAL' = 'PARCIAL';
    if (altaPercent >= 30 || altaMediaPercent >= 50) {
      mc9GlobalDecision = 'SIM';
    } else if (baixaDescartarPercent >= 60 || total === 0) {
      mc9GlobalDecision = 'NAO';
    }

    // 4. Buscar dados do ICP
    const { data: icpMetadata } = await supabase
      .from('icp_profiles_metadata')
      .select('*')
      .eq('id', icpId)
      .eq('tenant_id', tenantId)
      .single();

    // 5. Montar payload para IA
    const portfolio = {
      totalCompanies: totalReports,
      byLevel,
      sectors: mainSectors,
      regions: mainRegions,
      examplesHighFit,
      examplesMediumFit,
    };

    const icp = icpMetadata ? {
      nome: icpMetadata.nome,
      descricao: icpMetadata.descricao,
      tipo: icpMetadata.tipo,
      setor_foco: icpMetadata.setor_foco,
      nicho_foco: icpMetadata.nicho_foco,
    } : null;

    // 6. Construir prompt para IA
    const systemPrompt = `Você é um arquiteto de prospecção B2B.

Recebe a configuração de ICP de um tenant e a distribuição real de empresas da carteira atual, já classificadas por nível de fit (ALTA/MEDIA/BAIXA/DESCARTAR) a partir de MC8 e MC9.

Seu objetivo é criar um PLANO DE HUNTING, sem executar nenhuma busca.

Você deve devolver:

– clusters de empresas ideais para hunting externo;
– consultas prontas para canais como LinkedIn, Apollo, Google e plataformas de vagas;
– um template de planilha para registrar empresas encontradas;
– orientações práticas para o operador humano que vai usar o plano.

Sempre responda APENAS com JSON válido no formato especificado, sem texto fora do JSON.

**FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):**
{
  "icpId": "string",
  "decisionFromMC9": "SIM | NAO | PARCIAL",
  "summary": {
    "mainSectors": ["..."],
    "mainRegions": ["..."],
    "highFitCount": 0,
    "mediumFitCount": 0
  },
  "clusters": [
    {
      "name": "string",
      "rationale": "string",
      "idealTitles": ["..."],
      "idealDepartments": ["..."],
      "idealCompanyAttributes": ["..."]
    }
  ],
  "queries": [
    {
      "channel": "LINKEDIN | APOLLO | GOOGLE | JOB_BOARD",
      "label": "string",
      "description": "string",
      "query": "string"
    }
  ],
  "spreadsheetTemplate": {
    "columns": ["..."],
    "notes": "string"
  },
  "notesForOperator": "string",
  "generatedAt": "ISO timestamp"
}

**REGRAS:**
- Crie 2-4 clusters baseados nos setores/regiões predominantes
- Para cada cluster, gere 1-2 queries por canal (LinkedIn, Apollo, Google, Job Board)
- Queries devem ser boolean/keyword queries prontas para copiar e colar
- Template de planilha deve ter colunas práticas para registro de empresas encontradas
- NotesForOperator deve ser orientação prática e acionável`;

    const userPrompt = `Crie um plano de hunting para este ICP:

**ICP:**
${JSON.stringify(icp, null, 2)}

**PORTFÓLIO ANALISADO:**
${JSON.stringify(portfolio, null, 2)}

**DECISÃO MC9:**
${mc9GlobalDecision}

Use os dados acima para:
1. Criar clusters de empresas ideais para hunting (2-4 clusters)
2. Gerar queries prontas para LinkedIn, Apollo, Google e Job Boards
3. Criar template de planilha com colunas práticas
4. Fornecer orientações práticas para o operador

Responda APENAS com JSON válido, sem markdown, sem explicações adicionais.`;

    // 7. Chamar OpenAI
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
      console.error('[MC9-V2] ❌ Erro OpenAI:', openaiResponse.status, errorText);
      throw new Error(`Erro ao chamar OpenAI (${openaiResponse.status}): ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResult = JSON.parse(openaiData.choices[0].message.content);

    // 8. Validar e mesclar resultado
    const validatedResult = {
      icpId: aiResult.icpId || icpId,
      decisionFromMC9: aiResult.decisionFromMC9 || mc9GlobalDecision,
      summary: {
        mainSectors: aiResult.summary?.mainSectors || mainSectors,
        mainRegions: aiResult.summary?.mainRegions || mainRegions,
        highFitCount: aiResult.summary?.highFitCount || byLevel.ALTA,
        mediumFitCount: aiResult.summary?.mediumFitCount || byLevel.MEDIA,
      },
      clusters: Array.isArray(aiResult.clusters) ? aiResult.clusters : [],
      queries: Array.isArray(aiResult.queries) ? aiResult.queries : [],
      spreadsheetTemplate: aiResult.spreadsheetTemplate || {
        columns: ['Empresa', 'CNPJ', 'Website', 'Setor', 'UF', 'Cidade', 'Contato principal', 'Cargo', 'LinkedIn URL', 'Origem da prospecção', 'Cluster MC9', 'Observações'],
        notes: 'Use esta planilha para registrar empresas encontradas nas buscas externas. Cada linha deve representar uma empresa única.',
      },
      notesForOperator: aiResult.notesForOperator || 'Siga os clusters e queries gerados, priorizando empresas de fit ALTO.',
      generatedAt: aiResult.generatedAt || new Date().toISOString(),
    };

    console.log('[MC9-V2] ✅ Hunter planner concluído:', {
      clustersCount: validatedResult.clusters.length,
      queriesCount: validatedResult.queries.length,
    });

    return new Response(
      JSON.stringify({ result: validatedResult }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[MC9-V2] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

