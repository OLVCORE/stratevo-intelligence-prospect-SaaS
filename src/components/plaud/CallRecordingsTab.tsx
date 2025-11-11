/**
 * CALL RECORDINGS TAB
 * 
 * Displays all call recordings for a company or deal
 * with sentiment analysis, action items, and coaching insights.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, Calendar, Clock, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertCircle, Lightbulb, MessageSquare,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CallRecording {
  id: string;
  plaud_recording_id: string;
  recording_date: string;
  duration_seconds: number;
  transcript: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentiment_score: number;
  key_topics: string[];
  action_items: any[];
  objections_raised: any[];
  opportunities_detected: any[];
  talk_time_ratio: number;
  questions_asked: number;
  objection_handling_score: number;
  closing_attempts: number;
  buying_signals: string[];
  risk_signals: string[];
  created_at: string;
}

interface CallRecordingsTabProps {
  companyId?: string;
  dealId?: string;
}

export function CallRecordingsTab({ companyId, dealId }: CallRecordingsTabProps) {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  useEffect(() => {
    loadRecordings();
  }, [companyId, dealId]);
  
  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('call_recordings')
        .select('*')
        .order('recording_date', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      if (dealId) {
        query = query.eq('deal_id', dealId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setRecordings(data || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'negative':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'mixed':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Mic className="h-8 w-8 text-gray-500 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando gravações...</p>
        </div>
      </div>
    );
  }
  
  if (recordings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Mic className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">
            Nenhuma gravação encontrada
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            As calls gravadas com Plaud NotePin aparecerão aqui
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <p className="text-2xl font-bold text-white">{recordings.length}</p>
          <p className="text-xs text-gray-400">Total de Calls</p>
        </div>
        
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <p className="text-2xl font-bold text-green-400">
            {recordings.filter(r => r.sentiment === 'positive').length}
          </p>
          <p className="text-xs text-gray-400">Calls Positivas</p>
        </div>
        
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <p className="text-2xl font-bold text-cyan-400">
            {recordings.reduce((sum, r) => sum + (r.action_items?.length || 0), 0)}
          </p>
          <p className="text-xs text-gray-400">Action Items</p>
        </div>
        
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <p className="text-2xl font-bold text-purple-400">
            {recordings.reduce((sum, r) => sum + (r.opportunities_detected?.length || 0), 0)}
          </p>
          <p className="text-xs text-gray-400">Oportunidades</p>
        </div>
      </div>
      
      <Separator className="bg-gray-700" />
      
      {/* Recordings List */}
      <div className="space-y-3">
        {recordings.map((recording) => {
          const isExpanded = expandedId === recording.id;
          
          return (
            <div
              key={recording.id}
              className="rounded-lg border border-gray-700 bg-gray-800/30 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg border",
                      getSentimentColor(recording.sentiment)
                    )}>
                      {getSentimentIcon(recording.sentiment)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm font-medium text-white">
                          {format(new Date(recording.recording_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <Clock className="h-3.5 w-3.5 text-gray-500 ml-2" />
                        <span className="text-sm text-gray-400">
                          {Math.round(recording.duration_seconds / 60)} min
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        {recording.summary}
                      </p>
                      
                      {/* Topics */}
                      {recording.key_topics && recording.key_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {recording.key_topics.slice(0, 5).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : recording.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded bg-gray-800/50">
                    <p className="text-lg font-bold text-blue-400">
                      {recording.questions_asked}
                    </p>
                    <p className="text-xs text-gray-500">Perguntas</p>
                  </div>
                  
                  <div className="text-center p-2 rounded bg-gray-800/50">
                    <p className="text-lg font-bold text-green-400">
                      {Math.round((recording.objection_handling_score || 0) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">Objeções</p>
                  </div>
                  
                  <div className="text-center p-2 rounded bg-gray-800/50">
                    <p className="text-lg font-bold text-purple-400">
                      {recording.action_items?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500">Actions</p>
                  </div>
                  
                  <div className="text-center p-2 rounded bg-gray-800/50">
                    <p className="text-lg font-bold text-orange-400">
                      {Math.round((recording.talk_time_ratio || 0) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">Talk Time</p>
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-700 bg-gray-800/50 p-4 space-y-4">
                  {/* Action Items */}
                  {recording.action_items && recording.action_items.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                        <h4 className="font-semibold text-white">Action Items</h4>
                      </div>
                      <div className="space-y-2">
                        {recording.action_items.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-2 rounded bg-gray-800/50 border border-gray-700"
                          >
                            <CheckCircle2 className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-white">{item.task}</p>
                              {item.context && (
                                <p className="text-xs text-gray-500 mt-1">{item.context}</p>
                              )}
                            </div>
                            {item.priority && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  item.priority === 'urgent' && "border-red-500/50 text-red-400",
                                  item.priority === 'high' && "border-orange-500/50 text-orange-400",
                                  item.priority === 'medium' && "border-yellow-500/50 text-yellow-400",
                                  item.priority === 'low' && "border-gray-500/50 text-gray-400"
                                )}
                              >
                                {item.priority}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Opportunities */}
                  {recording.opportunities_detected && recording.opportunities_detected.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        <h4 className="font-semibold text-white">Oportunidades Detectadas</h4>
                      </div>
                      <div className="space-y-2">
                        {recording.opportunities_detected.map((opp: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-sm font-medium text-yellow-400">
                                {opp.type === 'upsell' && 'Upsell'}
                                {opp.type === 'cross_sell' && 'Cross-sell'}
                                {opp.type === 'renewal' && 'Renovação'}
                                {opp.type === 'expansion' && 'Expansão'}
                              </span>
                              <span className="text-xs text-yellow-500">
                                {Math.round((opp.confidence || 0) * 100)}% confiança
                              </span>
                            </div>
                            {opp.product && (
                              <p className="text-xs text-yellow-300 mb-1">
                                Produto: {opp.product}
                              </p>
                            )}
                            <p className="text-xs text-yellow-200">{opp.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Objections */}
                  {recording.objections_raised && recording.objections_raised.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                        <h4 className="font-semibold text-white">Objeções</h4>
                      </div>
                      <div className="space-y-2">
                        {recording.objections_raised.map((obj: any, index: number) => (
                          <div
                            key={index}
                            className="p-2 rounded bg-gray-800/50 border border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm text-white flex-1">{obj.objection}</p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs ml-2",
                                  obj.resolved ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400"
                                )}
                              >
                                {obj.resolved ? 'Resolvida' : 'Pendente'}
                              </Badge>
                            </div>
                            {obj.response && (
                              <p className="text-xs text-gray-400 mt-1">
                                Resposta: {obj.response}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Signals */}
                  <div className="grid grid-cols-2 gap-4">
                    {recording.buying_signals && recording.buying_signals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2">
                          ✅ Sinais de Compra
                        </h4>
                        <ul className="space-y-1">
                          {recording.buying_signals.map((signal, index) => (
                            <li key={index} className="text-xs text-gray-300 flex items-start gap-1.5">
                              <span className="text-green-500">•</span>
                              <span>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {recording.risk_signals && recording.risk_signals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2">
                          ⚠️ Sinais de Risco
                        </h4>
                        <ul className="space-y-1">
                          {recording.risk_signals.map((signal, index) => (
                            <li key={index} className="text-xs text-gray-300 flex items-start gap-1.5">
                              <span className="text-red-500">•</span>
                              <span>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Transcript Preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <h4 className="font-semibold text-white">Transcrição</h4>
                    </div>
                    <div className="p-3 rounded bg-gray-900/50 border border-gray-700 max-h-40 overflow-y-auto">
                      <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                        {recording.transcript.slice(0, 500)}
                        {recording.transcript.length > 500 && '...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

