/**
 * 📝 CALL TRANSCRIPTION - Transcrição Automática de Chamadas
 * 
 * Transcreve e armazena transcrições de chamadas de IA
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CallTranscriptionProps {
  callId: string;
  transcript?: string;
  autoLoad?: boolean;
}

export function CallTranscription({ callId, transcript: initialTranscript, autoLoad = false }: CallTranscriptionProps) {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<string>(initialTranscript || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoLoad && callId && !transcript) {
      loadTranscript();
    }
  }, [callId, autoLoad]);

  const loadTranscript = async () => {
    setIsLoading(true);
    try {
      // Em produção, buscar transcrição do banco de dados
      // Por enquanto, usar transcript inicial se disponível
      if (initialTranscript) {
        setTranscript(initialTranscript);
      }
    } catch (error: any) {
      console.error('Erro ao carregar transcrição:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transcrição",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    toast({
      title: "Copiado",
      description: "Transcrição copiada para a área de transferência",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-chamada-${callId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado",
      description: "Transcrição salva",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcrição da Chamada</CardTitle>
          <CardDescription>Carregando transcrição...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Transcrição da Chamada
        </CardTitle>
        <CardDescription>
          Transcrição automática da conversa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transcript ? (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {transcript.split(' ').length} palavras
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={transcript}
              readOnly
              rows={12}
              className="font-mono text-sm"
            />
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transcrição disponível ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}

