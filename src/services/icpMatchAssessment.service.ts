/**
 * MC8 V2 (Laser Precision): Serviço de Avaliação Estratégica de Fit para Carteira Atual
 * 
 * V2 = Combinação de regra + IA, com critério explícito, consistente e repetível.
 * 
 * Avalia se um ICP faz sentido para a carteira atual do tenant e retorna:
 * - Nível de fit (ALTA/MEDIA/BAIXA/DESCARTAR)
 * - Confiança (0-1)
 * - Fundamentação (rationale)
 * - Melhores ângulos de abordagem
 * - Próximo passo recomendado
 * - Riscos identificados
 * 
 * V2 adiciona: vetor de features numéricas (0-1) que sintetiza o fit em dimensões específicas.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ICPReportRow, MC8MatchAssessment } from '@/types/icp';

/**
 * MC8 V2: Vetor de features numéricas que sintetiza o fit em dimensões específicas.
 * Cada feature é um score de 0 a 1, onde 1 = fit perfeito, 0 = sem fit.
 * 
 * Esta função NÃO faz nenhuma chamada externa; apenas transforma dados
 * em um vetor numérico padronizado para uso pela IA no MC8 V2.
 */
export interface MC8FeatureVector {
  segmentFit: number;          // 0–1: Match entre CNAE/setor e setores prioritários do ICP
  sizeFit: number;             // 0–1: Porte/faturamento vs. ticket alvo
  regionFit: number;            // 0–1: UF/região vs. regiões prioritárias
  stackFit: number;            // 0–1: Uso de stack principal (cross-sell/upsell ou desqualificação)
  digitalMaturity: number;     // 0–1: Presença digital (site, LinkedIn, sinais de tecnologia)
  historySignal: number;       // 0–1: Histórico de interação (já contatado, tentativas, etc.)
  dataCompleteness: number;    // 0–1: Proporção de campos críticos preenchidos
}

/**
 * Executa avaliação MC8 para um ICP Report
 */
export async function runMC8MatchAssessment(params: {
  icpReport: ICPReportRow;
  tenantId: string;
}): Promise<MC8MatchAssessment> {
  const { icpReport, tenantId } = params;

  console.log('[MC8-V2] 🚀 Iniciando avaliação MC8 V2 (Laser Precision)...', {
    icpReportId: icpReport.id,
    tenantId,
  });

  try {
    // MC8 V2: Calcular vetor de features antes de montar payload
    const features = computeMC8FeatureVector({ icpReport });
    console.log('[MC8-V2] 📊 Features calculadas:', features);
    
    // Preparar payload com dados do ICP + features
    const payload = buildMC8Payload(icpReport, tenantId, features);

    // Chamar Edge Function
    const { data, error } = await supabase.functions.invoke('mc8-match-assessment', {
      body: payload,
    });

    if (error) {
      console.error('[MC8-V2] ❌ Erro na Edge Function:', error);
      throw new Error(`Erro ao executar MC8: ${error.message}`);
    }

    if (!data || !data.assessment) {
      throw new Error('Resposta inválida da Edge Function');
    }

    // Validar e retornar assessment
    const assessment = validateMC8Assessment(data.assessment);
    
    console.log('[MC8-V2] ✅ Avaliação concluída:', {
      level: assessment.level,
      confidence: assessment.confidence,
    });

    return assessment;
  } catch (error: any) {
    console.error('[MC8-V2] ❌ Erro ao executar avaliação:', error);
    throw error;
  }
}

/**
 * MC8 V2: Calcula vetor de features numéricas para avaliação precisa
 */
