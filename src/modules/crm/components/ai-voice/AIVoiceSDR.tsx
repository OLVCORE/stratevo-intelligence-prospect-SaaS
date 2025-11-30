/**
 * 🤖 AI VOICE SDR - Componente Principal
 * 
 * Sistema de IA conversacional para fazer ligações 24/7 como pré-vendedor
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Este é um arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 * - Não interfere com integração chat → CRM
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Loader2, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

interface AIVoiceSDRProps {
  leadId?: string;
  dealId?: string;
  onCallComplete?: (result: any) => void;
}

export function AIVoiceSDR({ leadId, dealId, onCallComplete }: AIVoiceSDRProps) {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-progress' | 'completed'>('idle');
  const [callResult, setCallResult] = useState<any>(null);

  const handleStartCall = async () => {
    if (!tenant) {
      toast({
        title: "Erro",
        description: "Tenant não disponível",
        variant: "destructive",
      });
      return;
    }

    if (!leadId && !dealId) {
      toast({
        title: "Erro",
        description: "Lead ou Deal ID é necessário",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
    setCallStatus('calling');

    try {
      const { data, error } = await supabase.functions.invoke('crm-ai-voice-call', {
        body: {
          lead_id: leadId,
          deal_id: dealId,
          tenant_id: tenant.id,
        },
      });

      if (error) throw error;

      setCallStatus('in-progress');
      setCallResult(data);
      
      toast({
        title: "Chamada iniciada",
        description: "A IA está fazendo a ligação...",
      });

      // Simular progresso da chamada (em produção, usar WebSocket ou polling)
      setTimeout(() => {
        setCallStatus('completed');
        setIsCalling(false);
        if (onCallComplete) {
          onCallComplete(data);
        }
      }, 5000);

    } catch (error: any) {
      console.error('Erro ao iniciar chamada IA:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar chamada",
        variant: "destructive",
      });
      setIsCalling(false);
      setCallStatus('idle');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          AI Voice SDR
        </CardTitle>
        <CardDescription>
          Sistema de IA conversacional para fazer ligações 24/7
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Status: <Badge variant={callStatus === 'idle' ? 'secondary' : 'default'}>
                {callStatus === 'idle' ? 'Aguardando' : 
                 callStatus === 'calling' ? 'Conectando...' :
                 callStatus === 'in-progress' ? 'Em andamento' : 'Concluída'}
              </Badge>
            </p>
          </div>
          <Button
            onClick={handleStartCall}
            disabled={isCalling || !tenant}
            variant={callStatus === 'in-progress' ? 'destructive' : 'default'}
          >
            {isCalling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {callStatus === 'calling' ? 'Conectando...' : 'Em andamento...'}
              </>
            ) : callStatus === 'completed' ? (
              <>
                <PhoneOff className="mr-2 h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Iniciar Chamada IA
              </>
            )}
          </Button>
        </div>

        {callResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Resultado da Chamada:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(callResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

