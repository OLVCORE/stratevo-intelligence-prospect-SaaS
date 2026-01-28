/**
 * Página de relatórios e analytics do CRM interno.
 * Usa CRMAnalyticsService e ForecastChart.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ForecastChart } from '@/components/crm/ForecastChart';
import { supabase } from '@/integrations/supabase/client';
import crmAnalyticsService, {
  type DashboardMetrics,
  type ForecastData,
} from '@/services/crm/CRMAnalyticsService';
import { DollarSign, Users, Trophy, TrendingUp, Loader2, Download } from 'lucide-react';

type PeriodKey = 'current_month' | 'last_month' | 'last_quarter' | 'last_year';

export default function CRMReportsPage() {
  const [period, setPeriod] = useState<PeriodKey>('current_month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, forecastData] = await Promise.all([
        crmAnalyticsService.getDashboardMetrics(supabase, { period }),
        crmAnalyticsService.getRevenueForecast(supabase, { months: 6 }),
      ]);
      setMetrics(metricsData);
      setForecast(forecastData);
    } catch (e) {
      console.error('[CRM Reports] Erro ao carregar:', e);
      setMetrics(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType: 'leads' | 'deals' | 'activities') => {
    try {
      const csv = await crmAnalyticsService.exportReportToCSV(supabase, reportType, {});
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[CRM Reports] Erro ao exportar:', e);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios CRM</h1>
          <p className="text-muted-foreground">Métricas e previsão de receita</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês atual</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="last_quarter">Último trimestre</SelectItem>
              <SelectItem value="last_year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport('deals')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.pipelineValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.pipelineGrowth >= 0 ? '+' : ''}
                  {metrics.pipelineGrowth.toFixed(1)}% vs período anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.newLeads}</div>
                <p className="text-xs text-muted-foreground">
                  Conversão: {metrics.leadConversionRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deals Fechados</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dealsWon}</div>
                <p className="text-xs text-muted-foreground">Win rate: {metrics.winRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Fechada</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.revenueWon)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.revenueGrowth >= 0 ? '+' : ''}
                  {metrics.revenueGrowth.toFixed(1)}% vs período anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <ForecastChart data={forecast} title="Previsão de Receita (próximos 6 meses)" />
        </>
      )}

      {!metrics && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma métrica disponível. Crie pipelines e deals no CRM para ver os relatórios.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
