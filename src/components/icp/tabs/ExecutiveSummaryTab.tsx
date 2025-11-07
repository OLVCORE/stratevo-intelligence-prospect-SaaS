import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Building2,
  Users,
  Target,
  TrendingUp,
  Package,
  Search,
  Globe
} from 'lucide-react';

interface ExecutiveSummaryTabProps {
  companyName?: string;
  stcResult: any;
  similarCount?: number;
  competitorsCount?: number;
  clientsCount?: number;
  maturityScore?: number;
  savedData?: any;
  onDataChange?: (data: any) => void;
}

export function ExecutiveSummaryTab({
  companyName,
  stcResult,
  similarCount = 0,
  competitorsCount = 0,
  clientsCount = 0,
  maturityScore = 0,
  savedData,
  onDataChange
}: ExecutiveSummaryTabProps) {
  
  // 🔄 RESET: Voltar ao estado inicial
  const handleReset = () => {
    // Executive é read-only, então apenas notifica que voltou
    toast.info('Retornando ao início');
  };

  // 💾 SALVAR: Executive Summary
  const handleSave = () => {
    const reportData = {
      stcResult,
      similarCount,
      competitorsCount,
      clientsCount,
      maturityScore,
      savedAt: new Date().toISOString(),
    };
    
    onDataChange?.(reportData);
    
    toast.success('✅ Sumário Executivo Salvo!', {
      description: 'Dados armazenados no histórico',
    });
  };

  const hasData = !!(stcResult || similarCount || competitorsCount);
  // Calcular confiança TOTVS baseado nos dados STC reais
  const evidenceCount = stcResult?.evidences?.length || 0;
  const totalWeight = stcResult?.total_weight || 0;
  
  // Cálculo de confiança baseado em peso das evidências (metodologia STC)
  const totvsConfidence = Math.min(Math.round((totalWeight / 10) * 100), 100);
  
  // Determinar decisão final baseado nas regras STC
  const getFinalDecision = () => {
    if (totvsConfidence >= 70) {
      return { status: 'NO-GO', color: 'destructive', icon: XCircle, text: 'DESCARTADO - Cliente TOTVS confirmado' };
    }
    if (totvsConfidence >= 40) {
      return { status: 'QUARENTENA', color: 'secondary', icon: AlertTriangle, text: 'REVISAR MANUALMENTE - Evidências parciais' };
    }
    return { status: 'GO', color: 'default', icon: CheckCircle, text: 'QUALIFICADO - Não é cliente TOTVS' };
  };

  const decision = getFinalDecision();
  const DecisionIcon = decision.icon;

  return (
    <div className="space-y-6">
      {/* 🎯 NAVEGAÇÃO FLUTUANTE */}
      {hasData && (
        <FloatingNavigation
          onBack={handleReset}
          onHome={handleReset}
          onSave={handleSave}
          showSaveButton={true}
          saveDisabled={!stcResult}
          hasUnsavedChanges={false}
        />
      )}
      {/* Decisão Final */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${
            decision.status === 'GO' ? 'bg-muted dark:bg-muted/20' :
            decision.status === 'QUARENTENA' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
            'bg-muted dark:bg-muted/20'
          }`}>
            <DecisionIcon className={`w-8 h-8 ${
              decision.status === 'GO' ? 'text-muted-foreground dark:text-muted-foreground' :
              decision.status === 'QUARENTENA' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-muted-foreground dark:text-muted-foreground'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">{decision.status}</h3>
            <p className="text-sm text-muted-foreground">{decision.text}</p>
          </div>
          <Badge 
            variant={decision.color as any}
            className="text-lg px-4 py-2"
          >
            {totvsConfidence}% confiança
          </Badge>
        </div>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TOTVS Detection */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">TOTVS</span>
          </div>
          <div className="text-2xl font-bold mb-1">{totvsConfidence}%</div>
          <Badge variant="outline" className="text-xs">
            {evidenceCount} evidências / {totalWeight} peso
          </Badge>
        </Card>

        {/* Similar Companies */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Similares</span>
          </div>
          <div className="text-2xl font-bold mb-1">{similarCount}</div>
          <Badge variant="outline" className="text-xs">empresas</Badge>
        </Card>

        {/* Competitors */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Concorrentes</span>
          </div>
          <div className="text-2xl font-bold mb-1">{competitorsCount}</div>
          <Badge variant="outline" className="text-xs">detectados</Badge>
        </Card>

        {/* Client Discovery */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Clientes</span>
          </div>
          <div className="text-2xl font-bold mb-1">{clientsCount}</div>
          <Badge variant="outline" className="text-xs">descobertos</Badge>
        </Card>
      </div>

      {/* Níveis de Confiança */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Níveis de Confiança TOTVS
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${totvsConfidence >= 70 ? 'bg-muted' : 'bg-gray-300'}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Alta (70-100%)</span>
                <span className="text-xs text-muted-foreground">NO-GO automático</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-muted transition-all" 
                  style={{ width: `${Math.min(totvsConfidence, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${totvsConfidence >= 40 && totvsConfidence < 70 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Média (40-69%)</span>
                <span className="text-xs text-muted-foreground">Revisar manualmente</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all" 
                  style={{ width: `${totvsConfidence >= 40 ? Math.min((totvsConfidence - 40) / 0.3, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${totvsConfidence < 40 ? 'bg-muted' : 'bg-gray-300'}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Baixa (0-39%)</span>
                <span className="text-xs text-muted-foreground">GO - Continuar análise</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-muted transition-all" 
                  style={{ width: `${totvsConfidence < 40 ? Math.min(totvsConfidence / 0.4, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumo de Dados */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Resumo de Inteligência
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status TOTVS:</span>
            <span className="ml-2 font-semibold">{decision.status}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Evidências:</span>
            <span className="ml-2 font-semibold">{stcResult?.evidences?.length || 0} encontradas</span>
          </div>
          <div>
            <span className="text-muted-foreground">Fontes consultadas:</span>
            <span className="ml-2 font-semibold">{stcResult?.methodology?.searched_sources || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tempo de análise:</span>
            <span className="ml-2 font-semibold">{stcResult?.methodology?.execution_time || 'N/A'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
