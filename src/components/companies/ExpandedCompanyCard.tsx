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
  
  // 🚨 VALIDAÇÃO CRÍTICA: Verificar se company existe e tem ID
  if (!company || !company.id) {
    console.error('[ExpandedCompanyCard] ❌ ERRO: company ou company.id é undefined!', company);
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Erro: Dados da empresa não encontrados</p>
        </CardContent>
      </Card>
    );
  }
  
  const rawData = company.raw_data || company.raw_analysis || {};
  const apolloData = rawData.apollo || rawData.apollo_organization || {};
  const receitaData = rawData.receita_federal || rawData.receita || {};
  
  // 🔍 DEBUG: Ver dados da empresa
  console.log('[ExpandedCompanyCard] 📊 Company Data:', {
    id: company.id,
    name: company.name,
    website: company.website || company.domain || rawData.sites,
    domain: company.domain,
    linkedin_url: company.linkedin_url || rawData.linkedin_url || rawData.linkedin,
    apollo_id: company.apollo_id || rawData.apollo_id,
    description: company.description || rawData.description,
    enrichment_source: company.enrichment_source,
    decision_makers_count: rawData.decision_makers?.length || company.decision_makers?.length || 0,
    rawData_keys: Object.keys(rawData).slice(0, 10)
  });
  
  const fitScore = getFitScore(company);
  
  // ✅ BUSCAR DO MESMO LUGAR QUE CompanyDetailPage: company.decision_makers
  let decisores = company.decision_makers || getDecisionMakers(company);
  
  // 🎯 ORDENAR POR HIERARQUIA BRASILEIRA (Presidente > Diretor > Superintendente > Gerente)
  if (Array.isArray(decisores) && decisores.length > 0) {
    decisores = [...decisores].sort((a: any, b: any) => {
      const getPriority = (pos: string) => {
        const p = (pos || '').toLowerCase();
        
        // 🇧🇷 HIERARQUIA BRASILEIRA
        
        // 1️⃣ PRESIDÊNCIA (Prioridade 1-3)
        if (p.includes('presidente') || p.includes('president')) return 1;
        if (p.includes('ceo') || p.includes('chief executive')) return 1;
        if (p.includes('sócio') || p.includes('socio') || p.includes('proprietário') || p.includes('dono')) return 2;
        if (p.includes('founder') || p.includes('fundador')) return 2;
        
        // 2️⃣ DIRETORIA (Prioridade 10-19)
        if (p.includes('diretor') || p.includes('director')) {
          if (p.includes('geral') || p.includes('executivo') || p.includes('executive')) return 10;
          if (p.includes('comercial') || p.includes('vendas') || p.includes('sales')) return 11;
          if (p.includes('financeiro') || p.includes('financial') || p.includes('cfo')) return 12;
          if (p.includes('operações') || p.includes('operations') || p.includes('coo')) return 13;
          if (p.includes('ti') || p.includes('tecnologia') || p.includes('technology') || p.includes('cto')) return 14;
          if (p.includes('marketing') || p.includes('cmo')) return 15;
          if (p.includes('industrial') || p.includes('produção')) return 16;
          if (p.includes('rh') || p.includes('recursos humanos') || p.includes('people')) return 17;
          return 18; // Diretor genérico
        }
        
        // 3️⃣ SUPERINTENDÊNCIA (Prioridade 20-24)
        if (p.includes('superintendente') || p.includes('superintendent')) {
          if (p.includes('geral')) return 20;
          if (p.includes('comercial') || p.includes('vendas')) return 21;
          if (p.includes('operações') || p.includes('industrial')) return 22;
          return 23; // Superintendente genérico
        }
        
        // 4️⃣ VP / VICE-PRESIDENTE (Prioridade 25-29)
        if (p.includes('vice') || p.includes('vp')) {
          if (p.includes('executivo')) return 25;
          if (p.includes('sales') || p.includes('vendas')) return 26;
          if (p.includes('operations') || p.includes('operações')) return 27;
          return 28; // VP genérico
        }
        
        // 5️⃣ GERÊNCIA (Prioridade 30-39)
        if (p.includes('gerente') || p.includes('manager')) {
          if (p.includes('geral') || p.includes('executivo')) return 30;
          if (p.includes('senior') || p.includes('sênior')) return 31;
          if (p.includes('comercial') || p.includes('vendas')) return 32;
          if (p.includes('ti') || p.includes('tecnologia')) return 33;
          if (p.includes('operações') || p.includes('produção')) return 34;
          return 35; // Gerente genérico
        }
        
        // 6️⃣ COORDENAÇÃO (Prioridade 40-44)
        if (p.includes('coordenador') || p.includes('coordinator')) {
          if (p.includes('geral')) return 40;
          if (p.includes('senior') || p.includes('sênior')) return 41;
          return 42; // Coordenador genérico
        }
        
        // 7️⃣ HEAD OF (Prioridade 45)
        if (p.includes('head of') || p.includes('líder de')) return 45;
        
        // 8️⃣ SUPERVISOR (Prioridade 50)
        if (p.includes('supervisor')) return 50;
        
        // 9️⃣ OUTROS (Prioridade 99)
        return 99;
      };
      
      return getPriority(a.position || a.title || '') - getPriority(b.position || b.title || '');
    });
  }
  const apolloLink = getApolloLink(company);
  const b2bType = getB2BType(company);
  
  // 🌍 DESCRIÇÃO (múltiplas fontes - incluindo raw_data direto)
  const description = 
    company.description ||
    rawData.description ||
    apolloData.short_description || 
    apolloData.description || 
    rawData.notes ||
    rawData.notas ||
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
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[80px]">Nome:</span>
                  <span className="font-medium flex-1 text-left">{company.name || company.razao_social || company.company_name}</span>
                </div>
                {company.industry && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[80px]">Indústria:</span>
                    <span className="font-medium flex-1 text-left">{company.industry}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[80px]">Origem:</span>
                  <Badge variant="outline">{company.source_name || company.data_source || 'N/A'}</Badge>
                </div>
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

            {/* DESCRIÇÃO - SEMPRE MOSTRAR */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Descrição</h4>
              {description ? (
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed text-left">
                    {description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs h-7"
                    onClick={() => navigate(`/company/${company.id}`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar Descrição
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 dark:text-yellow-500 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-left">💡 Esta descrição pode ser enriquecida via Apollo/LinkedIn</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => navigate(`/company/${company.id}`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Adicionar Descrição
                  </Button>
                </div>
              )}
            </div>
            
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
                {/* WEBSITE */}
                {(() => {
                  const websiteUrl = company.website || company.domain || rawData.sites || rawData.melhor_site;
                  if (!websiteUrl) return null;
                  
                  return (
                    <div className="flex items-center gap-2">
                      <a
                        href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        {websiteUrl.replace('https://', '').replace('http://', '').replace('www.', '').substring(0, 30)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => navigate(`/company/${company.id}`)}
                        title="Editar website"
                      >
                        <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  );
                })()}
                
                {/* LINKEDIN */}
                {(() => {
                  const linkedinUrl = company.linkedin_url || rawData.linkedin_url || rawData.linkedin || rawData.digital_presence?.linkedin;
                  if (!linkedinUrl) return null;
                  
                  return (
                    <div className="flex items-center gap-2">
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => navigate(`/company/${company.id}`)}
                        title="Editar LinkedIn"
                      >
                        <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  );
                })()}
                
                {/* APOLLO.IO */}
                {(() => {
                  const apolloId = company.apollo_id || rawData.apollo_id;
                  const apolloLink = apolloId ? `https://app.apollo.io/#/companies/${apolloId}` : getApolloLink(company);
                  if (!apolloLink) return null;
                  
                  return (
                    <div className="flex items-center gap-2">
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
                      {company.enrichment_source === 'auto' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          🤖 AUTO
                        </Badge>
                      )}
                      {company.enrichment_source === 'manual' && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600">
                          ✅ VALIDADO
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => navigate(`/company/${company.id}`)}
                        title="Editar Apollo ID"
                      >
                        <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* DECISORES - SEMPRE MOSTRAR */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Decisores ({decisores.length})
              </h4>
              
              {decisores.length > 0 ? (
                <div className="space-y-2">
                  {decisores.slice(0, 5).map((dm: any, idx: number) => {
                    const fullName = dm.name || dm.full_name || `${dm.first_name || ''} ${dm.last_name || ''}`.trim();
                    const photoUrl = dm.photo_url || dm.raw_data?.photo_url;
                    
                    // Gerar iniciais para avatar
                    const initials = fullName
                      .split(' ')
                      .filter(n => n.length > 0)
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();
                    
                    return (
                      <div key={idx} className="p-3 bg-muted/30 rounded text-xs border flex items-start gap-3">
                        {/* FOTO/AVATAR */}
                        <div className="flex-shrink-0">
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                              {initials}
                            </div>
                          )}
                        </div>
                        
                        {/* DADOS */}
                        <div className="flex-1">
                          <div className="font-medium">{fullName}</div>
                          <div className="text-muted-foreground">{dm.title || dm.position}</div>
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
                      </div>
                    );
                  })}
                  {decisores.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      + {decisores.length - 5} decisores • Clique na empresa para ver todos
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-3 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-xs text-muted-foreground">Nenhum decisor cadastrado</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => navigate(`/company/${company.id}`)}
                  >
                    <Users className="h-3 w-3 mr-1.5" />
                    Buscar Decisores no Apollo
                  </Button>
                </div>
              )}
            </div>

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
            onClick={() => navigate(`/account-strategy/${company.id}`)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Criar Estratégia
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
