// src/modules/crm/components/leads/RecoverOrphanLeadsButton.tsx
// Botão para sincronizar e recuperar leads órfãos

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw, Loader2 } from 'lucide-react';

interface RecoverOrphanLeadsButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function RecoverOrphanLeadsButton({
  variant = 'default',
  size = 'default',
  className,
}: RecoverOrphanLeadsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('recover-orphan-leads', {
        body: { manual: true },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`✅ ${data.recovered} leads recuperados!`, {
          description: data.failed > 0 
            ? `${data.failed} conversas não puderam ser processadas`
            : 'Todos os leads foram recuperados com sucesso',
          duration: 5000,
        });

        // Invalidar queries para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leads-quarantine'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } else {
        throw new Error('Falha na sincronização');
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar leads:', error);
      toast.error('❌ Erro ao sincronizar leads', {
        description: error.message || 'Tente novamente em alguns instantes',
        duration: 5000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant={variant}
      size={size}
      className={className}
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sincronizar Leads
        </>
      )}
    </Button>
  );
}

