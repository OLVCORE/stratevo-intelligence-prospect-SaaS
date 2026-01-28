// src/modules/crm/index.tsx
// Entry point do módulo CRM completo

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CRMLayout } from "./components/layout/CRMLayout";
import { Loader2 } from "lucide-react";

// Função helper para lazy loading com melhor tratamento de erro
const createLazyComponent = (importFn: () => Promise<any>, name: string) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error: any) {
      console.error(`[CRM] Erro ao carregar ${name}:`, error);
      // Retornar componente de erro com mais informações
      return {
        default: () => (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold mb-2 text-destructive">Erro ao carregar {name}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error?.message || "Erro desconhecido ao carregar o componente"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Recarregar Página
              </button>
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">Detalhes técnicos</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error?.stack || JSON.stringify(error, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ),
      };
    }
  });
};

// Lazy load de todas as páginas do CRM
const Dashboard = createLazyComponent(() => import("./pages/Dashboard"), "Dashboard");
const Leads = createLazyComponent(() => import("./pages/Leads"), "Leads");
const Distribution = createLazyComponent(() => import("./pages/Distribution"), "Distribuição");
const Appointments = createLazyComponent(() => import("./pages/Appointments"), "Agendamentos");
const Automations = createLazyComponent(() => import("./pages/Automations"), "Automações");
const Workflows = createLazyComponent(() => import("./pages/Workflows"), "Workflows");
const Performance = createLazyComponent(() => import("./pages/Performance"), "Performance");
const EmailTemplates = createLazyComponent(() => import("./pages/EmailTemplates"), "Templates Email");
const WhatsApp = createLazyComponent(() => import("./pages/WhatsApp"), "WhatsApp");
const Communications = createLazyComponent(() => import("./pages/Communications"), "Comunicações");
const AIInsights = createLazyComponent(() => import("./pages/AIInsights"), "Insights de IA");
const CalendarBlocks = createLazyComponent(() => import("./pages/CalendarBlocks"), "Bloqueios de Datas");
const ClosedOpportunities = createLazyComponent(() => import("./pages/ClosedOpportunities"), "Oportunidades Fechadas");
const Proposals = createLazyComponent(() => import("./pages/Proposals"), "Propostas");
const Calculator = createLazyComponent(() => import("./pages/Calculator"), "Calculadora");
const Users = createLazyComponent(() => import("./pages/Users"), "Usuários");
const AuditLogs = createLazyComponent(() => import("./pages/AuditLogs"), "Auditoria");
const Integrations = createLazyComponent(() => import("./pages/Integrations"), "Integrações");
const Analytics = createLazyComponent(() => import("./pages/Analytics"), "Analytics");
const Financial = createLazyComponent(() => import("./pages/Financial"), "Financeiro");
const Customization = createLazyComponent(() => import("./pages/Customization"), "Customization");
const CRMReports = createLazyComponent(() => import("@/pages/crm/ReportsPage"), "Relatórios CRM");

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function CRMModule() {
  return (
    <CRMLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="distribution" element={<Distribution />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="automations" element={<Automations />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="performance" element={<Performance />} />
          <Route path="templates" element={<EmailTemplates />} />
          <Route path="communications" element={<Communications />} />
          <Route path="whatsapp" element={<WhatsApp />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="calendar-blocks" element={<CalendarBlocks />} />
          <Route path="closed-opportunities" element={<ClosedOpportunities />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="users" element={<Users />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="integrations" element={<Integrations />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<CRMReports />} />
                <Route path="financial" element={<Financial />} />
                <Route path="customization" element={<Customization />} />
        </Routes>
      </Suspense>
    </CRMLayout>
  );
}

// Export default para compatibilidade com lazy loading
export default CRMModule;

