// src/modules/crm/components/email/EmailTrackingView.tsx
// Componente para visualizar tracking de emails

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Eye, MousePointerClick, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmailTrackingViewProps {
  leadId?: string;
  dealId?: string;
  messageId?: string;
}

export function EmailTrackingView({ leadId, dealId, messageId }: EmailTrackingViewProps) {
  const { tenant } = useTenant();

  const { data: tracking, isLoading } = useQuery({
    queryKey: ["email-tracking", tenant?.id, leadId, dealId, messageId],
    queryFn: async () => {
      if (!tenant?.id) return null;

      let query = supabase
        .from("email_tracking")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("sent_at", { ascending: false });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }
      if (dealId) {
        query = query.eq("deal_id", dealId);
      }
      if (messageId) {
        query = query.eq("message_id", messageId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tracking || tracking.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Nenhum email enviado</p>
          <p className="text-sm mt-2">Os emails enviados aparecerão aqui com métricas de tracking</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tracking.map((email: any) => (
        <Card key={email.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{email.subject || "Sem assunto"}</CardTitle>
                <CardDescription>{email.recipient_email}</CardDescription>
              </div>
              <Badge variant={email.opened_at ? "default" : "secondary"}>
                {email.opened_at ? "Aberto" : "Não aberto"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enviado</p>
                  <p className="text-xs text-muted-foreground">
                    {email.sent_at
                      ? format(new Date(email.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Aberturas</p>
                  <p className="text-xs text-muted-foreground">
                    {email.opened_count || 0}x
                    {email.first_opened_at && (
                      <span className="ml-2">
                        ({format(new Date(email.first_opened_at), "dd/MM HH:mm", { locale: ptBR })})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cliques</p>
                  <p className="text-xs text-muted-foreground">
                    {email.clicked_count || 0}x
                    {email.first_clicked_at && (
                      <span className="ml-2">
                        ({format(new Date(email.first_clicked_at), "dd/MM HH:mm", { locale: ptBR })})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {email.clicked_links && email.clicked_links.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Links clicados:</p>
                <div className="space-y-1">
                  {email.clicked_links.map((link: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate flex-1">{link.url}</span>
                      <Badge variant="outline" className="ml-2">
                        {link.count}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {email.delivery_status === "delivered" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : email.delivery_status === "bounced" ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span>Status: {email.delivery_status || "sent"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

