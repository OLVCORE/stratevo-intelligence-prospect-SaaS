/**
 * 🔥 DASHBOARD DE INTENÇÃO DE COMPRA
 * 
 * Visualiza evidências com sinais de intenção de compra
 * Score de intenção, keywords detectadas, ações sugeridas
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  TrendingUp, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Evidence {
  url: string;
  title: string;
  snippet?: string;
  content?: string;
  match_type: 'single' | 'double' | 'triple';
  source?: string;
  source_name?: string;
  detected_products?: string[];
  intent_keywords?: string[];
  validation_method?: 'ai' | 'basic';
  has_intent?: boolean;
  weight?: number;
  date_found?: string;
}

interface IntentDashboardProps {
  evidences: Evidence[];
  companyName?: string;
}

const COLORS = {
  high: '#ef4444',    // red
  medium: '#f59e0b',  // amber
  low: '#10b981',     // green
};

export function IntentDashboard({ evidences, companyName }: IntentDashboardProps) {
  // Filtrar evidências com intenção
  const intentEvidences = useMemo(() => {
    return evidences.filter(e => e.has_intent || (e.intent_keywords && e.intent_keywords.length > 0));
  }, [evidences]);

  // Calcular score de intenção
  const intentScore = useMemo(() => {
    if (intentEvidences.length === 0) return 0;
    
    const tripleWeight = intentEvidences.filter(e => e.match_type === 'triple').length * 3;
    const doubleWeight = intentEvidences.filter(e => e.match_type === 'double').length * 2;
    const singleWeight = intentEvidences.filter(e => e.match_type === 'single').length * 1;
    
    const totalWeight = tripleWeight + doubleWeight + singleWeight;
    const maxPossible = intentEvidences.length * 3;
    
    return Math.round((totalWeight / maxPossible) * 100);
  }, [intentEvidences]);

  // Classificar nível de intenção
  const intentLevel = useMemo(() => {
    if (intentScore >= 70) return { level: 'Alta', color: COLORS.high, icon: Flame };
    if (intentScore >= 40) return { level: 'Média', color: COLORS.medium, icon: TrendingUp };
    return { level: 'Baixa', color: COLORS.low, icon: Target };
  }, [intentScore]);

  // Coletar todas as keywords de intenção
  const allIntentKeywords = useMemo(() => {
    const keywords = new Map<string, number>();
    intentEvidences.forEach(e => {
      (e.intent_keywords || []).forEach(keyword => {
        keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
      });
    });
    return Array.from(keywords.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [intentEvidences]);

  // Produtos mais mencionados em evidências com intenção
  const productsWithIntent = useMemo(() => {
    const products = new Map<string, number>();
    intentEvidences.forEach(e => {
      (e.detected_products || []).forEach(product => {
        products.set(product, (products.get(product) || 0) + 1);
      });
    });
    return Array.from(products.entries())
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count);
  }, [intentEvidences]);

  // Sugestões de ação baseadas em intenção
  const actionSuggestions = useMemo(() => {
    const suggestions = [];
    
    if (intentScore >= 70) {
      suggestions.push({
        priority: 'Alta',
        action: 'Contato Imediato',
        description: 'Empresa demonstra alta intenção de compra. Priorizar contato.',
        icon: Phone,
        color: 'text-red-600',
      });
    }
    
    if (intentEvidences.filter(e => e.intent_keywords?.some(k => 
      k.toLowerCase().includes('contrat') || 
      k.toLowerCase().includes('licit') ||
      k.toLowerCase().includes('procur')
    )).length > 0) {
      suggestions.push({
        priority: 'Alta',
        action: 'Enviar Proposta',
        description: 'Evidências de busca ativa por soluções. Preparar proposta comercial.',
        icon: Mail,
        color: 'text-blue-600',
      });
    }
    
    if (productsWithIntent.length > 0) {
      suggestions.push({
        priority: 'Média',
        action: 'Apresentar Produtos',
        description: `Focar em: ${productsWithIntent.slice(0, 3).map(p => p.product).join(', ')}`,
        icon: Target,
        color: 'text-green-600',
      });
    }
    
    return suggestions;
  }, [intentScore, intentEvidences, productsWithIntent]);

  if (intentEvidences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Dashboard de Intenção de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma evidência com intenção de compra detectada</p>
            <p className="text-sm mt-2">Continue monitorando para identificar oportunidades</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score de Intenção */}
      <Card className="border-2" style={{ borderColor: intentLevel.color }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <intentLevel.icon className="w-5 h-5" style={{ color: intentLevel.color }} />
            Score de Intenção de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold" style={{ color: intentLevel.color }}>
                {intentScore}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Nível: {intentLevel.level}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {intentEvidences.length} evidência(s) com sinais de intenção
              </div>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={intentLevel.color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - intentScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Evidências com Intenção</p>
                <p className="text-2xl font-bold">{intentEvidences.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((intentEvidences.length / evidences.length) * 100)}% do total
                </p>
              </div>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Keywords Detectadas</p>
                <p className="text-2xl font-bold">{allIntentKeywords.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de sinais únicos
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos em Foco</p>
                <p className="text-2xl font-bold">{productsWithIntent.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Produtos mencionados
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Keywords de Intenção</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={allIntentKeywords}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="keyword" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sugestões de Ação */}
      {actionSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Sugestões de Ação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <suggestion.icon className={`w-5 h-5 mt-0.5 ${suggestion.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{suggestion.action}</span>
                      <Badge variant={suggestion.priority === 'Alta' ? 'destructive' : 'secondary'}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

