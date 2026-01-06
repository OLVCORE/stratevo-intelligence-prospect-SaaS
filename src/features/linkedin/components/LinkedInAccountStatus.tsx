// src/features/linkedin/components/LinkedInAccountStatus.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Linkedin, CheckCircle2, XCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { LinkedInAccount } from "../types/linkedin.types";
import { useLinkedInAccount } from "../hooks/useLinkedInAccount";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface LinkedInAccountStatusProps {
  account: LinkedInAccount;
}

export function LinkedInAccountStatus({ account }: LinkedInAccountStatusProps) {
  const { disconnect, isDisconnecting } = useLinkedInAccount();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async (syncType: string) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-sync', {
        body: {
          linkedin_account_id: account.id,
          sync_type: syncType,
        },
      });

      if (error) throw error;
      
      toast.success(`Sincronização ${syncType} concluída! ${data.items_updated || 0} itens atualizados.`);
    } catch (error: any) {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Tem certeza que deseja desconectar esta conta?')) {
      disconnect(account.id);
    }
  };

  const statusColor = account.status === 'active' ? 'bg-green-500' : 
                     account.status === 'expired' ? 'bg-yellow-500' : 
                     'bg-red-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Linkedin className="h-6 w-6 text-[#0A66C2]" />
            <div>
              <CardTitle>{account.linkedin_name}</CardTitle>
              <CardDescription>{account.linkedin_headline || 'Sem headline'}</CardDescription>
            </div>
          </div>
          <Badge className={statusColor}>
            {account.status === 'active' ? 'Ativa' : 
             account.status === 'expired' ? 'Expirada' : 
             'Desconectada'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Convites Hoje</p>
            <p className="text-2xl font-bold">
              {account.daily_invites_sent} / {account.daily_invites_limit}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mensagens Hoje</p>
            <p className="text-2xl font-bold">
              {account.daily_messages_sent} / {account.daily_messages_limit}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última Atividade</p>
            <p className="text-sm font-medium">
              {account.last_activity_at 
                ? format(new Date(account.last_activity_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                : 'Nunca'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última Sincronização</p>
            <p className="text-sm font-medium">
              {account.last_sync_at 
                ? format(new Date(account.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                : 'Nunca'}
            </p>
          </div>
        </div>

        {/* Cookies Expiração */}
        {account.cookies_expire_at && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cookies Expirarão</AlertTitle>
            <AlertDescription>
              {format(new Date(account.cookies_expire_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync('invites')}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar Convites
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync('connections')}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar Conexões
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Desconectar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

