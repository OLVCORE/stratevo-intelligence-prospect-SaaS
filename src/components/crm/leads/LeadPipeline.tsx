// src/components/crm/leads/LeadPipeline.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  business_data: any;
  lead_score: number;
  created_at: string;
}

interface LeadPipelineProps {
  config: any; // Config do BusinessModelAdapter
}

export function LeadPipeline({ config }: LeadPipelineProps) {
  const { tenant } = useTenant();
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Extrair pipelineStages da config
  const pipelineStages = config?.pipelineStages || config?.pipeline_stages || [];
  const businessModel = config?.businessModel || 'generic';

  const getStageConfig = (stageKey: string) => {
    return pipelineStages.find((s: any) => s.key === stageKey);
  };

  useEffect(() => {
    if (tenant) {
      fetchLeads();
    }
  }, [tenant]);

  const fetchLeads = async () => {
    if (!tenant) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar leads por estágio
      const groupedLeads: Record<string, Lead[]> = {};
      pipelineStages.forEach((stage: any) => {
        groupedLeads[stage.key] = data?.filter(l => l.status === stage.key) || [];
      });

      setLeads(groupedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceStage = result.source.droppableId;
    const destStage = result.destination.droppableId;
    const leadId = result.draggableId;

    if (sourceStage === destStage) return;

    // Atualizar localmente primeiro (UX otimista)
    const lead = leads[sourceStage]?.find(l => l.id === leadId);
    if (!lead) return;

    const newLeads = { ...leads };
    newLeads[sourceStage] = newLeads[sourceStage].filter(l => l.id !== leadId);
    newLeads[destStage] = [...(newLeads[destStage] || []), { ...lead, status: destStage }];
    setLeads(newLeads);

    // Atualizar no banco
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: destStage })
        .eq('id', leadId);

      if (error) throw error;

      const stageConfig = getStageConfig(destStage);
      toast.success(`Lead movido para ${stageConfig?.label || destStage}`);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
      // Reverter mudança local
      fetchLeads();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage: any) => {
          const stageLeads = leads[stage.key] || [];
          const stageConfig = getStageConfig(stage.key);

          return (
            <div key={stage.key} className="flex-shrink-0 w-80">
              <Card>
                <CardHeader 
                  className="pb-3" 
                  style={{ borderBottom: `3px solid ${stageConfig?.color || '#3b82f6'}` }}
                >
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{stage.label}</span>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </CardTitle>
                </CardHeader>
                
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[500px] ${
                        snapshot.isDraggingOver ? 'bg-accent/50' : ''
                      }`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="font-medium text-sm mb-1">{lead.name}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {lead.email}
                              </div>
                              
                              {/* Dados específicos do modelo de negócio */}
                              {lead.business_data && (
                                <div className="text-xs space-y-1 mt-2">
                                  {businessModel === 'eventos' && lead.business_data.event_type && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {lead.business_data.event_type}
                                      </Badge>
                                      {lead.business_data.event_date && (
                                        <span className="text-muted-foreground">
                                          {new Date(lead.business_data.event_date).toLocaleDateString('pt-BR')}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {businessModel === 'comercio_exterior' && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {lead.business_data.operation_type}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        {lead.business_data.destination_country}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Score */}
                              {lead.lead_score > 0 && (
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Score</span>
                                  <Badge variant={lead.lead_score >= 70 ? 'default' : 'secondary'}>
                                    {lead.lead_score}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

