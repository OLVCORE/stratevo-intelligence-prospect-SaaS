import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface STCHistoryParams {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  existingId?: string;
}

/**
 * Hook para garantir que existe um registro em stc_verification_history
 * ANTES de começar qualquer processamento.
 * 
 * Se já existe (existingId), usa ele.
 * Se não existe, cria um novo registro vazio.
 * 
 * @returns { stcHistoryId, isCreating, error }
 */
export function useEnsureSTCHistory(params: STCHistoryParams) {
  const { companyId, companyName, cnpj, existingId } = params;
  const [stcHistoryId, setStcHistoryId] = useState<string | null>(existingId || null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se já tem ID, não precisa criar
    if (existingId) {
      setStcHistoryId(existingId);
      return;
    }

    // Criar novo registro
    const createInitialRecord = async () => {
      setIsCreating(true);
      setError(null);

      try {
        console.info('[STC] 📝 Criando registro inicial para:', companyName);

        // INSERT MINIMALISTA - só colunas garantidas
        const { data, error: insertError } = await supabase
          .from('stc_verification_history')
          .insert({
            company_name: companyName,
            cnpj: cnpj || null,
            status: 'draft', // 🔥 CRÍTICO: Campo obrigatório no banco
            full_report: {
              __meta: {
                created_at: new Date().toISOString(),
                status: 'draft',
                company_name: companyName,
                cnpj: cnpj || null,
              },
              __status: {
                keywords: { status: 'draft', updated_at: null },
                totvs: { status: 'draft', updated_at: null },
                competitors: { status: 'draft', updated_at: null },
                similar: { status: 'draft', updated_at: null },
                clients: { status: 'draft', updated_at: null },
                decisores: { status: 'draft', updated_at: null },
                analysis_360: { status: 'draft', updated_at: null },
                products: { status: 'draft', updated_at: null },
                executive: { status: 'draft', updated_at: null },
              },
            },
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('[STC] ❌ Erro ao criar registro:', insertError);
          setError(insertError.message);
          return;
        }

        console.info('[STC] ✅ Registro criado:', data.id);
        setStcHistoryId(data.id);
      } catch (err: any) {
        console.error('[STC] ❌ Erro inesperado:', err);
        setError(err.message || 'Erro ao criar registro');
      } finally {
        setIsCreating(false);
      }
    };

    createInitialRecord();
  }, [companyId, companyName, cnpj, existingId]);

  return { stcHistoryId, isCreating, error };
}

