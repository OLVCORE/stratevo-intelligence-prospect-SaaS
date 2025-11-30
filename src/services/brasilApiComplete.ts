// 🇧🇷 BRASIL API COMPLETO - TODAS AS 15 FEATURES CONECTADAS
// https://brasilapi.com.br/docs

const BRASILAPI_BASE = 'https://brasilapi.com.br/api';

// ===== 1. BANKS (Bancos) =====
export interface BankInfo {
  ispb: string;
  name: string;
  code: number;
  fullName: string;
}

export async function getAllBanks(): Promise<BankInfo[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/banks/v1`);
    if (!response.ok) return [];
    const banks = await response.json();
    console.log('[BrasilAPI] ✅ Banks:', banks.length);
    return banks;
  } catch (error) {
    console.error('[BrasilAPI] Erro BANKS:', error);
    return [];
  }
}

export async function getBankByCode(code: number): Promise<BankInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/banks/v1/${code}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[BrasilAPI] Erro BANK:', error);
    return null;
  }
}

// ===== 2. CAMBIO (Câmbio) =====
export interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export async function getExchangeRate(currencyCode: string = 'USD'): Promise<ExchangeRate[] | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/cptec/v1/clima/capital`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[BrasilAPI] Erro CAMBIO:', error);
    return null;
  }
}

// ===== 3. CEP (Código Postal) =====
export interface CEPInfo {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export async function getCEPInfo(cep: string): Promise<CEPInfo | null> {
  try {
    const cepClean = cep.replace(/\D/g, '');
    const response = await fetch(`${BRASILAPI_BASE}/cep/v1/${cepClean}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ CEP:', data.cep, '-', data.city, '/', data.state);
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro CEP:', error);
    return null;
  }
}

export async function getCEPInfoV2(cep: string): Promise<CEPInfo | null> {
  try {
    const cepClean = cep.replace(/\D/g, '');
    const response = await fetch(`${BRASILAPI_BASE}/cep/v2/${cepClean}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ CEP V2:', data.cep, '- Lat:', data.location?.coordinates?.latitude);
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro CEP V2:', error);
    return null;
  }
}

// ===== 4. CNPJ (Receita Federal) =====
// JÁ IMPLEMENTADO em receitaFederal.ts

// ===== 5. DDD (Código de Área) =====
export interface DDDInfo {
  state: string;
  cities: string[];
}

export async function getDDDInfo(ddd: string): Promise<DDDInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ddd/v1/${ddd}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ DDD:', ddd, '-', data.state, '(', data.cities.length, 'cidades)');
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro DDD:', error);
    return null;
  }
}

// ===== 6. FERIADOS NACIONAIS =====
export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export async function getHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/feriados/v1/${year}`);
    if (!response.ok) return [];
    const holidays = await response.json();
    console.log('[BrasilAPI] ✅ Feriados', year, ':', holidays.length);
    return holidays;
  } catch (error) {
    console.error('[BrasilAPI] Erro FERIADOS:', error);
    return [];
  }
}

// ===== 7. FIPE (Tabela de Veículos) =====
export interface FIPEBrand {
  name: string;
  value: string;
}

export async function getFIPEBrands(vehicleType: 'caminhoes' | 'carros' | 'motos' = 'carros'): Promise<FIPEBrand[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/fipe/marcas/v1/${vehicleType}`);
    if (!response.ok) return [];
    const brands = await response.json();
    console.log('[BrasilAPI] ✅ FIPE Marcas:', brands.length);
    return brands;
  } catch (error) {
    console.error('[BrasilAPI] Erro FIPE:', error);
    return [];
  }
}

// ===== 8. IBGE (Dados Demográficos) =====
export interface IBGECity {
  nome: string;
  codigo_ibge: string;
}

export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

export async function getIBGEStates(): Promise<IBGEState[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ibge/uf/v1`);
    if (!response.ok) return [];
    const states = await response.json();
    console.log('[BrasilAPI] ✅ IBGE Estados:', states.length);
    return states;
  } catch (error) {
    console.error('[BrasilAPI] Erro IBGE:', error);
    return [];
  }
}

export async function getIBGECities(uf: string): Promise<IBGECity[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ibge/municipios/v1/${uf.toUpperCase()}`);
    if (!response.ok) return [];
    const cities = await response.json();
    console.log('[BrasilAPI] ✅ IBGE Cidades', uf, ':', cities.length);
    return cities;
  } catch (error) {
    console.error('[BrasilAPI] Erro IBGE Cidades:', error);
    return [];
  }
}

