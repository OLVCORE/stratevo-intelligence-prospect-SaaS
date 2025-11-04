// 👔 ABA DECISORES & CONTATOS - PhantomBuster Integration
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Linkedin, Sparkles, Loader2, ExternalLink, Target, TrendingUp } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { performFullLinkedInAnalysis } from '@/services/phantomBusterEnhanced';
import type { LinkedInProfileData } from '@/services/phantomBusterEnhanced';

interface DecisorsContactsTabProps {
  companyId?: string;
  companyName?: string;
  linkedinUrl?: string;
  domain?: string;
  savedData?: any;
}

export function DecisorsContactsTab({ 
  companyId, 
  companyName, 
  linkedinUrl, 
  domain,
  savedData 
}: DecisorsContactsTabProps) {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<any>(savedData || null);

  // 🔥 Análise LinkedIn completa
  const linkedinMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa não disponível');
      
      return await performFullLinkedInAnalysis(companyName, linkedinUrl, domain);
    },
    onMutate: () => {
      toast({
        title: '🔍 Analisando LinkedIn...',
        description: 'Extraindo decisores, posts e dados da empresa',
      });
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      
      const emailsFound = data.decisorsWithEmails.filter(d => d.email).length;
      
      toast({
        title: '✅ Análise LinkedIn concluída!',
        description: `${data.decisors.length} decisores | ${emailsFound} emails | ${data.insights.length} insights`,
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Erro na análise LinkedIn',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  });

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para extração de decisores
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-purple-100">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Decisores & Contatos</h3>
              <p className="text-sm text-muted-foreground">
                Mapeamento de tomadores de decisão via PhantomBuster + LinkedIn
              </p>
            </div>
          </div>

          <Button
            onClick={() => linkedinMutation.mutate()}
            disabled={linkedinMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            {linkedinMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Extrair Decisores
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {linkedinMutation.isPending && (
        <Card className="p-12 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="font-medium mb-2">Analisando LinkedIn...</p>
          <p className="text-sm text-muted-foreground">
            Extraindo decisores, emails e dados da empresa (30-60s)
          </p>
        </Card>
      )}

      {/* Resultados */}
      {analysisData && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Decisores</span>
              </div>
              <div className="text-2xl font-bold">{analysisData.decisors.length}</div>
              <Badge variant="outline" className="text-xs mt-1">identificados</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Emails</span>
              </div>
              <div className="text-2xl font-bold">
                {analysisData.decisorsWithEmails.filter((d: any) => d.email).length}
              </div>
              <Badge variant="outline" className="text-xs mt-1">encontrados</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Taxa Sucesso</span>
              </div>
              <div className="text-2xl font-bold">
                {analysisData.decisors.length > 0
                  ? Math.round((analysisData.decisorsWithEmails.filter((d: any) => d.email).length / analysisData.decisors.length) * 100)
                  : 0}%
              </div>
              <Badge variant="outline" className="text-xs mt-1">emails/decisores</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Insights</span>
              </div>
              <div className="text-2xl font-bold">{analysisData.insights.length}</div>
              <Badge variant="outline" className="text-xs mt-1">gerados</Badge>
            </Card>
          </div>

          {/* Dados da Empresa LinkedIn */}
          {analysisData.companyData && (
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-blue-600" />
                Presença no LinkedIn
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Seguidores</span>
                  <p className="text-xl font-bold">{analysisData.companyData.followers?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Funcionários</span>
                  <p className="text-xl font-bold">{analysisData.companyData.employees?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Posts Recentes</span>
                  <p className="text-xl font-bold">{analysisData.companyData.recentPosts?.length || 0}</p>
                </div>
              </div>

              {/* Menções de concorrentes */}
              {analysisData.companyData.competitorMentions && analysisData.companyData.competitorMentions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-xs font-medium text-muted-foreground">Concorrentes Mencionados:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysisData.companyData.competitorMentions.map((comp: string, idx: number) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Lista de Decisores */}
          {analysisData.decisorsWithEmails.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Decisores Identificados
                <Badge variant="default" className="bg-purple-600">
                  {analysisData.decisorsWithEmails.length} pessoas
                </Badge>
              </h4>

              <div className="space-y-4">
                {analysisData.decisorsWithEmails.map((decisor: any, idx: number) => (
                  <div key={idx} className="border-2 border-purple-200 rounded-lg p-4 bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-lg">{decisor.name}</h5>
                        <p className="text-sm text-muted-foreground">{decisor.position}</p>
                      </div>
                      {decisor.email && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          ✉️ Email verificado
                        </Badge>
                      )}
                    </div>

                    {/* Contatos */}
                    <div className="space-y-2 mb-3">
                      {decisor.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <a href={`mailto:${decisor.email}`} className="text-primary hover:underline">
                            {decisor.email}
                          </a>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {decisor.confidence}% confiança
                          </Badge>
                        </div>
                      )}
                      
                      {decisor.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span>{decisor.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Approach Sugerido */}
                    <div className="bg-purple-50 rounded p-3 text-xs">
                      <p className="font-medium text-purple-900 mb-1">💡 Approach Sugerido:</p>
                      <ul className="space-y-1 text-purple-700">
                        {decisor.email && (
                          <li>• Email direto: Mencionar [{decisor.position}] e dores do setor</li>
                        )}
                        <li>• LinkedIn InMail: Personalizado com insights da empresa</li>
                        {decisor.phone && (
                          <li>• WhatsApp Business: Follow-up pós-email</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insights Estratégicos */}
          {analysisData.insights.length > 0 && (
            <Card className="p-6 bg-purple-50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Insights Estratégicos
              </h4>
              <ul className="space-y-2 text-sm">
                {analysisData.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* Estado vazio */}
      {!analysisData && !linkedinMutation.isPending && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">Extração de Decisores não executada</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Extrair Decisores" para mapear tomadores de decisão via PhantomBuster
          </p>
          {!linkedinUrl && (
            <Badge variant="secondary" className="text-xs">
              💡 Dica: LinkedIn URL melhora a precisão
            </Badge>
          )}
        </Card>
      )}
    </div>
  );
}

