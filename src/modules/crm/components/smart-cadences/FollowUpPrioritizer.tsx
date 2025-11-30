// src/modules/crm/components/smart-cadences/FollowUpPrioritizer.tsx
// Priorizador inteligente de follow-ups

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { ArrowUp, ArrowDown, Clock, Target } from "lucide-react";

export function FollowUpPrioritizer() {
  const { tenant } = useTenant();

  // Buscar follow-ups que precisam de priorização
  const { data: followUps, isLoading } = useQuery({
    queryKey: ["follow-ups-priority", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from("cadence_executions")
        .select(`
          *,
          leads:lead_id (
            id,
            name,
            company_name,
            lead_score
          ),
          deals:deal_id (
            id,
            title,
            value,
            probability
          )
        `)
        .eq("tenant_id", tenant.id)
        .eq("status", "active")
        .not("next_action_at", "is", null)
        .order("priority_score", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const getPriorityColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Priorização de Follow-ups
        </CardTitle>
        <CardDescription>
          Leads ordenados por prioridade inteligente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : followUps && followUps.length > 0 ? (
          <div className="space-y-2">
            {followUps.map((followUp: any) => (
              <div
                key={followUp.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {followUp.leads?.name || followUp.deals?.title || "Lead"}
                    </h4>
                    <Badge
                      className={getPriorityColor(followUp.priority_score || 0)}
                    >
                      Score: {Math.round(followUp.priority_score || 0)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {followUp.leads?.company_name || "Empresa não informada"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Próxima ação:{" "}
                        {followUp.next_action_at
                          ? new Date(followUp.next_action_at).toLocaleString("pt-BR")
                          : "Não agendada"}
                      </span>
                    </div>
                    {followUp.deals?.value && (
                      <div>
                        Valor: R${" "}
                        {new Intl.NumberFormat("pt-BR").format(
                          followUp.deals.value
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {followUp.priority_score && followUp.priority_score >= 70 && (
                    <ArrowUp className="h-4 w-4 text-red-500" />
                  )}
                  {followUp.priority_score && followUp.priority_score < 40 && (
                    <ArrowDown className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum follow-up ativo no momento
          </div>
        )}
      </CardContent>
    </Card>
  );
}

