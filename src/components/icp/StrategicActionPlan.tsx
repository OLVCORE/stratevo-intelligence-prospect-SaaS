import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  DollarSign,
  Users,
  Zap,
  Loader2,
  ArrowRight,
  Play,
  Pause,
  CheckSquare,
  Square,
  Flag,
  Briefcase,
  Shield,
  Rocket,
  Brain,
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Download,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Interfaces
interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
  responsible?: string;
  deadline?: string;
  investmentEstimate?: number;
  kpiImpact?: string;
}

interface KPI {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  deadline: string;
}

interface Risk {
  id: string;
  name: string;
  probability: 'alta' | 'media' | 'baixa';
  impact: 'alto' | 'medio' | 'baixo';
  mitigation: string;
}

interface StrategicPlan {
  id?: string;
  tenantId: string;
  icpId?: string;
  companyCapitalSocial: number;
  actions: ActionItem[];
  kpis: KPI[];
  risks: Risk[];
  ceoRecommendation: string;
  quickWins: string[];
  criticalDecisions: string[];
  investmentSummary: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  generatedAt?: string;
  status: 'draft' | 'active' | 'completed';
}

interface StrategicActionPlanProps {
  tenantId: string;
  icpId?: string;
  companyName: string;
  companyCapitalSocial: number;
  ceoAnalysis?: string;
  onboardingData?: any;
}

// Formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Calcular investimento proporcional ao capital social
const calculateProportionalInvestment = (capitalSocial: number) => {
  // Regra: investimentos proporcionais ao tamanho da empresa
  // Curto prazo: 5-10% do capital
  // Médio prazo: 10-20% do capital
  // Longo prazo: 20-40% do capital
  
  const shortTermMin = capitalSocial * 0.05;
  const shortTermMax = capitalSocial * 0.10;
  const shortTerm = Math.round((shortTermMin + shortTermMax) / 2);
  
  const mediumTermMin = capitalSocial * 0.10;
  const mediumTermMax = capitalSocial * 0.20;
  const mediumTerm = Math.round((mediumTermMin + mediumTermMax) / 2);
  
  const longTermMin = capitalSocial * 0.20;
  const longTermMax = capitalSocial * 0.40;
  const longTerm = Math.round((longTermMin + longTermMax) / 2);
  
  return {
    shortTerm,
    mediumTerm,
    longTerm,
    shortTermRange: `${formatCurrency(shortTermMin)} - ${formatCurrency(shortTermMax)}`,
    mediumTermRange: `${formatCurrency(mediumTermMin)} - ${formatCurrency(mediumTermMax)}`,
    longTermRange: `${formatCurrency(longTermMin)} - ${formatCurrency(longTermMax)}`,
    total: shortTerm + mediumTerm + longTerm
  };
};

