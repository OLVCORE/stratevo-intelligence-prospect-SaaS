import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Linkedin,
  Target,
  ExternalLink,
  TrendingUp,
  Phone,
  Users,
  Award,
  Edit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface ExpandedCompanyCardProps {
  company: any;
}

// 🎯 CALCULAR FIT SCORE
function getFitScore(company: any): number {
  let score = 0;
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const decisores = company.decision_makers || rawData.decision_makers || rawData.apollo_people || [];
  
  if (company.totvs_status === 'no-go') return 0;
  
  if (company.totvs_status === 'go') score += 40;
  if (apolloData.organization_id || apolloData.name) score += 20;
  if (apolloData.short_description || apolloData.description || company.description) score += 15;
  score += Math.min(decisores.length, 5) * 5;
  if (company.linkedin_url || rawData.linkedin_url) score += 10;
  if (company.domain || company.website) score += 5;
  
  const receitaData = rawData.receita_federal || rawData.receita || {};
  if (receitaData.situacao === 'ATIVA' || company.cnpj_status === 'ATIVA') score += 5;
  if (company.icp_score && company.icp_score >= 70) score += 10;
  
  return Math.min(score, 100);
}

function getFitScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-orange-500';
}

function getB2BType(company: any): string {
  const rawData = company.raw_data || {};
  return rawData.type || company.segmento || company.b2b_type || 'N/A';
}

function getDecisionMakers(company: any): any[] {
  const rawData = company.raw_data || {};
  return rawData.decision_makers || company.decision_makers || rawData.apollo_people || [];
}

function getApolloLink(company: any): string | null {
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  
  if (rawData.apollo_link) return rawData.apollo_link;
  if (apolloData.organization_id) return `https://app.apollo.io/#/companies/${apolloData.organization_id}`;
  if (company.apollo_id) return `https://app.apollo.io/#/companies/${company.apollo_id}`;
  
  return null;
}

export function ExpandedCompanyCard({ company }: ExpandedCompanyCardProps) {
  const navigate = useNavigate();
  
  const rawData = company.raw_data || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const receitaData = rawData.receita_federal || rawData.receita || {};
  
  const fitScore = getFitScore(company);
  
  // ✅ BUSCAR DO MESMO LUGAR QUE CompanyDetailPage: company.decision_makers
  let decisores = company.decision_makers || getDecisionMakers(company);
  
  // 🎯 ORDENAR POR C-LEVEL
  if (Array.isArray(decisores) && decisores.length > 0) {
    decisores = [...decisores].sort((a: any, b: any) => {
      const getPriority = (pos: string) => {
        const p = (pos || '').toLowerCase();
        if (p.includes('ceo') || p.includes('founder')) return 1;
        if (p.includes('cfo')) return 2;
        if (p.includes('cto')) return 3;
        if (p.includes('coo')) return 4;
        if (p.includes('cmo')) return 5;
        if (p.includes('diretor') || p.includes('director')) return 6;
        if (p.includes('gerente') || p.includes('manager')) return 7;
        return 99;
      };
      return getPriority(a.position || a.title || '') - getPriority(b.position || b.title || '');
    });
  }
  const apolloLink = getApolloLink(company);
  const b2bType = getB2BType(company);
  
  // 🌍 DESCRIÇÃO (múltiplas fontes)
  const description = 
    apolloData.short_description || 
    apolloData.description || 
    company.description || 
    rawData.description ||
    rawData.notes ||
    rawData.company_details?.description || 
    '';

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6">
          
          {/* ========== COLUNA ESQUERDA ========== */}
          <div className="space-y-4">
            
            {/* INFORMAÇÕES GERAIS */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informações Gerais
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{company.name || company.razao_social || company.company_name}</span>
                </div>
                {company.industry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Indústria:</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                )}
                {company.source_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origem:</span>
                    <Badge variant="outline">{company.source_name}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* LOCALIZAÇÃO */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div>
                    {(apolloData.city || receitaData.municipio || company.city) && (
                      <p className="text-muted-foreground">
                        {apolloData.city || receitaData.municipio || company.city}
                      </p>
                    )}
                    {(apolloData.state || receitaData.uf || company.state) && (
                      <p className="text-muted-foreground">
                        {apolloData.state || receitaData.uf || company.state}
                      </p>
                    )}
                    {(apolloData.country || receitaData.pais || company.country || 'Brazil') && (
                      <p className="font-medium">
                        {apolloData.country || receitaData.pais || company.country || 'Brazil'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIÇÃO */}
            {description ? (
              <div>
                <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 dark:text-yellow-500 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>💡 Esta descrição pode ser enriquecida via Apollo/LinkedIn</span>
              </div>
            )}
            
          </div>

          {/* ========== COLUNA DIREITA ========== */}
          <div className="space-y-4">
            
            {/* FIT SCORE */}
            {fitScore > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Fit Score
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getFitScoreColor(fitScore)}`}
                        style={{ width: `${fitScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{fitScore}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {fitScore >= 80 && '🟢 Excelente fit para B2B'}
                  {fitScore >= 60 && fitScore < 80 && '🟡 Bom fit para B2B'}
                  {fitScore < 60 && '🟠 Fit moderado'}
                </p>
                {b2bType !== 'N/A' && (
                  <Badge variant="default" className="mt-2">
                    {b2bType}
                  </Badge>
                )}
              </div>
            )}

            {/* LINKS EXTERNOS */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Links Externos
              </h4>
              <div className="space-y-2">
                {(company.domain || company.website) && (
                  <a
                    href={`https://${company.domain || company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {(company.linkedin_url || rawData.linkedin_url) && (
                  <a
                    href={company.linkedin_url || rawData.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {apolloLink && (
                  <a
                    href={apolloLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <img src={apolloIcon} alt="Apollo" className="h-4 w-4" />
                    Apollo.io
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* DECISORES */}
            {decisores.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Decisores ({decisores.length})
                </h4>
                <div className="space-y-2">
                  {decisores.slice(0, 5).map((dm: any, idx: number) => {
                    const fullName = dm.name || `${dm.first_name || ''} ${dm.last_name || ''}`.trim();
                    
                    return (
                      <div key={idx} className="p-2 bg-muted/30 rounded text-xs border">
                        <div className="font-medium">{fullName}</div>
                        <div className="text-muted-foreground">{dm.title}</div>
                        <div className="flex gap-3 mt-2">
                          {dm.linkedin_url && (
                            <a
                              href={dm.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Linkedin className="h-3 w-3" />
                              LinkedIn
                            </a>
                          )}
                          {dm.email && (
                            <a
                              href={`mailto:${dm.email}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
          
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/company/${company.id}`)}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Ver Detalhes Completos
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/company/${company.id}/strategy`)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Criar Estratégia
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
