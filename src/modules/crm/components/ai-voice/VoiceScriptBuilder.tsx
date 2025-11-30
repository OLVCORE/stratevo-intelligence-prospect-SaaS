/**
 * 📝 VOICE SCRIPT BUILDER - Builder de Scripts Dinâmicos
 * 
 * Cria scripts personalizados baseados no perfil do lead
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
import { FileText, Sparkles, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface VoiceScriptBuilderProps {
  leadId?: string;
  dealId?: string;
  onScriptGenerated?: (script: string) => void;
}

export function VoiceScriptBuilder({ leadId, dealId, onScriptGenerated }: VoiceScriptBuilderProps) {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const [scriptType, setScriptType] = useState<'cold-call' | 'follow-up' | 'closing' | 'custom'>('cold-call');
  const [customScript, setCustomScript] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateScript = async () => {
    if (!tenant) {
      toast({
        title: "Erro",
        description: "Tenant não disponível",
        variant: "destructive",
      });
      return;
    }

    if (scriptType === 'custom' && !customScript.trim()) {
      toast({
        title: "Erro",
        description: "Digite um script customizado",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      if (scriptType === 'custom') {
        setGeneratedScript(customScript);
        if (onScriptGenerated) {
          onScriptGenerated(customScript);
        }
      } else {
        // Gerar script via IA (Edge Function)
        const { data, error } = await supabase.functions.invoke('crm-generate-smart-template', {
          body: {
            type: 'voice-script',
            script_type: scriptType,
            lead_id: leadId,
            deal_id: dealId,
            tenant_id: tenant.id,
          },
        });

        if (error) throw error;

        setGeneratedScript(data.script || '');
        if (onScriptGenerated) {
          onScriptGenerated(data.script || '');
        }
      }

      toast({
        title: "Sucesso",
        description: "Script gerado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao gerar script:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Builder de Scripts de Voz
        </CardTitle>
        <CardDescription>
          Crie scripts personalizados baseados no perfil do lead
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Script</Label>
          <Select value={scriptType} onValueChange={(value: any) => setScriptType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cold-call">Cold Call (Primeiro Contato)</SelectItem>
              <SelectItem value="follow-up">Follow-up (Acompanhamento)</SelectItem>
              <SelectItem value="closing">Closing (Fechamento)</SelectItem>
              <SelectItem value="custom">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scriptType === 'custom' && (
          <div className="space-y-2">
            <Label>Script Customizado</Label>
            <Textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Digite seu script personalizado aqui..."
              rows={6}
            />
          </div>
        )}

        <Button
          onClick={handleGenerateScript}
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
              Gerar Script
            </>
          )}
        </Button>

        {generatedScript && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label>Script Gerado:</Label>
              <Badge variant="outline">Pronto para uso</Badge>
            </div>
            <div className="text-sm whitespace-pre-wrap">{generatedScript}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(generatedScript);
                toast({
                  title: "Copiado",
                  description: "Script copiado para a área de transferência",
                });
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Copiar Script
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

