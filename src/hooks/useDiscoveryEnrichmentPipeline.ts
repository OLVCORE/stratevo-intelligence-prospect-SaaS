/**
 * Hook para o pipeline de enriquecimento estratégico do Discovery.
 * Só executa por ação explícita (ex.: botão "Executar Enriquecimento Estratégico (Discovery)").
 * Ordem: 1) find-prospect-website → 2) scan-prospect-website → 3) calculate-product-fit → 4) enrich-apollo-decisores → 5) digital-intelligence-analysis.
 * Após os 5 passos, persiste full_report em stc_verification_history (update ou insert). Persistência automática, sem botão Salvar.
 * Governança: sem alterar tabelas/RLS; reutiliza Edge Functions existentes.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface DiscoveryPipelineProgress {
  step: number;
  stepName: string;
  percent: number;
}

export interface UseDiscoveryEnrichmentPipelineParams {
  companyId: string | null | undefined;
  tenantId: string | null | undefined;
  onProgress?: (info: DiscoveryPipelineProgress) => void;
}

export interface DiscoveryPipelineResult {
  runPipeline: () => Promise<void>;
  isRunning: boolean;
  error: string | null;
  progress: DiscoveryPipelineProgress | null;
}

const PIPELINE_STEPS: { step: number; name: string; percent: number }[] = [
  { step: 0, name: 'Preparando...', percent: 0 },
  { step: 1, name: 'Buscando website oficial', percent: 15 },
  { step: 2, name: 'Escaneando website e extraindo produtos', percent: 35 },
  { step: 3, name: 'Calculando fit de produtos', percent: 55 },
  { step: 4, name: 'Buscando decisores no Apollo', percent: 75 },
  { step: 5, name: 'Analisando presença digital', percent: 90 },
  { step: 6, name: 'Salvando relatório', percent: 100 },
];

export function useDiscoveryEnrichmentPipeline({
  companyId,
  tenantId,
  onProgress,
}: UseDiscoveryEnrichmentPipelineParams): DiscoveryPipelineResult {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DiscoveryPipelineProgress | null>(null);
  const queryClient = useQueryClient();

  const reportProgress = useCallback((step: number, stepName: string, percent: number) => {
    const info: DiscoveryPipelineProgress = { step, stepName, percent };
    setProgress(info);
    onProgress?.(info);
  }, [onProgress]);

  const runPipeline = useCallback(async () => {
    if (!companyId || !tenantId) {
      setError('Empresa ou tenant não disponível.');
      toast.error('Enriquecimento: empresa ou tenant não disponível.');
      return;
    }

    setIsRunning(true);
    setError(null);
    reportProgress(0, PIPELINE_STEPS[0].name, 0);

    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!companyData) {
        throw new Error('Empresa não encontrada');
      }

      const company = companyData as Record<string, unknown>;
      const rawData = (company.raw_data as Record<string, unknown>) || {};
      const receita = (rawData.receita_federal as Record<string, unknown>) || {};

      const razaoSocial = (company.name as string) || (receita.nome as string) || (company.company_name as string) || '';
      const cnpj = (company.cnpj as string) || (receita.cnpj as string) || '';
      const city = (receita.municipio as string) || (company.city as string) || '';
      const state = (receita.uf as string) || (company.state as string) || '';
      const cep = (receita.cep as string) || (company.zip_code as string) || '';
      const fantasia = (receita.fantasia as string) || (receita.nome_fantasia as string) || (company.fantasy_name as string) || '';
      let websiteUrl = (company.website as string) || (company.domain as string) || '';
      const companyName = (company.name as string) || (company.company_name as string) || razaoSocial;

      // 1) find-prospect-website
      if (!websiteUrl?.trim() && razaoSocial) {
        reportProgress(1, PIPELINE_STEPS[1].name, PIPELINE_STEPS[1].percent);
        toast.info('Buscando website oficial...');
        const { data: findData, error: findErr } = await supabase.functions.invoke('find-prospect-website', {
          body: { razao_social: razaoSocial, cnpj: cnpj || undefined, tenant_id: tenantId },
        });
        if (findErr) {
          console.warn('[DiscoveryPipeline] find-prospect-website:', findErr);
        } else if (findData?.success && findData?.website) {
          websiteUrl = findData.website;
        }
      }

      // 2) Extrair produtos do website do prospect — MESMO MECANISMO do onboarding Etapa 1 (scan-website-products)
      // Onboarding usa scan-website-products com tenant_id → tenant_products; dossiê usa company_id → companies.raw_data.produtos_extracted
      const websiteToScan = websiteUrl?.trim() || '';
      const scanRan = !!(websiteToScan || companyId);
      if (scanRan && websiteToScan) {
        reportProgress(2, PIPELINE_STEPS[2].name, PIPELINE_STEPS[2].percent);
        toast.info('Escaneando website e extraindo produtos da empresa analisada...');
        // 🔥 DOSSIÊ: scan-website-products com company_id → companies.raw_data; enviar tenant_id para compatibilidade com validação no backend
        const { data: scanData, error: scanErr } = await supabase.functions.invoke('scan-website-products', {
          body: {
            company_id: companyId,
            website_url: websiteToScan,
            tenant_id: tenantId || undefined,
          },
        });
        if (scanErr) {
          console.warn('[DiscoveryPipeline] scan-website-products (prospect):', scanErr);
        } else if (scanData?.success) {
          console.log('[DiscoveryPipeline] ✅ Produtos do prospect extraídos:', scanData?.products_found ?? 0);
        }
        // Fallback: scan-prospect-website (LinkedIn, fit score etc.) — opcional após extração de produtos
        const { error: prospectErr } = await supabase.functions.invoke('scan-prospect-website', {
          body: {
            tenant_id: tenantId,
            company_id: companyId,
            website_url: websiteToScan || undefined,
            razao_social: razaoSocial || undefined,
            cnpj: cnpj || undefined,
          },
        });
        if (prospectErr) {
          console.warn('[DiscoveryPipeline] scan-prospect-website (LinkedIn/fit):', prospectErr);
        }
      }

      // ETAPA 1 — Recarregar empresa DEPOIS do scan para ler produtos gravados em companies.raw_data
      const { data: companyAfterScan } = await supabase
        .from('companies')
        .select('id, website, domain, linkedin_url, raw_data')
        .eq('id', companyId)
        .single();
      const rawAfterScan = (companyAfterScan?.raw_data as Record<string, unknown>) || {};
      // Prioridade: produtos_extracted → prospect_products → website_products
      const rawProspectArray =
        (Array.isArray(rawAfterScan.produtos_extracted) ? rawAfterScan.produtos_extracted : null) ??
        (Array.isArray(rawAfterScan.prospect_products) ? rawAfterScan.prospect_products : null) ??
        (Array.isArray(rawAfterScan.website_products) ? rawAfterScan.website_products : null) ??
        [];
      const prospectProductsFromScan = rawProspectArray.map((p: unknown) => {
        const o = (p && typeof p === 'object') ? (p as Record<string, unknown>) : {};
        return {
          name: (o.nome ?? o.name ?? '') as string,
          category: (o.categoria ?? o.category ?? null) as string | null,
          source_url: (o.source_url ?? o.url ?? null) as string | null,
        };
      });

      // 3) calculate-product-fit — tenant_id do tenant ativo (já passado)
      let productFitReport: Record<string, unknown> | null = null;
      reportProgress(3, PIPELINE_STEPS[3].name, PIPELINE_STEPS[3].percent);
      toast.info('Calculando fit de produtos...');
      const { data: fitData, error: fitErr } = await supabase.functions.invoke('calculate-product-fit', {
        body: { company_id: companyId, tenant_id: tenantId },
      });
      if (!fitErr && fitData && typeof fitData === 'object') {
        productFitReport = fitData as Record<string, unknown>;
        const analysis = productFitReport?.analysis as { tenant_products_count?: number } | undefined;
        if ((analysis?.tenant_products_count ?? 0) === 0) {
          toast.warning('Fit 0%: catálogo do tenant sem produtos. Cadastre produtos em tenant_products para este tenant.');
        }
      } else if (fitErr) {
        console.warn('[DiscoveryPipeline] calculate-product-fit:', fitErr);
      }

      // 4) enrich-apollo-decisores
      reportProgress(4, PIPELINE_STEPS[4].name, PIPELINE_STEPS[4].percent);
      toast.info('Buscando decisores no Apollo...');
      const domain = (company.domain as string) || (company.website as string) || websiteUrl || '';
      const industry = (company.industry as string) || '';

      const { error: apolloErr } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: companyId,
          company_name: companyName,
          domain: domain || undefined,
          apollo_org_id: (company as { apollo_organization_id?: string }).apollo_organization_id,
          modes: ['people', 'company'],
          city: city || undefined,
          state: state || undefined,
          industry: industry || undefined,
          cep: cep || undefined,
          fantasia: fantasia || undefined,
        },
      });

      if (apolloErr) {
        console.warn('[DiscoveryPipeline] enrich-apollo-decisores:', apolloErr);
      }

      // 5) digital-intelligence-analysis — Discovery como ato soberano (OLV)
      let digitalReport: Record<string, unknown> = { website: websiteUrl || undefined };
      const sector = (company.industry as string) || '';
      try {
        reportProgress(5, PIPELINE_STEPS[5].name, PIPELINE_STEPS[5].percent);
        toast.info('Analisando presença digital...');
        const { data: digitalData, error: digitalErr } = await supabase.functions.invoke('digital-intelligence-analysis', {
          body: { companyName, cnpj: cnpj || undefined, domain: (company.domain as string) || websiteUrl || undefined, sector },
        });
        if (!digitalErr && digitalData && typeof digitalData === 'object') {
          digitalReport = (digitalData as Record<string, unknown>) || digitalReport;
        } else if (digitalErr) {
          console.warn('[DiscoveryPipeline] digital-intelligence-analysis:', digitalErr);
        }
      } catch (_e) {
        console.warn('[DiscoveryPipeline] digital-intelligence-analysis skip');
      }

      // Persistência obrigatória em stc_verification_history.full_report (Etapa 5 PROMPT CIRÚRGICO)
      const recommendedProducts = Array.isArray(productFitReport?.products_recommendation)
        ? productFitReport.products_recommendation
        : [];
      // Decisors + Company details Apollo (estilo Klabin: segmento, keywords, employees, SIC/NAICS, links)
      let decisorsReport: { decisors?: unknown[]; companyApolloOrg?: Record<string, unknown> } = {};
      const { data: dmRows } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', companyId);
      // Re-fetch company.raw_data para decisors/Apollo (produtos do prospect já vieram de companyAfterScan acima)
      const { data: companyAfter } = await supabase
        .from('companies')
        .select('raw_data')
        .eq('id', companyId)
        .single();
      const companyRaw = (companyAfter?.raw_data as Record<string, unknown>) || {};
      const companyApolloOrg = (companyRaw.apollo_organization as Record<string, unknown>) || (companyRaw.enriched_apollo as Record<string, unknown>) || null;
      if (dmRows && dmRows.length > 0) {
        decisorsReport = { decisors: dmRows, companyApolloOrg: companyApolloOrg || undefined };
      } else if (companyApolloOrg) {
        decisorsReport = { decisors: [], companyApolloOrg };
      }
      const enrichmentSources = ['website', 'product_fit', 'apollo', 'digital'] as const;

      reportProgress(6, PIPELINE_STEPS[6].name, PIPELINE_STEPS[6].percent);

      // ETAPA 5 — Campos mínimos obrigatórios no full_report (reutilização, sem novo motor)
      const { data: tenantProductsRows } = await supabase
        .from('tenant_products')
        .select('id, nome, descricao, categoria, extraido_de')
        .eq('tenant_id', tenantId);
      const tenantProducts = (tenantProductsRows || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        nome: p.nome ?? (p as { product_name?: string }).product_name,
        descricao: p.descricao ?? (p as { description?: string }).description,
        categoria: p.categoria ?? (p as { category?: string }).category,
        origem: p.extraido_de ?? 'tenant_catalog',
      }));
      // Produtos do prospect: usar array já normalizado pós-scan (prioridade: produtos_extracted → prospect_products → website_products)
      const prospectProducts = prospectProductsFromScan.map((p) => ({
        nome: p.name || '—',
        categoria: p.category ?? undefined,
        source_url: p.source_url ?? undefined,
      }));
      let competitorProducts: Record<string, unknown>[] = [];
      try {
        const { data: compRows } = await supabase
          .from('tenant_competitor_products')
          .select('id, nome, descricao, categoria')
          .eq('tenant_id', tenantId);
        if (Array.isArray(compRows)) competitorProducts = compRows as Record<string, unknown>[];
      } catch {
        // tabela opcional
      }
      const extractionSources: string[] = [
        ...(tenantProducts.length > 0 ? ['tenant_catalog'] : []),
        ...(scanRan ? ['prospect_website'] : []),
      ];
      if (extractionSources.length === 0) extractionSources.push('tenant_catalog');

      const newFullReportParts = {
        product_fit_report: productFitReport ?? undefined,
        recommended_products: recommendedProducts,
        decisors_report: (decisorsReport.decisors?.length ?? 0) > 0 || decisorsReport.companyApolloOrg ? decisorsReport : undefined,
        digital_report: digitalReport,
        enrichment_sources: enrichmentSources,
        tenant_products: tenantProducts,
        prospect_products: prospectProducts.length ? prospectProducts : [],
        competitor_products: competitorProducts,
        extraction_sources: extractionSources,
      };

      const { data: latestRow } = await supabase
        .from('stc_verification_history')
        .select('id, full_report')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestRow?.id) {
        const merged = {
          ...(typeof latestRow.full_report === 'object' && latestRow.full_report !== null ? (latestRow.full_report as Record<string, unknown>) : {}),
          ...newFullReportParts,
        };
        const { error: upErr } = await supabase
          .from('stc_verification_history')
          .update({ full_report: merged, updated_at: new Date().toISOString() })
          .eq('id', latestRow.id);
        if (upErr) console.warn('[DiscoveryPipeline] update stc_verification_history:', upErr);
      } else {
        const { error: insErr } = await supabase.from('stc_verification_history').insert({
          company_id: companyId,
          company_name: companyName,
          cnpj: cnpj || null,
          status: 'completed',
          confidence: 'medium',
          triple_matches: 0,
          double_matches: 0,
          single_matches: 0,
          total_score: 0,
          evidences: [],
          sources_consulted: 0,
          queries_executed: 0,
          full_report: newFullReportParts,
        });
        if (insErr) console.warn('[DiscoveryPipeline] insert stc_verification_history:', insErr);
      }

      toast.success('Enriquecimento estratégico concluído.');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['stc-latest', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stc-history', companyId] });
      queryClient.invalidateQueries({ queryKey: ['product-fit', companyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ['company-data', companyId] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao executar enriquecimento.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  }, [companyId, tenantId, queryClient, reportProgress]);

  return { runPipeline, isRunning, error, progress };
}
