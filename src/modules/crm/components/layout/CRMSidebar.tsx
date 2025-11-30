// src/modules/crm/components/layout/CRMSidebar.tsx
// Sidebar do CRM organizada em grupos e subgrupos expansíveis

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Calendar,
  Zap,
  Target,
  Mail,
  MessageSquare,
  Sparkles,
  Ban,
  CheckCircle2,
  FileText,
  Calculator,
  UserCog,
  Shield,
  Settings,
  BarChart3,
  DollarSign,
  Workflow,
  Palette,
  Phone,
  Brain,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTenant } from "@/contexts/TenantContext";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  path: string;
  icon: any;
  roles?: string[];
}

interface MenuGroup {
  title: string;
  icon?: any;
  items: MenuItem[];
  defaultOpen?: boolean;
}

// Estrutura organizada em grupos e subgrupos
const menuGroups: MenuGroup[] = [
  {
    title: "CRM",
    icon: Users,
    defaultOpen: true,
    items: [
      {
        title: "Dashboard",
        path: "/crm/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Leads",
        path: "/crm/leads",
        icon: Users,
      },
      {
        title: "Distribuição",
        path: "/crm/distribution",
        icon: UsersRound,
      },
      {
        title: "Agendamentos",
        path: "/crm/appointments",
        icon: Calendar,
      },
      {
        title: "Propostas",
        path: "/crm/proposals",
        icon: FileText,
      },
      {
        title: "Calculadora",
        path: "/crm/calculator",
        icon: Calculator,
      },
      {
        title: "Oportunidades Fechadas",
        path: "/crm/closed-opportunities",
        icon: CheckCircle2,
      },
      {
        title: "Bloqueios de Datas",
        path: "/crm/calendar-blocks",
        icon: Ban,
      },
    ],
  },
  {
    title: "Inteligência de Vendas",
    icon: Brain,
    defaultOpen: true,
    items: [
      {
        title: "AI Voice SDR",
        path: "/crm/leads", // Integrado na página de Leads
        icon: Phone,
      },
      {
        title: "Insights de IA",
        path: "/crm/ai-insights",
        icon: Sparkles,
      },
      {
        title: "Performance",
        path: "/crm/performance",
        icon: Target,
      },
      {
        title: "Revenue Intelligence",
        path: "/crm/analytics", // Integrado em Analytics
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Automação",
    icon: Zap,
    defaultOpen: true,
    items: [
      {
        title: "Automações",
        path: "/crm/automations",
        icon: Zap,
      },
      {
        title: "Workflows Visuais",
        path: "/crm/workflows",
        icon: Workflow,
      },
      {
        title: "Templates Email",
        path: "/crm/templates",
        icon: Mail,
      },
    ],
  },
  {
    title: "Comunicação",
    icon: MessageSquare,
    defaultOpen: true,
    items: [
      {
        title: "Comunicações",
        path: "/crm/communications",
        icon: MessageSquare,
      },
      {
        title: "WhatsApp",
        path: "/crm/whatsapp",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Analytics & Finanças",
    icon: BarChart3,
    defaultOpen: false,
    items: [
      {
        title: "Analytics",
        path: "/crm/analytics",
        icon: BarChart3,
      },
      {
        title: "Financeiro",
        path: "/crm/financial",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "Administração",
    icon: Settings,
    defaultOpen: false,
    items: [
      {
        title: "Usuários",
        path: "/crm/users",
        icon: UserCog,
      },
      {
        title: "Auditoria",
        path: "/crm/audit-logs",
        icon: Shield,
      },
      {
        title: "Integrações",
        path: "/crm/integrations",
        icon: Settings,
      },
      {
        title: "Customização",
        path: "/crm/customization",
        icon: Palette,
      },
    ],
  },
];

export function CRMSidebar() {
  const location = useLocation();
  const { tenant } = useTenant();
  
  // Estado para controlar quais grupos estão abertos
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuGroups.forEach((group) => {
      initialState[group.title] = group.defaultOpen ?? false;
    });
    return initialState;
  });

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">CRM</h2>
            {tenant && (
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                {tenant.nome || tenant.name}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.title];
          const hasActiveItem = group.items.some((item) => location.pathname === item.path);

          return (
            <SidebarGroup key={group.title}>
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 transition-colors">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {GroupIcon && <GroupIcon className="h-4 w-4" />}
                        <span>{group.title}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "w-full justify-start",
                                isActive && "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              <Link to={item.path}>
                                <Icon className="h-5 w-5 mr-3" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
