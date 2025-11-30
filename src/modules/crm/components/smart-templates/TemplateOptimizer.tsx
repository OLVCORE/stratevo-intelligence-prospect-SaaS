/**
 * ⚡ TEMPLATE OPTIMIZER - Otimizador Contínuo de Templates
 * 
 * Sugere melhorias contínuas baseadas em performance
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface OptimizationSuggestion {
  type: 'subject' | 'body' | 'cta' | 'timing';
  current: string;
  suggested: string;
  reason: string;
  expected_improvement: number; // porcentagem
}

interface TemplateOptimizerProps {
  templateId: string;
  currentTemplate: string;
  onOptimizationApplied?: (optimizedTemplate: string) => void;
}

export function TemplateOptimizer({ 
  templateId, 
  currentTemplate,
  onOptimizationApplied 
}: TemplateOptimizerProps) {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [optimizedTemplate, setOptimizedTemplate] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!tenant) {
      toast({
        title: "Erro",
        description: "Tenant não disponível",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Em produção, chamar Edge Function para análise
      // Por enquanto, simular sugestões
      setTimeout(() => {
        const mockSuggestions: OptimizationSuggestion[] = [
          {
            type: 'subject',
            current: 'Oportunidade de Negócio',
            suggested: 'Como [Empresa] pode aumentar receita em 30%',
            reason: 'Assuntos personalizados têm 2.5x mais abertura',
            expected_improvement: 25,
          },
          {
            type: 'cta',
            current: 'Entre em contato',
            suggested: 'Agende uma demonstração gratuita de 15 minutos',
            reason: 'CTAs específicos com prazo têm 3x mais cliques',
            expected_improvement: 40,
          },
        ];
        
        setSuggestions(mockSuggestions);
        setIsAnalyzing(false);
        
        toast({
          title: "Análise Concluída",
          description: `${mockSuggestions.length} sugestões encontradas`,
        });
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao analisar template:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao analisar template",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    // Aplicar sugestão ao template
    let updated = currentTemplate;
    
    if (suggestion.type === 'subject') {
      // Em produção, atualizar assunto
      updated = updated.replace(suggestion.current, suggestion.suggested);
    } else if (suggestion.type === 'cta') {
      updated = updated.replace(suggestion.current, suggestion.suggested);
    }
    
    setOptimizedTemplate(updated);
    
    if (onOptimizationApplied) {
      onOptimizationApplied(updated);
    }
    
    toast({
      title: "Sugestão Aplicada",
      description: `Melhoria esperada: +${suggestion.expected_improvement}%`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Otimizador de Templates
        </CardTitle>
        <CardDescription>
          Sugestões de melhoria baseadas em performance e IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !tenant || !currentTemplate}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analisar e Otimizar
            </>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <Label>Sugestões de Melhoria:</Label>
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{suggestion.type.toUpperCase()}</Badge>
                  <Badge variant="default" className="bg-green-500">
                    +{suggestion.expected_improvement}% esperado
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Atual:</span>
                    <p className="font-medium">{suggestion.current}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sugerido:</span>
                    <p className="font-medium text-green-600">{suggestion.suggested}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Motivo:</span>
                    <p className="text-xs">{suggestion.reason}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="w-full"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aplicar Sugestão
                </Button>
              </div>
            ))}
          </div>
        )}

        {optimizedTemplate && (
          <div className="mt-4 space-y-2">
            <Label>Template Otimizado:</Label>
            <Textarea
              value={optimizedTemplate}
              readOnly
              rows={8}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(optimizedTemplate);
                toast({
                  title: "Copiado",
                  description: "Template otimizado copiado",
                });
              }}
            >
              Copiar Template Otimizado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

