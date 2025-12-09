/**
 * 📊 StrategicReportRenderer
 * Componente para renderizar relatórios estratégicos de forma elegante e profissional
 */

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb,
  BarChart3,
  Building2,
  Users,
  DollarSign,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrategicReportRendererProps {
  content: string;
  type: 'completo' | 'resumo';
  className?: string;
}

// Componente para seções colapsáveis (controlado externamente)
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  isOpen,
  onToggle,
  variant = 'default'
}: { 
  title: string; 
  icon?: any; 
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const variantStyles = {
    default: 'border-border bg-card',
    success: 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20',
    danger: 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20',
    info: 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20',
  };

  const iconColors = {
    default: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <Card className={cn('overflow-hidden transition-all', variantStyles[variant])}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            {Icon && <Icon className={cn('h-5 w-5', iconColors[variant])} />}
            {title}
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Componente para KPIs
function KPICard({ 
  label, 
  value, 
  trend, 
  trendValue,
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: any;
}) {
  return (
    <div className="bg-gradient-to-br from-muted/50 to-muted rounded-xl p-4 border">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trendValue && (
            <div className={cn(
              'flex items-center gap-1 text-sm',
              trend === 'up' && 'text-green-600',
              trend === 'down' && 'text-red-600',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {trendValue}
            </div>
          )}
        </div>
        {Icon && <Icon className="h-8 w-8 text-primary/40" />}
      </div>
    </div>
  );
}

/**
 * 🔥 MAPEAMENTO DE ROLES DO BANCO → MARCADORES DO MARKDOWN
 * 
 * Roles do banco (app_role enum):
 * - 'sdr' → [SDR]
 * - 'vendedor' ou 'sales' → [CLOSER]
 * - 'gerencia' ou 'gestor' → [GERENTE]
 * - 'direcao' → [DIRETOR_CEO]
 * - 'admin' → VÊ TUDO (sem filtro)
 * - 'viewer' → VÊ TUDO (somente leitura)
 */
function mapRoleToMarkdownMarker(role: string): string[] {
  const roleLower = role.toLowerCase();
  
  // Admin e viewer veem tudo
  if (roleLower === 'admin' || roleLower === 'viewer') {
    return ['SDR', 'CLOSER', 'GERENTE', 'DIRETOR_CEO']; // Todos os marcadores
  }
  
  // Mapeamento específico
  if (roleLower === 'sdr') return ['SDR'];
  if (roleLower === 'vendedor' || roleLower === 'sales') return ['CLOSER'];
  if (roleLower === 'gerencia' || roleLower === 'gestor') return ['GERENTE'];
  if (roleLower === 'direcao' || roleLower === 'diretor' || roleLower === 'ceo') return ['DIRETOR_CEO'];
  
  // Default: se não mapear, vê tudo (compatibilidade)
  return ['SDR', 'CLOSER', 'GERENTE', 'DIRETOR_CEO'];
}

/**
 * 🔥 FILTRAR MARKDOWN POR ROLE
 * Remove seções que não são do role do usuário
 */
function filterMarkdownByRole(content: string, userRoles: string[]): string {
  // Se não tem roles ou é admin/viewer, retorna tudo
  if (!userRoles || userRoles.length === 0) {
    return content; // Sem role = vê tudo (developer mode)
  }
  
  // Verificar se é admin ou viewer
  const isAdmin = userRoles.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'viewer');
  if (isAdmin) {
    return content; // Admin/viewer vê tudo
  }
  
  // Obter marcadores permitidos para os roles do usuário
  const allowedMarkers = new Set<string>();
  userRoles.forEach(role => {
    const markers = mapRoleToMarkdownMarker(role);
    markers.forEach(m => allowedMarkers.add(m));
  });
  
  // Se não tem marcadores permitidos, retorna tudo (fallback)
  if (allowedMarkers.size === 0) {
    return content;
  }
  
  // Dividir conteúdo por linhas
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inRoleSection = false;
  let currentRole: string | null = null;
  let buffer: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Verificar se é início de seção de role: ## [SDR], ## [CLOSER], etc.
    const roleMatch = line.match(/^##+\s*\[(SDR|CLOSER|GERENTE|DIRETOR_CEO)\]/i);
    
    if (roleMatch) {
      // Processar buffer anterior se houver
      if (inRoleSection && currentRole && allowedMarkers.has(currentRole)) {
        filteredLines.push(...buffer);
      }
      
      // Nova seção de role
      currentRole = roleMatch[1].toUpperCase();
      inRoleSection = true;
      buffer = [line]; // Incluir a linha do título
      
      // Verificar se esta seção deve ser mostrada
      if (!allowedMarkers.has(currentRole)) {
        inRoleSection = false; // Não mostrar esta seção
        buffer = [];
      }
    } else if (inRoleSection) {
      // Verificar se é fim da seção (próximo ## sem [ROLE] ou fim do arquivo)
      const nextSectionMatch = line.match(/^##+\s+/);
      if (nextSectionMatch && !line.match(/\[(SDR|CLOSER|GERENTE|DIRETOR_CEO)\]/i)) {
        // Fim da seção de role, próxima seção genérica
        if (currentRole && allowedMarkers.has(currentRole)) {
          filteredLines.push(...buffer);
        }
        inRoleSection = false;
        currentRole = null;
        buffer = [];
        filteredLines.push(line); // Incluir a próxima seção genérica
      } else {
        // Continuar na seção atual
        buffer.push(line);
      }
    } else {
      // Linha fora de seção de role (conteúdo geral) - sempre incluir
      filteredLines.push(line);
    }
  }
  
  // Processar último buffer se houver
  if (inRoleSection && currentRole && allowedMarkers.has(currentRole)) {
    filteredLines.push(...buffer);
  }
  
  return filteredLines.join('\n');
}

// Parser para identificar seções do relatório
function parseReportSections(content: string) {
  const sections: { type: string; title: string; content: string }[] = [];
  
  // Regex para encontrar seções (##, ###, etc.)
  const sectionRegex = /^(#{1,3})\s+(.+?)$/gm;
  let lastIndex = 0;
  let currentSection: { type: string; title: string; content: string } | null = null;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    if (currentSection) {
      currentSection.content = content.slice(lastIndex, match.index).trim();
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }
    
    const level = match[1].length;
    const title = match[2].trim();
    
    currentSection = {
      type: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3',
      title: title.replace(/[📊📈📋🎯⚠️💡🔮📌✅❌🏢👥💰🌍🛡️⚡]/g, '').trim(),
      content: ''
    };
    
    lastIndex = match.index + match[0].length;
  }

  // Última seção
  if (currentSection) {
    currentSection.content = content.slice(lastIndex).trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }

  return sections;
}

// Determinar variante e ícone baseado no título da seção
function getSectionMeta(title: string): { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; icon: any } {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('risco') || titleLower.includes('ameaça')) {
    return { variant: 'danger', icon: AlertTriangle };
  }
  if (titleLower.includes('oportunidade') || titleLower.includes('recomendação')) {
    return { variant: 'success', icon: Lightbulb };
  }
  if (titleLower.includes('análise') || titleLower.includes('mercado')) {
    return { variant: 'info', icon: BarChart3 };
  }
  if (titleLower.includes('competitiv') || titleLower.includes('concorrent')) {
    return { variant: 'warning', icon: Target };
  }
  if (titleLower.includes('icp') || titleLower.includes('cliente ideal')) {
    return { variant: 'default', icon: Users };
  }
  if (titleLower.includes('financ') || titleLower.includes('faturamento')) {
    return { variant: 'default', icon: DollarSign };
  }
  if (titleLower.includes('estratégi') || titleLower.includes('expansão')) {
    return { variant: 'success', icon: Zap };
  }
  if (titleLower.includes('sumário') || titleLower.includes('executivo') || titleLower.includes('resumo')) {
    return { variant: 'info', icon: Target };
  }
  
  return { variant: 'default', icon: CheckCircle2 };
}

export default function StrategicReportRenderer({ content, type, className }: StrategicReportRendererProps) {
  // 🔥 OBTER ROLE DO USUÁRIO
  const { roles: userRoles, isLoading: isLoadingRole } = useUserRole();
  
  // 🔥 FILTRAR CONTEÚDO POR ROLE (se não for admin/viewer)
  const filteredContent = isLoadingRole 
    ? content // Enquanto carrega role, mostra tudo
    : filterMarkdownByRole(content, userRoles);
  
  // Parsear seções para determinar quantas existem
  const sections = parseReportSections(filteredContent);
  const collapsibleSections = sections.filter(s => s.type !== 'h1');
  
  // Estado para controlar abertura/fechamento de cada seção
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(() => {
    // Por padrão, primeiras 5 seções abertas
    const initial: Record<number, boolean> = {};
    collapsibleSections.forEach((_, idx) => {
      initial[idx] = idx < 5;
    });
    return initial;
  });

  // Verificar se todas estão abertas ou fechadas
  const allOpen = collapsibleSections.length > 0 && collapsibleSections.every((_, idx) => openSections[idx]);
  const allClosed = collapsibleSections.length > 0 && collapsibleSections.every((_, idx) => !openSections[idx]);

  // Funções para abrir/fechar todas
  const openAll = () => {
    const newState: Record<number, boolean> = {};
    collapsibleSections.forEach((_, idx) => {
      newState[idx] = true;
    });
    setOpenSections(newState);
  };

  const closeAll = () => {
    const newState: Record<number, boolean> = {};
    collapsibleSections.forEach((_, idx) => {
      newState[idx] = false;
    });
    setOpenSections(newState);
  };

  const toggleSection = (index: number) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Se o conteúdo for muito curto ou vazio
  if (!filteredContent || filteredContent.trim().length < 50) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Conteúdo do relatório não disponível ou ainda não foi gerado.</p>
        {userRoles.length > 0 && !isLoadingRole && (
          <p className="text-xs mt-2 text-muted-foreground/70">
            Role atual: {userRoles.join(', ')} | Conteúdo filtrado por role
          </p>
        )}
      </div>
    );
  }

  // Se não conseguiu parsear seções, renderizar como markdown simples mas estilizado
  if (sections.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-bold
              prose-h1:text-3xl prose-h1:border-b-2 prose-h1:border-primary/20 prose-h1:pb-4 prose-h1:mb-6
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-primary prose-h2:flex prose-h2:items-center prose-h2:gap-2
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-foreground/90
              prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3 prose-h4:font-semibold
              prose-p:text-foreground/80 prose-p:leading-7 prose-p:mb-4
              prose-li:text-foreground/80 prose-li:marker:text-primary prose-li:mb-2
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-4 prose-ol:my-4
              prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden
              prose-th:bg-primary/10 prose-th:p-4 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
              prose-td:p-4 prose-td:border-t prose-td:border-border
              prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:italic
              prose-hr:border-border prose-hr:my-10
              prose-a:text-primary prose-a:underline prose-a:underline-offset-4
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Contador para seções colapsáveis (H2/H3)
  let collapsibleIndex = 0;

  // Renderizar com seções em cards
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header do Relatório com botões Abrir/Fechar Todos */}
      <div className="flex items-center justify-between mb-6">
        <Badge variant="outline" className="text-sm">
          {type === 'completo' ? '📊 Relatório Estratégico Completo' : '📋 Resumo Executivo'}
        </Badge>
        
        {collapsibleSections.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openAll}
              disabled={allOpen}
              className="text-xs"
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Abrir Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={closeAll}
              disabled={allClosed}
              className="text-xs"
            >
              <Minimize2 className="h-3 w-3 mr-1" />
              Fechar Todos
            </Button>
          </div>
        )}
      </div>

      {/* Seções do Relatório */}
      {sections.map((section, index) => {
        const { variant, icon } = getSectionMeta(section.title);
        const isH1 = section.type === 'h1';
        
        // H1 = Seção principal (maior destaque) - não colapsável
        if (isH1) {
          return (
            <div key={index} className="mb-8">
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 text-foreground border-b-2 border-primary/20 pb-4">
                <Target className="h-8 w-8 text-primary" />
                {section.title}
              </h1>
              {section.content && (
                <div className="prose prose-slate dark:prose-invert max-w-none
                  prose-p:text-foreground/80 prose-p:leading-7
                  prose-li:text-foreground/80
                  prose-strong:text-foreground
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        }

        // H2/H3 = Seções colapsáveis em cards
        const currentCollapsibleIndex = collapsibleIndex;
        collapsibleIndex++;

        return (
          <CollapsibleSection
            key={index}
            title={section.title}
            icon={icon}
            variant={variant}
            isOpen={openSections[currentCollapsibleIndex] ?? true}
            onToggle={() => toggleSection(currentCollapsibleIndex)}
          >
            <div className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:text-foreground
              prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
              prose-h4:text-base prose-h4:mt-3 prose-h4:mb-2
              prose-p:text-foreground/80 prose-p:leading-7 prose-p:mb-3
              prose-li:text-foreground/80 prose-li:mb-1.5
              prose-strong:text-foreground
              prose-ul:my-3 prose-ol:my-3
              prose-table:text-sm prose-table:border prose-table:rounded-lg prose-table:overflow-hidden
              prose-th:bg-muted prose-th:p-3 prose-th:text-left prose-th:font-medium
              prose-td:p-3 prose-td:border-t
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
            </div>
          </CollapsibleSection>
        );
      })}

      {/* Footer */}
      <div className="pt-8 border-t text-center">
        <p className="text-sm text-muted-foreground">
          📊 Relatório gerado por STRATEVO Intelligence • Análise de CEO/Estrategista de Mercado
        </p>
        {userRoles.length > 0 && !isLoadingRole && (
          <p className="text-xs mt-2 text-muted-foreground/50">
            Visualização filtrada por role: {userRoles.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

