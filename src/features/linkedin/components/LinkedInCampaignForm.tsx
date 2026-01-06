// src/features/linkedin/components/LinkedInCampaignForm.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkedInCampaign, LinkedInCampaignFormData } from "../types/linkedin.types";
import { useLinkedInCampaigns } from "../hooks/useLinkedInCampaigns";

interface LinkedInCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  campaign?: LinkedInCampaign;
}

export function LinkedInCampaignForm({ open, onOpenChange, accountId, campaign }: LinkedInCampaignFormProps) {
  const { create, update, isCreating, isUpdating } = useLinkedInCampaigns(accountId);
  const [formData, setFormData] = useState<LinkedInCampaignFormData>({
    name: "",
    description: "",
    search_url: "",
    connection_degree: ["2nd", "3rd"],
    invite_message_template: "",
    max_invites_per_day: 20,
    max_total_invites: 500,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || "",
        search_url: campaign.search_url || "",
        connection_degree: campaign.connection_degree || ["2nd", "3rd"],
        invite_message_template: campaign.invite_message_template || "",
        max_invites_per_day: campaign.max_invites_per_day,
        max_total_invites: campaign.max_total_invites,
        start_date: campaign.start_date ? new Date(campaign.start_date) : undefined,
        end_date: campaign.end_date ? new Date(campaign.end_date) : undefined,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        search_url: "",
        connection_degree: ["2nd", "3rd"],
        invite_message_template: "",
        max_invites_per_day: 20,
        max_total_invites: 500,
      });
    }
  }, [campaign, open]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }

    if (campaign) {
      update({ id: campaign.id, formData });
    } else {
      create(formData);
    }

    onOpenChange(false);
  };

  const toggleConnectionDegree = (degree: string) => {
    setFormData(prev => ({
      ...prev,
      connection_degree: prev.connection_degree.includes(degree)
        ? prev.connection_degree.filter(d => d !== degree)
        : [...prev.connection_degree, degree]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? "Editar Campanha" : "Nova Campanha"}
          </DialogTitle>
          <DialogDescription>
            Configure sua campanha de prospecção no LinkedIn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Prospecção Q1 2025 - Setor Industrial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo desta campanha..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search_url">URL de Busca do LinkedIn</Label>
            <Input
              id="search_url"
              type="url"
              value={formData.search_url}
              onChange={(e) => setFormData(prev => ({ ...prev, search_url: e.target.value }))}
              placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
            />
          </div>

          <div className="space-y-2">
            <Label>Graus de Conexão</Label>
            <div className="flex gap-4">
              {["1st", "2nd", "3rd"].map(degree => (
                <div key={degree} className="flex items-center space-x-2">
                  <Checkbox
                    id={`degree-${degree}`}
                    checked={formData.connection_degree.includes(degree)}
                    onCheckedChange={() => toggleConnectionDegree(degree)}
                  />
                  <Label htmlFor={`degree-${degree}`} className="cursor-pointer">
                    {degree === "1st" ? "1º Grau" : degree === "2nd" ? "2º Grau" : "3º Grau"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message_template">Template de Mensagem</Label>
            <Textarea
              id="message_template"
              value={formData.invite_message_template}
              onChange={(e) => setFormData(prev => ({ ...prev, invite_message_template: e.target.value }))}
              placeholder="Olá {firstName}! Tudo bem? Sou {seuNome}, {seuCargo} na {suaEmpresa}..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {`{firstName}`, `{lastName}`, `{fullName}`, `{company}`, `{headline}`, `{location}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_per_day">Máx. Convites/Dia</Label>
              <Input
                id="max_per_day"
                type="number"
                min={1}
                max={25}
                value={formData.max_invites_per_day}
                onChange={(e) => setFormData(prev => ({ ...prev, max_invites_per_day: parseInt(e.target.value) || 20 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_total">Máx. Total de Convites</Label>
              <Input
                id="max_total"
                type="number"
                min={1}
                value={formData.max_total_invites}
                onChange={(e) => setFormData(prev => ({ ...prev, max_total_invites: parseInt(e.target.value) || 500 }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isCreating || isUpdating}
          >
            {campaign ? "Salvar Alterações" : "Criar Campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

