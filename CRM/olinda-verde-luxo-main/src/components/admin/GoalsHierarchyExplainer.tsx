import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingDown, Users } from "lucide-react";

export const GoalsHierarchyExplainer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5" />
          Como funciona a hierarquia de metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          O sistema de metas funciona em cascata: metas globais da empresa se desdobram em metas de
          diretoria, gerência, equipe e individual.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border">
            <div className="p-2 bg-primary/10 rounded">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">Meta Global (Empresa)</p>
                <Badge variant="default" className="text-xs">
                  Nível 1
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: Faturar R$ 2.000.000/ano ou fechar 200 eventos/ano
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border">
            <div className="p-2 bg-blue-500/10 rounded">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">Direção / Gerência</p>
                <Badge variant="secondary" className="text-xs">
                  Nível 2
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: Gerência comercial deve atingir R$ 800.000/ano (40% da meta global)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-start gap-3 p-3 bg-orange-500/5 rounded-lg border">
            <div className="p-2 bg-orange-500/10 rounded">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">Gestor / Coordenador</p>
                <Badge variant="secondary" className="text-xs">
                  Nível 3
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: Gestor de casamentos deve fechar 80 casamentos/ano
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border">
            <div className="p-2 bg-green-500/10 rounded">
              <Target className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">Vendedor</p>
                <Badge variant="secondary" className="text-xs">
                  Nível 4
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: Cada vendedor deve fechar 15 casamentos/ano (se há 5 vendedores, totaliza 75)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg border">
            <div className="p-2 bg-purple-500/10 rounded">
              <Target className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">SDR</p>
                <Badge variant="secondary" className="text-xs">
                  Nível 5
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: Cada SDR deve qualificar 50 leads/mês ou realizar 40 visitas/mês
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg space-y-2 mt-4">
          <p className="text-sm font-medium">Como definir metas mensuráveis:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Específica:</span> "Fechar 15 casamentos"
              ao invés de "Vender mais"
            </li>
            <li>
              <span className="font-medium text-foreground">Mensurável:</span> Sempre com número
              concreto (quantidade ou valor em R$)
            </li>
            <li>
              <span className="font-medium text-foreground">Atingível:</span> Baseada no histórico
              (meta 10% acima do último período)
            </li>
            <li>
              <span className="font-medium text-foreground">Relevante:</span> Alinhada com objetivo
              da empresa (faturamento, crescimento, etc)
            </li>
            <li>
              <span className="font-medium text-foreground">Temporal:</span> Período claro (semanal,
              mensal, trimestral)
            </li>
          </ul>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
            💡 Dica importante
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Comece sempre pela meta global da empresa e depois "quebre" ela em metas menores por
            nível hierárquico. Assim todos sabem o que precisam fazer para a empresa atingir o
            objetivo maior.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
