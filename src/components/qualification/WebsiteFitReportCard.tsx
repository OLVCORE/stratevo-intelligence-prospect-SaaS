import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, ExternalLink, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WebsiteFitReportCardProps {
  websiteUrl?: string;
  websiteFitScore?: number;
  compatibleProducts?: Array<{
    prospect_product: string;
    tenant_product: string;
    match_type: string;
  }>;
  linkedinUrl?: string;
  tenantProducts?: Array<{
    nome: string;
    categoria?: string;
  }>;
  prospectProducts?: Array<{
    nome: string;
    categoria?: string;
  }>;
}

export function WebsiteFitReportCard({
  websiteUrl,
  websiteFitScore = 0,
  compatibleProducts = [],
  linkedinUrl,
  tenantProducts = [],
  prospectProducts = [],
}: WebsiteFitReportCardProps) {
  const hasWebsite = !!websiteUrl;
  const hasFitScore = websiteFitScore > 0;
  const hasCompatibleProducts = compatibleProducts.length > 0;

  // Calcular recomendação baseada no score
  const getRecommendation = () => {
    if (websiteFitScore >= 15) {
      return {
        level: 'high',
        title: 'Alto Fit de Produtos',
        message: 'Esta empresa tem produtos/serviços altamente compatíveis com seu portfólio. Prioridade máxima para abordagem.',
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
      };
    } else if (websiteFitScore >= 10) {
      return {
        level: 'medium',
        title: 'Fit Moderado de Produtos',
        message: 'Há compatibilidade entre os produtos. Considere uma abordagem personalizada destacando os pontos de convergência.',
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      };
    } else if (websiteFitScore > 0) {
      return {
        level: 'low',
        title: 'Fit Baixo de Produtos',
        message: 'Compatibilidade limitada. Avalie se há oportunidades de expansão ou se a empresa pode se beneficiar de soluções complementares.',
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      };
    } else {
      return {
        level: 'none',
        title: 'Sem Análise de Fit',
        message: 'Nenhum produto compatível identificado. Considere enriquecer o website para obter uma análise mais precisa.',
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
      };
    }
  };

  const recommendation = getRecommendation();
  const RecommendationIcon = recommendation.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Análise de Fit do Website
            </CardTitle>
            <CardDescription className="mt-1">
              Comparação de produtos entre tenant e prospect
            </CardDescription>
          </div>
          {hasFitScore && (
            <Badge 
              variant="secondary" 
              className="bg-green-600/10 text-green-600 border-green-600/30 text-sm font-semibold"
            >
              +{websiteFitScore}pts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Links Externos */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasWebsite && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4" />
                Ver Website
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          {linkedinUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>

        {/* Score e Recomendação */}
        {hasFitScore && (
          <div className={`p-4 rounded-lg border ${recommendation.bgColor} border-current/20`}>
            <div className="flex items-start gap-3">
              <RecommendationIcon className={`h-5 w-5 mt-0.5 ${recommendation.color}`} />
              <div className="flex-1 space-y-1">
                <h4 className={`font-semibold text-sm ${recommendation.color}`}>
                  {recommendation.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {recommendation.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Produtos Compatíveis */}
        {hasCompatibleProducts && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Produtos Compatíveis ({compatibleProducts.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {compatibleProducts.map((match, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Match {match.match_type === 'exact_or_substring' ? 'Exato' : 'Por Categoria'}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-primary truncate">
                          {match.tenant_product}
                        </span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="truncate">
                          {match.prospect_product}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo de Produtos */}
        {(tenantProducts.length > 0 || prospectProducts.length > 0) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                Seus Produtos
              </h5>
              <div className="space-y-1">
                {tenantProducts.slice(0, 5).map((product, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                    {product.nome}
                  </Badge>
                ))}
                {tenantProducts.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{tenantProducts.length - 5} mais
                  </span>
                )}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                Produtos do Prospect
              </h5>
              <div className="space-y-1">
                {prospectProducts.slice(0, 5).map((product, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                    {product.nome}
                  </Badge>
                ))}
                {prospectProducts.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{prospectProducts.length - 5} mais
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mensagem quando não há dados */}
        {!hasWebsite && !hasFitScore && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Nenhuma análise de fit disponível.
            </p>
            <p className="text-xs mt-1">
              Use "Enriquecer Website & LinkedIn" para obter uma análise completa.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

