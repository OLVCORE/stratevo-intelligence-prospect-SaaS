/**
 * Resolve origem (nome do arquivo) de uma empresa ou prospect
 * 
 * Padroniza a busca de origem em todas as tabelas para mostrar o nome do arquivo
 * igual à tabela "Estoque de Empresas Qualificadas"
 */

export interface OriginResolution {
  origem: string | null;
  source: 'source_file_name' | 'job_name' | 'source_name' | 'campaign' | 'raw_data' | null;
}

/**
 * Resolve origem de um prospect qualificado (QualifiedProspectsStock)
 * Prioridade: campaign > source_name > job.source_file_name > job.job_name > source_metadata
 */
export function getProspectOrigin(prospect: any): string | null {
  // Prioridade: campanha > source_name > job.source_file_name > job.job_name > source_metadata
  const campaign = prospect.source_metadata?.campaign;
  if (campaign && String(campaign).trim() !== '') {
    return String(campaign).trim();
  }

  if (prospect.source_name && prospect.source_name.trim() !== '') {
    return prospect.source_name.trim();
  }

  const jobFile = prospect.job?.source_file_name;
  if (jobFile && jobFile.trim() !== '') {
    return jobFile.trim();
  }

  const jobName = prospect.job?.job_name;
  if (jobName && jobName.trim() !== '') {
    return jobName.trim();
  }

  if (prospect.source_metadata) {
    const metaName =
      (prospect.source_metadata as any).name ||
      (prospect.source_metadata as any).source_name;
    if (metaName && String(metaName).trim() !== '') {
      return String(metaName).trim();
    }
  }

  return null;
}

/**
 * Resolve origem de uma empresa (Companies ou ICP Analysis Results)
 * Prioridade: source_file_name > job_name > source_name > campaign > raw_data
 * 
 * Esta função busca o nome do arquivo de forma padronizada em todas as tabelas
 */
export function getCompanyOrigin(company: any): string | null {
  const rawData = (company as any).raw_data || {};
  const rawAnalysis = (company as any).raw_analysis || {};

  // Prioridade 1: source_file_name (nome do arquivo) - MAIS IMPORTANTE
  const sourceFileName = 
    rawAnalysis.source_file_name ||
    rawData.source_file_name ||
    (company as any).source_file_name;
  
  if (sourceFileName && String(sourceFileName).trim() !== '' && 
      !String(sourceFileName).includes('batch-')) {
    return String(sourceFileName).trim();
  }

  // Prioridade 2: job_name
  const jobName = 
    rawAnalysis.job_name ||
    rawData.job_name ||
    (company as any).job_name;
  
  if (jobName && String(jobName).trim() !== '' && 
      !String(jobName).includes('batch-')) {
    return String(jobName).trim();
  }

  // Prioridade 3: campaign (se não for batch ID)
  const campaign =
    rawAnalysis.source_metadata?.campaign ||
    rawData.source_metadata?.campaign ||
    (company as any).source_metadata?.campaign;
  
  if (campaign && String(campaign).trim() !== '' && 
      !String(campaign).includes('batch-')) {
    return String(campaign).trim();
  }

  // Prioridade 4: source_name (se não for batch ID)
  const directSource =
    company.source_name ||
    rawAnalysis.source_name ||
    rawAnalysis.origem_original ||
    rawData.source_name ||
    (company as any).origem;
  
  if (directSource && String(directSource).trim() !== '' && 
      !String(directSource).includes('batch-') &&
      !String(directSource).startsWith('batch-')) {
    return String(directSource).trim();
  }

  // Prioridade 5: origem de raw_data (se não for batch ID)
  const origemRaw = 
    rawAnalysis.origem ||
    rawData.origem ||
    rawData.origem_original;
  
  if (origemRaw && String(origemRaw).trim() !== '' && 
      !String(origemRaw).includes('batch-') &&
      !String(origemRaw).startsWith('batch-')) {
    return String(origemRaw).trim();
  }

  return null;
}

/**
 * Resolve origem de uma empresa retornando string (nunca null)
 * Retorna 'Sem origem' se não encontrar
 */
export function getCompanyOriginString(company: any): string {
  const origem = getCompanyOrigin(company);
  return origem || 'Sem origem';
}
