// src/modules/crm/components/communications/WhatsAppStatusView.tsx
// Visualização de status de entrega/leitura de mensagens WhatsApp

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WhatsAppStatusView() {
  const { tenant } = useTenant();

  const { data: statusData, isLoading } = useQuery({
    queryKey: ["whatsapp-status", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("whatsapp_message_status")
        .select(`
          *,
          messages (
            id,
            body,
            to_id,
            created_at
          )
        `)
        .eq("tenant_id", tenant.id)
        .order("status_timestamp", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "read":
        return <Eye className="h-4 w-4 text-purple-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Enviado";
      case "delivered":
        return "Entregue";
      case "read":
        return "Lido";
      case "failed":
        return "Falhou";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "read":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Agrupar por status
  const groupedByStatus = statusData?.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(item);
    return acc;
  }, {} as Record<string, typeof statusData>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status de Mensagens WhatsApp</CardTitle>
          <CardDescription>
            Rastreamento de entrega e leitura das mensagens enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Resumo por Status */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {Object.entries(groupedByStatus).map(([status, items]) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{getStatusLabel(status)}</p>
                      <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    {getStatusIcon(status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lista de Mensagens */}
          <div className="space-y-2">
            {statusData && statusData.length > 0 ? (
              statusData.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{getStatusLabel(item.status)}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Para: {item.messages?.to_id || "N/A"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.messages?.body || "Sem conteúdo"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.status_timestamp), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {item.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        Erro: {item.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma mensagem WhatsApp encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

