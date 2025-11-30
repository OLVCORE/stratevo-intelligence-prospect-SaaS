/**
 * 📧 SMART TEMPLATE GENERATOR - Gerador de Templates IA
 * 
 * Gera templates personalizados usando IA baseados no perfil do lead
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface SmartTemplateGeneratorProps {
  leadId?: string;
  dealId?: string;
  channel?: 'email' | 'whatsapp' | 'linkedin';
  onTemplateGenerated?: (template: string) => void;
}

export function SmartTemplateGenerator({ 
  leadId, 
  dealId, 
  channel = 'email',
  onTemplateGenerated 
}: SmartTemplateGeneratorProps) {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const [templateType, setTemplateType] = useState<'cold-email' | 'follow-up' | 'nurturing' | 'closing'>('cold-email');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'urgent' | 'casual'>('professional');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!tenant) {
      toast({
        title: "Erro",
        description: "Tenant não disponível",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('crm-generate-smart-template', {
        body: {
          type: 'template',
          template_type: templateType,
          channel,
          tone,
          lead_id: leadId,
          deal_id: dealId,
          tenant_id: tenant.id,
        },
      });

      if (error) throw error;

      setGeneratedTemplate(data.template || '');
      
      if (onTemplateGenerated) {
        onTemplateGenerated(data.template || '');
      }

      toast({
        title: "Sucesso",
        description: "Template gerado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao gerar template:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar template",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getChannelIcon = () => {
    const icons = {
      email: Mail,
      whatsapp: MessageSquare,
      linkedin: Send,
    };
    const Icon = icons[channel];
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getChannelIcon()}
          Gerador de Templates Inteligentes
        </CardTitle>
        <CardDescription>
          Gere templates personalizados usando IA baseados no perfil do lead
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Template</Label>
            <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold-email">Cold Email (Primeiro Contato)</SelectItem>
                <SelectItem value="follow-up">Follow-up (Acompanhamento)</SelectItem>
                <SelectItem value="nurturing">Nurturing (Nutrição)</SelectItem>
                <SelectItem value="closing">Closing (Fechamento)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tom</Label>
            <Select value={tone} onValueChange={(value: any) => setTone(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="friendly">Amigável</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">Canal: {channel}</Badge>
          {leadId && <Badge variant="outline">Lead ID: {leadId.substring(0, 8)}...</Badge>}
          {dealId && <Badge variant="outline">Deal ID: {dealId.substring(0, 8)}...</Badge>}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !tenant}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Template
            </>
          )}
        </Button>

        {generatedTemplate && (
          <div className="mt-4 space-y-2">
            <Label>Template Gerado:</Label>
            <Textarea
              value={generatedTemplate}
              readOnly
              rows={10}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedTemplate);
                  toast({
                    title: "Copiado",
                    description: "Template copiado para a área de transferência",
                  });
                }}
              >
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onTemplateGenerated) {
                    onTemplateGenerated(generatedTemplate);
                  }
                }}
              >
                Usar Template
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

