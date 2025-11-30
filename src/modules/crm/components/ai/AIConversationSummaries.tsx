// src/modules/crm/components/ai/AIConversationSummaries.tsx
// Resumos de conversas de IA

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";
import { MessageSquare, Phone, Mail, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const AIConversationSummaries = () => {
  const { tenant } = useTenant();

  const { data: summaries, isLoading } = useQuery({
    queryKey: ["ai-conversation-summaries", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      // @ts-ignore - Tabela ai_conversation_summaries será criada pela migration
      const { data, error } = await (supabase as any)
        .from("ai_conversation_summaries")
        .select(`
          *,
          leads:lead_id (
            id,
            name,
            email
          ),
          deals:deal_id (
            id,
            title,
            value
          )
        `)
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const getConversationIcon = (type: string) => {
    const icons: Record<string, any> = {
      email_thread: Mail,
      whatsapp_chat: MessageSquare,
      call: Phone,
      meeting: Calendar,
    };
    const Icon = icons[type] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getConversationLabel = (type: string) => {
    const labels: Record<string, string> = {
      email_thread: "Thread de Email",
      whatsapp_chat: "Chat WhatsApp",
      call: "Chamada",
      meeting: "Reunião",
    };
    return labels[type] || type;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Badge variant="default" className="bg-green-500">Positivo</Badge>;
      case "negative":
        return <Badge variant="destructive">Negativo</Badge>;
      case "mixed":
        return <Badge variant="secondary">Misto</Badge>;
      default:
        return <Badge variant="outline">Neutro</Badge>;
    }
  };

  if (isLoading) {
    return <div>Carregando resumos...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Resumos de Conversas
          </CardTitle>
          <CardDescription>
            Resumos automáticos gerados por IA de suas conversas e interações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaries && summaries.length > 0 ? (
              summaries.map((summary: any) => (
                <Card key={summary.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getConversationIcon(summary.conversation_type)}
                        <Badge variant="outline">
                          {getConversationLabel(summary.conversation_type)}
                        </Badge>
                        {summary.sentiment && getSentimentBadge(summary.sentiment)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(summary.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-semibold mb-1">
                        {summary.leads?.name || summary.deals?.title || "Conversa"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {summary.summary}
                      </p>
                    </div>

                    {summary.key_points && summary.key_points.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Pontos-chave:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {summary.key_points.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.action_items && 
                     Array.isArray(summary.action_items) && 
                     summary.action_items.length > 0 && (
                      <div className="mb-3 p-2 bg-muted rounded">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Itens de ação:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {summary.action_items.map((item: any, i: number) => (
                            <li key={i}>{item.task || item.title || item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.next_steps && summary.next_steps.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Próximos passos:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {summary.next_steps.map((step: string, i: number) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum resumo disponível</p>
                <p className="text-sm mt-2">
                  Resumos serão gerados automaticamente para suas conversas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

