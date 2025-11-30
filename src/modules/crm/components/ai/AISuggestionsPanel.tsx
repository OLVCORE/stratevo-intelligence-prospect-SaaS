// src/modules/crm/components/ai/AISuggestionsPanel.tsx
// Painel de sugestões de IA

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { Lightbulb, MessageSquare, Phone, Mail, FileText, CheckCircle2, XCircle } from "lucide-react";

export const AISuggestionsPanel = () => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["ai-suggestions", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // @ts-ignore - Tabela ai_suggestions será criada pela migration
      const { data, error } = await (supabase as any)
        .from("ai_suggestions")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .eq("is_applied", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("ai_suggestions")
        .update({ 
          is_applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq("id", suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-suggestions"] });
      toast({
        title: "Sugestão aplicada",
        description: "A sugestão foi marcada como aplicada.",
      });
    },
  });

  const getContextIcon = (type: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      whatsapp: MessageSquare,
      call: Phone,
      meeting: Phone,
      proposal: FileText,
      general: Lightbulb,
    };
    const Icon = icons[type] || Lightbulb;
    return <Icon className="h-4 w-4" />;
  };

  const getSuggestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      response: "Sugestão de Resposta",
      action: "Ação Recomendada",
      follow_up: "Follow-up",
      objection_handling: "Tratamento de Objeção",
      closing: "Fechamento",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div>Carregando sugestões...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões de IA
          </CardTitle>
          <CardDescription>
            Sugestões inteligentes baseadas em suas interações e histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions && suggestions.length > 0 ? (
              suggestions.map((suggestion: any) => (
                <Card
                  key={suggestion.id}
                  className="border-l-4 border-l-primary"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getContextIcon(suggestion.context_type)}
                          <Badge variant="outline">
                            {getSuggestionTypeLabel(suggestion.suggestion_type)}
                          </Badge>
                          {suggestion.confidence && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}% confiança
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.content}
                        </p>
                        {suggestion.suggested_actions && 
                         Array.isArray(suggestion.suggested_actions) && 
                         suggestion.suggested_actions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Ações sugeridas:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {suggestion.suggested_actions.map((action: any, i: number) => (
                                <li key={i}>{action.title || action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => applySuggestionMutation.mutate(suggestion.id)}
                          disabled={applySuggestionMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sugestão disponível</p>
                <p className="text-sm mt-2">
                  Continue trabalhando e receberá sugestões personalizadas de IA
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

