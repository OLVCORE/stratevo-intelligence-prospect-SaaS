import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Target, Search, Filter, BarChart3, Clock, ExternalLink, Eye, RefreshCw, XCircle, Maximize2, AlertTriangle, CheckCircle2, Flame, Snowflake, Zap, Crosshair, ScanSearch } from 'lucide-react';
import TOTVSCheckCard from '@/components/totvs/TOTVSCheckCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function STCHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'triple' | 'double'>('all');
  const [showFullReport, setShowFullReport] = useState(false);
  
  // 🎯 FUNÇÃO: Calcular confidence baseado em evidências
  const calculateConfidence = (evidences: any[]) => {
    if (!evidences || evidences.length === 0) return 'low';
    
    const tripleCount = evidences.filter(e => e.match_type === 'triple').length;
    const totalWeight = evidences.reduce((sum, e) => sum + (e.weight || 0), 0);
    
    if (tripleCount >= 3 || totalWeight >= 300) return 'high';
    if (tripleCount >= 1 || totalWeight >= 150) return 'medium';
    return 'low';
  };
  
  // 🎯 FUNÇÃO: Calcular score total
  const calculateTotalScore = (evidences: any[]) => {
    if (!evidences || evidences.length === 0) return 0;
    return evidences.reduce((sum, e) => sum + (e.weight || 0), 0);
  };
  
  // 🎯 FUNÇÃO: Highlight termos nas evidências
  const highlightTerms = (text: string, companyName: string, products: string[] = []) => {
    let highlighted = text;
    const terms = [companyName, 'TOTVS', ...(products || [])];
    
    terms.forEach(term => {
      if (!term) return;
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">$1</mark>');
    });
    
    return highlighted;
  };
  
  // 🎯 FUNÇÃO: Mensagem contextual de status
  const getStatusMessage = (status: string, confidence: string, score: number) => {
    if (status === 'no-go') {
      if (confidence === 'high' && score >= 300) {
        return '⚠️ Lead Descartado - Já opera com TOTVS (alta confiança)';
      }
      return '❌ Lead Descartado - Evidências de uso da TOTVS detectadas';
    }
    
    if (status === 'revisar') {
      return '⚡ Lead Requer Revisão - Evidências inconclusivas';
    }
    
    if (status === 'go') {
      return '✅ Lead Qualificado - Nenhuma evidência de uso da TOTVS';
    }
    
    return 'Status desconhecido';
  };

  const { data: verifications, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['stc-history', statusFilter, confidenceFilter],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (confidenceFilter !== 'all') {
        query = query.eq('confidence', confidenceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['stc-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stc_verification_history')
        .select('status, triple_matches, total_score');

      if (error) throw error;

      const byStatus: Record<string, number> = {};
      const byConfidence: Record<string, number> = {};
      let totalTripleMatches = 0;
      let avgScore = 0;

      data.forEach(item => {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        byConfidence[item.confidence] = (byConfidence[item.confidence] || 0) + 1;
        totalTripleMatches += item.triple_matches || 0;
        avgScore += item.total_score || 0;
      });

      return {
        total: data.length,
        byStatus,
        byConfidence,
        totalTripleMatches,
        avgScore: data.length > 0 ? Math.round(avgScore / data.length) : 0,
      };
    }
  });

  const filteredData = verifications?.filter(v =>
    v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.cnpj?.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Histórico de Verificações STC
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro completo de todas as verificações TOTVS realizadas
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Verificações</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Por Status</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(analytics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status}:</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Por Confiança</p>
                <div className="space-y-1 text-xs">
                  {Object.entries(analytics.byConfidence).map(([conf, count]) => (
                    <div key={conf} className="flex justify-between">
                      <span className="capitalize">{conf}:</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Triple Matches</p>
                  <p className="text-2xl font-bold">{analytics.totalTripleMatches}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="go">✅ GO</SelectItem>
                <SelectItem value="revisar">⚠️ Revisar</SelectItem>
                <SelectItem value="no-go">❌ NO-GO</SelectItem>
              </SelectContent>
            </Select>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Confiança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Confianças</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Verificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Triple Matches</TableHead>
                <TableHead>Score Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">{verification.company_name}</TableCell>
                    <TableCell>
                      {verification.cnpj && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {verification.cnpj}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          verification.status === 'go'
                            ? 'secondary'
                            : verification.status === 'revisar'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {verification.status === 'go' && '✅ GO'}
                        {verification.status === 'revisar' && '⚠️ Revisar'}
                        {verification.status === 'no-go' && '❌ NO-GO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          verification.confidence === 'high'
                            ? 'default'
                            : verification.confidence === 'medium'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {verification.confidence === 'high' && 'Alta'}
                        {verification.confidence === 'medium' && 'Média'}
                        {verification.confidence === 'low' && 'Baixa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        {verification.triple_matches || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{verification.total_score || 0} pts</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(verification.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVerification(verification);
                          setShowFullReport(true);
                        }}
                        title="Abrir Relatório Completo (9 abas)"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma verificação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes (Resumo) - Só abre se showFullReport for FALSE */}
      <Dialog open={!!selectedVerification && !showFullReport} onOpenChange={() => {
        setSelectedVerification(null);
        setEvidenceFilter('all');
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Botão Expandir - Discreto ao lado do X */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowFullReport(true);
              // O modal de resumo será fechado automaticamente pelo useEffect do showFullReport
            }}
            title="Expandir Relatório Completo (9 abas)"
            className="absolute right-12 top-4 h-8 w-8 rounded-full hover:bg-accent z-50"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Detalhes da Verificação STC
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <div>{selectedVerification?.company_name}</div>
              {selectedVerification?.cnpj && (
                <div className="text-xs text-muted-foreground">CNPJ: {selectedVerification.cnpj}</div>
              )}
              {selectedVerification && (
                <div className="text-sm font-semibold text-primary mt-2">
                  {getStatusMessage(
                    selectedVerification.status,
                    calculateConfidence(selectedVerification.evidences),
                    calculateTotalScore(selectedVerification.evidences)
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">

          {selectedVerification && (
            <div className="space-y-6">
              {/* 🎯 HERO CARD - Design World-Class Executivo */}
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background via-background to-accent/10 p-6 shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="relative space-y-4">
                  {/* Status Principal + Mensagem Contextual */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            selectedVerification.status === 'go'
                              ? 'secondary'
                              : selectedVerification.status === 'revisar'
                              ? 'default'
                              : 'destructive'
                          }
                          className="text-lg px-4 py-2 font-semibold"
                        >
                          {selectedVerification.status === 'go' && '✅ GO'}
                          {selectedVerification.status === 'revisar' && '⚠️ REVISAR'}
                          {selectedVerification.status === 'no-go' && '❌ NO-GO'}
                        </Badge>
                        
                        <Badge
                          variant={
                            calculateConfidence(selectedVerification.evidences) === 'high'
                              ? 'default'
                              : calculateConfidence(selectedVerification.evidences) === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-base px-3 py-1.5"
                        >
                          {calculateConfidence(selectedVerification.evidences) === 'high' && '🔥 Confiança Alta'}
                          {calculateConfidence(selectedVerification.evidences) === 'medium' && '⚡ Confiança Média'}
                          {calculateConfidence(selectedVerification.evidences) === 'low' && '❄️ Confiança Baixa'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground font-medium max-w-2xl">
                        {getStatusMessage(
                          selectedVerification.status,
                          calculateConfidence(selectedVerification.evidences),
                          calculateTotalScore(selectedVerification.evidences)
                        )}
                      </p>
                    </div>
                    
                    {/* Score Total - Destaque */}
                    <div className="text-right">
                      <p className="text-4xl font-bold text-primary">
                        {calculateTotalScore(selectedVerification.evidences)}
                      </p>
                      <p className="text-sm text-muted-foreground">pontos</p>
                    </div>
                  </div>
                  
                  {/* Métricas Clicáveis - Grid Elegante */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div 
                      className="group cursor-pointer bg-background/60 backdrop-blur-sm border rounded-lg p-4 transition-all hover:scale-[1.02] hover:shadow-md hover:border-orange-500/50"
                      onClick={() => setEvidenceFilter(evidenceFilter === 'triple' ? 'all' : 'triple')}
                      title="Clique para filtrar evidências Triple Match"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Triple Matches</p>
                          <p className={`text-3xl font-bold transition-colors ${
                            evidenceFilter === 'triple' ? 'text-orange-500' : 'text-foreground group-hover:text-orange-500'
                          }`}>
                            {selectedVerification.triple_matches || 0}
                          </p>
                        </div>
                        <Crosshair className={`w-8 h-8 transition-all ${
                          evidenceFilter === 'triple' ? 'text-orange-500 opacity-100' : 'text-muted-foreground opacity-60 group-hover:text-orange-500 group-hover:opacity-100'
                        }`} />
                      </div>
                    </div>
                    
                    <div 
                      className="group cursor-pointer bg-background/60 backdrop-blur-sm border rounded-lg p-4 transition-all hover:scale-[1.02] hover:shadow-md hover:border-blue-500/50"
                      onClick={() => setEvidenceFilter(evidenceFilter === 'double' ? 'all' : 'double')}
                      title="Clique para filtrar evidências Double Match"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Double Matches</p>
                          <p className={`text-3xl font-bold transition-colors ${
                            evidenceFilter === 'double' ? 'text-blue-500' : 'text-foreground group-hover:text-blue-500'
                          }`}>
                            {selectedVerification.double_matches || 0}
                          </p>
                        </div>
                        <ScanSearch className={`w-8 h-8 transition-all ${
                          evidenceFilter === 'double' ? 'text-blue-500 opacity-100' : 'text-muted-foreground opacity-60 group-hover:text-blue-500 group-hover:opacity-100'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidências - Design Compacto e Profissional */}
              {selectedVerification.evidences && selectedVerification.evidences.length > 0 && (() => {
                const filteredEvidences = selectedVerification.evidences.filter((e: any) => {
                  if (evidenceFilter === 'all') return true;
                  return e.match_type === evidenceFilter;
                });
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        Evidências
                        <Badge variant="outline" className="ml-2">
                          {filteredEvidences.length}
                          {evidenceFilter !== 'all' && ` de ${selectedVerification.evidences.length}`}
                        </Badge>
                      </h3>
                      {evidenceFilter !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEvidenceFilter('all')}
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Limpar Filtro
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {filteredEvidences.map((evidence: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="group bg-background/60 backdrop-blur-sm border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/30"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={evidence.match_type === 'triple' ? 'default' : 'secondary'}
                                className={`flex items-center gap-1.5 ${evidence.match_type === 'triple' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                              >
                                {evidence.match_type === 'triple' ? (
                                  <>
                                    <Crosshair className="w-3.5 h-3.5" />
                                    TRIPLE
                                  </>
                                ) : (
                                  <>
                                    <ScanSearch className="w-3.5 h-3.5" />
                                    DOUBLE
                                  </>
                                )}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new URL(evidence.url || 'https://example.com').hostname.replace('www.', '')}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs font-mono">
                              +{evidence.weight} pts
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {evidence.title}
                          </h4>
                          
                          <p 
                            className="text-xs text-muted-foreground line-clamp-2 mb-3" 
                            dangerouslySetInnerHTML={{ 
                              __html: highlightTerms(
                                evidence.content, 
                                selectedVerification.company_name,
                                evidence.detected_products || []
                              ) 
                            }}
                          />
                          
                          {evidence.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 opacity-70 group-hover:opacity-100"
                              asChild
                            >
                              <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                                Abrir Fonte
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Footer - Informações Técnicas Compactas */}
              <div className="grid grid-cols-4 gap-3 text-center pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fontes</p>
                  <p className="text-lg font-bold font-mono">{selectedVerification.sources_consulted || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Queries</p>
                  <p className="text-lg font-bold font-mono">{selectedVerification.queries_executed || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duração</p>
                  <p className="text-lg font-bold font-mono">
                    {selectedVerification.verification_duration_ms
                      ? `${(selectedVerification.verification_duration_ms / 1000).toFixed(1)}s`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data</p>
                  <p className="text-xs font-mono">
                    {new Date(selectedVerification.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Relatório Completo (9 abas) */}
      {showFullReport && selectedVerification && (
        <Dialog open={showFullReport} onOpenChange={setShowFullReport}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0">
            <TOTVSCheckCard
              companyId={selectedVerification.company_id}
              companyName={selectedVerification.company_name}
              cnpj={selectedVerification.cnpj}
              autoVerify={false}
              latestReport={selectedVerification}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
