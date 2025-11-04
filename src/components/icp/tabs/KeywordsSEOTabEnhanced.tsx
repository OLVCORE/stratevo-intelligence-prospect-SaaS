import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, ExternalLink, Globe, Target, BarChart3, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { performFullSEOAnalysis } from '@/services/seoAnalysis';
import type { KeywordData, SimilarCompanyBySEO } from '@/services/seoAnalysis';

interface KeywordsSEOTabProps {
  companyName?: string;
  domain?: string;
  savedData?: any;
}

export function KeywordsSEOTabEnhanced({ companyName, domain, savedData }: KeywordsSEOTabProps) {
  const { toast } = useToast();
  const [seoData, setSeoData] = useState<any>(savedData || null);

  // 🔥 Análise SEO completa
  const seoMutation = useMutation({
    mutationFn: async () => {
      if (!domain) throw new Error('Domain não disponível');
      
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return await performFullSEOAnalysis(cleanDomain, companyName || '');
    },
    onMutate: () => {
      toast({
        title: '🔍 Analisando SEO...',
        description: 'Extraindo keywords e buscando empresas similares',
      });
    },
    onSuccess: (data) => {
      setSeoData(data);
      toast({
        title: '✅ Análise SEO concluída!',
        description: `${data.profile.keywords.length} keywords | ${data.similarCompanies.length} empresas similares`,
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Erro na análise SEO',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  });

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de SEO
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Keywords & SEO Intelligence
                {savedData && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Histórico
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Análise de palavras-chave e empresas similares via SEO
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              onClick={() => seoMutation.mutate()}
              disabled={seoMutation.isPending || !domain}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {seoMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Análise SEO Completa
            </Button>

            {seoData && (
              <Button
                onClick={() => seoMutation.mutate()}
                variant="outline"
                size="sm"
                disabled={seoMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${seoMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Loader */}
      {seoMutation.isPending && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium mb-1">Analisando SEO...</p>
              <p className="text-sm text-muted-foreground">
                Extraindo keywords e buscando empresas similares
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 🔥 RESULTADO DA ANÁLISE SEO */}
      {seoData && (
        <>
          {/* Estatísticas gerais */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Keywords</span>
              </div>
              <div className="text-2xl font-bold mb-1">{seoData.profile.keywords.length}</div>
              <Badge variant="outline" className="text-xs">extraídas</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Empresas Similares</span>
              </div>
              <div className="text-2xl font-bold mb-1">{seoData.similarCompanies.length}</div>
              <Badge variant="outline" className="text-xs">encontradas</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Content Score</span>
              </div>
              <div className="text-2xl font-bold mb-1">{seoData.profile.contentScore}</div>
              <Badge 
                variant={seoData.profile.contentScore > 70 ? 'default' : 'secondary'} 
                className="text-xs"
              >
                /100
              </Badge>
            </Card>
          </div>

          {/* Profile SEO */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Perfil SEO de {companyName}</h4>
            </div>
            
            <div className="grid gap-4">
              {/* Meta Tags */}
              {seoData.profile.metaTags.title && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Title Tag:</span>
                  <p className="text-sm mt-1 font-medium">{seoData.profile.metaTags.title}</p>
                </div>
              )}
              
              {seoData.profile.metaTags.description && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Meta Description:</span>
                  <p className="text-sm mt-1">{seoData.profile.metaTags.description}</p>
                </div>
              )}
              
              {/* Top Headings */}
              {seoData.profile.topHeadings.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Top Headings:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {seoData.profile.topHeadings.slice(0, 5).map((heading: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {heading}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Top Keywords */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Top Keywords ({seoData.profile.keywords.length})
            </h4>
            <div className="space-y-2">
              {seoData.profile.keywords.slice(0, 20).map((kw: KeywordData, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">#{idx + 1}</span>
                    <span className="text-sm">{kw.keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {kw.source}
                    </Badge>
                    <Badge 
                      variant={kw.relevance > 80 ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {kw.relevance}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Empresas Similares por SEO */}
          {seoData.similarCompanies.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Empresas com Keywords Similares
                <Badge variant="outline">{seoData.similarCompanies.length} encontradas</Badge>
              </h4>
              
              <div className="space-y-3">
                {seoData.similarCompanies.slice(0, 15).map((company: SimilarCompanyBySEO, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{idx + 1}</span>
                        <span className="font-medium">{company.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={company.overlapScore > 70 ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          Overlap: {company.overlapScore}%
                        </Badge>
                        {company.ranking && (
                          <Badge variant="outline" className="text-xs">
                            Ranking: #{company.ranking}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                    >
                      {company.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <div className="flex flex-wrap gap-1">
                      {company.sharedKeywords.slice(0, 8).map((kw: string, kidx: number) => (
                        <Badge key={kidx} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                      {company.sharedKeywords.length > 8 && (
                        <Badge variant="secondary" className="text-xs">
                          +{company.sharedKeywords.length - 8} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insights dinâmicos */}
          <Card className="p-6 bg-primary/5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Insights Estratégicos
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Extraídas <strong>{seoData.profile.keywords.length} keywords únicas</strong> do website
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Encontradas <strong>{seoData.similarCompanies.length} empresas</strong> com keywords similares (overlap &gt;40%)
                </span>
              </li>
              {seoData.profile.contentScore > 70 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    ✅ Content Score <strong>excelente ({seoData.profile.contentScore}/100)</strong> - SEO bem otimizado
                  </span>
                </li>
              )}
              {seoData.similarCompanies.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    🎯 Top empresa similar: <strong>{seoData.similarCompanies[0].name}</strong> (overlap: {seoData.similarCompanies[0].overlapScore}%)
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  💡 Use essas empresas similares como <strong>leads qualificados</strong> para prospecção
                </span>
              </li>
            </ul>
          </Card>
        </>
      )}

      {/* Estado vazio */}
      {!seoData && !seoMutation.isPending && (
        <Card className="p-12 text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">Análise SEO não executada</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Análise SEO Completa" para extrair keywords e encontrar empresas similares
          </p>
          {!domain && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ Domain não disponível
            </Badge>
          )}
        </Card>
      )}
    </div>
  );
}

