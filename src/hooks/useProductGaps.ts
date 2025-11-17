import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseProductGapsParams {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  detectedProducts?: string[];
  detectedEvidences?: Array<{
    product: string;
    sources: Array<{ url: string; title: string; source_name: string }>;
  }>;
  competitors?: any[];
  similarCompanies?: any[];
  decisorsData?: any;
  digitalData?: any;
  analysis360Data?: any;
  enabled?: boolean;
}

export function useProductGaps({
  companyId,
  companyName,
  cnpj,
  sector,
  cnae,
  size,
  employees,
  detectedProducts = [],
  detectedEvidences = [],
  competitors = [],
  similarCompanies = [],
  decisorsData,
  digitalData,
  analysis360Data,
  enabled = true
}: UseProductGapsParams) {
  return useQuery({
    queryKey: ['product-gaps', companyId, companyName, sector, detectedProducts.join(',')],
    queryFn: async () => {
      console.log('[useProductGaps] 🧠 ANÁLISE HOLÍSTICA - Buscando recomendações para:', companyName);
      console.log('[useProductGaps] 📦 Setor:', sector, '| CNAE:', cnae || 'N/A', '| Funcionários:', employees);
      console.log('[useProductGaps] 🔍 Produtos detectados:', detectedProducts.length);
      console.log('[useProductGaps] 📋 Evidências:', detectedEvidences.length);
      console.log('[useProductGaps] 👥 Decisores:', decisorsData?.total || 0);
      console.log('[useProductGaps] 🌐 Digital Score:', digitalData?.maturityScore || 0);
      console.log('[useProductGaps] 💰 Saúde:', analysis360Data?.healthScore || 'unknown');

      // 🔥 VALIDAÇÃO E NORMALIZAÇÃO: Garantir setor válido para Edge Function
      const normalizedSector = (() => {
        if (!sector) return 'Serviços';
        
        const sectorLower = sector.toLowerCase();
        
        // Rejeitar setores inválidos
        if (sectorLower.includes('venture') || sectorLower.includes('private equity')) {
          return 'Serviços';
        }
        
        // Normalizar variações de setores conhecidos
        if (sectorLower.includes('saude') || sectorLower.includes('health') || 
            sectorLower === 'saúde' || sectorLower === 'saude') {
          return 'Saúde';
        }
        if (sectorLower.includes('logistica') || sectorLower.includes('logistics') ||
            sectorLower === 'logística' || sectorLower === 'logistica') {
          return 'Logística';
        }
        if (sectorLower.includes('industria') || sectorLower.includes('manufacturing') ||
            sectorLower === 'indústria' || sectorLower === 'industria') {
          return 'Indústria';
        }
        if (sectorLower.includes('educacao') || sectorLower.includes('education') ||
            sectorLower === 'educação' || sectorLower === 'educacao') {
          return 'Educação';
        }
        if (sectorLower.includes('varejo') || sectorLower.includes('retail')) {
          return 'Varejo';
        }
        if (sectorLower.includes('tecnologia') || sectorLower.includes('technology')) {
          return 'Tecnologia';
        }
        if (sectorLower.includes('construcao') || sectorLower.includes('construction') ||
            sectorLower === 'construção' || sectorLower === 'construcao') {
          return 'Construção';
        }
        if (sectorLower.includes('agronegocio') || sectorLower.includes('agribusiness') ||
            sectorLower === 'agronegócio' || sectorLower === 'agronegocio') {
          return 'Agronegócio';
        }
        
        // Manter original se já está normalizado
        return sector;
      })();
      
      console.log('[useProductGaps] 🔄 Setor normalizado:', {
        original: sector,
        normalized: normalizedSector
      });

      // 🔥 VALIDAÇÃO CRÍTICA: Garantir que employees seja um número válido
      const validatedEmployees = employees && employees > 0 && employees < 100000 
        ? employees 
        : 100; // Default seguro se inválido

      // 🔥 GARANTIR PAYLOAD 100% VÁLIDO (Edge Function é muito sensível!)
      // ✅ REMOVER TODOS OS UNDEFINED E GARANTIR TIPOS CORRETOS
      // 🔥 CRÍTICO: Sempre enviar cnpj como string (mesmo vazia) - Edge Function pode estar esperando string
      const safePayload: any = {
        companyId: companyId || null,
        companyName: String(companyName || '').trim(),
        cnpj: cnpj ? String(cnpj).trim() : '', // ✅ SEMPRE string (não null) - Edge Function pode estar usando cnpj diretamente
        sector: String(normalizedSector || 'Serviços').trim(), // ✅ SEMPRE string válida
        cnae: cnae && String(cnae).trim() ? String(cnae).trim() : '', // ✅ SEMPRE string (não null) - mesma lógica
        size: String(size || 'EPP').trim(), // ✅ SEMPRE string válida
        employees: Number(validatedEmployees), // ✅ SEMPRE número válido (1-99999)
        detectedProducts: Array.isArray(detectedProducts) ? detectedProducts : [], // ✅ SEMPRE array
        detectedEvidences: Array.isArray(detectedEvidences) ? detectedEvidences : [], // ✅ SEMPRE array
        competitors: Array.isArray(competitors) ? competitors : [], // ✅ SEMPRE array
        similarCompanies: Array.isArray(similarCompanies) ? similarCompanies : [], // ✅ SEMPRE array
      };
      
      // 🧠 CONTEXTO HOLÍSTICO (apenas se existir e for válido E não vazio)
      if (decisorsData && typeof decisorsData === 'object' && Object.keys(decisorsData).length > 0) {
        // Limpar campos null/undefined dos objetos aninhados
        const cleanDecisors: any = {};
        Object.keys(decisorsData).forEach(key => {
          const value = (decisorsData as any)[key];
          if (value !== undefined && value !== null) {
            cleanDecisors[key] = value;
          }
        });
        if (Object.keys(cleanDecisors).length > 0) {
          safePayload.decisorsData = cleanDecisors;
        }
      }
      
      if (digitalData && typeof digitalData === 'object' && Object.keys(digitalData).length > 0) {
        // Limpar campos null/undefined dos objetos aninhados
        const cleanDigital: any = {};
        Object.keys(digitalData).forEach(key => {
          const value = (digitalData as any)[key];
          if (value !== undefined && value !== null) {
            // Limpar socialNetworks também
            if (key === 'socialNetworks' && typeof value === 'object') {
              const cleanSocial: any = {};
              Object.keys(value).forEach(socialKey => {
                const socialValue = (value as any)[socialKey];
                if (socialValue !== undefined && socialValue !== null) {
                  cleanSocial[socialKey] = socialValue;
                }
              });
              if (Object.keys(cleanSocial).length > 0) {
                cleanDigital[key] = cleanSocial;
              }
            } else {
              cleanDigital[key] = value;
            }
          }
        });
        if (Object.keys(cleanDigital).length > 0) {
          safePayload.digitalData = cleanDigital;
        }
      }
      
      if (analysis360Data && typeof analysis360Data === 'object' && Object.keys(analysis360Data).length > 0) {
        // Limpar campos null/undefined dos objetos aninhados
        const clean360: any = {};
        Object.keys(analysis360Data).forEach(key => {
          const value = (analysis360Data as any)[key];
          if (value !== undefined && value !== null) {
            clean360[key] = value;
          }
        });
        if (Object.keys(clean360).length > 0) {
          safePayload.analysis360Data = clean360;
        }
      }
      
      // ✅ REMOVER QUALQUER CAMPO undefined/null de objetos vazios (Edge Function pode rejeitar!)
      Object.keys(safePayload).forEach(key => {
        if (safePayload[key] === undefined) {
          delete safePayload[key];
        }
        // Se for objeto vazio, remover também
        if (typeof safePayload[key] === 'object' && safePayload[key] !== null && !Array.isArray(safePayload[key])) {
          if (Object.keys(safePayload[key]).length === 0) {
            delete safePayload[key];
          }
        }
      });

      // 🔥 VERIFICAR SE cnpj ESTÁ PRESENTE (Edge Function reclama se não estiver)
      if (!safePayload.hasOwnProperty('cnpj')) {
        console.error('[useProductGaps] 🚨 ERRO CRÍTICO: cnpj não está no payload!');
        safePayload.cnpj = '';
      }
      
      console.log('[useProductGaps] 📤 Enviando para Edge Function:', {
        sector: safePayload.sector,
        cnpj: safePayload.cnpj || '(vazio)', // ✅ Log específico do cnpj
        cnae: safePayload.cnae || '(vazio)',
        employees: safePayload.employees,
        size: safePayload.size,
        detectedProducts: safePayload.detectedProducts.length,
        detectedEvidences: safePayload.detectedEvidences.length,
        competitors: safePayload.competitors.length,
        similarCompanies: safePayload.similarCompanies.length,
      });
      
      // 🔥 LOG COMPLETO DO PAYLOAD PARA DEBUG
      console.log('[useProductGaps] 📦 PAYLOAD COMPLETO:', JSON.stringify(safePayload, null, 2));
      console.log('[useProductGaps] ✅ Verificação cnpj:', {
        exists: safePayload.hasOwnProperty('cnpj'),
        value: safePayload.cnpj,
        type: typeof safePayload.cnpj,
        isNull: safePayload.cnpj === null,
        isUndefined: safePayload.cnpj === undefined
      });

      // ✅ A função está configurada com verify_jwt = false no config.toml
      // Portanto, não precisamos passar o JWT e não devemos validar sessão
      let response;
      let errorResponseBody: any = null;
      
      try {
        const result = await supabase.functions.invoke('generate-product-gaps', {
          body: safePayload
          // Não passar headers de Authorization pois verify_jwt = false
        });
        
        response = result;
        
        // Se há erro, tentar ler o corpo da resposta
        if (result.error) {
          console.error('[useProductGaps] 🔍 Erro completo:', result.error);
          
          // Tentar múltiplas formas de extrair o erro
          try {
            if (result.error.context instanceof Response) {
              const clonedResponse = result.error.context.clone();
              errorResponseBody = await clonedResponse.json().catch(async () => {
                // Se JSON falhar, tentar texto
                const text = await clonedResponse.text().catch(() => null);
                return text ? { error: text, raw: text } : null;
              });
            } else if (result.error.context) {
              // Tentar acessar diretamente
              errorResponseBody = result.error.context;
            }
          } catch (e) {
            console.warn('[useProductGaps] ⚠️ Não foi possível ler corpo do erro:', e);
          }
          
          // Tentar ler de data se disponível
          if (!errorResponseBody && result.data) {
            errorResponseBody = typeof result.data === 'string' 
              ? { error: result.data, raw: result.data }
              : result.data;
          }
        }
      } catch (invokeError: any) {
        console.error('[useProductGaps] ❌ Erro ao invocar Edge Function:', invokeError);
        console.error('[useProductGaps] ❌ Stack:', invokeError.stack);
        throw new Error(
          `Erro ao chamar Edge Function: ${invokeError.message || 'Erro desconhecido'}. ` +
          `Setor: ${safePayload.sector}, CNAE: ${safePayload.cnae || 'N/A'}, ` +
          `Funcionários: ${safePayload.employees}. ` +
          `⚠️ O problema está no backend (Edge Function), não no frontend.`
        );
      }

      const { data, error } = response || {};

      if (error) {
        // 🔥 LOG COMPLETO DO ERRO PARA DEBUG
        console.error('[useProductGaps] ❌ Erro na Edge Function:', error);
        console.error('[useProductGaps] ❌ ERROR DETAILS:', {
          message: error.message,
          context: error.context,
          status: error.status,
          statusText: error.statusText,
          responseBody: errorResponseBody,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        
        // 🔥 LOG EXTRA: Tentar extrair mensagem detalhada
        if (errorResponseBody) {
          console.error('[useProductGaps] 🔍 BACKEND ERROR BODY:', JSON.stringify(errorResponseBody, null, 2));
        }
        console.error('[useProductGaps] 📦 Payload enviado (completo):', JSON.stringify(safePayload, null, 2));
        
        // 🚨 MENSAGEM DE ERRO MELHORADA COM DETALHES DO BACKEND
        const backendError = errorResponseBody?.error || errorResponseBody?.message || error.message || 'Erro desconhecido';
        const enhancedError = new Error(
          `❌ Edge Function retornou erro 500.\n\n` +
          `🔍 Detalhes do Backend: ${backendError}\n\n` +
          `📊 Dados enviados:\n` +
          `• Setor: ${safePayload.sector}\n` +
          `• CNAE: ${safePayload.cnae || 'N/A'}\n` +
          `• Funcionários: ${safePayload.employees}\n` +
          `• Tamanho: ${safePayload.size}\n` +
          `• Produtos detectados: ${safePayload.detectedProducts.length}\n\n` +
          `⚠️ O problema está na Edge Function do backend. ` +
          `Verifique os logs do Supabase para mais detalhes.`
        );
        enhancedError.name = 'EdgeFunctionError';
        (enhancedError as any).backendError = errorResponseBody;
        (enhancedError as any).payload = safePayload;
        throw enhancedError;
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || 'Erro ao gerar recomendações';
        console.error('[useProductGaps] ❌ Edge Function retornou erro:', errorMsg);
        console.error('[useProductGaps] 📦 Resposta completa:', data);
        throw new Error(errorMsg);
      }

      console.log('[useProductGaps] Sucesso:', data.recommended_products?.length || 0, 'produtos');

      return data;
    },
    enabled: enabled && !!companyName,
    staleTime: 1000 * 60 * 60 * 24, // ⚡ 24 HORAS (cache longo)
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,     // ❌ NÃO refetch ao trocar aba!
    refetchOnMount: false,           // ❌ NÃO refetch ao montar!
    retry: 1, // ✅ Reduzir retries para evitar múltiplas tentativas desnecessárias
    retryDelay: 2000 // ✅ Delay de 2s entre tentativas
  });
}

