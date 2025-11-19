/**
 * 📊 DASHBOARD DE MÉTRICAS EXPANDIDO
 * 
 * Visualizações avançadas de métricas do relatório TOTVS
 * Inclui gráficos, distribuições e análises
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Target, 
  Calendar,
  FileText,
  Globe,
  Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Evidence {
  match_type: 'single' | 'double' | 'triple';
  source?: string;
  source_name?: string;
  detected_products?: string[];
  validation_method?: 'ai' | 'basic';
}

interface MetricsDashboardProps {
  evidences: Evidence[];
  tripleMatches: number;
  doubleMatches: number;
  singleMatches: number;
  totalScore?: number;
  sources?: number;
  confidence?: 'high' | 'medium' | 'low';
}

const COLORS = {
  triple: '#10b981',    // green
  double: '#3b82f6',   // blue
  single: '#6b7280',   // gray
  ai: '#10b981',       // green
  basic: '#6b7280',    // gray
};

export function MetricsDashboard({
  evidences,
  tripleMatches,
  doubleMatches,
  singleMatches,
  totalScore = 0,
  sources = 0,
  confidence = 'medium',
}: MetricsDashboardProps) {
  
  // 📊 DADOS PARA GRÁFICOS
  
  // Distribuição por tipo de match (sempre mostrar, mesmo com zeros)
  const matchDistribution = [
    { name: 'Triple', value: tripleMatches, color: COLORS.triple },
    { name: 'Double', value: doubleMatches, color: COLORS.double },
    { name: 'Single', value: singleMatches, color: COLORS.single },
  ].filter(item => item.value > 0); // Filtrar apenas se todos forem zero, mostrar pelo menos um
  
  // Se todos forem zero, mostrar pelo menos um item para o gráfico não ficar vazio
  if (matchDistribution.length === 0) {
    matchDistribution.push({ name: 'Nenhuma evidência', value: 1, color: COLORS.single });
  }
  
  // Distribuição por fonte
  const sourceCounts = evidences.reduce((acc, e) => {
    const source = e.source_name || e.source || 'Desconhecida';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sourceDistribution = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 fontes
  
  // Se não houver fontes, mostrar mensagem
  if (sourceDistribution.length === 0) {
    sourceDistribution.push({ name: 'Nenhuma fonte encontrada', value: 0 });
  }
  
  // Distribuição por produto detectado
  const productCounts = evidences.reduce((acc, e) => {
    (e.detected_products || []).forEach(product => {
      acc[product] = (acc[product] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const productDistribution = Object.entries(productCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 produtos
  
  // Se não houver produtos, mostrar mensagem
  if (productDistribution.length === 0) {
    productDistribution.push({ name: 'Nenhum produto detectado', value: 0 });
  }
  
  // Distribuição por método de validação
  const validationDistribution = [
    { 
      name: 'IA Validada', 
      value: evidences.filter(e => e.validation_method === 'ai').length,
      color: COLORS.ai 
    },
    { 
      name: 'Validação Básica', 
      value: evidences.filter(e => e.validation_method === 'basic' || !e.validation_method).length,
      color: COLORS.basic 
    },
  ];
  
  // 📈 MÉTRICAS CALCULADAS
  const totalEvidences = evidences.length;
  const triplePercentage = totalEvidences > 0 ? Math.round((tripleMatches / totalEvidences) * 100) : 0;
  const doublePercentage = totalEvidences > 0 ? Math.round((doubleMatches / totalEvidences) * 100) : 0;
  const aiValidatedPercentage = totalEvidences > 0 
    ? Math.round((evidences.filter(e => e.validation_method === 'ai').length / totalEvidences) * 100)
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* CARD 1: DISTRIBUIÇÃO POR TIPO DE MATCH */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Distribuição por Tipo de Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Tooltip />
              <Pie
                data={matchDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {matchDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {matchDistribution.map((item) => (
              <Badge key={item.name} variant="outline" className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                {item.name}: {item.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* CARD 2: TOP 10 FONTES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Top 10 Fontes de Evidências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sourceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* CARD 3: TOP 10 PRODUTOS DETECTADOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top 10 Produtos Detectados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* CARD 4: MÉTRICAS RESUMIDAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Métricas Resumidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Total de Evidências</div>
                <div className="text-2xl font-bold">{totalEvidences}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Score Total</div>
                <div className="text-2xl font-bold">{totalScore} pts</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Fontes Consultadas</div>
                <div className="text-2xl font-bold">{sources}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Confiança</div>
                <div className="text-2xl font-bold">
                  {confidence === 'high' ? '🔥 Alta' : confidence === 'medium' ? '⚠️ Média' : '❄️ Baixa'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm">Triple Match</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${triplePercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{triplePercentage}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Double Match</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${doublePercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{doublePercentage}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Validação IA</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${aiValidatedPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{aiValidatedPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* CARD 5: DISTRIBUIÇÃO POR VALIDAÇÃO */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Distribuição por Método de Validação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={validationDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {validationDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

