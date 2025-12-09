import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Target, TrendingUp, Package, Briefcase, Brain, Users, MapPin, DollarSign, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { TenantICPModel } from '@/hooks/useTenantICP';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ICPExecutiveSummaryProps {
  icp: TenantICPModel;
}

/**
 * Componente de resumo executivo unificado do ICP
 * MC1[ui]: Exibe todos os blocos de inteligência do ICP de forma consolidada
 */
export function ICPExecutiveSummary({ icp }: ICPExecutiveSummaryProps) {
  console.log('MC1[ui]: ICPExecutiveSummary renderizado com dados do ICP');

  if (!icp.profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">Nenhum ICP disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção 1: Perfil Básico */}
      <Card className="border-l-4 border-l-indigo-600/90 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
            <CardTitle className="text-indigo-800 dark:text-indigo-100 font-semibold">Perfil Básico</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome do ICP</p>
              <p className="text-lg font-semibold">{icp.profile.nome}</p>
            </div>
            {icp.profile.descricao && (
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{icp.profile.descricao}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Setor</p>
              <p className="text-sm font-medium">{icp.profile.setor_foco || 'Não definido'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nicho</p>
              <p className="text-sm font-medium">{icp.profile.nicho_foco || 'Não definido'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge variant="outline">{icp.profile.tipo}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex gap-2">
                {icp.profile.icp_principal && (
                  <Badge className="bg-indigo-600/90 text-white text-[10px]">Principal</Badge>
                )}
                {icp.profile.ativo && (
                  <Badge className="bg-emerald-600/90 text-white text-[10px]">Ativo</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Persona e Critérios */}
      {icp.persona && (
        <Card className="border-l-4 border-l-purple-600/90 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-700 dark:text-purple-500" />
              <CardTitle className="text-purple-800 dark:text-purple-100 font-semibold">Persona e Critérios</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {icp.persona.decisor && (
              <div>
                <p className="text-sm text-muted-foreground">Persona Decisora</p>
                <p className="text-sm font-medium">{icp.persona.decisor}</p>
              </div>
            )}
            {icp.persona.dor_principal && (
              <div>
                <p className="text-sm text-muted-foreground">Dor Principal</p>
                <p className="text-sm">{icp.persona.dor_principal}</p>
              </div>
            )}
            {icp.persona.objeções && icp.persona.objeções.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Principais Objeções</p>
                <div className="flex flex-wrap gap-2">
                  {icp.persona.objeções.slice(0, 3).map((obj, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{obj}</Badge>
                  ))}
                </div>
              </div>
            )}
            {icp.persona.desejos && icp.persona.desejos.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Principais Desejos</p>
                <div className="flex flex-wrap gap-2">
                  {icp.persona.desejos.slice(0, 3).map((desejo, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30">{desejo}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {icp.persona.stack_tech && (
                <div>
                  <p className="text-sm text-muted-foreground">Stack Tech</p>
                  <p className="text-sm">{icp.persona.stack_tech}</p>
                </div>
              )}
              {icp.persona.maturidade_digital && (
                <div>
                  <p className="text-sm text-muted-foreground">Maturidade Digital</p>
                  <p className="text-sm">{icp.persona.maturidade_digital}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 3: Análise Competitiva */}
      {icp.competitiveMatrix && (
        <Card className="border-l-4 border-l-rose-600/90 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-rose-700 dark:text-rose-500" />
                <CardTitle className="text-rose-800 dark:text-rose-100 font-semibold">Análise Competitiva</CardTitle>
              </div>
              <Link to={`/central-icp/profile/${icp.profile.id}`}>
                <Button variant="ghost" size="sm">Ver completo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Posição no Mercado</p>
                <p className="text-2xl font-bold">{icp.competitiveMatrix.yourPosition}º</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Share</p>
                <p className="text-2xl font-bold">{icp.competitiveMatrix.yourMarketShare.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capital Total Concorrentes</p>
                <p className="text-lg font-semibold">R$ {(icp.competitiveMatrix.totalCapital / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            {icp.competitiveMatrix.topCompetitors.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Concorrentes</p>
                <div className="space-y-2">
                  {icp.competitiveMatrix.topCompetitors.slice(0, 3).map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
                      <span className="text-sm font-medium">{comp.nome}</span>
                      <div className="flex gap-2">
                        <Badge variant={comp.ameacaPotencial === 'alta' ? 'destructive' : comp.ameacaPotencial === 'media' ? 'default' : 'secondary'}>
                          {comp.ameacaPotencial}
                        </Badge>
                        {comp.produtosCount > 0 && (
                          <Badge variant="outline">{comp.produtosCount} produtos</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {icp.competitiveMatrix.diferenciais.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Principais Diferenciais</p>
                <div className="flex flex-wrap gap-2">
                  {icp.competitiveMatrix.diferenciais.slice(0, 5).map((diff, idx) => (
                    <Badge key={idx} variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30">{diff}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção 4: Matriz BCG */}
      {icp.bcgMatrix && (
        <Card className="border-l-4 border-l-sky-600/90 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-700 dark:text-sky-500" />
                <CardTitle className="text-sky-800 dark:text-sky-100 font-semibold">Matriz BCG</CardTitle>
              </div>
              <Link to={`/central-icp/profile/${icp.profile.id}`}>
                <Button variant="ghost" size="sm">Ver completo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {icp.bcgMatrix.priorityNiches.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Nichos Prioritários</p>
                <div className="flex flex-wrap gap-2">
                  {icp.bcgMatrix.priorityNiches.slice(0, 3).map((niche, idx) => (
                    <Badge key={idx} variant="outline">{niche.name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {icp.bcgMatrix.desiredClients.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Clientes Desejados</p>
                <div className="space-y-1">
                  {icp.bcgMatrix.desiredClients.slice(0, 3).map((client, idx) => (
                    <div key={idx} className="text-sm">{client.name}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção 5: Métricas de Produtos */}
      {icp.productMetrics && (
        <Card className="border-l-4 border-l-orange-600/90 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                <CardTitle className="text-orange-800 dark:text-orange-100 font-semibold">Métricas de Produtos</CardTitle>
              </div>
              <Link to={`/central-icp/profile/${icp.profile.id}`}>
                <Button variant="ghost" size="sm">Ver completo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Tenant</p>
                <p className="text-2xl font-bold">{icp.productMetrics.tenantProductsCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos Concorrentes</p>
                <p className="text-2xl font-bold">{icp.productMetrics.competitorProductsCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categorias</p>
                <p className="text-2xl font-bold">{icp.productMetrics.totalCategories}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diferenciais</p>
                <p className="text-2xl font-bold">{icp.productMetrics.differentials.length}</p>
              </div>
            </div>
            {icp.productMetrics.differentials.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Principais Diferenciais</p>
                <div className="flex flex-wrap gap-2">
                  {icp.productMetrics.differentials.slice(0, 5).map((diff, idx) => (
                    <Badge key={idx} variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30">
                      {diff.nome} ({diff.categoria})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {icp.productMetrics.opportunities.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Oportunidades de Expansão</p>
                <div className="flex flex-wrap gap-2">
                  {icp.productMetrics.opportunities.slice(0, 5).map((opp, idx) => (
                    <Badge key={idx} variant="outline" className="bg-sky-50 dark:bg-sky-950/30">
                      {opp.categoria}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {icp.productMetrics.highCompetition.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Alta Concorrência</p>
                <div className="flex flex-wrap gap-2">
                  {icp.productMetrics.highCompetition.map((hc, idx) => (
                    <Badge key={idx} variant="outline" className="bg-rose-50 dark:bg-rose-950/30">
                      {hc.categoria} ({hc.competitorCount} concorrentes)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção 6: Plano Estratégico */}
      {icp.strategicPlan && (
        <Card className="border-l-4 border-l-indigo-600/90 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
                <CardTitle className="text-indigo-800 dark:text-indigo-100 font-semibold">Plano Estratégico</CardTitle>
              </div>
              <Link to={`/central-icp/profile/${icp.profile.id}`}>
                <Button variant="ghost" size="sm">Ver completo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {icp.strategicPlan.quickWins.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Quick Wins</p>
                <ul className="list-disc list-inside space-y-1">
                  {icp.strategicPlan.quickWins.slice(0, 3).map((qw, idx) => (
                    <li key={idx} className="text-sm">{qw}</li>
                  ))}
                </ul>
              </div>
            )}
            {icp.strategicPlan.criticalDecisions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Decisões Críticas</p>
                <ul className="list-disc list-inside space-y-1">
                  {icp.strategicPlan.criticalDecisions.slice(0, 3).map((cd, idx) => (
                    <li key={idx} className="text-sm">{cd}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Curto Prazo</p>
                <p className="text-lg font-semibold">R$ {(icp.strategicPlan.investmentSummary.shortTerm / 1000).toFixed(0)}k</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Médio Prazo</p>
                <p className="text-lg font-semibold">R$ {(icp.strategicPlan.investmentSummary.mediumTerm / 1000).toFixed(0)}k</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longo Prazo</p>
                <p className="text-lg font-semibold">R$ {(icp.strategicPlan.investmentSummary.longTerm / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 7: Análise CEO */}
      {icp.CEOAnalysis && icp.CEOAnalysis.recommendation && (
        <Card className="border-l-4 border-l-purple-600/90 shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-700 dark:text-purple-500" />
                <CardTitle className="text-purple-800 dark:text-purple-100 font-semibold">Análise CEO</CardTitle>
              </div>
              <Link to={`/central-icp/profile/${icp.profile.id}`}>
                <Button variant="ghost" size="sm">Ver completo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm whitespace-pre-wrap">{icp.CEOAnalysis.recommendation}</p>
            </div>
            {icp.CEOAnalysis.keyInsights.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Insights Chave</p>
                <ul className="list-disc list-inside space-y-1">
                  {icp.CEOAnalysis.keyInsights.map((insight, idx) => (
                    <li key={idx} className="text-sm">{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

