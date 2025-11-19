// Util para criar snapshot final do relatório ICP
// Consolida full_report em analysis_data (imutável) para PDF e read-only

import { supabase } from '@/integrations/supabase/client';

export type Snapshot = {
  version: number;              // timestamp numérico
  closed_at: string;            // ISO datetime
  tabs: Record<string, any>;    // full_report consolidado
};

/**
 * Busca o full_report de stc_verification_history
 */
export async function fetchFullReport(stcHistoryId: string): Promise<Record<string, any>> {
  console.log(`[SNAPSHOT] 📦 Buscando full_report do stcHistoryId: ${stcHistoryId}...`);
  
  const { data, error } = await supabase
    .from('stc_verification_history')
    .select('full_report')
    .eq('id', stcHistoryId)
    .single();
  
  if (error) {
    console.error('[SNAPSHOT] ❌ Erro ao buscar full_report:', error);
    throw error;
  }
  
  console.log('[SNAPSHOT] ✅ full_report carregado com sucesso');
  return (data?.full_report ?? {}) as Record<string, any>;
}

/**
 * Escreve o snapshot final em icp_analysis_results.analysis_data
 */
export async function writeSnapshotToAnalysisData(
  icpAnalysisResultId: string, 
  snapshot: Snapshot
): Promise<void> {
  console.log(`[SNAPSHOT] 💾 Escrevendo snapshot em analysis_data (ID: ${icpAnalysisResultId})...`);
  
  const { error } = await supabase
    .from('icp_analysis_results')
    .update({ analysis_data: snapshot })
    .eq('id', icpAnalysisResultId);
  
  if (error) {
    console.error('[SNAPSHOT] ❌ Erro ao escrever snapshot:', error);
    throw error;
  }
  
  console.log('[SNAPSHOT] ✅ Snapshot salvo com sucesso em analysis_data');
}

/**
 * Cria um snapshot a partir do full_report e salva em analysis_data
 */
export async function createSnapshotFromFullReport(params: {
  icpAnalysisResultId: string;
  stcHistoryId: string;
}): Promise<Snapshot> {
  console.log('[SNAPSHOT] 🎯 Criando snapshot final do relatório...');
  
  // 1. Buscar full_report
  const fullReport = await fetchFullReport(params.stcHistoryId);
  
  // 2. Criar snapshot
  const snapshot: Snapshot = {
    version: Date.now(),
    closed_at: new Date().toISOString(),
    tabs: fullReport,
  };
  
  console.log(`[SNAPSHOT] 📸 Snapshot criado - versão: ${snapshot.version}, fechado em: ${snapshot.closed_at}`);
  
  // 3. Salvar em analysis_data
  await writeSnapshotToAnalysisData(params.icpAnalysisResultId, snapshot);
  
  console.log('[SNAPSHOT] ✅ Snapshot final criado e salvo com sucesso!');
  return snapshot;
}

/**
 * Carrega snapshot de icp_analysis_results.analysis_data
 */
export async function loadSnapshot(icpAnalysisResultId: string): Promise<Snapshot | null> {
  console.log(`[SNAPSHOT] 📂 Carregando snapshot do icpAnalysisResultId: ${icpAnalysisResultId}...`);
  
  const { data, error } = await supabase
    .from('icp_analysis_results')
    .select('analysis_data')
    .eq('id', icpAnalysisResultId)
    .single();
  
  if (error) {
    console.error('[SNAPSHOT] ❌ Erro ao carregar snapshot:', error);
    throw error;
  }
  
  const snapshot = (data?.analysis_data ?? null) as Snapshot | null;
  
  if (snapshot) {
    console.log(`[SNAPSHOT] ✅ Snapshot carregado - versão: ${snapshot.version}, fechado em: ${snapshot.closed_at}`);
  } else {
    console.log('[SNAPSHOT] ℹ️ Nenhum snapshot encontrado (relatório ainda aberto)');
  }
  
  return snapshot;
}

/**
 * Verifica se o relatório está fechado (somente leitura)
 */
export function isReportClosed(snapshot: Snapshot | null): boolean {
  const closed = !!snapshot?.closed_at;
  console.log(`[SNAPSHOT] 🔒 Relatório fechado? ${closed ? 'SIM (read-only)' : 'NÃO (editável)'}`);
  return closed;
}

/**
 * Gera PDF completo do relatório TOTVS
 * ✅ IMPLEMENTADO: Usa jsPDF para gerar PDF profissional
 */
export async function generatePdfFromSnapshot(
  snapshot: Snapshot,
  options?: { companyName?: string; cnpj?: string }
): Promise<void> {
  console.log('[SNAPSHOT] 📄 Gerando PDF executivo do snapshot...');
  
  try {
    // Importar gerador de PDF dinamicamente
    const { generateTOTVSPDF } = await import('@/services/pdfGenerator');
    
    await generateTOTVSPDF(snapshot, {
      companyName: options?.companyName,
      cnpj: options?.cnpj,
      generatedAt: new Date(snapshot.closed_at || Date.now()),
    });
    
    console.log('[SNAPSHOT] ✅ PDF gerado com sucesso!');
  } catch (error) {
    console.error('[SNAPSHOT] ❌ Erro ao gerar PDF:', error);
    throw error;
  }
}

