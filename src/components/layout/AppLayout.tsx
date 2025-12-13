import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { InsightsDock } from "@/components/insights/InsightsDock";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import ScrollToTop from "@/components/common/ScrollToTop";
import ScrollToBottom from "@/components/common/ScrollToBottom";
import { useNavigate, useLocation } from "react-router-dom";
import { TrevoAssistant } from "@/components/trevo/TrevoAssistant";
import { TenantSelector } from "./TenantSelector";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Top Bar - Fixo no topo */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-3 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-[100]">
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              to="/dashboard" 
              className="hidden sm:flex items-center justify-center group/logo"
              title="Ir para Dashboard"
            >
              <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 w-14 h-14 md:w-18 md:h-18 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-110 hover:from-primary/25 hover:via-primary/15 hover:to-primary/25 border-2 border-primary/30 hover:border-primary/60 ring-2 ring-primary/10 hover:ring-primary/30 overflow-hidden cursor-pointer">
                <img 
                  src="/LOGO Stratevo One.png" 
                  alt="STRATEVO One" 
                  className="w-full h-full object-cover transition-all duration-300 group-hover/logo:drop-shadow-2xl group-hover/logo:drop-shadow-primary/60 group-hover/logo:brightness-110"
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                />
              </div>
            </Link>
            <SidebarTrigger 
              title="Recolher/Expandir Sidebar"
              className="hover:bg-primary/10"
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-2xl mx-2 md:mx-4">
            <GlobalSearch />
            <TenantSelector />
            <Button
              variant="outline"
              onClick={() => setInsightsOpen(true)}
              className="relative gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
            </Button>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <NotificationBell />
            <ModeToggle />
            <TrevoAssistant context={{ currentPage: location.pathname }} />
          </div>
        </header>

        {/* Sidebar - Começa após o header */}
        <AppSidebar />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${insightsOpen ? 'mr-[600px] md:mr-[700px] lg:mr-[800px]' : ''}`}>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 mt-16">
            <Breadcrumb />
            {children}
          </main>
        </div>

        <InsightsDock open={insightsOpen} onOpenChange={setInsightsOpen} />
        
        {/* ScrollToTop e ScrollToBottom Universal - Aparecem em TODAS as páginas */}
        <ScrollToTop />
        <ScrollToBottom />
      </div>
    </SidebarProvider>
  );
}
