// src/features/linkedin/components/LinkedInCampaignManager.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Play, Pause, Edit, Trash2, BarChart3 } from "lucide-react";
import { LinkedInCampaign } from "../types/linkedin.types";
import { useLinkedInCampaigns } from "../hooks/useLinkedInCampaigns";
import { LinkedInCampaignForm } from "./LinkedInCampaignForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LinkedInCampaignManagerProps {
  accountId: string;
}

export function LinkedInCampaignManager({ accountId }: LinkedInCampaignManagerProps) {
  const { campaigns, isLoading, toggleStatus, delete: deleteCampaign } = useLinkedInCampaigns(accountId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<LinkedInCampaign | undefined>();

  const handleEdit = (campaign: LinkedInCampaign) => {
    setEditingCampaign(campaign);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingCampaign(undefined);
    setFormOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      case 'archived': return 'Arquivada';
      default: return 'Rascunho';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campanhas de Prospecção</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie suas campanhas de prospecção no LinkedIn
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando campanhas...</p>
          </CardContent>
        </Card>
      ) : campaigns && campaigns.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Convites</TableHead>
                  <TableHead>Aceitos</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.total_leads_imported}</TableCell>
                    <TableCell>{campaign.total_invites_sent}</TableCell>
                    <TableCell>{campaign.total_invites_accepted}</TableCell>
                    <TableCell>
                      {format(new Date(campaign.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {campaign.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus({ id: campaign.id, status: 'paused' })}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus({ id: campaign.id, status: 'active' })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja deletar esta campanha?')) {
                              deleteCampaign(campaign.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma campanha criada ainda</p>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}

      <LinkedInCampaignForm
        open={formOpen}
        onOpenChange={setFormOpen}
        accountId={accountId}
        campaign={editingCampaign}
      />
    </div>
  );
}

