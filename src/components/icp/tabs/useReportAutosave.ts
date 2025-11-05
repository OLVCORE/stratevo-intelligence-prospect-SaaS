// Hook genérico para autosave de abas do relatório ICP
// Salva em stc_verification_history.full_report com status e cache_key
// Anti-reprocesso: se cache_key igual + status 'completed' → não reprocessa APIs

import { useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export type TabKey =
  | 'keywords' | 'totvs' | 'competitors' | 'similar'
  | 'clients' | 'decisores' | 'full360' | 'products' | 'executive';

type Params = {
  stcHistoryId: string;    // id em stc_verification_history
  tabKey: TabKey;
  cacheKey?: string;       // hash dos inputs relevantes
  initialData?: any;
};

const fetchFullReport = async (stcHistoryId: string) => {
  const { data, error } = await supabase
    .from('stc_verification_history')
    .select('id, full_report')
    .eq('id', stcHistoryId)
    .single();
  
  if (error) throw error;
  return (data?.full_report ?? {}) as any;
};

const updateFullReport = async (stcHistoryId: string, fullReport: any) => {
  const { data, error } = await supabase
    .from('stc_verification_history')
    .update({ full_report: fullReport, updated_at: new Date().toISOString() })
    .eq('id', stcHistoryId)
    .select('id, full_report')
    .single();
  
  if (error) throw error;
  return data.full_report as any;
};

export function useReportAutosave({ stcHistoryId, tabKey, cacheKey, initialData }: Params) {
  const qc = useQueryClient();
  const qk = ['stc_full_report', stcHistoryId];

  const { data: fullReport, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => fetchFullReport(stcHistoryId),
    initialData: initialData ?? {},
    staleTime: 30000, // 30s cache
  });

  const { mutateAsync: persist } = useMutation({
    mutationFn: (next: any) => updateFullReport(stcHistoryId, next),
    onSuccess: (next) => {
      qc.setQueryData(qk, next);
      console.log(`[AUTOSAVE] ✅ Aba '${tabKey}' salva com sucesso`);
    },
    onError: (error) => {
      console.error(`[AUTOSAVE] ❌ Erro ao salvar aba '${tabKey}':`, error);
    },
  });

  const getTab = () => (fullReport?.[tabKey] ?? { data: {}, cache_key: null });
  
  const getStatus = (): 'draft' | 'processing' | 'completed' | 'error' =>
    fullReport?.__status?.[tabKey]?.status ?? 'draft';

  const setStatus = (status: 'draft' | 'processing' | 'completed' | 'error') => {
    const next = { ...(fullReport ?? {}) };
    next.__status = { ...(next.__status ?? {}) };
    next.__status[tabKey] = { status, updated_at: new Date().toISOString() };
    return next;
  };

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    async (partialData: any, status: 'draft' | 'processing' | 'completed' = 'draft') => {
      if (timer.current) clearTimeout(timer.current);
      
      const next = setStatus(status);
      next[tabKey] = { 
        ...(getTab()), 
        data: partialData, 
        cache_key: cacheKey ?? getTab().cache_key ?? null 
      };
      
      console.log(`[AUTOSAVE] ⏳ Agendando salvamento da aba '${tabKey}' em 1.2s...`);
      timer.current = setTimeout(() => persist(next), 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stcHistoryId, tabKey, cacheKey, fullReport]
  );

  const flushSave = useCallback(
    async (partialData: any, status: 'draft' | 'processing' | 'completed' = 'draft') => {
      if (timer.current) clearTimeout(timer.current);
      
      const next = setStatus(status);
      next[tabKey] = { 
        ...(getTab()), 
        data: partialData, 
        cache_key: cacheKey ?? getTab().cache_key ?? null 
      };
      
      console.log(`[AUTOSAVE] 💾 Salvando imediatamente aba '${tabKey}'...`);
      await persist(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stcHistoryId, tabKey, cacheKey, fullReport]
  );

  const shouldSkipExpensiveProcessing =
    getStatus() === 'completed' && !!cacheKey && getTab().cache_key === cacheKey;

  return {
    isLoading,
    tabData: getTab().data,
    status: getStatus(),
    scheduleSave,
    flushSave,
    shouldSkipExpensiveProcessing,
  };
}

