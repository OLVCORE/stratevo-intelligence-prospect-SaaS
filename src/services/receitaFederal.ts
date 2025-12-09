// ✅ Serviço para consultar Receita Federal SEM Edge Function
// Funciona diretamente no frontend
// ⚠️ ReceitaWS desabilitada temporariamente (CORS) - usando apenas BrasilAPI

import { 
  saveQualifiedEnrichment, 
  classifyCnaeType, 
  calculateDataQuality, 
  calculateBasicFitScore, 
  calculateGrade 
} from './qualifiedEnrichment.service';

interface ReceitaWSResponse {
  status: string;
  uf: string;
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  cep: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  atividades_secundarias?: Array<{
    code: string;
    text: string;
  }>;
  natureza_juridica: string;
  porte: string;
  nome?: string;
  fantasia?: string;
  situacao?: string;
  qsa?: Array<{
    nome: string;
    qual: string;
  }>;
}

export async function consultarReceitaFederal(
  cnpj: string,
  options?: {
    stockId?: string;
    tenantId?: string;
    saveEnrichment?: boolean;
  }
): Promise<{
  success: boolean;
  data?: ReceitaWSResponse;
  source?: 'receitaws' | 'brasilapi';
  error?: string;
}> {
  const cnpjClean = cnpj.replace(/\D/g, '');
  
  if (cnpjClean.length !== 14) {
    return {
      success: false,
      error: 'CNPJ inválido (deve ter 14 dígitos)'
    };
  }

  // 🔥 BUSCAR DAS 3 FONTES E FAZER MERGE (87 CAMPOS!)
  let receitaWSData: any = null;
  let brasilAPIData: any = null;

  // ✅ DESABILITADO: ReceitaWS causa CORS no frontend
  // TODO: Mover para backend (Edge Function) no futuro
  // Por enquanto, usar apenas BrasilAPI que não tem CORS
  console.log('[ReceitaFederal] ⚠️ ReceitaWS desabilitada (CORS). Usando apenas BrasilAPI.');

  // SEMPRE buscar BrasilAPI também (para ter MAIS campos)
  try {
    console.log('[ReceitaFederal] 🔍 2/2 Consultando BrasilAPI:', cnpjClean);
    
    const brasilApiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`;
    const response = await fetch(brasilApiUrl);
    
    if (response.ok) {
      brasilAPIData = await response.json();
      console.log('[ReceitaFederal] ✅ BrasilAPI sucesso:', Object.keys(brasilAPIData).length, 'campos');
    }
  } catch (error: any) {
    console.log('[ReceitaFederal] ⚠️ BrasilAPI erro:', error.message);
  }

  // 🔥 MERGE: Combinar dados de AMBAS as fontes (máximo de campos!)
  if (!receitaWSData && !brasilAPIData) {
    return {
      success: false,
      error: 'Nenhuma API disponível (ReceitaWS e BrasilAPI falharam)'
    };
  }

  // Usar ReceitaWS como base (mais completo) e preencher com BrasilAPI
  const merged: any = {
    status: receitaWSData?.status || brasilAPIData?.descricao_situacao_cadastral || 'OK',
    uf: receitaWSData?.uf || brasilAPIData?.uf || '',
    municipio: receitaWSData?.municipio || brasilAPIData?.municipio || '',
    bairro: receitaWSData?.bairro || brasilAPIData?.bairro || '',
    logradouro: receitaWSData?.logradouro || brasilAPIData?.logradouro || '',
    numero: receitaWSData?.numero || brasilAPIData?.numero?.toString() || '',
    complemento: receitaWSData?.complemento || brasilAPIData?.complemento || '',
    cep: receitaWSData?.cep || brasilAPIData?.cep?.toString() || '',
    atividade_principal: receitaWSData?.atividade_principal || (brasilAPIData?.cnae_fiscal
      ? [{ code: String(brasilAPIData.cnae_fiscal), text: brasilAPIData.cnae_fiscal_descricao || '' }]
      : []),
    atividades_secundarias: receitaWSData?.atividades_secundarias || (Array.isArray(brasilAPIData?.cnaes_secundarios)
      ? brasilAPIData.cnaes_secundarios.map((i: any) => ({ 
          code: String(i.codigo || i.code || ''), 
          text: i.descricao || i.text || '' 
        }))
      : []),
    natureza_juridica: receitaWSData?.natureza_juridica || brasilAPIData?.natureza_juridica || '',
    porte: receitaWSData?.porte || brasilAPIData?.porte || '',
    nome: receitaWSData?.nome || brasilAPIData?.razao_social || '',
    fantasia: receitaWSData?.fantasia || brasilAPIData?.nome_fantasia || '',
    situacao: receitaWSData?.situacao || brasilAPIData?.descricao_situacao_cadastral || '',
    qsa: receitaWSData?.qsa || (Array.isArray(brasilAPIData?.qsa) 
      ? brasilAPIData.qsa.map((s: any) => ({ 
          nome: s.nome_socio || s.nome, 
          qual: s.qualificacao_socio || s.qualificacao || s.qual 
        }))
      : []),
    
    // 🆕 CAMPOS ADICIONAIS DO BRASILAPI (GRÁTIS!)
    capital_social: brasilAPIData?.capital_social || receitaWSData?.capital_social || null,
    abertura: brasilAPIData?.data_inicio_atividade || receitaWSData?.abertura || brasilAPIData?.data_abertura || null,
    email: brasilAPIData?.email || receitaWSData?.email || null,
    telefone: receitaWSData?.telefone || brasilAPIData?.ddd_telefone_1 || null,
    data_situacao: brasilAPIData?.data_situacao_cadastral || null,
    motivo_situacao: brasilAPIData?.motivo_situacao_cadastral || null,
    situacao_especial: brasilAPIData?.situacao_especial || null,
    data_situacao_especial: brasilAPIData?.data_situacao_especial || null,
    tipo_unidade: brasilAPIData?.identificador_matriz_filial === 1 ? 'MATRIZ' : 'FILIAL',
    cnae_fiscal: brasilAPIData?.cnae_fiscal || null,
    cnae_fiscal_descricao: brasilAPIData?.cnae_fiscal_descricao || null,
  };

  console.log('[ReceitaFederal] 🔥 MERGE completo:', {
    fonte_primaria: receitaWSData ? 'ReceitaWS' : 'BrasilAPI',
    total_campos: Object.keys(merged).length,
    tem_qsa: !!merged.qsa?.length,
    tem_cnae: !!merged.atividade_principal?.length
  });

  // ✅ PERSISTIR ENRIQUECIMENTO se solicitado
  if (options?.saveEnrichment && options.stockId && options.tenantId) {
    try {
      const cnaePrincipal = merged.atividade_principal?.[0]?.code || merged.cnae_fiscal || null;
      const cnaeTipo = classifyCnaeType(cnaePrincipal);
      const dataQuality = calculateDataQuality(merged);
      const fitScore = calculateBasicFitScore(merged);
      const grade = calculateGrade(fitScore);

      await saveQualifiedEnrichment({
        stockId: options.stockId,
        tenantId: options.tenantId,
        cnpj: cnpjClean,
        fantasia: merged.fantasia || merged.nome_fantasia || null,
        cnae_principal: cnaePrincipal,
        cnae_tipo: cnaeTipo,
        data_quality: dataQuality,
        fit_score: fitScore,
        grade: grade,
        origem: 'BrasilAPI', // ✅ ReceitaWS desabilitada (CORS)
        raw: merged,
      });

      console.log('[ReceitaFederal] ✅ Enriquecimento persistido no banco');
    } catch (enrichError: any) {
      console.warn('[ReceitaFederal] ⚠️ Erro ao persistir enriquecimento (continuando):', enrichError);
      // Não falhar o enriquecimento se a persistência falhar
    }
  }

  return {
    success: true,
    data: merged,
    source: receitaWSData ? 'receitaws' : 'brasilapi'
  };
}

