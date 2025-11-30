import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Eye, TrendingUp, UserCog, Phone, Target } from "lucide-react";

export const RolesHierarchyInfo = () => {
  const roles = [
    {
      name: "Admin",
      icon: Shield,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      description: "Acesso total ao sistema",
      permissions: [
        "Gerenciar usuários e atribuir roles",
        "Visualizar e editar todos os leads",
        "Configurar distribuição automática",
        "Acessar todas as funcionalidades",
        "Gerenciar integrações e configurações",
      ],
    },
    {
      name: "Direção",
      icon: Target,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      description: "Visão estratégica completa",
      permissions: [
        "Visualizar todos os leads e eventos",
        "Acompanhar performance de toda a equipe",
        "Ver métricas e relatórios consolidados",
        "Monitorar trabalho de gerentes e vendedores",
        "Acesso a dashboard executivo",
      ],
    },
    {
      name: "Gerência",
      icon: UserCog,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      description: "Gestão de equipes de vendas",
      permissions: [
        "Visualizar leads da sua equipe",
        "Gerenciar vendedores e SDRs",
        "Acompanhar agendamentos e propostas",
        "Criar e editar leads",
        "Ver métricas da equipe",
      ],
    },
    {
      name: "Gestor",
      icon: Users,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      description: "Coordenação operacional",
      permissions: [
        "Visualizar e gerenciar leads",
        "Acompanhar atividades da equipe",
        "Criar propostas e agendamentos",
        "Ver métricas operacionais",
      ],
    },
    {
      name: "Sales",
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      description: "Equipe de vendas",
      permissions: [
        "Gerenciar leads atribuídos",
        "Criar e editar propostas",
        "Agendar visitas e eventos",
        "Confirmar eventos",
        "Receber leads via distribuição automática",
      ],
    },
    {
      name: "SDR",
      icon: Phone,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      description: "Pré-vendas e qualificação",
      permissions: [
        "Criar e qualificar novos leads",
        "Fazer primeiro contato",
        "Agendar visitas",
        "Ver leads ativos",
        "Receber leads via distribuição automática",
      ],
    },
    {
      name: "Vendedor",
      icon: Target,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      description: "Fechamento de vendas",
      permissions: [
        "Gerenciar leads atribuídos",
        "Criar e editar vendas",
        "Acompanhar propostas",
        "Gerenciar eventos confirmados",
        "Receber leads via distribuição automática",
      ],
    },
    {
      name: "Viewer",
      icon: Eye,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      description: "Apenas visualização",
      permissions: [
        "Visualizar leads ativos",
        "Sem permissões de edição",
        "Acesso somente leitura",
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Hierarquia de Roles e Permissões
        </CardTitle>
        <CardDescription>
          Entenda como funcionam as permissões e a hierarquia de acesso no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              Distribuição Automática de Leads
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Quando ativada, os novos leads são automaticamente distribuídos para:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Sales</Badge>
              <Badge variant="secondary">Vendedor</Badge>
              <Badge variant="secondary">SDR</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A distribuição usa o método Round Robin, garantindo uma divisão equilibrada entre os vendedores ativos.
            </p>
          </div>

          <div className="grid gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.name}
                  className={`p-4 border rounded-lg ${role.bgColor} border-opacity-30`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-background`}>
                      <Icon className={`h-5 w-5 ${role.color}`} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{role.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {role.description}
                        </Badge>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {role.permissions.map((permission, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{permission}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-blue-400/10 border border-blue-400/30 rounded-lg mt-6">
            <h3 className="font-semibold mb-2">Fluxo de Trabalho Típico</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1. SDR:</strong> Recebe e qualifica novos leads, faz primeiro contato e agenda visitas.
              </p>
              <p>
                <strong className="text-foreground">2. Vendedor/Sales:</strong> Conduz a visita, cria proposta comercial e fecha a venda.
              </p>
              <p>
                <strong className="text-foreground">3. Gestor/Gerência:</strong> Acompanha o progresso, remove bloqueios e apoia a equipe.
              </p>
              <p>
                <strong className="text-foreground">4. Direção:</strong> Monitora métricas gerais, performance da equipe e resultados estratégicos.
              </p>
              <p>
                <strong className="text-foreground">5. Admin:</strong> Gerencia usuários, configurações do sistema e permissões.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
