// src/modules/crm/components/communications/CallRecordingsPanel.tsx
// Painel de gravações de chamadas com player e transcrições

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Phone, Play, Pause, Download, FileText, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CallRecordingsPanel() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [selectedDealId, setSelectedDealId] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Buscar deals do CRM para filtro
  const { data: crmDeals } = useQuery({
    queryKey: ["crm-deals", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("deals")
        .select("id, title")
        .eq("tenant_id", tenant.id)
        .order("title");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Buscar gravações
  const { data: recordings, isLoading } = useQuery({
    queryKey: ["call-recordings", tenant?.id, selectedDealId, selectedSentiment],
    queryFn: async () => {
      if (!tenant?.id) return [];

      let query = supabase
        .from("call_recordings")
        .select(`
          *,
          deals:deal_id (
            id,
            title,
            company_id
          ),
          companies:company_id (
            id,
            name
          )
        `)
        .eq("tenant_id", tenant.id)
        .order("recording_date", { ascending: false })
        .limit(50);

      if (selectedDealId !== "all") {
        query = query.eq("deal_id", selectedDealId);
      }

      if (selectedSentiment !== "all") {
        query = query.eq("sentiment", selectedSentiment);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-600";
      case "negative":
        return "bg-red-600";
      case "neutral":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />;
      case "negative":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const analyzeRecording = async (recordingId: string) => {
    setAnalyzingId(recordingId);
    try {
      const { error } = await supabase.functions.invoke("crm-analyze-call-recording", {
        body: { recordingId },
      });

      if (error) throw error;

      toast({
        title: "Análise concluída",
        description: "A gravação foi analisada com sucesso",
      });

      // Recarregar gravações
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao analisar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={selectedDealId} onValueChange={setSelectedDealId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os deals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os deals</SelectItem>
            {crmDeals?.map((deal) => (
              <SelectItem key={deal.id} value={deal.id}>
                {deal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os sentimentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os sentimentos</SelectItem>
            <SelectItem value="positive">Positivo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
            <SelectItem value="negative">Negativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de gravações */}
      <div className="space-y-4">
        {recordings?.map((recording: any) => (
          <Card key={recording.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    {recording.companies?.name || "Empresa desconhecida"}
                  </CardTitle>
                  <CardDescription>
                    {recording.deals?.title || "Sem deal associado"}
                    {recording.recording_date &&
                      ` • ${format(new Date(recording.recording_date), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}`}
                    {recording.duration_seconds &&
                      ` • ${formatDuration(recording.duration_seconds)}`}
                  </CardDescription>
                </div>
                {recording.sentiment && (
                  <Badge className={getSentimentColor(recording.sentiment)}>
                    {getSentimentIcon(recording.sentiment)}
                    <span className="ml-1 capitalize">{recording.sentiment}</span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Player de áudio */}
                {recording.recording_url && (
                  <div className="flex items-center gap-4">
                    <audio
                      controls
                      src={recording.recording_url}
                      className="flex-1"
                      onPlay={() => setPlayingId(recording.id)}
                      onPause={() => setPlayingId(null)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(recording.recording_url, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {recording.transcript && !recording.sentiment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeRecording(recording.id)}
                        disabled={analyzingId === recording.id}
                      >
                        {analyzingId === recording.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Analisar com IA
                      </Button>
                    )}
                  </div>
                )}

                {/* Transcrição */}
                {recording.transcript && (
                  <Collapsible>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Transcrição</span>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {recording.transcript.length > 500 ? "Ver completa" : "Ver"}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {recording.transcript.substring(0, 500)}
                        {recording.transcript.length > 500 && "..."}
                      </p>
                      <CollapsibleContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                          {recording.transcript.substring(500)}
                        </p>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}

                {/* Insights */}
                {recording.key_topics && recording.key_topics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tópicos principais:</p>
                    <div className="flex flex-wrap gap-2">
                      {recording.key_topics.map((topic: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action items */}
                {recording.action_items && recording.action_items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Ações identificadas:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {recording.action_items.slice(0, 3).map((item: any, idx: number) => (
                        <li key={idx}>{item.task || item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Métricas de coaching */}
                {(recording.talk_time_ratio ||
                  recording.questions_asked ||
                  recording.objection_handling_score) && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    {recording.talk_time_ratio && (
                      <div>
                        <p className="text-xs text-muted-foreground">Talk Time</p>
                        <p className="text-sm font-medium">
                          {Math.round(recording.talk_time_ratio * 100)}%
                        </p>
                      </div>
                    )}
                    {recording.questions_asked !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Perguntas</p>
                        <p className="text-sm font-medium">{recording.questions_asked}</p>
                      </div>
                    )}
                    {recording.objection_handling_score !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Objeções</p>
                        <p className="text-sm font-medium">
                          {Math.round(recording.objection_handling_score * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!recordings || recordings.length === 0) && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma gravação encontrada</p>
              <p className="text-sm mt-2">
                As gravações de chamadas aparecerão aqui quando disponíveis
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

