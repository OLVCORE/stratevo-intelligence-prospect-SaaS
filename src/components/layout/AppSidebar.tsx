'use client';
import { 
  LayoutDashboard, 
  Search, 
  Brain, 
  Target, 
  Server,
  TrendingUp,
  BookOpen,
  BarChart3,
  Building2,
  PenTool,
  LogOut,
  Settings,
  User,
  FileText,
  Radio,
  MessageSquare,
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  CheckCircle2,
  Globe,
  Users,
  Database,
  Crosshair,
  Sparkles,
  Shield,
  Rocket,
  Activity,
  Code,
  MapPin,
  Layers,
  Inbox,
  ListChecks,
  Repeat,
  LineChart,
  Award,
  DollarSign,
  History,
  XCircle,
  Filter,
  UsersRound,
  Calendar,
  Mail,
  UserCog,
  Calculator,
  GraduationCap,
  Briefcase,
  Play,
  Plus,
  Package,
  Mic,
  Phone,
  Linkedin
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ENABLE_PROSPECCAO } from "@/lib/flags";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Estrutura de tipos para melhor type-safety
type MenuItem = {
  title: string;
  icon: any;
  url: string;
  description: string;
  highlighted?: boolean;
  special?: boolean;
  competitive?: boolean;
  submenu?: Array<{
    title: string;
    icon: any;
    url: string;
    description: string;
  }>;
};

