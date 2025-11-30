import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Clock, UserCheck, Save } from "lucide-react";

interface LeadQualificationProps {
  leadId: string;
}

interface QualificationData {
  budget: number | null;
  timeline: string | null;
  decision_maker: boolean;
}

export const LeadQualification = ({ leadId }: LeadQualificationProps) => {
  const [qualification, setQualification] = useState<QualificationData>({
    budget: null,
    timeline: null,
    decision_maker: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQualification();
  }, [leadId]);

  const fetchQualification = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("budget, timeline, decision_maker")
        .eq("id", leadId)
        .single();

      if (error) throw error;
      setQualification({
        budget: data.budget || null,
        timeline: data.timeline || null,
        decision_maker: data.decision_maker || false,
      });
    } catch (error: any) {
      console.error("Error fetching qualification:", error);
      toast.error("Erro ao carregar dados de qualificação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          budget: qualification.budget,
          timeline: qualification.timeline,
          decision_maker: qualification.decision_maker,
        })
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Qualificação atualizada com sucesso");
    } catch (error: any) {
      console.error("Error saving qualification:", error);
      toast.error("Erro ao salvar qualificação");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando dados de qualificação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento Disponível (R$)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="Ex: 50000"
              value={qualification.budget || ""}
              onChange={(e) =>
                setQualification({
                  ...qualification,
                  budget: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Informe o orçamento estimado que o cliente possui para o evento
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Prazo de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="timeline">Quando o cliente precisa decidir?</Label>
            <Select
              value={qualification.timeline || ""}
              onValueChange={(value) =>
                setQualification({ ...qualification, timeline: value })
              }
            >
              <SelectTrigger id="timeline">
                <SelectValue placeholder="Selecione o prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Imediato (até 1 semana)</SelectItem>
                <SelectItem value="1-3_months">1 a 3 meses</SelectItem>
                <SelectItem value="3-6_months">3 a 6 meses</SelectItem>
                <SelectItem value="6+_months">Mais de 6 meses</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Quanto mais urgente, maior a prioridade do lead
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Tomador de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="decision-maker">Este contato é o tomador de decisão?</Label>
              <p className="text-xs text-muted-foreground">
                Se sim, este lead tem maior chance de conversão
              </p>
            </div>
            <Switch
              id="decision-maker"
              checked={qualification.decision_maker}
              onCheckedChange={(checked) =>
                setQualification({ ...qualification, decision_maker: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? "Salvando..." : "Salvar Qualificação"}
      </Button>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Dica: Como usar a Qualificação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Orçamento:</strong> Leads com orçamento definido recebem +15 pontos no score
          </p>
          <p>
            <strong>Prazo Imediato:</strong> +20 pontos | <strong>1-3 meses:</strong> +15 pontos |{" "}
            <strong>3-6 meses:</strong> +10 pontos
          </p>
          <p>
            <strong>Tomador de Decisão:</strong> Adiciona +20 pontos ao score do lead
          </p>
          <p className="pt-2 border-t">
            O score total ajuda a priorizar os leads com maior potencial de conversão!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
