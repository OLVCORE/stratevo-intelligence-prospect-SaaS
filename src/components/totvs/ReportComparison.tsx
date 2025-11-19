/**
 * 📊 COMPONENTE DE COMPARAÇÃO DE RELATÓRIOS
 * 
 * Compara relatório atual com relatórios anteriores
 * Mostra evolução de evidências, produtos detectados, etc.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ComparisonData {
  current: {
    evidences: any[];
    tripleMatches: number;
    doubleMatches: number;
    singleMatches: number;
    products: string[];
    sources: number;
    totalScore: number;
    date: string;
  };
  previous: {
    evidences: any[];
    tripleMatches: number;
    doubleMatches: number;
    singleMatches: number;
    products: string[];
    sources: number;
    totalScore: number;
    date: string;
  };
}

interface ReportComparisonProps {
  companyId: string;
  currentReportId: string;
  currentData: any;
}

export function ReportComparison({ companyId, currentReportId, currentData }: ReportComparisonProps) {
  const [previousReports, setPreviousReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar relatórios anteriores
  useEffect(() => {
    if (!companyId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('stc_verification_history')
          .select('id, created_at, full_report')
          .eq('company_id', companyId)
          .neq('id', currentReportId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setPreviousReports(data || []);
      } catch (error: any) {
        console.error('[COMPARISON] ❌ Erro ao carregar relatórios:', error);
      }
    })();
  }, [companyId, currentReportId]);

  // Calcular comparação
  useEffect(() => {
    if (!selectedReportId || !currentData) return;

    setLoading(true);
    (async () => {
      try {
        const { data: previousReport } = await supabase
          .from('stc_verification_history')
          .select('created_at, full_report')
          .eq('id', selectedReportId)
          .single();

        if (!previousReport) return;

        const previousEvidences = previousReport.full_report?.detection_report?.evidences || [];
        const currentEvidences = currentData.evidences || [];

        const currentProducts = Array.from(new Set(
          currentEvidences.flatMap((e: any) => e.detected_products || [])
        ));
        const previousProducts = Array.from(new Set(
          previousEvidences.flatMap((e: any) => e.detected_products || [])
        ));

        setComparison({
          current: {
            evidences: currentEvidences,
            tripleMatches: currentEvidences.filter((e: any) => e.match_type === 'triple').length,
            doubleMatches: currentEvidences.filter((e: any) => e.match_type === 'double').length,
            singleMatches: currentEvidences.filter((e: any) => e.match_type === 'single').length,
            products: currentProducts as string[],
            sources: currentData.methodology?.searched_sources || 0,
            totalScore: currentData.total_weight || currentData.total_score || 0,
            date: new Date().toISOString(),
          },
          previous: {
            evidences: previousEvidences,
            tripleMatches: previousEvidences.filter((e: any) => e.match_type === 'triple').length,
            doubleMatches: previousEvidences.filter((e: any) => e.match_type === 'double').length,
            singleMatches: previousEvidences.filter((e: any) => e.match_type === 'single').length,
            products: previousProducts as string[],
            sources: previousReport.full_report?.detection_report?.methodology?.searched_sources || 0,
            totalScore: previousReport.full_report?.detection_report?.total_weight || 0,
            date: previousReport.created_at,
          },
        });
      } catch (error: any) {
        console.error('[COMPARISON] ❌ Erro ao comparar:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedReportId, currentData]);

  if (previousReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Comparação com Relatórios Anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum relatório anterior encontrado</p>
            <p className="text-sm mt-2">Execute uma nova verificação para comparar resultados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Comparação com Relatórios Anteriores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de relatório */}
        <div>
          <label className="text-sm font-medium mb-2 block">Comparar com:</label>
          <Select value={selectedReportId} onValueChange={setSelectedReportId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um relatório anterior" />
            </SelectTrigger>
            <SelectContent>
              {previousReports.map((report) => (
                <SelectItem key={report.id} value={report.id}>
                  {new Date(report.created_at).toLocaleString('pt-BR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Calculando comparação...</p>
          </div>
        )}

        {comparison && (
          <>
            {/* Cards de comparação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Evidências</p>
                      <p className="text-2xl font-bold">{comparison.current.evidences.length}</p>
                      <p className="text-xs text-muted-foreground">
                        Anterior: {comparison.previous.evidences.length}
                      </p>
                    </div>
                    {getTrendIcon(
                      calculateChange(
                        comparison.current.evidences.length,
                        comparison.previous.evidences.length
                      )
                    )}
                  </div>
                  <div className={`text-sm mt-2 ${getTrendColor(
                    calculateChange(
                      comparison.current.evidences.length,
                      comparison.previous.evidences.length
                    )
                  )}`}>
                    {calculateChange(
                      comparison.current.evidences.length,
                      comparison.previous.evidences.length
                    ) > 0 ? '+' : ''}
                    {calculateChange(
                      comparison.current.evidences.length,
                      comparison.previous.evidences.length
                    )}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Triple Matches</p>
                      <p className="text-2xl font-bold">{comparison.current.tripleMatches}</p>
                      <p className="text-xs text-muted-foreground">
                        Anterior: {comparison.previous.tripleMatches}
                      </p>
                    </div>
                    {getTrendIcon(
                      calculateChange(
                        comparison.current.tripleMatches,
                        comparison.previous.tripleMatches
                      )
                    )}
                  </div>
                  <div className={`text-sm mt-2 ${getTrendColor(
                    calculateChange(
                      comparison.current.tripleMatches,
                      comparison.previous.tripleMatches
                    )
                  )}`}>
                    {calculateChange(
                      comparison.current.tripleMatches,
                      comparison.previous.tripleMatches
                    ) > 0 ? '+' : ''}
                    {calculateChange(
                      comparison.current.tripleMatches,
                      comparison.previous.tripleMatches
                    )}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Score Total</p>
                      <p className="text-2xl font-bold">{comparison.current.totalScore}</p>
                      <p className="text-xs text-muted-foreground">
                        Anterior: {comparison.previous.totalScore}
                      </p>
                    </div>
                    {getTrendIcon(
                      calculateChange(
                        comparison.current.totalScore,
                        comparison.previous.totalScore
                      )
                    )}
                  </div>
                  <div className={`text-sm mt-2 ${getTrendColor(
                    calculateChange(
                      comparison.current.totalScore,
                      comparison.previous.totalScore
                    )
                  )}`}>
                    {calculateChange(
                      comparison.current.totalScore,
                      comparison.previous.totalScore
                    ) > 0 ? '+' : ''}
                    {calculateChange(
                      comparison.current.totalScore,
                      comparison.previous.totalScore
                    )}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de evolução */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evolução de Evidências</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    {
                      name: 'Anterior',
                      Triple: comparison.previous.tripleMatches,
                      Double: comparison.previous.doubleMatches,
                      Single: comparison.previous.singleMatches,
                    },
                    {
                      name: 'Atual',
                      Triple: comparison.current.tripleMatches,
                      Double: comparison.current.doubleMatches,
                      Single: comparison.current.singleMatches,
                    },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Triple" fill="#10b981" />
                    <Bar dataKey="Double" fill="#3b82f6" />
                    <Bar dataKey="Single" fill="#6b7280" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Produtos novos/removidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produtos Detectados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Novos Produtos ({comparison.current.products.filter(p => !comparison.previous.products.includes(p)).length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {comparison.current.products
                        .filter(p => !comparison.previous.products.includes(p))
                        .map(product => (
                          <Badge key={product} variant="default" className="bg-green-600">
                            {product}
                          </Badge>
                        ))}
                      {comparison.current.products.filter(p => !comparison.previous.products.includes(p)).length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhum produto novo</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Produtos Removidos ({comparison.previous.products.filter(p => !comparison.current.products.includes(p)).length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {comparison.previous.products
                        .filter(p => !comparison.current.products.includes(p))
                        .map(product => (
                          <Badge key={product} variant="destructive">
                            {product}
                          </Badge>
                        ))}
                      {comparison.previous.products.filter(p => !comparison.current.products.includes(p)).length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhum produto removido</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}