// Badge de prioridade
const PriorityBadge = ({ priority }: { priority: ActionItem['priority'] }) => {
  const config = {
    high: { label: 'Alta', className: 'bg-red-100 text-red-700 border-red-300' },
    medium: { label: 'Média', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    low: { label: 'Baixa', className: 'bg-green-100 text-green-700 border-green-300' }
  };
  return <Badge variant="outline" className={config[priority].className}>{config[priority].label}</Badge>;
};

// Badge de timeframe
const TimeframeBadge = ({ timeframe }: { timeframe: ActionItem['timeframe'] }) => {
  const config = {
    short: { label: '0-6 meses', className: 'bg-blue-100 text-blue-700' },
    medium: { label: '6-18 meses', className: 'bg-purple-100 text-purple-700' },
    long: { label: '18-36 meses', className: 'bg-indigo-100 text-indigo-700' }
  };
  return <Badge className={config[timeframe].className}>{config[timeframe].label}</Badge>;
};

// Card de ação no Kanban
const ActionCard = ({ 
  action, 
  onStatusChange, 
  onEdit 
}: { 
  action: ActionItem; 
  onStatusChange: (id: string, status: ActionItem['status']) => void;
  onEdit: (action: ActionItem) => void;
}) => {
  return (
    <Card className="mb-3 cursor-grab hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm leading-tight">{action.title}</h4>
          <PriorityBadge priority={action.priority} />
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{action.description}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          <TimeframeBadge timeframe={action.timeframe} />
          {action.investmentEstimate && action.investmentEstimate > 0 && (
            <Badge variant="outline" className="text-xs">
              {formatCurrency(action.investmentEstimate)}
            </Badge>
          )}
        </div>
        {action.responsible && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {action.responsible}
          </div>
        )}
        {action.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            {action.deadline}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Coluna do Kanban
const KanbanColumn = ({ 
  title, 
  icon: Icon, 
  actions, 
  status, 
  onStatusChange,
  onEdit,
  color
}: { 
  title: string;
  icon: any;
  actions: ActionItem[];
  status: ActionItem['status'];
  onStatusChange: (id: string, status: ActionItem['status']) => void;
  onEdit: (action: ActionItem) => void;
  color: string;
}) => {
  return (
    <div className="flex-1 min-w-[250px]">
      <div className={cn("flex items-center gap-2 p-3 rounded-t-lg", color)}>
        <Icon className="h-4 w-4" />
        <span className="font-semibold text-sm">{title}</span>
        <Badge variant="secondary" className="ml-auto">{actions.length}</Badge>
      </div>
      <div className="bg-muted/30 p-2 rounded-b-lg min-h-[300px] max-h-[500px] overflow-y-auto">
        {actions.map(action => (
          <ActionCard 
            key={action.id} 
            action={action} 
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        ))}
        {actions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma ação</p>
        )}
      </div>
    </div>
  );
};

// Matriz de Riscos
const RiskMatrix = ({ risks }: { risks: Risk[] }) => {
  const getProbabilityValue = (prob: Risk['probability']) => {
    return { alta: 3, media: 2, baixa: 1 }[prob];
  };
  const getImpactValue = (impact: Risk['impact']) => {
    return { alto: 3, medio: 2, baixo: 1 }[impact];
  };
  
  const getRiskColor = (prob: Risk['probability'], impact: Risk['impact']) => {
    const score = getProbabilityValue(prob) * getImpactValue(impact);
    if (score >= 6) return 'bg-red-500 text-white';
    if (score >= 3) return 'bg-amber-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Matriz de Probabilidade x Impacto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Risco</th>
                <th className="text-center p-2">Probabilidade</th>
                <th className="text-center p-2">Impacto</th>
                <th className="text-left p-2">Mitigação</th>
              </tr>
            </thead>
            <tbody>
              {risks.map(risk => (
                <tr key={risk.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{risk.name}</td>
                  <td className="p-2 text-center">
                    <Badge className={cn(
                      risk.probability === 'alta' ? 'bg-red-500' :
                      risk.probability === 'media' ? 'bg-amber-500' : 'bg-green-500'
                    )}>
                      {risk.probability.charAt(0).toUpperCase() + risk.probability.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={cn(
                      risk.impact === 'alto' ? 'border-red-500 text-red-600' :
                      risk.impact === 'medio' ? 'border-amber-500 text-amber-600' : 'border-green-500 text-green-600'
                    )}>
                      {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-2 text-muted-foreground">{risk.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal
export default function StrategicActionPlan({
  tenantId,
  icpId,
  companyName,
  companyCapitalSocial,
  ceoAnalysis,
  onboardingData
}: StrategicActionPlanProps) {
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);

  // Calcular investimentos proporcionais
  const investments = calculateProportionalInvestment(companyCapitalSocial);

  // Carregar plano existente
  useEffect(() => {
    if (tenantId) {
      loadPlan();
    }
  }, [tenantId, icpId]);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('strategic_action_plans')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && !error.message?.includes('does not exist')) {
        console.error('Erro ao carregar plano:', error);
      }
      
      if (data) {
        setPlan({
          id: data.id,
          tenantId: data.tenant_id,
          icpId: data.icp_id,
          companyCapitalSocial: data.company_capital_social || companyCapitalSocial,
          actions: data.actions || [],
          kpis: data.kpis || [],
          risks: data.risks || [],
          ceoRecommendation: data.ceo_recommendation || '',
          quickWins: data.quick_wins || [],
          criticalDecisions: data.critical_decisions || [],
          investmentSummary: data.investment_summary || investments,
          generatedAt: data.generated_at,
          status: data.status || 'draft'
        });
      }
    } catch (err) {
      console.error('Erro ao carregar plano:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gerar plano estratégico com IA
  const generatePlan = async () => {
    setGenerating(true);
    try {
      toast({
        title: '🧠 Gerando Plano Estratégico...',
        description: 'Analisando dados e criando ações proporcionais ao seu capital.'
      });

      // Prompt específico para o plano
      const prompt = `
Você é um consultor estratégico de negócios especializado em PMEs brasileiras.

## DADOS DA EMPRESA
- Nome: ${companyName}
- Capital Social: ${formatCurrency(companyCapitalSocial)}
- Setor: EPIs / Equipamentos de Proteção

## REGRA CRÍTICA DE INVESTIMENTOS
Os valores de investimento DEVEM ser proporcionais ao capital social:
- Curto Prazo (0-6 meses): ${investments.shortTermRange} (5-10% do capital)
- Médio Prazo (6-18 meses): ${investments.mediumTermRange} (10-20% do capital)
- Longo Prazo (18-36 meses): ${investments.longTermRange} (20-40% do capital)

## ANÁLISE PRÉVIA DO CEO
${ceoAnalysis || 'Não disponível - gerar recomendações baseadas nos dados da empresa.'}

## GERE UM PLANO ESTRATÉGICO ESTRUTURADO

### 1. TOP 10 AÇÕES PRIORITÁRIAS
Para cada ação, inclua:
- Título claro e objetivo
- Descrição detalhada
- Prioridade (alta/media/baixa)
- Prazo (curto/medio/longo)
- Responsável sugerido (cargo)
- Investimento estimado (DENTRO DO RANGE PROPORCIONAL)
- KPI impactado

### 2. KPIs E MÉTRICAS (5-7 métricas)
- Nome do KPI
- Valor atual estimado
- Meta
- Prazo para atingir

### 3. MATRIZ DE RISCOS (4-6 riscos)
- Nome do risco
- Probabilidade (alta/media/baixa)
- Impacto (alto/medio/baixo)
- Estratégia de mitigação

### 4. QUICK WINS (3-5 ações imediatas)
Ações que podem ser implementadas em até 30 dias com baixo investimento.

### 5. DECISÕES CRÍTICAS (3-5 decisões)
Decisões estratégicas que precisam ser tomadas pela diretoria.

### 6. RECOMENDAÇÃO PRINCIPAL DO CEO
Resumo executivo em 2-3 parágrafos.

IMPORTANTE: Todos os valores de investimento devem ser REALISTAS e PROPORCIONAIS ao capital social de ${formatCurrency(companyCapitalSocial)}.

Responda em formato JSON válido seguindo esta estrutura exata:
{
  "actions": [...],
  "kpis": [...],
  "risks": [...],
  "quickWins": [...],
  "criticalDecisions": [...],
  "ceoRecommendation": "...",
  "investmentSummary": { "shortTerm": number, "mediumTerm": number, "longTerm": number }
}
      `;

      const { data, error } = await supabase.functions.invoke('generate-icp-report', {
        body: {
          tenant_id: tenantId,
          report_type: 'strategic_plan',
          custom_prompt: prompt,
          response_format: 'json'
        }
      });

      if (error) throw error;

      // Parsear resposta
      let planData;
      try {
        const content = data?.report_data?.analysis || data?.analysis || '{}';
        // Extrair JSON do markdown se necessário
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        planData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
      } catch (parseErr) {
        console.error('Erro ao parsear JSON:', parseErr);
        // Gerar plano padrão se falhar o parse
        planData = generateDefaultPlan();
      }

      // Criar plano com dados gerados
      const newPlan: StrategicPlan = {
        tenantId,
        icpId,
        companyCapitalSocial,
        actions: (planData.actions || []).map((a: any, idx: number) => ({
          id: `action-${idx}`,
          title: a.title || a.titulo || `Ação ${idx + 1}`,
          description: a.description || a.descricao || '',
          status: 'backlog' as const,
          priority: mapPriority(a.priority || a.prioridade),
          timeframe: mapTimeframe(a.timeframe || a.prazo),
          responsible: a.responsible || a.responsavel,
          deadline: a.deadline || a.prazo_data,
          investmentEstimate: a.investmentEstimate || a.investimento || 0,
          kpiImpact: a.kpiImpact || a.kpi_impactado
        })),
        kpis: (planData.kpis || []).map((k: any, idx: number) => ({
          id: `kpi-${idx}`,
          name: k.name || k.nome,
          currentValue: k.currentValue || k.valor_atual || '0',
          targetValue: k.targetValue || k.meta || '0',
          unit: k.unit || k.unidade || '',
          deadline: k.deadline || k.prazo || '12 meses'
        })),
        risks: (planData.risks || planData.riscos || []).map((r: any, idx: number) => ({
          id: `risk-${idx}`,
          name: r.name || r.nome,
          probability: mapProbability(r.probability || r.probabilidade),
          impact: mapImpact(r.impact || r.impacto),
          mitigation: r.mitigation || r.mitigacao || ''
        })),
        ceoRecommendation: planData.ceoRecommendation || planData.recomendacao_ceo || '',
        quickWins: planData.quickWins || planData.quick_wins || [],
        criticalDecisions: planData.criticalDecisions || planData.decisoes_criticas || [],
        investmentSummary: planData.investmentSummary || {
          shortTerm: investments.shortTerm,
          mediumTerm: investments.mediumTerm,
          longTerm: investments.longTerm
        },
        generatedAt: new Date().toISOString(),
        status: 'draft'
      };

      setPlan(newPlan);
      
      // Salvar no banco
      await savePlan(newPlan);

      toast({
        title: '✅ Plano Estratégico Gerado!',
        description: 'Revise as ações e ajuste conforme necessário.'
      });
    } catch (err: any) {
      console.error('Erro ao gerar plano:', err);
      toast({
        title: 'Erro ao gerar plano',
        description: err.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Funções auxiliares de mapeamento
  const mapPriority = (p: string): ActionItem['priority'] => {
    const lower = (p || '').toLowerCase();
    if (lower.includes('alta') || lower.includes('high')) return 'high';
    if (lower.includes('media') || lower.includes('medium')) return 'medium';
    return 'low';
  };

  const mapTimeframe = (t: string): ActionItem['timeframe'] => {
    const lower = (t || '').toLowerCase();
    if (lower.includes('curto') || lower.includes('short') || lower.includes('0-6')) return 'short';
    if (lower.includes('medio') || lower.includes('medium') || lower.includes('6-18')) return 'medium';
    return 'long';
  };

  const mapProbability = (p: string): Risk['probability'] => {
    const lower = (p || '').toLowerCase();
    if (lower.includes('alta') || lower.includes('high')) return 'alta';
    if (lower.includes('media') || lower.includes('medium')) return 'media';
    return 'baixa';
  };

  const mapImpact = (i: string): Risk['impact'] => {
    const lower = (i || '').toLowerCase();
    if (lower.includes('alto') || lower.includes('high')) return 'alto';
    if (lower.includes('medio') || lower.includes('medium')) return 'medio';
    return 'baixo';
  };

  // Gerar plano padrão se IA falhar
  const generateDefaultPlan = () => ({
    actions: [
      { title: 'Capacitação da equipe de vendas', description: 'Treinamento em técnicas de vendas consultivas', priority: 'alta', timeframe: 'curto', responsible: 'Diretor Comercial', investmentEstimate: investments.shortTerm * 0.2 },
      { title: 'Campanha de marketing digital', description: 'Aumentar presença online e geração de leads', priority: 'alta', timeframe: 'curto', responsible: 'Marketing', investmentEstimate: investments.shortTerm * 0.3 },
      { title: 'Implementação de CRM', description: 'Sistema para gestão de relacionamento com clientes', priority: 'media', timeframe: 'medio', responsible: 'TI', investmentEstimate: investments.mediumTerm * 0.15 },
    ],
    kpis: [
      { name: 'Market Share', currentValue: '5%', targetValue: '8%', unit: '%', deadline: '12 meses' },
      { name: 'Ciclo de Venda', currentValue: '45 dias', targetValue: '30 dias', unit: 'dias', deadline: '6 meses' },
      { name: 'NPS', currentValue: '50', targetValue: '70', unit: 'pontos', deadline: '12 meses' },
    ],
    risks: [
      { name: 'Concorrência agressiva', probability: 'alta', impact: 'alto', mitigation: 'Diferenciação por qualidade e customização' },
      { name: 'Flutuações econômicas', probability: 'media', impact: 'medio', mitigation: 'Diversificação de setores atendidos' },
    ],
    quickWins: ['Otimizar perfil no LinkedIn', 'Reativar clientes inativos', 'Criar material de vendas atualizado'],
    criticalDecisions: ['Definir estratégia de expansão geográfica', 'Avaliar investimento em P&D'],
    ceoRecommendation: `Recomendo focar em diferenciação por qualidade e customização, aproveitando os pontos fortes identificados. O investimento deve ser gradual e proporcional ao capital disponível.`,
    investmentSummary: investments
  });

  // Salvar plano no banco
  const savePlan = async (planToSave: StrategicPlan) => {
    try {
      const payload = {
        tenant_id: planToSave.tenantId,
        icp_id: planToSave.icpId,
        company_capital_social: planToSave.companyCapitalSocial,
        actions: planToSave.actions,
        kpis: planToSave.kpis,
        risks: planToSave.risks,
        ceo_recommendation: planToSave.ceoRecommendation,
        quick_wins: planToSave.quickWins,
        critical_decisions: planToSave.criticalDecisions,
        investment_summary: planToSave.investmentSummary,
        generated_at: planToSave.generatedAt,
        status: planToSave.status,
        updated_at: new Date().toISOString()
      };

      if (planToSave.id) {
        await (supabase as any)
          .from('strategic_action_plans')
          .update(payload)
          .eq('id', planToSave.id);
      } else {
        const { data } = await (supabase as any)
          .from('strategic_action_plans')
          .insert(payload)
          .select()
          .single();
        
        if (data) {
          setPlan(prev => prev ? { ...prev, id: data.id } : null);
        }
      }
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
    }
  };

  // Atualizar status de uma ação
  const handleStatusChange = (actionId: string, newStatus: ActionItem['status']) => {
    if (!plan) return;
    
    const updatedActions = plan.actions.map(a => 
      a.id === actionId ? { ...a, status: newStatus } : a
    );
    
    const updatedPlan = { ...plan, actions: updatedActions };
    setPlan(updatedPlan);
    savePlan(updatedPlan);
  };

  // Renderização
  if (loading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando plano estratégico...</p>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Briefcase className="h-6 w-6 text-indigo-600" />
                  Plano Estratégico de Ação
                </CardTitle>
                <CardDescription className="mt-1">
                  Ações, KPIs e investimentos proporcionais para {companyName}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {plan && (
                  <Button variant="outline" size="sm" onClick={() => savePlan(plan)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                )}
                <Button 
                  onClick={generatePlan} 
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      {plan ? 'Regenerar Plano' : 'Gerar Plano com IA'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumo de Investimentos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-4 cursor-help">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      Curto Prazo (0-6m)
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(plan?.investmentSummary?.shortTerm || investments.shortTerm)}
                    </p>
                    <p className="text-xs text-muted-foreground">5-10% do capital</p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Investimento recomendado: {investments.shortTermRange}</p>
                  <p className="text-xs">Ações imediatas e quick wins</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-4 cursor-help">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Médio Prazo (6-18m)
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(plan?.investmentSummary?.mediumTerm || investments.mediumTerm)}
                    </p>
                    <p className="text-xs text-muted-foreground">10-20% do capital</p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Investimento recomendado: {investments.mediumTermRange}</p>
                  <p className="text-xs">Expansão e consolidação</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-4 cursor-help">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Rocket className="h-4 w-4" />
                      Longo Prazo (18-36m)
                    </div>
                    <p className="text-lg font-bold text-indigo-600">
                      {formatCurrency(plan?.investmentSummary?.longTerm || investments.longTerm)}
                    </p>
                    <p className="text-xs text-muted-foreground">20-40% do capital</p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Investimento recomendado: {investments.longTermRange}</p>
                  <p className="text-xs">Transformação e crescimento</p>
                </TooltipContent>
              </Tooltip>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Capital Social
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(companyCapitalSocial)}</p>
                <p className="text-xs text-muted-foreground">Base para cálculos</p>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Sem plano gerado */}
        {!plan ? (
          <Card className="py-16 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Plano Estratégico não gerado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Clique em "Gerar Plano com IA" para criar um plano de ação estratégico com investimentos 
              proporcionais ao capital social de {formatCurrency(companyCapitalSocial)}.
            </p>
            <Button onClick={generatePlan} disabled={generating} size="lg">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              Gerar Plano Estratégico
            </Button>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
              <TabsTrigger value="kanban">📋 Kanban</TabsTrigger>
              <TabsTrigger value="kpis">📈 KPIs</TabsTrigger>
              <TabsTrigger value="risks">⚠️ Riscos</TabsTrigger>
              <TabsTrigger value="decisions">🎯 Decisões</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              {/* Recomendação do CEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Recomendação Principal do CEO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {plan.ceoRecommendation || 'Recomendação não gerada.'}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Wins e Decisões Críticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Lightbulb className="h-5 w-5" />
                      Quick Wins Imediatos
                    </CardTitle>
                    <CardDescription>Ações de baixo custo e alto impacto (até 30 dias)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.quickWins.map((win, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                          <span className="text-sm">{win}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Flag className="h-5 w-5" />
                      Decisões Críticas a Tomar
                    </CardTitle>
                    <CardDescription>Decisões estratégicas que precisam de ação da diretoria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.criticalDecisions.map((decision, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-1 shrink-0" />
                          <span className="text-sm">{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo de Ações por Prazo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Resumo de Ações por Prazo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <h4 className="font-semibold text-blue-700 mb-2">Curto Prazo (0-6m)</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {plan.actions.filter(a => a.timeframe === 'short').length}
                      </p>
                      <p className="text-sm text-muted-foreground">ações</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <h4 className="font-semibold text-purple-700 mb-2">Médio Prazo (6-18m)</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {plan.actions.filter(a => a.timeframe === 'medium').length}
                      </p>
                      <p className="text-sm text-muted-foreground">ações</p>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <h4 className="font-semibold text-indigo-700 mb-2">Longo Prazo (18-36m)</h4>
                      <p className="text-2xl font-bold text-indigo-600">
                        {plan.actions.filter(a => a.timeframe === 'long').length}
                      </p>
                      <p className="text-sm text-muted-foreground">ações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kanban */}
            <TabsContent value="kanban">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Kanban de Ações Estratégicas
                  </CardTitle>
                  <CardDescription>
                    Arraste as ações entre as colunas para atualizar o status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    <KanbanColumn
                      title="Backlog"
                      icon={Square}
                      status="backlog"
                      actions={plan.actions.filter(a => a.status === 'backlog')}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingAction}
                      color="bg-gray-100 text-gray-700"
                    />
                    <KanbanColumn
                      title="A Fazer"
                      icon={Play}
                      status="todo"
                      actions={plan.actions.filter(a => a.status === 'todo')}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingAction}
                      color="bg-blue-100 text-blue-700"
                    />
                    <KanbanColumn
                      title="Em Progresso"
                      icon={Loader2}
                      status="in_progress"
                      actions={plan.actions.filter(a => a.status === 'in_progress')}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingAction}
                      color="bg-amber-100 text-amber-700"
                    />
                    <KanbanColumn
                      title="Concluído"
                      icon={CheckSquare}
                      status="done"
                      actions={plan.actions.filter(a => a.status === 'done')}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingAction}
                      color="bg-green-100 text-green-700"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KPIs */}
            <TabsContent value="kpis">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    KPIs e Métricas de Acompanhamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plan.kpis.map(kpi => (
                      <Card key={kpi.id} className="p-4">
                        <h4 className="font-semibold mb-2">{kpi.name}</h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Atual:</span>
                          <span className="font-medium">{kpi.currentValue} {kpi.unit}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Meta:</span>
                          <span className="font-bold text-green-600">{kpi.targetValue} {kpi.unit}</span>
                        </div>
                        <Progress value={50} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Prazo: {kpi.deadline}
                        </p>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Riscos */}
            <TabsContent value="risks">
              <RiskMatrix risks={plan.risks} />
            </TabsContent>

            {/* Decisões */}
            <TabsContent value="decisions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Lightbulb className="h-5 w-5" />
                      Quick Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.quickWins.map((win, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Flag className="h-5 w-5" />
                      Decisões Críticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.criticalDecisions.map((decision, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
}

