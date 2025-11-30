import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  UserCog,
  ChevronRight,
  Shield,
  Settings,
  BarChart3,
  Ban,
  CheckCircle2,
  DollarSign,
  Calculator,
  UsersRound,
  Zap,
  Mail,
  MessageSquare,
  Target,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/logo-official.png";
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
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor", "viewer"],
  },
  {
    title: "Leads",
    url: "/admin/leads",
    icon: Users,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor", "viewer"],
  },
  {
    title: "Distribuição",
    url: "/admin/distribution",
    icon: UsersRound,
    roles: ["admin", "direcao", "gerencia", "gestor"],
  },
  {
    title: "Agendamentos",
    url: "/admin/appointments",
    icon: Calendar,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor"],
  },
  {
    title: "Automações",
    url: "/admin/automations",
    icon: Zap,
    roles: ["admin", "direcao", "gerencia", "gestor"],
  },
  {
    title: "Workflows Visuais",
    url: "/admin/workflows",
    icon: Zap,
    roles: ["admin", "direcao", "gerencia", "gestor"],
  },
  {
    title: "Performance",
    url: "/admin/performance",
    icon: Target,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor"],
  },
  {
    title: "Templates Email",
    url: "/admin/templates",
    icon: Mail,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "vendedor"],
  },
  {
    title: "WhatsApp",
    url: "/admin/whatsapp",
    icon: MessageSquare,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor"],
  },
  {
    title: "Insights de IA",
    url: "/admin/ai-insights",
    icon: Sparkles,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor"],
  },
  {
    title: "Bloqueios de Datas",
    url: "/admin/event-blocks",
    icon: Ban,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales"],
  },
  {
    title: "Eventos Confirmados",
    url: "/admin/confirmed-events",
    icon: CheckCircle2,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales"],
  },
  {
    title: "Propostas",
    url: "/admin/proposals",
    icon: FileText,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "vendedor"],
  },
  {
    title: "Calculadora",
    url: "/admin/calculadora",
    icon: Calculator,
    roles: ["admin", "direcao", "gerencia", "gestor", "sales", "sdr", "vendedor"],
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: UserCog,
    roles: ["admin", "direcao", "gerencia", "gestor"],
  },
  {
    title: "Auditoria",
    url: "/admin/audit-logs",
    icon: Shield,
    roles: ["admin", "direcao", "gerencia"],
  },
  {
    title: "Integrações",
    url: "/admin/integrations",
    icon: Settings,
    roles: ["admin", "direcao"],
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin", "direcao", "gerencia", "gestor"],
  },
  {
    title: "Financeiro",
    url: "/admin/financial",
    icon: DollarSign,
    roles: ["admin", "direcao", "gerencia"],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles) {
        setUserRoles(roles.map((r) => r.role));
      }
    };

    fetchUserRoles();
  }, []);

  const filteredMenuItems = userRoles.length === 0
    ? menuItems
    : menuItems.filter((item) => item.roles.some((role) => userRoles.includes(role)));

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-6 bg-sidebar">
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Espaço Olinda" 
            className="h-16 w-16 object-contain" 
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))',
              mixBlendMode: 'lighten'
            }} 
          />
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Espaço Olinda</h2>
            <p className="text-xs text-sidebar-foreground/80">Sistema CRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider px-3 py-2 text-sidebar-foreground/70">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5 text-sidebar-foreground">
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1 text-sm font-medium">{item.title}</span>
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar">
        <p className="text-xs text-center text-sidebar-foreground/60">
          © 2025 Espaço Olinda
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
