// src/modules/crm/components/automations/AutomationLogs.tsx
// Componente para visualizar logs de execução de automações

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const AutomationLogs = () => {
  const { tenant } = useTenant();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["automation-logs", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("automation_logs")
        .select(`
          *,
          automation_rules (
            id,
            name,
            trigger_type
          )
        `)
        .eq("tenant_id", tenant.id)
        .order("executed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-600">Sucesso</Badge>;
      case "failed":
        return <Badge variant="destructive">Falha</Badge>;
      default:
        return <Badge variant="secondary">Processando</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Logs de Execução</h3>
          <p className="text-sm text-muted-foreground">
            Histórico das execuções das automações
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="space-y-3">
        {logs?.map((log: any) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <span className="font-medium">
                      {log.automation_rules?.name || "Regra desconhecida"}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Tipo: <span className="font-medium">{log.trigger_type}</span>
                    </p>
                    <p>
                      Entidade: <span className="font-medium">{log.entity_type}</span> (
                      {log.entity_id.substring(0, 8)}...)
                    </p>
                    {log.executed_at && (
                      <p>
                        Executado em:{" "}
                        {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                    {log.error_message && (
                      <p className="text-red-600 mt-2">
                        Erro: {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!logs || logs.length === 0) && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum log encontrado</p>
              <p className="text-sm mt-2">
                Os logs aparecerão aqui quando as automações forem executadas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

