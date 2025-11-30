// src/modules/crm/components/deals/DealHistoryTimeline.tsx
// Timeline completa de um deal mostrando histórico SDR + CRM

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Phone, Mail, Calendar, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DealHistoryTimelineProps {
  dealId: string;
  source?: "sdr" | "crm";
}

export function DealHistoryTimeline({ dealId, source = "crm" }: DealHistoryTimelineProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["deal-history", dealId, source],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_deal_history", {
        p_deal_id: dealId,
        p_source: source,
      });

      if (error) throw error;
      return data || [];
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSourceColor = (src: string) => {
    return src === "sdr" ? "bg-blue-600" : "bg-green-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Nenhum histórico encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Histórico Completo</h3>
        <p className="text-sm text-muted-foreground">
          Timeline unificada de todas as interações (SDR + CRM)
        </p>
      </div>

      <div className="space-y-3">
        {history.map((item: any, idx: number) => (
          <Card key={item.id || idx}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getSourceColor(item.source)} text-white`}>
                  {getActivityIcon(item.activity_type || item.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {item.activity_type || item.type || "Atividade"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.source === "sdr" ? "SDR" : "CRM"}
                    </Badge>
                    {item.stage && (
                      <Badge variant="secondary" className="text-xs">
                        {item.stage}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {item.created_at && (
                      <span>
                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

