import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateDeal } from "./CreateDeal";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  lead_id: string | null;
  leads?: {
    name: string;
    email: string;
  };
}

const stages = [
  { id: "discovery", label: "Descoberta", color: "bg-blue-500" },
  { id: "qualification", label: "Qualificação", color: "bg-purple-500" },
  { id: "proposal", label: "Proposta", color: "bg-orange-500" },
  { id: "negotiation", label: "Negociação", color: "bg-teal-500" },
  { id: "won", label: "Ganho", color: "bg-green-500" },
  { id: "lost", label: "Perdido", color: "bg-red-500" },
];

export const DealsPipeline = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchDeals();
    }
  }, [tenantId, tenantLoading]);

  useEffect(() => {
    if (!tenantId) return;
    
    fetchDeals();

    // Setup realtime subscription
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        () => {
          console.log('Deal changed, refreshing...');
          fetchDeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeals = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select(`
        *,
        leads (name, email)
      `) as any;

    const filteredData = data?.filter((d: any) => d.tenant_id === tenantId) || [];

    if (error) {
      console.error("Error fetching deals:", error);
      toast.error("Erro ao carregar negócios");
    } else {
      setDeals(filteredData || []);
    }
    setIsLoading(false);
  };

  const updateDealStage = async (dealId: string, newStage: string) => {
    const { error } = await supabase
      .from("deals")
      .update({ stage: newStage })
      .eq("id", dealId);

    if (error) {
      toast.error("Erro ao atualizar estágio");
    } else {
      toast.success("Estágio atualizado");
      fetchDeals();
    }
  };

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const getTotalValue = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + Number(deal.value), 0);
  };

  if (isLoading || tenantLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pipeline de Vendas</h2>
          <p className="text-sm text-muted-foreground">
            Arraste os negócios entre os estágios
          </p>
        </div>
        <CreateDeal onDealCreated={fetchDeals} />
      </div>

      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          const totalValue = getTotalValue(stage.id);

          return (
            <div key={stage.id} className="min-w-[280px]">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{stage.label}</h3>
                  <Badge variant="secondary">{stageDeals.length}</Badge>
                </div>
                <div className={`h-1 ${stage.color} rounded-full`} />
                <div className="text-xs text-muted-foreground mt-2">
                  R$ {totalValue.toLocaleString("pt-BR")}
                </div>
              </div>

              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedStage(stage.id)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-2 text-foreground">
                        {deal.title}
                      </h4>
                      
                      {deal.leads && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          {deal.leads.name}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          {Number(deal.value).toLocaleString("pt-BR")}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {deal.probability}%
                        </Badge>
                      </div>

                      {deal.expected_close_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(deal.expected_close_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {stages
                          .filter((s) => s.id !== stage.id)
                          .map((s) => (
                            <Button
                              key={s.id}
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDealStage(deal.id, s.id);
                              }}
                            >
                              → {s.label}
                            </Button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
