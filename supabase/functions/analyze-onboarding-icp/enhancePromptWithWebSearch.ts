/**
 * 🔍 Helper para enriquecer prompt com dados de web search
 * Integra busca web real usando Serper API para fortalecer análise ICP
 */

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  snippet: string;
}

interface EnhancedPromptData {
  webSearchResults: {
    macroeconomic?: WebSearchResult[];
    sectorAnalysis?: WebSearchResult[];
    cnaeAnalysis?: WebSearchResult[];
    foreignTrade?: WebSearchResult[];
    marketTrends?: WebSearchResult[];
  };
  sources: string[];
}

/**
 * Executa buscas web relevantes para enriquecer análise ICP
 */
export async function enhancePromptWithWebSearch(
  onboardingData: any,
  supabaseUrl: string,
  supabaseKey: string
): Promise<EnhancedPromptData> {
  const results: EnhancedPromptData = {
    webSearchResults: {},
    sources: [],
  };

  try {
    const supabase = await import('https://esm.sh/@supabase/supabase-js@2').then(m => 
      m.createClient(supabaseUrl, supabaseKey)
    );

    // 1. Busca macroeconômica do Brasil
    const empresaNome = onboardingData.step1_DadosBasicos?.razaoSocial || '';
    const setorPrincipal = onboardingData.step1_DadosBasicos?.setorPrincipal || '';
    
    if (setorPrincipal) {
      try {
        const { data: macroSearch } = await supabase.functions.invoke('web-search', {
          body: {
            query: `crescimento setor ${setorPrincipal} Brasil 2024 2025 IBGE dados macroeconômicos`,
            limit: 5,
            country: 'BR',
            language: 'pt',
          },
        });
        
        if (macroSearch?.success && macroSearch?.results?.length > 0) {
          results.webSearchResults.macroeconomic = macroSearch.results;
          results.sources.push(...macroSearch.results.map((r: WebSearchResult) => r.url));
        }
      } catch (err) {
        console.error('[ENHANCE-PROMPT] Erro na busca macroeconômica:', err);
      }
    }

    // 2. Análise de setores e nichos
    const setoresAlvo = onboardingData.step2_SetoresNichos?.setoresAlvo || [];
    if (setoresAlvo.length > 0) {
      const setorQuery = setoresAlvo.slice(0, 2).join(' OR ');
      try {
        const { data: sectorSearch } = await supabase.functions.invoke('web-search', {
          body: {
            query: `análise mercado ${setorQuery} Brasil tendências crescimento oportunidades`,
            limit: 5,
            country: 'BR',
            language: 'pt',
          },
        });
        
        if (sectorSearch?.success && sectorSearch?.results?.length > 0) {
          results.webSearchResults.sectorAnalysis = sectorSearch.results;
          results.sources.push(...sectorSearch.results.map((r: WebSearchResult) => r.url));
        }
      } catch (err) {
        console.error('[ENHANCE-PROMPT] Erro na busca de setores:', err);
      }
    }

    // 3. Análise de CNAEs
    const cnaesAlvo = onboardingData.step2_SetoresNichos?.cnaesAlvo || onboardingData.step3_PerfilClienteIdeal?.cnaesAlvo || [];
    if (cnaesAlvo.length > 0) {
      const cnaeQuery = cnaesAlvo.slice(0, 3).join(' ');
      try {
        const { data: cnaeSearch } = await supabase.functions.invoke('web-search', {
          body: {
            query: `CNAE ${cnaeQuery} mercado empresas Brasil dados estatísticos`,
            limit: 5,
            country: 'BR',
            language: 'pt',
          },
        });
        
        if (cnaeSearch?.success && cnaeSearch?.results?.length > 0) {
          results.webSearchResults.cnaeAnalysis = cnaeSearch.results;
          results.sources.push(...cnaeSearch.results.map((r: WebSearchResult) => r.url));
        }
      } catch (err) {
        console.error('[ENHANCE-PROMPT] Erro na busca de CNAEs:', err);
      }
    }

    // 4. Comércio exterior (se aplicável)
    const ncmsAlvo = onboardingData.step3_PerfilClienteIdeal?.ncmsAlvo || [];
    const isImportExport = onboardingData.step1_DadosBasicos?.nomeFantasia?.toLowerCase().includes('import') ||
                          onboardingData.step1_DadosBasicos?.nomeFantasia?.toLowerCase().includes('export') ||
                          onboardingData.step1_DadosBasicos?.nomeFantasia?.toLowerCase().includes('internacional');
    
    if (isImportExport || ncmsAlvo.length > 0) {
      try {
        const { data: foreignTradeSearch } = await supabase.functions.invoke('web-search', {
          body: {
            query: `comércio exterior Brasil ${ncmsAlvo.slice(0, 2).join(' ')} importação exportação dados alfandegários`,
            limit: 5,
            country: 'BR',
            language: 'pt',
          },
        });
        
        if (foreignTradeSearch?.success && foreignTradeSearch?.results?.length > 0) {
          results.webSearchResults.foreignTrade = foreignTradeSearch.results;
          results.sources.push(...foreignTradeSearch.results.map((r: WebSearchResult) => r.url));
        }
      } catch (err) {
        console.error('[ENHANCE-PROMPT] Erro na busca de comércio exterior:', err);
      }
    }

    // 5. Tendências de mercado
    if (setorPrincipal || setoresAlvo.length > 0) {
      try {
        const { data: trendsSearch } = await supabase.functions.invoke('web-search', {
          body: {
            query: `tendências mercado ${setorPrincipal || setoresAlvo[0]} Brasil 2025 previsões projeções`,
            limit: 5,
            country: 'BR',
            language: 'pt',
          },
        });
        
        if (trendsSearch?.success && trendsSearch?.results?.length > 0) {
          results.webSearchResults.marketTrends = trendsSearch.results;
          results.sources.push(...trendsSearch.results.map((r: WebSearchResult) => r.url));
        }
      } catch (err) {
        console.error('[ENHANCE-PROMPT] Erro na busca de tendências:', err);
      }
    }

    console.log('[ENHANCE-PROMPT] ✅ Web search concluído:', {
      macroeconomic: results.webSearchResults.macroeconomic?.length || 0,
      sectorAnalysis: results.webSearchResults.sectorAnalysis?.length || 0,
      cnaeAnalysis: results.webSearchResults.cnaeAnalysis?.length || 0,
      foreignTrade: results.webSearchResults.foreignTrade?.length || 0,
      marketTrends: results.webSearchResults.marketTrends?.length || 0,
      totalSources: results.sources.length,
    });

  } catch (error: any) {
    console.error('[ENHANCE-PROMPT] ❌ Erro geral no web search:', error);
    // Não falhar, apenas retornar dados parciais
  }

  return results;
}

