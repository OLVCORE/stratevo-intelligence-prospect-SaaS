/**
 * FIT TOTVS Rules - Aderência por área/linha de produto
 * Áreas: Financeiro, RH, Indústria, Agro, Distribuição, Serviços
 * SEM MOCKS - se não houver sinais, fit baixo com explicação
 */

type FitResult = {
  area: string;
  fit: number;
  signals: Array<{
    signal: string;
    weight: number;
    source: string;
  }>;
  next_steps: string;
};

export async function calculateFitTotvs(companyData: {
  company: any;
  techSignals: any[];
  digitalSignals: any[];
  people: any[];
}): Promise<FitResult[]> {
  const results: FitResult[] = [];

  // 1. FINANCEIRO
  const financeiroSignals = [];
  const hasERP = companyData.techSignals.some((t) =>
    /totvs|sap|oracle|senior|omie/i.test(t.tech_name)
  );
  const hasFinanceKeywords = companyData.digitalSignals.some((d) =>
    /fiscal|contábil|tesouraria|faturamento|nfe|nfse/i.test(d.title || d.snippet || '')
  );
  const hasFinanceRole = companyData.people.some((p) =>
    /cfo|financeiro|controller|contábil/i.test(p.title || '')
  );

  if (hasERP) financeiroSignals.push({ signal: 'ERP já implementado', weight: 40, source: 'tech_signals' });
  if (hasFinanceKeywords)
    financeiroSignals.push({ signal: 'Termos financeiros no site', weight: 20, source: 'digital_signals' });
  if (hasFinanceRole)
    financeiroSignals.push({ signal: 'Decisor financeiro identificado', weight: 30, source: 'people' });

  const financeiroFit = Math.min(100, financeiroSignals.reduce((s, e) => s + e.weight, 0));
  const financeiroSteps = hasERP
    ? 'Demo TOTVS Backoffice para otimização de processos existentes'
    : 'Agendar discovery financeiro e apresentar TOTVS Backoffice';

  results.push({ area: 'Financeiro', fit: financeiroFit, signals: financeiroSignals, next_steps: financeiroSteps });

  // 2. RH
  const rhSignals = [];
  const hasHRTech = companyData.techSignals.some((t) =>
    /gupy|kenoby|sap successfactors|workday/i.test(t.tech_name)
  );
  const hasHRKeywords = companyData.digitalSignals.some((d) =>
    /recursos humanos|rh|folha de pagamento|recrutamento|vagas|carreiras/i.test(d.title || d.snippet || '')
  );
  const hasHRRole = companyData.people.some((p) =>
    /rh|recursos humanos|gente|people|talent/i.test(p.department || p.title || '')
  );

  if (hasHRTech) rhSignals.push({ signal: 'Sistema de RH detectado', weight: 35, source: 'tech_signals' });
  if (hasHRKeywords)
    rhSignals.push({ signal: 'Conteúdo de RH no site', weight: 25, source: 'digital_signals' });
  if (hasHRRole)
    rhSignals.push({ signal: 'Decisor de RH identificado', weight: 30, source: 'people' });

  const rhFit = Math.min(100, rhSignals.reduce((s, e) => s + e.weight, 0));
  const rhSteps = hasHRTech
    ? 'Comparar TOTVS RH com solução atual'
    : 'Agendar discovery RH e apresentar TOTVS RH/Folha';

  results.push({ area: 'RH', fit: rhFit, signals: rhSignals, next_steps: rhSteps });

  // 3. INDÚSTRIA
  const industriaSignals = [];
  const hasManufacturing = companyData.techSignals.some((t) =>
    /mes|scada|plc|erp industrial|totvs manufatura/i.test(t.tech_name)
  );
  const hasIndustryKeywords = companyData.digitalSignals.some((d) =>
    /manufatura|produção|fábrica|industrial|automação|manutenção/i.test(d.title || d.snippet || '')
  );
  const cnae = companyData.company?.metadata?.cnae || '';
  const isIndustry = /^(10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33)/.test(cnae);

  if (hasManufacturing)
    industriaSignals.push({ signal: 'Sistema industrial detectado', weight: 40, source: 'tech_signals' });
  if (hasIndustryKeywords)
    industriaSignals.push({ signal: 'Termos industriais no site', weight: 25, source: 'digital_signals' });
  if (isIndustry)
    industriaSignals.push({ signal: 'CNAE industrial', weight: 30, source: 'company_data' });

  const industriaFit = Math.min(100, industriaSignals.reduce((s, e) => s + e.weight, 0));
  const industriaSteps = hasManufacturing
    ? 'Demo TOTVS Manufatura para otimização de processos'
    : 'Agendar discovery industrial e apresentar TOTVS Manufatura';

  results.push({
    area: 'Indústria',
    fit: industriaFit,
    signals: industriaSignals,
    next_steps: industriaSteps,
  });

  // 4. AGRO
  const agroSignals = [];
  const hasAgroTech = companyData.techSignals.some((t) =>
    /aegro|totvs agro|climate fieldview|agrosmart/i.test(t.tech_name)
  );
  const hasAgroKeywords = companyData.digitalSignals.some((d) =>
    /agronegócio|rural|fazenda|safra|colheita|agropecuária/i.test(d.title || d.snippet || '')
  );
  const isAgro = /^01/.test(cnae);

  if (hasAgroTech) agroSignals.push({ signal: 'Sistema agro detectado', weight: 40, source: 'tech_signals' });
  if (hasAgroKeywords)
    agroSignals.push({ signal: 'Termos agro no site', weight: 25, source: 'digital_signals' });
  if (isAgro) agroSignals.push({ signal: 'CNAE agropecuário', weight: 30, source: 'company_data' });

  const agroFit = Math.min(100, agroSignals.reduce((s, e) => s + e.weight, 0));
  const agroSteps = hasAgroTech
    ? 'Demo TOTVS Agro para otimização'
    : 'Agendar discovery agro e apresentar TOTVS Agro';

  results.push({ area: 'Agro', fit: agroFit, signals: agroSignals, next_steps: agroSteps });

  // 5. DISTRIBUIÇÃO
  const distribuicaoSignals = [];
  const hasWMS = companyData.techSignals.some((t) =>
    /wms|warehouse|logística|totvs distribuição/i.test(t.tech_name)
  );
  const hasDistKeywords = companyData.digitalSignals.some((d) =>
    /distribuição|logística|armazém|estoque|supply chain/i.test(d.title || d.snippet || '')
  );
  const isDist = /^(46|47)/.test(cnae);

  if (hasWMS)
    distribuicaoSignals.push({ signal: 'Sistema WMS/Logística detectado', weight: 40, source: 'tech_signals' });
  if (hasDistKeywords)
    distribuicaoSignals.push({ signal: 'Termos de distribuição no site', weight: 25, source: 'digital_signals' });
  if (isDist)
    distribuicaoSignals.push({ signal: 'CNAE de distribuição/comércio', weight: 30, source: 'company_data' });

  const distribuicaoFit = Math.min(100, distribuicaoSignals.reduce((s, e) => s + e.weight, 0));
  const distribuicaoSteps = hasWMS
    ? 'Apresentar TOTVS Distribuição para otimização'
    : 'Agendar discovery logístico e apresentar TOTVS Distribuição';

  results.push({
    area: 'Distribuição',
    fit: distribuicaoFit,
    signals: distribuicaoSignals,
    next_steps: distribuicaoSteps,
  });

  // 6. SERVIÇOS
  const servicosSignals = [];
  const hasServiceTech = companyData.techSignals.some((t) =>
    /zendesk|freshdesk|jira service|totvs service/i.test(t.tech_name)
  );
  const hasServiceKeywords = companyData.digitalSignals.some((d) =>
    /serviços|atendimento|suporte|consultoria|projetos/i.test(d.title || d.snippet || '')
  );
  const isService = /^(45|49|50|51|52|62|63|68|69|70|71|72|73|74|75|77|78|79|80|81|82|84|85|86|87|88|90|91|92|93|94|95|96)/.test(
    cnae
  );

  if (hasServiceTech)
    servicosSignals.push({ signal: 'Sistema de serviços detectado', weight: 35, source: 'tech_signals' });
  if (hasServiceKeywords)
    servicosSignals.push({ signal: 'Termos de serviços no site', weight: 25, source: 'digital_signals' });
  if (isService)
    servicosSignals.push({ signal: 'CNAE de serviços', weight: 30, source: 'company_data' });

  const servicosFit = Math.min(100, servicosSignals.reduce((s, e) => s + e.weight, 0));
  const servicosSteps = hasServiceTech
    ? 'Apresentar TOTVS Service para otimização'
    : 'Agendar discovery de serviços e apresentar TOTVS Service';

  results.push({
    area: 'Serviços',
    fit: servicosFit,
    signals: servicosSignals,
    next_steps: servicosSteps,
  });

  return results;
}

