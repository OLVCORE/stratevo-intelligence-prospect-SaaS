// src/hooks/useBatchUsageAnalysis.ts
// Hook para análise em lote de verificação de uso (genérico, multi-tenant)

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchCompany {
  id?: string; // ID da empresa no banco (necessário para Apollo)
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  domain?: string;
}

interface BatchProgress {
  total: number;
  processed: number;
  noGo: number;
  go: number;
  errors: number;
  currentCompany: string;
  estimatedTimeRemaining: number;
}

export function useBatchUsageAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    processed: 0,
    noGo: 0,
    go: 0,
    errors: 0,
    currentCompany: '',
    estimatedTimeRemaining: 0,
  });

  const processBatch = async (companies: BatchCompany[]) => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    setProgress({
      total: companies.length,
      processed: 0,
      noGo: 0,
      go: 0,
      errors: 0,
      currentCompany: '',
      estimatedTimeRemaining: companies.length * 35, // ~35s por empresa
    });

    console.log(`[BATCH] 🚀 Iniciando processamento em lote de ${companies.length} empresas`);

    const results = [];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        setProgress(prev => ({
          ...prev,
          processed: i,
          currentCompany: company.razao_social,
          estimatedTimeRemaining: (companies.length - i) * 35,
        }));

        console.log(`[BATCH] 📊 Processando ${i + 1}/${companies.length}: ${company.razao_social}`);

        // ===== ABA 1: VERIFICAÇÃO DE USO =====
        console.log(`[BATCH] 🔍 Verificando uso...`);
        const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('usage-verification', {
          body: {
            company_name: company.razao_social,
            cnpj: company.cnpj,
            domain: company.domain,
          },
        });

        if (verificationError) throw verificationError;

        const isNoGo = verificationResult.status === 'no-go';
        const isGo = verificationResult.status === 'go';

        // ===== ABA 2: DECISORES (só se for GO) =====
        let decisors = null;
        if (isGo) {
          console.log(`[BATCH] 👥 Extraindo decisores com Apollo (critério REFINADO)...`);
          try {
            // Se não tiver company.id, buscar pelo CNPJ
            let companyId = company.id;
            if (!companyId && company.cnpj) {
              const { data: foundCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('cnpj', company.cnpj)
                .maybeSingle();
              companyId = foundCompany?.id;
            }
            
            // USAR MESMA LÓGICA DA ENGRENAGEM INDIVIDUAL (QUE FUNCIONA!)
            const { data: decisorsData, error: decisorsError } = await supabase.functions.invoke('enrich-apollo-decisores', {
              body: {
                company_id: companyId, // ID da empresa no banco
                company_name: company.razao_social,
                domain: company.domain,
                modes: ['people', 'company'], // BUSCAR PESSOAS + ORGANIZAÇÃO (CRÍTICO!)
              },
            });
            
            if (decisorsError) {
              console.warn(`[BATCH] ⚠️ Erro Apollo (continuando):`, decisorsError);
            } else {
              decisors = decisorsData;
              console.log(`[BATCH] ✅ ${decisorsData?.decisores?.length || 0} decisores encontrados`);
            }
          } catch (err) {
            console.warn(`[BATCH] ⚠️ Erro ao extrair decisores (continuando):`, err);
          }
        }

        // ===== ABA 3: DIGITAL (só se for GO) =====
        let digital = null;
        if (isGo && decisors?.companyData?.website) {
          console.log(`[BATCH] 🌐 Descobrindo presença digital...`);
          // Usar website descoberto pelos decisores
          digital = {
            website: decisors.companyData.website,
            linkedin: decisors.companyData.linkedinUrl,
            discovered_at: new Date().toISOString(),
          };
        }

        // ===== SALVAR RELATÓRIO COMPLETO =====
        console.log(`[BATCH] 💾 Salvando relatório...`);
        
        // 1. Criar registro em stc_verification_history
        const { data: historyRecord, error: historyError } = await supabase
          .from('stc_verification_history')
          .insert({
            company_name: company.razao_social,
            cnpj: company.cnpj,
            status: verificationResult.status,
            confidence: verificationResult.confidence,
            triple_matches: verificationResult.triple_matches || 0,
            double_matches: verificationResult.double_matches || 0,
            single_matches: verificationResult.single_matches || 0,
            total_score: verificationResult.total_weight || 0,
            evidences: verificationResult.evidences || [],
            sources_consulted: verificationResult.methodology?.searched_sources || 0,
            queries_executed: verificationResult.methodology?.total_queries || 0,
            full_report: {
              detection_report: verificationResult,
              decisors_report: decisors,
              keywords_seo_report: digital,
              __status: {
                detection: { status: 'completed' },
                decisors: { status: decisors ? 'completed' : 'skipped' },
                keywords: { status: digital ? 'completed' : 'skipped' },
              },
              __meta: {
                saved_at: new Date().toISOString(),
                batch_processing: true,
                version: '2.0',
              },
            },
          })
          .select()
          .single();

        if (historyError) throw historyError;

        // 2. Atualizar icp_analysis_results
        const { error: icpError } = await supabase
          .from('icp_analysis_results')
          .update({
            status: isNoGo ? 'descartada' : 'processada',
            totvs_status: verificationResult.status, // Manter campo DB por enquanto
            totvs_confidence: verificationResult.confidence, // Manter campo DB por enquanto
            analysis_data: {
              usage_verification: verificationResult, // Novo nome
              decisores: decisors,
              digital: digital,
              processed_at: new Date().toISOString(),
            },
          })
          .eq('cnpj', company.cnpj);

        if (icpError) throw icpError;

        // 3. Se NO-GO, mover para discarded_companies
        if (isNoGo) {
          await supabase.from('discarded_companies').insert({
            company_name: company.razao_social,
            cnpj: company.cnpj,
            discard_reason_id: 'identified_client',
            discard_reason_label: '⚠️ Já é cliente identificado (Verificação Automática)',
            discard_category: 'blocker',
            stc_status: verificationResult.status,
            stc_triple_matches: verificationResult.triple_matches || 0,
            stc_double_matches: verificationResult.double_matches || 0,
            stc_total_score: verificationResult.total_weight || 0,
          });
        }

        // Atualizar progresso
        setProgress(prev => ({
          ...prev,
          processed: i + 1,
          noGo: prev.noGo + (isNoGo ? 1 : 0),
          go: prev.go + (isGo ? 1 : 0),
        }));

        results.push({
          company: company.razao_social,
          cnpj: company.cnpj,
          status: verificationResult.status,
          evidences: verificationResult.evidences?.length || 0,
          decisors: decisors?.decisores?.length || 0,
        });

        console.log(`[BATCH] ✅ ${company.razao_social}: ${verificationResult.status} (${verificationResult.evidences?.length || 0} evidências)`);

      } catch (error: any) {
        console.error(`[BATCH] ❌ Erro em ${company.razao_social}:`, error);
        setProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
        
        results.push({
          company: company.razao_social,
          cnpj: company.cnpj,
          status: 'error',
          error: error.message,
        });
      }

      // Delay entre empresas (evitar rate limit)
      if (i < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s entre empresas
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;

    console.log(`[BATCH] 🎉 Processamento concluído!`);
    console.log(`[BATCH] 📊 Estatísticas:`, {
      total: companies.length,
      go: progress.go,
      noGo: progress.noGo,
      errors: progress.errors,
      tempo: `${Math.round(totalTime)}s`,
      creditos_consumidos: companies.length * 150,
    });

    setIsProcessing(false);

    return {
      results,
      summary: {
        total: companies.length,
        go: progress.go,
        noGo: progress.noGo,
        errors: progress.errors,
        totalTime,
        creditsUsed: companies.length * 150,
      },
    };
  };

  return {
    processBatch,
    isProcessing,
    progress,
  };
}

// Alias para compatibilidade (deprecado)
/** @deprecated Use useBatchUsageAnalysis instead */
export const useBatchTOTVSAnalysis = useBatchUsageAnalysis;