function computeMC8FeatureVector(params: {
  icpReport: ICPReportRow;
}): MC8FeatureVector {
  const { icpReport } = params;
  const { report_data } = icpReport;
  
  // Contador de campos críticos preenchidos
  let fieldsCount = 0;
  let fieldsTotal = 0;
  
  // 1) SEGMENT FIT: Match entre CNAE/setor e setores prioritários
  let segmentFit = 0.5; // Neutro por padrão
  const cnaePrincipal = report_data.onboarding_data?.step1_DadosBasicos?.cnaePrincipal;
  const cnaesSecundarios = report_data.onboarding_data?.step1_DadosBasicos?.cnaesSecundarios || [];
  const setorAtual = report_data.icp_metadata?.setorAtual || report_data.onboarding_data?.step2_SetoresNichos?.sectorAtual;
  const setoresAlvo = report_data.onboarding_data?.step2_SetoresNichos?.setoresAlvo || [];
  const cnaesAlvo = report_data.onboarding_data?.step2_SetoresNichos?.cnaesAlvo || [];
  
  fieldsTotal += 2; // CNAE + setor
  
  if (cnaePrincipal || setorAtual) {
    fieldsCount += 1;
    
    // Match exato no CNAE principal
    if (cnaePrincipal && cnaesAlvo.includes(cnaePrincipal)) {
      segmentFit = 1.0;
      fieldsCount += 1;
    }
    // Match em CNAE secundário
    else if (cnaesSecundarios.some(cnae => cnaesAlvo.includes(cnae))) {
      segmentFit = 0.7;
      fieldsCount += 1;
    }
    // Match por setor (aproximado)
    else if (setorAtual && setoresAlvo.some(s => 
      s.toLowerCase().includes(setorAtual.toLowerCase()) || 
      setorAtual.toLowerCase().includes(s.toLowerCase())
    )) {
      segmentFit = 0.8;
      fieldsCount += 1;
    }
    // Setor adjacente (heurística simples)
    else if (setorAtual) {
      segmentFit = 0.3;
    }
    // Sem match
    else {
      segmentFit = 0.0;
    }
  }
  
  // 2) SIZE FIT: Porte/faturamento vs. ticket alvo
  let sizeFit = 0.5;
  const porte = report_data.icp_metadata?.porteEmpresa || report_data.onboarding_data?.step1_DadosBasicos?.porteEmpresa;
  const capitalSocial = report_data.onboarding_data?.step1_DadosBasicos?.capitalSocial;
  const faturamentoAlvo = report_data.onboarding_data?.step3_PerfilClienteIdeal?.faturamentoAlvo;
  const funcionariosAlvo = report_data.onboarding_data?.step3_PerfilClienteIdeal?.funcionariosAlvo;
  const porteAlvo = report_data.onboarding_data?.step3_PerfilClienteIdeal?.porteAlvo || [];
  
  fieldsTotal += 2; // Porte + faturamento/capital
  
  if (porte || capitalSocial) {
    fieldsCount += 1;
    
    // Match por porte (exato)
    if (porte && porteAlvo.includes(porte)) {
      sizeFit = 1.0;
      fieldsCount += 1;
    }
    // Match por faixa de faturamento
    else if (capitalSocial && faturamentoAlvo) {
      const min = faturamentoAlvo.minimo || 0;
      const max = faturamentoAlvo.maximo || Infinity;
      
      if (capitalSocial >= min && capitalSocial <= max) {
        sizeFit = 1.0;
        fieldsCount += 1;
      } else if (capitalSocial >= min * 0.7 && capitalSocial <= max * 1.3) {
        sizeFit = 0.7; // Próximo da faixa
      } else if (capitalSocial < min * 0.5) {
        sizeFit = 0.2; // Muito abaixo
      } else {
        sizeFit = 0.4; // Acima da faixa
      }
    }
    // Apenas porte sem match
    else if (porte) {
      sizeFit = 0.5;
    }
  }
  
  // 3) REGION FIT: UF/região vs. regiões prioritárias
  let regionFit = 0.5;
  const uf = report_data.onboarding_data?.step1_DadosBasicos?.endereco?.estado;
  const localizacaoAlvo = report_data.onboarding_data?.step3_PerfilClienteIdeal?.localizacaoAlvo;
  const estadosAlvo = localizacaoAlvo?.estados || [];
  const regioesAlvo = localizacaoAlvo?.regioes || [];
  
  fieldsTotal += 1; // UF
  
  if (uf) {
    fieldsCount += 1;
    
    // Match exato em estado
    if (estadosAlvo.includes(uf)) {
      regionFit = 1.0;
    }
    // Match por região (heurística básica: Sudeste, Sul, etc.)
    else if (regioesAlvo.length > 0) {
      const regioesBrasil: Record<string, string[]> = {
        'Sudeste': ['SP', 'RJ', 'MG', 'ES'],
        'Sul': ['PR', 'SC', 'RS'],
        'Nordeste': ['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'MA', 'PI'],
        'Centro-Oeste': ['GO', 'MT', 'MS', 'DF'],
        'Norte': ['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'TO'],
      };
      
      const regiaoEmpresa = Object.entries(regioesBrasil).find(([_, estados]) => 
        estados.includes(uf)
      )?.[0];
      
      if (regiaoEmpresa && regioesAlvo.includes(regiaoEmpresa)) {
        regionFit = 0.8;
      } else {
        regionFit = 0.3; // Região diferente
      }
    }
    // Brasil mas sem configuração específica
    else {
      regionFit = 0.5;
    }
  }
  
  // 4) STACK FIT: Uso de stack principal (cross-sell/upsell ou desqualificação)
  let stackFit = 0.5;
  const produtosDetectados = extractProductSignals(report_data);
  const categoriaSolucao = report_data.onboarding_data?.step4_SituacaoAtual?.categoriaSolucao;
  
  fieldsTotal += 1; // Stack/produtos
  
  if (produtosDetectados.length > 0 || categoriaSolucao) {
    fieldsCount += 1;
    
    // Se já usa produtos da stack principal (TOTVS, etc.)
    // Por padrão, tratamos como oportunidade de cross-sell/upsell (0.7)
    // Se a regra do tenant for "não abordar cliente com stack atual", isso deve ser 0.0
    // Por enquanto, assumimos oportunidade
    if (produtosDetectados.length > 0) {
      stackFit = 0.7; // Oportunidade de cross-sell/upsell
    } else {
      stackFit = 0.5; // Neutro
    }
  }
  
  // 5) DIGITAL MATURITY: Presença digital
  let digitalMaturity = 0.5;
  const website = report_data.icp_metadata?.website || report_data.onboarding_data?.step1_DadosBasicos?.website;
  const maturidadeDigital = report_data.onboarding_data?.step3_PerfilClienteIdeal?.maturidadeDigital;
  const analysis = report_data.analysis || '';
  
  fieldsTotal += 2; // Website + maturidade
  
  let maturityScore = 0;
  if (website) {
    maturityScore += 0.3;
    fieldsCount += 1;
  }
  
  // Sinais de tecnologia no analysis
  const techSignals = ['ERP', 'CRM', 'sistema', 'software', 'tecnologia', 'digital', 'automação'].filter(
    signal => analysis.toLowerCase().includes(signal.toLowerCase())
  );
  if (techSignals.length > 0) {
    maturityScore += Math.min(0.4, techSignals.length * 0.1);
  }
  
  // Maturidade digital do onboarding
  if (maturidadeDigital) {
    fieldsCount += 1;
    const maturityMap: Record<string, number> = {
      'alta': 0.8,
      'média': 0.6,
      'baixa': 0.3,
      'muito baixa': 0.1,
    };
    maturityScore += maturityMap[maturidadeDigital.toLowerCase()] || 0.5;
  }
  
  digitalMaturity = Math.min(1.0, maturityScore);
  
  // 6) HISTORY SIGNAL: Histórico de interação
  let historySignal = 0.5;
  // Por enquanto, não temos campos de histórico explícitos
  // Se existirem no futuro (já contatado, tentativas, etc.), mapear aqui
  // Por padrão, assumimos neutro (0.5)
  
  // 7) DATA COMPLETENESS: Proporção de campos críticos preenchidos
  const dataCompleteness = fieldsTotal > 0 ? fieldsCount / fieldsTotal : 0.5;
  
  return {
    segmentFit: Math.max(0, Math.min(1, segmentFit)),
    sizeFit: Math.max(0, Math.min(1, sizeFit)),
    regionFit: Math.max(0, Math.min(1, regionFit)),
    stackFit: Math.max(0, Math.min(1, stackFit)),
    digitalMaturity: Math.max(0, Math.min(1, digitalMaturity)),
    historySignal: Math.max(0, Math.min(1, historySignal)),
    dataCompleteness: Math.max(0, Math.min(1, dataCompleteness)),
  };
}

/**
 * Constrói payload para a Edge Function (MC8 V2: inclui features)
 */
function buildMC8Payload(icpReport: ICPReportRow, tenantId: string, features: MC8FeatureVector): any {
  const { report_data, icp_profile_metadata_id } = icpReport;
  
  // Extrair dados da empresa
  const empresa = {
    cnpj: report_data.icp_metadata?.cnpj || report_data.onboarding_data?.step1_DadosBasicos?.cnpj,
    razaoSocial: report_data.icp_metadata?.companyName || report_data.onboarding_data?.step1_DadosBasicos?.razaoSocial,
    nomeFantasia: report_data.icp_metadata?.companyName || report_data.onboarding_data?.step1_DadosBasicos?.nomeFantasia,
    cnaePrincipal: report_data.onboarding_data?.step1_DadosBasicos?.cnaePrincipal,
    cnaesSecundarios: report_data.onboarding_data?.step1_DadosBasicos?.cnaesSecundarios || [],
    porte: report_data.icp_metadata?.porteEmpresa || report_data.onboarding_data?.step1_DadosBasicos?.porteEmpresa,
    capitalSocial: report_data.onboarding_data?.step1_DadosBasicos?.capitalSocial,
    uf: report_data.onboarding_data?.step1_DadosBasicos?.endereco?.estado,
    cidade: report_data.onboarding_data?.step1_DadosBasicos?.endereco?.cidade,
    setor: report_data.icp_metadata?.setorAtual || report_data.onboarding_data?.step2_SetoresNichos?.sectorAtual,
  };

  // Extrair dados de onboarding
  const onboarding = {
    setoresAlvo: report_data.onboarding_data?.step2_SetoresNichos?.setoresAlvo || [],
    nichosAlvo: report_data.onboarding_data?.step2_SetoresNichos?.nichosAlvo || [],
    cnaesAlvo: report_data.onboarding_data?.step2_SetoresNichos?.cnaesAlvo || [],
    doresPrioritarias: report_data.onboarding_data?.step3_PerfilClienteIdeal?.doresPrioritarias || [],
    gatilhosCompra: report_data.onboarding_data?.step3_PerfilClienteIdeal?.gatilhosCompra || [],
    maturidadeDigital: report_data.onboarding_data?.step3_PerfilClienteIdeal?.maturidadeDigital,
    porteAlvo: report_data.onboarding_data?.step3_PerfilClienteIdeal?.porteAlvo || [],
    localizacaoAlvo: report_data.onboarding_data?.step3_PerfilClienteIdeal?.localizacaoAlvo,
    faturamentoAlvo: report_data.onboarding_data?.step3_PerfilClienteIdeal?.faturamentoAlvo,
    funcionariosAlvo: report_data.onboarding_data?.step3_PerfilClienteIdeal?.funcionariosAlvo,
    categoriaSolucao: report_data.onboarding_data?.step4_SituacaoAtual?.categoriaSolucao,
    diferenciais: report_data.onboarding_data?.step4_SituacaoAtual?.diferenciais || [],
    clientesAtuais: report_data.onboarding_data?.step5_HistoricoEEnriquecimento?.clientesAtuais || [],
  };

  // Extrair dados do relatório existente
  const relatorioICP = {
    analysis: report_data.analysis,
    recommendations: report_data.recommendations,
    // Sinais de uso de produtos (se existirem no report_data)
    produtosDetectados: extractProductSignals(report_data),
    maturidadeDigital: extractDigitalMaturity(report_data),
  };

  // Buscar configuração do tenant (se disponível)
  // Por enquanto, usar dados do onboarding como referência
  const configTenant = {
    segmentosPrioritarios: onboarding.setoresAlvo,
    nichosPrioritarios: onboarding.nichosAlvo,
    ticketMinimo: onboarding.faturamentoAlvo?.minimo,
    ticketMaximo: onboarding.faturamentoAlvo?.maximo,
    porteMinimo: onboarding.funcionariosAlvo?.minimo,
    regioesPrioritarias: onboarding.localizacaoAlvo?.regioes || [],
  };

  return {
    tenantId,
    icpReportId: icpReport.id,
    icpProfileMetadataId: icp_profile_metadata_id,
    empresa,
    onboarding,
    relatorioICP,
    configTenant,
    features, // MC8 V2: Vetor de features numéricas
  };
}

/**
 * Extrai sinais de produtos do report_data
 */
function extractProductSignals(report_data: any): string[] {
  const signals: string[] = [];
  
  // Procurar por menções a produtos em diferentes lugares do report_data
  if (report_data.analysis) {
    // Buscar menções a TOTVS, ERP, sistemas, etc.
    const totvsMatch = report_data.analysis.match(/TOTVS|Protheus|RM|Datasul/gi);
    if (totvsMatch) {
      signals.push(...totvsMatch);
    }
  }
  
  return [...new Set(signals)]; // Remover duplicatas
}

/**
 * Extrai maturidade digital do report_data
 */
function extractDigitalMaturity(report_data: any): string | null {
  // Tentar extrair de diferentes fontes
  return (
    report_data.onboarding_data?.step3_PerfilClienteIdeal?.maturidadeDigital ||
    null
  );
}

/**
 * Valida e normaliza o assessment retornado pela Edge Function
 */
function validateMC8Assessment(assessment: any): MC8MatchAssessment {
  // Validar campos obrigatórios
  if (!assessment.level || !['ALTA', 'MEDIA', 'BAIXA', 'DESCARTAR'].includes(assessment.level)) {
    throw new Error('Nível de fit inválido');
  }

  if (typeof assessment.confidence !== 'number' || assessment.confidence < 0 || assessment.confidence > 1) {
    throw new Error('Confiança inválida (deve ser entre 0 e 1)');
  }

  if (!assessment.rationale || typeof assessment.rationale !== 'string') {
    throw new Error('Rationale inválido');
  }

  // Normalizar campos opcionais
  return {
    level: assessment.level as MC8MatchAssessment['level'],
    confidence: assessment.confidence,
    rationale: assessment.rationale,
    bestAngles: Array.isArray(assessment.bestAngles) ? assessment.bestAngles : [],
    recommendedNextStep: assessment.recommendedNextStep || 'Aguardar mais informações',
    risks: Array.isArray(assessment.risks) ? assessment.risks : [],
    updatedAt: assessment.updatedAt || new Date().toISOString(),
  };
}

/**
 * Salva o assessment MC8 no icp_reports.report_data
 */
export async function saveMC8Assessment(params: {
  icpReportId: string;
  mc8: MC8MatchAssessment;
}): Promise<void> {
  const { icpReportId, mc8 } = params;

  console.log('[MC8-V2] 💾 Salvando assessment...', { icpReportId, level: mc8.level });

  try {
    // Buscar relatório atual
    const { data: currentReport, error: fetchError } = await supabase
      .from('icp_reports')
      .select('report_data')
      .eq('id', icpReportId)
      .single();

    if (fetchError) {
      throw new Error(`Erro ao buscar relatório: ${fetchError.message}`);
    }

    if (!currentReport) {
      throw new Error('Relatório não encontrado');
    }

    // Atualizar report_data com mc8Assessment
    const updatedReportData = {
      ...currentReport.report_data,
      mc8Assessment: mc8,
    };

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('icp_reports')
      .update({ report_data: updatedReportData })
      .eq('id', icpReportId);

    if (updateError) {
      throw new Error(`Erro ao salvar assessment: ${updateError.message}`);
    }

    console.log('[MC8-V2] ✅ Assessment salvo com sucesso');
  } catch (error: any) {
    console.error('[MC8-V2] ❌ Erro ao salvar assessment:', error);
    throw error;
  }
}

