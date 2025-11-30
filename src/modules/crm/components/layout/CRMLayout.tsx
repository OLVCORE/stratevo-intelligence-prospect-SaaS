// src/modules/crm/components/layout/CRMLayout.tsx
// Layout principal do módulo CRM com sidebar dedicada

import { SidebarProvider } from "@/components/ui/sidebar";
import { CRMSidebar } from "./CRMSidebar";
import { useTenant } from "@/contexts/TenantContext";
import { useAutomationPolling } from "@/modules/crm/hooks/useAutomationPolling";
import { Loader2 } from "lucide-react";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const { tenant, loading } = useTenant();
  
  // Sistema de polling interno que substitui cron jobs
  useAutomationPolling();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold mb-2">Nenhuma empresa configurada</h2>
          <p className="text-muted-foreground">
            Por favor, complete o onboarding para acessar o CRM.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CRMSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

