/**
 * CRM Analytics Service - Métricas e relatórios do CRM interno.
 * Usa cliente Supabase da aplicação (RLS aplicado).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface Activity {
  id: string;
  activity_type: string;
  subject?: string;
  title?: string;
  leadName?: string;
  time?: string;
}

export interface Task {
  id: string;
  task_title: string;
  title?: string;
  priority?: string;
  leadName?: string;
  dueDate?: string;
  due_date?: string;
  isOverdue?: boolean;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  stage?: string;
}

export interface PieChartData {
  stage: string;
  value: number;
  name?: string;
}

export interface BarChartData {
  month: string;
  value: number;
}

export interface ForecastData {
  month: string;
  bestCase: number;
  worstCase: number;
  mostLikely: number;
  weighted: number;
  dealsCount: number;
}

export interface FunnelStage {
  stageName: string;
  stageOrder: number;
  dealsCount: number;
  totalValue: number;
  conversionRate?: number;
}

export interface SalesRepMetrics {
  userId: string;
  period: string;
  leadsCreated: number;
  leadsConverted: number;
  leadConversionRate: number;
  dealsCreated: number;
  dealsWon: number;
  dealWinRate: number;
  revenueWon: number;
  averageDealSize: number;
  activitiesCount: number;
  averageResponseTime: number;
}

export interface DashboardMetrics {
  pipelineValue: number;
  pipelineGrowth: number;
  revenueWon: number;
  revenueGrowth: number;
  newLeads: number;
  leadConversionRate: number;
  dealsWon: number;
  dealsLost: number;
  winRate: number;
  averageDealSize: number;
  todayActivities: Activity[];
  pendingTasks: Task[];
  pipelineEvolution: TimeSeriesData[];
  dealsByStage: PieChartData[];
  revenueByMonth: BarChartData[];
}

type PeriodKey = 'current_month' | 'last_month' | 'last_quarter' | 'last_year';

class CRMAnalyticsService {
  /**
   * Obter métricas do dashboard
   */
  async getDashboardMetrics(
    supabase: SupabaseClient,
    params: {
      period: PeriodKey;
      userId?: string;
      tenantId?: string;
    }
  ): Promise<DashboardMetrics> {
    const { startDate, endDate } = this.getPeriodDates(params.period);

    const baseFilters = {
      created_at_gte: startDate,
      created_at_lte: endDate,
    };

    const [
      pipelineValue,
      newLeads,
      dealsWon,
      dealsLost,
      revenueWon,
      activities,
      tasks,
    ] = await Promise.all([
      this.calculatePipelineValue(supabase, startDate, endDate, params.userId, params.tenantId),
      this.countNewLeads(supabase, startDate, endDate, params.userId, params.tenantId),
      this.countDealsByStatus(supabase, 'won', startDate, endDate, params.userId, params.tenantId),
      this.countDealsByStatus(supabase, 'lost', startDate, endDate, params.userId, params.tenantId),
      this.calculateRevenueWon(supabase, startDate, endDate, params.userId, params.tenantId),
      this.getTodayActivities(supabase, params.userId),
      this.getPendingTasks(supabase, params.userId),
    ]);

    const totalDeals = dealsWon + dealsLost;
    const winRate = totalDeals > 0 ? (dealsWon / totalDeals) * 100 : 0;
    const averageDealSize = dealsWon > 0 ? revenueWon / dealsWon : 0;

    const { startDate: prevStart, endDate: prevEnd } = this.getPreviousPeriodDates(params.period);
    const [previousPipelineValue, previousRevenue] = await Promise.all([
      this.calculatePipelineValue(supabase, prevStart, prevEnd, params.userId, params.tenantId),
      this.calculateRevenueWon(supabase, prevStart, prevEnd, params.userId, params.tenantId),
    ]);

    const pipelineGrowth = this.calculateGrowthPercentage(pipelineValue, previousPipelineValue);
    const revenueGrowth = this.calculateGrowthPercentage(revenueWon, previousRevenue);

    const convertedLeads = await this.countConvertedLeads(supabase, startDate, endDate, params.userId, params.tenantId);
    const leadConversionRate = newLeads > 0 ? (convertedLeads / newLeads) * 100 : 0;

    const [pipelineEvolution, dealsByStage, revenueByMonth] = await Promise.all([
      this.getPipelineEvolution(supabase, params.tenantId),
      this.getDealsByStage(supabase, params.tenantId),
      this.getRevenueByMonth(supabase, startDate, endDate, params.tenantId),
    ]);

    return {
      pipelineValue,
      pipelineGrowth,
      revenueWon,
      revenueGrowth,
      newLeads,
      leadConversionRate,
      dealsWon,
      dealsLost,
      winRate,
      averageDealSize,
      todayActivities: activities,
      pendingTasks: tasks,
      pipelineEvolution,
      dealsByStage,
      revenueByMonth,
    };
  }

  /**
   * Forecast de receita (deals abertos por mês esperado)
   */
  async getRevenueForecast(
    supabase: SupabaseClient,
    params: { userId?: string; tenantId?: string; months: number }
  ): Promise<ForecastData[]> {
    let query = supabase
      .from('crm_deals')
      .select('id, deal_value, win_probability, expected_close_date, pipeline_stage_id')
      .eq('status', 'open')
      .is('deleted_at', null);

    if (params.userId) query = query.eq('owner_id', params.userId);
    if (params.tenantId) query = query.eq('tenant_id', params.tenantId);

    const { data: openDeals } = await query;

    const dealsByMonth: Record<string, { deal_value: number; win_probability?: number }[]> = {};
    openDeals?.forEach((deal: { expected_close_date?: string; deal_value: number; win_probability?: number }) => {
      if (!deal.expected_close_date) return;
      const monthKey = deal.expected_close_date.substring(0, 7);
      if (!dealsByMonth[monthKey]) dealsByMonth[monthKey] = [];
      dealsByMonth[monthKey].push(deal);
    });

    const forecast: ForecastData[] = [];
    const today = new Date();

    for (let i = 0; i < params.months; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = d.toISOString().substring(0, 7);
      const dealsInMonth = dealsByMonth[monthKey] || [];

      const bestCase = dealsInMonth.reduce((sum, deal) => sum + Number(deal.deal_value), 0);
      const mostLikely = dealsInMonth.reduce((sum, deal) => {
        const p = (deal.win_probability ?? 50) / 100;
        return sum + Number(deal.deal_value) * p;
      }, 0);
      const weighted = (bestCase + 4 * mostLikely) / 5;

      forecast.push({
        month: monthKey,
        bestCase,
        worstCase: 0,
        mostLikely,
        weighted,
        dealsCount: dealsInMonth.length,
      });
    }

    return forecast;
  }

  /**
   * Análise de funil por estágios do pipeline
   */
  async getFunnelAnalysis(supabase: SupabaseClient, tenantId?: string): Promise<FunnelStage[]> {
    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .select('id, stage_name, stage_order')
      .order('stage_order', { ascending: true });

    if (!stages?.length) return [];

    const funnelData: FunnelStage[] = [];

    for (const stage of stages) {
      let q = supabase
        .from('crm_deals')
        .select('deal_value', { count: 'exact', head: true })
        .eq('pipeline_stage_id', stage.id)
        .eq('status', 'open')
        .is('deleted_at', null);
      if (tenantId) q = q.eq('tenant_id', tenantId);

      const { count, data: dealsInStage } = await q;

      const totalValue = (dealsInStage ?? []).reduce((sum: number, d: { deal_value?: number }) => sum + Number(d?.deal_value ?? 0), 0);

      funnelData.push({
        stageName: stage.stage_name,
        stageOrder: stage.stage_order,
        dealsCount: count ?? 0,
        totalValue,
      });
    }

    for (let i = 0; i < funnelData.length - 1; i++) {
      const current = funnelData[i];
      const next = funnelData[i + 1];
      current.conversionRate = current.dealsCount > 0 ? (next.dealsCount / current.dealsCount) * 100 : 0;
    }

    return funnelData;
  }

  /**
   * Exportar relatório em CSV
   */
  async exportReportToCSV(
    supabase: SupabaseClient,
    reportType: 'leads' | 'deals' | 'activities',
    filters: Record<string, unknown>
  ): Promise<string> {
    let data: Record<string, unknown>[] = [];

    if (reportType === 'leads') {
      const { data: rows } = await supabase.from('crm_leads').select('*').match(filters).is('deleted_at', null);
      data = rows ?? [];
    } else if (reportType === 'deals') {
      const { data: rows } = await supabase.from('crm_deals').select('*').match(filters).is('deleted_at', null);
      data = rows ?? [];
    } else if (reportType === 'activities') {
      const { data: rows } = await supabase.from('crm_activities').select('*').match(filters);
      data = rows ?? [];
    }

    return this.convertToCSV(data);
  }

  private async calculatePipelineValue(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    userId?: string,
    tenantId?: string
  ): Promise<number> {
    let q = supabase
      .from('crm_deals')
      .select('deal_value')
      .eq('status', 'open')
      .is('deleted_at', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    if (userId) q = q.eq('owner_id', userId);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    return (data ?? []).reduce((sum, d) => sum + Number(d.deal_value ?? 0), 0);
  }

  private async countNewLeads(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    userId?: string,
    tenantId?: string
  ): Promise<number> {
    let q = supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);
    if (userId) q = q.eq('owner_id', userId);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { count } = await q;
    return count ?? 0;
  }

  private async countConvertedLeads(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    userId?: string,
    tenantId?: string
  ): Promise<number> {
    let q = supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);
    if (userId) q = q.eq('owner_id', userId);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { count } = await q;
    return count ?? 0;
  }

  private async countDealsByStatus(
    supabase: SupabaseClient,
    status: string,
    startDate: string,
    endDate: string,
    userId?: string,
    tenantId?: string
  ): Promise<number> {
    let q = supabase
      .from('crm_deals')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);
    if (userId) q = q.eq('owner_id', userId);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { count } = await q;
    return count ?? 0;
  }

  private async calculateRevenueWon(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    userId?: string,
    tenantId?: string
  ): Promise<number> {
    let q = supabase
      .from('crm_deals')
      .select('deal_value')
      .eq('status', 'won')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);
    if (userId) q = q.eq('owner_id', userId);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    return (data ?? []).reduce((sum, d) => sum + Number(d.deal_value ?? 0), 0);
  }

  private async getTodayActivities(supabase: SupabaseClient, userId?: string): Promise<Activity[]> {
    const today = new Date().toISOString().split('T')[0];
    let q = supabase
      .from('crm_activities')
      .select('id, activity_type, subject, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(10);
    if (userId) q = q.eq('performed_by', userId);
    const { data } = await q;
    return (data ?? []).map((a: { id: string; activity_type: string; subject?: string; created_at?: string }) => ({
      id: a.id,
      activity_type: a.activity_type,
      subject: a.subject,
      title: a.subject,
      time: a.created_at ? new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined,
    }));
  }

  private async getPendingTasks(supabase: SupabaseClient, userId?: string): Promise<Task[]> {
    let q = supabase
      .from('crm_tasks')
      .select('id, task_title, priority, due_date')
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(10);
    if (userId) q = q.eq('assigned_to', userId);
    const { data } = await q;
    const today = new Date().toISOString().split('T')[0];
    return (data ?? []).map((t: { id: string; task_title: string; priority?: string; due_date?: string }) => ({
      id: t.id,
      task_title: t.task_title,
      title: t.task_title,
      priority: t.priority,
      due_date: t.due_date,
      dueDate: t.due_date,
      isOverdue: t.due_date ? t.due_date < today : false,
    }));
  }

  private getPeriodDates(period: PeriodKey): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  private getPreviousPeriodDates(period: PeriodKey): { startDate: string; endDate: string } {
    const now = new Date();
    if (period === 'current_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (period === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    return { startDate: now.toISOString(), endDate: now.toISOString() };
  }

  private calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async getPipelineEvolution(supabase: SupabaseClient, tenantId?: string): Promise<TimeSeriesData[]> {
    const { data } = await supabase
      .from('crm_deals')
      .select('created_at, deal_value')
      .eq('status', 'open')
      .is('deleted_at', null);
    if (tenantId) {
      const filtered = (data ?? []).filter((d: { tenant_id?: string }) => d.tenant_id === tenantId);
      return this.aggregateByDate(filtered, 'created_at', 'deal_value');
    }
    return this.aggregateByDate(data ?? [], 'created_at', 'deal_value');
  }

  private async getDealsByStage(supabase: SupabaseClient, tenantId?: string): Promise<PieChartData[]> {
    const { data: stages } = await supabase.from('crm_pipeline_stages').select('id, stage_name');
    if (!stages?.length) return [];

    const result: PieChartData[] = [];
    for (const stage of stages) {
      let q = supabase
        .from('crm_deals')
        .select('deal_value')
        .eq('pipeline_stage_id', stage.id)
        .eq('status', 'open')
        .is('deleted_at', null);
      if (tenantId) q = q.eq('tenant_id', tenantId);
      const { data: deals } = await q;
      const value = (deals ?? []).reduce((sum: number, d: { deal_value?: number }) => sum + Number(d?.deal_value ?? 0), 0);
      result.push({ stage: stage.stage_name, value, name: stage.stage_name });
    }
    return result;
  }

  private async getRevenueByMonth(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    tenantId?: string
  ): Promise<BarChartData[]> {
    let q = supabase
      .from('crm_deals')
      .select('actual_close_date, deal_value')
      .eq('status', 'won')
      .not('actual_close_date', 'is', null)
      .gte('actual_close_date', startDate.split('T')[0])
      .lte('actual_close_date', endDate.split('T')[0])
      .is('deleted_at', null);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    const byMonth: Record<string, number> = {};
    (data ?? []).forEach((d: { actual_close_date?: string; deal_value?: number }) => {
      if (!d.actual_close_date) return;
      const month = d.actual_close_date.substring(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Number(d.deal_value ?? 0);
    });
    return Object.entries(byMonth).map(([month, value]) => ({ month, value }));
  }

  private aggregateByDate(
    rows: { created_at?: string; deal_value?: number }[],
    dateKey: string,
    valueKey: string
  ): TimeSeriesData[] {
    const byDate: Record<string, number> = {};
    rows.forEach((r) => {
      const date = (r as Record<string, unknown>)[dateKey] as string;
      if (!date) return;
      const day = date.split('T')[0];
      byDate[day] = (byDate[day] ?? 0) + Number((r as Record<string, unknown>)[valueKey] ?? 0);
    });
    return Object.entries(byDate).map(([date, value]) => ({ date, value }));
  }

  private convertToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
        })
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

export const crmAnalyticsService = new CRMAnalyticsService();
export default crmAnalyticsService;