// ===== 9. NCM (Nomenclatura Comum do Mercosul) =====
export interface NCMInfo {
  codigo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo_ato: string;
  numero_ato: string;
  ano_ato: string;
}

export async function searchNCM(query: string): Promise<NCMInfo[]> {
  try {
    console.log('[BrasilAPI] 🔍 Buscando NCM:', query);
    
    // Se for um código numérico (4-8 dígitos), tentar buscar diretamente por código primeiro
    const cleanQuery = query.replace(/[.\-]/g, '').trim();
    const isNumericCode = /^\d{4,8}$/.test(cleanQuery);
    
    let results: NCMInfo[] = [];
    
    // Se for código numérico, tentar buscar por código exato primeiro
    if (isNumericCode && cleanQuery.length >= 4) {
      try {
        // Buscar código completo (8 dígitos) ou parcial
        const codeToSearch = cleanQuery.length === 8 ? cleanQuery : cleanQuery.padEnd(8, '0');
        console.log('[BrasilAPI] 🔍 Tentando buscar código direto:', codeToSearch);
        const exactMatch = await getNCMByCode(codeToSearch);
        if (exactMatch) {
          console.log('[BrasilAPI] ✅ NCM encontrado por código:', exactMatch);
          results.push(exactMatch);
        }
      } catch (e) {
        console.warn('[BrasilAPI] ⚠️ Busca por código falhou, tentando busca geral:', e);
        // Ignorar erro e continuar com busca por descrição
      }
    }
    
    // Sempre buscar por descrição também (ou se código não funcionou)
    console.log('[BrasilAPI] 🔍 Buscando por descrição:', query);
    const searchResponse = await fetch(`${BRASILAPI_BASE}/ncm/v1?search=${encodeURIComponent(query)}`);
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('[BrasilAPI] 📊 Resultados da busca:', searchResults?.length || 0);
      results = [...results, ...(Array.isArray(searchResults) ? searchResults : [])];
    } else {
      console.error('[BrasilAPI] ❌ Erro na busca:', searchResponse.status);
    }
    
    // Remover duplicatas baseado no código
    const uniqueResults = results.filter((ncm, index, self) =>
      index === self.findIndex(n => n.codigo === ncm.codigo)
    );
    
    console.log('[BrasilAPI] ✅ NCM encontrados (total único):', uniqueResults.length);
    return uniqueResults;
  } catch (error) {
    console.error('[BrasilAPI] ❌ Erro NCM:', error);
    return [];
  }
}

