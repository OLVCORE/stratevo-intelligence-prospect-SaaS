/**
 * Maturity Rules - Régua determinística de maturidade
 * 6 pilares: Infra, Dados, Processos, Sistemas, Pessoas, Cultura
 * SEM MOCKS - se não houver sinais, score baixo com explicação
 */

type Evidence = {
  signal: string;
  weight: number;
  source: string;
  url?: string;
  when?: string;
};

type PillarResult = {
  pillar: string;
  score: number;
  evidence: Evidence[];
  recommendations: Array<{
    recommendation: string;
    rationale: string;
    priority: 'baixa' | 'média' | 'alta';
  }>;
};

export async function calculateMaturityScores(companyData: {
  techSignals: any[];
  digitalSignals: any[];
  people: any[];
  leads: any[];
  messages: any[];
}): Promise<PillarResult[]> {
  const results: PillarResult[] = [];

  // 1. INFRA
  const infraEvidence: Evidence[] = [];
  const hasCDN = companyData.techSignals.some((t) =>
    /cloudflare|cloudfront|fastly|akamai/i.test(t.tech_name)
  );
  const hasCloud = companyData.techSignals.some((t) =>
    /aws|azure|gcp|vercel|heroku/i.test(t.tech_name)
  );

  if (hasCDN) {
    infraEvidence.push({
      signal: 'CDN detectado (Cloudflare/CloudFront)',
      weight: 20,
      source: 'tech_signals',
    });
  }
  if (hasCloud) {
    infraEvidence.push({
      signal: 'Cloud provider detectado',
      weight: 30,
      source: 'tech_signals',
    });
  }

  const infraScore = Math.min(
    100,
    infraEvidence.reduce((sum, e) => sum + e.weight, 0)
  );
  const infraRecos = [];
  if (!hasCDN) {
    infraRecos.push({
      recommendation: 'Implementar CDN para melhor performance',
      rationale: 'Nenhum CDN detectado. CDN reduz latência e melhora experiência do usuário.',
      priority: 'média' as const,
    });
  }
  if (!hasCloud) {
    infraRecos.push({
      recommendation: 'Migrar para cloud provider (AWS/Azure/GCP)',
      rationale: 'Infraestrutura não está em cloud. Cloud oferece escalabilidade e confiabilidade.',
      priority: 'alta' as const,
    });
  }

  results.push({ pillar: 'infra', score: infraScore, evidence: infraEvidence, recommendations: infraRecos });

  // 2. DADOS
  const dadosEvidence: Evidence[] = [];
  const hasAnalytics = companyData.techSignals.some((t) =>
    /google analytics|hotjar|mixpanel|amplitude/i.test(t.tech_name)
  );
  const hasBigData = companyData.techSignals.some((t) =>
    /bigquery|snowflake|redshift|databricks/i.test(t.tech_name)
  );

  if (hasAnalytics) {
    dadosEvidence.push({
      signal: 'Analytics implementado (GA/Hotjar)',
      weight: 25,
      source: 'tech_signals',
    });
  }
  if (hasBigData) {
    dadosEvidence.push({
      signal: 'Plataforma de Big Data detectada',
      weight: 35,
      source: 'tech_signals',
    });
  }

  const dadosScore = Math.min(
    100,
    dadosEvidence.reduce((sum, e) => sum + e.weight, 0)
  );
  const dadosRecos = [];
  if (!hasAnalytics) {
    dadosRecos.push({
      recommendation: 'Implementar ferramenta de analytics (Google Analytics, Hotjar)',
      rationale: 'Sem analytics detectado. Dados são essenciais para tomada de decisão.',
      priority: 'alta' as const,
    });
  }

  results.push({ pillar: 'dados', score: dadosScore, evidence: dadosEvidence, recommendations: dadosRecos });

  // 3. PROCESSOS
  const processosEvidence: Evidence[] = [];
  const hasActiveSDR = companyData.messages.length > 0;
  const hasLeads = companyData.leads.length > 0;

  if (hasActiveSDR) {
    processosEvidence.push({
      signal: 'SDR ativo (mensagens enviadas)',
      weight: 30,
      source: 'messages',
    });
  }
  if (hasLeads) {
    processosEvidence.push({
      signal: 'Pipeline de leads estruturado',
      weight: 20,
      source: 'leads',
    });
  }

  const processosScore = Math.min(
    100,
    processosEvidence.reduce((sum, e) => sum + e.weight, 0)
  );
  const processosRecos = [];
  if (!hasLeads) {
    processosRecos.push({
      recommendation: 'Estruturar pipeline de vendas com leads',
      rationale: 'Sem pipeline estruturado. Leads organizados aumentam taxa de conversão.',
      priority: 'alta' as const,
    });
  }

  results.push({
    pillar: 'processos',
    score: processosScore,
    evidence: processosEvidence,
    recommendations: processosRecos,
  });

  // 4. SISTEMAS
  const sistemasEvidence: Evidence[] = [];
  const hasERP = companyData.techSignals.some((t) =>
    /totvs|sap|oracle|salesforce|hubspot|pipedrive/i.test(t.tech_name)
  );
  const hasCRM = companyData.techSignals.some((t) =>
    /salesforce|hubspot|pipedrive|zoho|rdstation/i.test(t.tech_name)
  );

  if (hasERP) {
    sistemasEvidence.push({
      signal: 'ERP detectado (TOTVS/SAP/Oracle)',
      weight: 40,
      source: 'tech_signals',
    });
  }
  if (hasCRM) {
    sistemasEvidence.push({
      signal: 'CRM detectado (Salesforce/HubSpot)',
      weight: 30,
      source: 'tech_signals',
    });
  }

  const sistemasScore = Math.min(
    100,
    sistemasEvidence.reduce((sum, e) => sum + e.weight, 0)
  );
  const sistemasRecos = [];
  if (!hasERP) {
    sistemasRecos.push({
      recommendation: 'Implementar ERP (TOTVS Backoffice)',
      rationale: 'Sem ERP detectado. ERP centraliza gestão financeira e operacional.',
      priority: 'alta' as const,
    });
  }
  if (!hasCRM) {
    sistemasRecos.push({
      recommendation: 'Implementar CRM para gestão de relacionamento',
      rationale: 'Sem CRM detectado. CRM melhora conversão e retenção de clientes.',
      priority: 'média' as const,
    });
  }

  results.push({
    pillar: 'sistemas',
    score: sistemasScore,
    evidence: sistemasEvidence,
    recommendations: sistemasRecos,
  });

  // 5. PESSOAS
  const pessoasEvidence: Evidence[] = [];
  const hasCLevel = companyData.people.some((p) => /c-level|ceo|cto|cio|coo/i.test(p.seniority || ''));
  const hasVerifiedContacts = companyData.people.some((p) =>
    p.person_contacts?.some((c: any) => c.verified)
  );

  if (hasCLevel) {
    pessoasEvidence.push({
      signal: 'Decisores C-level identificados',
      weight: 35,
      source: 'people',
    });
  }
  if (hasVerifiedContacts) {
    pessoasEvidence.push({
      signal: 'Contatos verificados disponíveis',
      weight: 25,
      source: 'person_contacts',
    });
  }

  const pessoasScore = Math.min(
    100,
    pessoasEvidence.reduce((sum, e) => sum + e.weight, 0)
  );
  const pessoasRecos = [];
  if (!hasCLevel) {
    pessoasRecos.push({
      recommendation: 'Identificar decisores C-level (use Apollo.io)',
      rationale: 'Sem decisores C-level mapeados. Acesso a tomadores de decisão acelera vendas.',
      priority: 'alta' as const,
    });
  }

  results.push({
    pillar: 'pessoas',
    score: pessoasScore,
    evidence: pessoasEvidence,
    recommendations: pessoasRecos,
  });

  // 6. CULTURA
  const culturaEvidence: Evidence[] = [];
  const hasRecentContent = companyData.digitalSignals.some((d) => {
    const daysOld = (Date.now() - new Date(d.collected_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld < 90;
  });
  const hasModernFramework = companyData.techSignals.some((t) =>
    /next\.js|react|vue|angular/i.test(t.tech_name)
  );

  if (hasRecentContent) {
    culturaEvidence.push({
      signal: 'Site/conteúdo atualizado recentemente',
      weight: 25,
      source: 'digital_signals',
    });
  }
  if (hasModernFramework) {
    culturaEvidence.push({
      signal: 'Framework moderno (Next.js/React)',
      weight: 30,
      source: 'tech_signals',
    });
  }

  const culturaScore = Math.min(
    100,
    culturaEvidence.reduce((sum, e) => sum + e.weight, 0)
  );
  const culturaRecos = [];
  if (!hasModernFramework) {
    culturaRecos.push({
      recommendation: 'Modernizar stack tecnológico',
      rationale: 'Stack desatualizado. Tecnologias modernas facilitam inovação e atração de talentos.',
      priority: 'média' as const,
    });
  }

  results.push({
    pillar: 'cultura',
    score: culturaScore,
    evidence: culturaEvidence,
    recommendations: culturaRecos,
  });

  return results;
}

