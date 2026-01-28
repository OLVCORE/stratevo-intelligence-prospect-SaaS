/**
 * Componente de gráfico de forecast de receita (CRM).
 * Recebe dados de forecast e exibe por mês.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ForecastData } from '@/services/crm/CRMAnalyticsService';

interface ForecastChartProps {
  data: ForecastData[];
  title?: string;
  currency?: string;
}

export function ForecastChart({ data, title = 'Previsão de Receita', currency = 'BRL' }: ForecastChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);

  const maxValue = Math.max(...data.map((d) => d.weighted), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.month} className="flex items-center gap-4">
              <span className="w-24 text-sm text-muted-foreground">
                {new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
              <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary rounded transition-all"
                  style={{ width: `${(item.weighted / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-28 text-sm font-medium text-right">{formatCurrency(item.weighted)}</span>
            </div>
          ))}
        </div>
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado de forecast no período.</p>
        )}
      </CardContent>
    </Card>
  );
}