export async function getNCMByCode(code: string): Promise<NCMInfo | null> {
  try {
    // Limpar código (remover pontos e traços)
    const cleanCode = code.replace(/[.\-]/g, '').trim();
    
    // Se não tiver 8 dígitos, tentar completar com zeros à direita
    const codeToSearch = cleanCode.length < 8 ? cleanCode.padEnd(8, '0') : cleanCode.substring(0, 8);
    
    const response = await fetch(`${BRASILAPI_BASE}/ncm/v1/${codeToSearch}`);
    if (!response.ok) {
      // Se não encontrou código completo, tentar buscar por prefixo (4 primeiros dígitos)
      if (cleanCode.length >= 4) {
        const prefixCode = cleanCode.substring(0, 4);
        const prefixResponse = await fetch(`${BRASILAPI_BASE}/ncm/v1?search=${prefixCode}`);
        if (prefixResponse.ok) {
          const prefixResults = await prefixResponse.json();
          // Retornar o primeiro resultado que corresponde ao código
          const match = Array.isArray(prefixResults) 
            ? prefixResults.find((ncm: NCMInfo) => ncm.codigo.startsWith(prefixCode))
            : null;
          if (match) return match;
        }
      }
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro NCM:', error);
    return null;
  }
}

// ===== 13. CNAE (IBGE API) =====
export interface CNAEInfo {
  id: number;
  descricao: string;
  codigo: string;
  observacoes?: string;
  descricoes?: string[]; // Múltiplas descrições quando o mesmo código tem variações
  classe?: {
    id: number;
    descricao: string;
    codigo: string;
  };
  grupo?: {
    id: number;
    descricao: string;
    codigo: string;
  };
  divisao?: {
    id: number;
    descricao: string;
    codigo: string;
  };
  secao?: {
    id: number;
    descricao: string;
    codigo: string;
  };
}

const IBGE_API_BASE = 'https://servicodados.ibge.gov.br/api/v2';

export async function searchCNAE(query: string): Promise<CNAEInfo[]> {
  try {
    console.log('[IBGE API] 🔍 Buscando CNAE:', query);
    
    // Limpar query (remover formatação)
    const cleanQuery = query.replace(/[.\-\/]/g, '').trim();
    
    // Se for um código numérico (5-7 dígitos), tentar buscar diretamente primeiro
    if (/^\d{5,7}$/.test(cleanQuery)) {
      try {
        // Formatar código CNAE (ex: 62015 -> 62.01-5/00)
        const formattedCode = formatCNAECode(cleanQuery);
        console.log('[IBGE API] 🔍 Tentando buscar código direto:', formattedCode);
        const directResponse = await fetch(`${IBGE_API_BASE}/cnae/subclasses/${formattedCode}`);
        if (directResponse.ok) {
          const directResult = await directResponse.json();
          // Verificar se é um objeto válido (não array vazio)
          if (directResult && !directResult.erro && typeof directResult === 'object' && directResult.codigo) {
            console.log('[IBGE API] ✅ CNAE encontrado por código:', directResult);
            return [directResult];
          }
        }
      } catch (e) {
        console.warn('[IBGE API] ⚠️ Busca por código falhou, tentando busca geral:', e);
        // Continuar com busca por descrição
      }
    }
    
    // Buscar todas as subclasses e filtrar por descrição ou código
    console.log('[IBGE API] 🔍 Buscando todas as subclasses...');
    const response = await fetch(`${IBGE_API_BASE}/cnae/subclasses`);
    if (!response.ok) {
      console.error('[IBGE API] ❌ Erro ao buscar subclasses:', response.status);
      return [];
    }
    
    const allSubclasses = await response.json();
    console.log('[IBGE API] 📊 Total de subclasses carregadas:', allSubclasses?.length || 0);
    
    if (!Array.isArray(allSubclasses) || allSubclasses.length === 0) {
      console.warn('[IBGE API] ⚠️ Nenhuma subclasse retornada');
      return [];
    }
    
    // Debug: verificar formato dos primeiros códigos
    const sampleCodes = allSubclasses.slice(0, 10).map(c => ({
      id: c.id,
      codigo: c.codigo,
      codigoType: typeof c.codigo,
      codigoClean: String(c.codigo || '').replace(/[.\-\/]/g, ''),
      descricao: c.descricao?.substring(0, 50) || ''
    }));
    console.log('[IBGE API] 🔍 Debug - Primeiros 10 códigos:', sampleCodes);
    console.log('[IBGE API] 🔍 Debug - Query original:', query);
    console.log('[IBGE API] 🔍 Debug - Query limpa:', cleanQuery);
    
    // Debug CRÍTICO: verificar estrutura completa dos primeiros códigos
    const firstFew = allSubclasses.slice(0, 5);
    console.log('[IBGE API] 🔍 Debug - Estrutura completa dos primeiros 5:', firstFew);
    
    // Debug adicional: verificar se há códigos que começam com a query
    const testCodes = allSubclasses.slice(0, 20).map(c => {
      const codigoStr = String(c.codigo || '');
      const codigoClean = codigoStr.replace(/[.\-\/]/g, '').trim();
      return {
        original: codigoStr,
        clean: codigoClean,
        startsWith01: codigoClean.startsWith('01'),
        startsWith0134: codigoClean.startsWith('0134'),
      };
    });
    console.log('[IBGE API] 🔍 Debug - Teste de códigos:', testCodes);
    
    // Debug: procurar manualmente códigos que começam com "01"
    const manualSearch01 = allSubclasses
      .map(c => {
        const codigoStr = String(c.codigo || '');
        const codigoClean = codigoStr.replace(/[.\-\/]/g, '').trim();
        return { original: codigoStr, clean: codigoClean, cnae: c };
      })
      .filter(item => item.clean.startsWith('01'))
      .slice(0, 10);
    console.log('[IBGE API] 🔍 Debug - Códigos que começam com "01" (manual):', manualSearch01);
    
    // Filtrar por descrição ou código (incluindo busca parcial)
    // Normalizar os dados primeiro para garantir código e descrição
    const filtered = allSubclasses
      .map((cnae: any) => {
        if (!cnae) return null;
        
        // Verificar código em diferentes formatos que a API IBGE pode retornar
        let codigoStr = cnae.codigo || cnae.codigo_subclasse || cnae.subclasse || '';
        const descricaoStr = cnae.descricao || cnae.descricao_subclasse || cnae.nome || '';
        
        // Se não tem código mas tem ID, tentar usar como fallback
        if (!codigoStr && cnae.id) {
          codigoStr = String(cnae.id);
        }
        
        // Garantir que temos código e descrição
        if (!codigoStr || codigoStr === 'undefined' || codigoStr === 'null' || codigoStr === '' || !descricaoStr) {
          return null;
        }
        
        // Retornar objeto normalizado
        return {
          ...cnae,
          codigo: String(codigoStr).trim(),
          descricao: String(descricaoStr).trim()
        };
      })
      .filter((cnae: any) => cnae !== null)
      .filter((cnae: any) => {
        if (!cnae || !cnae.codigo || !cnae.descricao) return false;
        
        const codigoStr = String(cnae.codigo);
        const searchLower = query.toLowerCase().trim();
        const descLower = String(cnae.descricao || '').toLowerCase();
        
        // Buscar por descrição (contém o texto)
        if (descLower.includes(searchLower)) {
          return true;
        }
        
        // Buscar por código (remover TODA formatação e comparar)
        const codigoClean = codigoStr.replace(/[.\-\/\s]/g, '').trim();
        const queryClean = cleanQuery.trim();
        
        // Se a query é numérica, buscar por código parcial ou completo
        if (/^\d+$/.test(queryClean) && queryClean.length > 0) {
          // Estratégia 1: Buscar se o código COMEÇA com a query (mais comum)
          if (codigoClean.length > 0 && codigoClean.startsWith(queryClean)) {
            console.log(`[IBGE API] ✅ Match por startsWith: "${codigoClean}" começa com "${queryClean}"`);
            return true;
          }
          
          // Estratégia 2: Buscar se contém a query (para casos como "0134" dentro de "0134101")
          if (codigoClean.length > 0 && codigoClean.includes(queryClean)) {
            return true;
          }
          
          // Estratégia 3: Buscar no código formatado original (ex: "01" encontra "01.11-1/01")
          const codigoSemPontos = codigoStr.replace(/[.\-\s]/g, '').replace(/\//g, '').trim();
          if (codigoSemPontos.length > 0 && codigoSemPontos.startsWith(queryClean)) {
            return true;
          }
          
          // Estratégia 4: Buscar por seção (2 primeiros dígitos) - formato SS.DD-C/SS
          if (queryClean.length === 2) {
            const matchSection = codigoStr.match(/^(\d{2})/);
            if (matchSection && matchSection[1] === queryClean) {
              return true;
            }
          }
          
          // Estratégia 5: Buscar por divisão (4 dígitos: SSDD)
          if (queryClean.length >= 4) {
            const matchDivision = codigoStr.match(/^(\d{2})\.(\d{2})/);
            if (matchDivision) {
              const sectionDivision = matchDivision[1] + matchDivision[2];
              if (sectionDivision === queryClean.substring(0, 4)) {
                return true;
              }
            }
            // Também tentar sem ponto
            if (codigoClean.length >= 4 && codigoClean.substring(0, 4) === queryClean.substring(0, 4)) {
              return true;
            }
          }
          
          // Estratégia 6: Buscar no código original sem formatação
          if (codigoStr.startsWith(queryClean)) {
            return true;
          }
        } else {
          // Se não é numérico, buscar apenas por descrição
          return descLower.includes(searchLower);
        }
        
        return false;
      });
    
    // Mapear para CNAEInfo garantindo que todos têm código e descrição
    const mappedResults: CNAEInfo[] = filtered
      .map((cnae: any) => {
        // Garantir que temos código e descrição válidos
        const codigoFinal = String(cnae.codigo || '').trim();
        const descricaoFinal = String(cnae.descricao || '').trim();
        
        if (!codigoFinal || !descricaoFinal) {
          console.warn('[IBGE API] ⚠️ CNAE sem código ou descrição ignorado:', cnae);
          return null;
        }
        
        return {
          id: cnae.id || 0,
          codigo: codigoFinal,
          descricao: descricaoFinal,
          observacoes: cnae.observacoes,
          classe: cnae.classe,
          grupo: cnae.grupo,
          divisao: cnae.divisao,
          secao: cnae.secao
        };
      })
      .filter((cnae: CNAEInfo | null): cnae is CNAEInfo => cnae !== null && !!cnae.codigo && !!cnae.descricao)
    
    console.log('[IBGE API] ✅ CNAE encontrados:', mappedResults.length);
    if (mappedResults.length > 0) {
      console.log('[IBGE API] 📋 Primeiros resultados:', mappedResults.slice(0, 5).map(c => `${c.codigo} - ${c.descricao?.substring(0, 60)}`));
    } else {
      // Debug adicional: procurar manualmente por códigos que começam com a query
      const codesStartingWithQuery = allSubclasses
        .filter(c => {
          const codigoStr = String(c.codigo || '');
          const codigoClean = codigoStr.replace(/[.\-\/]/g, '');
          return codigoClean.startsWith(cleanQuery);
        })
        .slice(0, 5)
        .map(c => ({
          codigo: c.codigo,
          codigoClean: String(c.codigo || '').replace(/[.\-\/]/g, ''),
          descricao: c.descricao?.substring(0, 50)
        }));
      console.log(`[IBGE API] 🔍 Debug - Códigos que começam com "${cleanQuery}":`, codesStartingWithQuery);
    }
    
    return mappedResults.slice(0, 30); // Limitar a 30 resultados
  } catch (error) {
    console.error('[IBGE API] ❌ Erro CNAE:', error);
    return [];
  }
}

export async function getCNAEByCode(code: string): Promise<CNAEInfo | null> {
  try {
    console.log('[IBGE API] 🔍 Buscando CNAE por código:', code);
    
    // Limpar código (remover formatação)
    const cleanCode = code.replace(/[.\-\/]/g, '').trim();
    
    // Buscar todas as subclasses e filtrar pelo código exato
    // A API do IBGE pode retornar múltiplos registros para o mesmo código
    console.log('[IBGE API] 🔍 Buscando todas as subclasses para filtrar por código:', cleanCode);
    const response = await fetch(`${IBGE_API_BASE}/cnae/subclasses`);
    if (!response.ok) {
      console.warn('[IBGE API] ⚠️ Erro ao buscar subclasses:', response.status);
      return null;
    }
    
    const allSubclasses = await response.json();
    
    if (!Array.isArray(allSubclasses)) {
      console.warn('[IBGE API] ⚠️ Resposta não é um array');
      return null;
    }
    
    // Filtrar todos os registros que correspondem ao código
    // Para código de 4 dígitos (ex: 0134), buscar códigos que começam com ele (ex: 01.34-2/00)
    const matchingCNAEs = allSubclasses
      .filter((cnae: any) => {
        if (!cnae) return false;
        
        // Verificar código em diferentes formatos
        let codigoCNAE = cnae.codigo || cnae.codigo_subclasse || cnae.subclasse || '';
        if (!codigoCNAE && cnae.id) {
          // Se não tem código mas tem ID, tentar usar ID como fallback
          codigoCNAE = String(cnae.id);
        }
        
        if (!codigoCNAE || codigoCNAE === 'undefined' || codigoCNAE === 'null') {
          return false;
        }
        
        const cnaeCodeClean = String(codigoCNAE).replace(/[.\-\/]/g, '').trim();
        
        // Se o código digitado é de 4 dígitos, buscar todos que começam com ele
        if (cleanCode.length === 4) {
          return cnaeCodeClean.startsWith(cleanCode);
        }
        
        // Para outros tamanhos, buscar por correspondência exata ou parcial
        return cnaeCodeClean === cleanCode || cnaeCodeClean.startsWith(cleanCode);
      })
      .map((cnae: any) => {
        // Garantir que temos código e descrição
        let codigo = cnae.codigo || cnae.codigo_subclasse || cnae.subclasse || '';
        const descricao = cnae.descricao || cnae.descricao_subclasse || '';
        
        // Se não tem código formatado, tentar construir do ID
        if (!codigo && cnae.id) {
          // Formatar ID como código CNAE se possível
          codigo = formatCNAECode(String(cnae.id));
        }
        
        return {
          ...cnae,
          codigo: codigo || String(cnae.id || ''),
          descricao: descricao || cnae.nome || ''
        };
      })
      .filter((cnae: any) => cnae.codigo && cnae.descricao); // Garantir que tem ambos
    
    if (matchingCNAEs.length === 0) {
      console.warn('[IBGE API] ⚠️ Nenhum CNAE encontrado para código:', code);
      return null;
    }
    
    console.log(`[IBGE API] ✅ Encontrados ${matchingCNAEs.length} registros para código ${code}`);
    
    // Pegar o primeiro registro (com código e descrição completos do IBGE)
    const primeiro = matchingCNAEs[0];
    
    // Debug: verificar estrutura completa
    console.log('[IBGE API] 📋 Estrutura completa do CNAE encontrado:', {
      codigo: primeiro.codigo,
      codigoTipo: typeof primeiro.codigo,
      descricao: primeiro.descricao,
      descricaoTipo: typeof primeiro.descricao,
      descricaoLength: primeiro.descricao?.length,
      id: primeiro.id,
      objetoCompleto: primeiro
    });
    
    // Garantir que retornamos o código formatado completo (ex: "01.34-2/00")
    // e a descrição completa do IBGE
    if (!primeiro.codigo || !primeiro.descricao) {
      console.error('[IBGE API] ❌ CNAE encontrado mas sem código ou descrição:', primeiro);
      return null;
    }
    
    console.log('[IBGE API] ✅ CNAE encontrado:', primeiro.codigo, '-', primeiro.descricao);
    
    return primeiro as CNAEInfo;
  } catch (error) {
    console.error('[IBGE API] ❌ Erro ao buscar CNAE por código:', error);
    return null;
  }
}

// Formatar código CNAE para formato padrão (ex: 62015 -> 62.01-5/00)
function formatCNAECode(code: string): string {
  const clean = code.replace(/[.\-\/]/g, '').trim();
  
  // Se já está formatado corretamente, retornar como está
  if (code.includes('.') && code.includes('-') && code.includes('/')) {
    return code;
  }
  
  if (clean.length === 7) {
    // Formato: 6201500 -> 62.01-5/00
    return `${clean.substring(0, 2)}.${clean.substring(2, 4)}-${clean.substring(4, 5)}/${clean.substring(5, 7)}`;
  } else if (clean.length === 5) {
    // Formato: 62015 -> 62.01-5/00
    return `${clean.substring(0, 2)}.${clean.substring(2, 4)}-${clean.substring(4, 5)}/00`;
  } else if (clean.length === 4) {
    // Formato: 0134 -> 01.34-1/00 (divisão - assumir subclasse 1)
    // Mas na verdade, "0134" pode ser uma classe, não subclasse
    // Tentar buscar como classe primeiro: 01.34-1/00
    return `${clean.substring(0, 2)}.${clean.substring(2, 4)}-1/00`;
  } else if (clean.length === 2) {
    // Formato: 01 -> tentar buscar como seção (mas API pode não aceitar)
    // Retornar como está para busca parcial
    return code;
  }
  
  return code; // Retornar como está se não conseguir formatar
}

// ===== 10. PIX (Participantes) =====
export interface PIXParticipant {
  ispb: string;
  nome: string;
  nome_reduzido: string;
  modalidade_participacao: string;
  tipo_participacao: string;
  inicio_operacao: string;
}

export async function getPIXParticipants(): Promise<PIXParticipant[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/pix/v1/participants`);
    if (!response.ok) return [];
    const participants = await response.json();
    console.log('[BrasilAPI] ✅ PIX Participantes:', participants.length);
    return participants;
  } catch (error) {
    console.error('[BrasilAPI] Erro PIX:', error);
    return [];
  }
}

// ===== 11. REGISTRO BR (Domínios) =====
export interface DomainInfo {
  status_code: number;
  status: string;
  fqdn: string;
  hosts: string[];
  publication_status: string;
  expires_at: string;
  suggestions: string[];
}

export async function checkDomain(domain: string): Promise<DomainInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/registrobr/v1/${domain}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ Domínio:', domain, '-', data.status);
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro REGISTRO BR:', error);
    return null;
  }
}

// ===== 12. TAXAS (Juros e Taxas) =====
export interface TaxRate {
  nome: string;
  valor: number;
}

export async function getTaxRates(): Promise<TaxRate[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/taxas/v1`);
    if (!response.ok) return [];
    const rates = await response.json();
    console.log('[BrasilAPI] ✅ Taxas:', rates.length);
    return rates;
  } catch (error) {
    console.error('[BrasilAPI] Erro TAXAS:', error);
    return [];
  }
}

