/**
 * SIMILAR COMPANIES TAB V2
 * Nova aba de empresas similares com motor avançado de similaridade
 */

import { useSimilarCompaniesV2 } from '@/hooks/useSimilarCompaniesV2';
import { CompanyProfile } from '@/lib/engines/similarity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, TrendingUp, Target, Sparkles, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface SimilarCompaniesTabV2Props {
  companyId?: string;
  companyName?: string;
  sector?: string;
  state?: string;
  city?: string;
  employees?: number;
  cnae?: string;
  revenue?: number;
  porte?: string;
}

export function SimilarCompaniesTabV2({
  companyId,
  companyName,
  sector,
  state,
  city,
  employees,
  cnae,
  revenue,
  porte
}: SimilarCompaniesTabV2Props) {
  
  const target: CompanyProfile = {
    id: companyId,
    name: companyName || 'Empresa',
    sector,
    state,
    city,
    employees,
    cnae,
    revenue,
    porte
  };
  
  const { data, isLoading, error } = useSimilarCompaniesV2(target, {
    minScore: 55,
    maxResults: 50,
    sources: ['web', 'apollo', 'receita', 'internal']
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Descobrindo empresas similares...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          Erro ao buscar empresas similares
        </div>
      </Card>
    );
  }
  
  const companies = data?.companies || [];
  const stats = data?.statistics;
  
  // Tier colors
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'excellent': return 'bg-green-500';
      case 'premium': return 'bg-blue-500';
      case 'qualified': return 'bg-yellow-500';
      case 'potential': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'excellent': return 'Excelente';
      case 'premium': return 'Premium';
      case 'qualified': return 'Qualificado';
      case 'potential': return 'Potencial';
      default: return 'Baixo';
    }
  };
  
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-6 pb-6">
        {/* Header Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Similaridade Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.avgSimilarityScore || 0}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Novas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.newCompanies || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">No Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.alreadyInDatabase || 0}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Companies List */}
        <div className="space-y-4">
          {companies.map((company, index) => (
            <Card key={company.id || company.cnpj || index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                      {company.alreadyInDatabase && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          No Sistema
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {company.sector && <span>{company.sector}</span>}
                      {company.state && <span>• {company.state}</span>}
                      {company.city && <span>• {company.city}</span>}
                      {company.employees && <span>• {company.employees} funcionários</span>}
                    </div>
                    
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        {company.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {company.similarity.overallScore}%
                    </div>
                    <Badge className={getTierColor(company.similarity.tier)}>
                      {getTierLabel(company.similarity.tier)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {company.similarity.confidence === 'high' ? '🔥 Alta confiança' : 
                       company.similarity.confidence === 'medium' ? '⚡ Média confiança' : '💡 Baixa confiança'}
                    </div>
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Firmográficos</div>
                    <div className="text-sm font-semibold">{company.similarity.breakdown.firmographics}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Tecnográficos</div>
                    <div className="text-sm font-semibold">{company.similarity.breakdown.technographics}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Geográficos</div>
                    <div className="text-sm font-semibold">{company.similarity.breakdown.geographic}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Indústria</div>
                    <div className="text-sm font-semibold">{company.similarity.breakdown.industry}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Comportamentais</div>
                    <div className="text-sm font-semibold">{company.similarity.breakdown.behavioral}%</div>
                  </div>
                </div>
                
                {/* Reasons */}
                {company.similarity.reasons && company.similarity.reasons.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Por que é similar:</div>
                    <div className="flex flex-wrap gap-2">
                      {company.similarity.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {company.alreadyInDatabase ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/companies/${company.existingId}`, '_blank')}
                    >
                      Ver Detalhes
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => toast.success('Funcionalidade de importação em desenvolvimento')}
                    >
                      Importar para Base
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toast.info('Comparação detalhada em desenvolvimento')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Comparar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {companies.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa similar encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os critérios de busca ou adicione mais informações sobre a empresa target.
            </p>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

