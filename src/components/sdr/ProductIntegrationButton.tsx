// src/components/sdr/ProductIntegrationButton.tsx
// Botão de integração com produtos/sistemas (genérico, multi-tenant)

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProductIntegrationButtonProps {
  companyId: string;
  contactId?: string;
  action: 'sync_customer' | 'create_opportunity' | 'get_erp_data';
  opportunityData?: any;
  children?: React.ReactNode;
}

export function ProductIntegrationButton({
  companyId,
  contactId,
  action,
  opportunityData,
  children,
}: ProductIntegrationButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const handleIntegration = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-integration', {
        body: {
          action,
          data: {
            company_id: companyId,
            contact_id: contactId,
            opportunity_data: opportunityData,
          },
        },
      });

      if (error) throw error;

      setResult(data.data);
      
      toast({
        title: 'Integração de Produtos',
        description: data.data.message || 'Operação realizada com sucesso',
      });
    } catch (error: any) {
      console.error('Product integration error:', error);
      toast({
        title: 'Erro na integração',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = () => {
    switch (action) {
      case 'sync_customer':
        return 'Sincronizar Cliente';
      case 'create_opportunity':
        return 'Criar Oportunidade';
      case 'get_erp_data':
        return 'Buscar Dados ERP';
      default:
        return 'Integrar Produtos';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            {getActionLabel()}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integração de Produtos</DialogTitle>
          <DialogDescription>
            {action === 'sync_customer' && 'Sincronizar dados do cliente com sistema ERP'}
            {action === 'create_opportunity' && 'Criar oportunidade no CRM'}
            {action === 'get_erp_data' && 'Buscar dados financeiros e histórico do ERP'}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ação irá integrar os dados com o sistema de produtos.
            </p>
            <Button onClick={handleIntegration} disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {getActionLabel()}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">✓ Sucesso!</p>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Alias para compatibilidade (deprecado)
/** @deprecated Use ProductIntegrationButton instead */
export const TOTVSIntegrationButton = ProductIntegrationButton;