// ===== FUNÇÕES UTILITÁRIAS =====

/**
 * 🎯 ANÁLISE COMPLETA DE EMPRESA (BrasilAPI)
 */
export async function analyzeCompanyWithBrasilAPI(data: {
  cnpj?: string;
  cep?: string;
  uf?: string;
  domain?: string;
  phone?: string;
}) {
  console.log('[BrasilAPI] 🔍 Análise completa iniciada');

  const analysis: any = {};

  // CEP (se disponível)
  if (data.cep) {
    analysis.cep = await getCEPInfoV2(data.cep);
  }

  // DDD (extrair do telefone)
  if (data.phone) {
    const ddd = data.phone.replace(/\D/g, '').substring(0, 2);
    if (ddd.length === 2) {
      analysis.ddd = await getDDDInfo(ddd);
    }
  }

  // IBGE (estado)
  if (data.uf) {
    analysis.cities = await getIBGECities(data.uf);
  }

  // Domínio
  if (data.domain) {
    analysis.domain = await checkDomain(data.domain);
  }

  // Feriados (útil para planejamento)
  analysis.holidays = await getHolidays();

  // Taxas (contexto econômico)
  analysis.taxRates = await getTaxRates();

  console.log('[BrasilAPI] ✅ Análise completa finalizada');
  return analysis;
}

