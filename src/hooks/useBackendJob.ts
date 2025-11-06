import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JobStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

/**
 * Hook para disparar e observar jobs no backend
 * Arquitetura: Frontend dispara → Backend processa → Frontend observa
 * 
 * @param reportId - ID do relatório
 * @returns { triggerJob, status, result, error, isProcessing }
 */
export function useBackendJob(reportId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    status: 'pending',
    progress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Observar mudanças no relatório via Realtime
  useEffect(() => {
    if (!reportId) return;

    console.log('[BackendJob] Listening for updates on report:', reportId);

    const channel = supabase
      .channel(`report-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stc_verification_history',
          filter: `id=eq.${reportId}`,
        },
        (payload) => {
          console.log('[BackendJob] Report updated:', payload.new);
          
          // Atualizar resultado
          if (payload.new.full_report) {
            setJobStatus(prev => ({
              ...prev,
              result: payload.new.full_report,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_state',
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          console.log('[BackendJob] Report state updated:', payload.new);
          
          const state = payload.new as any;
          
          setJobStatus(prev => ({
            ...prev,
            status: state.status === 'processing' ? 'running' : state.status,
            progress: state.progress_percent || 0,
            error: state.error_message,
          }));

          // Atualizar flag de processamento
          setIsProcessing(state.status === 'processing');

          // Toast de feedback
          if (state.status === 'completed') {
            toast.success('✅ Processamento concluído!', {
              description: `${state.progress_percent}% completo`,
            });
          } else if (state.status === 'failed') {
            toast.error('❌ Erro no processamento', {
              description: state.error_message || 'Erro desconhecido',
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[BackendJob] Unsubscribing from report:', reportId);
      channel.unsubscribe();
    };
  }, [reportId]);

  /**
   * Dispara um job no backend
   */
  const triggerJob = async (jobType: string) => {
    if (!reportId) {
      toast.error('Erro: relatório não inicializado');
      return;
    }

    setIsProcessing(true);
    setJobStatus({ status: 'running', progress: 0 });

    try {
      console.log(`[BackendJob] Triggering ${jobType} for report:`, reportId);

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke(`process-${jobType}`, {
        body: { reportId },
      });

      if (error) {
        throw error;
      }

      console.log(`[BackendJob] ${jobType} dispatched successfully`);
      
      toast.info('🚀 Processamento iniciado', {
        description: 'Aguarde enquanto processamos os dados...',
      });

    } catch (error: any) {
      console.error(`[BackendJob] Error triggering ${jobType}:`, error);
      
      setJobStatus({
        status: 'failed',
        progress: 0,
        error: error.message,
      });
      
      setIsProcessing(false);

      toast.error('Erro ao iniciar processamento', {
        description: error.message,
      });
    }
  };

  return {
    triggerJob,
    status: jobStatus.status,
    progress: jobStatus.progress,
    result: jobStatus.result,
    error: jobStatus.error,
    isProcessing,
  };
}

