/**
 * IMPORT PLAUD RECORDING COMPONENT
 * 
 * Allows users to manually import Plaud recordings
 * and analyze them with AI.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mic, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { analyzeAndSaveCall, type CallTranscript } from '@/services/plaudAnalyzer';
import { supabase } from '@/integrations/supabase/client';

interface ImportPlaudRecordingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  companyName?: string;
  dealId?: string;
  onSuccess?: (callRecordingId: string) => void;
}

export function ImportPlaudRecording({
  open,
  onOpenChange,
  companyId,
  companyName,
  dealId,
  onSuccess
}: ImportPlaudRecordingProps) {
  const { toast } = useToast();
  
  const [transcript, setTranscript] = useState('');
  const [recordingDate, setRecordingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const handleImport = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'Transcrição vazia',
        description: 'Por favor, cole a transcrição da call.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessing(true);
    setAnalysisResult(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Prepare call data
      const callData: CallTranscript = {
        plaud_recording_id: `manual-${Date.now()}`,
        transcript: transcript.trim(),
        recording_date: recordingDate,
        duration_seconds: durationMinutes * 60,
        company_name: companyName,
        company_id: companyId,
        deal_id: dealId
      };
      
      // Analyze and save
      const { id, analysis } = await analyzeAndSaveCall(callData, user.id);
      
      setAnalysisResult(analysis);
      
      toast({
        title: '✅ Call analisada com sucesso!',
        description: `${analysis.action_items.length} action items criados. Veja os detalhes abaixo.`,
        duration: 5000,
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess(id);
      }
      
      // NÃO fecha automaticamente - usuário precisa ver o resultado!
      
    } catch (error) {
      console.error('Error importing call:', error);
      toast({
        title: 'Erro ao processar call',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClose = () => {
    setTranscript('');
    setRecordingDate(new Date().toISOString().split('T')[0]);
    setDurationMinutes(15);
    setAnalysisResult(null);
    setIsProcessing(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-cyan-500" />
            Importar Gravação Plaud
          </DialogTitle>
          <DialogDescription>
            Cole a transcrição da call e deixe a IA extrair insights automaticamente
          </DialogDescription>
        </DialogHeader>
        
        {!analysisResult ? (
          <div className="space-y-4 py-4">
            {/* Company Info */}
            {companyName && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-sm text-gray-400">Empresa</p>
                <p className="font-medium text-white">{companyName}</p>
              </div>
            )}
            
            {/* Recording Date */}
            <div className="space-y-2">
              <Label htmlFor="recording-date">Data da Gravação</Label>
              <Input
                id="recording-date"
                type="date"
                value={recordingDate}
                onChange={(e) => setRecordingDate(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="300"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 15)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            {/* Transcript */}
            <div className="space-y-2">
              <Label htmlFor="transcript">
                Transcrição da Call
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="transcript"
                placeholder="Cole aqui a transcrição completa da call do Plaud NotePin..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[200px] bg-gray-800 border-gray-700 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                {transcript.length} caracteres
              </p>
            </div>
            
            {/* Info Box */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                  <strong>A IA vai extrair automaticamente:</strong>
                  <ul className="mt-1 space-y-0.5 text-blue-400">
                    <li>• Resumo da conversa</li>
                    <li>• Action items e prazos</li>
                    <li>• Análise de sentimento</li>
                    <li>• Objeções levantadas</li>
                    <li>• Oportunidades de cross-sell</li>
                    <li>• Recomendações de coaching</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Análise Concluída!</span>
            </div>
            
            {/* Sentiment */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <p className="text-sm text-gray-400 mb-1">Sentimento</p>
              <div className="flex items-center gap-2">
                <span className={`
                  px-2 py-1 rounded text-sm font-medium
                  ${analysisResult.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' : ''}
                  ${analysisResult.sentiment === 'neutral' ? 'bg-gray-500/20 text-gray-400' : ''}
                  ${analysisResult.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' : ''}
                  ${analysisResult.sentiment === 'mixed' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                `}>
                  {analysisResult.sentiment === 'positive' ? '😊 Positivo' : ''}
                  {analysisResult.sentiment === 'neutral' ? '😐 Neutro' : ''}
                  {analysisResult.sentiment === 'negative' ? '😟 Negativo' : ''}
                  {analysisResult.sentiment === 'mixed' ? '🤔 Misto' : ''}
                </span>
                <span className="text-sm text-gray-400">
                  Score: {analysisResult.sentiment_score?.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Summary */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <p className="text-sm text-gray-400 mb-1">Resumo</p>
              <p className="text-sm text-white">{analysisResult.summary}</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-2xl font-bold text-cyan-400">
                  {analysisResult.action_items?.length || 0}
                </p>
                <p className="text-xs text-gray-400">Action Items</p>
              </div>
              
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-2xl font-bold text-purple-400">
                  {analysisResult.opportunities_detected?.length || 0}
                </p>
                <p className="text-xs text-gray-400">Oportunidades</p>
              </div>
              
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-2xl font-bold text-blue-400">
                  {analysisResult.questions_asked || 0}
                </p>
                <p className="text-xs text-gray-400">Perguntas</p>
              </div>
              
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-2xl font-bold text-green-400">
                  {Math.round((analysisResult.objection_handling_score || 0) * 100)}%
                </p>
                <p className="text-xs text-gray-400">Objeções</p>
              </div>
            </div>
            
            {/* Action Items Preview */}
            {analysisResult.action_items && analysisResult.action_items.length > 0 && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                <p className="text-sm font-semibold text-cyan-300 mb-2">✅ Action Items Criados:</p>
                <ul className="space-y-1">
                  {analysisResult.action_items.slice(0, 3).map((item: any, index: number) => (
                    <li key={index} className="text-xs text-cyan-200 flex items-start gap-1.5">
                      <span className="text-cyan-400">•</span>
                      <span>{item.task}</span>
                    </li>
                  ))}
                  {analysisResult.action_items.length > 3 && (
                    <li className="text-xs text-cyan-400 italic">
                      +{analysisResult.action_items.length - 3} mais...
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Topics */}
            {analysisResult.key_topics && analysisResult.key_topics.length > 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-sm text-gray-400 mb-2">Tópicos Principais</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.key_topics.map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          {!analysisResult ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  handleClose();
                }}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || !transcript.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false);
                handleClose();
              }}
              className="w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