type MenuGroup = {
  label: string;
  icon: any;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Comando",
    icon: Rocket,
    items: [
      {
        title: "Central de Comando",
        icon: Activity,
        url: "/comando",
        description: "Mission Control: Funil operacional e ações priorizadas"
      },
      {
        title: "Dashboard Executivo",
        icon: LayoutDashboard,
        url: "/dashboard",
        description: "Controle de APIs, métricas estratégicas e governança"
      }
    ]
  },
  {
    label: "Prospecção",
    icon: Filter,
    items: [
      ...(ENABLE_PROSPECCAO ? [{
        title: "1.0 Motor de Busca Avançada",
        icon: Search,
        url: "/prospeccao-avancada",
        highlighted: true,
        description: "Busca avançada de empresas com filtros específicos e enriquecimento automático",
      }] : []),
      {
        title: "2.1 Motor de Qualificação",
        icon: Zap,
        url: "/leads/qualification-engine",
        highlighted: true,
        description: "Upload em massa com normalizador universal • CSV, Excel, Google Sheets",
      },
      {
        title: "2.2 Estoque Qualificado",
        icon: Package,
        url: "/leads/qualified-stock",
        highlighted: true,
        description: "Empresas qualificadas prontas para revisão e aprovação"
      },
      {
        title: "3. Base de Empresas",
        icon: Database,
        url: "/companies",
        highlighted: true,
        description: "Gerenciar empresas cadastradas - visualizar, editar, classificar, aprovar"
      },
      {
        title: "4. Leads Aprovados",
        icon: CheckCircle2,
        url: "/leads/approved",
        highlighted: true,
        description: "Enriquecimento e criação de deals - único local de enrichment"
      },
      {
        title: "Empresas Descartadas",
        icon: XCircle,
        url: "/leads/discarded",
        description: "Histórico de empresas descartadas"
      },
      {
        title: "Empresas Similares",
        icon: Target,
        url: "/expansao/empresas-similares",
        description: "Buscar empresas com perfil semelhante para expansão de mercado"
      },
      {
        title: "LinkedIn Automation",
        icon: Linkedin,
        url: "/linkedin",
        highlighted: true,
        description: "Automatize prospecção, importe leads e envie convites personalizados"
      },
    ]
  },
  {
    label: "Configuração ICP",
    icon: Target,
    items: [
      {
        title: "Central ICP",
        icon: Target,
        url: "/central-icp",
        description: "Hub central de análise e gestão de ICP",
        submenu: [
          { title: "Home", icon: LayoutDashboard, url: "/central-icp", description: "Visão geral da Central ICP" },
          { title: "ICP Ativo", icon: Target, url: "/central-icp/active", description: "Perfil ideal do ICP ativo com inteligência consolidada" },
          { title: "Biblioteca de ICPs", icon: FileText, url: "/central-icp/library", description: "Lista completa de ICPs do tenant" },
          { title: "Meus ICPs", icon: FileText, url: "/central-icp/profiles", description: "Visualizar e gerenciar ICPs configurados" },
          { title: "Relatórios ICP", icon: FileText, url: "/central-icp/reports", description: "Relatórios completos e resumos do ICP" },
          { title: "Plano Estratégico", icon: Briefcase, url: "/central-icp/strategic-plan", description: "Kanban, KPIs e ações com investimentos proporcionais" },
        ],
      },
    ]
  },
  {
    label: "Execução",
    icon: Rocket,
    items: [
      {
        title: "SDR Workspace",
        icon: Activity,
        url: "/sdr/workspace",
        highlighted: true,
        special: true,
        description: "SDR + CRM + AI Voice unificado - Hub completo de vendas",
        submenu: [
          { title: "Pipeline Kanban", icon: Activity, url: "/sdr/workspace", description: "Gestão visual de deals" },
          { title: "AI Voice SDR", icon: Mic, url: "/sdr/workspace?tab=ai-voice", description: "Chamadas automáticas 24/7 com IA" },
          { title: "Inbox Unificado", icon: Inbox, url: "/sdr/inbox", description: "Central de mensagens multi-canal" },
          { title: "Sequências", icon: Repeat, url: "/sdr/sequences", description: "Cadências automatizadas" },
          { title: "Tarefas", icon: ListChecks, url: "/sdr/tasks", description: "Gestão de tarefas inteligentes" },
          { title: "Relatórios", icon: BarChart3, url: "/sdr/reports", description: "Métricas, forecast e export CSV" },
          { title: "Integrações", icon: Zap, url: "/sdr/integrations", description: "Twilio, WhatsApp, Email, APIs" },
        ],
      },
    ]
  },
  {
    label: "Estratégia",
    icon: Target,
    items: [
      {
        title: "ROI-Labs",
        icon: Target,
        url: "/account-strategy",
        special: true,
        description: "Central estratégica unificada: ROI, CPQ, Cenários, Propostas e Valor",
        submenu: [
          { title: "Overview Estratégico", icon: LayoutDashboard, url: "/account-strategy?tab=overview", description: "Visão geral da conta e estratégia de abordagem" },
          { title: "ROI & TCO Calculator", icon: DollarSign, url: "/account-strategy?tab=roi", description: "Calculadora interativa de retorno sobre investimento" },
          { title: "CPQ & Pricing Intelligence", icon: Sparkles, url: "/account-strategy?tab=cpq", description: "Configure-Price-Quote com inteligência artificial" },
          { title: "Cenários & Propostas", icon: Layers, url: "/account-strategy?tab=scenarios", description: "Análise Best/Expected/Worst case scenarios" },
          { title: "Propostas Visuais", icon: FileText, url: "/account-strategy?tab=proposals", description: "Geração automatizada de propostas comerciais" },
          { title: "Value Realization", icon: TrendingUp, url: "/account-strategy?tab=value", description: "Acompanhamento de valor entregue ao cliente" },
          { title: "Histórico de Estratégias", icon: History, url: "/account-strategy/history", description: "Todas as estratégias criadas e seus resultados" },
        ],
      },
      {
        title: "Canvas (War Room)",
        icon: Layers,
        url: "/canvas",
        description: "Planejamento colaborativo visual em tempo real para grandes contas"
      },
      {
        title: "Playbooks de Vendas",
        icon: BookOpen,
        url: "/playbooks",
        description: "Guias de abordagem, melhores práticas e scripts aprovados"
      },
      {
        title: "Academia de Vendas",
        icon: GraduationCap,
        url: "/sales-academy",
        description: "Trilhas de aprendizado, certificações e simulador de vendas",
        submenu: [
          { title: "Dashboard", icon: LayoutDashboard, url: "/sales-academy/dashboard", description: "Visão geral do seu progresso" },
          { title: "Trilhas de Aprendizado", icon: BookOpen, url: "/sales-academy/learning-paths", description: "Explore trilhas personalizadas" },
          { title: "Certificações", icon: Award, url: "/sales-academy/certifications", description: "Certifique suas habilidades" },
          { title: "Biblioteca de Playbooks", icon: FileText, url: "/sales-academy/playbooks", description: "Playbooks testados e aprovados" },
          { title: "Simulador de Vendas", icon: Play, url: "/sales-academy/simulator", description: "Pratique em cenários realistas" },
        ],
      },
      {
        title: "Biblioteca de Personas",
        icon: Users,
        url: "/personas-library",
        description: "Perfis comportamentais de decisores e estratégias de abordagem"
      }
    ]
  },
  {
    label: "Métricas",
    icon: BarChart3,
    items: [
      {
        title: "Metas de Vendas",
        icon: Target,
        url: "/goals",
        description: "Acompanhamento de metas individuais e coletivas de performance"
      },
      {
        title: "Analytics SDR",
        icon: LineChart,
        url: "/sdr/analytics",
        description: "Métricas detalhadas de conversão e análise preditiva"
      },
      {
        title: "Relatórios Executivos",
        icon: FileText,
        url: "/reports",
        description: "Biblioteca completa de relatórios executivos e análises"
      }
    ]
  },
  {
    label: "Governança",
    icon: Settings,
    items: [
      {
        title: "Transformação Digital",
        icon: Zap,
        url: "/governance",
        description: "Análise de gaps de governança e roadmap de consultoria"
      },
      {
        title: "Migração de Dados",
        icon: Database,
        url: "/data-migration",
        description: "Limpeza, preparação e importação de dados legados"
      },
      {
        title: "Consultoria OLV Premium",
        icon: Award,
        url: "/consultoria-olv",
        description: "Catálogo e simulador de serviços de consultoria especializada"
      },
      {
        title: "Configurações",
        icon: Settings,
        url: "/settings",
        description: "Integrações, preferências do sistema e gerenciamento de usuários",
        submenu: [
          { title: "Configurações Gerais", icon: Settings, url: "/settings", description: "Integrações e preferências" },
          { title: "Minhas Empresas", icon: Building2, url: "/my-companies", description: "Gerenciar múltiplos CNPJs" },
          { title: "Gerenciar Usuários", icon: Users, url: "/admin/users", description: "Convidar e gerenciar usuários" },
        ],
      },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { open, isMobile, toggleSidebar } = useSidebar();
  
  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r pt-12 md:pt-16"
    >
      <SidebarHeader className="border-b border-sidebar-border p-2 md:p-3 group-data-[collapsible=icon]:p-2">
        {/* Logo removido - apenas no header superior */}
      </SidebarHeader>
      <SidebarContent className="px-1 py-1">
        <TooltipProvider delayDuration={200}>
          {/* Guia STRATEVO One - Item Fixo */}
          <SidebarGroup className="mb-2">
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith('/guide')}
                    className="touch-manipulation active:scale-95 py-3 px-3 bg-primary/5 hover:bg-primary/10 border-l-4 border-primary"
                  >
                    <Link to="/guide">
                      {(open || isMobile) && <span className="text-sm font-semibold">Guia STRATEVO One</span>}
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px]">
                  <p className="text-xs">Guia interativo completo da plataforma - Aprenda e pratique em tempo real</p>
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarGroup>

          {menuGroups.map((group) => {
            const isGroupActive = group.items.some(item => 
              location.pathname === item.url || 
              (item as any).submenu?.some((sub: any) => location.pathname === sub.url)
            );
            
            return (
            <Collapsible key={group.label} className="group/group mb-0.5" defaultOpen={isGroupActive}>
              <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-all cursor-pointer w-full touch-manipulation active:scale-95 py-1.5 px-2 mb-0.5 rounded-lg bg-primary/10 hover:bg-primary/15 group-data-[collapsible=icon]:justify-center">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 group-hover:from-sidebar-primary/30 group-hover:to-sidebar-primary/20 transition-all flex-shrink-0">
                          <group.icon className="h-4 w-4 text-sidebar-primary" />
                        </div>
                        <span className="flex-1 group-data-[collapsible=icon]:hidden text-left">{group.label}</span>
                        <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/group:rotate-90 group-data-[collapsible=icon]:hidden flex-shrink-0" />
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[300px] z-[100]">
                      <p className="font-semibold text-sm mb-1">{group.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.label === "Comando" && "Visão executiva e busca global de inteligência comercial"}
                        {group.label === "Prospecção" && "Gestão de base de empresas e análise 360° com IA"}
                        {group.label === "ICP" && "Qualificação de leads, análise individual, em massa e inteligência competitiva"}
                        {group.label === "Estratégia" && "ROI, CPQ, cenários, propostas e canvas colaborativo"}
                        {group.label === "Execução" && "Suite completa de automação de vendas e outbound"}
                        {group.label === "Métricas" && "Dashboards, metas e analytics de conversão"}
                        {group.label === "Governança" && "Transformação digital, migração de dados e consultoria"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarGroupLabel>
                <CollapsibleContent className="mt-0.5">
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5">
                      {group.items.map((item) => {
                    // 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
                    // Verificar se o item está ativo OU se algum subitem está ativo
                    const hasSubmenu = (item as any).submenu;
                    const isSubItemActive = hasSubmenu && (item as any).submenu?.some((sub: any) => {
                      const subUrl = sub.url.split('?')[0];
                      const currentPath = location.pathname.split('?')[0];
                      return currentPath === subUrl || currentPath.startsWith(subUrl + '/');
                    });
                    const isActive = location.pathname === item.url || isSubItemActive;
                    
                    if (hasSubmenu) {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                 <Collapsible 
                                   className="group/collapsible" 
                                   defaultOpen={(item as any).submenu?.some((sub: any) => location.pathname === sub.url)}
                                 >
                                   <SidebarMenuButton 
                                     asChild
                                     className={cn(
                                       "touch-manipulation active:scale-95 py-3 px-3 mb-1",
                                       item.special && "relative overflow-hidden bg-[hsl(var(--accent-gold))]/15 border-l-4 border-[hsl(var(--accent-gold))] shadow-lg shadow-[hsl(var(--accent-gold))]/20 hover:shadow-[hsl(var(--accent-gold))]/40 transition-all duration-300",
                                       item.competitive && "relative overflow-hidden bg-red-500/10 border-l-4 border-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 animate-pulse-subtle",
                                       item.highlighted && !item.special && !item.competitive && "font-semibold bg-primary/5 border-l-2 border-primary",
                                       // 🔒 PROTEGIDO: Highlight quando item ou subitem está ativo
                                       isActive && !item.special && !item.competitive && "bg-primary/10 border-l-2 border-primary font-semibold"
                                     )}
                                   >
                                     <CollapsibleTrigger className="w-full">
                                         <div className="flex items-center gap-2 py-1 group-data-[collapsible=icon]:justify-center">
                                           <div className="relative flex-shrink-0">
                                             <item.icon className={cn(
                                               "h-4 w-4",
                                               item.special && "text-[hsl(var(--accent-gold))]",
                                               item.competitive && "text-red-500"
                                             )} />
                                             {item.special && (
                                               <div className="absolute -top-1 -right-1 h-2 w-2 bg-[hsl(var(--accent-gold))] rounded-full animate-pulse shadow-lg shadow-[hsl(var(--accent-gold))]/50" />
                                             )}
                                             {item.competitive && (
                                               <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                                             )}
                                           </div>
                                           {(open || isMobile) && (
                                              <span className={cn(
                                                "font-normal text-sm flex-1 text-left truncate whitespace-nowrap",
                                                item.special && "text-[hsl(var(--accent-gold))]",
                                                item.competitive && "text-red-500 font-bold"
                                              )}>
                                               {item.title}
                                             </span>
                                           )}
                                         </div>
                                       {(open || isMobile) && (
                                         <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                       )}
                                     </CollapsibleTrigger>
                                   </SidebarMenuButton>
                                  <CollapsibleContent className="mt-1 ml-8">
                                    <SidebarMenuSub className="space-y-1 border-l-2 border-sidebar-border/30 ml-2 pl-4">
                                      {(item as any).submenu.map((subItem: any) => (
                                         <SidebarMenuSubItem key={subItem.title}>
                                           <Tooltip>
                                             <TooltipTrigger asChild>
                                               <div>
                                                   <SidebarMenuSubButton 
                                                     asChild 
                                                     isActive={
                                                       location.pathname === subItem.url.split('?')[0] || 
                                                       location.pathname.startsWith(subItem.url.split('?')[0] + '/') ||
                                                       (subItem.url.includes('?tab=') && location.search.includes(subItem.url.split('?tab=')[1]))
                                                     } 
                                                     className="touch-manipulation active:scale-95 py-3 px-3"
                                                   >
                                                     {(() => {
                                                       const sp = new URLSearchParams(location.search);
                                                       const company = sp.get('company');
                                                       const base = subItem.url as string;
                                                       const isAS = base.startsWith('/account-strategy');
                                                       const url = isAS && company ? `${base}${base.includes('?') ? '&' : '?'}company=${company}` : base;
                                                        return (
                                                          <Link to={url} className="flex items-center gap-2 min-w-0">
                                                            <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                                            <span className="text-sm truncate whitespace-nowrap">{subItem.title}</span>
                                                          </Link>
                                                        );
                                                     })()}
                                                   </SidebarMenuSubButton>
                                               </div>
                                             </TooltipTrigger>
                                             <TooltipContent side="right" className="max-w-[250px] hidden md:block">
                                               <p className="text-xs">{subItem.description}</p>
                                             </TooltipContent>
                                           </Tooltip>
                                         </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[280px]">
                              <p className="text-xs">{(item as any).description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      );
                    }
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                             <SidebarMenuButton 
                               asChild 
                               isActive={isActive}
                               className={cn(
                                 "touch-manipulation active:scale-95 py-3 px-3",
                                 item.competitive && "relative overflow-hidden bg-red-500/10 border-l-4 border-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 animate-pulse-subtle",
                                 item.highlighted && !item.competitive && "font-semibold bg-primary/5 border-l-2 border-primary",
                                 // 🔒 PROTEGIDO: Highlight quando item está ativo
                                 isActive && !item.competitive && "bg-primary/10 border-l-2 border-primary font-semibold"
                               )}
                             >
                               <Link to={item.url} className="flex items-center gap-2 min-w-0">
                                 <div className="relative flex-shrink-0">
                                   <item.icon className={cn(
                                     "h-4 w-4",
                                     item.competitive && "text-red-500"
                                   )} />
                                   {item.competitive && (
                                     <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                                   )}
                                 </div>
                                 {(open || isMobile) && (
                                   <span className={cn(
                                     "text-sm flex-1 text-left truncate whitespace-nowrap",
                                     item.competitive && "text-red-500 font-bold"
                                   )}>
                                     {item.title}
                                   </span>
                                 )}
                               </Link>
                             </SidebarMenuButton>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[280px] hidden md:block">
                            <p className="text-xs">{(item as any).description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )})}
        </TooltipProvider>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 md:p-4 group-data-[collapsible=icon]:p-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-sidebar-foreground/70 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <User className="h-5 w-5 flex-shrink-0" />
            {(open || isMobile) && <span className="truncate whitespace-nowrap text-sm">{user?.email}</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 touch-manipulation active:scale-95 h-11"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {(open || isMobile) && <span className="ml-2 whitespace-nowrap text-sm">Sair</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              <p>Sair da plataforma</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Marca registrada */}
          {(open || isMobile) && (
            <div className="px-3 py-2 text-center">
              <p className="text-[10px] text-sidebar-foreground/40">
                Powered by OLV Internacional + IA Intelligence 2025 *
              </p>
            </div>
          )}

          {/* Toggle button - sempre visível */}
          <div className="pt-2 border-t border-sidebar-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar();
              }}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary font-semibold transition-all touch-manipulation active:scale-95"
            >
              {open ? (
                <>
                  <ChevronsLeft className="h-5 w-5" />
                  {!isMobile && <span className="text-sm">Recolher</span>}
                </>
              ) : (
                <ChevronsRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
