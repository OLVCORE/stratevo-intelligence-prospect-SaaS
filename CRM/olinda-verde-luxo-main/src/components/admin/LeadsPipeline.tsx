import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadSourceBadge } from "./LeadSourceBadge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Phone, Calendar, MessageSquare, Plus } from "lucide-react";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { LeadDetails } from "./LeadDetails";
import { useTenant } from "@/hooks/useTenant";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
  message: string | null;
  status: string;
  source: string;
  created_at: string;
}

interface PipelineStage {
  id: string;
  title: string;
  status: string[];
  color: string;
  leads: Lead[];
}

export const LeadsPipeline = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [stages, setStages] = useState<PipelineStage[]>([
    {
      id: "novo",
      title: "Novos Leads",
      status: ["novo", "new"],
      color: "border-blue-500",
      leads: [],
    },
    {
      id: "contatado",
      title: "Contatado",
      status: ["contatado", "contacted"],
      color: "border-yellow-500",
      leads: [],
    },
    {
      id: "qualificado",
      title: "Qualificado",
      status: ["qualificado", "qualified"],
      color: "border-purple-500",
      leads: [],
    },
    {
      id: "proposta",
      title: "Proposta Enviada",
      status: ["proposta_enviada", "proposal_sent"],
      color: "border-orange-500",
      leads: [],
    },
    {
      id: "convertido",
      title: "Convertido",
      status: ["convertido", "converted"],
      color: "border-green-500",
      leads: [],
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchLeads();
    }
    
    const leadsChannel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => fetchLeads()
      )
      .subscribe();

    const activitiesChannel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        () => fetchLeads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [tenantId]);

  const fetchLeads = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from("leads" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }) as { data: Lead[] | null, error: any };

      if (error) throw error;

      // Distribute leads into stages
      const updatedStages = stages.map((stage) => ({
        ...stage,
        leads: data?.filter((lead) => stage.status.includes(lead.status)) || [],
      }));

      setStages(updatedStages);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("leadId", leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const leadId = e.dataTransfer.getData("leadId");
    
    setDraggedLeadId(null);
    setDragOverStage(null);

    if (!leadId) {
      toast.error("Erro ao mover lead");
      return;
    }

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Status do lead atualizado");
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Erro ao atualizar status do lead");
    }
  };

  if (isLoading || tenantLoading || !tenantId) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <Card className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-32 bg-muted rounded" />
                  <div className="h-32 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Pipeline de Leads</h2>
          <p className="text-sm text-muted-foreground">
            Arraste e solte os cards para atualizar o status.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em qualquer lead para abrir o CRM completo com timeline de atividades,
            notas, tarefas, emails, chamadas, WhatsApp, redes sociais e arquivos.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.status[0])}
          >
            <Card className={`border-t-4 ${stage.color} transition-all ${
              dragOverStage === stage.id ? 'ring-2 ring-primary bg-accent/10' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{stage.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stage.leads.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[400px]">
                  {stage.leads.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      Nenhum lead nesta etapa
                    </div>
                  ) : (
                    stage.leads.map((lead) => (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (!draggedLeadId) {
                            setSelectedLeadId(lead.id);
                            setDetailsOpen(true);
                          }
                        }}
                        className={`cursor-pointer hover:shadow-md transition-all bg-card ${
                          draggedLeadId === lead.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-foreground">{lead.name}</h4>
                              <LeadSourceBadge source={lead.source || 'website'} size="sm" />
                            </div>
                            
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {lead.event_date
                                  ? format(new Date(lead.event_date), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })
                                  : "Data não definida"}
                              </div>
                            </div>

                            <Badge variant="outline" className="text-xs mt-2">
                              {lead.event_type}
                            </Badge>

                            {lead.message && (
                              <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3 mt-0.5" />
                                <p className="line-clamp-2">{lead.message}</p>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground mt-2">
                              {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", {
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <CreateLeadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <LeadDetails 
        leadId={selectedLeadId} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
};