/**
 * Formata resultados de web search para incluir no prompt
 */
export function formatWebSearchForPrompt(searchData: EnhancedPromptData): string {
  let formatted = '\n\n## 📊 DADOS DE BUSCA WEB REALIZADA:\n\n';
  
  if (searchData.webSearchResults.macroeconomic?.length > 0) {
    formatted += '### Dados Macroeconômicos Encontrados:\n';
    searchData.webSearchResults.macroeconomic.forEach((result, idx) => {
      formatted += `${idx + 1}. **${result.title}**\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   Descrição: ${result.description || result.snippet}\n\n`;
    });
  }

  if (searchData.webSearchResults.sectorAnalysis?.length > 0) {
    formatted += '### Análise de Setores Encontrada:\n';
    searchData.webSearchResults.sectorAnalysis.forEach((result, idx) => {
      formatted += `${idx + 1}. **${result.title}**\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   Descrição: ${result.description || result.snippet}\n\n`;
    });
  }

  if (searchData.webSearchResults.cnaeAnalysis?.length > 0) {
    formatted += '### Dados de CNAEs Encontrados:\n';
    searchData.webSearchResults.cnaeAnalysis.forEach((result, idx) => {
      formatted += `${idx + 1}. **${result.title}**\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   Descrição: ${result.description || result.snippet}\n\n`;
    });
  }

  if (searchData.webSearchResults.foreignTrade?.length > 0) {
    formatted += '### Dados de Comércio Exterior Encontrados:\n';
    searchData.webSearchResults.foreignTrade.forEach((result, idx) => {
      formatted += `${idx + 1}. **${result.title}**\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   Descrição: ${result.description || result.snippet}\n\n`;
    });
  }

  if (searchData.webSearchResults.marketTrends?.length > 0) {
    formatted += '### Tendências de Mercado Encontradas:\n';
    searchData.webSearchResults.marketTrends.forEach((result, idx) => {
      formatted += `${idx + 1}. **${result.title}**\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   Descrição: ${result.description || result.snippet}\n\n`;
    });
  }

  if (searchData.sources.length > 0) {
    formatted += `### 📚 Fontes Consultadas (${searchData.sources.length} fontes):\n`;
    formatted += searchData.sources.map((url, idx) => `${idx + 1}. ${url}`).join('\n');
    formatted += '\n\n';
  }

  formatted += '**IMPORTANTE**: Use os dados acima encontrados na web para fortalecer sua análise. Cite URLs específicas quando usar informações dessas fontes. Baseie-se em dados reais e verificáveis, não em suposições.\n\n';

  return formatted;
}