/**
 * 📍 GEOCODING PRECISO (CEP V2 com coordenadas)
 */
export async function geocodeByCEP(cep: string): Promise<{
  lat: number;
  lng: number;
  address: string;
} | null> {
  const info = await getCEPInfoV2(cep);
  
  if (!info || !info.location) {
    return null;
  }

  return {
    lat: parseFloat(info.location.coordinates.latitude),
    lng: parseFloat(info.location.coordinates.longitude),
    address: `${info.street}, ${info.neighborhood}, ${info.city}/${info.state}`
  };
}

/**
 * 📞 VALIDAR TELEFONE BRASILEIRO (DDD)
 */
export async function validateBrazilianPhone(phone: string): Promise<{
  valid: boolean;
  ddd: string;
  state?: string;
  cities?: string[];
}> {
  const phoneClean = phone.replace(/\D/g, '');
  const ddd = phoneClean.substring(0, 2);

  if (ddd.length !== 2 || phoneClean.length < 10) {
    return { valid: false, ddd: '' };
  }

  const dddInfo = await getDDDInfo(ddd);

  return {
    valid: !!dddInfo,
    ddd,
    state: dddInfo?.state,
    cities: dddInfo?.cities
  };
}

/**
 * 🏦 IDENTIFICAR BANCO POR CNPJ (primeiros 8 dígitos = ISPB)
 */
export async function identifyBankByCNPJ(cnpj: string): Promise<BankInfo | null> {
  const cnpjClean = cnpj.replace(/\D/g, '');
  const ispb = cnpjClean.substring(0, 8);

  const banks = await getAllBanks();
  return banks.find(b => b.ispb === ispb) || null;
}

